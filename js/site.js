// Shared page behaviour: mobile menu and light/dark theme toggle.
// The saved theme is applied by a small inline script in each page's <head>,
// so the page does not flash the wrong colours while loading.

(function () {
    const root = document.documentElement;
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // --- Mobile menu ---
    const menuButton = document.querySelector(".menu-toggle");
    const menu = document.getElementById("site-menu");

    function setMenu(open) {
        menuButton.setAttribute("aria-expanded", String(open));
        menu.classList.toggle("open", open);
    }

    if (menuButton && menu) {
        menuButton.addEventListener("click", () => {
            setMenu(menuButton.getAttribute("aria-expanded") !== "true");
        });
        menu.addEventListener("click", e => {
            if (e.target.closest("a")) setMenu(false);
        });
        document.addEventListener("keydown", e => {
            if (e.key === "Escape") setMenu(false);
        });
    }

    // --- Copyright year (the 2026 in the HTML is the fallback without JavaScript) ---
    document.querySelectorAll(".current-year").forEach(node => {
        node.textContent = new Date().getFullYear();
    });

    // --- Theme toggle ---
    const themeButton = document.getElementById("theme-toggle");

    function isDark() {
        const chosen = root.getAttribute("data-theme");
        return chosen ? chosen === "dark" : darkQuery.matches;
    }

    function updateThemeButton() {
        if (!themeButton) return;
        const dark = isDark();
        themeButton.textContent = dark ? "☀️" : "🌙";
        themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }

    if (themeButton) {
        themeButton.addEventListener("click", () => {
            const next = isDark() ? "light" : "dark";
            root.setAttribute("data-theme", next);
            try {
                localStorage.setItem("theme", next);
            } catch (e) {
                // Storage can be blocked. The theme still changes for this page.
            }
            updateThemeButton();
        });
        darkQuery.addEventListener("change", updateThemeButton);
        updateThemeButton();
    }
})();

// GoatCounter click events. Counts links marked with data-track="name",
// email links, and links to other sites (publication DOIs, BioXtract and so on).
// Does nothing if GoatCounter has not loaded or is blocked.
document.addEventListener("click", e => {
    const link = e.target.closest("a[href]");
    if (!link || !window.goatcounter || !window.goatcounter.count) return;

    let name = link.dataset.track;
    if (!name && link.protocol === "mailto:") name = "email";
    if (!name && link.host && link.host !== location.host) name = `outbound: ${link.host}${link.pathname}`;
    if (!name) return;

    window.goatcounter.count({
        path: name,
        title: (link.textContent || "").trim().slice(0, 120),
        event: true
    });
});

// Sections filled from CSV files change height as they load, which can leave a
// link such as /#people pointing at the wrong place. Once everything has
// loaded, jump to the target again, unless the reader has already moved.
function scrollToHashWhenReady(loading) {
    if (!location.hash) return;

    let readerMoved = false;
    const moved = () => { readerMoved = true; };
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(type =>
        window.addEventListener(type, moved, { once: true, passive: true })
    );

    Promise.allSettled(loading).then(() => {
        if (readerMoved) return;
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    });
}
