#!/usr/bin/env python3
"""
fix-inflections.py

Applies manual corrections to verb inflections in words-pd3m2.json
after reviewing the Ollama-generated conjugations against Danish grammar rules.

Run: python3 scripts/fix-inflections.py
"""

from __future__ import annotations

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
WORDS_JSON = PROJECT_ROOT / "src" / "data" / "seed" / "words-pd3m2.json"

# Each entry: "danish": { field: corrected_value, ... }
# Only fields that need correction are listed.
CORRECTIONS: dict[str, dict[str, str]] = {
    "advare": {
        "present": "advarer",
        "past": "advarede",
        "perfect": "har advaret",
        "imperative": "advar",
    },
    "ankomme": {
        "present": "ankommer",
        "imperative": "ankom",
    },
    "arrangere": {
        "past": "arrangerede",
        "perfect": "har arrangeret",
    },
    "bemærke": {
        "perfect": "har bemærket",
    },
    "beskrive": {
        "perfect": "har beskrevet",
    },
    "beskytte": {
        "perfect": "har beskyttet",
    },
    "besøge": {
        "perfect": "har besøgt",
    },
    "bruge": {
        "perfect": "har brugt",
    },
    "bygge": {
        "perfect": "har bygget",
        "imperative": "byg",
    },
    "danse": {
        "past": "dansede",
        "perfect": "har danset",
    },
    "dele": {
        "perfect": "har delt",
    },
    "dræbe": {
        "perfect": "har dræbt",
        "imperative": "dræb",
    },
    "elske": {
        "past": "elskede",
    },
    "fange": {
        "past": "fangede",
        "perfect": "har fanget",
    },
    "flygte": {
        "perfect": "er flygtet",
    },
    "flytte": {
        "past": "flyttede",
        "perfect": "har flyttet",
    },
    "forbedre": {
        "perfect": "har forbedret",
    },
    "foretrække": {
        "past": "foretrak",
        "perfect": "har foretrukket",
    },
    "forklare": {
        "past": "forklarede",
    },
    "forlade": {
        "perfect": "har forladt",
    },
    "forstå": {
        "perfect": "har forstået",
    },
    "forsvare": {
        "perfect": "har forsvaret",
    },
    "forsvinde": {
        "imperative": "forsvind",
    },
    "fortjene": {
        "perfect": "har fortjent",
    },
    "frygte": {
        "perfect": "har frygtet",
    },
    "fylde": {
        "perfect": "har fyldt",
    },
    "føle": {
        "past": "følte",
        "imperative": "føl",
    },
    "følge": {
        "perfect": "har fulgt",
    },
    "gemme": {
        "perfect": "har gemt",
    },
    "gentage": {
        "perfect": "har gentaget",
    },
    "hade": {
        "present": "hader",
        "past": "hadede",
        "perfect": "har hadet",
    },
    "hente": {
        "perfect": "har hentet",
    },
    "hilse": {
        "perfect": "har hilst",
    },
    "hoppe": {
        "past": "hoppede",
        "perfect": "har hoppet",
    },
    "huske": {
        "past": "huskede",
        "imperative": "husk",
    },
    "håbe": {
        "past": "håbede",
    },
    "invitere": {
        "perfect": "har inviteret",
    },
    "kalde": {
        "past": "kaldte",  # fix leading space
        "imperative": "kald",
    },
    "kaste": {
        "perfect": "har kastet",
    },
    "kigge": {
        "perfect": "har kigget",
    },
    "kysse": {
        "present": "kysser",
        "past": "kyssede",
        "perfect": "har kysset",
    },
    "kæmpe": {
        "perfect": "har kæmpet",
    },
    "lave": {
        "present": "laver",
        "past": "lavede",
        "perfect": "har lavet",
    },
    "lege": {
        "perfect": "har leget",
    },
    "leje": {
        "perfect": "har lejet",
    },
    "leve": {
        "perfect": "har levet",
    },
    "lukke": {
        "perfect": "har lukket",
    },
    "lytte": {
        "perfect": "har lyttet",
    },
    "mangle": {
        "perfect": "har manglet",
    },
    "miste": {
        "perfect": "har mistet",
    },
    "møde": {
        "perfect": "har mødt",
    },
    "nå": {
        "perfect": "har nået",
        "imperative": "nå",
    },
    "oplyse": {
        "perfect": "har oplyst",
    },
    "opnå": {
        "imperative": "opnå",
    },
    "overraske": {
        "perfect": "har overrasket",
    },
    "prøve": {
        "perfect": "har prøvet",
    },
    "rejse": {
        "imperative": "rejs",
    },
    "ringe": {
        "past": "ringede",
        "perfect": "har ringet",
    },
    "savne": {
        "present": "savner",
        "perfect": "har savnet",
    },
    "smile": {
        "past": "smilede",
        "perfect": "har smilet",
    },
    "spare": {
        "perfect": "har sparet",
    },
    "standse": {
        "present": "standser",
        "past": "standsede",
        "perfect": "har standset",
        "imperative": "stands",
    },
    "starte": {
        "perfect": "har startet",
    },
    "stinke": {
        "perfect": "har stunket",
    },
    "svinge": {
        "perfect": "har svinget",
    },
    "synes": {
        "past": "syntes",
        "perfect": "har syntes",
    },
    "sælge": {
        "perfect": "har solgt",
    },
    "søge": {
        "perfect": "har søgt",
    },
    "takke": {
        "present": "takker",
        "perfect": "har takket",
    },
    "tale": {
        "perfect": "har talt",
    },
    "tegne": {
        "past": "tegnede",
        "imperative": "tegn",
    },
    "tilhøre": {
        "perfect": "har tilhørt",
    },
    "tillade": {
        "past": "tillod",
    },
    "tro": {
        "present": "tror",
    },
    "udvikle": {
        "perfect": "har udviklet",
    },
    "undgå": {
        "perfect": "har undgået",
    },
    "vaske": {
        "perfect": "har vasket",
    },
    "vente": {
        "perfect": "har ventet",
    },
    "vide": {
        "present": "ved",
        "perfect": "har vidst",
    },
    "vurdere": {
        "perfect": "har vurderet",
    },
    "åbne": {
        "perfect": "har åbnet",
    },
    "ødelægge": {
        "perfect": "har ødelagt",
    },
    "øge": {
        "perfect": "har øget",
    },
}


def main() -> None:
    with open(WORDS_JSON, encoding="utf-8") as f:
        words = json.load(f)

    fixed_count = 0
    field_fixes = 0

    for word in words:
        if word["part_of_speech"] != "verb":
            continue
        key = word["danish"]
        if key not in CORRECTIONS:
            continue

        fixes = CORRECTIONS[key]
        inf = word.get("inflections", {})
        changes = []

        for field, correct_value in fixes.items():
            old_value = inf.get(field, "")
            if old_value != correct_value:
                changes.append(f"  {field}: '{old_value}' → '{correct_value}'")
                inf[field] = correct_value
                field_fixes += 1

        if changes:
            print(f"{key}:")
            for c in changes:
                print(c)
            fixed_count += 1

        word["inflections"] = inf

    print(f"\n{'=' * 50}")
    print(f"Verbs corrected: {fixed_count}")
    print(f"Field-level fixes: {field_fixes}")

    with open(WORDS_JSON, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=2)

    print(f"Saved to {WORDS_JSON}")


if __name__ == "__main__":
    main()
