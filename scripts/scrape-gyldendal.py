#!/usr/bin/env python3
"""
Scrape Danish module tests from modultest.ibog.gyldendal.dk (Nuxt.js / Typo3 SPA).

Reads credentials from environment variables:
  GYLDENDAL_USER  — your Gyldendal/ibog username (usually email)
  GYLDENDAL_PASS  — your Gyldendal/ibog password

Usage (via uv — always use uv, never pip directly):
  cd scripts
  GYLDENDAL_USER=you@email.com GYLDENDAL_PASS=secret uv run python scrape-gyldendal.py --module 2

Setup:
  uv venv --python 3.12 .venv
  uv sync
  uv run playwright install chromium

Strategy:
  The site is a Nuxt.js SPA backed by a Typo3 /api. The scraper:
  1. Intercepts all /api/* XHR/fetch responses to capture raw exercise JSON
  2. Falls back to DOM scraping if the API responses don't contain exercises
  3. Maps captured data to DanskPrep seed format
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse

try:
    from playwright.sync_api import sync_playwright, Page, Route, TimeoutError as PlaywrightTimeout
except ImportError:
    print("ERROR: Playwright not installed. Run: pip install playwright && playwright install chromium")
    sys.exit(1)

BASE_URL = "https://modultest.ibog.gyldendal.dk"

# ---------------------------------------------------------------------------
# Grammar topic detection
# ---------------------------------------------------------------------------
TOPIC_KEYWORDS: list[tuple[list[str], str]] = [
    (["genus", "køn", "en-ord", "et-ord", "n-ord", "t-ord", "bestemt", "ubestemt", "flertal", "substantiv"], "noun-gender"),
    (["komparativ", "superlativ", "ere", "mere", "mest", "end than"], "comparative-superlative"),
    (["omvendt", "ordstilling", "inversion", "v2", "tidsled", "fremsætningsled"], "inverted-word-order"),
    (["ledsætning", "bisætning", "fordi", "selvom", "konjunktion", "underordning"], "main-subordinate-clauses"),
    (["datid", "nutid", "perfektum", "pluskvamperfektum", "imperativ", "verbum", "udsagnsord", "tid"], "verbs-tenses"),
    (["pronomen", "pronominerne", "refleksiv", "mig", "dig", "sig", "sin", "sit", "possessiv", "stedord"], "pronouns"),
]

# Gyldendal H5P / custom exercise type → DanskPrep type
GYLDENDAL_TYPE_MAP = {
    "fill-in-the-blanks": "cloze",
    "fill_in_the_blanks": "cloze",
    "drag-the-words": "cloze",
    "drag_the_words": "cloze",
    "mark-the-words": "multiple_choice",
    "multiple-choice": "multiple_choice",
    "multiple_choice": "multiple_choice",
    "true-false": "multiple_choice",
    "single-choice-set": "multiple_choice",
    "drag-and-drop": "word_order",
    "drag_and_drop": "word_order",
    "word-ordering": "word_order",
    "find-the-hotspot": "multiple_choice",
    "sort-the-paragraphs": "word_order",
    "text": "type_answer",
    "essay": "type_answer",
    "short-answer": "type_answer",
    "blanks": "cloze",
}


def detect_topic(text: str) -> str:
    text_lower = text.lower()
    for keywords, slug in TOPIC_KEYWORDS:
        if any(kw in text_lower for kw in keywords):
            return slug
    return "noun-gender"


def detect_difficulty(text: str) -> int:
    words = text.split()
    if len(words) > 20:
        return 3
    if len(words) > 10:
        return 2
    return 1


def clean_html(text: str) -> str:
    """Strip HTML tags and normalise whitespace."""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", str(text)).strip()


# ---------------------------------------------------------------------------
# Parse exercises from intercepted API JSON payloads
# ---------------------------------------------------------------------------
def parse_api_payload(payload: dict | list, module: int, source_url: str) -> list[dict]:
    """
    Recursively search a JSON payload for exercise-like structures and
    convert them to DanskPrep seed format.
    """
    exercises: list[dict] = []

    def walk(obj):
        if isinstance(obj, list):
            for item in obj:
                walk(item)
        elif isinstance(obj, dict):
            # Detect H5P-style exercise
            if _looks_like_exercise(obj):
                ex = _convert_exercise(obj, module, source_url)
                if ex:
                    exercises.append(ex)
            else:
                for v in obj.values():
                    walk(v)

    walk(payload)
    return exercises


def _looks_like_exercise(obj: dict) -> bool:
    """Heuristic: does this dict look like an exercise?"""
    keys = set(obj.keys())
    exercise_indicators = {"question", "answers", "correct", "correctAnswers", "params",
                           "choices", "options", "blanks", "statement", "text"}
    return bool(keys & exercise_indicators)


def _convert_exercise(obj: dict, module: int, source_url: str) -> dict | None:
    """Convert a raw exercise dict to DanskPrep format."""
    # Extract question text from various possible keys
    question = (
        obj.get("question") or
        obj.get("statement") or
        obj.get("text") or
        obj.get("intro") or
        obj.get("description") or ""
    )
    question = clean_html(clean(str(question)))
    if not question or len(question) < 3:
        return None

    # Detect exercise type
    raw_type = (
        obj.get("type") or
        obj.get("library") or
        obj.get("exerciseType") or
        obj.get("questionType") or
        ""
    ).lower()
    # Strip H5P library version suffix e.g. "H5P.MultiChoice 1.14" → "multichoice"
    raw_type = re.sub(r"h5p\.", "", raw_type).replace(" ", "-").split("-")[0].lower()
    exercise_type = GYLDENDAL_TYPE_MAP.get(raw_type, "type_answer")

    correct_answer = ""
    alternatives: list[str] = []
    explanation = ""

    # Try to extract answers
    answers = obj.get("answers") or obj.get("choices") or obj.get("options") or []
    correct_obj = obj.get("correct") or obj.get("correctAnswers") or obj.get("solution")

    if isinstance(answers, list) and answers:
        all_options = []
        for ans in answers:
            if isinstance(ans, dict):
                label = clean_html(clean(str(ans.get("text") or ans.get("label") or ans.get("answer") or "")))
                is_correct = ans.get("correct") or ans.get("isCorrect") or False
                if label:
                    all_options.append((label, bool(is_correct)))
            elif isinstance(ans, str):
                all_options.append((clean(ans), False))

        correct_options = [t for t, c in all_options if c]
        wrong_options = [t for t, c in all_options if not c]

        if correct_options:
            correct_answer = correct_options[0]
            alternatives = wrong_options[:3]
            exercise_type = "multiple_choice" if len(all_options) > 1 else exercise_type
        elif all_options:
            correct_answer = all_options[0][0]
            alternatives = [t for t, _ in all_options[1:4]]

    elif isinstance(correct_obj, str):
        correct_answer = clean_html(clean(correct_obj))
    elif isinstance(correct_obj, list) and correct_obj:
        correct_answer = clean_html(clean(str(correct_obj[0])))

    # Cloze: replace *answer* or [[answer]] patterns
    if exercise_type == "cloze":
        question_cloze = re.sub(r"\*[^*]+\*|\[\[[^\]]+\]\]|__+", "___", question)
        question = question_cloze
        # Extract answer from the pattern
        match = re.search(r"\*([^*]+)\*|\[\[([^\]]+)\]\]", question)
        if match and not correct_answer:
            correct_answer = match.group(1) or match.group(2) or ""

    if not correct_answer:
        correct_answer = "REVIEW"

    # Feedback
    feedback = obj.get("feedback") or obj.get("overallFeedback") or obj.get("explanation") or ""
    if isinstance(feedback, list) and feedback:
        feedback = feedback[0].get("feedback", "") if isinstance(feedback[0], dict) else str(feedback[0])
    explanation = clean_html(clean(str(feedback))) if feedback else f"Scraped from Gyldendal modultest (module {module})"

    topic_slug = detect_topic(question + " " + source_url)
    difficulty = detect_difficulty(question)

    return {
        "grammar_topic_slug": topic_slug,
        "exercise_type": exercise_type,
        "question": question,
        "correct_answer": correct_answer,
        "alternatives": alternatives if alternatives else None,
        "hint": None,
        "explanation": explanation,
        "module_level": module,
        "difficulty": difficulty,
        "source": "gyldendal",
    }


# ---------------------------------------------------------------------------
# DOM fallback scraper (when API interception yields nothing)
# ---------------------------------------------------------------------------
def scrape_dom(page: Page, module: int) -> list[dict]:
    exercises: list[dict] = []

    # H5P iframes embed the exercises; try to read their content
    iframes = page.query_selector_all("iframe")
    print(f"    Found {len(iframes)} iframe(s) on page")

    for iframe in iframes:
        try:
            frame = iframe.content_frame()
            if not frame:
                continue
            frame.wait_for_load_state("networkidle", timeout=5000)

            # Generic question + answer scraping inside the iframe
            question_els = frame.query_selector_all(".h5p-question-content, .question, [class*='question']")
            for qel in question_els:
                question = clean(qel.inner_text())
                if len(question) < 5:
                    continue
                exercises.append({
                    "grammar_topic_slug": detect_topic(question),
                    "exercise_type": "type_answer",
                    "question": question,
                    "correct_answer": "REVIEW",
                    "alternatives": None,
                    "hint": None,
                    "explanation": "Scraped from Gyldendal (DOM fallback — verify correct answer)",
                    "module_level": module,
                    "difficulty": detect_difficulty(question),
                    "source": "gyldendal",
                })
        except Exception as e:
            print(f"    WARNING: iframe scrape error: {e}")

    return exercises


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
def login(page: Page, username: str, password: str) -> None:
    print("  Navigating to site …")
    page.goto(BASE_URL, wait_until="networkidle", timeout=30000)

    # Click through the fingerprint redirect if present
    enter_link = page.query_selector("a")
    if enter_link and "enter" in (enter_link.inner_text() or "").lower():
        enter_link.click()
        page.wait_for_load_state("networkidle")

    # Look for a login link / button
    login_triggers = [
        "a[href*='login']",
        "button:has-text('Log ind')",
        "button:has-text('Login')",
        "a:has-text('Log ind')",
        "a:has-text('Login')",
    ]
    for sel in login_triggers:
        el = page.query_selector(sel)
        if el:
            el.click()
            page.wait_for_load_state("networkidle")
            break

    # Fill credentials
    email_input = page.query_selector("input[type='email'], input[name='email'], input[name='username']")
    pass_input = page.query_selector("input[type='password']")

    if not email_input or not pass_input:
        print("  WARNING: Could not find login form. Run with --visible to debug.")
        return

    email_input.fill(username)
    pass_input.fill(password)

    submit = page.query_selector("button[type='submit'], input[type='submit']")
    if submit:
        submit.click()
        page.wait_for_load_state("networkidle")

    print("  Login submitted.")


# ---------------------------------------------------------------------------
# Navigate to Module N test section
# ---------------------------------------------------------------------------
def navigate_to_module(page: Page, module: int) -> list[str]:
    """Return list of URLs for Module N test pages."""
    urls: list[str] = []

    # Common URL patterns for Gyldendal module tests
    candidates = [
        f"{BASE_URL}/da/modul-{module}",
        f"{BASE_URL}/da/module-{module}",
        f"{BASE_URL}/da/modul{module}",
        f"{BASE_URL}/modul-{module}",
    ]

    for candidate in candidates:
        try:
            response = page.goto(candidate, wait_until="networkidle", timeout=15000)
            if response and response.status < 400:
                print(f"  Found module page: {candidate}")
                urls.append(candidate)
                break
        except PlaywrightTimeout:
            continue

    if not urls:
        # Try to find module links from the home/menu
        page.goto(BASE_URL, wait_until="networkidle", timeout=20000)
        module_links = page.query_selector_all(f"a[href*='modul-{module}'], a[href*='modul{module}']")
        for link in module_links:
            href = link.get_attribute("href") or ""
            if href:
                full = href if href.startswith("http") else BASE_URL + href
                urls.append(full)

    # Also look for sub-pages (test sections) from the module page
    if urls:
        page.goto(urls[0], wait_until="networkidle")
        sub_links = page.query_selector_all("a[href*='test'], a[href*='opgave'], a[href*='exercise'], a[href*='quiz']")
        for link in sub_links:
            href = link.get_attribute("href") or ""
            if href and href not in urls:
                full = href if href.startswith("http") else BASE_URL + href
                urls.append(full)

    print(f"  Module {module} pages to scrape: {len(urls)}")
    return urls


# ---------------------------------------------------------------------------
# Main scrape loop with API interception
# ---------------------------------------------------------------------------
def scrape_with_interception(urls: list[str], module: int) -> list[dict]:
    all_exercises: list[dict] = []
    api_payloads: list[tuple[str, dict | list]] = []

    def handle_response(response):
        url = response.url
        # Capture JSON from /api/ calls and H5P content endpoints
        if "/api/" in url or ".json" in url or "h5p" in url.lower():
            try:
                if "json" in (response.headers.get("content-type") or ""):
                    data = response.json()
                    api_payloads.append((url, data))
            except Exception:
                pass

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)  # visible helps debug SPA
        context = browser.new_context(locale="da-DK")
        page = context.new_page()

        page.on("response", handle_response)

        username = os.environ["GYLDENDAL_USER"]
        password = os.environ["GYLDENDAL_PASS"]

        print("[1/3] Logging in …")
        login(page, username, password)

        print(f"[2/3] Navigating to module pages …")
        for url in urls:
            print(f"  Visiting: {url}")
            try:
                page.goto(url, wait_until="networkidle", timeout=25000)
                # Let the SPA fully render
                page.wait_for_timeout(3000)

                # Scroll to trigger lazy-loaded content
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(1500)

                # DOM fallback
                dom_exercises = scrape_dom(page, module)
                all_exercises.extend(dom_exercises)

            except PlaywrightTimeout:
                print(f"  TIMEOUT: {url}")
            except Exception as e:
                print(f"  ERROR visiting {url}: {e}")

        browser.close()

    print(f"\n[3/3] Parsing {len(api_payloads)} captured API response(s) …")
    for api_url, payload in api_payloads:
        parsed = parse_api_payload(payload, module, api_url)
        if parsed:
            print(f"  {api_url} → {len(parsed)} exercise(s)")
            all_exercises.extend(parsed)

    return all_exercises


# ---------------------------------------------------------------------------
# Merge into seed file
# ---------------------------------------------------------------------------
def merge_into_seed(new_exercises: list[dict], output_path: Path) -> None:
    existing: list[dict] = []
    if output_path.exists():
        with open(output_path, encoding="utf-8") as f:
            try:
                existing = json.load(f)
            except json.JSONDecodeError:
                existing = []

    existing_keys = {(e.get("question", ""), e.get("correct_answer", "")) for e in existing}
    added = 0
    for ex in new_exercises:
        key = (ex.get("question", ""), ex.get("correct_answer", ""))
        if key not in existing_keys:
            existing.append(ex)
            existing_keys.add(key)
            added += 1

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    print(f"\n  Added {added} new exercises (skipped {len(new_exercises) - added} duplicates)")
    print(f"  Total exercises in file: {len(existing)}")
    print(f"  Saved to: {output_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Gyldendal Modultest exercises")
    parser.add_argument("--module", type=int, default=2, help="Module number (default: 2)")
    parser.add_argument("--output", type=str, default=None, help="Output JSON path (auto-detected if omitted)")
    parser.add_argument("--dump-api", action="store_true", help="Dump all captured API responses to a debug file")
    args = parser.parse_args()

    username = os.environ.get("GYLDENDAL_USER", "")
    password = os.environ.get("GYLDENDAL_PASS", "")
    if not username or not password:
        print("ERROR: Set GYLDENDAL_USER and GYLDENDAL_PASS environment variables.")
        sys.exit(1)

    root = Path(__file__).parent.parent
    output_path = Path(args.output) if args.output else root / f"src/data/seed/exercises-module{args.module}.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"\nDanskPrep — Gyldendal Modultest Scraper")
    print(f"  Module:  {args.module}")
    print(f"  Output:  {output_path}")
    print(f"  Note:    Browser will be visible to help navigate the SPA")
    print()

    # Two-phase: first find URLs, then scrape with interception
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)
        context = browser.new_context(locale="da-DK")
        page = context.new_page()

        try:
            print("[0/3] Finding module URLs …")
            login(page, username, password)
            module_urls = navigate_to_module(page, args.module)
        finally:
            browser.close()

    if not module_urls:
        print(f"\nWARNING: No URLs found for Module {args.module}.")
        print("Falling back to base URL — will intercept all API calls from there.")
        module_urls = [BASE_URL]

    all_exercises = scrape_with_interception(module_urls, args.module)

    review_count = sum(1 for e in all_exercises if "REVIEW" in str(e.get("correct_answer", "")))
    print(f"\nScraped {len(all_exercises)} exercises ({review_count} need manual review)")
    if review_count > 0:
        print("  Tip: Search the output JSON for 'REVIEW' to find items to fix.")

    if all_exercises:
        merge_into_seed(all_exercises, output_path)

        # Debug dump
        debug_path = output_path.parent / f"_gyldendal_debug_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(debug_path, "w", encoding="utf-8") as f:
            json.dump(all_exercises, f, ensure_ascii=False, indent=2)
        print(f"  Debug dump: {debug_path}")
    else:
        print("\nNo exercises scraped.")
        print("Suggestions:")
        print("  - The site may need manual navigation — watch the browser window")
        print("  - Try --dump-api to inspect what API calls are being made")
        print("  - The exercise content may be fully inside H5P iframes")


if __name__ == "__main__":
    main()
