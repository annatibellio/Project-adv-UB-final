// Coloque aqui o link da logo (caminho relativo à raiz do projeto ou URL completa)
const SIDEBAR_LOGO_SRC = "assets/images/logo.png";
const SIDEBAR_LOGO_ALT = "Logo Project Adv";

function resolveLogoSrc(rootPrefix, customSrc) {
  const src = customSrc || SIDEBAR_LOGO_SRC;

  if (/^(https?:\/\/|\/)/.test(src)) {
    return src;
  }

  return `${rootPrefix}${src}`;
}

function resolveCurrentPage(explicitCurrent, links) {
  const path = window.location.pathname.replace(/\\/g, "/").toLowerCase();
  const href = window.location.href.replace(/\\/g, "/").toLowerCase();

  for (const link of links) {
    if (link.match) {
      const match = link.match.toLowerCase();
      if (path.includes(match) || href.includes(match)) {
        return link.key;
      }
    }
  }

  for (const link of links) {
    if (path.includes(`/pages/${link.key}/`) || href.includes(`/pages/${link.key}/`)) {
      return link.key;
    }
  }

  if (explicitCurrent && links.some((link) => link.key === explicitCurrent)) {
    return explicitCurrent;
  }

  return "";
}

function bindSidebarEvents(sidebarElement) {
  const sidebarLinks = sidebarElement.querySelectorAll(
    ".sidebar__link:not([data-logout])",
  );
  const logoutLink = sidebarElement.querySelector("[data-logout='true']");

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      sidebarLinks.forEach((item) => item.classList.remove("is-active"));
      link.classList.add("is-active");
    });
  });

  if (logoutLink) {
    logoutLink.addEventListener("click", (event) => {
      event.preventDefault();

      const shouldLogout = window.confirm("Deseja realmente sair?");

      if (shouldLogout) {
        fetch("../../backend/api/logout.php", { credentials: "same-origin" })
          .catch(() => {})
          .finally(() => {
            window.location.href = "../../pages/Login/index.html";
          });
      }
    });
  }
}

function setupMobileMenu(shell) {
  const toggle = shell.querySelector(".sidebar-toggle");
  const overlay = shell.querySelector(".sidebar-overlay");
  const closeBtn = shell.querySelector(".sidebar__close");
  const sidebar = shell.querySelector(".sidebar");
  const navLinks = shell.querySelectorAll(".sidebar__link");

  if (!toggle || !sidebar) return;

  const mobileQuery = window.matchMedia("(max-width: 900px)");

  function setOpen(isOpen) {
    shell.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("sidebar-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  }

  function closeMenu() {
    setOpen(false);
  }

  toggle.addEventListener("click", () => {
    setOpen(!shell.classList.contains("is-open"));
  });

  overlay?.addEventListener("click", closeMenu);
  closeBtn?.addEventListener("click", closeMenu);

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileQuery.matches) {
        closeMenu();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && shell.classList.contains("is-open")) {
      closeMenu();
    }
  });

  mobileQuery.addEventListener("change", (event) => {
    if (!event.matches) {
      closeMenu();
    }
  });
}

class AppSidebar extends HTMLElement {
  connectedCallback() {
    const rootPrefix = this.getAttribute("root-prefix") || "../../";
    const explicitCurrent = this.getAttribute("current") || "";
    const logoSrc = resolveLogoSrc(rootPrefix, this.getAttribute("logo-src"));
    const logoAlt = this.getAttribute("logo-alt") || SIDEBAR_LOGO_ALT;
    const links = [
      {
        key: "dashboard",
        label: "Dashboard",
        href: `${rootPrefix}pages/dashboard/index.html`,
      },
      {
        key: "audiencias",
        label: "Audiências",
        href: `${rootPrefix}pages/audiencias/index.html`,
      },
      {
        key: "agenda",
        label: "Agenda",
        href: `${rootPrefix}pages/agenda/index.html`,
      },
      {
        key: "processos",
        label: "Processos",
        href: `${rootPrefix}pages/processos/index.html`,
      },
      {
        key: "documentos",
        label: "Documentos",
        href: `${rootPrefix}pages/documentos/index.html`,
      },
      {
        key: "configuracoes",
        label: "Configurações",
        href: `${rootPrefix}pages/configuracoes/index.html`,
      },
    ];

    const current = resolveCurrentPage(explicitCurrent, links);

    this.innerHTML = `
      <div class="sidebar-shell">
        <div class="sidebar-mobile-bar">
          <button
            class="sidebar-toggle"
            type="button"
            aria-label="Abrir menu"
            aria-expanded="false"
            aria-controls="sidebar-panel"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <span class="sidebar-mobile-bar__title">Project Adv</span>
        </div>

        <div class="sidebar-overlay" aria-hidden="true"></div>

        <aside class="sidebar" id="sidebar-panel" aria-label="Menu lateral principal">
          <div class="sidebar__header">
            <div class="sidebar__logo">
              <div class="sidebar__logo-badge-wrap">
                <img
                  class="sidebar__logo-badge"
                  src="${logoSrc}"
                  alt="${logoAlt}"
                />
              </div>
              <div class="sidebar__logo-text">
                <strong>JURIS GESTOR</strong>
                <small>Processos Jurídicos</small>
              </div>
            </div>
            <button class="sidebar__close" type="button" aria-label="Fechar menu">&times;</button>
          </div>

          <nav class="sidebar__nav" aria-label="Navegacao">
            ${links
              .map(
                (link) =>
                  `<a class="sidebar__link ${current === link.key ? "is-active" : ""}" href="${link.href}">${link.label}</a>`,
              )
              .join("")}
          </nav>

          <a class="sidebar__link sidebar__logout" href="#" data-logout="true">Sair</a>
        </aside>
      </div>
    `;

    const shell = this.querySelector(".sidebar-shell");
    const sidebar = this.querySelector(".sidebar");
    bindSidebarEvents(sidebar);
    setupMobileMenu(shell);
  }
}

if (!customElements.get("app-sidebar")) {
  customElements.define("app-sidebar", AppSidebar);
}

document.querySelectorAll(".sidebar").forEach((sidebar) => {
  if (!sidebar.closest("app-sidebar")) {
    bindSidebarEvents(sidebar);
  }
});
