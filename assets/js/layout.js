window.PhpLabLayout = (() => {
  const pages = [
    { id: "home", label: "Home", href: "index.html" },
    { id: "materi", label: "Materi", href: "materi.html" },
    { id: "debugging", label: "Debugging", href: "debugging.html" },
    { id: "recall", label: "Recall", href: "recall.html" },
    { id: "editor", label: "Editor", href: "editor.html" },
    { id: "quiz", label: "Quiz", href: "quiz.html" },
    { id: "projects", label: "Project", href: "projects.html" },
    { id: "progress", label: "Progress", href: "progress.html" }
  ];

  const renderNavbar = () => {
    const target = document.getElementById("appNav");
    if (!target) return;
    const activePage = document.body.dataset.page || "home";
    const rootPath = document.body.dataset.root || "";

    target.innerHTML = `
      <nav class="navbar navbar-expand-lg app-navbar sticky-top" aria-label="Navigasi utama">
        <div class="container">
          <a class="navbar-brand" href="${rootPath}index.html" aria-label="Belajar PHP">
            <img class="brand-logo brand-logo-light" src="${rootPath}assets/images/logo-light.svg" alt="Belajar PHP" />
            <img class="brand-logo brand-logo-dark" src="${rootPath}assets/images/logo-dark.svg" alt="" />
          </a>
          <div class="d-flex align-items-center gap-2 ms-auto order-lg-3">
            <button
              class="icon-btn"
              id="darkModeToggle"
              type="button"
              aria-label="Aktifkan mode gelap"
              title="Ubah tema"
            >
              <i class="bi bi-moon-stars-fill"></i>
            </button>
            <button
              class="navbar-toggler icon-btn"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#mainNav"
              aria-controls="mainNav"
              aria-expanded="false"
              aria-label="Buka menu"
            >
              <i class="bi bi-list"></i>
            </button>
          </div>
          <div class="collapse navbar-collapse order-lg-2" id="mainNav">
            <ul class="navbar-nav ms-lg-auto me-lg-3 py-3 py-lg-0">
              ${pages
                .map(
                  (page) => `
                    <li class="nav-item">
                      <a
                        class="nav-link ${activePage === page.id ? "active" : ""}"
                        href="${rootPath}${page.href}"
                        ${activePage === page.id ? 'aria-current="page"' : ""}
                      >
                        ${page.label}
                      </a>
                    </li>`
                )
                .join("")}
            </ul>
          </div>
        </div>
      </nav>`;
  };

  const renderFooter = () => {
    const target = document.getElementById("appFooter");
    if (!target) return;
    const rootPath = document.body.dataset.root || "";

    target.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="d-flex flex-column flex-md-row justify-content-between gap-2">
            <span><strong>PHP Beginner Lab</strong> &middot; Belajar PHP dasar untuk web dinamis setelah HTML, CSS, dan JavaScript.</span>
            <a href="${rootPath}index.html">Kembali ke home</a>
          </div>
        </div>
      </footer>`;
  };

  const renderToast = () => {
    const target = document.getElementById("appToast");
    if (!target) return;

    target.innerHTML = `
      <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div class="toast app-toast" id="appToastElement" role="status" aria-live="polite" aria-atomic="true">
          <div class="toast-body d-flex align-items-center gap-2">
            <i class="bi bi-check-circle-fill"></i>
            <span id="toastMessage">Progress tersimpan.</span>
          </div>
        </div>
      </div>`;
  };

  const init = () => {
    document.body.classList.toggle("dark-mode", Boolean(window.PhpLabProgress?.state.darkMode));
    renderNavbar();
    renderFooter();
    renderToast();
  };

  init();

  return { init };
})();
