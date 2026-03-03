#!/usr/bin/env python3
"""
verify-exercises.py

Uses Ollama (gemma3) to verify all quiz exercises:
1. Is the correct_answer actually correct?
2. Is the hint accurate and helpful?
3. Is the hint in English? If Danish, flag it for translation.

Outputs a markdown review file.

Run: cd scripts && uv run python verify-exercises.py
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

PROJECT_ROOT = Path(__file__).parent.parent
EXERCISES_JSON = PROJECT_ROOT / "src" / "data" / "seed" / "exercises-pd3m2.json"
OUTPUT_MD = PROJECT_ROOT / "docs" / "reviews" / "2026-03-03-exercise-verification.md"

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma3:latest"

BATCH_SIZE = 5  # Small batches for accuracy


def call_ollama(prompt: str, retries: int = 2) -> str:
    """Call Ollama generate API and return the full response text."""
    payload = json.dumps({
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 4096,
        },
    }).encode("utf-8")

    req = Request(
        OLLAMA_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

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


def build_batch_prompt(exercises: list[dict], start_idx: int) -> str:
    """Build a verification prompt for a batch of exercises."""
    items = []
    for i, ex in enumerate(exercises):
        idx = start_idx + i
        parts = [f"Exercise #{idx}:"]
        parts.append(f"  Type: {ex['exercise_type']}")
        parts.append(f"  Topic: {ex['grammar_topic_slug']}")
        parts.append(f"  Question: {ex['question']}")
        parts.append(f"  Correct Answer: {ex['correct_answer']}")
        if ex.get('acceptable_answers'):
            parts.append(f"  Acceptable Answers: {', '.join(ex['acceptable_answers'])}")
        if ex.get('alternatives'):
            parts.append(f"  Wrong Alternatives: {', '.join(ex['alternatives'])}")
        if ex.get('hint'):
            parts.append(f"  Hint: {ex['hint']}")
        if ex.get('explanation'):
            parts.append(f"  Explanation: {ex['explanation']}")
        items.append("\n".join(parts))

    exercises_text = "\n\n".join(items)

    return f"""You are a Danish language expert reviewing quiz exercises for a Danish exam preparation app (Prøve i Dansk 3, Module 2).

For each exercise below, evaluate:
1. **Answer correctness**: Is the correct_answer actually the right answer to the question? Check Danish grammar rules carefully.
2. **Hint correctness**: Is the hint factually accurate and helpful? Does it mislead or contain errors?
3. **Hint language**: Is the hint in English or Danish? If it's in Danish (or mixed), provide an English translation.
4. **Alternatives**: For multiple choice, are the wrong alternatives reasonable distractors (not obviously wrong or confusingly similar)?
5. **Question clarity**: Is the question clear and unambiguous?

Return ONLY a valid JSON array. No markdown code fences, no explanation text. Each object must have:
- "exercise_index": the exercise number (e.g. 0, 1, 2...)
- "answer_correct": true/false
- "answer_issue": string explaining the issue if answer_correct is false, otherwise ""
- "suggested_answer": the correct answer if answer_correct is false, otherwise ""
- "hint_correct": true/false
- "hint_issue": string explaining the issue if hint_correct is false, otherwise ""
- "hint_language": "english", "danish", or "mixed"
- "hint_english_translation": English translation if hint is Danish/mixed, otherwise ""
- "other_issues": string with any other problems found, or ""

Here are the exercises:

{exercises_text}

