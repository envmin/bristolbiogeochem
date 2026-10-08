#!/usr/bin/env python3
import requests
import csv
from pathlib import Path

# === EDIT THIS ===
ORCID_ID = "0000-0002-4399-7336"   # your real ORCID
CSV_FILE = Path("csv/PublicationList_vCSV.csv")

ORCID_API = f"https://pub.orcid.org/v3.0/{ORCID_ID}/works"
HEADERS = {"Accept": "application/json"}

import requests

# Added note to keep github actions working.

def fetch_full_work(put_code):
    """Fetch full ORCID work record to extract authors."""
    url = f"https://pub.orcid.org/v3.0/{ORCID_ID}/work/{put_code}"
    r = requests.get(url, headers=HEADERS)
    r.raise_for_status()
    return r.json()


def fetch_crossref_metadata(doi):
    """Return CrossRef metadata for a DOI (journal, year)."""
    if not doi:
        return {}

    url = f"https://api.crossref.org/works/{doi}"
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json().get("message", {})

        journal = ""
        year = ""

        # Journal title
        if "container-title" in data and isinstance(data["container-title"], list):
            if data["container-title"]:
                journal = data["container-title"][0]

        # Date (print preferred, online as fallback)
        date_parts = []
        for field in ("published-print", "published-online"):
            parts = data.get(field, {}).get("date-parts", [[]])
            if parts and parts[0]:
                date_parts = parts[0]
                break

        year = str(date_parts[0]) if len(date_parts) > 0 else ""
        month = date_parts[1] if len(date_parts) > 1 else 0
        day = date_parts[2] if len(date_parts) > 2 else 0

        return {
            "journal": journal,
            "year": year,
            "month": month,
            "day": day,
        }

    except Exception:
        return {}


def get_orcid_works():
    """Fetch ORCID works + full author list + CrossRef metadata fallback."""
    r = requests.get(ORCID_API, headers=HEADERS)
    r.raise_for_status()
    data = r.json()

    works = []

    for group in data.get("group", []):
        summary = group.get("work-summary", [{}])[0]

        # ---- ORCID Title ----
        title_obj = summary.get("title") or {}
        title_value = title_obj.get("title") or {}
        title = title_value.get("value", "")

        # ---- ORCID Year ----
        pub_date = summary.get("publication-date") or {}
        year_field = pub_date.get("year") or {}
        year = year_field.get("value", "")
        month = to_int((pub_date.get("month") or {}).get("value"))
        day = to_int((pub_date.get("day") or {}).get("value"))

        # ---- ORCID Journal ----
        journal_field = summary.get("journal-title")
        journal = journal_field.get("value") if isinstance(journal_field, dict) else ""

        # ---- DOI ----
        doi = None
        ext_ids = summary.get("external-ids", {}).get("external-id", [])
        for ext in ext_ids:
            if ext.get("external-id-type") == "doi":
                doi = ext.get("external-id-value")
                break

        # ---- Authors (from full ORCID work record) ----
        
        
        # ---- Authors (from full ORCID work record) ----
        authors = []
        put_code = summary.get("put-code")

        if put_code is not None:
            full = fetch_full_work(put_code)

            contribs = full.get("contributors")
            if isinstance(contribs, dict):
                contributor_list = contribs.get("contributor", [])

                #print(contributor_list)
                
                if isinstance(contributor_list, list):
                    for c in contributor_list:

                        # Your JSON: credit-name -> { "value": "Last, First" }
                        credit_name = c.get("credit-name")
                        if isinstance(credit_name, dict):
                            name = credit_name.get("value")
                            if name:
                                authors.append(name)
                                #print(authors)
                                continue

                        # Fallback: ORCID ID if no name
                        orcid_block = c.get("contributor-orcid")
                        if isinstance(orcid_block, dict):
                            path = orcid_block.get("path")
                            if path:
                                authors.append(path)
                                continue
                            
        
        # ---- CrossRef fallback (journal, year, authors) ----
        if doi:
            cr = fetch_crossref_metadata(doi)

            # Replace ORCID journal/year if missing
            if not journal:
                journal = cr.get("journal", journal)

            if not year:
                year = cr.get("year", year)

            # Month and day are only used to order papers within a year
            if not month:
                month, day = to_int(cr.get("month")), to_int(cr.get("day"))

            # Always prefer CrossRef authors unless ORCID explicitly listed some
            crossref_authors = cr.get("authors", [])
            if crossref_authors:
                authors = crossref_authors

        works.append({
            "Year": year,
            "Title": title,
            "Authors": ", ".join(authors),
            #"Authors": authors,
            "Journal": journal,
            "Journal data": "",
            "DOI": f"https://doi.org/{doi}" if doi else "",
            # Sort-only fields, not written to the CSV
            "_month": month,
            "_day": day,
        })

        print(works)
    return works

def to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def read_existing_csv():
    if not CSV_FILE.exists():
        return []

    with CSV_FILE.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def works_equal(a, b):
    """Compare publications by title + DOI."""
    return (
        a["Title"].strip().lower() == b["Title"].strip().lower()
        and a["DOI"].strip().lower() == b["DOI"].strip().lower()
    )


def merge_publications(existing, new):
    # Convert existing list → dict by DOI (or Title if DOI missing)
    existing_by_key = {}

    for e in existing:
        key = e["DOI"].lower() if e["DOI"] else e["Title"].lower()
        existing_by_key[key] = e

    # Merge new entries
    for w in new:
        key = w["DOI"].lower() if w["DOI"] else w["Title"].lower()

        if key in existing_by_key:
            # Update only missing fields
            for field, value in w.items():
                if existing_by_key[key].get(field) in ("", None):
                    existing_by_key[key][field] = value
            # Always take the latest month and day for sorting
            existing_by_key[key]["_month"] = w["_month"]
            existing_by_key[key]["_day"] = w["_day"]
        else:
            existing_by_key[key] = w

    return list(existing_by_key.values())

def write_csv(rows):
    fieldnames = ["#", "Year", "Title", "Authors", "Journal", "Journal data", "DOI"]

    # sort newest → oldest, using month and day within a year where ORCID or
    # CrossRef provide them (papers without a month go last in their year)
    rows_sorted = sorted(
        rows,
        key=lambda r: (r["Year"], to_int(r.get("_month")), to_int(r.get("_day"))),
        reverse=True,
    )

    # reassign numbering from top
    for i, row in enumerate(rows_sorted, start=1):
        row["#"] = i

    with CSV_FILE.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for r in rows_sorted:
            writer.writerow(r)


def main():
    print("Fetching ORCID data…")
    orcid_works = get_orcid_works()

    print(f"Found {len(orcid_works)} ORCID publications")

    print("Loading existing CSV…")
    existing = read_existing_csv()

    print("Merging…")
    merged = merge_publications(existing, orcid_works)

    print(f"Writing {len(merged)} records to CSV")
    write_csv(merged)

    print("✅ Done.")


if __name__ == "__main__":
    main()