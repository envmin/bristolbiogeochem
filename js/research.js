// Research themes, read from csv/research.csv.
// Columns: Topic, Photo (path from the site root), Description.

const RESEARCH_CSV = "csv/research.csv";

function researchCard(topic) {
    const card = el("article", "research-card");

    if (topic.Photo) {
        // Decorative: the topic title next to it carries the meaning.
        const img = el("img", "research-image");
        img.src = topic.Photo;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("error", () => img.remove(), { once: true });
        card.appendChild(img);
    }

    const text = el("div", "research-text");
    text.appendChild(el("h3", "research-title", topic.Topic));
    if (topic.Description) text.appendChild(el("p", null, topic.Description));
    card.appendChild(text);

    return card;
}

function renderResearch(container) {
    return loadCSV(RESEARCH_CSV)
        .then(rows => {
            container.replaceChildren(...rows.filter(r => r.Topic).map(researchCard));
        })
        .catch(err => showLoadError(container, "research themes", err));
}
