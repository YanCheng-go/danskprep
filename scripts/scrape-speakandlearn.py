#!/usr/bin/env python3
"""
scrape-speakandlearn.py

Scrapes Danish verb data from speakandlearn.dk and merges into words-pd3m2.json.

Two sources:
  1. /danish-irregular-verbs-common/  — ~80 irregular verbs, full conjugation table
     (English | Infinitiv | Nutid | Datid | Førnutid)
  2. /common-verbs-400-common-danish-verbs/  — ~400 common verbs, English | Danish only

Usage:
  cd scripts
  uv run python scrape-speakandlearn.py          # use embedded (pre-scraped) data
  uv run python scrape-speakandlearn.py --live   # re-scrape from the web (needs urllib)

Output:
  Updates ../src/data/seed/words-pd3m2.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.request import urlopen, Request
from html.parser import HTMLParser

PROJECT_ROOT = Path(__file__).parent.parent
WORDS_JSON = PROJECT_ROOT / "src/data/seed/words-pd3m2.json"

# ---------------------------------------------------------------------------
# Imperative derivation
# ---------------------------------------------------------------------------

# Verbs where the simple rule gives wrong result
IMPERATIVE_OVERRIDES: dict[str, str] = {
    "le": "le",
    "se": "se",
    "gå": "gå",
    "slå": "slå",
    "stå": "stå",
    "nå": "nå",
    "få": "få",
    "at kunne lide": "kan lide",
    "slås": "slås",
    "findes": "findes",
}


def derive_imperative(infinitive: str) -> str:
    """
    Derive imperative from infinitive:
    1. Check overrides
    2. Double-consonant + e ending (komme→kom, drikke→drik): drop to single
    3. Ends in -e with length > 2: drop the -e
    4. Otherwise: keep as-is
    """
    if infinitive in IMPERATIVE_OVERRIDES:
        return IMPERATIVE_OVERRIDES[infinitive]
    # Double consonant before final -e: binde→bind is handled by simple rule,
    # but komme (mm→m), drikke (kk→k), ligge (gg→g) etc. need special handling
    m = re.match(r'^(.*?)([a-zæøå])\2e$', infinitive)
    if m:
        return m.group(1) + m.group(2)
    if infinitive.endswith("e") and len(infinitive) > 2:
        return infinitive[:-1]
    return infinitive


# ---------------------------------------------------------------------------
# Perfect auxiliary (er vs har)
# ---------------------------------------------------------------------------

# Intransitive movement/change-of-state verbs that use "er" as perfect auxiliary
ER_AUXILIARY: set[str] = {
    "gå", "komme", "løbe", "flyve", "falde", "stige", "rejse", "ankomme",
    "blive", "glide", "snige", "springe", "ride", "synke", "skride",
    "forsvinde", "rejse",
}


def build_perfect(infinitive: str, foernutid: str) -> str:
    aux = "er" if infinitive in ER_AUXILIARY else "har"
    return f"{aux} {foernutid}"


# ---------------------------------------------------------------------------
# HTML table parser (for live scraping)
# ---------------------------------------------------------------------------

class TableParser(HTMLParser):
    """Extracts all text cells from an HTML table."""

    def __init__(self) -> None:
        super().__init__()
        self.rows: list[list[str]] = []
        self._current_row: list[str] | None = None
        self._current_cell: str = ""
        self._in_cell = False

    def handle_starttag(self, tag: str, attrs: list) -> None:
        if tag == "tr":
            self._current_row = []
        elif tag in ("td", "th") and self._current_row is not None:
            self._in_cell = True
            self._current_cell = ""

    def handle_endtag(self, tag: str) -> None:
        if tag in ("td", "th") and self._current_row is not None:
            self._current_row.append(self._current_cell.strip())
            self._in_cell = False
        elif tag == "tr" and self._current_row is not None:
            if any(c.strip() for c in self._current_row):
                self.rows.append(self._current_row)
            self._current_row = None

    def handle_data(self, data: str) -> None:
        if self._in_cell:
            self._current_cell += data


def fetch_page(url: str) -> str:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 DanishPrepBot/1.0"})
    with urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_table_from_html(html: str) -> list[list[str]]:
    parser = TableParser()
    parser.feed(html)
    return parser.rows


# ---------------------------------------------------------------------------
# Embedded data (pre-scraped 2026-03-01)
# ---------------------------------------------------------------------------

# Columns: english, infinitive, nutid, datid, foernutid
IRREGULAR_VERBS_RAW: list[tuple[str, str, str, str, str]] = [
    ("to ask / to pray", "bede", "beder", "bad", "bedt"),
    ("to mean", "betyde", "betyder", "betød", "betydet"),
    ("to bite", "bide", "bider", "bed", "bidt"),
    ("to tie", "binde", "binder", "bandt", "bundet"),
    ("to stay / to become", "blive", "bliver", "blev", "blevet"),
    ("to break", "bryde", "bryder", "brød", "brudt"),
    ("to carry", "bære", "bærer", "bar", "båret"),
    ("to drink", "drikke", "drikker", "drak", "drukket"),
    ("to fall", "falde", "falder", "faldt", "faldet"),
    ("to find", "finde", "finder", "fandt", "fundet"),
    ("to float", "flyde", "flyder", "flød", "flydt"),
    ("to fly", "flyve", "flyver", "fløj", "fløjet"),
    ("to regret", "fortryde", "fortryder", "fortrød", "fortrudt"),
    ("to be cold / to freeze", "fryse", "fryser", "frøs", "frosset"),
    ("to get / to receive", "få", "får", "fik", "fået"),
    ("to bother / to feel like", "gide", "gider", "gad", "gidet"),
    ("to give", "give", "giver", "gav", "givet"),
    ("to slide / to glide", "glide", "glider", "gled", "gledet"),
    ("to catch / to grip", "gribe", "griber", "greb", "grebet"),
    ("to cry", "græde", "græder", "græd", "grædt"),
    ("to be valid", "gælde", "gælder", "gjaldt", "gjaldt"),
    ("to walk / to go", "gå", "går", "gik", "gået"),
    ("to be named", "hedde", "hedder", "hed", "heddet"),
    ("to help", "hjælpe", "hjælper", "hjalp", "hjulpet"),
    ("to hold / to keep", "holde", "holder", "holdt", "holdt"),
    ("to hang", "hænge", "hænger", "hang", "hængt"),
    ("to pinch", "knibe", "kniber", "kneb", "knebet"),
    ("to come", "komme", "kommer", "kom", "kommet"),
    ("to let / to allow", "lade", "lader", "lod", "ladt"),
    ("to laugh", "le", "ler", "lo", "let"),
    ("to like", "at kunne lide", "kan lide", "kunne lide", "kunnet lide"),
    ("to lie (static)", "ligge", "ligger", "lå", "ligget"),
    ("to sound", "lyde", "lyder", "lød", "lydt"),
    ("to lie / to tell a lie", "lyve", "lyver", "løj", "løjet"),
    ("to run", "løbe", "løber", "løb", "løbet"),
    ("to enjoy", "nyde", "nyder", "nød", "nydt"),
    ("to ride", "ride", "rider", "red", "redet"),
    ("to tear", "rive", "river", "rev", "revet"),
    ("to smoke", "ryge", "ryger", "røg", "røget"),
    ("to see / to watch", "se", "ser", "så", "set"),
    ("to sit", "sidde", "sidder", "sad", "siddet"),
    ("to scream", "skrige", "skriger", "skreg", "skreget"),
    ("to write", "skrive", "skriver", "skrev", "skrevet"),
    ("to shoot", "skyde", "skyder", "skød", "skudt"),
    ("to cut", "skære", "skærer", "skar", "skåret"),
    ("to hit / to strike", "slå", "slår", "slog", "slået"),
    ("to wear out / to grind", "slide", "slider", "sled", "slidt"),
    ("to let go / to slip", "slippe", "slipper", "slap", "sluppet"),
    ("to throw", "smide", "smider", "smed", "smidt"),
    ("to sneak", "snige", "sniger", "sneg", "sneget"),
    ("to cheat", "snyde", "snyder", "snød", "snydt"),
    ("to sleep", "sove", "sover", "sov", "sovet"),
    ("to jump / to run", "springe", "springer", "sprang", "sprunget"),
    ("to stand", "stå", "står", "stod", "stået"),
    ("to rise / to climb", "stige", "stiger", "steg", "steget"),
    ("to poke / to sting", "stikke", "stikker", "stak", "stukket"),
    ("to stink", "stinke", "stinker", "stank", "stinket"),
    ("to steal", "stjæle", "stjæler", "stjal", "stjålet"),
    ("to iron / to stroke", "stryge", "stryger", "strøg", "strøget"),
    ("to swing", "svinge", "svinger", "svingede", "svunget"),
    ("to sing", "synge", "synger", "sang", "sunget"),
    ("to sink", "synke", "synker", "sank", "sunket"),
    ("to take", "tage", "tager", "tog", "taget"),
    ("to be silent", "tie", "tier", "tav", "tiet"),
    ("to hit (a target)", "træffe", "træffer", "traf", "truffet"),
    ("to pull", "trække", "trækker", "trak", "trukket"),
    ("to force", "tvinge", "tvinger", "tvang", "tvunget"),
    ("to win", "vinde", "vinder", "vandt", "vundet"),
    ("to twist", "vride", "vrider", "vred", "vredet"),
    ("to be", "være", "er", "var", "været"),
    ("to eat (animals)", "æde", "æder", "åd", "ædt"),
]

# Columns: english, danish_infinitive
COMMON_VERBS_RAW: list[tuple[str, str]] = [
    ("to abandon", "opgive"),
    ("to accept", "acceptere"),
    ("to achieve", "opnå"),
    ("to admit", "indrømme"),
    ("to advise", "råde"),
    ("to allow", "tillade"),
    ("to announce", "meddele"),
    ("to appear", "dukke op"),
    ("to apply", "anvende"),
    ("to arrange", "arrangere"),
    ("to arrive", "ankomme"),
    ("to ask", "spørge"),
    ("to assess", "vurdere"),
    ("to attract", "lokke"),
    ("to avoid", "undgå"),
    ("to begin", "begynde"),
    ("to believe", "tro"),
    ("to belong", "tilhøre"),
    ("to borrow", "låne"),
    ("to build", "bygge"),
    ("to buy", "købe"),
    ("to call", "kalde"),
    ("to cancel", "aflyse"),
    ("to capture", "fange"),
    ("to celebrate", "fejre"),
    ("to change", "ændre"),
    ("to choose", "vælge"),
    ("to clean", "rense"),
    ("to close", "lukke"),
    ("to collect", "samle"),
    ("to come", "komme"),
    ("to consider", "overveje"),
    ("to cook", "koge"),
    ("to cost", "koste"),
    ("to create", "skabe"),
    ("to cry", "græde"),
    ("to cut", "skære"),
    ("to dance", "danse"),
    ("to decide", "beslutte"),
    ("to defend", "forsvare"),
    ("to deliver", "levere"),
    ("to demand", "kræve"),
    ("to describe", "beskrive"),
    ("to destroy", "ødelægge"),
    ("to develop", "udvikle"),
    ("to die", "dø"),
    ("to disappear", "forsvinde"),
    ("to discover", "opdage"),
    ("to discuss", "diskutere"),
    ("to do", "gøre"),
    ("to draw", "tegne"),
    ("to dream", "drømme"),
    ("to drink", "drikke"),
    ("to drive", "køre"),
    ("to earn", "fortjene"),
    ("to eat", "spise"),
    ("to employ", "ansætte"),
    ("to enjoy", "nyde"),
    ("to escape", "flygte"),
    ("to explain", "forklare"),
    ("to fall", "falde"),
    ("to fall in love", "forelske sig"),
    ("to fear", "frygte"),
    ("to feel", "føle"),
    ("to fetch", "hente"),
    ("to fight", "kæmpe"),
    ("to fill", "fylde"),
    ("to find", "finde"),
    ("to fly", "flyve"),
    ("to follow", "følge"),
    ("to forget", "glemme"),
    ("to get", "få"),
    ("to give", "give"),
    ("to go", "gå"),
    ("to grab", "gribe"),
    ("to greet", "hilse"),
    ("to grow", "vokse"),
    ("to hang", "hænge"),
    ("to hate", "hade"),
    ("to have", "have"),
    ("to hear", "høre"),
    ("to help", "hjælpe"),
    ("to hide", "gemme"),
    ("to hit", "slå"),
    ("to hold", "holde"),
    ("to hope", "håbe"),
    ("to imagine", "forestille sig"),
    ("to improve", "forbedre"),
    ("to increase", "øge"),
    ("to inform", "oplyse"),
    ("to invite", "invitere"),
    ("to jump", "hoppe"),
    ("to keep", "beholde"),
    ("to kill", "dræbe"),
    ("to kiss", "kysse"),
    ("to know (a person)", "kende"),
    ("to know (a fact)", "vide"),
    ("to lack", "mangle"),
    ("to laugh", "le"),
    ("to learn", "lære"),
    ("to leave", "forlade"),
    ("to lie (static)", "ligge"),
    ("to listen", "lytte"),
    ("to live", "leve"),
    ("to live (reside)", "bo"),
    ("to look", "kigge"),
    ("to lose", "miste"),
    ("to love", "elske"),
    ("to make / to do", "lave"),
    ("to marry", "gifte sig"),
    ("to mean", "betyde"),
    ("to meet", "møde"),
    ("to miss", "savne"),
    ("to move", "flytte"),
    ("to need", "behøve"),
    ("to notice", "bemærke"),
    ("to open", "åbne"),
    ("to order", "bestille"),
    ("to own", "eje"),
    ("to participate", "deltage"),
    ("to pay", "betale"),
    ("to plan", "planlægge"),
    ("to play (game)", "spille"),
    ("to play (children)", "lege"),
    ("to pray", "bede"),
    ("to prefer", "foretrække"),
    ("to prepare", "forberede"),
    ("to press", "trykke"),
    ("to prevent", "forhindre"),
    ("to protect", "beskytte"),
    ("to pull", "trække"),
    ("to push", "skubbe"),
    ("to put", "sætte"),
    ("to reach", "nå"),
    ("to read", "læse"),
    ("to receive", "modtage"),
    ("to recommend", "anbefale"),
    ("to remember", "huske"),
    ("to remove", "fjerne"),
    ("to rent", "leje"),
    ("to repeat", "gentage"),
    ("to rest", "hvile sig"),
    ("to ride", "ride"),
    ("to ring", "ringe"),
    ("to run", "løbe"),
    ("to save", "spare"),
    ("to say", "sige"),
    ("to see", "se"),
    ("to seek", "søge"),
    ("to seem", "synes"),
    ("to sell", "sælge"),
    ("to send", "sende"),
    ("to share", "dele"),
    ("to sing", "synge"),
    ("to sit", "sidde"),
    ("to sleep", "sove"),
    ("to smile", "smile"),
    ("to speak / to talk", "tale"),
    ("to spend (time)", "tilbringe"),
    ("to stand", "stå"),
    ("to start", "starte"),
    ("to steal", "stjæle"),
    ("to stop", "standse"),
    ("to study", "studere"),
    ("to suggest", "foreslå"),
    ("to surprise", "overraske"),
    ("to take", "tage"),
    ("to talk", "snakke"),
    ("to taste", "smage"),
    ("to tell", "fortælle"),
    ("to thank", "takke"),
    ("to think", "tænke"),
    ("to throw", "kaste"),
    ("to touch", "røre"),
    ("to travel", "rejse"),
    ("to try", "prøve"),
    ("to turn", "vende"),
    ("to understand", "forstå"),
    ("to use", "bruge"),
    ("to visit", "besøge"),
    ("to wait", "vente"),
    ("to wake up", "vågne"),
    ("to warn", "advare"),
    ("to wash", "vaske"),
    ("to win", "vinde"),
    ("to wish", "ønske"),
    ("to work", "arbejde"),
    ("to write", "skrive"),
]


# ---------------------------------------------------------------------------
# Live scraping (optional)
# ---------------------------------------------------------------------------

def scrape_irregular_live() -> list[tuple[str, str, str, str, str]]:
    """Re-scrape irregular verbs from speakandlearn.dk."""
    print("  Fetching irregular verbs page...")
    html = fetch_page("https://speakandlearn.dk/danish-irregular-verbs-common/")
    rows = parse_table_from_html(html)
    results = []
    for row in rows:
        if len(row) >= 5 and row[1].strip() and row[1].strip() != "Infinitiv":
            english, infinitiv, nutid, datid, foernutid = row[0], row[1], row[2], row[3], row[4]
            results.append((english.strip(), infinitiv.strip(), nutid.strip(), datid.strip(), foernutid.strip()))
    print(f"  Got {len(results)} irregular verbs")
    return results


def scrape_common_live() -> list[tuple[str, str]]:
    """Re-scrape common verbs page from speakandlearn.dk."""
    print("  Fetching common verbs page...")
    html = fetch_page("https://speakandlearn.dk/common-verbs-400-common-danish-verbs/")
    rows = parse_table_from_html(html)
    results = []
    for row in rows:
        if len(row) >= 2 and row[1].strip() and row[0].strip().lower() not in ("english", "dansk"):
            english, danish = row[0].strip(), row[1].strip()
            if danish and english:
                results.append((english, danish))
    # Remove duplicates preserving order
    seen: set[str] = set()
    deduped = []
    for e, d in results:
        if d not in seen:
            seen.add(d)
            deduped.append((e, d))
    print(f"  Got {len(deduped)} common verbs")
    return deduped


# ---------------------------------------------------------------------------
# Build word entries
# ---------------------------------------------------------------------------

def build_irregular_word(english: str, infinitive: str, nutid: str, datid: str, foernutid: str) -> dict:
    """Build a full word entry from irregular verb data."""
    # Take the first alternative form if "/" present
    datid_clean = datid.split("/")[0].strip()
    foernutid_clean = foernutid.split("/")[0].strip()
    nutid_clean = nutid.split("/")[0].strip()

    imperative = derive_imperative(infinitive)
    perfect = build_perfect(infinitive, foernutid_clean)

    # Clean English — remove "to " prefix for storage
    english_clean = english
    if english_clean.startswith("to "):
        english_clean = english_clean[3:]
    # Only keep the first meaning if separated by " / "
    english_clean = english_clean.split(" / ")[0].strip()
    english_clean = f"to {english_clean}" if not english_clean.startswith("to ") else english_clean

    return {
        "danish": infinitive,
        "english": english_clean,
        "part_of_speech": "verb",
        "gender": None,
        "module_level": 3,
        "difficulty": 2,
        "tags": ["verb", "irregular"],
        "inflections": {
            "present": nutid_clean,
            "past": datid_clean,
            "perfect": perfect,
            "imperative": imperative,
        },
        "example_da": None,
        "example_en": None,
        "source": "speakandlearn",
    }


def build_common_word(english: str, danish: str) -> dict:
    """Build a minimal word entry from the common verbs list (no inflection data)."""
    english_clean = english.strip()
    # Normalize English
    if not english_clean.lower().startswith("to "):
        english_clean = f"to {english_clean}"

    return {
        "danish": danish.strip(),
        "english": english_clean,
        "part_of_speech": "verb",
        "gender": None,
        "module_level": 3,
        "difficulty": 1,
        "tags": ["verb"],
        "inflections": {},  # To be enriched by enrich-vocabulary.py
        "example_da": None,
        "example_en": None,
        "source": "speakandlearn",
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Import verbs from speakandlearn.dk")
    parser.add_argument("--live", action="store_true", help="Re-scrape from web instead of using embedded data")
    parser.add_argument("--irregular-only", action="store_true", help="Only process irregular verbs (with full conjugations)")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation prompt")
    args = parser.parse_args()

    # Load existing words
    with open(WORDS_JSON, encoding="utf-8") as f:
        existing_words: list[dict] = json.load(f)
    existing_danish = {w["danish"].strip().lower() for w in existing_words}
    print(f"Existing vocabulary: {len(existing_words)} words")

    # --- Irregular verbs ---
    if args.live:
        irregular_raw = scrape_irregular_live()
    else:
        irregular_raw = IRREGULAR_VERBS_RAW

    irregular_new: list[dict] = []
    for row in irregular_raw:
        english, infinitive, nutid, datid, foernutid = row
        if infinitive.lower() in existing_danish:
            continue
        # Skip multi-word constructions like "at kunne lide"
        if " " in infinitive and not infinitive.startswith("at "):
            continue
        word = build_irregular_word(english, infinitive, nutid, datid, foernutid)
        irregular_new.append(word)
        existing_danish.add(infinitive.lower())

    print(f"Irregular verbs to add: {len(irregular_new)}")

    # --- Common verbs ---
    common_new: list[dict] = []
    if not args.irregular_only:
        if args.live:
            common_raw = scrape_common_live()
        else:
            common_raw = COMMON_VERBS_RAW

        for english, danish in common_raw:
            # Skip multi-word / phrasal verbs (contain spaces)
            if " " in danish:
                continue
            if danish.lower() in existing_danish:
                continue
            # Skip very short (< 2 chars) or obviously incorrect entries
            if len(danish) < 2:
                continue
            word = build_common_word(english, danish)
            common_new.append(word)
            existing_danish.add(danish.lower())

        print(f"Common verbs to add: {len(common_new)} (with empty inflections — run enrich-vocabulary.py to fill)")

    all_new = irregular_new + common_new

    if not all_new:
        print("Nothing new to add.")
        return

    # Preview
    print("\nIrregular verbs (with full conjugations):")
    for w in irregular_new[:10]:
        inf = w["inflections"]
        print(f"  {w['danish']:15} {w['english']:30}  {inf.get('past','?')} / {inf.get('perfect','?')}")
    if len(irregular_new) > 10:
        print(f"  ... and {len(irregular_new) - 10} more")

    if common_new:
        print(f"\nCommon verbs (no inflections yet): {', '.join(w['danish'] for w in common_new[:10])}")
        if len(common_new) > 10:
            print(f"  ... and {len(common_new) - 10} more")

    if not args.yes:
        answer = input(f"\nAdd {len(all_new)} verbs to words-pd3m2.json? [y/N] ").strip().lower()
        if answer != "y":
            print("Aborted.")
            return

    merged = existing_words + all_new
    with open(WORDS_JSON, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"\nDone. words-pd3m2.json now has {len(merged)} entries.")
    print(f"  Added: {len(irregular_new)} irregular verbs (full conjugations)")
    if common_new:
        print(f"  Added: {len(common_new)} common verbs (run enrich-vocabulary.py for inflections)")


if __name__ == "__main__":
    main()
