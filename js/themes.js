// Research theme pages (research-*.html): who works on the theme, who funds it
// and its related papers. Requires csv.js, people.js and publications.js.
//
// Each theme has a short code. The same code is used in the Themes column of
// csv/people.csv (several codes separated by semicolons), in the Theme column of
// csv/theme_funding.csv and csv/theme_papers.csv, and in the page's call to
// renderThemePage(). Capitals and extra spaces do not matter.

const THEME_FUNDING_CSV = "csv/theme_funding.csv";
const THEME_PAPERS_CSV = "csv/theme_papers.csv";

// Every code that has a theme page. A code used in a CSV but missing here is
// reported in the browser console, so typos are easy to spot.
const THEME_CODES = [
    "biogeobatteries",
    "metals",
    "spectroscopy",
    "biomagnetism",
    "e-waste",
    "early earth & astrobiology",
    "water treatment"
];

// Other spellings that mean the same theme
const THEME_ALIASES = {
    "early earth": "early earth & astrobiology",
    "astrobiology": "early earth & astrobiology"
};

function normaliseTheme(code) {
    const clean = (code || "").trim().toLowerCase().replace(/\s+/g, " ");
    return THEME_ALIASES[clean] || clean;
}

// "metals; Biogeobatteries" → ["metals", "biogeobatteries"]
function themeCodes(value) {
    return (value || "").split(";").map(normaliseTheme).filter(Boolean);
}

function warnUnknownThemes(codes, file) {
    new Set(codes).forEach(code => {
        if (!THEME_CODES.includes(code)) {
            console.warn(`TODO: theme "${code}" in ${file} has no theme page`);
        }
    });
}

// One person in the "Working on this now" list: photo or initials, name and role.
function themePerson(p) {
    const item = el("li", "theme-person");
    item.appendChild(personPhoto(p));
    const text = el("div");
    text.appendChild(el("p", "theme-person-name", fullName(p)));
    text.appendChild(el("p", "theme-person-role", p.Role));
    item.appendChild(text);
    return item;
}

function renderThemePeople(code, currentEl, currentBlock, formerEl, formerBlock) {
    return loadCSV(PEOPLE_CSV).then(rows => {
        warnUnknownThemes(rows.flatMap(p => themeCodes(p.Themes)), PEOPLE_CSV);

        const current = [];
        const former = [];
        rows.forEach(p => {
            if (!p.Role || isFutureStart(p.Start)) return;
            if (!themeCodes(p.Themes).includes(code)) return;
            (isCurrent(p.Start, p.End) ? current : former).push(p);
        });

        // Current members ordered by role, as in the People section
        const ordered = [...groupByRole(current).values()].flat();
        currentEl.replaceChildren(...ordered.map(themePerson));
        currentBlock.hidden = ordered.length === 0;

        formerEl.replaceChildren(...former.map(p =>
            el("li", null, `${fullName(p)} (${displayDateRange(p.Start, p.End)})`)
        ));
        formerBlock.hidden = former.length === 0;
    });
}

// Funders listed once each, linked when the row has a web address.
function renderThemeFunding(code, fundingEl, fundingBlock) {
    return loadCSV(THEME_FUNDING_CSV).then(rows => {
        warnUnknownThemes(rows.map(r => normaliseTheme(r.Theme)).filter(Boolean), THEME_FUNDING_CSV);

        const seen = new Set();
        const items = [];
        rows.forEach(r => {
            if (normaliseTheme(r.Theme) !== code || !r.Funder) return;
            const key = `${r.Funder}|${r.Grant}`.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);

            const item = el("li");
            if (isWebLink(r.Link)) {
                const link = el("a", null, r.Funder);
                link.href = r.Link;
                link.target = "_blank";
                link.rel = "noopener";
                item.appendChild(link);
            } else {
                item.textContent = r.Funder;
            }
            if (r.Grant) item.appendChild(document.createTextNode(`, ${r.Grant}`));
            items.push(item);
        });

        fundingEl.replaceChildren(...items);
        fundingBlock.hidden = items.length === 0;
    });
}

// Papers chosen for the theme by DOI, looked up in the publications data.
function renderThemePapers(code, papersEl, papersBlock) {
    return Promise.all([loadPublications(), loadCSV(THEME_PAPERS_CSV)]).then(([pubs, rows]) => {
        const byDOI = new Map(pubs.map(p => [normaliseDOI(p.DOI), p]));
        const cards = [];
        rows.forEach(row => {
            if (normaliseTheme(row.Theme) !== code) return;
            const doi = normaliseDOI(row.DOI);
            if (!doi) return;
            const pub = byDOI.get(doi);
            if (pub) {
                cards.push(pubCard(pub, "h3", true));
            } else {
                console.warn(`TODO: theme paper ${row.DOI} is not in ${PUBLICATIONS_CSV}`);
            }
        });
        papersEl.replaceChildren(...cards);
        papersBlock.hidden = cards.length === 0;
    });
}

// Sections stay hidden until their data has loaded and has something to show.
function renderThemePage(code) {
    code = normaliseTheme(code);
    const byId = id => document.getElementById(id);

    const people = renderThemePeople(code, byId("theme-current"), byId("theme-current-block"),
        byId("theme-former"), byId("theme-former-block"));
    const funding = renderThemeFunding(code, byId("theme-funding"), byId("theme-funding-block"));
    const papers = renderThemePapers(code, byId("theme-papers"), byId("theme-papers-block"));

    [people, funding, papers].forEach(p => p.catch(err => console.error(err)));
    return Promise.allSettled([people, funding, papers]);
}
