// Publications, read from the CSV that the weekly GitHub Action updates.
// Used by publications.html (full list) and index.html (highlights and key papers).

const PUBLICATIONS_CSV = "csv/PublicationList_vCSV.csv";
const KEY_PAPERS_CSV = "csv/key_papers.csv";

// "https://doi.org/10.1000/ABC" and "10.1000/abc" both become "10.1000/abc".
function normaliseDOI(doi) {
    return (doi || "")
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
        .replace(/^doi:\s*/, "");
}

function isWebLink(url) {
    return /^https?:\/\//i.test(url || "");
}

// Newest first. The CSV is already sorted by the update script, and the sort
// is stable, so the order within a year is kept.
function loadPublications() {
    return loadCSV(PUBLICATIONS_CSV).then(rows =>
        rows
            .filter(p => p.Title)
            .sort((a, b) => (Number(b.Year) || 0) - (Number(a.Year) || 0))
    );
}

// One publication. headingTag sets the title's heading level for the page outline.
function pubCard(pub, headingTag, showYear) {
    const card = el("article", "pub-card");

    const heading = el(headingTag, "pub-title");
    if (isWebLink(pub.DOI)) {
        const link = el("a", null, pub.Title);
        link.href = pub.DOI;
        link.rel = "noopener";
        heading.appendChild(link);
    } else {
        heading.textContent = pub.Title;
    }
    card.appendChild(heading);

    if (pub.Authors) card.appendChild(el("p", "pub-authors", pub.Authors));

    const meta = [pub.Journal, showYear ? pub.Year : ""].filter(Boolean).join(", ");
    if (meta) card.appendChild(el("p", "pub-journal", meta));

    return card;
}

// Full list grouped by year, with a row of year links at the top.
function renderPublicationList(container, yearNav) {
    return loadPublications()
        .then(pubs => {
            const years = [];
            const byYear = {};
            pubs.forEach(p => {
                const year = p.Year || "Undated";
                if (!byYear[year]) {
                    byYear[year] = [];
                    years.push(year);
                }
                byYear[year].push(p);
            });

            container.replaceChildren();
            yearNav.replaceChildren();

            years.forEach(year => {
                const block = el("section", "year-block");
                block.id = `y${year}`;
                block.setAttribute("aria-labelledby", `y${year}-title`);

                const title = el("h2", "year-title", year);
                title.id = `y${year}-title`;
                block.appendChild(title);

                byYear[year].forEach(p => block.appendChild(pubCard(p, "h3", false)));
                container.appendChild(block);

                const li = el("li");
                const link = el("a", null, year);
                link.href = `#y${year}`;
                li.appendChild(link);
                yearNav.appendChild(li);
            });
        })
        .catch(err => showLoadError(container, "publications", err));
}

// Home page: the newest few papers, and the key papers James lists by DOI.
function renderHomePublications(highlightsEl, keyPapersEl, keyPapersBlock, count) {
    const pubsLoaded = loadPublications();

    const highlights = pubsLoaded.then(pubs => {
        highlightsEl.replaceChildren(...pubs.slice(0, count).map(p => pubCard(p, "h4", true)));
    });

    const keyPapers = Promise.all([pubsLoaded, loadCSV(KEY_PAPERS_CSV)]).then(([pubs, keyRows]) => {
        const byDOI = new Map(pubs.map(p => [normaliseDOI(p.DOI), p]));
        const cards = [];

        keyRows.forEach(row => {
            const doi = normaliseDOI(row.DOI);
            if (!doi) return;
            const pub = byDOI.get(doi);
            if (pub) {
                cards.push(pubCard(pub, "h4", true));
            } else {
                console.warn(`TODO: key paper ${row.DOI} is not in ${PUBLICATIONS_CSV}`);
            }
        });

        keyPapersEl.replaceChildren(...cards);
        keyPapersBlock.hidden = cards.length === 0;
    });

    highlights.catch(err => showLoadError(highlightsEl, "publications", err));
    keyPapers.catch(err => {
        keyPapersBlock.hidden = true;
        console.error(err);
    });

    return Promise.allSettled([highlights, keyPapers]);
}
