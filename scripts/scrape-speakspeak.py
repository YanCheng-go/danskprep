#!/usr/bin/env python3
"""
Scrape Danish language assignments from mit.speakspeak.dk (Moodle + H5P platform).

Two login modes:
  --interactive   Open browser, log in manually (required for Microsoft SSO accounts)
  --cookies       Use saved cookies.json from a previous --interactive run

Usage (via uv — always use uv, never pip directly):
  cd scripts

  # First run: interactive login, save cookies
  uv run python scrape-speakspeak.py --exam PD3M2 --interactive --save-cookies cookies.json

  # Subsequent runs: use saved cookies
  uv run python scrape-speakspeak.py --exam PD3M2 --cookies cookies.json
  uv run python scrape-speakspeak.py --exam PD2  --cookies cookies.json

  # Scrape all enrolled courses regardless of exam level
  uv run python scrape-speakspeak.py --cookies cookies.json --all-courses

Exam level → course name mapping:
  PD2   →  courses containing "modul 2"   (module_level=2)
  PD3M1 →  courses containing "3.1"       (module_level=3)  — PD3 Module 1
  PD3M2 →  courses containing "3.2"       (module_level=3)  ← PD3 Module 2, primary target

Setup:
  uv venv --python 3.12 .venv
  uv sync
  uv run playwright install chromium
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from datetime import datetime

try:
    from playwright.sync_api import sync_playwright, Page, BrowserContext, TimeoutError as PlaywrightTimeout
except ImportError:
    print("ERROR: Run: cd scripts && uv sync && uv run playwright install chromium")
    sys.exit(1)

BASE_URL = "https://mit.speakspeak.dk"

# Maps --exam flag → (course name substring to match, module_level for seed data, output file suffix)
# modul 3.1 = PD3 Module 1 (PD3M1), modul 3.2 = PD3 Module 2 (PD3M2)
EXAM_MAP: dict[str, tuple[str, int, str]] = {
    "PD2":   ("modul 2", 2, "pd2"),
    "PD3M1": ("3.1",     3, "pd3m1"),   # PD3 Module 1 (modul 3.1)
    "PD3M2": ("3.2",     3, "pd3m2"),   # PD3 Module 2 (modul 3.2) ← primary target
}

# ---------------------------------------------------------------------------
# Grammar topic detection
# ---------------------------------------------------------------------------
TOPIC_KEYWORDS: list[tuple[list[str], str]] = [
    (["genus", "køn", "en-ord", "et-ord", "n-ord", "t-ord", "bestemt", "ubestemt", "flertal", "substantiv"], "noun-gender"),
    (["komparativ", "superlativ", "ere ", "mest ", "mere ", "end "], "comparative-superlative"),
    (["omvendt", "ordstilling", "inversion", "v2", "tidsadverbial", "fremsætningsled"], "inverted-word-order"),
    (["ledsætning", "bisætning", "fordi", "selvom", "at han", "at hun", "at vi", "konjunktion"], "main-subordinate-clauses"),
    (["datid", "nutid", "perfektum", "pluskvamperfektum", "imperativ", "verbum", "udsagnsord", "bøj"], "verbs-tenses"),
    (["pronomen", "refleksiv", "mig", "dig", "sig", "sin ", "sit ", "mine", "possessiv", "stedord"], "pronouns"),
]

MOODLE_TYPE_MAP = {
    "multichoice": "multiple_choice",
    "truefalse": "multiple_choice",
    "shortanswer": "type_answer",
    "numerical": "type_answer",
    "match": "matching",
    "ddmatch": "matching",
    "gapselect": "cloze",
    "ddimageortext": "cloze",
    "ddwtos": "word_order",
    "ordering": "word_order",
    "essay": "type_answer",
}

H5P_TYPE_MAP = {
    "multichoice": "multiple_choice",
    "singlechoiceset": "multiple_choice",
    "truefalse": "multiple_choice",
    "blanks": "cloze",
    "fillintheblank": "cloze",
    "dragtext": "cloze",
    "dragwords": "word_order",
    "wordsort": "word_order",
    "essay": "type_answer",
    "answerset": "type_answer",
    "questionset": "multiple_choice",
}


def detect_topic(text: str, default: str = "noun-gender") -> str:
    text_lower = text.lower()
    for keywords, slug in TOPIC_KEYWORDS:
        if any(kw in text_lower for kw in keywords):
            return slug
    # Falls back to default — review grammar_topic_slug assignments after scraping
    return default


def detect_difficulty(text: str) -> int:
    words = text.split()
    if len(words) > 20:
        return 3
    if len(words) > 10:
        return 2
    return 1


def clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;|&amp;|&lt;|&gt;", lambda m: {"&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">"}[m.group()], text)
    return re.sub(r"\s+", " ", text).strip()


def screenshot(page: Page, label: str, root: Path) -> None:
    path = root / f"src/data/seed/_ss_{label}_{datetime.now().strftime('%H%M%S')}.png"
    try:
        page.screenshot(path=str(path))
        print(f"  Screenshot → {path.name}")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
def login_interactive(page: Page, root: Path) -> None:
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
            lambda url: "speakspeak.dk" in url and "/login/" not in url and "/auth/" not in url,
            timeout=180_000,
        )
        print(f"  ✓ Logged in ({page.url})")
    except PlaywrightTimeout:
        screenshot(page, "timeout", root)
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
# Course discovery
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
        print(f"\n  Unknown exam level {exam!r}. Valid values: {list(EXAM_MAP.keys())}")
        return []

    course_filter, _ = EXAM_MAP[exam_upper]
    matched = [c for c in courses if course_filter.lower() in c["name"].lower()]
    if not matched:
        print(f"\n  No courses matched exam {exam_upper!r} (looking for {course_filter!r} in course name).")
        print(f"  Enrolled courses: {[c['name'] for c in courses]}")
        print(f"  Tip: Run with --all-courses to scrape everything.")
        return []

    print(f"\n  Matched {len(matched)} course(s) for {exam_upper}: {[c['name'] for c in matched]}")
    return matched


# ---------------------------------------------------------------------------
# Activity discovery — gets name from page title, handles all /mod/ types
# ---------------------------------------------------------------------------
def find_activities(page: Page, course_url: str) -> list[dict]:
    page.goto(course_url, wait_until="networkidle", timeout=20000)
    seen: set[str] = set()
    activities: list[dict] = []

    # Broader: grab ALL /mod/ links except resource/url/page/folder (non-interactive)
    SKIP_MODS = {"/mod/resource/", "/mod/url/", "/mod/folder/", "/mod/label/"}
    for link in page.query_selector_all("a[href*='/mod/']"):
        href = link.get_attribute("href") or ""
        if not href or href in seen:
            continue
        if any(skip in href for skip in SKIP_MODS):
            continue
        seen.add(href)
        url = href if href.startswith("http") else BASE_URL + href
        # Try to get name from parent activity container
        name = ""
        for sel in [".instancename", ".activityname", ".aalink span"]:
            el = link.query_selector(sel) or link.evaluate_handle(
                f"el => el.closest('li')?.querySelector('{sel}')"
            )
            if el:
                try:
                    t = clean(el.inner_text() if hasattr(el, "inner_text") else "")
                    if t:
                        name = t
                        break
                except Exception:
                    pass
        activities.append({"name": name, "url": url, "type": _mod_type(href)})

    print(f"    {len(activities)} activities (hvp:{sum(1 for a in activities if a['type']=='hvp')}, quiz:{sum(1 for a in activities if a['type']=='quiz')}, other:{sum(1 for a in activities if a['type'] not in ('hvp','quiz'))})")
    return activities


def _mod_type(url: str) -> str:
    for t in ("hvp", "quiz", "assign", "lesson", "scorm"):
        if f"/mod/{t}/" in url:
            return t
    return "other"


# ---------------------------------------------------------------------------
# H5P scraping — extracts from H5PIntegration JS object
# ---------------------------------------------------------------------------
def scrape_hvp(page: Page, activity: dict, module: int) -> list[dict]:
    try:
        page.goto(activity["url"], wait_until="networkidle", timeout=20000)
    except PlaywrightTimeout:
        return []

    # Get activity title from page
    title = clean(page.title().split(":")[0] if ":" in page.title() else page.title())
    name = activity["name"] or title

    # Extract H5P content via JavaScript
    try:
        h5p_raw: str = page.evaluate("() => JSON.stringify(window.H5PIntegration || null)")
        if not h5p_raw or h5p_raw == "null":
            return []
        h5p = json.loads(h5p_raw)
    except Exception:
        return []

    contents = h5p.get("contents") or {}
    exercises: list[dict] = []

    for cid, content in contents.items():
        library = (content.get("library") or "").lower()
        h5p_type = re.sub(r"h5p\.", "", library).split(" ")[0].lower()
        exercise_type = H5P_TYPE_MAP.get(h5p_type, "type_answer")

        try:
            params = json.loads(content.get("jsonContent") or "{}")
        except json.JSONDecodeError:
            continue

        extracted = _extract_h5p_exercises(params, h5p_type, exercise_type, name, module)
        exercises.extend(extracted)

    return exercises


def _extract_h5p_exercises(params: dict, h5p_type: str, exercise_type: str, name: str, module: int) -> list[dict]:
    exercises: list[dict] = []

    # H5P.MultiChoice / H5P.SingleChoiceSet
    if h5p_type in ("multichoice", "singlechoiceset", "questionset"):
        questions = params.get("questions") or [params] if "question" in params else []
        if not questions and "choices" not in params:
            questions = [params]
        for q in questions:
            question = clean(q.get("question") or q.get("text") or "")
            if not question:
                continue
            answers = q.get("answers") or q.get("choices") or []
            correct = [clean(a.get("text", "")) for a in answers if a.get("correct")]
            wrong = [clean(a.get("text", "")) for a in answers if not a.get("correct")]
            if not correct:
                continue
            exercises.append(_make_exercise(question, correct[0], wrong[:3], "multiple_choice", name, module))

    # H5P.Blanks (fill in the blanks)
    # questions[] can be strings or dicts with a "text" field
    elif h5p_type in ("blanks", "fillintheblank"):
        for q in (params.get("questions") or []):
            if isinstance(q, str):
                text = clean(q)
            elif isinstance(q, dict):
                text = clean(q.get("text") or "")
            else:
                continue
            # Extract answers from *word* pattern
            answers = re.findall(r"\*([^*]+)\*", text)
            question = re.sub(r"\*[^*]+\*", "___", text)
            if question and answers:
                exercises.append(_make_exercise(question, answers[0], [], "cloze", name, module))

    # H5P.DragText
    elif h5p_type == "dragtext":
        text = clean(params.get("textField") or "")
        answers = re.findall(r"\*([^*]+)\*", text)
        question = re.sub(r"\*[^*]+\*", "___", text)
        if question and answers:
            exercises.append(_make_exercise(question, answers[0], [], "cloze", name, module))

    # H5P.TrueFalse
    elif h5p_type == "truefalse":
        question = clean(params.get("question") or "")
        correct = "True" if params.get("correct") == "true" else "False"
        wrong = ["False"] if correct == "True" else ["True"]
        if question:
            exercises.append(_make_exercise(question, correct, wrong, "multiple_choice", name, module))

    # Recurse into nested params (e.g. H5P.QuestionSet wrapping sub-questions)
    nested = params.get("params")
    if isinstance(nested, dict) and nested.get("questions"):
        exercises.extend(_extract_h5p_exercises(nested, h5p_type, exercise_type, name, module))

    return exercises


def _make_exercise(question: str, correct: str, alternatives: list[str], ex_type: str, source_name: str, module: int) -> dict:
    return {
        "grammar_topic_slug": detect_topic(question + " " + source_name),
        "exercise_type": ex_type,
        "question": question,
        "correct_answer": correct,
        "alternatives": alternatives if alternatives else None,
        "hint": None,
        "explanation": f"Scraped from SpeakSpeak: {source_name}",
        "module_level": module,
        "difficulty": detect_difficulty(question),
        "source": "speakspeak",
    }


# ---------------------------------------------------------------------------
# Standard Moodle quiz scraping
# ---------------------------------------------------------------------------
def scrape_quiz(page: Page, activity: dict, module: int) -> list[dict]:
    try:
        page.goto(activity["url"], wait_until="networkidle", timeout=20000)
    except PlaywrightTimeout:
        return []

    title = clean(page.title().split(":")[0] if ":" in page.title() else page.title())
    name = activity["name"] or title

    btn = page.query_selector("button.btn-primary, input[name='startattempt']")
    if btn and btn.is_visible():
        try:
            btn.click(timeout=5000)
            page.wait_for_load_state("networkidle")
        except PlaywrightTimeout:
            pass

    question_els = page.query_selector_all(".que")
    exercises: list[dict] = []
    for qel in question_els:
        try:
            ex = _parse_moodle_question(qel, module, name)
            if ex:
                exercises.append(ex)
        except Exception as exc:
            print(f"      WARN: {exc}")

    return exercises


def _parse_moodle_question(qel, module: int, context_name: str) -> dict | None:
    class_list = qel.get_attribute("class") or ""
    moodle_type = next((c for c in class_list.split() if c in MOODLE_TYPE_MAP), "shortanswer")
    ex_type = MOODLE_TYPE_MAP[moodle_type]

    qtext_el = qel.query_selector(".qtext, .questiontext, .prompt")
    if not qtext_el:
        return None
    question = clean(qtext_el.inner_text())
    if not question:
        return None

    correct, alternatives, explanation = "", [], ""

    if ex_type == "multiple_choice":
        options = [clean(el.inner_text()) for el in qel.query_selector_all(".answer label") if clean(el.inner_text())]
        correct_el = qel.query_selector(".correct label, .rightanswer")
        if correct_el:
            correct = clean(correct_el.inner_text())
            alternatives = [o for o in options if o != correct]
        elif options:
            correct, alternatives = options[0], options[1:]
            explanation = "REVIEW: correct answer undetected."
    elif ex_type == "type_answer":
        el = qel.query_selector(".rightanswer, .correct")
        if el:
            text = clean(el.inner_text())
            m = re.search(r"(?:correct answer is|korrekte svar er)[:\s]+(.+)", text, re.IGNORECASE)
            correct = m.group(1).strip() if m else text
        else:
            correct = "REVIEW"
    else:
        el = qel.query_selector(".rightanswer, .correct")
        correct = clean(el.inner_text()) if el else "REVIEW"

    fb = qel.query_selector(".generalfeedback, .feedback")
    if fb:
        explanation = clean(fb.inner_text())

    return _make_exercise(question, correct, alternatives, ex_type, context_name, module)


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
                pass

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

    print(f"\n  +{added} new  ({len(new_exercises) - added} skipped as duplicates)")
    print(f"  Total: {len(existing)} exercises → {output_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape SpeakSpeak Moodle/H5P into DanskPrep seed JSON")
    parser.add_argument("--exam", type=str, default=None, metavar="LEVEL",
                        help="Exam level to scrape: PD2, PD3M1, PD3M2 (e.g. --exam PD3M2)")
    parser.add_argument("--all-courses", action="store_true", help="Scrape all enrolled courses (ignores --exam filter)")
    parser.add_argument("--output", type=str, default=None, help="Output JSON path (auto-named by exam level if omitted)")
    parser.add_argument("--visible", action="store_true", help="Show browser window")
    parser.add_argument("--interactive", action="store_true", help="Wait for manual login in browser (required for SSO)")
    parser.add_argument("--cookies", type=str, default=None, help="Path to saved cookies.json")
    parser.add_argument("--save-cookies", type=str, default="cookies.json", help="Save session cookies here after login")
    args = parser.parse_args()

    root = Path(__file__).parent.parent
    exam = args.exam.upper() if args.exam and not args.all_courses else None

    # Determine module_level and output file suffix from exam flag
    if exam and exam in EXAM_MAP:
        _, module_level, file_suffix = EXAM_MAP[exam]
    else:
        module_level = 3
        file_suffix = "all"

    exam_label = exam or "all"
    output_path = Path(args.output) if args.output else root / f"src/data/seed/exercises-{file_suffix}.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not args.interactive and not args.cookies:
        # Try saved cookies.json as default
        default_cookies = Path(__file__).parent / "cookies.json"
        if default_cookies.exists():
            args.cookies = str(default_cookies)
            print(f"  Using saved cookies: {default_cookies}")
        else:
            print("ERROR: No login method. Use --interactive (first run) or --cookies cookies.json")
            sys.exit(1)

    if args.interactive:
        args.visible = True

    print(f"\nDanskPrep — SpeakSpeak Scraper")
    print(f"  Exam:    {exam_label}  (module_level={module_level})")
    print(f"  Output:  {output_path}")
    print(f"  Login:   {'interactive' if args.interactive else 'cookies'}")
    print()

    all_exercises: list[dict] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not args.visible)
        context = browser.new_context(locale="da-DK", user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36")
        page = context.new_page()

        try:
            if args.interactive:
                print("[1/3] Waiting for manual login …")
                login_interactive(page, root)
            else:
                print("[1/3] Restoring session …")
                restore_cookies(context, Path(args.cookies), page)

            if args.save_cookies:
                save_cookies(context, Path(__file__).parent / args.save_cookies)

            print(f"\n[2/3] Finding courses …")
            courses = find_courses(page, exam, args.all_courses)
            if not courses:
                sys.exit(0)

            print(f"\n[3/3] Scraping {len(courses)} course(s) …")
            for course in courses:
                print(f"\n  ── {course['name']} ──")
                activities = find_activities(page, course["url"])
                for act in activities:
                    label = act["name"] or act["url"].split("id=")[-1]
                    try:
                        if act["type"] == "hvp":
                            exs = scrape_hvp(page, act, module_level)
                            if exs:
                                print(f"    H5P  {label!r}: {len(exs)} exercise(s)")
                                all_exercises.extend(exs)
                        elif act["type"] == "quiz":
                            exs = scrape_quiz(page, act, module_level)
                            if exs:
                                print(f"    Quiz {label!r}: {len(exs)} exercise(s)")
                                all_exercises.extend(exs)
                    except Exception as exc:
                        print(f"    WARN: skipped {label!r} — {exc}")
        finally:
            browser.close()

    review_count = sum(1 for e in all_exercises if "REVIEW" in str(e.get("correct_answer", "")))
    print(f"\n{'─'*50}")
    print(f"Scraped {len(all_exercises)} exercise(s)  ({review_count} need manual review)")

    if all_exercises:
        merge_into_seed(all_exercises, output_path)
        debug = root / f"src/data/seed/_speakspeak_raw_{file_suffix}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        debug.write_text(json.dumps(all_exercises, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  Raw dump → {debug.name}")
        if review_count:
            print(f"  Search output for 'REVIEW' to find items needing correct answers.")
    else:
        print("Nothing scraped.")
        print("  • Run with --interactive to log in fresh")
        print("  • Run with --all-courses to ignore module filter")
        print("  • Run with --visible to watch the browser")


if __name__ == "__main__":
    main()
