#!/usr/bin/env python3
"""
Full course dump from mit.speakspeak.dk — captures ALL content types.

Unlike scrape-speakspeak.py (which only extracts H5P/quiz exercises), this script
dumps the entire course: pages, resources, folders, labels, URLs, assignments,
plus H5P and quizzes. Stores raw HTML, plain text, file downloads, and source URLs.

IMPORTANT: H5P exercises may show the user's previous (possibly wrong) answers.
The scraper fills dummy text and clicks "Vis løsning" to reveal correct answers.

Usage (via uv — always use uv, never pip directly):
  cd scripts

  # First run: interactive login, save cookies
  uv run python scrape-speakspeak-full.py --exam PD3M2 --interactive --save-cookies cookies.json

  # Subsequent runs: use saved cookies
  uv run python scrape-speakspeak-full.py --exam PD3M2 --cookies cookies.json --visible

  # Course page structure only (no individual page visits)
  uv run python scrape-speakspeak-full.py --exam PD3M2 --cookies cookies.json --no-navigate

  # Only specific types
  uv run python scrape-speakspeak-full.py --exam PD3M2 --cookies cookies.json --types page,resource,hvp

Output:
  scripts/data/speakspeak-full-{exam}_{timestamp}.json  — structured JSON dump
  scripts/data/speakspeak-index-{exam}_{timestamp}.txt  — human-readable index
  scripts/data/files/                                    — downloaded PDFs, DOCX, etc.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
from pathlib import Path
from datetime import datetime

try:
    from playwright.sync_api import (
        sync_playwright,
        Page,
        BrowserContext,
        TimeoutError as PlaywrightTimeout,
    )
except ImportError:
    print("ERROR: Run: cd scripts && uv sync && uv run playwright install chromium")
    sys.exit(1)

BASE_URL = "https://mit.speakspeak.dk"
MAX_HTML_SIZE = 100_000  # 100KB per item raw_html

EXAM_MAP: dict[str, tuple[str, int, str]] = {
    "PD2": ("modul 2", 2, "pd2"),
    "PD3M1": ("3.1", 3, "pd3m1"),
    "PD3M2": ("3.2", 3, "pd3m2"),
}


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
def clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(
        r"&nbsp;|&amp;|&lt;|&gt;",
        lambda m: {"&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">"}[m.group()],
        text,
    )
    return re.sub(r"\s+", " ", text).strip()


def now_iso() -> str:
    return datetime.now().astimezone().isoformat()


def truncate_html(html: str) -> str:
    if len(html) > MAX_HTML_SIZE:
        return html[:MAX_HTML_SIZE] + f"\n<!-- TRUNCATED: {len(html)} bytes total -->"
    return html


# ---------------------------------------------------------------------------
# Login (reused from scrape-speakspeak.py)
# ---------------------------------------------------------------------------
def login_interactive(page: Page) -> None:
    page.goto(f"{BASE_URL}/login/index.php", wait_until="domcontentloaded")
    print()
    print("  ┌─────────────────────────────────────────────────────┐")
    print("  │  Browser is open — log in to SpeakSpeak now        │")
    print("  │  Click 'Log in with Microsoft' and complete SSO    │")
    print("  │  The scraper continues when you reach the dashboard │")
    print("  └─────────────────────────────────────────────────────┘")
    print()
    try:
        page.wait_for_url(
            lambda url: "speakspeak.dk" in url
            and "/login/" not in url
            and "/auth/" not in url,
            timeout=180_000,
        )
        print(f"  ✓ Logged in ({page.url})")
    except PlaywrightTimeout:
        print("ERROR: Timed out waiting for manual login.")
        sys.exit(1)


def restore_cookies(context: BrowserContext, path: Path, page: Page) -> None:
    cookies = json.loads(path.read_text())
    context.add_cookies(cookies)
    page.goto(f"{BASE_URL}/my/", wait_until="networkidle", timeout=20000)
    if "/login/" in page.url:
        print("ERROR: Cookies expired. Re-run with --interactive.")
        sys.exit(1)
    print(f"  ✓ Session restored ({len(cookies)} cookies)")


def save_cookies(context: BrowserContext, path: Path) -> None:
    cookies = context.cookies()
    path.write_text(json.dumps(cookies, indent=2))
    print(f"  Saved {len(cookies)} cookies → {path}")


# ---------------------------------------------------------------------------
# Course discovery (reused)
# ---------------------------------------------------------------------------
def find_courses(page: Page, exam: str | None, all_courses: bool) -> list[dict]:
    page.goto(f"{BASE_URL}/my/courses.php", wait_until="networkidle", timeout=20000)
    seen: set[str] = set()
    courses: list[dict] = []

    for link in page.query_selector_all("a[href*='/course/view.php']"):
        href = link.get_attribute("href") or ""
        if href in seen:
            continue
        seen.add(href)
        name = clean(link.inner_text())
        url = href if href.startswith("http") else BASE_URL + href
        courses.append({"name": name, "url": url})

    print(f"  Enrolled courses ({len(courses)}):")
    for c in courses:
        print(f"    • {c['name']!r:50s}  {c['url']}")

    if all_courses or exam is None:
        return courses

    exam_upper = exam.upper()
    if exam_upper not in EXAM_MAP:
        print(f"\n  Unknown exam level {exam!r}. Valid: {list(EXAM_MAP.keys())}")
        return []

    course_filter, _level, _suffix = EXAM_MAP[exam_upper]
    matched = [c for c in courses if course_filter.lower() in c["name"].lower()]
    if not matched:
        print(f"\n  No courses matched {exam_upper!r} (looking for {course_filter!r}).")
        return []

    print(f"\n  Matched {len(matched)} course(s) for {exam_upper}")
    return matched


# ---------------------------------------------------------------------------
# Course page section parser — handles Tiles and Topics formats
# ---------------------------------------------------------------------------
def scrape_course_structure(page: Page, course_url: str) -> list[dict]:
    """
    Parse the course main page into sections with all activity links.
    Returns list of section dicts: {section_number, title, summary_html,
    summary_text, activities: [{url, type, name, label_html}]}

    Handles multiple Moodle course formats:
    - format-pxgrid: Section cards linking to /course/section.php?id=XXXXX
    - format-tiles: Clickable tile cards with JS expansion
    - format-topics/weeks: Standard li.section elements
    - Fallback: Just grab all /mod/ links from the course page
    """
    page.goto(course_url, wait_until="networkidle", timeout=30000)

    # Detect course format from body class
    body_classes = page.evaluate("() => document.body.className") or ""
    fmt = "unknown"
    for f in ("pxgrid", "tiles", "topics", "weeks", "grid"):
        if f"format-{f}" in body_classes or f"format_{f}" in body_classes:
            fmt = f
            break
    print(f"    Course format: {fmt}")

    sections: list[dict] = []

    # Strategy 1: pxgrid — section cards with /course/section.php?id=X links
    if fmt == "pxgrid":
        sections = _parse_pxgrid_format(page)

    # Strategy 2: tiles — clickable tiles or direct section URLs
    elif fmt in ("tiles", "grid"):
        sections = _parse_section_urls(page, course_url)

    # Strategy 3: standard topics/weeks
    if not sections:
        sections = _parse_topics_format(page)

    # Strategy 4: fallback — just grab all /mod/ links from the page
    if not sections:
        print("    WARN: No sections found, using fallback (all /mod/ links)")
        sections = _fallback_all_links(page, course_url)

    return sections


def _parse_pxgrid_format(page: Page) -> list[dict]:
    """Parse format-pxgrid: section cards linking to /course/section.php?id=X."""
    sections: list[dict] = []

    # Find section card links
    card_links = page.query_selector_all(
        "li.section-item a[href*='section.php'], "
        "li.card a[href*='section.php'], "
        "a[href*='/course/section.php']"
    )

    # Deduplicate section URLs
    seen_urls: set[str] = set()
    section_urls: list[tuple[int, str, str]] = []
    for link in card_links:
        href = link.get_attribute("href") or ""
        if not href or href in seen_urls:
            continue
        seen_urls.add(href)
        url = href if href.startswith("http") else BASE_URL + href

        # Try to get section name from the card
        card = link.evaluate_handle("el => el.closest('li')")
        name = ""
        if card:
            try:
                name = clean(card.inner_text())[:200]
            except Exception:
                pass
        if not name:
            name = clean(link.inner_text())[:200]

        section_urls.append((len(section_urls), url, name))

    print(f"    Found {len(section_urls)} section cards")

    # Visit each section page to discover activities
    for sec_num, sec_url, card_name in section_urls:
        try:
            page.goto(sec_url, wait_until="networkidle", timeout=20000)
        except PlaywrightTimeout:
            print(f"    Section {sec_num}: TIMEOUT")
            continue

        title_el = page.query_selector(
            ".sectionname, .section-title, .page-header-headings h1, "
            "h2, h3.sectionname"
        )
        title = clean(title_el.inner_text()) if title_el else card_name or f"Section {sec_num}"

        summary_el = page.query_selector(".summary, .section_availability, .description")
        summary_html = summary_el.inner_html() if summary_el else None
        summary_text = clean(summary_el.inner_text()) if summary_el else None

        # Extract activities from this section page
        container = page.query_selector("#region-main, .course-content")
        activities = _extract_activities_from_section(container) if container else []

        sections.append({
            "section_number": sec_num,
            "title": title,
            "summary_html": summary_html,
            "summary_text": summary_text,
            "activities": activities,
        })
        print(f"    Section {sec_num}: {title} ({len(activities)} items)")

    return sections


def _parse_section_urls(page: Page, course_url: str) -> list[dict]:
    """Parse by probing /course/view.php?id=X&section=N URLs."""
    sections: list[dict] = []
    course_id_match = re.search(r"id=(\d+)", course_url)
    if not course_id_match:
        return []
    course_id = course_id_match.group(1)

    for sec_num in range(31):
        sec_url = f"{BASE_URL}/course/view.php?id={course_id}&section={sec_num}"
        try:
            page.goto(sec_url, wait_until="networkidle", timeout=15000)
        except PlaywrightTimeout:
            continue

        # Check if section exists (Moodle may redirect to course page)
        has_mod_links = page.query_selector("a[href*='/mod/']")
        if not has_mod_links and sec_num > 0:
            # No activities and not section 0 — likely doesn't exist
            # But check a few more before giving up
            if sec_num > 2 and not sections:
                break
            continue

        title_el = page.query_selector(
            ".sectionname, .section-title, .page-header-headings h1"
        )
        title = clean(title_el.inner_text()) if title_el else f"Section {sec_num}"

        container = page.query_selector("#region-main, .course-content")
        activities = _extract_activities_from_section(container) if container else []

        if activities or sec_num == 0:
            sections.append({
                "section_number": sec_num,
                "title": title,
                "summary_html": None,
                "summary_text": None,
                "activities": activities,
            })
            print(f"    Section {sec_num}: {title} ({len(activities)} items)")

    return sections


def _parse_topics_format(page: Page) -> list[dict]:
    """Parse standard Moodle topics/weeks format."""
    sections: list[dict] = []
    section_els = page.query_selector_all("li.section, .section.main")

    for sec_el in section_els:
        sec_id = sec_el.get_attribute("id") or ""
        sec_num_match = re.search(r"section-(\d+)", sec_id)
        sec_num = int(sec_num_match.group(1)) if sec_num_match else len(sections)

        title_el = sec_el.query_selector(
            ".sectionname, .content > h3, .section-title"
        )
        title = clean(title_el.inner_text()) if title_el else f"Section {sec_num}"

        summary_el = sec_el.query_selector(".summary, .section_availability")
        summary_html = summary_el.inner_html() if summary_el else None
        summary_text = clean(summary_el.inner_text()) if summary_el else None

        activities = _extract_activities_from_section(sec_el)

        sections.append({
            "section_number": sec_num,
            "title": title,
            "summary_html": summary_html,
            "summary_text": summary_text,
            "activities": activities,
        })

    return sections


def _fallback_all_links(page: Page, course_url: str) -> list[dict]:
    """Fallback: just grab every /mod/ link from the course page as one section."""
    page.goto(course_url, wait_until="networkidle", timeout=30000)
    container = page.query_selector("#region-main, body")
    activities = _extract_activities_from_section(container) if container else []
    if activities:
        return [{
            "section_number": 0,
            "title": "All activities",
            "summary_html": None,
            "summary_text": None,
            "activities": activities,
        }]
    return []


def _extract_activities_from_section(container) -> list[dict]:
    """Extract all activity items (including labels) from a section container.

    Uses two strategies:
    1. Standard Moodle: .activity / .modtype_* CSS classes
    2. Fallback (pxgrid etc.): grab all a[href*='/mod/'] links directly
    """
    activities: list[dict] = []
    seen_urls: set[str] = set()

    # Strategy 1: Standard Moodle activity elements
    activity_els = container.query_selector_all(
        ".activity, li[class*='modtype_'], .section li"
    )

    for act_el in activity_els:
        class_list = act_el.get_attribute("class") or ""

        # Detect type from modtype_* CSS class
        mod_type = "other"
        type_match = re.search(r"modtype_(\w+)", class_list)
        if type_match:
            mod_type = type_match.group(1)

        # Handle labels (inline, no URL)
        if mod_type == "label":
            label_html = ""
            label_el = act_el.query_selector(
                ".contentafterlink, .contentwithoutlink, .label, .mod-indent-outer"
            )
            if label_el:
                label_html = label_el.inner_html()
            name = clean(act_el.inner_text())[:200]
            activities.append(
                {
                    "url": None,
                    "type": "label",
                    "name": name,
                    "label_html": label_html,
                }
            )
            continue

        # Get activity link
        link = act_el.query_selector("a[href*='/mod/']")
        if not link:
            continue
        href = link.get_attribute("href") or ""
        if not href or href in seen_urls:
            continue
        seen_urls.add(href)

        url = href if href.startswith("http") else BASE_URL + href

        # Detect type from URL if not from CSS class
        if mod_type == "other":
            for t in ("hvp", "quiz", "assign", "lesson", "scorm", "page", "resource", "url", "folder", "forum"):
                if f"/mod/{t}/" in url:
                    mod_type = t
                    break

        # Get name
        name = ""
        for sel in [".instancename", ".activityname", ".aalink span"]:
            name_el = link.query_selector(sel)
            if name_el:
                name = clean(name_el.inner_text())
                if name:
                    break
        if not name:
            name = clean(link.inner_text())

        activities.append(
            {"url": url, "type": mod_type, "name": name, "label_html": None}
        )

    # Strategy 2: Fallback — if no activities found via standard Moodle classes,
    # grab all /mod/ links directly from the container (works for pxgrid etc.)
    if not activities:
        all_links = container.query_selector_all("a[href*='/mod/']")
        for link in all_links:
            href = link.get_attribute("href") or ""
            if not href or href in seen_urls:
                continue

            # Skip duplicate anchors (same URL, different element)
            url = href if href.startswith("http") else BASE_URL + href
            # Normalize URL for dedup (strip anchors, trailing slash)
            norm_url = url.split("#")[0].rstrip("/")
            if norm_url in seen_urls:
                continue
            seen_urls.add(norm_url)

            # Detect type from URL path
            mod_type = "other"
            for t in ("hvp", "quiz", "assign", "lesson", "scorm", "page", "resource", "url", "folder", "forum"):
                if f"/mod/{t}/" in url:
                    mod_type = t
                    break

            name = clean(link.inner_text())[:200]

            activities.append(
                {"url": url, "type": mod_type, "name": name, "label_html": None}
            )

    return activities


# ---------------------------------------------------------------------------
# Content extraction helpers
# ---------------------------------------------------------------------------
def extract_main_content(page: Page) -> tuple[str, str]:
    """Extract the main content area HTML and plain text."""
    for selector in [
        "#region-main .content",
        "#region-main",
        ".course-content",
        "main",
        "body",
    ]:
        el = page.query_selector(selector)
        if el:
            html = el.inner_html()
            text = clean(el.inner_text())
            return truncate_html(html), text
    return "", ""


def extract_file_links(page: Page) -> list[str]:
    """Find all downloadable file URLs on the current page."""
    links: list[str] = []
    seen: set[str] = set()

    for a in page.query_selector_all("a[href]"):
        href = a.get_attribute("href") or ""
        if not href or href in seen:
            continue
        # Moodle file serving endpoints
        if "/pluginfile.php/" in href or any(
            href.lower().endswith(ext)
            for ext in (".pdf", ".docx", ".xlsx", ".pptx", ".doc", ".xls", ".mp3", ".mp4", ".zip")
        ):
            full_url = href if href.startswith("http") else BASE_URL + href
            if full_url not in seen:
                seen.add(full_url)
                links.append(full_url)

    return links


def download_file(page: Page, url: str, files_dir: Path) -> str | None:
    """Download a file to scripts/data/files/. Returns local path or None."""
    files_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Use Playwright's request context to download with cookies
        response = page.request.get(url, timeout=30000)
        if response.status != 200:
            return None

        # Extract filename from Content-Disposition header or URL
        cd = response.headers.get("content-disposition", "")
        filename_match = re.search(r'filename[*]?=["\']?([^"\';\n]+)', cd)
        if filename_match:
            filename = filename_match.group(1).strip()
        else:
            # Extract from URL path
            parsed = urllib.parse.urlparse(url)
            filename = Path(urllib.parse.unquote(parsed.path)).name
            if not filename or filename == "/":
                filename = f"download_{datetime.now().strftime('%H%M%S')}"

        # Sanitize filename
        filename = re.sub(r'[<>:"/\\|?*]', "_", filename)

        # Avoid overwriting — add timestamp if exists
        target = files_dir / filename
        if target.exists():
            stem, ext = target.stem, target.suffix
            target = files_dir / f"{stem}_{datetime.now().strftime('%H%M%S')}{ext}"

        target.write_bytes(response.body())
        return str(target)

    except Exception as exc:
        print(f"      WARN: download failed for {url}: {exc}")
        return None


# ---------------------------------------------------------------------------
# Per-type scrapers — each returns a ScrapedItem dict
# ---------------------------------------------------------------------------
def _empty_item(activity: dict, sec_num: int) -> dict:
    """Create an empty ScrapedItem template."""
    return {
        "url": activity.get("url"),
        "type": activity.get("type", "other"),
        "name": activity.get("name", ""),
        "section_number": sec_num,
        "raw_html": None,
        "raw_text": None,
        "h5p_json": None,
        "quiz_questions": None,
        "file_links": [],
        "downloaded_files": [],
        "external_url": None,
        "scraped_at": now_iso(),
        "error": None,
    }


def scrape_label(activity: dict, sec_num: int) -> dict:
    """Process an inline label (no page navigation needed)."""
    item = _empty_item(activity, sec_num)
    item["raw_html"] = activity.get("label_html") or ""
    item["raw_text"] = clean(item["raw_html"])
    return item


def scrape_page_mod(page: Page, activity: dict, sec_num: int) -> dict:
    """Scrape a /mod/page/ — HTML content page (teacher notes, reading texts)."""
    item = _empty_item(activity, sec_num)
    page.goto(activity["url"], wait_until="networkidle", timeout=20000)
    item["name"] = item["name"] or clean(page.title())
    item["raw_html"], item["raw_text"] = extract_main_content(page)
    item["file_links"] = extract_file_links(page)
    return item


def scrape_resource(
    page: Page, activity: dict, sec_num: int, files_dir: Path
) -> dict:
    """Scrape a /mod/resource/ — capture file URL and download."""
    item = _empty_item(activity, sec_num)

    try:
        page.goto(activity["url"], wait_until="networkidle", timeout=20000)
    except PlaywrightTimeout:
        # Resource pages often auto-redirect to file download
        pass

    item["name"] = item["name"] or clean(page.title())

    # Check if we were redirected to a file
    if "/pluginfile.php/" in page.url:
        item["file_links"] = [page.url]
    else:
        item["raw_html"], item["raw_text"] = extract_main_content(page)
        item["file_links"] = extract_file_links(page)

    # Download files
    for furl in item["file_links"]:
        local = download_file(page, furl, files_dir)
        if local:
            item["downloaded_files"].append(local)

    return item


def scrape_url_mod(page: Page, activity: dict, sec_num: int) -> dict:
    """Scrape a /mod/url/ — capture the external target URL."""
    item = _empty_item(activity, sec_num)
    page.goto(activity["url"], wait_until="networkidle", timeout=20000)
    item["name"] = item["name"] or clean(page.title())

    # Moodle may auto-redirect to the external URL, or show it on a page
    if "speakspeak.dk" not in page.url:
        item["external_url"] = page.url
    else:
        # Look for the URL in the content area
        url_el = page.query_selector(".urlworkaround a, .resourcecontent a")
        if url_el:
            item["external_url"] = url_el.get_attribute("href")

    item["raw_html"], item["raw_text"] = extract_main_content(page)
    return item


def scrape_folder(
    page: Page, activity: dict, sec_num: int, files_dir: Path
) -> dict:
    """Scrape a /mod/folder/ — list and download all files."""
    item = _empty_item(activity, sec_num)
    page.goto(activity["url"], wait_until="networkidle", timeout=20000)
    item["name"] = item["name"] or clean(page.title())
    item["raw_html"], item["raw_text"] = extract_main_content(page)
    item["file_links"] = extract_file_links(page)

    for furl in item["file_links"]:
        local = download_file(page, furl, files_dir)
        if local:
            item["downloaded_files"].append(local)

    return item


def scrape_hvp_full(page: Page, activity: dict, sec_num: int) -> dict:
    """
    Scrape an H5P activity — raw JSON + page HTML.
    Clicks "Vis løsning" to reveal correct answers (user's previous answers may be wrong).
    """
    item = _empty_item(activity, sec_num)

    try:
        page.goto(activity["url"], wait_until="networkidle", timeout=20000)
    except PlaywrightTimeout:
        item["error"] = "Timeout loading H5P page"
        return item

    item["name"] = item["name"] or clean(page.title())

    # Extract H5P JSON data
    try:
        h5p_raw = page.evaluate(
            "() => JSON.stringify(window.H5PIntegration || null)"
        )
        if h5p_raw and h5p_raw != "null":
            item["h5p_json"] = json.loads(h5p_raw)
    except Exception as exc:
        item["error"] = f"H5P JSON extraction failed: {exc}"

    # --- Reveal correct answers via "Vis løsning" ---
    _reveal_h5p_solutions(page)

    # Capture HTML AFTER solution reveal (shows correct answers)
    item["raw_html"], item["raw_text"] = extract_main_content(page)
    return item


def _reveal_h5p_solutions(page: Page) -> None:
    """
    Fill dummy answers and click "Vis løsning" (Show solution) on H5P exercises.
    This reveals the correct answers even if user's previous attempts are saved.

    Handles sliding/paginated H5P types (QuestionSet, CoursePresentation,
    SingleChoiceSet) by clicking through all slides.
    """
    try:
        # --- Handle paginated/sliding exercises ---
        # Some H5P types show one question at a time with navigation arrows.
        # We need to: fill + Tjek + Vis løsning on EACH slide, then advance.
        MAX_SLIDES = 50  # safety limit

        for slide_num in range(MAX_SLIDES):
            # Fill all visible text inputs with dummy text
            _fill_visible_inputs(page)

            # Select a radio/checkbox option if present (for MultiChoice slides)
            _select_visible_options(page)

            # Click "Tjek" / "Check" button (required before "Vis løsning")
            _click_button(page, [
                "button:has-text('Tjek')",
                "button:has-text('Check')",
                ".h5p-question-check-answer",
                ".h5p-joubelui-button:has-text('Tjek')",
            ])

            # Click "Vis løsning" / "Show solution" button
            _click_button(page, [
                "button:has-text('Vis løsning')",
                "button:has-text('Show solution')",
                "button:has-text('Vis svar')",
                ".h5p-question-show-solution",
                ".h5p-joubelui-button:has-text('Vis')",
            ])

            # Try to advance to next slide/question
            advanced = _click_next_slide(page)
            if not advanced:
                break

        # Final pass: click ALL remaining "Vis løsning" buttons on page
        # (catches any we missed, e.g. summary screens)
        all_sol_btns = page.query_selector_all(
            "button:has-text('Vis løsning'), "
            "button:has-text('Vis svar'), "
            ".h5p-question-show-solution"
        )
        for btn in all_sol_btns:
            try:
                if btn.is_visible():
                    btn.click(timeout=2000)
                    page.wait_for_timeout(200)
            except Exception:
                pass

    except Exception:
        pass  # Best-effort — don't crash if solution reveal fails


def _fill_visible_inputs(page: Page) -> None:
    """Fill all visible text inputs with dummy text 'x'."""
    inputs = page.query_selector_all(
        ".h5p-text-input, .h5p-blanks input, input.h5p-input, "
        ".h5p-content input[type='text']"
    )
    for inp in inputs:
        try:
            if inp.is_visible():
                inp.fill("x")
        except Exception:
            pass


def _select_visible_options(page: Page) -> None:
    """Select the first visible radio/checkbox option (for MultiChoice slides)."""
    for sel in [
        ".h5p-answer input[type='radio']",
        ".h5p-answer input[type='checkbox']",
        ".h5p-alternative-container",
        "li.h5p-sc-alternative",
    ]:
        options = page.query_selector_all(sel)
        for opt in options:
            try:
                if opt.is_visible():
                    opt.click(timeout=1000)
                    page.wait_for_timeout(200)
                    return  # only need to select one
            except Exception:
                pass


def _click_button(page: Page, selectors: list[str]) -> bool:
    """Click the first visible button matching any selector. Returns True if clicked."""
    for sel in selectors:
        btn = page.query_selector(sel)
        if btn:
            try:
                if btn.is_visible():
                    btn.click(timeout=3000)
                    page.wait_for_timeout(500)
                    return True
            except Exception:
                pass
    return False


def _click_next_slide(page: Page) -> bool:
    """Try to advance to the next slide in a paginated H5P exercise.
    Returns True if a next button was clicked (more slides), False otherwise."""
    next_selectors = [
        # QuestionSet / CoursePresentation navigation
        ".h5p-question-next",
        "button.h5p-joubelui-button:has-text('Næste')",
        "button:has-text('Next')",
        ".h5p-next-button",
        # SingleChoiceSet auto-advances, but may have explicit next
        ".h5p-sc-next-button",
        # CoursePresentation right arrow
        ".h5p-course-presentation .h5p-footer .h5p-next",
        "a.h5p-slide-next",
    ]
    for sel in next_selectors:
        btn = page.query_selector(sel)
        if btn:
            try:
                if btn.is_visible():
                    btn.click(timeout=3000)
                    page.wait_for_timeout(800)
                    return True
            except Exception:
                pass
    return False


def scrape_quiz_full(page: Page, activity: dict, sec_num: int) -> dict:
    """Scrape a Moodle quiz — intro page + questions if accessible."""
    item = _empty_item(activity, sec_num)

    try:
        page.goto(activity["url"], wait_until="networkidle", timeout=20000)
    except PlaywrightTimeout:
        item["error"] = "Timeout loading quiz page"
        return item

    item["name"] = item["name"] or clean(page.title())
    item["raw_html"], item["raw_text"] = extract_main_content(page)

    # Try to start/view the quiz
    btn = page.query_selector("button.btn-primary, input[name='startattempt']")
    if btn and btn.is_visible():
        try:
            btn.click(timeout=5000)
            page.wait_for_load_state("networkidle")
        except PlaywrightTimeout:
            pass

    # Parse quiz questions
    questions: list[dict] = []
    question_els = page.query_selector_all(".que")
    for qel in question_els:
        try:
            qtext_el = qel.query_selector(".qtext, .questiontext, .prompt")
            if not qtext_el:
                continue
            q = {
                "question": clean(qtext_el.inner_text()),
                "html": qtext_el.inner_html(),
                "class": qel.get_attribute("class") or "",
            }
            # Try to get correct answer
            correct_el = qel.query_selector(".rightanswer, .correct")
            if correct_el:
                q["correct_answer"] = clean(correct_el.inner_text())
            questions.append(q)
        except Exception:
            pass

    if questions:
        item["quiz_questions"] = questions
        # Re-capture HTML after viewing questions
        item["raw_html"], item["raw_text"] = extract_main_content(page)

    return item


def scrape_assign(page: Page, activity: dict, sec_num: int) -> dict:
    """Scrape a /mod/assign/ — assignment description/instructions."""
    item = _empty_item(activity, sec_num)
    page.goto(activity["url"], wait_until="networkidle", timeout=20000)
    item["name"] = item["name"] or clean(page.title())
    item["raw_html"], item["raw_text"] = extract_main_content(page)
    item["file_links"] = extract_file_links(page)
    return item


def scrape_lesson(page: Page, activity: dict, sec_num: int) -> dict:
    """Scrape a /mod/lesson/ — capture first page content."""
    item = _empty_item(activity, sec_num)
    page.goto(activity["url"], wait_until="networkidle", timeout=20000)
    item["name"] = item["name"] or clean(page.title())
    item["raw_html"], item["raw_text"] = extract_main_content(page)
    return item


def scrape_generic(page: Page, activity: dict, sec_num: int) -> dict:
    """Fallback scraper for unrecognized module types."""
    item = _empty_item(activity, sec_num)
    try:
        page.goto(activity["url"], wait_until="networkidle", timeout=20000)
        item["name"] = item["name"] or clean(page.title())
        item["raw_html"], item["raw_text"] = extract_main_content(page)
        item["file_links"] = extract_file_links(page)
    except PlaywrightTimeout:
        item["error"] = "Timeout loading page"
    return item


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------
def scrape_item(
    page: Page,
    activity: dict,
    sec_num: int,
    files_dir: Path,
    type_filter: set[str] | None,
) -> dict | None:
    """Route to the correct scraper based on activity type."""
    atype = activity["type"]

    # Skip if type filter is set and this type is not included
    if type_filter and atype not in type_filter:
        return None

    # Labels don't need page navigation
    if atype == "label":
        return scrape_label(activity, sec_num)

    # Skip items without URLs
    if not activity.get("url"):
        return None

    try:
        if atype == "page":
            return scrape_page_mod(page, activity, sec_num)
        elif atype == "resource":
            return scrape_resource(page, activity, sec_num, files_dir)
        elif atype == "url":
            return scrape_url_mod(page, activity, sec_num)
        elif atype == "folder":
            return scrape_folder(page, activity, sec_num, files_dir)
        elif atype == "hvp":
            return scrape_hvp_full(page, activity, sec_num)
        elif atype == "quiz":
            return scrape_quiz_full(page, activity, sec_num)
        elif atype == "assign":
            return scrape_assign(page, activity, sec_num)
        elif atype == "lesson":
            return scrape_lesson(page, activity, sec_num)
        else:
            return scrape_generic(page, activity, sec_num)
    except Exception as exc:
        item = _empty_item(activity, sec_num)
        item["error"] = f"{type(exc).__name__}: {exc}"
        return item


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
def build_index(dump: dict) -> str:
    """Build human-readable index text."""
    meta = dump["meta"]
    lines = [
        f"SpeakSpeak Full Dump — {meta['exam']}",
        f"Course: {meta['course_name']}",
        f"URL: {meta['course_url']}",
        f"Scraped: {meta['scraped_at']}",
        "",
    ]

    type_counts: dict[str, int] = {}
    total_files = 0

    for section in dump["sections"]:
        lines.append(
            f"Section {section['section_number']}: {section['title']}"
        )
        if section["summary_text"]:
            lines.append(f"  Summary: {section['summary_text'][:100]}...")

        for item in section["items"]:
            t = item["type"]
            type_counts[t] = type_counts.get(t, 0) + 1
            url_part = item["url"] or "(inline)"
            error_mark = " ⚠" if item.get("error") else ""
            files_mark = (
                f" [{len(item.get('file_links', []))} files]"
                if item.get("file_links")
                else ""
            )
            lines.append(
                f"  [{t:10s}] {item['name'][:60]:60s} {url_part}{files_mark}{error_mark}"
            )
            total_files += len(item.get("downloaded_files", []))

        lines.append("")

    lines.append("SUMMARY:")
    for t, count in sorted(type_counts.items()):
        lines.append(f"  {t}: {count} items")
    lines.append(
        f"  Total: {sum(type_counts.values())} items across {len(dump['sections'])} sections"
    )
    lines.append(f"  Files downloaded: {total_files}")

    error_count = sum(
        1
        for sec in dump["sections"]
        for item in sec["items"]
        if item.get("error")
    )
    if error_count:
        lines.append(f"  Errors: {error_count}")

    return "\n".join(lines)


def write_output(
    dump: dict, exam_label: str, output_dir: Path
) -> tuple[Path, Path]:
    """Write JSON dump and text index."""
    output_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    json_path = output_dir / f"speakspeak-full-{exam_label}_{ts}.json"
    json_path.write_text(
        json.dumps(dump, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    index_path = output_dir / f"speakspeak-index-{exam_label}_{ts}.txt"
    index_path.write_text(build_index(dump), encoding="utf-8")

    return json_path, index_path


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Full course dump from SpeakSpeak Moodle"
    )
    parser.add_argument(
        "--exam",
        type=str,
        default=None,
        metavar="LEVEL",
        help="Exam level: PD2, PD3M1, PD3M2",
    )
    parser.add_argument(
        "--all-courses", action="store_true", help="Dump all enrolled courses"
    )
    parser.add_argument(
        "--visible", action="store_true", help="Show browser window"
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Wait for manual login (required for SSO)",
    )
    parser.add_argument(
        "--cookies", type=str, default=None, help="Path to saved cookies.json"
    )
    parser.add_argument(
        "--save-cookies",
        type=str,
        default="cookies.json",
        help="Save session cookies here",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Output directory (default: scripts/data/)",
    )
    parser.add_argument(
        "--no-navigate",
        action="store_true",
        help="Only parse course page structure, skip visiting individual pages",
    )
    parser.add_argument(
        "--types",
        type=str,
        default=None,
        help="Comma-separated types to scrape (e.g. page,resource,hvp). Default: all",
    )
    args = parser.parse_args()

    scripts_dir = Path(__file__).parent
    exam = args.exam.upper() if args.exam and not args.all_courses else None
    exam_label = exam.lower() if exam else "all"
    output_dir = Path(args.output_dir) if args.output_dir else scripts_dir / "data"
    files_dir = output_dir / "files"
    type_filter = set(args.types.split(",")) if args.types else None

    if not args.interactive and not args.cookies:
        default_cookies = scripts_dir / "cookies.json"
        if default_cookies.exists():
            args.cookies = str(default_cookies)
            print(f"  Using saved cookies: {default_cookies}")
        else:
            print(
                "ERROR: No login method. Use --interactive or --cookies cookies.json"
            )
            sys.exit(1)

    if args.interactive:
        args.visible = True

    print("\nDanskPrep — SpeakSpeak Full Course Dump")
    print(f"  Exam:       {exam_label}")
    print(f"  Output:     {output_dir}")
    print(f"  Navigate:   {'no (structure only)' if args.no_navigate else 'yes (all pages)'}")
    print(f"  Types:      {args.types or 'all'}")
    print(f"  Login:      {'interactive' if args.interactive else 'cookies'}")
    print()

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not args.visible)
        context = browser.new_context(
            locale="da-DK",
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        )
        page = context.new_page()

        try:
            # --- Login ---
            if args.interactive:
                print("[1/4] Waiting for manual login …")
                login_interactive(page)
            else:
                print("[1/4] Restoring session …")
                restore_cookies(context, Path(args.cookies), page)

            if args.save_cookies:
                save_cookies(context, scripts_dir / args.save_cookies)

            # --- Find courses ---
            print("\n[2/4] Finding courses …")
            courses = find_courses(page, exam, args.all_courses)
            if not courses:
                sys.exit(0)

            # --- Process each course ---
            for course in courses:
                print(f"\n[3/4] Parsing course structure: {course['name']}")
                sections = scrape_course_structure(page, course["url"])
                print(f"  Found {len(sections)} sections")

                total_activities = sum(
                    len(s["activities"]) for s in sections
                )
                print(f"  Found {total_activities} total activities")

                if args.no_navigate:
                    # Build dump from structure only
                    dump = {
                        "meta": {
                            "scraped_at": now_iso(),
                            "exam": exam_label,
                            "course_name": course["name"],
                            "course_url": course["url"],
                            "total_sections": len(sections),
                            "total_items": total_activities,
                        },
                        "sections": [
                            {
                                "section_number": s["section_number"],
                                "title": s["title"],
                                "summary_html": s.get("summary_html"),
                                "summary_text": s.get("summary_text"),
                                "items": [
                                    {
                                        "url": a.get("url"),
                                        "type": a["type"],
                                        "name": a["name"],
                                        "section_number": s["section_number"],
                                        "raw_html": a.get("label_html"),
                                        "raw_text": clean(a.get("label_html") or "")
                                        if a.get("label_html")
                                        else None,
                                        "h5p_json": None,
                                        "quiz_questions": None,
                                        "file_links": [],
                                        "downloaded_files": [],
                                        "external_url": None,
                                        "scraped_at": now_iso(),
                                        "error": None,
                                    }
                                    for a in s["activities"]
                                ],
                            }
                            for s in sections
                        ],
                    }
                else:
                    # Full scrape — visit each activity page
                    print(f"\n[4/4] Scraping {total_activities} activities …")
                    dump_sections: list[dict] = []
                    scraped_count = 0

                    for sec in sections:
                        sec_items: list[dict] = []
                        print(
                            f"\n  ── Section {sec['section_number']}: {sec['title']} ({len(sec['activities'])} items) ──"
                        )

                        for act in sec["activities"]:
                            scraped_count += 1
                            label = act["name"][:50] or act.get("url", "?").split("id=")[-1]
                            print(
                                f"    [{act['type']:10s}] {label} … ",
                                end="",
                                flush=True,
                            )

                            item = scrape_item(
                                page,
                                act,
                                sec["section_number"],
                                files_dir,
                                type_filter,
                            )
                            if item is None:
                                print("skipped (type filter)")
                                continue

                            if item.get("error"):
                                print(f"⚠ {item['error'][:60]}")
                            else:
                                text_len = len(item.get("raw_text") or "")
                                files_count = len(item.get("file_links", []))
                                extras = []
                                if item.get("h5p_json"):
                                    extras.append("H5P")
                                if item.get("quiz_questions"):
                                    extras.append(
                                        f"{len(item['quiz_questions'])} Q"
                                    )
                                if files_count:
                                    extras.append(f"{files_count} files")
                                print(
                                    f"✓ {text_len} chars"
                                    + (
                                        f" ({', '.join(extras)})"
                                        if extras
                                        else ""
                                    )
                                )

                            sec_items.append(item)

                        dump_sections.append(
                            {
                                "section_number": sec["section_number"],
                                "title": sec["title"],
                                "summary_html": sec.get("summary_html"),
                                "summary_text": sec.get("summary_text"),
                                "items": sec_items,
                            }
                        )

                        # Incremental save after each section
                        partial_dump = {
                            "meta": {
                                "scraped_at": now_iso(),
                                "exam": exam_label,
                                "course_name": course["name"],
                                "course_url": course["url"],
                                "total_sections": len(sections),
                                "total_items": scraped_count,
                                "status": "in_progress",
                            },
                            "sections": dump_sections,
                        }
                        partial_path = output_dir / f"_speakspeak_partial_{exam_label}.json"
                        partial_path.write_text(
                            json.dumps(partial_dump, ensure_ascii=False, indent=2),
                            encoding="utf-8",
                        )

                    dump = {
                        "meta": {
                            "scraped_at": now_iso(),
                            "exam": exam_label,
                            "course_name": course["name"],
                            "course_url": course["url"],
                            "total_sections": len(dump_sections),
                            "total_items": scraped_count,
                        },
                        "sections": dump_sections,
                    }

                # Write final output
                json_path, index_path = write_output(dump, exam_label, output_dir)

                # Clean up partial file
                partial = output_dir / f"_speakspeak_partial_{exam_label}.json"
                if partial.exists():
                    partial.unlink()

                print(f"\n{'─' * 60}")
                print(f"  JSON:  {json_path}")
                print(f"  Index: {index_path}")
                print(build_index(dump))

        finally:
            browser.close()


if __name__ == "__main__":
    main()