Return the JSON array now:"""


def parse_response(text: str) -> list[dict] | None:
    """Parse JSON array from Ollama response."""
    text = text.strip()

    # Strip markdown code fences
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [line for line in lines if not line.strip().startswith("```")]
        text = "\n".join(lines).strip()

    start = text.find("[")
    end = text.rfind("]") + 1
    if start == -1 or end == 0:
        return None

    try:
        data = json.loads(text[start:end])
        if isinstance(data, list):
            return data
        return None
    except json.JSONDecodeError:
        return None


def main() -> None:
    # Verify Ollama
    try:
        urlopen("http://localhost:11434/api/tags", timeout=5)
    except URLError:
        print("ERROR: Ollama is not running. Start it with: ollama serve")
        sys.exit(1)

    print(f"Using model: {MODEL}")

    # Load exercises
    with open(EXERCISES_JSON, encoding="utf-8") as f:
        exercises = json.load(f)

    print(f"Total exercises: {len(exercises)}")

    # Process in batches
    batches = [
        exercises[i:i + BATCH_SIZE]
        for i in range(0, len(exercises), BATCH_SIZE)
    ]
    print(f"Processing {len(batches)} batches of up to {BATCH_SIZE}...\n")

    all_results: list[dict] = []
    failed_indices: list[int] = []

    for batch_idx, batch in enumerate(batches):
        start_idx = batch_idx * BATCH_SIZE
        end_idx = start_idx + len(batch) - 1

        print(f"Batch {batch_idx + 1}/{len(batches)} (exercises {start_idx}-{end_idx})...", end=" ", flush=True)

        prompt = build_batch_prompt(batch, start_idx)
        response = call_ollama(prompt)

        if not response:
            print("FAILED (empty response)")
            failed_indices.extend(range(start_idx, start_idx + len(batch)))
            # Store placeholder results
            for i in range(len(batch)):
                all_results.append({
                    "exercise_index": start_idx + i,
                    "answer_correct": None,
                    "answer_issue": "VERIFICATION FAILED - no LLM response",
                    "suggested_answer": "",
                    "hint_correct": None,
                    "hint_issue": "",
                    "hint_language": "unknown",
                    "hint_english_translation": "",
                    "other_issues": "",
                })
            continue

        parsed = parse_response(response)
        if not parsed:
            print("FAILED (parse error)")
            # Try to save partial response for debugging
            failed_indices.extend(range(start_idx, start_idx + len(batch)))
            for i in range(len(batch)):
                all_results.append({
                    "exercise_index": start_idx + i,
                    "answer_correct": None,
                    "answer_issue": "VERIFICATION FAILED - could not parse LLM response",
                    "suggested_answer": "",
                    "hint_correct": None,
                    "hint_issue": "",
                    "hint_language": "unknown",
                    "hint_english_translation": "",
                    "other_issues": "",
                })
            continue

        # Map results back by position
        for i, batch_ex in enumerate(batch):
            ex_idx = start_idx + i
            if i < len(parsed):
                result = parsed[i]
                result["exercise_index"] = ex_idx  # Normalize index
                all_results.append(result)
            else:
                all_results.append({
                    "exercise_index": ex_idx,
                    "answer_correct": None,
                    "answer_issue": "VERIFICATION FAILED - missing from batch response",
                    "suggested_answer": "",
                    "hint_correct": None,
                    "hint_issue": "",
                    "hint_language": "unknown",
                    "hint_english_translation": "",
                    "other_issues": "",
                })
                failed_indices.append(ex_idx)

        # Count issues in this batch
        issues_in_batch = sum(
            1 for r in parsed
            if not r.get("answer_correct", True)
            or not r.get("hint_correct", True)
            or r.get("hint_language", "english") != "english"
            or r.get("other_issues", "")
        )
        print(f"OK ({issues_in_batch} issues)")

        if batch_idx < len(batches) - 1:
            time.sleep(1)

    # Save raw results
    raw_results_path = PROJECT_ROOT / "docs" / "reviews" / "exercise-verification-raw.json"
    raw_results_path.parent.mkdir(parents=True, exist_ok=True)
    with open(raw_results_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"\nRaw results saved to {raw_results_path}")

    # Generate markdown report
    generate_markdown(exercises, all_results, failed_indices)


def generate_markdown(
    exercises: list[dict],
    results: list[dict],
    failed_indices: list[int],
) -> None:
    """Generate the markdown review report."""
    # Categorize results
    answer_issues = []
    hint_issues = []
    danish_hints = []
    other_issues = []
    correct_exercises = []

    for i, ex in enumerate(exercises):
        if i >= len(results):
            break
        r = results[i]

        has_issue = False

        if r.get("answer_correct") is False:
            answer_issues.append((i, ex, r))
            has_issue = True

        if r.get("hint_correct") is False:
            hint_issues.append((i, ex, r))
            has_issue = True

        if r.get("hint_language") in ("danish", "mixed") and ex.get("hint"):
            danish_hints.append((i, ex, r))
            has_issue = True

        if r.get("other_issues"):
            other_issues.append((i, ex, r))
            has_issue = True

        if not has_issue and r.get("answer_correct") is not None:
            correct_exercises.append((i, ex, r))

    # Build markdown
    lines = [
        "# Exercise Verification Report",
        "",
        "**Date:** 2026-03-03",
        f"**Model:** {MODEL} (Ollama local)",
        f"**Total exercises:** {len(exercises)}",
        f"**Verified:** {len(exercises) - len(failed_indices)}",
        f"**Failed to verify:** {len(failed_indices)}",
        "",
        "## Summary",
        "",
        "| Category | Count |",
        "|----------|-------|",
        f"| Answer issues | {len(answer_issues)} |",
        f"| Hint issues | {len(hint_issues)} |",
        f"| Danish/mixed hints (need English) | {len(danish_hints)} |",
        f"| Other issues | {len(other_issues)} |",
        f"| Correct (no issues) | {len(correct_exercises)} |",
        "",
        "---",
        "",
    ]

    # Section 1: Answer Issues
    lines.append("## 1. Answer Issues")
    lines.append("")
    if answer_issues:
        for idx, ex, r in answer_issues:
            lines.append(f"### Exercise #{idx}: {ex['exercise_type']} — {ex['grammar_topic_slug']}")
            lines.append("")
            lines.append(f"**Question:** {ex['question']}")
            lines.append(f"**Current Answer:** `{ex['correct_answer']}`")
            if r.get("suggested_answer"):
                lines.append(f"**Suggested Answer:** `{r['suggested_answer']}`")
            lines.append(f"**Issue:** {r.get('answer_issue', 'N/A')}")
            if ex.get('explanation'):
                lines.append(f"**Explanation:** {ex['explanation']}")
            lines.append("")
            lines.append("---")
            lines.append("")
    else:
        lines.append("_No answer issues found._")
        lines.append("")

    # Section 2: Hint Issues
    lines.append("## 2. Hint Issues")
    lines.append("")
    if hint_issues:
        for idx, ex, r in hint_issues:
            lines.append(f"### Exercise #{idx}: {ex['exercise_type']} — {ex['grammar_topic_slug']}")
            lines.append("")
            lines.append(f"**Question:** {ex['question']}")
            lines.append(f"**Current Hint:** {ex.get('hint', '(none)')}")
            lines.append(f"**Issue:** {r.get('hint_issue', 'N/A')}")
            lines.append("")
            lines.append("---")
            lines.append("")
    else:
        lines.append("_No hint issues found._")
        lines.append("")

    # Section 3: Danish Hints
    lines.append("## 3. Danish/Mixed-Language Hints — Need English Translation")
    lines.append("")
    if danish_hints:
        lines.append("| # | Type | Question (truncated) | Current Hint | Suggested English |")
        lines.append("|---|------|---------------------|--------------|-------------------|")
        for idx, ex, r in danish_hints:
            q = ex['question'][:50].replace("|", "\\|")
            h = (ex.get('hint') or '').replace("|", "\\|")
            eng = r.get('hint_english_translation', '').replace("|", "\\|")
            lines.append(f"| {idx} | {ex['exercise_type']} | {q} | {h} | {eng} |")
        lines.append("")
    else:
        lines.append("_All hints are in English._")
        lines.append("")

    # Section 4: Other Issues
    lines.append("## 4. Other Issues")
    lines.append("")
    if other_issues:
        for idx, ex, r in other_issues:
            lines.append(f"### Exercise #{idx}: {ex['exercise_type']} — {ex['grammar_topic_slug']}")
            lines.append("")
            lines.append(f"**Question:** {ex['question']}")
            lines.append(f"**Issue:** {r.get('other_issues', 'N/A')}")
            lines.append("")
            lines.append("---")
            lines.append("")
    else:
        lines.append("_No other issues found._")
        lines.append("")

    # Section 5: Correct exercises (compact table)
    lines.append("## 5. Verified Correct (No Issues)")
    lines.append("")
    lines.append(f"_{len(correct_exercises)} exercises passed verification._")
    lines.append("")
    if correct_exercises:
        lines.append("| # | Type | Topic | Question (truncated) | Answer |")
        lines.append("|---|------|-------|---------------------|--------|")
        for idx, ex, r in correct_exercises:
            q = ex['question'][:45].replace("|", "\\|")
            a = ex['correct_answer'][:30].replace("|", "\\|")
            lines.append(f"| {idx} | {ex['exercise_type']} | {ex['grammar_topic_slug']} | {q} | {a} |")
        lines.append("")

    # Section 6: Failed verification
    if failed_indices:
        lines.append("## 6. Failed Verification (LLM Error)")
        lines.append("")
        lines.append(f"_{len(failed_indices)} exercises could not be verified due to LLM errors._")
        lines.append("")
        for idx in failed_indices:
            if idx < len(exercises):
                ex = exercises[idx]
                lines.append(f"- **#{idx}** ({ex['exercise_type']}): {ex['question'][:60]}")
        lines.append("")

    # Write
    OUTPUT_MD.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Report saved to {OUTPUT_MD}")

    # Summary
    print(f"\n{'=' * 50}")
    print(f"Answer issues:     {len(answer_issues)}")
    print(f"Hint issues:       {len(hint_issues)}")
    print(f"Danish hints:      {len(danish_hints)}")
    print(f"Other issues:      {len(other_issues)}")
    print(f"Correct:           {len(correct_exercises)}")
    print(f"Failed to verify:  {len(failed_indices)}")


if __name__ == "__main__":
    main()
