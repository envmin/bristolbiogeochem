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

    // --- Nav label: "Mineralogy" turns into "Solutions" ---
    // Each word is split into letters so they can appear one by one in a
    // scrambled order. Screen readers get the plain word. The change plays once
    // per visit, within five seconds, and otherwise on hover or keyboard focus.
    const cycle = document.querySelector(".brand-cycle");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (cycle && cycle.dataset.alt && !reduceMotion) {
        const words = [cycle.textContent.trim(), cycle.dataset.alt];
        const art = document.createElement("span");
        art.className = "brand-cycle-art";
        art.setAttribute("aria-hidden", "true");

        words.forEach((word, w) => {
            const wordEl = document.createElement("span");
            wordEl.className = w === 0 ? "brand-word brand-word-main" : "brand-word brand-word-alt";
            [...word].forEach((letter, i) => {
                const span = document.createElement("span");
                span.textContent = letter;
                // (i * 7) % length visits every letter once, in a jumbled order
                span.style.setProperty("--delay", `${((i * 7) % word.length) * 0.06}s`);
                wordEl.appendChild(span);
            });
            art.appendChild(wordEl);
        });

        const label = document.createElement("span");
        label.className = "visually-hidden";
        label.textContent = words[0];
        cycle.replaceChildren(label, art);

        let introSeen = false;
        try {
            introSeen = sessionStorage.getItem("brandIntro") === "seen";
            sessionStorage.setItem("brandIntro", "seen");
        } catch (e) {
            // Storage can be blocked. The intro then plays on each page.
        }
        if (!introSeen) {
            art.classList.add("brand-intro");
            setTimeout(() => art.classList.remove("brand-intro"), 5000);
        }
    }

    // --- Photo carousels: previous and next buttons and a "2 / 9" count ---
    document.querySelectorAll("[data-carousel]").forEach(carousel => {
        const track = carousel.querySelector(".carousel-track");
        const controls = carousel.querySelector(".carousel-controls");
        const count = carousel.querySelector(".carousel-count");
        const total = track.children.length;
        let index = 0;
        let settle;

        const show = () => {
            count.textContent = `${index + 1} / ${total}`;
        };

        carousel.querySelectorAll("[data-step]").forEach(button => {
            button.addEventListener("click", () => {
                // Wrap round at either end
                index = (index + Number(button.dataset.step) + total) % total;
                track.scrollTo({ left: index * track.clientWidth });
                show();
            });
        });
        // After a swipe, or once a button scroll finishes, read the photo from the position
        track.addEventListener("scroll", () => {
            clearTimeout(settle);
            settle = setTimeout(() => {
                index = Math.round(track.scrollLeft / track.clientWidth);
                show();
            }, 120);
        }, { passive: true });
        controls.hidden = false;
    });

    // --- Pause buttons for moving content, such as the funder logos ---
    // The label stays "Pause …"; aria-pressed says whether it is paused.
    document.querySelectorAll("[data-pause-target]").forEach(button => {
        const target = document.getElementById(button.dataset.pauseTarget);
        if (!target) return;
        button.addEventListener("click", () => {
            const paused = target.classList.toggle("is-paused");
            button.setAttribute("aria-pressed", String(paused));
        });
    });

    // --- "Read more" for long text, such as the outreach cards ---
    // Text marked data-clamp is cut to a few lines. A button is added only when
    // something is actually hidden, and moving keyboard focus inside opens it.
    document.querySelectorAll("[data-clamp]").forEach(box => {
        box.classList.add("is-clamped");
        if (box.scrollHeight <= box.clientHeight + 2) {
            box.classList.remove("is-clamped");
            return;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.className = "more-toggle";
        button.setAttribute("aria-controls", box.id);

        const setOpen = open => {
            box.classList.toggle("is-clamped", !open);
            button.setAttribute("aria-expanded", String(open));
            button.textContent = open ? "Show less" : "Read more";
        };
        setOpen(false);
        button.addEventListener("click", () => setOpen(box.classList.contains("is-clamped")));
        box.addEventListener("focusin", () => setOpen(true));
        box.after(button);

        // A click elsewhere on the card opens or closes it too, except on its links,
        // buttons, photo carousel or video, or when someone has just selected text
        const card = box.closest(".outreach-card");
        if (card) {
            card.classList.add("card-clickable");
            card.addEventListener("click", event => {
                if (event.target.closest("a, button, .carousel, .video-wrapper")) return;
                if (String(window.getSelection())) return;
                setOpen(box.classList.contains("is-clamped"));
            });
        }
    });

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

    // Line icons drawn in the header text colour, so they match on every device (emoji do not)
    const ICONS = {
        sun: ["M12 4V2", "M12 22v-2", "M4 12H2", "M22 12h-2", "M5.6 5.6 4.2 4.2", "M19.8 19.8l-1.4-1.4",
              "M5.6 18.4l-1.4 1.4", "M19.8 4.2l-1.4 1.4"],
        moon: ["M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"]
    };

    function themeIcon(name) {
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.setAttribute("aria-hidden", "true");
        if (name === "sun") {
            const circle = document.createElementNS(ns, "circle");
            circle.setAttribute("cx", "12");
            circle.setAttribute("cy", "12");
            circle.setAttribute("r", "4");
            svg.appendChild(circle);
        }
        ICONS[name].forEach(d => {
            const path = document.createElementNS(ns, "path");
            path.setAttribute("d", d);
            svg.appendChild(path);
        });
        return svg;
    }

    function updateThemeButton() {
        if (!themeButton) return;
        const dark = isDark();
        themeButton.replaceChildren(themeIcon(dark ? "sun" : "moon"));
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
