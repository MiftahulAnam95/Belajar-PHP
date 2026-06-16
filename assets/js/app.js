window.PhpLabApp = (() => {
  const data = window.PhpLabData;
  const progress = window.PhpLabProgress;
  let currentQuiz = { index: 0, score: 0, answered: false };
  let activeRecallId = data.recallChallenges[0].id;
  let activeDebugId = data.debugChallenges[0].id;
  let activeLessonPhase = "all";
  const debugAttempts = {};
  const LESSON_RECALL_STORAGE_KEY = "php-beginner-lab-lesson-recall-v1";
  let toastInstance;
  let editorColorPicker;
  let editorTagSuggest;
  let editorUndoHistory;
  const getElement = (id) => document.getElementById(id);
  const rootPath = document.body.dataset.root || "";
  const lessonHref = (id) => `${rootPath}materi/${id}.html`;

  const escapeHTML = (value = "") =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const loadLessonRecallAnswers = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(LESSON_RECALL_STORAGE_KEY) || "{}");
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
      return Object.fromEntries(
        Object.entries(saved).filter(
          ([id, answer]) => data.lessons.some((lessonItem) => lessonItem.id === id) && typeof answer === "string"
        )
      );
    } catch (error) {
      console.warn("Jawaban recall materi tidak dapat dibaca.", error);
      return {};
    }
  };

  const lessonRecallAnswers = loadLessonRecallAnswers();

  const saveLessonRecallAnswers = () => {
    try {
      localStorage.setItem(LESSON_RECALL_STORAGE_KEY, JSON.stringify(lessonRecallAnswers));
      return true;
    } catch (error) {
      console.warn("Jawaban recall materi tidak dapat disimpan.", error);
      return false;
    }
  };

  const highlightTag = (tag) => {
    const parsed = tag.match(/^(<\/?)([a-zA-Z][\w-]*)([\s\S]*?)(\/?>)$/);
    if (!parsed) return escapeHTML(tag);
    const [, opening, name, attributeText, closing] = parsed;
    let highlightedAttributes = "";
    let cursor = 0;
    const attributePattern = /([^\s=]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)/g;
    let attributeMatch;

    while ((attributeMatch = attributePattern.exec(attributeText))) {
      highlightedAttributes += escapeHTML(attributeText.slice(cursor, attributeMatch.index));
      highlightedAttributes += `<span class="tok-attr">${escapeHTML(attributeMatch[1])}</span>`;
      highlightedAttributes += `<span class="tok-symbol">${escapeHTML(attributeMatch[2])}</span>`;
      highlightedAttributes += `<span class="tok-string">${escapeHTML(attributeMatch[3])}</span>`;
      cursor = attributePattern.lastIndex;
    }

    highlightedAttributes += escapeHTML(attributeText.slice(cursor));
    return `<span class="tok-symbol">${escapeHTML(opening)}</span><span class="tok-tag">${escapeHTML(name)}</span>${highlightedAttributes}<span class="tok-symbol">${escapeHTML(closing)}</span>`;
  };

  const highlightHTML = (code = "") => {
    const tokenPattern = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>/g;
    let output = "";
    let cursor = 0;
    let match;

    while ((match = tokenPattern.exec(code))) {
      output += `<span class="tok-text">${escapeHTML(code.slice(cursor, match.index))}</span>`;
      output += match[0].startsWith("<!--")
        ? `<span class="tok-comment">${escapeHTML(match[0])}</span>`
        : highlightTag(match[0]);
      cursor = tokenPattern.lastIndex;
    }

    output += `<span class="tok-text">${escapeHTML(code.slice(cursor))}</span>`;
    return output;
  };

  const highlightPHP = (code = "") => {
    const tokenPattern =
      /(\/\/.*$|#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(<\?php|\?>|\b(?:as|break|case|catch|class|const|continue|default|do|echo|else|elseif|false|final|finally|for|foreach|function|if|include|include_once|match|namespace|new|null|print|private|protected|public|require|require_once|return|static|throw|true|try|use|while)\b)|(\$[a-zA-Z_]\w*|\b\d+(?:\.\d+)?\b)|([{}()[\].,;:+\-*/=<>!&|?:]+)/g;
    let output = "";
    let cursor = 0;
    let match;

    while ((match = tokenPattern.exec(code))) {
      output += `<span class="tok-text">${escapeHTML(code.slice(cursor, match.index))}</span>`;
      if (match[1]) output += `<span class="tok-comment">${escapeHTML(match[1])}</span>`;
      if (match[2]) output += `<span class="tok-string">${escapeHTML(match[2])}</span>`;
      if (match[3]) output += `<span class="tok-tag">${escapeHTML(match[3])}</span>`;
      if (match[4]) output += `<span class="tok-attr">${escapeHTML(match[4])}</span>`;
      if (match[5]) output += `<span class="tok-symbol">${escapeHTML(match[5])}</span>`;
      cursor = tokenPattern.lastIndex;
    }

    output += `<span class="tok-text">${escapeHTML(code.slice(cursor))}</span>`;
    return output;
  };

  const getCodeIcon = (filename) => {
    if (filename === "terminal") return "bi-terminal";
    if (filename.includes("routes/")) return "bi-signpost-split";
    if (filename.includes("Controllers")) return "bi-diagram-3";
    if (filename.includes("Models")) return "bi-boxes";
    if (filename.includes("migrations")) return "bi-database";
    if (filename.endsWith(".blade.php")) return "bi-filetype-html";
    if (filename.endsWith(".php")) return "bi-filetype-php";
    if (filename.endsWith(".css")) return "bi-filetype-css";
    return "bi-filetype-html";
  };

  const renderCodeBlock = (code, filename = "index.php") => {
    const highlight = filename.endsWith(".php") && !filename.endsWith(".blade.php") ? highlightPHP : highlightHTML;
    const lines = String(code).split("\n").map((line) => highlight(line));
    const icon = getCodeIcon(filename);
    return `
      <div class="code-card">
        <div class="code-card-head">
          <span class="code-card-title"><i class="bi ${icon}"></i> ${escapeHTML(filename)}</span>
          <button class="copy-code" type="button" data-copy-code="${encodeURIComponent(code)}">
            <i class="bi bi-copy"></i> Salin kode
          </button>
        </div>
        <div class="code-lines">
          ${lines
            .map(
              (line, index) => `
                <div class="code-line">
                  <span class="line-no">${index + 1}</span>
                  <span class="line-code">${line || " "}</span>
                </div>`
            )
            .join("")}
        </div>
      </div>`;
  };

  const renderLessonCodePreview = (item) => {
    const previewOutput = escapeHTML(item.previewOutput || "Jalankan contoh ini pada project PHP lokal untuk melihat hasil aslinya.");
    const previewDocument = `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        color: #172033;
        font-family: Arial, sans-serif;
        line-height: 1.55;
        margin: 0;
        padding: 18px;
      }
      .output-label {
        color: #7c3aed;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .preview-console {
        background: #111827;
        border-radius: 10px;
        color: #dbeafe;
        font-family: monospace;
        font-size: 13px;
        margin-top: 10px;
        min-height: 90px;
        padding: 14px;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <div class="output-label">Output yang diharapkan</div>
    <pre class="preview-console">${previewOutput}</pre>
  </body>
</html>`;

    return `
      <div class="lesson-code-preview">
        <div class="lesson-preview-label"><i class="bi bi-eye"></i> Preview alur PHP</div>
        <iframe
          class="lesson-preview-frame"
          title="Preview contoh kode ${escapeHTML(item.title)}"
          sandbox="allow-scripts"
          loading="lazy"
          srcdoc="${escapeHTML(previewDocument)}"
        ></iframe>
      </div>`;
  };

  const showToast = (message) => {
    const toastElement = getElement("appToastElement");
    const toastMessage = getElement("toastMessage");
    if (!toastElement || !toastMessage || !window.bootstrap) return;
    toastMessage.textContent = message;
    toastInstance ||= bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 2800 });
    toastInstance.show();
  };

  const showBadgeToasts = (unlocked) => {
    if (!unlocked.length) return;
    showToast(`Badge baru: ${unlocked.join(", ")}`);
  };

  const getLessonPhases = () => [...new Set(data.lessons.map((item) => item.phase).filter(Boolean))];

  const renderLearnerProfiles = () => {
    const target = getElement("learnerProfileGrid");
    if (!target || !Array.isArray(data.learnerProfiles)) return;

    target.innerHTML = data.learnerProfiles
      .map(
        (profile) => `
          <article class="learner-card">
            <div class="learner-card-head">
              <span><i class="bi ${profile.icon}"></i></span>
              <strong>${escapeHTML(profile.label)}</strong>
            </div>
            <h3>${escapeHTML(profile.title)}</h3>
            <p>${escapeHTML(profile.description)}</p>
            <ul>
              ${profile.focus.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}
            </ul>
            <a class="btn btn-soft" href="${lessonHref(profile.startLesson)}">
              ${escapeHTML(profile.cta)} <i class="bi bi-arrow-right"></i>
            </a>
          </article>`
      )
      .join("");
  };

  const renderLearningFlow = () => {
    const target = getElement("learningFlowGrid");
    if (!target || !Array.isArray(data.learningFlow)) return;

    target.innerHTML = data.learningFlow
      .map(
        (step, index) => `
          <article class="flow-step">
            <span class="flow-number">${index + 1}</span>
            <i class="bi ${step.icon}"></i>
            <h3>${escapeHTML(step.title)}</h3>
            <p>${escapeHTML(step.description)}</p>
          </article>`
      )
      .join("");
  };

  const renderLessonPhaseFilter = () => {
    const target = getElement("lessonPhaseFilter");
    if (!target) return;
    const phases = getLessonPhases();

    target.innerHTML = `
      <button class="phase-filter-btn ${activeLessonPhase === "all" ? "active" : ""}" type="button" data-lesson-phase="all">
        Semua
      </button>
      ${phases
        .map(
          (phase) => `
            <button class="phase-filter-btn ${activeLessonPhase === phase ? "active" : ""}" type="button" data-lesson-phase="${escapeHTML(phase)}">
              ${escapeHTML(phase)}
            </button>`
        )
        .join("")}`;
  };

  const renderLearningPath = () => {
    const learningPathGrid = getElement("learningPathGrid");
    if (!learningPathGrid || !Array.isArray(data.learningPath)) return;
    learningPathGrid.innerHTML = data.learningPath
      .map(
        (level) => `
          <article class="learning-path-card">
            <span class="learning-path-icon"><i class="bi ${level.icon}"></i></span>
            <span class="mini-label">${escapeHTML(level.range)}</span>
            <h3>${escapeHTML(level.title)}</h3>
            <p>${escapeHTML(level.goal)}</p>
            <strong>${escapeHTML(level.outcome)}</strong>
            ${
              level.startLesson
                ? `<a class="learning-path-link" href="${lessonHref(level.startLesson)}">Mulai level ini <i class="bi bi-arrow-right"></i></a>`
                : ""
            }
          </article>`
      )
      .join("");
  };

  const renderLessons = () => {
    const lessonGrid = getElement("lessonGrid");
    if (!lessonGrid) return;
    const completed = progress.state.completedLessons;
    const filteredLessons =
      activeLessonPhase === "all" ? data.lessons : data.lessons.filter((item) => item.phase === activeLessonPhase);
    lessonGrid.innerHTML = filteredLessons
      .map(
        (item) => {
          const index = data.lessons.findIndex((lessonItem) => lessonItem.id === item.id);
          return `
          <a class="lesson-card text-start ${completed.includes(item.id) ? "completed" : ""}" href="${lessonHref(item.id)}">
            ${completed.includes(item.id) ? '<i class="bi bi-check-circle-fill complete-mark"></i>' : ""}
            <span class="lesson-icon"><i class="bi ${item.icon}"></i></span>
            <span class="lesson-number d-block mt-3">${escapeHTML(item.phase || "Materi")} &middot; Materi ${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHTML(item.title)}</h3>
            <p class="lesson-card-goal">${escapeHTML(item.outcome || item.goal)}</p>
            <span class="lesson-practice"><i class="bi bi-pencil-square"></i> ${escapeHTML(item.practiceNow || item.exercise)}</span>
            <span class="lesson-card-time"><i class="bi bi-clock"></i> ${escapeHTML(item.duration)}</span>
          </a>`;
        }
      )
      .join("");
    const roadmapCompleted = getElement("roadmapCompleted");
    if (roadmapCompleted) roadmapCompleted.textContent = `${completed.length}/${data.lessons.length}`;
    const lessonFilterCount = getElement("lessonFilterCount");
    if (lessonFilterCount) {
      lessonFilterCount.textContent =
        activeLessonPhase === "all"
          ? `${data.lessons.length} materi`
          : `${filteredLessons.length} materi di ${activeLessonPhase}`;
    }
  };

  const renderLessonQuiz = (item) => `
    <div class="quiz-options" data-lesson-quiz="${item.id}">
      ${item.quiz.options
        .map(
          (option, index) => `
            <button class="quiz-option" type="button" data-lesson-answer="${index}">
              ${escapeHTML(option)}
            </button>`
        )
        .join("")}
    </div>
    <div class="quiz-feedback d-none" data-lesson-feedback></div>`;

  const renderTutorialSections = (item) => {
    if (!Array.isArray(item.tutorialSections) || !item.tutorialSections.length) return "";

    return `
      <section class="detail-block">
        <h3><i class="bi bi-window-sidebar"></i> Tutorial lengkap dari nol sampai jadi</h3>
        <div class="tutorial-section-list">
          ${item.tutorialSections
            .map(
              (section, index) => `
                <article class="tutorial-section-card">
                  <div class="tutorial-section-head">
                    <span>${String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h4>${escapeHTML(section.title)}</h4>
                      ${section.description ? `<p>${escapeHTML(section.description)}</p>` : ""}
                    </div>
                  </div>
                  ${
                    Array.isArray(section.steps)
                      ? `<ol class="tutorial-step-list">${section.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol>`
                      : ""
                  }
                  ${
                    Array.isArray(section.files)
                      ? `<div class="tutorial-code-list">
                          ${section.files
                            .map(
                              (file) => `
                                <div>
                                  <div class="tutorial-file-note">
                                    <strong>${escapeHTML(file.filename)}</strong>
                                    ${file.note ? `<span>${escapeHTML(file.note)}</span>` : ""}
                                  </div>
                                  ${renderCodeBlock(file.code, file.filename)}
                                </div>`
                            )
                            .join("")}
                        </div>`
                      : ""
                  }
                  ${
                    Array.isArray(section.checklist)
                      ? `<div class="tutorial-checklist">
                          ${section.checklist.map((itemText) => `<div><i class="bi bi-check2-circle"></i><span>${escapeHTML(itemText)}</span></div>`).join("")}
                        </div>`
                      : ""
                  }
                </article>`
            )
            .join("")}
        </div>
      </section>`;
  };

  const renderLessonQuickStart = (item, lessonIndex) => `
    <section class="detail-block quick-start-block">
      <div class="quick-start-head">
        <span class="beginner-label"><i class="bi bi-stopwatch"></i> Ringkasan 3 menit</span>
        <strong>Materi ${String(lessonIndex + 1).padStart(2, "0")}</strong>
      </div>
      <div class="quick-start-grid">
        <article>
          <span>Kenapa belajar ini?</span>
          <p>${escapeHTML(item.problem)}</p>
        </article>
        <article>
          <span>Apa yang diketik?</span>
          <p>${escapeHTML(item.practiceNow || item.exercise)}</p>
        </article>
        <article>
          <span>Kapan boleh lanjut?</span>
          <p>${escapeHTML(item.checkpoint)}</p>
        </article>
      </div>
    </section>`;

  const renderLessonDetail = (id) => {
    const item = data.lessons.find((lessonItem) => lessonItem.id === id);
    const lessonDetail = getElement("lessonDetail");
    if (!item || !lessonDetail) return;
    progress.setLastLesson(id);
    const lessonIndex = data.lessons.findIndex((lessonItem) => lessonItem.id === id);
    const isCompleted = progress.state.completedLessons.includes(id);

    lessonDetail.innerHTML = `
      <article class="lesson-detail-card">
        <header class="lesson-detail-head">
          <div class="d-flex justify-content-between gap-3">
            <div>
              <span class="eyebrow">${escapeHTML(item.phase || "Materi")} &middot; Materi ${String(lessonIndex + 1).padStart(2, "0")} &middot; ${escapeHTML(item.duration)}</span>
              <h2 class="mt-2 mb-1">${escapeHTML(item.title)}</h2>
              <p class="mb-0">${escapeHTML(item.goal)}</p>
            </div>
            <button class="icon-btn flex-shrink-0" type="button" data-close-lesson aria-label="Tutup materi">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </header>
        <div class="lesson-detail-body">
          ${renderLessonQuickStart(item, lessonIndex)}
          <section class="detail-block beginner-start-block">
            <span class="beginner-label"><i class="bi bi-signpost-split"></i> Mulai dari sini</span>
            <h3 class="mt-2"><i class="bi bi-person-walking"></i> ${escapeHTML(item.phaseTitle || "Sebelum memulai materi ini")}</h3>
            <p>${escapeHTML(item.prerequisite)}</p>
            <div class="beginner-overview">
              <strong>Bahasa awam</strong>
              <p class="mb-0">${escapeHTML(item.overview)}</p>
            </div>
            <div class="beginner-overview">
              <strong>Setelah ini kamu bisa</strong>
              <p class="mb-0">${escapeHTML(item.kidGoal)}</p>
            </div>
            <div class="learning-goal-grid">
              <div>
                <strong>Praktik 10 menit</strong>
                <p>${escapeHTML(item.practiceNow || item.exercise)}</p>
              </div>
              <div>
                <strong>Nyambung ke project</strong>
                <p>${escapeHTML(item.projectThread || item.tinyProject)}</p>
              </div>
            </div>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-flag"></i> Tujuan belajar</h3>
            <p class="mb-0">${escapeHTML(item.goal)}</p>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-chat-square-heart"></i> Masalah sehari-hari</h3>
            <p class="mb-0">${escapeHTML(item.problem)}</p>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-lightbulb"></i> Analogi konsep</h3>
            <div class="analogy-box"><p class="mb-0">${escapeHTML(item.analogy)}</p></div>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-book"></i> Penjelasan sederhana</h3>
            <p class="mb-0">${escapeHTML(item.explanation)}</p>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-list-check"></i> Ikuti langkah demi langkah</h3>
            <ol class="beginner-steps">
              ${item.steps.map((step) => `<li><span>${escapeHTML(step)}</span></li>`).join("")}
            </ol>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-tools"></i> Bagian project kecil</h3>
            <div class="practice-box"><p class="mb-0">${escapeHTML(item.tinyProject)}</p></div>
          </section>
          ${renderTutorialSections(item)}
          <section class="detail-block">
            <h3><i class="bi bi-translate"></i> Istilah penting untuk pemula</h3>
            <div class="term-grid">
              ${item.terms
                .map(
                  ({ term, meaning }) => `
                    <article class="term-card">
                      <strong>${escapeHTML(term)}</strong>
                      <p>${escapeHTML(meaning)}</p>
                    </article>`
                )
                .join("")}
            </div>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-code-square"></i> Contoh kode PHP</h3>
            ${renderCodeBlock(item.code, item.filename || "index.php")}
            ${renderLessonCodePreview(item)}
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-list-ol"></i> Penjelasan kode per baris</h3>
            <div class="line-notes">
              ${item.lineNotes.map((note, index) => `<div class="line-note"><strong>${index + 1}.</strong> ${escapeHTML(note)}</div>`).join("")}
            </div>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-pencil-square"></i> Latihan kecil</h3>
            <div class="practice-box"><p class="mb-0">${escapeHTML(item.exercise)}</p></div>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-exclamation-triangle"></i> Kesalahan yang wajar terjadi</h3>
            <div class="common-mistakes">
              ${item.commonMistakes
                .map((mistake) => `<div><i class="bi bi-x-circle"></i><span>${escapeHTML(mistake)}</span></div>`)
                .join("")}
            </div>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-check2-square"></i> Cek sebelum lanjut</h3>
            <div class="checkpoint-box"><p class="mb-0">${escapeHTML(item.checkpoint)}</p></div>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-cloud-arrow-up"></i> Catatan siap deploy</h3>
            <div class="deploy-note-box"><p class="mb-0">${escapeHTML(item.deployNote)}</p></div>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-arrow-repeat"></i> Recall challenge</h3>
            <p>${escapeHTML(item.recall)}</p>
            <form data-lesson-recall-form="${item.id}">
              <label class="debug-field-label" for="lessonRecallAnswer">Tulis jawabanmu dengan bahasa sendiri.</label>
              <textarea
                class="recall-input"
                id="lessonRecallAnswer"
                name="answer"
                placeholder="Tulis jawaban recall di sini..."
                required
              >${escapeHTML(lessonRecallAnswers[item.id] || "")}</textarea>
              <button class="btn btn-soft mt-3" type="submit"><i class="bi bi-floppy"></i> Simpan jawaban</button>
            </form>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-bug"></i> Concept debugging</h3>
            <p><strong>Pertanyaan:</strong> ${escapeHTML(item.debug.question)}</p>
            <button class="btn btn-soft me-2" type="button" data-toggle-target="lessonHint">Lihat hint</button>
            <button class="btn btn-soft" type="button" data-toggle-target="lessonDebugSolution">Lihat pembahasan</button>
            <div class="hint-box mt-3 d-none" id="lessonHint"><p class="mb-0">${escapeHTML(item.debug.hint)}</p></div>
            <div class="explanation-box mt-3 d-none" id="lessonDebugSolution"><p class="mb-0">${escapeHTML(item.debug.solution)}</p></div>
          </section>
          <section class="detail-block">
            <h3><i class="bi bi-patch-question"></i> Quiz singkat</h3>
            <p>${escapeHTML(item.quiz.question)}</p>
            ${renderLessonQuiz(item)}
          </section>
          <section class="detail-block">
            <div class="lesson-actions">
              <button class="btn btn-primary" type="button" data-complete-lesson="${item.id}">
                <i class="bi bi-check2-circle"></i> ${isCompleted ? "Sudah selesai" : "Tandai Selesai"}
              </button>
              <a class="btn btn-soft" href="${rootPath}editor.html" target="_blank" rel="noopener noreferrer"><i class="bi bi-code-slash"></i> Praktikkan di editor</a>
            </div>
            ${isCompleted ? getNextLearningPanel(item.id) : '<div id="nextLearningPanel"></div>'}
          </section>
        </div>
      </article>`;

    getElement("lessonDetailSection")?.classList.remove("d-none");
  };

  const getNextLearningPanel = (id) => {
    const lessonIndex = data.lessons.findIndex((item) => item.id === id);
    const nextLesson = data.lessons[lessonIndex + 1];
    return `
      <div class="next-learning-panel" id="nextLearningPanel">
        <p><strong>Bagus!</strong> Kamu sudah menyelesaikan materi ini. ${
          nextLesson
            ? `Langkah berikutnya: ${escapeHTML(nextLesson.title)} agar kamu bisa ${escapeHTML(nextLesson.outcome || nextLesson.goal).toLowerCase()}`
            : "Sekarang waktunya merakit mini project dan mengecek kesiapan deploy."
        }</p>
        <a class="btn btn-soft" href="${rootPath}materi.html#materi"><i class="bi bi-grid"></i> Kembali ke Daftar Materi</a>
        ${
          nextLesson
            ? `<a class="btn btn-primary" href="${lessonHref(nextLesson.id)}">Lanjut ke Materi Berikutnya <i class="bi bi-arrow-right"></i></a>`
            : `<a class="btn btn-primary" href="${rootPath}projects.html">Rakit Mini Project <i class="bi bi-arrow-right"></i></a><a class="btn btn-soft" href="${rootPath}deploy.html"><i class="bi bi-cloud-arrow-up"></i> Checklist Deploy</a>`
        }
      </div>`;
  };

  const showNextLearningPanel = (id) => {
    const target = getElement("nextLearningPanel");
    if (target) target.outerHTML = getNextLearningPanel(id);
  };

  const openLesson = (id, shouldScroll = true) => {
    renderLessonDetail(id);
    if (shouldScroll) getElement("lessonDetailSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const closeLesson = () => {
    if (document.body.dataset.lessonPage === "true") {
      window.location.href = `${rootPath}materi.html#materi`;
      return;
    }
    getElement("lessonDetailSection")?.classList.add("d-none");
    getElement("materi")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderQuiz = () => {
    const container = getElement("quizContainer");
    if (!container) return;
    if (currentQuiz.index >= data.quizQuestions.length) {
      const percentage = Math.round((currentQuiz.score / data.quizQuestions.length) * 100);
      progress.saveQuizScore(percentage);
      updateProgress();
      container.innerHTML = `
        <div class="quiz-card">
          <div class="quiz-body text-center py-5">
            <span class="feature-icon violet mb-3"><i class="bi bi-award"></i></span>
            <h3>Quiz selesai</h3>
            <p>Skor kamu <strong>${percentage}</strong> dari 100. ${percentage >= 70 ? "Dasarmu sudah mulai kuat." : "Ulangi pelan-pelan setelah membaca materi lagi."}</p>
            <button class="btn btn-primary" type="button" data-retry-quiz><i class="bi bi-arrow-counterclockwise"></i> Ulangi quiz</button>
          </div>
        </div>`;
      showToast(`Quiz selesai. Skor kamu ${percentage}/100.`);
      return;
    }

    const item = data.quizQuestions[currentQuiz.index];
    const currentNumber = currentQuiz.index + 1;
    container.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-progress">
          <div class="d-flex justify-content-between gap-3 mb-2">
            <span class="mini-label">Pertanyaan ${currentNumber} dari ${data.quizQuestions.length}</span>
            <span class="mini-label">Skor benar ${currentQuiz.score}</span>
          </div>
          <div class="progress" role="progressbar" aria-label="Progress quiz" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar" style="width: ${(currentQuiz.index / data.quizQuestions.length) * 100}%"></div>
          </div>
        </div>
        <div class="quiz-body">
          <h3 class="quiz-question">${escapeHTML(item.question)}</h3>
          <div class="quiz-options">
            ${item.options
              .map((option, index) => `<button class="quiz-option" type="button" data-quiz-answer="${index}">${escapeHTML(option)}</button>`)
              .join("")}
          </div>
          <div class="quiz-feedback d-none" id="quizFeedback"></div>
        </div>
      </div>`;
  };

  const answerQuiz = (selectedIndex) => {
    if (currentQuiz.answered) return;
    currentQuiz.answered = true;
    const item = data.quizQuestions[currentQuiz.index];
    const buttons = document.querySelectorAll("[data-quiz-answer]");
    buttons.forEach((button, index) => {
      button.disabled = true;
      if (index === item.answer) button.classList.add("correct");
      if (index === selectedIndex && selectedIndex !== item.answer) button.classList.add("wrong");
    });
    if (selectedIndex === item.answer) currentQuiz.score += 1;
    const feedback = document.getElementById("quizFeedback");
    feedback.classList.remove("d-none");
    feedback.innerHTML = `
      <strong>${selectedIndex === item.answer ? "Benar." : "Belum tepat."}</strong>
      ${escapeHTML(item.explanation)}
      <button class="btn btn-primary d-block mt-3" type="button" data-next-quiz>
        ${currentQuiz.index === data.quizQuestions.length - 1 ? "Lihat skor akhir" : "Pertanyaan berikutnya"} <i class="bi bi-arrow-right"></i>
      </button>`;
  };

  const renderRecallChallenge = (id = activeRecallId) => {
    const recallList = getElement("recallList");
    const recallDetail = getElement("recallDetail");
    if (!recallList || !recallDetail) return;
    activeRecallId = id;
    const item = data.recallChallenges.find((challenge) => challenge.id === id);
    const completed = progress.state.completedRecall;
    recallList.innerHTML = data.recallChallenges
      .map(
        (challenge, index) => `
          <button class="challenge-list-btn ${challenge.id === id ? "active" : ""} ${completed.includes(challenge.id) ? "completed" : ""}" type="button" data-open-recall="${challenge.id}">
            <i class="bi ${completed.includes(challenge.id) ? "bi-check-circle-fill" : "bi-circle"}"></i>
            <span>${index + 1}. ${escapeHTML(challenge.type)}</span>
          </button>`
      )
      .join("");
    recallDetail.innerHTML = `
      <span class="eyebrow">${escapeHTML(item.type)}</span>
      <h3 class="mt-2">${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.prompt)}</p>
      <textarea class="recall-input" placeholder="Tulis jawabanmu dengan bahasa sendiri..." aria-label="Jawaban recall challenge"></textarea>
      <div class="d-flex flex-wrap gap-2 mt-3">
        <button class="btn btn-soft" type="button" data-show-recall-answer="${item.id}"><i class="bi bi-eye"></i> Lihat pembahasan</button>
        <button class="btn btn-primary" type="button" data-complete-recall="${item.id}"><i class="bi bi-check2-circle"></i> Tandai recall selesai</button>
      </div>
      <div class="recall-answer d-none" id="recallAnswer">
        <div class="explanation-box"><p class="mb-0"><strong>Contoh jawaban:</strong> ${escapeHTML(item.answer)}</p></div>
      </div>`;
  };

  const renderDebuggingChallenge = (id = activeDebugId) => {
    const debugList = getElement("debugList");
    const debugDetail = getElement("debugDetail");
    if (!debugList || !debugDetail) return;
    activeDebugId = id;
    const item = data.debugChallenges.find((challenge) => challenge.id === id);
    const activeIndex = data.debugChallenges.findIndex((challenge) => challenge.id === id);
    const previousItem = data.debugChallenges[activeIndex - 1];
    const nextItem = data.debugChallenges[activeIndex + 1];
    const completed = progress.state.completedDebug;
    const attempt = debugAttempts[item.id] || { analysis: "", code: item.code, submitted: false };
    debugAttempts[item.id] = attempt;
    debugList.innerHTML = data.debugChallenges
      .map(
        (challenge, index) => `
          <button class="challenge-list-btn ${challenge.id === id ? "active" : ""} ${completed.includes(challenge.id) ? "completed" : ""}" type="button" data-open-debug="${challenge.id}">
            <i class="bi ${completed.includes(challenge.id) ? "bi-check-circle-fill" : "bi-circle"}"></i>
            <span>${index + 1}. ${escapeHTML(challenge.title)}</span>
          </button>`
      )
      .join("");
    debugDetail.innerHTML = `
      <span class="eyebrow">Kasus debugging</span>
      <h3 class="mt-2">${escapeHTML(item.title)}</h3>
      <p><strong>Masalah yang terlihat:</strong> ${escapeHTML(item.symptom)}</p>
      ${renderCodeBlock(item.code, "kode-bermasalah.php")}
      <p class="mt-3"><strong>Pertanyaan:</strong> ${escapeHTML(item.question)}</p>
      <form class="debug-workflow" data-debug-form="${item.id}">
        <div class="debug-step">
          <span class="debug-step-label">Langkah 1 - Analisis</span>
          <label class="debug-field-label" for="debugAnalysis">Menurutmu, bug berada di mana dan apa penyebabnya?</label>
          <textarea class="recall-input" id="debugAnalysis" name="analysis" placeholder="Contoh: titik koma hilang, key tidak cocok, atau input belum divalidasi..." required>${escapeHTML(attempt.analysis)}</textarea>
        </div>
        <div class="debug-step">
          <span class="debug-step-label">Langkah 2 - Coba perbaiki</span>
          <label class="debug-field-label" for="debugCode">Edit kode berikut berdasarkan analisismu.</label>
          <textarea class="debug-code-input" id="debugCode" name="code" aria-label="Percobaan perbaikan kode" spellcheck="false" required>${escapeHTML(attempt.code)}</textarea>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-soft" type="button" data-show-debug-hint="${item.id}"><i class="bi bi-lightbulb"></i> Hint</button>
          <button class="btn btn-primary" type="submit"><i class="bi bi-send-check"></i> ${attempt.submitted ? "Kirim ulang jawaban" : "Submit jawaban"}</button>
        </div>
      </form>
      <div class="debug-answer d-none" id="debugHint">
        <div class="hint-box"><p class="mb-0"><strong>Hint:</strong> ${escapeHTML(item.hint)}</p></div>
      </div>
      <div class="debug-answer ${attempt.submitted ? "" : "d-none"}" id="debugAnswer">
        <div class="explanation-box">
          <h4><i class="bi bi-book"></i> Pembahasan</h4>
          <p><strong>Analisis yang kamu kirim:</strong> ${escapeHTML(attempt.analysis)}</p>
          <ol>${item.explanation.map((point) => `<li>${escapeHTML(point)}</li>`).join("")}</ol>
          <p class="mb-2"><strong>Solusi kode:</strong></p>
          ${renderCodeBlock(item.solution, "solusi.php")}
          <button class="btn btn-primary mt-3" type="button" data-complete-debug="${item.id}" ${completed.includes(item.id) ? "disabled" : ""}>
            <i class="bi bi-check2-circle"></i> ${completed.includes(item.id) ? "Sudah selesai" : "Tandai selesai"}
          </button>
        </div>
      </div>
      <div class="debug-navigation">
        <button class="btn btn-soft" type="button" ${previousItem ? `data-open-debug="${previousItem.id}"` : "disabled"}>
          <i class="bi bi-arrow-left"></i> Kembali
        </button>
        <span class="mini-label">Kasus ${activeIndex + 1} dari ${data.debugChallenges.length}</span>
        <button class="btn btn-soft" type="button" ${nextItem ? `data-open-debug="${nextItem.id}"` : "disabled"}>
          Berikutnya <i class="bi bi-arrow-right"></i>
        </button>
      </div>`;
  };

  const renderProjectExample = (example, projectIndex = null, projectTitle = "") => {
    if (!example) return "";

    const isInteractive = Number.isInteger(projectIndex);
    const previewAttributes = isInteractive
      ? ` role="button" tabindex="0" data-open-project-preview="${projectIndex}" aria-label="Perbesar contoh ${escapeHTML(projectTitle)}"`
      : "";
    let content = "";
    if (example.type === "profile") {
      content = `
        <div class="example-profile">
          <span class="example-avatar">${escapeHTML(example.name.charAt(0))}</span>
          <strong>${escapeHTML(example.name)}</strong>
          <small>${escapeHTML(example.role)}</small>
          <p>${escapeHTML(example.description)}</p>
          <div class="example-chip-row">
            ${example.hobbies.map((hobby) => `<span>${escapeHTML(hobby)}</span>`).join("")}
          </div>
          <span class="example-text-link">${escapeHTML(example.link)} <i class="bi bi-arrow-right"></i></span>
        </div>`;
    }

    if (example.type === "landing") {
      content = `
        <div class="example-landing">
          <div class="example-mini-nav">
            <strong>${escapeHTML(example.brand)}</strong>
            <span>Beranda</span>
            <span>Tentang</span>
          </div>
          <div class="example-landing-body">
            <small>KELAS ONLINE UNTUK PEMULA</small>
            <strong>${escapeHTML(example.headline)}</strong>
            <p>${escapeHTML(example.description)}</p>
            <span class="example-button">${escapeHTML(example.cta)}</span>
          </div>
        </div>`;
    }

    if (example.type === "form") {
      content = `
        <div class="example-form">
          <strong>${escapeHTML(example.title)}</strong>
          <small>Lengkapi data diri kamu di bawah ini.</small>
          ${example.fields
            .map(
              (field) => `
                <label>
                  <span>${escapeHTML(field)}</span>
                  <i></i>
                </label>`
            )
            .join("")}
          <span class="example-button">${escapeHTML(example.button)}</span>
        </div>`;
    }

    if (example.type === "table") {
      content = `
        <div class="example-table">
          <strong>${escapeHTML(example.title)}</strong>
          <table>
            <thead>
              <tr>${example.columns.map((column) => `<th>${escapeHTML(column)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${example.rows
                .map((row) => `<tr>${row.map((cell) => `<td>${escapeHTML(cell)}</td>`).join("")}</tr>`)
                .join("")}
            </tbody>
          </table>
        </div>`;
    }

    if (example.type === "article") {
      content = `
        <div class="example-article">
          <div class="example-article-head">
            <strong>${escapeHTML(example.brand)}</strong>
            <span>${example.nav.map((item) => escapeHTML(item)).join(" &nbsp; ")}</span>
          </div>
          <small>PRODUKTIVITAS</small>
          <strong>${escapeHTML(example.title)}</strong>
          <p>${escapeHTML(example.description)}</p>
          <span class="example-related">${escapeHTML(example.related)}</span>
          <footer>Ditulis untuk teman belajar PHP</footer>
        </div>`;
    }

    if (example.type === "product") {
      content = `
        <div class="example-product">
          <div class="example-product-media"><span>${escapeHTML(example.icon)}</span></div>
          <small>${escapeHTML(example.category)}</small>
          <strong>${escapeHTML(example.name)}</strong>
          <p>${escapeHTML(example.description)}</p>
          <div class="example-product-row">
            <span>${escapeHTML(example.tag)}</span>
            <b>${escapeHTML(example.price)}</b>
          </div>
          <span class="example-button">${escapeHTML(example.cta)}</span>
        </div>`;
    }

    if (example.type === "dashboard") {
      const progressValue = Math.max(0, Math.min(100, Number(example.progress) || 0));
      content = `
        <div class="example-dashboard">
          <div class="example-dashboard-head">
            <span>
              <small>${escapeHTML(example.subtitle)}</small>
              <strong>${escapeHTML(example.title)}</strong>
            </span>
            <i>${progressValue}%</i>
          </div>
          <div class="example-dashboard-stats">
            ${example.stats.map((stat) => `<span><b>${escapeHTML(stat.value)}</b>${escapeHTML(stat.label)}</span>`).join("")}
          </div>
          <div class="example-progress-line"><span style="width: ${progressValue}%"></span></div>
          <ul>${example.tasks.map((task) => `<li>${escapeHTML(task)}</li>`).join("")}</ul>
        </div>`;
    }

    if (example.type === "gallery") {
      content = `
        <div class="example-gallery">
          <strong>${escapeHTML(example.title)}</strong>
          <p>${escapeHTML(example.description)}</p>
          <div>
            ${example.items
              .map(
                (item, index) => `
                  <span class="example-gallery-item tone-${(index % 4) + 1}">
                    <b>${escapeHTML(item.title)}</b>
                    <small>${escapeHTML(item.label)}</small>
                  </span>`
              )
              .join("")}
          </div>
        </div>`;
    }

    if (example.type === "schedule") {
      content = `
        <div class="example-schedule">
          <strong>${escapeHTML(example.title)}</strong>
          ${example.rows
            .map(
              (row) => `
                <div class="example-schedule-row">
                  <span>${escapeHTML(row.day)}</span>
                  <b>${escapeHTML(row.topic)}</b>
                  <small>${escapeHTML(row.time)}</small>
                </div>`
            )
            .join("")}
        </div>`;
    }

    if (example.type === "checklist") {
      content = `
        <div class="example-checklist">
          <strong>${escapeHTML(example.title)}</strong>
          <p>${escapeHTML(example.description)}</p>
          ${example.items.map((item) => `<label><i class="bi bi-check2"></i><span>${escapeHTML(item)}</span></label>`).join("")}
          <span class="example-button">${escapeHTML(example.cta)}</span>
        </div>`;
    }

    if (example.type === "notice") {
      content = `
        <div class="example-notice">
          <span class="example-notice-badge">${escapeHTML(example.badge)}</span>
          <strong>${escapeHTML(example.title)}</strong>
          <p>${escapeHTML(example.message)}</p>
          <span class="example-button">${escapeHTML(example.action)}</span>
        </div>`;
    }

    return `
      <div class="project-example">
        <div class="project-example-label"><i class="bi bi-eye"></i> Contoh yang ditiru</div>
        <div class="project-example-window"${previewAttributes}>
          <div class="project-example-toolbar"><span></span><span></span><span></span></div>
          <div class="project-example-canvas">${content}</div>
        </div>
        ${
          isInteractive
            ? `<button class="project-example-open" type="button" data-open-project-preview="${projectIndex}">
                <i class="bi bi-arrows-fullscreen"></i> Perbesar contoh
              </button>`
            : ""
        }
      </div>`;
  };

  const openProjectPreview = (projectIndex) => {
    const project = data.projects[Number(projectIndex)];
    const modalElement = getElement("projectPreviewModal");
    const title = getElement("projectPreviewTitle");
    const description = getElement("projectPreviewDescription");
    const previewBody = getElement("projectPreviewBody");
    if (!project || !modalElement || !title || !description || !previewBody || !window.bootstrap) return;

    title.textContent = project.title;
    description.textContent = `${project.level} - ${project.goal}`;
    previewBody.innerHTML = renderProjectExample(project.example);
    bootstrap.Modal.getOrCreateInstance(modalElement).show();
  };

  const renderProjects = () => {
    const projectGrid = getElement("projectGrid");
    if (!projectGrid) return;
    projectGrid.innerHTML = data.projects
      .map(
        (project, index) => `
          <div class="col-md-6 col-lg-4">
            <article class="project-card">
              <span class="mini-label">Project ${String(index + 1).padStart(2, "0")} &middot; ${escapeHTML(project.level)}</span>
              <h3>${escapeHTML(project.title)}</h3>
              <p>${escapeHTML(project.goal)}</p>
              ${renderProjectExample(project.example, index, project.title)}
              <details class="project-meta">
                <summary>Lihat panduan project</summary>
                <p class="mt-3 mb-1"><strong>Fitur:</strong> ${escapeHTML(project.features.join(", "))}</p>
                <ol class="ps-3">${project.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol>
                <p class="mb-1"><strong>Hint:</strong> ${escapeHTML(project.hint)}</p>
                <p class="mb-0"><strong>Challenge tambahan:</strong> ${escapeHTML(project.extra)}</p>
                <div class="project-deploy-check">
                  <strong>Checklist siap deploy:</strong>
                  <ul>
                    <li>Berjalan di localhost tanpa error.</li>
                    <li>Input pengguna divalidasi sebelum diproses.</li>
                    <li>Output dari pengguna ditampilkan dengan aman.</li>
                    <li>File konfigurasi dan folder data mudah ditemukan.</li>
                  </ul>
                </div>
              </details>
            </article>
          </div>`
      )
      .join("");
  };

  const updateProgress = () => {
    const state = progress.state;
    const percentage = progress.getTotalProgress();
    const nextLesson = data.lessons.find((lessonItem) => !state.completedLessons.includes(lessonItem.id));
    const progressPercent = getElement("progressPercent");
    const mainProgressBar = getElement("mainProgressBar");
    const statLessons = getElement("statLessons");
    const statQuiz = getElement("statQuiz");
    const statRecall = getElement("statRecall");
    const statDebug = getElement("statDebug");
    const nextRecommendation = getElement("nextRecommendation");
    const badgeGrid = getElement("badgeGrid");
    const roadmapCompleted = getElement("roadmapCompleted");

    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    if (mainProgressBar) {
      mainProgressBar.style.width = `${percentage}%`;
      mainProgressBar.parentElement.setAttribute("aria-valuenow", percentage);
    }
    if (statLessons) statLessons.textContent = state.completedLessons.length;
    if (statQuiz) statQuiz.textContent = progress.getAverageQuiz();
    if (statRecall) statRecall.textContent = state.completedRecall.length;
    if (statDebug) statDebug.textContent = state.completedDebug.length;
    if (nextRecommendation) {
      nextRecommendation.innerHTML = nextLesson
        ? `<i class="bi bi-compass"></i> Rekomendasi berikutnya: <a href="${lessonHref(nextLesson.id)}"><strong>${escapeHTML(nextLesson.title)}</strong></a>`
        : `<i class="bi bi-check-circle"></i> Semua materi utama sudah selesai. Lanjutkan <a href="${rootPath}projects.html"><strong>Mini Project</strong></a>, lalu cek <a href="${rootPath}deploy.html"><strong>Deploy</strong></a>.`;
    }
    if (badgeGrid) {
      badgeGrid.innerHTML = data.badges
        .map(
          (badge) => `
            <div class="badge-item ${state.badges.includes(badge.id) ? "" : "locked"}">
              <i class="bi ${badge.icon}"></i>
              <span>${escapeHTML(badge.title)}</span>
            </div>`
        )
        .join("");
    }
    if (roadmapCompleted) roadmapCompleted.textContent = `${state.completedLessons.length}/${data.lessons.length}`;
  };

  const toggleDarkMode = () => {
    const enabled = !document.body.classList.contains("dark-mode");
    document.body.classList.toggle("dark-mode", enabled);
    progress.setDarkMode(enabled);
    updateThemeToggle();
  };

  const updateThemeToggle = () => {
    const button = getElement("darkModeToggle");
    if (!button) return;
    const dark = document.body.classList.contains("dark-mode");
    button.innerHTML = dark ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
    button.setAttribute("aria-label", dark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
  };

  const runPhpEditorPreview = () => {
    window.PhpLabEditor?.runEditor?.();
  };

  const initEditorUndoHistory = (inputs, onChange) => {
    const maxHistory = 140;
    const histories = new Map();

    const snapshot = (input) => ({
      value: input.value,
      selectionStart: input.selectionStart,
      selectionEnd: input.selectionEnd,
      scrollLeft: input.scrollLeft,
      scrollTop: input.scrollTop
    });

    const sameSnapshot = (first, second) =>
      first &&
      second &&
      first.value === second.value &&
      first.selectionStart === second.selectionStart &&
      first.selectionEnd === second.selectionEnd &&
      first.scrollLeft === second.scrollLeft &&
      first.scrollTop === second.scrollTop;

    const ensureHistory = (input) => {
      if (!histories.has(input)) {
        histories.set(input, { index: 0, restoring: false, stack: [snapshot(input)] });
      }
      return histories.get(input);
    };

    const record = (input) => {
      const history = ensureHistory(input);
      if (history.restoring) return;
      const next = snapshot(input);
      if (sameSnapshot(history.stack[history.index], next)) return;
      history.stack = history.stack.slice(0, history.index + 1);
      history.stack.push(next);
      if (history.stack.length > maxHistory) history.stack.shift();
      history.index = history.stack.length - 1;
    };

    const restore = (input, next) => {
      const history = ensureHistory(input);
      history.restoring = true;
      input.value = next.value;
      input.setSelectionRange(next.selectionStart, next.selectionEnd);
      input.scrollLeft = next.scrollLeft;
      input.scrollTop = next.scrollTop;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      history.restoring = false;
      onChange();
    };

    const undo = (input) => {
      const history = ensureHistory(input);
      if (history.index <= 0) return false;
      history.index -= 1;
      restore(input, history.stack[history.index]);
      return true;
    };

    const redo = (input) => {
      const history = ensureHistory(input);
      if (history.index >= history.stack.length - 1) return false;
      history.index += 1;
      restore(input, history.stack[history.index]);
      return true;
    };

    const reset = () => {
      inputs.forEach((input) => {
        histories.set(input, { index: 0, restoring: false, stack: [snapshot(input)] });
      });
    };

    inputs.forEach((input) => {
      histories.set(input, { index: 0, restoring: false, stack: [snapshot(input)] });
      input.addEventListener("input", () => record(input));
      input.addEventListener(
        "keydown",
        (event) => {
          const key = event.key.toLowerCase();
          const modKey = event.ctrlKey || event.metaKey;
          const isUndo = modKey && !event.altKey && key === "z" && !event.shiftKey;
          const isRedo = modKey && !event.altKey && (key === "y" || (key === "z" && event.shiftKey));
          if (!isUndo && !isRedo) return;

          event.preventDefault();
          event.stopImmediatePropagation();
          if (isUndo) undo(input);
          else redo(input);
        },
        true
      );
    });

    reset();

    return {
      record,
      redo,
      reset,
      undo
    };
  };

  const initEditorTabBehavior = (inputs, onChange) => {
    const indent = "  ";

    const getLineRange = (input) => {
      const value = input.value;
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;
      const effectiveEnd = selectionEnd > selectionStart && value[selectionEnd - 1] === "\n" ? selectionEnd - 1 : selectionEnd;
      const start = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const nextBreak = value.indexOf("\n", effectiveEnd);
      const end = nextBreak === -1 ? value.length : nextBreak;
      return { end, start };
    };

    const lineStartsInRange = (value, start, end) => {
      const starts = [start];
      for (let index = start; index < end; index += 1) {
        if (value[index] === "\n") starts.push(index + 1);
      }
      return starts;
    };

    const indentSelection = (input) => {
      const value = input.value;
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;

      if (selectionStart === selectionEnd) {
        input.setRangeText(indent, selectionStart, selectionEnd, "end");
        return;
      }

      const range = getLineRange(input);
      const block = value.slice(range.start, range.end);
      const lines = block.split("\n");
      const replacement = lines.map((line) => `${indent}${line}`).join("\n");
      const lineStarts = lineStartsInRange(value, range.start, range.end);
      const shiftPosition = (position) => lineStarts.reduce((next, lineStart) => (position >= lineStart ? next + indent.length : next), position);

      input.setRangeText(replacement, range.start, range.end, "preserve");
      input.setSelectionRange(shiftPosition(selectionStart), shiftPosition(selectionEnd));
    };

    const outdentSelection = (input) => {
      const value = input.value;
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;
      const range = getLineRange(input);
      const block = value.slice(range.start, range.end);
      const lines = block.split("\n");
      const removals = [];
      let offset = range.start;

      const replacement = lines
        .map((line) => {
          const removeCount = line.startsWith(indent) ? indent.length : line.startsWith("\t") || line.startsWith(" ") ? 1 : 0;
          if (removeCount) removals.push({ count: removeCount, start: offset });
          offset += line.length + 1;
          return line.slice(removeCount);
        })
        .join("\n");

      if (!removals.length) return;

      const shiftPosition = (position) =>
        removals.reduce((next, removal) => {
          if (position <= removal.start) return next;
          return next - Math.min(removal.count, position - removal.start);
        }, position);

      input.setRangeText(replacement, range.start, range.end, "preserve");
      input.setSelectionRange(shiftPosition(selectionStart), shiftPosition(selectionEnd));
    };

    inputs.forEach((input) => {
      input.addEventListener(
        "keydown",
        (event) => {
          if (event.defaultPrevented || event.key !== "Tab" || event.ctrlKey || event.metaKey || event.altKey) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          if (event.shiftKey) outdentSelection(input);
          else indentSelection(input);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          onChange();
        },
        true
      );
    });
  };

  const initHtmlTagSuggest = (htmlInput, onChange) => {
    const wrap = getElement("htmlEditorWrap") || htmlInput.parentElement;
    if (!wrap) return null;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
    const tagSuggestions = [
      { name: "main", detail: "Konten utama halaman", snippet: "<main>\n  |\n</main>" },
      { name: "section", detail: "Bagian konten", snippet: "<section>\n  |\n</section>" },
      { name: "article", detail: "Artikel atau konten mandiri", snippet: "<article>\n  |\n</article>" },
      { name: "header", detail: "Header halaman/bagian", snippet: "<header>\n  |\n</header>" },
      { name: "footer", detail: "Footer halaman/bagian", snippet: "<footer>\n  |\n</footer>" },
      { name: "nav", detail: "Navigasi link", snippet: "<nav>\n  |\n</nav>" },
      { name: "div", detail: "Pembungkus umum", snippet: '<div class="">|</div>' },
      { name: "span", detail: "Teks inline", snippet: "<span>|</span>" },
      { name: "h1", detail: "Heading utama", snippet: "<h1>|</h1>" },
      { name: "h2", detail: "Heading bagian", snippet: "<h2>|</h2>" },
      { name: "h3", detail: "Heading kecil", snippet: "<h3>|</h3>" },
      { name: "p", detail: "Paragraf", snippet: "<p>|</p>" },
      { name: "a", detail: "Link", snippet: '<a href="#">|</a>' },
      { name: "img", detail: "Gambar", snippet: '<img src="|" alt="">' },
      { name: "ul", detail: "List bullet", snippet: "<ul>\n  <li>|</li>\n</ul>" },
      { name: "ol", detail: "List bernomor", snippet: "<ol>\n  <li>|</li>\n</ol>" },
      { name: "li", detail: "Item list", snippet: "<li>|</li>" },
      { name: "form", detail: "Form input", snippet: "<form>\n  |\n</form>" },
      { name: "label", detail: "Label input", snippet: '<label for="">|</label>' },
      { name: "input", detail: "Input singkat", snippet: '<input id="|" type="text">' },
      { name: "textarea", detail: "Input teks panjang", snippet: '<textarea id="">|</textarea>' },
      { name: "button", detail: "Tombol aksi", snippet: '<button type="button">|</button>' },
      { name: "table", detail: "Tabel data", snippet: "<table>\n  <tr>\n    <th>|</th>\n  </tr>\n</table>" },
      { name: "tr", detail: "Baris tabel", snippet: "<tr>\n  |\n</tr>" },
      { name: "th", detail: "Header tabel", snippet: "<th>|</th>" },
      { name: "td", detail: "Sel tabel", snippet: "<td>|</td>" },
      { name: "strong", detail: "Teks penting", snippet: "<strong>|</strong>" },
      { name: "em", detail: "Teks penekanan", snippet: "<em>|</em>" },
      { name: "br", detail: "Baris baru", snippet: "<br>" },
      { name: "hr", detail: "Garis pemisah", snippet: "<hr>" }
    ];
    const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
    const state = {
      activeIndex: 0,
      context: null,
      items: []
    };

    const popover = document.createElement("div");
    popover.className = "editor-suggestion-popover";
    popover.hidden = true;
    popover.setAttribute("role", "listbox");
    popover.setAttribute("aria-label", "Saran tag HTML");

    const mirror = document.createElement("div");
    mirror.className = "textarea-caret-mirror";

    wrap.append(popover, mirror);

    const getContext = () => {
      const caret = htmlInput.selectionStart;
      if (caret !== htmlInput.selectionEnd) return null;
      const beforeCaret = htmlInput.value.slice(0, caret);
      const lastLt = beforeCaret.lastIndexOf("<");
      if (lastLt < 0) return null;
      const fragment = beforeCaret.slice(lastLt);
      if (fragment.includes(">") || /\s/.test(fragment)) return null;
      const match = fragment.match(/^<\/?([a-zA-Z][\w-]*)?$/);
      if (!match) return null;
      return {
        closing: fragment.startsWith("</"),
        prefix: (match[1] || "").toLowerCase(),
        start: lastLt,
        end: caret
      };
    };

    const findOpenTags = () => {
      const tokens = htmlInput.value.slice(0, htmlInput.selectionStart).match(/<\/?[a-zA-Z][\w-]*(?:\s[^<>]*)?>/g) || [];
      const stack = [];
      tokens.forEach((token) => {
        const parsed = token.match(/^<\/?\s*([a-zA-Z][\w-]*)/);
        if (!parsed) return;
        const name = parsed[1].toLowerCase();
        if (voidTags.has(name) || token.endsWith("/>")) return;
        if (token.startsWith("</")) {
          const index = stack.lastIndexOf(name);
          if (index >= 0) stack.splice(index, 1);
          return;
        }
        stack.push(name);
      });
      return stack.reverse();
    };

    const getItems = (context) => {
      const source = context.closing
        ? findOpenTags().map((name) => tagSuggestions.find((item) => item.name === name) || { name, detail: "Tag penutup", snippet: `</${name}>` })
        : tagSuggestions;
      const unique = [];
      const seen = new Set();

      source.forEach((item) => {
        if (seen.has(item.name) || (context.prefix && !item.name.startsWith(context.prefix))) return;
        seen.add(item.name);
        unique.push(item);
      });

      return unique.slice(0, 8);
    };

    const syncMirrorStyle = () => {
      const style = window.getComputedStyle(htmlInput);
      [
        "boxSizing",
        "fontFamily",
        "fontSize",
        "fontStyle",
        "fontWeight",
        "letterSpacing",
        "lineHeight",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "textTransform"
      ].forEach((property) => {
        mirror.style[property] = style[property];
      });
      mirror.style.borderStyle = "solid";
      mirror.style.borderColor = "transparent";
      mirror.style.borderTopWidth = style.borderTopWidth;
      mirror.style.borderRightWidth = style.borderRightWidth;
      mirror.style.borderBottomWidth = style.borderBottomWidth;
      mirror.style.borderLeftWidth = style.borderLeftWidth;
      mirror.style.width = `${htmlInput.clientWidth}px`;
      mirror.style.minHeight = `${htmlInput.scrollHeight}px`;
    };

    const positionPopover = () => {
      if (popover.hidden || !state.context) return;
      syncMirrorStyle();
      mirror.replaceChildren(document.createTextNode(htmlInput.value.slice(0, state.context.end)));
      const marker = document.createElement("span");
      marker.textContent = "\u200b";
      mirror.append(marker);

      const lineHeight = parseFloat(window.getComputedStyle(htmlInput).lineHeight) || 20;
      const width = popover.offsetWidth || 286;
      const height = popover.offsetHeight || 220;
      const left = clamp(marker.offsetLeft - htmlInput.scrollLeft, 8, wrap.clientWidth - width - 8);
      const lowerTop = marker.offsetTop - htmlInput.scrollTop + lineHeight + 6;
      const upperTop = marker.offsetTop - htmlInput.scrollTop - height - 6;
      const top = lowerTop + height < htmlInput.clientHeight ? lowerTop : clamp(upperTop, 8, htmlInput.clientHeight - height - 8);

      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
    };

    const close = () => {
      popover.hidden = true;
      state.context = null;
      state.items = [];
      state.activeIndex = 0;
      wrap.closest(".editor-shell")?.classList.remove("suggestion-open");
    };

    const render = () => {
      popover.innerHTML = state.items
        .map(
          (item, index) => `
            <button class="editor-suggestion-option ${index === state.activeIndex ? "active" : ""}" type="button" role="option" aria-selected="${index === state.activeIndex}" data-suggestion-index="${index}">
              <span class="editor-suggestion-kind">&lt;/&gt;</span>
              <span class="editor-suggestion-main">
                <span class="editor-suggestion-name">${escapeHTML(state.context.closing ? `/${item.name}` : item.name)}</span>
                <span class="editor-suggestion-detail">${escapeHTML(item.detail)}</span>
              </span>
            </button>`
        )
        .join("");
    };

    const sync = () => {
      const context = getContext();
      if (!context) {
        close();
        return;
      }

      const items = getItems(context);
      if (!items.length) {
        close();
        return;
      }

      const previousKey = state.context ? `${state.context.closing}:${state.context.prefix}` : "";
      const nextKey = `${context.closing}:${context.prefix}`;
      state.context = context;
      state.items = items;
      state.activeIndex = previousKey === nextKey ? clamp(state.activeIndex, 0, items.length - 1) : 0;
      render();
      popover.hidden = false;
      wrap.closest(".editor-shell")?.classList.add("suggestion-open");
      positionPopover();
    };

    const commit = (item = state.items[state.activeIndex]) => {
      if (!item || !state.context) return;
      const snippet = state.context.closing ? `</${item.name}>` : item.snippet;
      const cursorIndex = snippet.indexOf("|");
      const replacement = snippet.replace("|", "");
      const selectionStart = state.context.start + (cursorIndex >= 0 ? cursorIndex : replacement.length);

      htmlInput.setRangeText(replacement, state.context.start, state.context.end, "end");
      htmlInput.setSelectionRange(selectionStart, selectionStart);
      htmlInput.dispatchEvent(new Event("input", { bubbles: true }));
      onChange();
      close();
      htmlInput.focus();
    };

    const moveActive = (direction) => {
      if (!state.items.length) return;
      state.activeIndex = (state.activeIndex + direction + state.items.length) % state.items.length;
      render();
      popover.querySelector(".editor-suggestion-option.active")?.scrollIntoView({ block: "nearest" });
    };

    htmlInput.addEventListener("input", () => window.requestAnimationFrame(sync));
    htmlInput.addEventListener("click", sync);
    htmlInput.addEventListener("keyup", (event) => {
      if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(event.key)) return;
      sync();
    });
    htmlInput.addEventListener(
      "keydown",
      (event) => {
        if (popover.hidden) return;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          event.stopImmediatePropagation();
          moveActive(1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          event.stopImmediatePropagation();
          moveActive(-1);
        } else if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault();
          event.stopImmediatePropagation();
          commit();
        } else if (event.key === "Escape") {
          event.preventDefault();
          event.stopImmediatePropagation();
          close();
        }
      },
      true
    );
    htmlInput.addEventListener("scroll", positionPopover);
    popover.addEventListener("pointerdown", (event) => {
      const option = event.target.closest("[data-suggestion-index]");
      if (!option) return;
      event.preventDefault();
      commit(state.items[Number(option.dataset.suggestionIndex)]);
    });
    document.addEventListener("pointerdown", (event) => {
      if (popover.hidden) return;
      if (popover.contains(event.target) || htmlInput.contains(event.target)) return;
      close();
    });
    window.addEventListener("resize", sync);

    return {
      close,
      sync
    };
  };

  const initCssColorPicker = (cssInput, onChange) => {
    const wrap = getElement("cssEditorWrap") || cssInput.parentElement;
    if (!wrap) return null;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
    const namedColors = {
      black: "#000000",
      blue: "#0000FF",
      cyan: "#00FFFF",
      gray: "#808080",
      green: "#008000",
      grey: "#808080",
      magenta: "#FF00FF",
      orange: "#FFA500",
      pink: "#FFC0CB",
      purple: "#800080",
      red: "#FF0000",
      white: "#FFFFFF",
      yellow: "#FFFF00"
    };
    const presets = ["#FFFFFF", "#111827", "#7C3AED", "#0EA5B7", "#16A36A", "#F97316", "#DC4C64", "#FBBF24", "#22C55E", "#38BDF8", "#A855F7", "#64748B"];
    const namedPattern = Object.keys(namedColors).join("|");
    const colorTokenPattern = new RegExp(`#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])|\\b(?:rgba?|hsla?)\\(\\s*[^)]*\\)|\\b(?:${namedPattern})\\b`, "gi");
    const state = {
      color: null,
      draggingMap: false,
      token: null
    };

    const chip = document.createElement("button");
    chip.className = "editor-color-chip";
    chip.type = "button";
    chip.hidden = true;
    chip.setAttribute("aria-label", "Buka color picker");
    chip.innerHTML = "<span></span>";

    const popover = document.createElement("div");
    popover.className = "editor-color-popover";
    popover.hidden = true;
    popover.innerHTML = `
      <div class="editor-color-top">
        <span class="editor-color-preview" data-color-preview></span>
        <label class="editor-color-hex">
          <span>HEX</span>
          <input type="text" inputmode="text" maxlength="7" spellcheck="false" data-color-hex aria-label="Nilai warna hex" />
        </label>
        <button class="editor-color-close" type="button" data-color-close aria-label="Tutup color picker">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="editor-color-body">
        <div class="editor-color-map" tabindex="0" data-color-map aria-label="Area saturation dan value warna">
          <span class="editor-color-cursor" data-color-cursor></span>
        </div>
        <input class="editor-color-hue" type="range" min="0" max="360" value="0" data-color-hue aria-label="Hue warna" />
      </div>
      <div class="editor-color-presets">
        ${presets.map((color) => `<button class="editor-color-preset" type="button" style="--preset-color: ${color}" data-color-preset="${color}" aria-label="Gunakan warna ${color}"></button>`).join("")}
      </div>`;

    const mirror = document.createElement("div");
    mirror.className = "textarea-caret-mirror";

    wrap.append(chip, popover, mirror);

    const chipSwatch = chip.querySelector("span");
    const preview = popover.querySelector("[data-color-preview]");
    const hexInput = popover.querySelector("[data-color-hex]");
    const closeButton = popover.querySelector("[data-color-close]");
    const colorMap = popover.querySelector("[data-color-map]");
    const colorCursor = popover.querySelector("[data-color-cursor]");
    const hueInput = popover.querySelector("[data-color-hue]");

    const componentToHex = (component) => Math.round(clamp(component, 0, 255)).toString(16).padStart(2, "0").toUpperCase();
    const rgbToHex = ({ r, g, b }) => `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

    const normalizeHexColor = (value) => {
      const raw = String(value).trim().replace(/^#/, "");
      if (![3, 4, 6, 8].includes(raw.length) || /[^0-9a-f]/i.test(raw)) return null;
      const expanded = raw.length <= 4 ? raw.split("").map((char) => char + char).join("") : raw;
      return `#${expanded.slice(0, 6).toUpperCase()}`;
    };

    const hexToRgb = (value) => {
      const hex = normalizeHexColor(value);
      if (!hex) return null;
      return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
      };
    };

    const rgbToHsv = ({ r, g, b }) => {
      const red = r / 255;
      const green = g / 255;
      const blue = b / 255;
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const delta = max - min;
      let h = 0;

      if (delta) {
        if (max === red) h = ((green - blue) / delta) % 6;
        else if (max === green) h = (blue - red) / delta + 2;
        else h = (red - green) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
      }

      return {
        h,
        s: max === 0 ? 0 : delta / max,
        v: max
      };
    };

    const hsvToRgb = ({ h, s, v }) => {
      const hue = ((h % 360) + 360) % 360;
      const chroma = v * s;
      const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
      const match = v - chroma;
      let red = 0;
      let green = 0;
      let blue = 0;

      if (hue < 60) [red, green, blue] = [chroma, x, 0];
      else if (hue < 120) [red, green, blue] = [x, chroma, 0];
      else if (hue < 180) [red, green, blue] = [0, chroma, x];
      else if (hue < 240) [red, green, blue] = [0, x, chroma];
      else if (hue < 300) [red, green, blue] = [x, 0, chroma];
      else [red, green, blue] = [chroma, 0, x];

      return {
        r: (red + match) * 255,
        g: (green + match) * 255,
        b: (blue + match) * 255
      };
    };

    const hslToRgb = (h, s, l) => {
      const hue = ((h % 360) + 360) % 360;
      const saturation = clamp(s, 0, 100) / 100;
      const lightness = clamp(l, 0, 100) / 100;
      const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
      const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
      const match = lightness - chroma / 2;
      let red = 0;
      let green = 0;
      let blue = 0;

      if (hue < 60) [red, green, blue] = [chroma, x, 0];
      else if (hue < 120) [red, green, blue] = [x, chroma, 0];
      else if (hue < 180) [red, green, blue] = [0, chroma, x];
      else if (hue < 240) [red, green, blue] = [0, x, chroma];
      else if (hue < 300) [red, green, blue] = [x, 0, chroma];
      else [red, green, blue] = [chroma, 0, x];

      return {
        r: (red + match) * 255,
        g: (green + match) * 255,
        b: (blue + match) * 255
      };
    };

    const parseCssColor = (value) => {
      const text = String(value).trim();
      const lower = text.toLowerCase();
      if (namedColors[lower]) return hexToRgb(namedColors[lower]);
      if (text.startsWith("#")) return hexToRgb(text);

      const numbers = text.match(/-?\d*\.?\d+%?/g) || [];
      if (lower.startsWith("rgb") && numbers.length >= 3) {
        const toRgbComponent = (part) => (part.endsWith("%") ? (parseFloat(part) / 100) * 255 : parseFloat(part));
        return {
          r: clamp(toRgbComponent(numbers[0]), 0, 255),
          g: clamp(toRgbComponent(numbers[1]), 0, 255),
          b: clamp(toRgbComponent(numbers[2]), 0, 255)
        };
      }

      if (lower.startsWith("hsl") && numbers.length >= 3) {
        const saturation = numbers[1].endsWith("%") ? parseFloat(numbers[1]) : parseFloat(numbers[1]);
        const lightness = numbers[2].endsWith("%") ? parseFloat(numbers[2]) : parseFloat(numbers[2]);
        return hslToRgb(parseFloat(numbers[0]), saturation, lightness);
      }

      return null;
    };

    const findColorToken = () => {
      const selectionStart = cssInput.selectionStart;
      const selectionEnd = cssInput.selectionEnd;
      const hasSelection = selectionStart !== selectionEnd;
      colorTokenPattern.lastIndex = 0;
      let match;

      while ((match = colorTokenPattern.exec(cssInput.value))) {
        const start = match.index;
        const end = start + match[0].length;
        const insideToken = hasSelection ? selectionStart >= start && selectionEnd <= end : selectionStart >= start && selectionStart <= end;
        if (insideToken && parseCssColor(match[0])) {
          return { start, end, text: match[0] };
        }
      }

      return null;
    };

    const renderPicker = () => {
      if (!state.color) return;
      const rgb = hsvToRgb(state.color);
      const hex = rgbToHex(rgb);
      chipSwatch.style.backgroundColor = hex;
      preview.style.backgroundColor = hex;
      hexInput.value = hex;
      hueInput.value = Math.round(state.color.h);
      colorMap.style.setProperty("--picker-hue", Math.round(state.color.h));
      colorCursor.style.left = `${state.color.s * 100}%`;
      colorCursor.style.top = `${(1 - state.color.v) * 100}%`;
    };

    const syncMirrorStyle = () => {
      const style = window.getComputedStyle(cssInput);
      [
        "boxSizing",
        "fontFamily",
        "fontSize",
        "fontStyle",
        "fontWeight",
        "letterSpacing",
        "lineHeight",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "textTransform"
      ].forEach((property) => {
        mirror.style[property] = style[property];
      });
      mirror.style.borderStyle = "solid";
      mirror.style.borderColor = "transparent";
      mirror.style.borderTopWidth = style.borderTopWidth;
      mirror.style.borderRightWidth = style.borderRightWidth;
      mirror.style.borderBottomWidth = style.borderBottomWidth;
      mirror.style.borderLeftWidth = style.borderLeftWidth;
      mirror.style.width = `${cssInput.clientWidth}px`;
      mirror.style.minHeight = `${cssInput.scrollHeight}px`;
    };

    const positionChip = () => {
      if (!state.token) return;
      syncMirrorStyle();
      mirror.replaceChildren(document.createTextNode(cssInput.value.slice(0, state.token.start)));
      const marker = document.createElement("span");
      marker.textContent = "\u200b";
      mirror.append(marker);

      const lineHeight = parseFloat(window.getComputedStyle(cssInput).lineHeight) || 20;
      const left = clamp(marker.offsetLeft - cssInput.scrollLeft - 30, 7, wrap.clientWidth - 31);
      const top = clamp(marker.offsetTop - cssInput.scrollTop + lineHeight * 0.12, 7, cssInput.clientHeight - 31);
      chip.style.left = `${left}px`;
      chip.style.top = `${top}px`;
    };

    const positionPopover = () => {
      if (popover.hidden) return;
      const chipLeft = parseFloat(chip.style.left) || 8;
      const chipTop = parseFloat(chip.style.top) || 8;
      const popoverWidth = popover.offsetWidth;
      const popoverHeight = popover.offsetHeight;
      const left = clamp(chipLeft, 8, wrap.clientWidth - popoverWidth - 8);
      const lowerTop = chipTop + 32;
      const upperTop = chipTop - popoverHeight - 8;
      const top = lowerTop + popoverHeight < cssInput.clientHeight ? lowerTop : clamp(upperTop, 8, cssInput.clientHeight - popoverHeight - 8);
      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
    };

    const closePopover = () => {
      popover.hidden = true;
      wrap.closest(".editor-shell")?.classList.remove("color-picker-open");
    };

    const syncFromSelection = () => {
      const token = findColorToken();
      if (!token) {
        state.token = null;
        chip.hidden = true;
        closePopover();
        return;
      }

      state.token = token;
      state.color = rgbToHsv(parseCssColor(token.text));
      renderPicker();
      positionChip();
      chip.hidden = false;
      positionPopover();
    };

    const replaceActiveColor = (hex) => {
      if (!state.token) return;
      const start = state.token.start;
      cssInput.setRangeText(hex, start, state.token.end, "select");
      state.token = { start, end: start + hex.length, text: hex };
      state.color = rgbToHsv(hexToRgb(hex));
      renderPicker();
      positionChip();
      positionPopover();
      cssInput.dispatchEvent(new Event("input", { bubbles: true }));
      onChange();
    };

    const setColor = (nextColor, shouldReplace = true) => {
      state.color = {
        h: clamp(nextColor.h, 0, 360),
        s: clamp(nextColor.s, 0, 1),
        v: clamp(nextColor.v, 0, 1)
      };
      renderPicker();
      if (shouldReplace) replaceActiveColor(rgbToHex(hsvToRgb(state.color)));
    };

    const updateFromMapPoint = (event) => {
      if (!state.color) return;
      const rect = colorMap.getBoundingClientRect();
      const s = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const v = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
      setColor({ ...state.color, s, v });
    };

    const openPopover = () => {
      if (!state.token) syncFromSelection();
      if (!state.token) return;
      popover.hidden = false;
      wrap.closest(".editor-shell")?.classList.add("color-picker-open");
      renderPicker();
      positionPopover();
      hexInput.focus();
      hexInput.select();
    };

    chip.addEventListener("click", (event) => {
      event.preventDefault();
      openPopover();
    });

    closeButton.addEventListener("click", closePopover);

    colorMap.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      state.draggingMap = true;
      colorMap.setPointerCapture?.(event.pointerId);
      updateFromMapPoint(event);
    });

    colorMap.addEventListener("pointermove", (event) => {
      if (!state.draggingMap) return;
      updateFromMapPoint(event);
    });

    colorMap.addEventListener("pointerup", (event) => {
      state.draggingMap = false;
      colorMap.releasePointerCapture?.(event.pointerId);
    });

    colorMap.addEventListener("keydown", (event) => {
      if (!state.color || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const step = event.shiftKey ? 0.1 : 0.025;
      const nextColor = { ...state.color };
      if (event.key === "ArrowLeft") nextColor.s -= step;
      if (event.key === "ArrowRight") nextColor.s += step;
      if (event.key === "ArrowUp") nextColor.v += step;
      if (event.key === "ArrowDown") nextColor.v -= step;
      setColor(nextColor);
    });

    hueInput.addEventListener("input", () => {
      if (!state.color) return;
      setColor({ ...state.color, h: Number(hueInput.value) });
    });

    hexInput.addEventListener("input", () => {
      const hex = normalizeHexColor(hexInput.value.startsWith("#") ? hexInput.value : `#${hexInput.value}`);
      hexInput.toggleAttribute("aria-invalid", !hex);
      if (!hex) return;
      state.color = rgbToHsv(hexToRgb(hex));
      replaceActiveColor(hex);
    });

    popover.querySelectorAll("[data-color-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        replaceActiveColor(button.dataset.colorPreset);
      });
    });

    cssInput.addEventListener("click", syncFromSelection);
    cssInput.addEventListener("keyup", syncFromSelection);
    cssInput.addEventListener("select", syncFromSelection);
    cssInput.addEventListener("input", () => window.requestAnimationFrame(syncFromSelection));
    cssInput.addEventListener("scroll", () => {
      if (!state.token) return;
      positionChip();
      positionPopover();
    });

    document.addEventListener("pointerdown", (event) => {
      if (popover.hidden) return;
      if (popover.contains(event.target) || chip.contains(event.target)) return;
      closePopover();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePopover();
    });

    window.addEventListener("resize", syncFromSelection);

    return {
      close: closePopover,
      sync: syncFromSelection
    };
  };

  const initPhpEditorEnhancements = () => {
    if (document.body.dataset.editorEnhancements === "php") return;
    const indexInput = getElement("routesEditor");
    const dataInput = getElement("controllerEditor");
    const templateInput = getElement("bladeEditor");
    const cssInput = getElement("cssEditor");
    if (!indexInput || !dataInput || !templateInput || !cssInput) return;

    document.body.dataset.editorEnhancements = "php";
    const inputs = [indexInput, dataInput, templateInput, cssInput];
    editorTagSuggest = initHtmlTagSuggest(templateInput, runPhpEditorPreview);
    editorColorPicker = initCssColorPicker(cssInput, runPhpEditorPreview);
    editorUndoHistory = initEditorUndoHistory(inputs, runPhpEditorPreview);
    initEditorTabBehavior(inputs, runPhpEditorPreview);

    getElement("resetEditor")?.addEventListener("click", () => {
      window.requestAnimationFrame(() => {
        editorUndoHistory?.reset();
        editorTagSuggest?.close();
        editorColorPicker?.close();
        editorColorPicker?.sync();
      });
    });
  };

  const handleClick = (event) => {
    const projectPreviewButton = event.target.closest("[data-open-project-preview]");
    if (projectPreviewButton) {
      openProjectPreview(projectPreviewButton.dataset.openProjectPreview);
      return;
    }

    const copyButton = event.target.closest("[data-copy-code]");
    if (copyButton) {
      navigator.clipboard
        .writeText(decodeURIComponent(copyButton.dataset.copyCode))
        .then(() => showToast("Kode berhasil disalin."))
        .catch(() => showToast("Kode belum bisa disalin. Pilih kode secara manual."));
      return;
    }

    const phaseButton = event.target.closest("[data-lesson-phase]");
    if (phaseButton) {
      activeLessonPhase = phaseButton.dataset.lessonPhase;
      renderLessonPhaseFilter();
      renderLessons();
      getElement("lessonGrid")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const lessonButton = event.target.closest("[data-open-lesson]");
    if (lessonButton) {
      openLesson(lessonButton.dataset.openLesson);
      return;
    }

    if (event.target.closest("[data-close-lesson]")) {
      closeLesson();
      return;
    }

    const completeLessonButton = event.target.closest("[data-complete-lesson]");
    if (completeLessonButton) {
      const result = progress.markLesson(completeLessonButton.dataset.completeLesson);
      completeLessonButton.innerHTML = '<i class="bi bi-check2-circle"></i> Sudah selesai';
      showNextLearningPanel(completeLessonButton.dataset.completeLesson);
      renderLessons();
      updateProgress();
      showToast(result.added ? "Materi ditandai selesai." : "Materi ini sudah pernah diselesaikan.");
      showBadgeToasts(result.unlocked);
      return;
    }

    const toggleTarget = event.target.closest("[data-toggle-target]");
    if (toggleTarget) {
      getElement(toggleTarget.dataset.toggleTarget)?.classList.toggle("d-none");
      return;
    }

    const lessonAnswer = event.target.closest("[data-lesson-answer]");
    if (lessonAnswer) {
      const wrapper = lessonAnswer.closest("[data-lesson-quiz]");
      const item = data.lessons.find((lessonItem) => lessonItem.id === wrapper.dataset.lessonQuiz);
      const selected = Number(lessonAnswer.dataset.lessonAnswer);
      wrapper.querySelectorAll("[data-lesson-answer]").forEach((button, index) => {
        button.disabled = true;
        if (index === item.quiz.answer) button.classList.add("correct");
        if (index === selected && selected !== item.quiz.answer) button.classList.add("wrong");
      });
      const feedback = wrapper.nextElementSibling;
      feedback.classList.remove("d-none");
      feedback.innerHTML = `<strong>${selected === item.quiz.answer ? "Benar." : "Belum tepat."}</strong> ${escapeHTML(item.quiz.explanation)}`;
      return;
    }

    const quizAnswer = event.target.closest("[data-quiz-answer]");
    if (quizAnswer) {
      answerQuiz(Number(quizAnswer.dataset.quizAnswer));
      return;
    }

    if (event.target.closest("[data-next-quiz]")) {
      currentQuiz.index += 1;
      currentQuiz.answered = false;
      renderQuiz();
      return;
    }

    if (event.target.closest("[data-retry-quiz]")) {
      currentQuiz = { index: 0, score: 0, answered: false };
      renderQuiz();
      return;
    }

    const recallButton = event.target.closest("[data-open-recall]");
    if (recallButton) {
      renderRecallChallenge(recallButton.dataset.openRecall);
      return;
    }

    if (event.target.closest("[data-show-recall-answer]")) {
      getElement("recallAnswer")?.classList.remove("d-none");
      return;
    }

    const completeRecallButton = event.target.closest("[data-complete-recall]");
    if (completeRecallButton) {
      const result = progress.markRecall(completeRecallButton.dataset.completeRecall);
      renderRecallChallenge(completeRecallButton.dataset.completeRecall);
      updateProgress();
      showToast(result.added ? "Recall challenge ditandai selesai." : "Recall ini sudah pernah diselesaikan.");
      showBadgeToasts(result.unlocked);
      return;
    }

    const debugButton = event.target.closest("[data-open-debug]");
    if (debugButton) {
      renderDebuggingChallenge(debugButton.dataset.openDebug);
      return;
    }

    if (event.target.closest("[data-show-debug-hint]")) {
      getElement("debugHint")?.classList.remove("d-none");
      return;
    }

    const completeDebugButton = event.target.closest("[data-complete-debug]");
    if (completeDebugButton) {
      const result = progress.markDebug(completeDebugButton.dataset.completeDebug);
      renderDebuggingChallenge(completeDebugButton.dataset.completeDebug);
      updateProgress();
      showToast(result.added ? "Debugging challenge ditandai selesai." : "Kasus debugging ini sudah pernah diselesaikan.");
      showBadgeToasts(result.unlocked);
    }
  };

  const handleSubmit = (event) => {
    const lessonRecallForm = event.target.closest("[data-lesson-recall-form]");
    if (lessonRecallForm) {
      event.preventDefault();
      const answer = lessonRecallForm.elements.answer.value.trim();
      if (!answer) {
        showToast("Tulis jawaban recall sebelum menyimpan.");
        return;
      }
      lessonRecallAnswers[lessonRecallForm.dataset.lessonRecallForm] = answer;
      showToast(saveLessonRecallAnswers() ? "Jawaban recall materi tersimpan." : "Jawaban recall belum dapat disimpan.");
      return;
    }

    const debugForm = event.target.closest("[data-debug-form]");
    if (!debugForm) return;
    event.preventDefault();
    const analysis = debugForm.elements.analysis.value.trim();
    const code = debugForm.elements.code.value.trim();
    if (!analysis || !code) {
      showToast("Lengkapi analisis dan percobaan kode sebelum submit.");
      return;
    }
    const id = debugForm.dataset.debugForm;
    debugAttempts[id] = { analysis, code, submitted: true };
    renderDebuggingChallenge(id);
    getElement("debugAnswer")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    showToast("Jawaban terkirim. Silakan pelajari pembahasannya.");
  };

  const handleInput = (event) => {
    const debugForm = event.target.closest("[data-debug-form]");
    if (!debugForm) return;
    const id = debugForm.dataset.debugForm;
    const previousAttempt = debugAttempts[id] || { submitted: false };
    debugAttempts[id] = {
      analysis: debugForm.elements.analysis.value,
      code: debugForm.elements.code.value,
      submitted: previousAttempt.submitted
    };
  };

  const handleKeydown = (event) => {
    const projectPreviewButton = event.target.closest("[data-open-project-preview]");
    if (!projectPreviewButton || projectPreviewButton.tagName === "BUTTON") return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openProjectPreview(projectPreviewButton.dataset.openProjectPreview);
  };

  const init = () => {
    document.body.classList.toggle("dark-mode", progress.state.darkMode);
    updateThemeToggle();
    progress.unlockBadges();
    renderLearnerProfiles();
    renderLearningFlow();
    renderLessonPhaseFilter();
    renderLearningPath();
    renderLessons();
    renderQuiz();
    renderRecallChallenge();
    renderDebuggingChallenge();
    renderProjects();
    updateProgress();
    window.PhpLabEditor?.init();
    initPhpEditorEnhancements();

    getElement("darkModeToggle")?.addEventListener("click", toggleDarkMode);
    getElement("resetProgress")?.addEventListener("click", () => {
      if (!window.confirm("Reset seluruh progress belajar di browser ini?")) return;
      progress.resetProgress();
      renderLessons();
      renderRecallChallenge();
      renderDebuggingChallenge();
      updateProgress();
      showToast("Progress belajar sudah direset.");
    });
    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("keydown", handleKeydown);

    document.querySelectorAll(".navbar .nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        const menu = getElement("mainNav");
        if (menu?.classList.contains("show")) bootstrap.Collapse.getOrCreateInstance(menu).hide();
      });
    });

    const lessonId = document.body.dataset.lesson;
    if (lessonId && getElement("lessonDetail")) openLesson(lessonId, false);
  };

  return {
    init,
    renderLearningPath,
    renderLessons,
    renderLessonDetail,
    renderQuiz,
    renderDebuggingChallenge,
    renderRecallChallenge,
    updateProgress,
    showToast,
    escapeHTML,
    highlightHTML,
    highlightPHP,
    renderCodeBlock,
    toggleDarkMode,
    showNextLearningPanel
  };
})();

document.addEventListener("DOMContentLoaded", window.PhpLabApp.init);
