// Shared helpers for loading CSV data and building DOM safely.
// Requires PapaParse (loaded before this file).

// Load a CSV file and resolve with an array of row objects keyed by header.
function loadCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: "greedy",
            transformHeader: h => h.replace(/^﻿/, "").trim(),
            transform: v => (typeof v === "string" ? v.trim() : v),
            complete: results => resolve(results.data),
            error: err => reject(err)
        });
    });
}

// Create an element with an optional class and text content.
// Text is always set with textContent, so CSV data is never parsed as HTML.
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null && text !== "") node.textContent = text;
    return node;
}

// Show a short message in a container when its data fails to load.
function showLoadError(container, what, err) {
    container.replaceChildren(el("p", "load-error", `Sorry, the ${what} could not be loaded.`));
    console.error(err);
}
