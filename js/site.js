fetch("navbar.html")
    .then(r => r.text())
    .then(html => {
        document.getElementById("nav-placeholder").innerHTML = html;

        // attach hamburger behaviour
        const burger = document.querySelector(".hamburger");
        const menu = document.querySelector(".nav-links");

        if (burger && menu) {
            burger.addEventListener("click", () => {
                menu.classList.toggle("active");
            });
        }

        // theme toggle (in navbar)
        const toggle = document.getElementById("theme-toggle");
        if (toggle) {
            toggle.addEventListener("click", () => {
                const isDark = document.documentElement.getAttribute("data-theme") === "dark";
                if (isDark) {
                    document.documentElement.removeAttribute("data-theme");
                    localStorage.setItem("theme", "light");
                    toggle.textContent = "🌙";
                } else {
                    document.documentElement.setAttribute("data-theme", "dark");
                    localStorage.setItem("theme", "dark");
                    toggle.textContent = "☀️";
                }
            });
        }
    });

// restore saved theme
const saved = localStorage.getItem("theme");
if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
}