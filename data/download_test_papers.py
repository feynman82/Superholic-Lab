#!/usr/bin/env python3
"""
Superholic Lab — Past Year Papers Downloader v2
================================================
FIX: v1 hit bare /p4/ URLs which return 0 results.
     v2 uses the correct filter query string for each level+subject,
     which is how the site's search form actually works.

Source : https://www.testpapersfree.com  (free public downloads, no login)
Purpose: Reference material for Superholic Lab question bank design.
         Papers are NOT reproduced as questions.

Usage:
    pip install requests beautifulsoup4
    python data/scripts/download_test_papers.py

Output: D:\\Git\\Superholic-Lab\\data\\past_year_papers\\
"""

import os
import re
import time
import json
import logging
import requests
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from datetime import datetime

# ─────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────

BASE_URL = "https://www.testpapersfree.com"
OUTPUT_ROOT = Path(r"D:\Git\Superholic-Lab\data\past_year_papers")

# The correct filter URL pattern discovered from the site's search form:
# https://www.testpapersfree.com/p5/?level=P5&year=%25&subject=Maths&type=%25&school=%25&Submit=Show+Test+Papers
# %25 = URL-encoded % which means "All" in this site's filter logic

FILTER_URL_TEMPLATE = (
    "{base}/{level_lower}/"
    "?level={level_upper}"
    "&year=%25"
    "&subject={subject}"
    "&type=%25"
    "&school=%25"
    "&Submit=Show+Test+Papers"
)

# Subjects to download per level
# Science not in MOE P1/P2 syllabus
LEVEL_CONFIG = {
    "p1": {"upper": "P1", "subjects": ["English", "Maths"]},
    "p2": {"upper": "P2", "subjects": ["English", "Maths"]},
    "p3": {"upper": "P3", "subjects": ["English", "Maths", "Science"]},
    "p4": {"upper": "P4", "subjects": ["English", "Maths", "Science"]},
    "p5": {"upper": "P5", "subjects": ["English", "Maths", "Science"]},
    "p6": {"upper": "P6", "subjects": ["English", "Maths", "Science"]},
}

LEVEL_FOLDER = {
    "p1": "P1_Primary1",
    "p2": "P2_Primary2",
    "p3": "P3_Primary3",
    "p4": "P4_Primary4",
    "p5": "P5_Primary5",
    "p6": "P6_Primary6_PSLE",
}

# How many papers to download per level (across all subjects combined)
# Set high — natural cap is whatever the site has
MAX_PER_LEVEL = 200

# Polite delay between HTTP requests (seconds)
REQUEST_DELAY = 1.5

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": BASE_URL,
    "Accept-Language": "en-SG,en;q=0.9",
}

# ─────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────

OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
log_path = OUTPUT_ROOT / "download_log.txt"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    handlers=[
        logging.FileHandler(log_path, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# HTTP SESSION
# ─────────────────────────────────────────────────────────────

session = requests.Session()
session.headers.update(HEADERS)


def get_page(url: str, retries: int = 3) -> BeautifulSoup | None:
    for attempt in range(1, retries + 1):
        try:
            resp = session.get(url, timeout=25)
            resp.raise_for_status()
            time.sleep(REQUEST_DELAY)
            return BeautifulSoup(resp.text, "html.parser")
        except Exception as exc:
            wait = REQUEST_DELAY * (attempt + 1)
            log.warning(f"  Attempt {attempt}/{retries} failed ({exc}). Retrying in {wait:.0f}s…")
            time.sleep(wait)
    log.error(f"  Gave up fetching: {url}")
    return None


# ─────────────────────────────────────────────────────────────
# CRAWL FILTER PAGE — extract all paper links for one level+subject
# ─────────────────────────────────────────────────────────────

def build_filter_url(level_lower: str, level_upper: str, subject: str) -> str:
    return FILTER_URL_TEMPLATE.format(
        base=BASE_URL,
        level_lower=level_lower,
        level_upper=level_upper,
        subject=subject,
    )


def scrape_paper_list(level_lower: str, level_upper: str, subject: str) -> list[dict]:
    """
    Fetch the filter results page for a given level+subject.
    Returns list of {"title": str, "show_url": str, "subject": str}
    """
    url = build_filter_url(level_lower, level_upper, subject)
    log.info(f"  Crawling: {url}")
    soup = get_page(url)
    if not soup:
        return []

    papers = []
    # All paper links point to show.php?testpaperid=NNNNN
    for a in soup.find_all("a", href=re.compile(r"show\.php\?testpaperid=\d+")):
        title = a.get_text(strip=True)
        if not title:
            continue
        show_url = urljoin(BASE_URL, a["href"])
        papers.append({
            "title": title,
            "show_url": show_url,
            "subject": subject.lower(),
        })

    log.info(f"    → {len(papers)} papers found for {level_upper} {subject}")
    return papers


# ─────────────────────────────────────────────────────────────
# RESOLVE PDF URL FROM SHOW PAGE
# ─────────────────────────────────────────────────────────────

def resolve_pdf_url(show_url: str, title: str) -> str | None:
    """
    Visit the show page and find the <a href="...pdf"> download link.
    Falls back to a constructed URL if the link isn't found in HTML.
    """
    soup = get_page(show_url)
    if soup:
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.lower().endswith(".pdf"):
                return urljoin(BASE_URL, href)

    # Fallback: construct filename from title
    # Title examples: "P5 Maths 2025 WA1 - Ai Tong"
    #                 "Primary 5 English 2024 SA2 - Ai Tong"
    t = title.strip()
    t = re.sub(r"^Primary\s+(\d)", r"P\1", t, flags=re.IGNORECASE)
    t = t.replace(" - ", " ").replace("-", " ")
    filename = "_".join(t.split()) + ".pdf"
    constructed = f"{BASE_URL}/pdfs/{filename}"
    log.warning(f"    PDF link not found in HTML, trying constructed: {filename}")
    return constructed


# ─────────────────────────────────────────────────────────────
# DOWNLOAD PDF
# ─────────────────────────────────────────────────────────────

def download_pdf(pdf_url: str, dest_path: Path) -> str:
    """
    Download PDF to dest_path.
    Returns: "new" | "exists" | "failed"
    """
    if dest_path.exists() and dest_path.stat().st_size > 1024:
        return "exists"

    try:
        resp = session.get(pdf_url, timeout=40, stream=True)
        resp.raise_for_status()

        content_type = resp.headers.get("content-type", "").lower()
        if "html" in content_type:
            # Got a web page instead of PDF — constructed URL was wrong
            log.warning(f"    Got HTML instead of PDF for {pdf_url} — skipping")
            return "failed"

        dest_path.parent.mkdir(parents=True, exist_ok=True)
        with open(dest_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=16384):
                f.write(chunk)

        size_kb = dest_path.stat().st_size // 1024
        if size_kb < 5:
            dest_path.unlink()
            log.warning(f"    File too small ({size_kb}KB), likely error page — removed")
            return "failed"

        log.info(f"    ✓ {dest_path.name}  ({size_kb} KB)")
        time.sleep(REQUEST_DELAY)
        return "new"

    except Exception as exc:
        log.error(f"    ✗ Download error: {exc}")
        if dest_path.exists():
            dest_path.unlink()
        return "failed"


# ─────────────────────────────────────────────────────────────
# PROCESS ONE LEVEL
# ─────────────────────────────────────────────────────────────

def process_level(level_lower: str) -> dict:
    cfg = LEVEL_CONFIG[level_lower]
    level_upper = cfg["upper"]
    subjects = cfg["subjects"]

    folder = OUTPUT_ROOT / LEVEL_FOLDER[level_lower]
    folder.mkdir(parents=True, exist_ok=True)
    for subj in subjects:
        (folder / subj).mkdir(exist_ok=True)

    log.info(f"\n{'='*60}")
    log.info(f"Level: {level_upper}  |  Subjects: {', '.join(subjects)}")
    log.info(f"{'='*60}")

    # Collect all papers across subjects for this level
    all_papers: list[dict] = []
    for subject in subjects:
        papers = scrape_paper_list(level_lower, level_upper, subject)
        all_papers.extend(papers)

    log.info(f"\n  Total papers found for {level_upper}: {len(all_papers)}")

    stats = {
        "level": level_upper,
        "found": len(all_papers),
        "downloaded": 0,
        "skipped": 0,
        "failed": 0,
    }
    index_entries = []
    processed = 0

    for paper in all_papers:
        if processed >= MAX_PER_LEVEL:
            log.info(f"  Reached MAX_PER_LEVEL={MAX_PER_LEVEL} for {level_upper}, stopping.")
            break

        title = paper["title"]
        subject = paper["subject"]  # lowercase: "english" / "maths" / "science"
        show_url = paper["show_url"]

        log.info(f"\n  [{level_upper} | {subject.capitalize()} | {processed+1}] {title}")

        pdf_url = resolve_pdf_url(show_url, title)
        if not pdf_url:
            stats["failed"] += 1
            processed += 1
            continue

        # Build safe filename: replace any forbidden chars
        safe_name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", title).strip() + ".pdf"
        dest = folder / subject.capitalize() / safe_name

        result = download_pdf(pdf_url, dest)
        if result == "new":
            stats["downloaded"] += 1
        elif result == "exists":
            stats["skipped"] += 1
            log.info(f"    SKIP (already exists): {safe_name}")
        else:
            stats["failed"] += 1

        index_entries.append({
            "title": title,
            "subject": subject,
            "file": str(dest.relative_to(OUTPUT_ROOT)),
            "show_url": show_url,
            "pdf_url": pdf_url,
            "status": result,
        })
        processed += 1

    write_index(folder, level_upper, index_entries)
    return stats


# ─────────────────────────────────────────────────────────────
# INDEX FILES
# ─────────────────────────────────────────────────────────────

def write_index(level_dir: Path, level_upper: str, entries: list[dict]):
    lines = [
        f"# {level_upper} — Past Year Papers Index",
        f"",
        f"**Source:** https://www.testpapersfree.com (free public downloads)",
        f"**Purpose:** Reference for question bank design — Superholic Lab",
        f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"**Total:** {len(entries)} papers",
        f"",
        f"| # | Title | Subject | Status |",
        f"|---|-------|---------|--------|",
    ]
    for i, e in enumerate(entries, 1):
        lines.append(
            f"| {i} | {e['title']} | {e['subject'].capitalize()} | {e['status']} |"
        )
    (level_dir / "INDEX.md").write_text("\n".join(lines), encoding="utf-8")
    log.info(f"\n  INDEX.md written → {level_dir / 'INDEX.md'}")


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("Superholic Lab — Past Year Papers Downloader v2")
    log.info(f"Output: {OUTPUT_ROOT}")
    log.info(f"Subjects: English, Maths, Science (P1-P2 skip Science)")
    log.info(f"Max per level: {MAX_PER_LEVEL}")
    log.info("=" * 60)

    all_stats = []
    for level in ["p1", "p2", "p3", "p4", "p5", "p6"]:
        stats = process_level(level)
        all_stats.append(stats)
        log.info(
            f"\n[{stats['level']} DONE] "
            f"found={stats['found']}  "
            f"new={stats['downloaded']}  "
            f"skip={stats['skipped']}  "
            f"fail={stats['failed']}"
        )

    log.info("\n" + "=" * 60)
    log.info("FINAL SUMMARY")
    log.info("=" * 60)
    for s in all_stats:
        log.info(
            f"  {s['level']:<4}  "
            f"found={s['found']:<5}  "
            f"new={s['downloaded']:<5}  "
            f"skip={s['skipped']:<5}  "
            f"fail={s['failed']}"
        )
    log.info(f"\n  TOTAL downloaded : {sum(s['downloaded'] for s in all_stats)}")
    log.info(f"  TOTAL skipped    : {sum(s['skipped'] for s in all_stats)}")
    log.info(f"  TOTAL failed     : {sum(s['failed'] for s in all_stats)}")
    log.info(f"\n  Full log: {log_path}")

    manifest = OUTPUT_ROOT / "MANIFEST.json"
    manifest.write_text(
        json.dumps(
            {"generated": datetime.now().isoformat(), "levels": all_stats},
            indent=2,
        ),
        encoding="utf-8",
    )
    log.info(f"  Manifest: {manifest}")
    log.info("\nDone. ✓")


if __name__ == "__main__":
    main()