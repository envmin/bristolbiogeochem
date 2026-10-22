// Group members, read from csv/people.csv.
// Columns: Prefix, Name, Role, email, Photo, Start, End, Description.
// Photo is a filename inside images/people/. Start and End are DD.MM.YYYY.

const PEOPLE_CSV = "csv/people.csv";
const PEOPLE_PHOTO_DIR = "images/people/";

// DD.MM.YYYY → Date
function parseDate(d) {
    const [day, month, year] = (d || "").split(".").map(x => parseInt(x, 10));
    return new Date(year, month - 1, day);
}

// People whose start date is still in the future are not shown yet.
function isFutureStart(start) {
    return parseDate(start) > new Date();
}

function isCurrent(start, end) {
    const today = new Date();
    return parseDate(start) <= today && parseDate(end) >= today;
}

// "2020 - Present", "2019 - 2023" or "2021" when start and end share a year.
function displayDateRange(start, end) {
    const startYear = parseDate(start).getFullYear();
    const endDate = parseDate(end);

    if (endDate > new Date()) return `${startYear} - Present`;
    if (startYear === endDate.getFullYear()) return `${startYear}`;
    return `${startYear} - ${endDate.getFullYear()}`;
}

function fullName(p) {
    return [p.Prefix, p.Name].filter(Boolean).join(" ");
}

// "James M Byrne" → "JB"
function initials(name) {
    const parts = (name || "").split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
}

function initialsAvatar(name) {
    const avatar = el("div", "person-photo person-initials", initials(name));
    avatar.setAttribute("aria-hidden", "true");
    return avatar;
}

// Photo from the CSV, falling back to initials if it is missing or fails to load.
function personPhoto(p) {
    if (!p.Photo) return initialsAvatar(p.Name);

    const img = el("img", "person-photo");
    img.src = PEOPLE_PHOTO_DIR + p.Photo;
    img.alt = `Photo of ${p.Name}`;
    img.width = 160;
    img.height = 160;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => img.replaceWith(initialsAvatar(p.Name)), { once: true });
    return img;
}

// Open one bio and close any other. The open card spans the whole row (see
// .person-open). Where the browser supports view transitions, the cards glide
// to their new places instead of jumping.
let personCount = 0;

function setBioOpen(bio, open) {
    document.querySelectorAll(".person-bio[open]").forEach(other => {
        if (other !== bio) {
            other.open = false;
            other.closest(".person").classList.remove("person-open");
        }
    });
    bio.open = open;
    bio.closest(".person").classList.toggle("person-open", open);
}

function personCard(p) {
    const card = el("article", "person");
    card.style.viewTransitionName = `person-${++personCount}`;
    card.appendChild(personPhoto(p));

    const text = el("div", "person-text");
    text.appendChild(el("h3", "person-name", fullName(p)));
    text.appendChild(el("p", "person-role", p.Role));
    text.appendChild(el("p", "person-dates", displayDateRange(p.Start, p.End)));

    if (p.email) {
        const email = el("p", "person-email");
        const link = el("a", null, p.email);
        link.href = `mailto:${p.email}`;
        email.appendChild(link);
        text.appendChild(email);
    }

    // The bio is folded away behind "Read more" so the cards stay short
    if (p.Description) {
        const bio = el("details", "person-bio");
        const summary = el("summary");
        summary.appendChild(el("span", "bio-more", "Read more"));
        summary.appendChild(el("span", "bio-less", "Show less"));
        summary.appendChild(el("span", "visually-hidden", ` about ${p.Name}`));
        bio.appendChild(summary);
        bio.appendChild(el("p", "person-description", p.Description));

        summary.addEventListener("click", event => {
            event.preventDefault();
            const open = !bio.open;
            const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (document.startViewTransition && !calm) {
                const transition = document.startViewTransition(() => setBioOpen(bio, open));
                // A quick second click skips the first animation; that is fine, so ignore it
                transition.ready.catch(() => {});
                transition.finished.then(() => { if (open) card.scrollIntoView({ block: "nearest" }); });
            } else {
                setBioOpen(bio, open);
                if (open) card.scrollIntoView({ block: "nearest" });
            }
        });
        // Keeps the card in step if the bio is opened another way, such as find in page
        bio.addEventListener("toggle", () => {
            if (bio.open) setBioOpen(bio, true);
            else card.classList.remove("person-open");
        });
        text.appendChild(bio);
    }

    card.appendChild(text);
    return card;
}

// Group people by Role, keeping the order in which roles first appear in the CSV.
function groupByRole(people) {
    const groups = new Map();
    people.forEach(p => {
        if (!groups.has(p.Role)) groups.set(p.Role, []);
        groups.get(p.Role).push(p);
    });
    return groups;
}

// Current members share one grid, ordered by role, with the role on each card.
function renderCurrent(container, people) {
    const grid = el("div", "people-grid");
    groupByRole(people).forEach(members => {
        members.forEach(p => grid.appendChild(personCard(p)));
    });
    container.replaceChildren(grid);
}

// Former members are listed by name and years only, without photos.
function renderFormer(container, people) {
    container.replaceChildren();
    groupByRole(people).forEach((members, role) => {
        const block = el("div", "role-block");
        block.appendChild(el("h3", "role-title", role));
        const list = el("ul", "former-list");
        members.forEach(p => {
            list.appendChild(el("li", null, `${fullName(p)} (${displayDateRange(p.Start, p.End)})`));
        });
        block.appendChild(list);
        container.appendChild(block);
    });
}

function renderPeople(currentEl, formerEl, formerBlock) {
    return loadCSV(PEOPLE_CSV)
        .then(rows => {
            const current = [];
            const former = [];

            rows.forEach(p => {
                if (!p.Role) return;
                if (isFutureStart(p.Start)) return;
                (isCurrent(p.Start, p.End) ? current : former).push(p);
            });

            renderCurrent(currentEl, current);
            renderFormer(formerEl, former);
            formerBlock.hidden = former.length === 0;
        })
        .catch(err => showLoadError(currentEl, "group members", err));
}
