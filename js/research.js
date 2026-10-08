// Research themes, read from csv/research.csv.
// Columns: Topic, Photo (path from the site root, optional), Description, Link (optional).

const RESEARCH_CSV = "csv/research.csv";

function researchCard(topic) {
    const card = el("article", "research-card");

    if (topic.Photo) {
        // Shown whole on a white panel, so diagrams and photos are never cropped.
        // Decorative: the topic title next to it carries the meaning.
        const figure = el("div", "research-figure");
        const img = el("img", "research-image");
        img.src = topic.Photo;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("error", () => figure.remove(), { once: true });
        figure.appendChild(img);
        card.appendChild(figure);
    }

    const text = el("div", "research-text");
    text.appendChild(el("h3", "research-title", topic.Topic));
    if (topic.Description) text.appendChild(el("p", null, topic.Description));

    if (isWebLink(topic.Link)) {
        const more = el("p", "research-link");
        const link = el("a", null, `Visit ${new URL(topic.Link).hostname.replace(/^www\./, "")}`);
        link.href = topic.Link;
        link.target = "_blank";
        link.rel = "noopener";
        more.appendChild(link);
        text.appendChild(more);
    }
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
