#!/usr/bin/env python3
"""Apply exercise hint corrections from the 2026-03-03 exercise verification review."""

import json
from pathlib import Path

EXERCISES_PATH = Path(__file__).parent.parent / "src" / "data" / "seed" / "exercises-pd3m2.json"

# Task 1a: Fix exercise #151 hint (match by question text)
HINT_FIX = {
    "Hun har fået nyt arbejde i ny i København.": "The phrase 'i ny' is incorrect — remove it",
}

# Task 1b: All 91 Danish hint → English translations (match by question text → new hint)
HINT_TRANSLATIONS = {
    # Conjugation exercises
    "Hvad er datid (past tense) af 'gå'?": "to go (to go/walk) — already bilingual",
    "Hvad er førnutid (perfect) af 'gå'?": "to go — remember: is it 'er' or 'har'?",
    "Hvad er datid (past tense) af 'komme'?": "to come — already bilingual",
    "Hvad er førnutid (perfect) af 'komme'?": "to come — motion verb (uses 'er')",
    "Hvad er datid (past tense) af 'se'?": "to see — already bilingual",
    "Hvad er bydeform (imperative) af 'se'?": "to see — the imperative form is short",
    "Hvad er datid (past tense) af 'tage'?": "to take — already bilingual",
    "Hvad er bydeform (imperative) af 'tage'?": "to take — the imperative drops the -e",
    "Hvad er datid (past tense) af 'give'?": "to give — already bilingual",
    "Hvad er datid (past tense) af 'drikke'?": "to drink — already bilingual",
    "Hvad er førnutid (perfect) af 'drikke'?": "to drink — remember the vowel change",
    "Hvad er datid (past tense) af 'finde'?": "to find — already bilingual",
    "Hvad er datid (past tense) af 'arbejde'?": "to work — regular verb",
    "Hvad er bydeform (imperative) af 'komme'?": "to come — the imperative is identical to the past tense",
    "Hvad er t-formen (et-ord) af 'god'?": "good — used with et-nouns: et ___ hus",
    "Hvad er komparativ af 'god'?": "good → ??? → best (fill in the middle)",
    "Hvad er superlativ af 'god'?": "good → better → ??? (fill in the end)",
    "Hvad er komparativ af 'dårlig'?": "bad — irregular",
    "Hvad er t-formen (et-ord) af 'dårlig'?": "a bad day → a ___ weather (apply t-form)",
    "Hvad er t-formen (et-ord) af 'stor'?": "a big car → a ___ house (apply t-form)",
    "Hvad er komparativ af 'stor'?": "big → ??? → biggest (fill in the middle)",
    "Hvad er e-formen (bestemt/flertal) af 'lille'?": "little child → the ___ children",
    "Hvad er komparativ af 'lille'?": "little → ??? → least (fill in the middle)",
    "Hvad er komparativ af 'gammel'?": "old — irregular",
    "Hvad er t-formen (et-ord) af 'gammel'?": "an old man → an ___ house (apply t-form)",
    # Conjugation - noun exercises
    "Udfyld: Det er _____ hus. (stor)": "'hus' is an et-noun (neuter)",
    "Udfyld: Det er en _____ bil. (ny)": "'bil' is an en-noun — use the base form",
    "Udfyld: De _____ biler er dyre. (ny)": "Plural requires the e-form",
    # Noun declension exercises
    "Et øje – ___ – to øjne – øjnene": "Et-noun in definite singular: add -et",
    "En arm – armen – to ___ – armene": "En-noun, indefinite plural: add -e",
    "Et øre – øret – to ører – ___": "Definite plural = plural + -ne",
    # Pronoun & possessive exercises
    "Anna vasker ___ hår.": "'Hår' (hair) is an et-noun",
    "'___ bøger er interessante.' (my)": "'Bøger' (books) is plural",
    # Handle the variant without leading quote
    "___ bøger er interessante.' (my)": "'Bøger' (books) is plural",
    "Peter elsker ___ arbejde": "'Arbejde' (work) is an et-noun — use sit/sin/sine?",
    "Hun savner ___ familie": "'Familie' (family) is an en-noun",
    "Hun ringer til sit veninder hver uge.": "'Veninder' (female friends) is plural",
    "Peter kan godt lide kaffe. Det kan Anna ___.": "Affirmative: Peter does it, Anna does it ___ (too)",
    "Peter drikker ikke kaffe. Det gør Anna ___.": "Negative context: neither of them drinks coffee",
    "Jeg har en gammel bil, ___ jeg elsker.": "Relative pronoun as object",
    "Hun har en søn, ___ går i 5. klasse.": "Relative pronoun as subject",
    "Joe har en bil. En bilen er gammel.": "Definite and indefinite article cannot be used simultaneously",
    "Mathias er meget glad for ___ hunde.": "Mathias (he) owns the dogs — reflexive possessive, plural",
    "Marieke bor langt væk fra ___ familie.": "Marieke (she) is the subject — reflexive possessive, en-noun",
    "Dina og ___ mand låner sommetider en bil.": "Dina's husband is part of the subject — non-reflexive",
    # Word order / V2 rule exercises
    "på mandag tager hun til Spanien": "Time expression first → inverted word order (V2)",
    "Når de kommer til Paris": "Subordinate clause first → inverted word order in main clause",
    "Hvis man har for meget bagage": "Conditional clause first → invert the main clause",
    "Gerne ___ han have en bil": "V2 rule: the verb is always in 2nd position",
    "desværre kan jeg ikke komme": "The adverb 'desværre' (unfortunately) is in 1st position → V2",
    "Normalt ___ hun tidligt op": "V2 rule with 'normalt' (usually) in front",
    "I morgen hun tager til lægen.": "Time expression in 1st position → V2",
    "Sæt 'alligevel' foran og omskriv": "Adverb in 1st position → invert subject and verb",
    "i weekenden besøgte han": "Time expression first → V2",
    "Om aftenen hun er for træt": "Time phrase in 1st position → V2",
    "Måske ___ vi tage en tur": "V2: 'Måske' (maybe) first → verb in 2nd position",
    "i Danmark gik Lina på sprogskole": "Place adverb first → V2",
    # Subordinate clause exercises
    "Jeg ved ikke, ___ han har fået dårlige karakterer.": "Indirect yes/no questions are introduced with?",
    "Lav om til indirekte spørgsmål: Har hun brug for hjælp?": "Yes/no questions → indirect with 'om' (whether)",
    "Jeg ved ikke, skal han tage til lægen.": "Indirect yes/no questions require 'om' (whether)",
    "Hvis hun holder pauser, hun kan læse længe.": "Subordinate clause first → V2 in the main clause",
    "Jeg ved ikke, ___ han kommer i morgen.": "Yes/no questions → indirect with? (use 'om')",
    "Hun spurgte mig, hvornår starter filmen.": "No inversion in subordinate clauses",
    "Jeg ved ikke, ___ jeg skal løse": "Indirect 'how' question (use 'hvordan')",
    "jeg ved ikke om han har fået besked": "Main clause + subordinate clause with 'om'",
    "Fordi hun ___ ikke er klar": "Adverb in subordinate clause goes before the verb",
    "Lav om til indirekte spørgsmål: Hvem kan man spørge om vej?": "Wh-word + normal word order (not inverted) in the clause",
    "ved du hvordan jeg skal løse": "Indirect wh-question: no inversion in the subordinate clause",
    # Da/Når/Hvis exercises
    "Det var ikke så ___ (hård) som hun forventede.": "T-form is used after 'så ... som' (as ... as) and with et-nouns",
    "Han ringede, ___ han var i København sidst.": "Specific past event: da/når/hvis? (use 'da')",
    "___ hun var barn, boede hun på Frederiksberg.": "Specific period in the past (use 'da')",
    "___ man læser meget, lærer man nye ord.": "Repeated action in the present (use 'når')",
    "Når jeg var i skole, var jeg meget stille.": "Completed period in the past → use 'da' (not 'når')",
    "da hun var i skole var hun meget stille": "Da-clause first → V2 in the main clause",
    "Forbind med 'da': De gik en tur": "Da = at that point in time (past)",
    "Forbind med 'da': Hun begyndte i skole": "Da-clause can appear before or after the main clause",
    "Hun printede et kort ud, ___ det var nemt": "Consequence/result (use 'så' = so/therefore)",
    "Toget er kørt. ___ vi tager bussen.": "Consequence of the train having left (use 'Så' = so)",
    # Verb tense & indirect speech
    "Det var faktisk ___ (hård) at flytte": "Comparative of 'hård' (hard/tough)",
    "___ et par år i Danmark gik Lina": "Preposition for 'after a period of time' (use 'Efter')",
    "Hvad er du egentlig ___ som?": "Perfect participle of 'uddanne' (to educate/train)",
    "Lav om til indirekte tale: 'Spis varieret.'": "Imperative → 'at man skal' (that one should) + infinitive",
    "Lav om til indirekte tale: 'Drik meget vand.'": "Imperative → 'at man skal' (that one should) + infinitive",
    "De siger, at man ___ (spare) på fedtet.": "Modal verb + infinitive in subordinate clause",
    "De siger, at man spise skal varieret.": "Word order in subordinate clause",
    "A: ___ du noget spændende i weekenden?": "Question in past tense: lave → ? (use 'Lavede')",
    "Hun føler sig ikke helt rask. I går ___ hun": "Past tense of weak verb 'føle' (to feel)",
    "Skriv om til datid: Hun har det skidt.": "Past tense of 'have' (to have) → 'havde'",
    "Skriv om til datid: Det gør ondt i maven.": "'Gøre' (to do/make) is irregular",
    "Hun har ___ skidt.": "Fixed expression: have ___ + adjective (use 'det')",
    "Hvor meget ___ (tjene) du om måneden?": "Present tense of regular verb",
    "Min arbejdstid ___ (variere) sig": "Present tense of 'variere' (to vary)",
    "Tillykke med det nye job! Hvornår ___ du starte?": "When + future (use modal verb 'skal')",
    "Hvordan går det? Det går godt. ___ med dig?": "Fixed expression: asking back (use 'Hvad')",
    # Adverb placement exercises
    "Han vil have en bil, selvom": "In a main clause, the adverb comes after the verb.",
    "Hun er sur, fordi": "The negation 'ikke' comes after the verb in a main clause.",
    "Han cykler til skole": "The negation is placed after the verb in main clauses.",
    "Hun spiser meget, selvom": "Frequency adverbs like 'altid' are placed after the verb.",
    "Der kommer en vikar": "The adverb is placed after the verb in the main clause.",
    "Han ringer, når det er søndag.": "The adverb is placed after the verb in the main clause.",
    "Hun har en onkel": "The adverb 'også' (also) is placed after the verb.",
    "De boede på et hotel": "The negation 'ikke' comes after the verb, also in past tense.",
    "Han spiste slik, da": "Frequency adverbs are placed after the verb in past tense.",
    "De tager en taxa": "The adverb is placed after the verb in the main clause.",
    "Han kan godt lide, at hun": "In subordinate clauses with 'at', the adverb goes before the verb.",
    "Hun elsker sin mand, fordi": "In 'fordi' clauses, the adverb goes before the verb.",
    "Han elsker sin kone, selvom": "In 'selvom' clauses, the adverb goes before the verb.",
    "De bor sammen, selvom": "The negation 'ikke' goes before the verb in subordinate clauses.",
    "Han har en datter, som": "In relative clauses with 'som', the adverb goes before the verb.",
    "Hans kone siger, at": "In 'at'-clauses with modal verbs, the adverb goes before the modal verb.",
    "Han er tyk, selvom": "In 'selvom' clauses, frequency adverbs go before the verb.",
    "Hun er gået på slankekur, fordi": "In 'fordi' clauses with perfect tense, the adverb goes before the auxiliary verb.",
    "De blev meget sure, da": "In 'da' clauses, the negation goes before the verb.",
    "De har en søn, som": "In relative clauses with 'som', time adverbs go before the verb.",
    # Passive/imperative recipe exercises
    "Omskriv til aktiv imperativ: Kartoflerne skrælles": "Passive (-s form) → active imperative",
    "Omskriv som imperativ: Kartoflerne skrælles": "Use the imperative mood and remember to change the pronouns.",
    "Omskriv som imperativ: Kødes skæres i tern": "'Kødet' (the meat) is a neuter noun, so use pronoun 'det' (it).",
    "Omskriv som imperativ: Persillen skylles": "'Persillen' (the parsley) is a common gender noun, so use pronoun 'den' (it).",
    "Omskriv som imperativ: Pastaen koges": "Two verbs here: 'koges' and 'hældes'. Rewrite both to imperative.",
    "Omskriv som imperativ: Smør og sukker piskes": "'Tilsæt' is the imperative of 'tilsætte' (to add).",
    "Omskriv som imperativ: Mel og bagepulver blandes": "'Mel og bagepulver' (flour and baking powder) is plural, so the pronoun is 'dem' (them).",
    "Omskriv som imperativ: Kagen bages i 50 minutter": "'Afkøle' means to cool down. 'Kagen' (the cake) is an en-noun, so the pronoun is 'den' (it).",
}


def main():
    with open(EXERCISES_PATH, "r", encoding="utf-8") as f:
        exercises = json.load(f)

    print(f"Loaded {len(exercises)} exercises")

    # Combine all hint changes
    all_changes = {**HINT_FIX, **HINT_TRANSLATIONS}
    applied = 0
    not_found = []

    for question_fragment, new_hint in all_changes.items():
        found = False
        for ex in exercises:
            q = ex.get("question", "")
            # Match if the question starts with or contains the fragment
            if question_fragment in q:
                old_hint = ex.get("hint", "(none)")
                ex["hint"] = new_hint
                applied += 1
                found = True
                print(f"  ✓ Updated: {q[:60]}...")
                print(f"    Old: {old_hint[:60]}")
                print(f"    New: {new_hint[:60]}")
                break
        if not found:
            not_found.append(question_fragment)

    print(f"\nApplied {applied} hint changes")
    if not_found:
        print(f"\n⚠ {len(not_found)} hints NOT FOUND (question text didn't match):")
        for q in not_found:
            print(f"  - {q[:80]}")

    with open(EXERCISES_PATH, "w", encoding="utf-8") as f:
        json.dump(exercises, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\nWrote updated exercises to {EXERCISES_PATH}")


if __name__ == "__main__":
    main()
