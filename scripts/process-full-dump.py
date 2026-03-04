#!/usr/bin/env python3
"""
Post-process a SpeakSpeak full course dump.

Reads the JSON output from scrape-speakspeak-full.py and:
  1. Extracts exercises from H5P/quiz items (using revealed solutions)
  2. Extracts text from pages, resources, labels for vocabulary mining
  3. Verifies exercises via LLM (correctness, hints, grammar)
  4. Enriches vocabulary via LLM (inflections, gender, examples)

Supports two LLM backends:
  --llm claude   Uses Claude API (ANTHROPIC_API_KEY required)
  --llm ollama   Uses local Ollama (gemma3, no API key needed)

Usage:
  cd scripts

  # Extract only (no LLM calls)
  uv run python process-full-dump.py data/speakspeak-full-pd3m2_*.json --extract-only

  # Full pipeline with Claude
  ANTHROPIC_API_KEY=sk-ant-... uv run python process-full-dump.py data/speakspeak-full-pd3m2_*.json --llm claude

  # Full pipeline with Ollama (must be running: ollama serve)
  uv run python process-full-dump.py data/speakspeak-full-pd3m2_*.json --llm ollama

Output:
  scripts/data/dump-exercises-{timestamp}.json     — extracted + verified exercises
  scripts/data/dump-vocabulary-{timestamp}.json     — extracted + enriched vocabulary
  scripts/data/dump-text-{timestamp}.json           — raw text content from all pages
  docs/reviews/dump-verification-{timestamp}.md     — exercise verification report
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import textwrap
import time
from datetime import datetime
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

PROJECT_ROOT = Path(__file__).parent.parent
WORDS_JSON = PROJECT_ROOT / "src" / "data" / "seed" / "words-pd3m2.json"
EXERCISES_JSON = PROJECT_ROOT / "src" / "data" / "seed" / "exercises-pd3m2.json"

# ---------------------------------------------------------------------------
# LLM backends
# ---------------------------------------------------------------------------
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma3:latest"


def call_ollama(prompt: str, retries: int = 2) -> str:
    """Call Ollama generate API."""
    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.1, "num_predict": 4096},
    }).encode("utf-8")

    req = Request(OLLAMA_URL, data=payload,
                  headers={"Content-Type": "application/json"}, method="POST")

    for attempt in range(retries + 1):
        try:
            with urlopen(req, timeout=180) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result.get("response", "")
        except URLError as e:
            if attempt < retries:
                print(f"  Retry {attempt + 1}...")
                time.sleep(2)
            else:
                print(f"  ERROR: Ollama request failed: {e}")
                return ""
    return ""


def call_claude(client, prompt: str, system: str = "") -> str:
    """Call Claude API."""
    messages = [{"role": "user", "content": prompt}]
    kwargs = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 4096,
        "messages": messages,
    }
    if system:
        kwargs["system"] = system
    message = client.messages.create(**kwargs)
    return message.content[0].text.strip()


def call_llm(prompt: str, llm: str, client=None, system: str = "") -> str:
    """Dispatch to the configured LLM backend."""
    if llm == "ollama":
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        return call_ollama(full_prompt)
    elif llm == "claude":
        if not client:
            raise ValueError("Claude client required")
        return call_claude(client, prompt, system)
    else:
        raise ValueError(f"Unknown LLM backend: {llm}")


def parse_json_array(text: str) -> list[dict] | None:
    """Extract a JSON array from LLM response text."""
    text = text.strip()
    # Strip markdown code fences
    if "```" in text:
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    start = text.find("[")
    end = text.rfind("]") + 1
    if start == -1 or end == 0:
        return None
    try:
        data = json.loads(text[start:end])
        return data if isinstance(data, list) else None
    except json.JSONDecodeError:
        return None


# ---------------------------------------------------------------------------
# Phase 1: Extract content from full dump
# ---------------------------------------------------------------------------
def clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(
        r"&nbsp;|&amp;|&lt;|&gt;",
        lambda m: {"&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">"}[m.group()],
        text,
    )
    return re.sub(r"\s+", " ", text).strip()


def extract_from_dump(dump: dict) -> tuple[list[dict], list[dict], list[dict]]:
    """
    Extract exercises, text content, and raw items from the full dump.
    Returns (exercises, text_items, all_items).
    """
    exercises: list[dict] = []
    text_items: list[dict] = []
    all_items: list[dict] = []

    for section in dump.get("sections", []):
        sec_num = section.get("section_number", 0)
        sec_title = section.get("title", "")

        for item in section.get("items", []):
            all_items.append(item)
            item_type = item.get("type", "")
            url = item.get("url", "")
            name = item.get("name", "")

            # Extract exercises from H5P items
            if item_type == "hvp" and item.get("h5p_json"):
                h5p_exercises = _extract_h5p_exercises(item, sec_num, sec_title)
                exercises.extend(h5p_exercises)

            # Extract exercises from quiz items
            if item_type == "quiz" and item.get("quiz_questions"):
                for q in item["quiz_questions"]:
                    exercises.append({
                        "source_url": url,
                        "source_name": name,
                        "section": sec_num,
                        "question": q.get("question", ""),
                        "correct_answer": q.get("correct_answer", ""),
                        "exercise_type": "type_answer",
                        "raw": q,
                    })

            # Collect text content for vocabulary mining
            raw_text = item.get("raw_text", "")
            if raw_text and len(raw_text) > 20:
                text_items.append({
                    "source_url": url,
                    "source_name": name,
                    "section": sec_num,
                    "section_title": sec_title,
                    "type": item_type,
                    "text": raw_text,
                })

    return exercises, text_items, all_items


def _extract_h5p_exercises(item: dict, sec_num: int, sec_title: str) -> list[dict]:
    """Extract exercises from an H5P item's h5p_json data.

    All correct answers come from the jsonContent structure — not from the
    rendered DOM (H5P runs in an iframe so raw_html only has the wrapper).
    """
    exercises: list[dict] = []
    h5p = item.get("h5p_json", {})
    url = item.get("url", "")
    name = item.get("name", "")

    contents = h5p.get("contents") or {}
    for cid, content in contents.items():
        library = (content.get("library") or "").lower()
        h5p_type = re.sub(r"h5p\.", "", library).split(" ")[0].lower()

        try:
            params = json.loads(content.get("jsonContent") or "{}")
        except json.JSONDecodeError:
            continue

        extracted = _parse_h5p_params(params, h5p_type, name, url, sec_num)
        exercises.extend(extracted)

    return exercises


def _parse_h5p_params(params: dict, h5p_type: str, name: str, url: str, sec_num: int) -> list[dict]:
    """Parse H5P jsonContent params into exercise dicts.

    Handles all 6 H5P types found in PD3M2:
    - Blanks (33): *answer* markers in question strings, with optional (hint)
    - SingleChoiceSet (8): choices[] array, answers[0] is always correct
    - QuestionSet (3): container wrapping sub-questions with own library types
    - DragText (2): *word* markers in textField
    - MarkTheWords (1): *word* markers in textField (incorrect sentences)
    - AudioRecorder (2): skipped (recording only, no answers)
    """
    exercises: list[dict] = []

    # --- H5P.Blanks / FillInTheBlank ---
    if h5p_type in ("blanks", "fillintheblank"):
        for q in (params.get("questions") or []):
            text = clean(q if isinstance(q, str) else q.get("text", ""))
            if not text:
                continue

            # Extract all *answer* markers (may include /alternative answers)
            raw_answers = re.findall(r"\*([^*]+)\*", text)
            question = re.sub(r"\*[^*]+\*", "___", text)

            # Strip (hint) parenthetical from the question text
            hint_match = re.search(r"\(([^)]+)\)\s*$", question)
            hint = hint_match.group(1) if hint_match else ""
            if hint_match:
                question = question[:hint_match.start()].rstrip()

            if not question or not raw_answers:
                continue

            # Each *answer* may contain /alternatives: "*har/havde*"
            for i, raw_ans in enumerate(raw_answers):
                # Split alternatives: "har/havde" → primary="har", alts=["havde"]
                parts = [a.strip() for a in raw_ans.split("/") if a.strip()]
                primary = parts[0] if parts else raw_ans
                alternatives = parts[1:] if len(parts) > 1 else []

                # Per-blank hint from (parenthetical) right after the blank
                blank_hint = ""
                blank_hint_match = re.search(
                    r"\*" + re.escape(raw_ans) + r"\*\s*\(([^)]+)\)", text
                )
                if blank_hint_match:
                    blank_hint = blank_hint_match.group(1)

                # Build per-blank question: fill other blanks with their
                # answers, leave only THIS blank as ___
                if len(raw_answers) > 1:
                    per_blank_q = text
                    for j, other_ans in enumerate(raw_answers):
                        other_primary = other_ans.split("/")[0].strip()
                        if j == i:
                            per_blank_q = per_blank_q.replace(
                                f"*{other_ans}*", "___", 1
                            )
                        else:
                            per_blank_q = per_blank_q.replace(
                                f"*{other_ans}*", other_primary, 1
                            )
                    # Strip any remaining (hint) parentheticals
                    per_blank_q = re.sub(r"\s*\([^)]*\)", "", per_blank_q)
                    per_blank_q = clean(per_blank_q)
                else:
                    per_blank_q = question

                exercises.append({
                    "source_url": url, "source_name": name, "section": sec_num,
                    "question": per_blank_q, "correct_answer": primary,
                    "alternatives": alternatives,
                    "hint": blank_hint or hint,
                    "exercise_type": "cloze",
                    "blank_index": i, "total_blanks": len(raw_answers),
                    "raw": {"h5p_type": h5p_type},
                })

    # --- H5P.SingleChoiceSet ---
    # Structure: choices[] array, each with {question, answers[]}
    # Correct answer is ALWAYS answers[0]
    elif h5p_type == "singlechoiceset":
        for choice in (params.get("choices") or []):
            question = clean(choice.get("question") or "")
            answers = choice.get("answers") or []
            if not question or not answers:
                continue
            correct = clean(answers[0] if isinstance(answers[0], str) else answers[0].get("text", ""))
            wrong = [
                clean(a if isinstance(a, str) else a.get("text", ""))
                for a in answers[1:]
            ]
            if correct:
                exercises.append({
                    "source_url": url, "source_name": name, "section": sec_num,
                    "question": question, "correct_answer": correct,
                    "alternatives": wrong[:3],
                    "exercise_type": "multiple_choice",
                    "raw": {"h5p_type": h5p_type},
                })

    # --- H5P.MultiChoice ---
    elif h5p_type == "multichoice":
        question = clean(params.get("question") or "")
        answers = params.get("answers") or []
        if question and answers:
            correct = [clean(a.get("text", "")) for a in answers if a.get("correct")]
            wrong = [clean(a.get("text", "")) for a in answers if not a.get("correct")]
            if correct:
                exercises.append({
                    "source_url": url, "source_name": name, "section": sec_num,
                    "question": question, "correct_answer": correct[0],
                    "alternatives": wrong[:3],
                    "exercise_type": "multiple_choice",
                    "raw": {"h5p_type": h5p_type},
                })

    # --- H5P.QuestionSet (container) ---
    # Wraps heterogeneous sub-questions, each with own {library, params}
    elif h5p_type == "questionset":
        for sub_q in (params.get("questions") or []):
            sub_library = (sub_q.get("library") or "").lower()
            sub_type = re.sub(r"h5p\.", "", sub_library).split(" ")[0].lower()
            sub_params = sub_q.get("params") or {}
            if sub_type and sub_params:
                sub_exercises = _parse_h5p_params(
                    sub_params, sub_type, name, url, sec_num
                )
                exercises.extend(sub_exercises)

    # --- H5P.DragText ---
    elif h5p_type == "dragtext":
        raw_text = params.get("textField") or ""
        text = clean(raw_text)
        task_desc = clean(params.get("taskDescription") or "")
        answers = re.findall(r"\*([^*]+)\*", text)
        if text and answers:
            for i, ans in enumerate(answers):
                # Build per-blank question: fill other blanks, leave this one
                if len(answers) > 1:
                    per_blank_q = text
                    for j, other_ans in enumerate(answers):
                        if j == i:
                            per_blank_q = per_blank_q.replace(
                                f"*{other_ans}*", "___", 1
                            )
                        else:
                            per_blank_q = per_blank_q.replace(
                                f"*{other_ans}*", other_ans, 1
                            )
                    per_blank_q = clean(per_blank_q)
                else:
                    per_blank_q = re.sub(r"\*[^*]+\*", "___", text)

                exercises.append({
                    "source_url": url, "source_name": name, "section": sec_num,
                    "question": per_blank_q, "correct_answer": ans,
                    "hint": task_desc,
                    "exercise_type": "cloze",
                    "blank_index": i, "total_blanks": len(answers),
                    "raw": {"h5p_type": h5p_type},
                })

    # --- H5P.MarkTheWords ---
    elif h5p_type == "markthewords":
        text_field = params.get("textField") or ""
        task_desc = clean(params.get("taskDescription") or "")
        # Each line/sentence has *marked* words — the incorrect parts
        # Split by <p> or newlines to get individual sentences
        segments = re.split(r"</?p>|\n", text_field)
        for seg in segments:
            seg = seg.strip()
            if not seg or "*" not in seg:
                continue
            marked = re.findall(r"\*([^*]+)\*", seg)
            plain = clean(re.sub(r"\*", "", seg))
            if marked and plain:
                exercises.append({
                    "source_url": url, "source_name": name, "section": sec_num,
                    "question": plain,
                    "correct_answer": ", ".join(marked),
                    "hint": task_desc,
                    "exercise_type": "error_correction",
                    "raw": {"h5p_type": h5p_type, "marked_words": marked},
                })

    # --- H5P.TrueFalse ---
    elif h5p_type == "truefalse":
        question = clean(params.get("question") or "")
        correct = "True" if params.get("correct") == "true" else "False"
        wrong = ["False"] if correct == "True" else ["True"]
        if question:
            exercises.append({
                "source_url": url, "source_name": name, "section": sec_num,
                "question": question, "correct_answer": correct,
                "alternatives": wrong,
                "exercise_type": "multiple_choice",
                "raw": {"h5p_type": h5p_type},
            })

    # --- H5P.AudioRecorder --- (skip, no quiz value)
    elif h5p_type == "audiorecorder":
        pass

    return exercises


# ---------------------------------------------------------------------------
# Phase 2: Verify exercises via LLM
# ---------------------------------------------------------------------------
VERIFY_SYSTEM = textwrap.dedent("""
    You are a Danish language expert reviewing quiz exercises for a PD3 Module 2
    Danish exam preparation app (Prøve i Dansk 3).

    For each exercise, evaluate:
    1. Answer correctness: Is the correct_answer actually right?
    2. Question clarity: Is it clear and unambiguous?
    3. Grammar accuracy: Is the Danish correct?

    Return ONLY a valid JSON array. Each object must have:
    - "index": exercise number
    - "answer_correct": true/false
    - "issue": string explaining any problem, or ""
    - "suggested_answer": corrected answer if wrong, or ""
    - "quality": "good" | "needs_review" | "bad"
