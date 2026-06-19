window.PhpLabEditor = (() => {
  const data = window.PhpLabData;
  const debugAttemptStorageKey = "php-beginner-lab-debug-attempts-v1";
  let elements = {};

  const escapeHTML = (value = "") =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const loadStoredMap = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (error) {
      return {};
    }
  };

  const getActiveDebugChallenge = () => {
    const debugId = new URLSearchParams(window.location.search).get("debug");
    return data.debugChallenges.find((challenge) => challenge.id === debugId);
  };

  const getDebugEditorTarget = (code = "") => {
    const source = code.trim();
    if (/^<|<form|<\?=|<\?php\s+(if|foreach)|<\/[a-z]/i.test(source)) return "template";
    if (/^\$[A-Za-z_]\w*\s*=/.test(source) && !/echo|include|header|session_start|json_decode|\$_|\$pdo/i.test(source)) return "data";
    if (/body\s*\{|\.|#/.test(source) && !source.includes("<?php")) return "css";
    return "index";
  };

  const saveDebugDraft = (challenge, code) => {
    if (!challenge) return;
    const attempts = loadStoredMap(debugAttemptStorageKey);
    attempts[challenge.id] = {
      ...(attempts[challenge.id] || {}),
      code,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(debugAttemptStorageKey, JSON.stringify(attempts));
  };

  const unquote = (value) => value.trim().slice(1, -1).replace(/\\(["'\\])/g, "$1");

  const splitTopLevel = (source = "", separator = ",") => {
    const parts = [];
    let buffer = "";
    let depth = 0;
    let quote = null;

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      const previous = source[index - 1];

      if (quote) {
        buffer += char;
        if (char === quote && previous !== "\\") quote = null;
        continue;
      }

      if (char === "'" || char === '"') {
        quote = char;
        buffer += char;
        continue;
      }

      if (char === "[" || char === "(") depth += 1;
      if (char === "]" || char === ")") depth -= 1;

      if (char === separator && depth === 0) {
        if (buffer.trim()) parts.push(buffer.trim());
        buffer = "";
        continue;
      }

      buffer += char;
    }

    if (buffer.trim()) parts.push(buffer.trim());
    return parts;
  };

  const splitPair = (source = "") => {
    let depth = 0;
    let quote = null;

    for (let index = 0; index < source.length - 1; index += 1) {
      const char = source[index];
      const previous = source[index - 1];

      if (quote) {
        if (char === quote && previous !== "\\") quote = null;
        continue;
      }

      if (char === "'" || char === '"') {
        quote = char;
        continue;
      }

      if (char === "[" || char === "(") depth += 1;
      if (char === "]" || char === ")") depth -= 1;
      if (char === "=" && source[index + 1] === ">" && depth === 0) {
        return [source.slice(0, index).trim(), source.slice(index + 2).trim()];
      }
    }

    return null;
  };

  const parseValue = (rawValue = "", variables = {}) => {
    const value = rawValue.trim().replace(/,$/, "");
    if (!value) return "";
    if (/^['"]/.test(value) && /['"]$/.test(value)) return unquote(value);
    if (/^\$[A-Za-z_]\w*$/.test(value)) return variables[value.slice(1)] ?? "";
    if (/^(true|false)$/i.test(value)) return value.toLowerCase() === "true";
    if (/^null$/i.test(value)) return null;
    if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);

    if (value.startsWith("[") && value.endsWith("]")) {
      const inside = value.slice(1, -1).trim();
      if (!inside) return [];
      const items = splitTopLevel(inside);
      const pairs = items.map(splitPair);

      if (pairs.every(Boolean)) {
        return Object.fromEntries(
          pairs.map(([key, itemValue]) => [String(parseValue(key, variables)), parseValue(itemValue, variables)])
        );
      }

      return items.map((item) => parseValue(item, variables));
    }

    return value;
  };

  const parseAssignments = (source = "", initial = {}) => {
    const variables = { ...initial };
    const pattern =
      /\$([A-Za-z_]\w*)\s*=\s*(\[[\s\S]*?\]|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|-?\d+(?:\.\d+)?|true|false|null)\s*;/g;
    let match;

    while ((match = pattern.exec(source))) {
      variables[match[1]] = parseValue(match[2], variables);
    }

    return variables;
  };

  const resolvePath = (scope, expression = "") => {
    const keys = [];
    const cleaned = expression.trim().replace(/^\$/, "");
    const pattern = /([A-Za-z_]\w*)|\[\s*["']([^"']+)["']\s*\]|\[\s*(\d+)\s*\]/g;
    let match;

    while ((match = pattern.exec(cleaned))) {
      keys.push(match[1] ?? match[2] ?? Number(match[3]));
    }

    return keys.reduce((value, key) => {
      if (value == null) return "";
      return value[key] ?? "";
    }, scope);
  };

  const evaluateExpression = (expression = "", scope = {}) => {
    const source = expression.trim().replace(/;$/, "");

    if (/^htmlspecialchars\s*\(/.test(source)) {
      const inner = source.replace(/^htmlspecialchars\s*\(/, "").replace(/\)$/, "");
      return evaluateExpression(inner, scope);
    }

    const countMatch = source.match(/^count\s*\(\s*(\$[A-Za-z_]\w*)\s*\)$/);
    if (countMatch) {
      const value = resolvePath(scope, countMatch[1]);
      return Array.isArray(value) ? value.length : 0;
    }

    const concatParts = splitTopLevel(source, ".");
    if (concatParts.length > 1) {
      return concatParts.map((part) => evaluateExpression(part, scope)).join("");
    }

    if (/^['"]/.test(source) && /['"]$/.test(source)) return unquote(source);
    if (/^\$/.test(source)) return resolvePath(scope, source);
    if (/^-?\d+(?:\.\d+)?$/.test(source)) return Number(source);
    if (/^(true|false)$/i.test(source)) return source.toLowerCase() === "true" ? "true" : "false";
    return source;
  };

  const renderTemplate = (template = "", viewData = {}) => {
    const renderWithScope = (source, scope) => {
      let html = source;

      html = html.replace(/<\?php\s+if\s*\(\s*\$([A-Za-z_]\w*)\s*\)\s*:\s*\?>([\s\S]*?)<\?php\s+endif\s*;?\s*\?>/g, (_, key, body) =>
        scope[key] ? renderWithScope(body, scope) : ""
      );

      html = html.replace(
        /<\?php\s+foreach\s*\(\s*\$([A-Za-z_]\w*)\s+as\s+\$([A-Za-z_]\w*)\s*\)\s*:\s*\?>([\s\S]*?)<\?php\s+endforeach\s*;?\s*\?>/g,
        (_, collectionName, itemName, body) => {
          const collection = Array.isArray(scope[collectionName]) ? scope[collectionName] : [];
          return collection.map((item) => renderWithScope(body, { ...scope, [itemName]: item })).join("");
        }
      );

      html = html.replace(/<\?=\s*([\s\S]*?)\s*\?>/g, (_, expression) => escapeHTML(evaluateExpression(expression, scope)));
      html = html.replace(/<\?php\s+echo\s+([\s\S]*?)\s*;?\s*\?>/g, (_, expression) => escapeHTML(evaluateExpression(expression, scope)));
      html = html.replace(/<\?php[\s\S]*?\?>/g, "");

      return html;
    };

    return renderWithScope(template, viewData);
  };

  const buildPreview = (css, body) => {
    const safeCSS = css.replace(/<\/style/gi, "<\\/style");
    const safeBody = body.replace(/<\/script/gi, "<\\/script");

    return `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <style>
      ${safeCSS}
      .php-empty-output {
        color: #647089;
        font: 14px/1.6 Arial, sans-serif;
        padding: 18px;
      }
    </style>
  </head>
  <body>
    ${safeBody.trim() || '<p class="php-empty-output">Template selesai dirender, tetapi belum ada output HTML.</p>'}
  </body>
</html>`;
  };

  const runEditor = () => {
    const indexSource = elements.index.value;
    const dataSource = elements.data.value;
    const templateSource = elements.template.value;
    const css = elements.css.value;
    const warnings = [];

    if (!indexSource.includes("<?php")) warnings.push("index.php belum memakai tag <?php.");
    if (!dataSource.includes("<?php")) warnings.push("data.php belum memakai tag <?php.");
    if (!templateSource.includes("<?= ") && !templateSource.includes("<?php")) {
      warnings.push("template.php belum menampilkan variabel PHP.");
    }

    let variables = parseAssignments(dataSource);
    variables = parseAssignments(indexSource, variables);

    const rendered = renderTemplate(templateSource, variables);
    elements.frame.srcdoc = buildPreview(css, rendered);

    const variableNames = Object.keys(variables);
    const arrayNames = variableNames.filter((key) => Array.isArray(variables[key]));
    const summary = [
      `index.php memuat ${variableNames.length} variabel`,
      arrayNames.length ? `array: ${arrayNames.map((name) => `$${name}`).join(", ")}` : "belum ada array",
      "template.php dirender menjadi HTML",
      "style.css diterapkan ke preview"
    ];

    elements.console.textContent = warnings.length
      ? `Preview diperbarui dengan catatan:\n\n${warnings.map((warning) => `- ${warning}`).join("\n")}\n\nAlur terbaca:\n${summary.join(" -> ")}`
      : `Preview diperbarui. Alur PHP dasar terbaca:\n${summary.join(" -> ")}`;
  };

  const getEditorPayload = () => [
    ["index.php", elements.index.value],
    ["data.php", elements.data.value],
    ["template.php", elements.template.value],
    ["style.css", elements.css.value]
  ]
    .map(([filename, source]) => `/* ${filename} */\n${source}`)
    .join("\n\n");

  const resetEditor = () => {
    const activeDebug = getActiveDebugChallenge();
    const debugTarget = activeDebug ? getDebugEditorTarget(activeDebug.code) : null;
    const editorState = { ...data.editorDefaults };
    if (activeDebug && debugTarget) editorState[debugTarget] = activeDebug.code;

    elements.index.value = editorState.index;
    elements.data.value = editorState.data;
    elements.template.value = editorState.template;
    elements.css.value = editorState.css;
    if (activeDebug && debugTarget) saveDebugDraft(activeDebug, elements[debugTarget].value);
    runEditor();
    window.PhpLabApp?.showToast?.(activeDebug ? "Draft debugging direset." : "Editor dikembalikan ke contoh awal.");
  };

  const copyEditor = () => {
    navigator.clipboard
      .writeText(getEditorPayload())
      .then(() => window.PhpLabApp?.showToast?.("Kode editor berhasil disalin."))
      .catch(() => window.PhpLabApp?.showToast?.("Kode belum bisa disalin. Pilih kode secara manual."));
  };

  const insertTab = (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const input = event.currentTarget;
    const start = input.selectionStart;
    input.value = `${input.value.slice(0, start)}  ${input.value.slice(input.selectionEnd)}`;
    input.setSelectionRange(start + 2, start + 2);
  };

  const init = () => {
    if (!document.getElementById("routesEditor")) return;

    elements = {
      index: document.getElementById("routesEditor"),
      data: document.getElementById("controllerEditor"),
      template: document.getElementById("bladeEditor"),
      css: document.getElementById("cssEditor"),
      frame: document.getElementById("previewFrame"),
      console: document.getElementById("editorConsole")
    };

    elements.frame.setAttribute("sandbox", "allow-scripts");

    const activeDebug = getActiveDebugChallenge();
    const debugAttempt = activeDebug ? loadStoredMap(debugAttemptStorageKey)[activeDebug.id] || {} : {};
    const debugCode = debugAttempt.code || activeDebug?.code || "";
    const debugTarget = activeDebug ? getDebugEditorTarget(debugCode) : null;
    const editorState = { ...data.editorDefaults };
    if (activeDebug && debugTarget) editorState[debugTarget] = debugCode;

    elements.index.value = editorState.index;
    elements.data.value = editorState.data;
    elements.template.value = editorState.template;
    elements.css.value = editorState.css;

    if (activeDebug && debugTarget) {
      const head = elements[debugTarget].closest(".editor-shell")?.querySelector(".editor-head span");
      head?.insertAdjacentHTML("beforeend", ` <span class="editor-debug-badge">debug: ${escapeHTML(activeDebug.title)}</span>`);
      saveDebugDraft(activeDebug, elements[debugTarget].value);
    }

    [elements.index, elements.data, elements.template, elements.css].forEach((input) => {
      input.addEventListener("keydown", insertTab);
      if (activeDebug && debugTarget && input === elements[debugTarget]) {
        input.addEventListener("input", () => saveDebugDraft(activeDebug, input.value));
      }
    });

    document.getElementById("runEditor").addEventListener("click", runEditor);
    document.getElementById("copyEditor")?.addEventListener("click", copyEditor);
    document.getElementById("resetEditor")?.addEventListener("click", resetEditor);

    runEditor();
  };

  return {
    init,
    runEditor,
    copyEditor,
    resetEditor,
    parseAssignments,
    renderTemplate,
    escapeHTML
  };
})();
