window.PhpLabApp = (() => {
  const data = window.PhpLabData;
  const progress = window.PhpLabProgress;
  let currentQuiz = { index: 0, score: 0, answered: false };
  let activeRecallId = data.recallChallenges[0].id;
  let activeDebugId = data.debugChallenges[0].id;
  const debugAttempts = {};
  const LESSON_RECALL_STORAGE_KEY = "php-beginner-lab-lesson-recall-v1";
  let toastInstance;
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

  const renderLessons = () => {
    const lessonGrid = getElement("lessonGrid");
    if (!lessonGrid) return;
    const completed = progress.state.completedLessons;
    lessonGrid.innerHTML = data.lessons
      .map(
        (item, index) => `
          <a class="lesson-card text-start ${completed.includes(item.id) ? "completed" : ""}" href="${lessonHref(item.id)}">
            ${completed.includes(item.id) ? '<i class="bi bi-check-circle-fill complete-mark"></i>' : ""}
            <span class="lesson-icon"><i class="bi ${item.icon}"></i></span>
            <span class="lesson-number d-block mt-3">Materi ${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHTML(item.title)}</h3>
            <p><i class="bi bi-clock"></i> ${escapeHTML(item.duration)}</p>
          </a>`
      )
      .join("");
    const roadmapCompleted = getElement("roadmapCompleted");
    if (roadmapCompleted) roadmapCompleted.textContent = `${completed.length}/${data.lessons.length}`;
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
              <span class="eyebrow">Materi ${String(lessonIndex + 1).padStart(2, "0")} &middot; ${escapeHTML(item.duration)}</span>
              <h2 class="mt-2 mb-1">${escapeHTML(item.title)}</h2>
              <p class="mb-0">${escapeHTML(item.goal)}</p>
            </div>
            <button class="icon-btn flex-shrink-0" type="button" data-close-lesson aria-label="Tutup materi">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </header>
        <div class="lesson-detail-body">
          <section class="detail-block beginner-start-block">
            <span class="beginner-label"><i class="bi bi-signpost-split"></i> Mulai dari sini</span>
            <h3 class="mt-2"><i class="bi bi-person-walking"></i> Sebelum memulai materi ini</h3>
            <p>${escapeHTML(item.prerequisite)}</p>
            <div class="beginner-overview">
              <strong>Fokus belajarmu</strong>
              <p class="mb-0">${escapeHTML(item.overview)}</p>
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
        <p><strong>Bagus!</strong> Kamu sudah menyelesaikan materi ini. Mau lanjut atau kembali ke daftar materi?</p>
        <a class="btn btn-soft" href="${rootPath}materi.html#materi"><i class="bi bi-grid"></i> Kembali ke Daftar Materi</a>
        ${
          nextLesson
            ? `<a class="btn btn-primary" href="${lessonHref(nextLesson.id)}">Lanjut ke Materi Berikutnya <i class="bi bi-arrow-right"></i></a>`
            : `<a class="btn btn-primary" href="${rootPath}progress.html">Lihat Progress <i class="bi bi-arrow-right"></i></a>`
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
        : '<i class="bi bi-check-circle"></i> Semua materi utama sudah selesai. Lanjutkan mini project untuk memperkuat pemahaman.';
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
    renderLessons();
    renderQuiz();
    renderRecallChallenge();
    renderDebuggingChallenge();
    renderProjects();
    updateProgress();
    window.PhpLabEditor?.init();

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