""").strip()

VERIFY_BATCH_SIZE = 5


def verify_exercises(exercises: list[dict], llm: str, client=None) -> list[dict]:
    """Verify exercises in batches via LLM."""
    results: list[dict] = []
    batches = [exercises[i:i + VERIFY_BATCH_SIZE]
               for i in range(0, len(exercises), VERIFY_BATCH_SIZE)]

    print(f"\n  Verifying {len(exercises)} exercises in {len(batches)} batches...")

    for batch_idx, batch in enumerate(batches):
        start_idx = batch_idx * VERIFY_BATCH_SIZE
        print(f"    Batch {batch_idx + 1}/{len(batches)}...", end=" ", flush=True)

        items_text = []
        for i, ex in enumerate(batch):
            idx = start_idx + i
            parts = [f"#{idx}: [{ex.get('exercise_type', '?')}]"]
            parts.append(f"  Q: {ex.get('question', '')}")
            parts.append(f"  A: {ex.get('correct_answer', '')}")
            if ex.get("alternatives"):
                parts.append(f"  Wrong: {', '.join(ex['alternatives'])}")
            items_text.append("\n".join(parts))

        prompt = "Verify these Danish exercises:\n\n" + "\n\n".join(items_text)
        response = call_llm(prompt, llm, client, system=VERIFY_SYSTEM)
        parsed = parse_json_array(response)

        if parsed:
            for i, batch_ex in enumerate(batch):
                idx = start_idx + i
                if i < len(parsed):
                    r = parsed[i]
                    r["index"] = idx
                    results.append(r)
                else:
                    results.append({"index": idx, "answer_correct": None,
                                    "issue": "Missing from LLM response", "quality": "needs_review"})
            issues = sum(1 for r in parsed if not r.get("answer_correct", True))
            print(f"OK ({issues} issues)")
        else:
            print("FAILED (parse error)")
            for i in range(len(batch)):
                results.append({"index": start_idx + i, "answer_correct": None,
                                "issue": "LLM parse error", "quality": "needs_review"})

        if batch_idx < len(batches) - 1:
            time.sleep(0.5 if llm == "claude" else 1.0)

    return results


# ---------------------------------------------------------------------------
# Phase 3: Extract and enrich vocabulary via LLM
# ---------------------------------------------------------------------------
VOCAB_SYSTEM = textwrap.dedent("""
    You are a Danish linguistics expert building a vocabulary database for PD3 Module 2.

    Extract VERBS, ADJECTIVES, and NOUNS from the Danish text.
    Skip very common words (være, have, kunne, ville, skulle, måtte) and proper nouns.

    For each word, return a JSON object:
    {
      "danish": "infinitive/base form (no 'at' for verbs)",
      "english": "English translation",
      "part_of_speech": "verb" | "adjective" | "noun",
      "gender": null for verbs/adj, "en" or "et" for nouns,
      "tags": ["semantic_tag"],
      "difficulty": 1|2|3,
      "inflections": {
        "present": "...", "past": "...", "perfect": "har/er ...", "imperative": "..."
      },
      "example_da": "Danish example sentence",
      "example_en": "English translation"
    }

    Inflection keys by POS:
    - Verbs: present, past, perfect, imperative
    - Adjectives: t_form, e_form, comparative, superlative
    - Nouns: definite, plural_indef, plural_def

    Return ONLY a valid JSON array.
""").strip()

VOCAB_BATCH_SIZE = 10


def enrich_vocabulary(
    text_items: list[dict], llm: str, client=None
) -> list[dict]:
    """Extract and enrich vocabulary from text content."""
    # Collect all text segments, dedup
    texts: list[str] = []
    seen: set[str] = set()
    for item in text_items:
        text = item.get("text", "").strip()
        # Split long texts into ~500-char chunks for better extraction
        if len(text) > 500:
            sentences = re.split(r"[.!?]\s+", text)
            chunk = ""
            for s in sentences:
                if len(chunk) + len(s) > 500:
                    if chunk and chunk not in seen:
                        texts.append(chunk)
                        seen.add(chunk)
                    chunk = s
                else:
                    chunk = f"{chunk}. {s}" if chunk else s
            if chunk and chunk not in seen:
                texts.append(chunk)
                seen.add(chunk)
        elif text and text not in seen:
            texts.append(text)
            seen.add(text)

    if not texts:
        print("  No text content to extract vocabulary from.")
        return []

    # Load existing vocabulary for dedup
    existing_danish: set[str] = set()
    if WORDS_JSON.exists():
        with open(WORDS_JSON, encoding="utf-8") as f:
            existing_words = json.load(f)
        existing_danish = {w["danish"].strip().lower() for w in existing_words}
        print(f"  Existing vocabulary: {len(existing_danish)} words")

    batches = [texts[i:i + VOCAB_BATCH_SIZE]
               for i in range(0, len(texts), VOCAB_BATCH_SIZE)]
    print(f"  Extracting vocabulary from {len(texts)} text segments in {len(batches)} batches...")

    all_words: list[dict] = []
    new_danish: set[str] = set()

    for batch_idx, batch in enumerate(batches):
        print(f"    Batch {batch_idx + 1}/{len(batches)}...", end=" ", flush=True)

        prompt = "Extract vocabulary from this Danish text:\n\n" + "\n\n".join(
            f"{i+1}. {t}" for i, t in enumerate(batch)
        )
        response = call_llm(prompt, llm, client, system=VOCAB_SYSTEM)
        parsed = parse_json_array(response)

        if parsed:
            added = 0
            for word in parsed:
                danish = (word.get("danish") or "").strip().lower()
                if not danish or not word.get("inflections"):
                    continue
                if danish in existing_danish or danish in new_danish:
                    continue
                if word.get("part_of_speech") not in ("verb", "adjective", "noun"):
                    continue

                # Normalize
                word["danish"] = danish
                word["module_level"] = 3
                word["source"] = "speakspeak-full-dump"
                all_words.append(word)
                new_danish.add(danish)
                added += 1
            print(f"OK (+{added} new words)")
        else:
            print("FAILED (parse error)")

        if batch_idx < len(batches) - 1:
            time.sleep(0.5 if llm == "claude" else 1.0)

    return all_words


# ---------------------------------------------------------------------------
# Phase 4: Output
# ---------------------------------------------------------------------------
def generate_verification_report(
    exercises: list[dict], results: list[dict]
) -> str:
    """Generate markdown verification report."""
    lines = [
        "# Full Dump — Exercise Verification Report",
        "",
        f"**Date:** {datetime.now().strftime('%Y-%m-%d')}",
        f"**Total exercises:** {len(exercises)}",
        f"**Verified:** {sum(1 for r in results if r.get('answer_correct') is not None)}",
        "",
        "## Summary",
        "",
        "| Quality | Count |",
        "|---------|-------|",
        f"| Good | {sum(1 for r in results if r.get('quality') == 'good')} |",
        f"| Needs review | {sum(1 for r in results if r.get('quality') == 'needs_review')} |",
        f"| Bad | {sum(1 for r in results if r.get('quality') == 'bad')} |",
        f"| Answer incorrect | {sum(1 for r in results if r.get('answer_correct') is False)} |",
        "",
        "---",
        "",
    ]

    # Issues
    lines.append("## Issues Found")
    lines.append("")
    has_issues = False
    for r in results:
        if r.get("answer_correct") is False or r.get("quality") == "bad":
            idx = r.get("index", "?")
            ex = exercises[idx] if isinstance(idx, int) and idx < len(exercises) else {}
            lines.append(f"### Exercise #{idx}")
            lines.append(f"**Source:** {ex.get('source_name', '?')} ({ex.get('source_url', '')})")
            lines.append(f"**Question:** {ex.get('question', '')}")
            lines.append(f"**Current answer:** `{ex.get('correct_answer', '')}`")
            if r.get("suggested_answer"):
                lines.append(f"**Suggested answer:** `{r['suggested_answer']}`")
            lines.append(f"**Issue:** {r.get('issue', '')}")
            lines.append("")
            has_issues = True

    if not has_issues:
        lines.append("_No major issues found._")
        lines.append("")

    return "\n".join(lines)


def write_outputs(
    exercises: list[dict],
    verify_results: list[dict],
    vocabulary: list[dict],
    text_items: list[dict],
    output_dir: Path,
) -> None:
    """Write all output files."""
    output_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Exercises (with verification results merged)
    for i, ex in enumerate(exercises):
        if i < len(verify_results):
            ex["verification"] = verify_results[i]
    ex_path = output_dir / f"dump-exercises-{ts}.json"
    ex_path.write_text(json.dumps(exercises, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  Exercises: {ex_path} ({len(exercises)} items)")

    # Vocabulary
    vocab_path = output_dir / f"dump-vocabulary-{ts}.json"
    vocab_path.write_text(json.dumps(vocabulary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  Vocabulary: {vocab_path} ({len(vocabulary)} words)")

    # Raw text
    text_path = output_dir / f"dump-text-{ts}.json"
    text_path.write_text(json.dumps(text_items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  Text content: {text_path} ({len(text_items)} items)")

    # Verification report
    if verify_results:
        report = generate_verification_report(exercises, verify_results)
        report_dir = PROJECT_ROOT / "docs" / "reviews"
        report_dir.mkdir(parents=True, exist_ok=True)
        report_path = report_dir / f"dump-verification-{ts}.md"
        report_path.write_text(report, encoding="utf-8")
        print(f"  Report: {report_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Post-process SpeakSpeak full course dump"
    )
    parser.add_argument("dump_file", type=str, help="Path to speakspeak-full-*.json")
    parser.add_argument(
        "--llm", choices=["claude", "ollama"], default="ollama",
        help="LLM backend for verification/enrichment (default: ollama)",
    )
    parser.add_argument(
        "--extract-only", action="store_true",
        help="Only extract exercises and text, skip LLM processing",
    )
    parser.add_argument(
        "--skip-verify", action="store_true",
        help="Skip exercise verification step",
    )
    parser.add_argument(
        "--skip-vocab", action="store_true",
        help="Skip vocabulary enrichment step",
    )
    parser.add_argument(
        "--output-dir", type=str, default=None,
        help="Output directory (default: scripts/data/)",
    )
    args = parser.parse_args()

    dump_path = Path(args.dump_file)
    if not dump_path.exists():
        print(f"ERROR: File not found: {dump_path}")
        sys.exit(1)

    output_dir = Path(args.output_dir) if args.output_dir else Path(__file__).parent / "data"

    # Load dump
    print(f"Loading dump: {dump_path}")
    with open(dump_path, encoding="utf-8") as f:
        dump = json.load(f)

    meta = dump.get("meta", {})
    print(f"  Course: {meta.get('course_name', '?')}")
    print(f"  Sections: {meta.get('total_sections', '?')}")
    print(f"  Items: {meta.get('total_items', '?')}")

    # Phase 1: Extract
    print("\n[Phase 1] Extracting content...")
    exercises, text_items, all_items = extract_from_dump(dump)
    print(f"  Exercises found: {len(exercises)}")
    print(f"  Text items: {len(text_items)}")
    print(f"  Total items: {len(all_items)}")

    # Dedup exercises against existing seed
    if EXERCISES_JSON.exists():
        with open(EXERCISES_JSON, encoding="utf-8") as f:
            existing = json.load(f)
        existing_keys = {(e.get("question", "")[:80].lower(), e.get("correct_answer", "").lower())
                         for e in existing}
        before = len(exercises)
        exercises = [e for e in exercises
                     if (e.get("question", "")[:80].lower(), e.get("correct_answer", "").lower())
                     not in existing_keys]
        print(f"  After dedup vs existing: {len(exercises)} ({before - len(exercises)} duplicates removed)")

    if args.extract_only:
        print("\n[Extract only mode — skipping LLM processing]")
        write_outputs(exercises, [], [], text_items, output_dir)
        return

    # Setup LLM client
    client = None
    if args.llm == "claude":
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            print("ERROR: ANTHROPIC_API_KEY not set. Export it or use --llm ollama")
            sys.exit(1)
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
        except ImportError:
            print("ERROR: Run: cd scripts && uv sync")
            sys.exit(1)
    elif args.llm == "ollama":
        try:
            urlopen("http://localhost:11434/api/tags", timeout=5)
        except URLError:
            print("ERROR: Ollama not running. Start with: ollama serve")
            sys.exit(1)

    # Phase 2: Verify exercises
    verify_results: list[dict] = []
    if not args.skip_verify and exercises:
        print(f"\n[Phase 2] Verifying exercises (LLM: {args.llm})...")
        verify_results = verify_exercises(exercises, args.llm, client)
        bad = sum(1 for r in verify_results if r.get("answer_correct") is False)
        print(f"  Results: {bad} issues found out of {len(verify_results)} verified")
    elif args.skip_verify:
        print("\n[Phase 2] Skipped (--skip-verify)")

    # Phase 3: Enrich vocabulary
    vocabulary: list[dict] = []
    if not args.skip_vocab and text_items:
        print(f"\n[Phase 3] Extracting vocabulary (LLM: {args.llm})...")
        vocabulary = enrich_vocabulary(text_items, args.llm, client)
        print(f"  New vocabulary: {len(vocabulary)} words")
    elif args.skip_vocab:
        print("\n[Phase 3] Skipped (--skip-vocab)")

    # Phase 4: Write outputs
    print(f"\n[Phase 4] Writing outputs to {output_dir}/")
    write_outputs(exercises, verify_results, vocabulary, text_items, output_dir)

    print("\nDone!")


if __name__ == "__main__":
    main()
