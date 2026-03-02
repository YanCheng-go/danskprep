"""
Mine individual exercises from the full multi-blank SpeakSpeak content.
Each blank in the source material becomes its own clean exercise.
Deduplicates against existing exercises by question text.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

EXERCISES_FILE = Path(__file__).parent.parent / "src/data/seed/exercises-pd3m2.json"


def load_existing() -> list[dict]:
    return json.loads(EXERCISES_FILE.read_text(encoding="utf-8"))


def dedupe(new: list[dict], existing: list[dict]) -> list[dict]:
    """Remove exercises whose question text already exists."""
    existing_questions = {e["question"].strip().lower() for e in existing}
    kept, skipped = [], 0
    for ex in new:
        key = ex["question"].strip().lower()
        if key in existing_questions:
            skipped += 1
        else:
            kept.append(ex)
            existing_questions.add(key)  # prevent intra-batch dupes
    if skipped:
        print(f"  Skipped {skipped} duplicates", file=sys.stderr)
    return kept


# ── New exercises mined from full SpeakSpeak multi-blank exercises ────────────
# Source: PD3M2 modul 3.2 exercises with all blanks visible (not first-blank-only).
# Grammar topic labels in SpeakSpeak were mis-matched; corrected here.

NEW_EXERCISES: list[dict] = [
    # ══════════════════════════════════════════════════════════════════════════
    # INVERTED WORD ORDER – adverb position in main clause (helsætning)
    # Rule: adverb goes AFTER the finite verb in a main clause
    # ══════════════════════════════════════════════════════════════════════════
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "cloze",
        "question": "Indsæt 'ikke': Hun er ___ sur, fordi han glemte at købe ind.",
        "correct_answer": "ikke",
        "explanation": "I helsætningen placeres 'ikke' efter det finite verbum: Hun er [IKKE] sur.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "cloze",
        "question": "Indsæt 'ikke': Han cykler ___ til skole, fordi han er syg.",
        "correct_answer": "ikke",
        "explanation": "Nægtelsen 'ikke' sættes efter det finite verbum i helsætningen: Han cykler [IKKE] til skole.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "cloze",
        "question": "Indsæt 'altid': Hun spiser ___ meget, selvom hun er mæt.",
        "correct_answer": "altid",
        "explanation": "Frekvensadverbier ('altid', 'aldrig', 'tit') sættes efter det finite verbum i helsætningen.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "cloze",
        "question": "Indsæt 'måske': Der kommer ___ en vikar, hvis læreren er syg.",
        "correct_answer": "måske",
        "explanation": "Adverbiet 'måske' sættes efter det finite verbum i helsætningen.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "cloze",
        "question": "Indsæt 'altid': Han ringer ___, når det er søndag.",
        "correct_answer": "altid",
        "explanation": "Adverbiet 'altid' sættes efter det finite verbum: Han ringer [ALTID], ...",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "cloze",
        "question": "Indsæt 'også': Hun har ___ en onkel, som bor i Herlev.",
        "correct_answer": "også",
        "explanation": "Adverbiet 'også' sættes efter det finite verbum: Hun har [OGSÅ] en onkel.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "cloze",
        "question": "Indsæt 'ikke': De boede ___ på et hotel, der havde swimmingpool.",
        "correct_answer": "ikke",
        "explanation": "Nægtelsen 'ikke' placeres efter det finite verbum i helsætningen.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "cloze",
        "question": "Indsæt 'aldrig': Han spiste ___ slik, da han var barn.",
        "correct_answer": "aldrig",
        "explanation": "Nægtelsen 'aldrig' placeres efter det finite verbum: Han spiste [ALDRIG] slik.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "cloze",
        "question": "Indsæt 'normalt': De tager ___ en taxa, hvis det regner.",
        "correct_answer": "normalt",
        "explanation": "Frekvensadverbiet 'normalt' sættes efter det finite verbum i helsætningen.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    # Inverted word-order examples (V2 rule, time expression fronted)
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "word_order",
        "question": "Put in correct order: om fredagen / spiser / de / pizza",
        "correct_answer": "Om fredagen spiser de pizza",
        "acceptable_answers": ["Om fredagen spiser de pizza."],
        "explanation": "Tidsudtryk først → omvendt ordstilling: Om fredagen SPISER DE pizza. (V2-reglen)",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "word_order",
        "question": "Put in correct order: i weekenden / vil / hun / besøge / Statens Museum for Kunst",
        "correct_answer": "I weekenden vil hun besøge Statens Museum for Kunst",
        "acceptable_answers": ["I weekenden vil hun besøge Statens Museum for Kunst."],
        "explanation": "Tidsudtryk 'i weekenden' → V2: I weekenden VIL HUN besøge ...",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "word_order",
        "question": "Put in correct order: i sidste uge / var / han / syg",
        "correct_answer": "I sidste uge var han syg",
        "acceptable_answers": ["I sidste uge var han syg."],
        "explanation": "Tidsudtryk 'i sidste uge' → V2: I sidste uge VAR HAN syg.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "word_order",
        "question": "Put in correct order: på lørdag / skal / de / løbe / marathon",
        "correct_answer": "På lørdag skal de løbe marathon",
        "acceptable_answers": ["På lørdag skal de løbe marathon."],
        "explanation": "Tidsudtryk 'på lørdag' → V2: På lørdag SKAL DE løbe marathon.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "word_order",
        "question": "Put in correct order: om onsdagen / går / han / til kor",
        "correct_answer": "Om onsdagen går han til kor",
        "acceptable_answers": ["Om onsdagen går han til kor."],
        "explanation": "Tidsudtryk 'om onsdagen' → V2: Om onsdagen GÅR HAN til kor.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "inverted-word-order",
        "exercise_type": "word_order",
        "question": "Put in correct order: om fredagen / svømmer / han / 1500 meter",
        "correct_answer": "Om fredagen svømmer han 1500 meter",
        "acceptable_answers": ["Om fredagen svømmer han 1500 meter."],
        "explanation": "Tidsudtryk 'om fredagen' → V2: Om fredagen SVØMMER HAN 1500 meter.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    # ══════════════════════════════════════════════════════════════════════════
    # MAIN & SUBORDINATE CLAUSES – adverb position in subordinate clause (ledsætning)
    # Rule: adverb goes BEFORE the finite verb in a subordinate clause
    # ══════════════════════════════════════════════════════════════════════════
    {
        "grammar_topic_slug": "main-subordinate-clauses",
        "exercise_type": "cloze",
        "question": "Indsæt 'også': Han kan godt lide, at hun ___ taler dansk.",
        "correct_answer": "også",
        "explanation": "I ledsætningen sættes adverbiet FØR det finite verbum: at hun [OGSÅ] taler.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "main-subordinate-clauses",
        "exercise_type": "cloze",
        "question": "Indsæt 'aldrig': Hun elsker sin mand, fordi han ___ er sur.",
        "correct_answer": "aldrig",
        "explanation": "I ledsætningen placeres 'aldrig' FØR det finite verbum: fordi han [ALDRIG] er sur.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "main-subordinate-clauses",
        "exercise_type": "cloze",
        "question": "Indsæt 'altid': Han elsker sin kone, selvom hun ___ snorker om natten.",
        "correct_answer": "altid",
        "explanation": "I ledsætningen (indledt med 'selvom') sættes adverbiet FØR det finite verbum.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "main-subordinate-clauses",
        "exercise_type": "cloze",
        "question": "Indsæt 'ikke': De bor sammen, selvom de ___ elsker hinanden.",
        "correct_answer": "ikke",
        "explanation": "Nægtelsen 'ikke' placeres FØR det finite verbum i ledsætningen.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "main-subordinate-clauses",
        "exercise_type": "cloze",
        "question": "Indsæt 'stadig': Han har en datter, som ___ bor hjemme.",
        "correct_answer": "stadig",
        "explanation": "I relativsætningen sættes tidsadverbiet FØR det finite verbum: som [STADIG] bor.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "main-subordinate-clauses",
        "exercise_type": "cloze",
        "question": "Indsæt 'kun': Hans kone siger, at han ___ må drikke vand til festen.",
        "correct_answer": "kun",
        "explanation": "I ledsætningen sættes 'kun' FØR det finite verbum: at han [KUN] må drikke.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "main-subordinate-clauses",
        "exercise_type": "cloze",
        "question": "Indsæt 'aldrig': Han er tyk, selvom han ___ spiser fastfood.",
        "correct_answer": "aldrig",
        "explanation": "I ledsætningen (selvom) placeres adverbiet FØR det finite verbum.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "main-subordinate-clauses",
        "exercise_type": "cloze",
        "question": "Indsæt 'desværre': Hun er gået på slankekur, fordi hun ___ er blevet for tyk.",
        "correct_answer": "desværre",
        "explanation": "I ledsætningen (fordi) sættes adverbiet FØR det finite verbum: fordi hun [DESVÆRRE] er.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "main-subordinate-clauses",
        "exercise_type": "cloze",
        "question": "Indsæt 'ikke': De blev meget sure, da deres forældre ___ solgte huset.",
        "correct_answer": "ikke",
        "explanation": "I ledsætningen (da) placeres nægtelsen 'ikke' FØR det finite verbum.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "main-subordinate-clauses",
        "exercise_type": "cloze",
        "question": "Indsæt 'snart': De har en søn, som ___ rejser til Thailand.",
        "correct_answer": "snart",
        "explanation": "I relativsætningen sættes tidsadverbiet 'snart' FØR det finite verbum.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    # ══════════════════════════════════════════════════════════════════════════
    # PRONOUNS – relative pronouns 'som' vs 'der'
    # Rule: 'som' = subject or object; 'der' = subject only
    # ══════════════════════════════════════════════════════════════════════════
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "multiple_choice",
        "question": "Jeg har en gammel bil, ___ jeg elsker.",
        "correct_answer": "som",
        "alternatives": ["der", "hvem", "hvad"],
        "explanation": "Pronomenet er objekt ('jeg elsker hvad? → bilen') → brug 'som', ikke 'der'. 'Der' kan kun bruges som subjekt.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "multiple_choice",
        "question": "Hun skal hen til sin bror, ___ hun hjælper med matematik.",
        "correct_answer": "som",
        "alternatives": ["der", "hvem", "hvad"],
        "explanation": "'Hun hjælper hvem? → sin bror.' Pronomenet er objekt → brug 'som'.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "multiple_choice",
        "question": "Peter har en skolekammerat, ___ han altid driller.",
        "correct_answer": "som",
        "alternatives": ["der", "hvem", "hvad"],
        "explanation": "'Han driller hvem? → skolekammeraten.' Pronomenet er objekt → 'som', ikke 'der'.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "multiple_choice",
        "question": "Jeg vil bytte den skjorte, ___ min kone gav mig.",
        "correct_answer": "som",
        "alternatives": ["der", "hvem", "hvad"],
        "explanation": "'Min kone gav hvem skjorten? → mig.' Skjorten er objekt → 'som'.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "multiple_choice",
        "question": "Der er 5-6 ord i teksten, ___ jeg ikke forstår.",
        "correct_answer": "som",
        "alternatives": ["der", "hvem", "hvad"],
        "explanation": "'Jeg forstår hvad? → ordene.' Pronomenet er objekt → 'som'.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "multiple_choice",
        "question": "Har du en kuglepen, ___ jeg må låne?",
        "correct_answer": "som",
        "alternatives": ["der", "hvem", "hvad"],
        "explanation": "'Jeg låner hvad? → kuglepenen.' Pronomenet er objekt → 'som'.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "cloze",
        "question": "Peter har en skolekammerat, ___ altid driller ham.",
        "correct_answer": "der",
        "acceptable_answers": ["der", "som"],
        "explanation": "Pronomenet er subjekt ('hvem driller ham? → skolekammeraten'). Brug 'der' eller 'som' som subjekt.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "cloze",
        "question": "Det var en film, ___ man aldrig vil glemme.",
        "correct_answer": "som",
        "acceptable_answers": ["som", "der"],
        "explanation": "'Man glemmer hvad? → filmen.' Objekt → 'som'. (Alternativt 'der' som subjekt i: en film, der/som varer...)",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    # ══════════════════════════════════════════════════════════════════════════
    # PRONOUNS – possessive: sin/sit/sine (reflexive) vs hans/hendes (non-reflexive)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "multiple_choice",
        "question": "Abdi er meget stolt af ___ have.",
        "correct_answer": "sin",
        "alternatives": ["hans", "sit", "sine"],
        "hint": "Abdi (han) ejer haven — reflexivt possessiv",
        "explanation": "'Have' er et en-ord. Abdi er subjekt → reflexivt possessiv: 'sin have' (ikke 'hans have').",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "multiple_choice",
        "question": "Mathias er meget glad for ___ hunde.",
        "correct_answer": "sine",
        "alternatives": ["hans", "sin", "sit"],
        "hint": "Mathias (han) ejer hundene — reflexivt possessiv, flertal",
        "explanation": "'Hunde' er flertal. Mathias er subjekt → reflexivt possessiv i flertal: 'sine hunde'.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "multiple_choice",
        "question": "Marieke bor langt væk fra ___ familie.",
        "correct_answer": "sin",
        "alternatives": ["hendes", "sit", "sine"],
        "hint": "Marieke (hun) er subjekt — reflexivt possessiv, en-ord",
        "explanation": "'Familie' er et en-ord. Marieke er subjekt → reflexivt possessiv: 'sin familie'.",
        "module_level": 3,
        "difficulty": 2,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "pronouns",
        "exercise_type": "multiple_choice",
        "question": "Dina og ___ mand låner sommetider en bil.",
        "correct_answer": "hendes",
        "alternatives": ["sin", "sit", "hans"],
        "hint": "Dinas mand er en del af subjektet — ikke-reflexivt",
        "explanation": "Når possessivet refererer til en del af subjektleddet (ikke fra en sætnings verballed), bruges ikke-reflexiv: 'Dina og hendes mand'.",
        "module_level": 3,
        "difficulty": 3,
        "source": "speakspeak",
    },
    # ══════════════════════════════════════════════════════════════════════════
    # NOUN GENDER – definite vs indefinite forms (en bil / bilen)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "Joe har ___ (en bil / bilen). (nævnes for første gang)",
        "correct_answer": "en bil",
        "alternatives": ["bilen"],
        "explanation": "Ny, ukendt genstand nævnt for første gang → ubestemt form: 'en bil'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "___ (En bil / Bilen) er gammel. (om en specifik, allerede nævnt bil)",
        "correct_answer": "Bilen",
        "alternatives": ["En bil"],
        "explanation": "Vi taler om en specifik, allerede nævnt bil → bestemt form: 'Bilen'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "Danske ___ (biler / bilerne) er dyre. (generel påstand)",
        "correct_answer": "biler",
        "alternatives": ["bilerne"],
        "explanation": "Generelle udsagn om en hel kategori bruger ubestemt flertal: 'danske biler'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "Hvor er Kirsten? Hun er gået ned i ___ (en kantine / kantinen)!",
        "correct_answer": "kantinen",
        "alternatives": ["en kantine"],
        "explanation": "Vi ved hvilken kantine (den på arbejdspladsen) → bestemt form: 'kantinen'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "Jeg har ikke nogen ___ (lakridser / lakridserne) med i dag.",
        "correct_answer": "lakridser",
        "alternatives": ["lakridserne"],
        "explanation": "Ubestemt mængde, ingen specifik reference → ubestemt flertal: 'lakridser'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "Han må godt få alle ___ (bøger / bøgerne).",
        "correct_answer": "bøgerne",
        "alternatives": ["bøger"],
        "explanation": "'Alle' + specifik samling → bestemt flertal: 'alle bøgerne'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "Der var en af ___ (gaver / gaverne), hun byttede.",
        "correct_answer": "gaverne",
        "alternatives": ["gaver"],
        "explanation": "'En af' refererer til en specifik gruppe gaver → bestemt flertal: 'gaverne'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "Der står ___ (en kop / koppen) på bordet. Den er til dig.",
        "correct_answer": "en kop",
        "alternatives": ["koppen"],
        "explanation": "Introduktion af en ny, uspecificeret kop → ubestemt form: 'en kop'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "___ (Kursister / Kursisterne) har et moodle-login. (generel regel)",
        "correct_answer": "Kursister",
        "alternatives": ["Kursisterne"],
        "explanation": "Generel regel om alle kursister → ubestemt flertal: 'Kursister'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "Det ligner ikke ham på ___ (et billede / billedet).",
        "correct_answer": "billedet",
        "alternatives": ["et billede"],
        "explanation": "Vi taler om et specifikt billede → bestemt form: 'billedet'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "___ (En bluse / Blusen) er blevet for lille!",
        "correct_answer": "Blusen",
        "alternatives": ["En bluse"],
        "explanation": "En specifik bluse vi kender → bestemt form: 'Blusen'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "Hvornår kører ___ (en bus / bussen)?",
        "correct_answer": "bussen",
        "alternatives": ["en bus"],
        "explanation": "Spørger om en specifik bus (den vi venter på) → bestemt form: 'bussen'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
    {
        "grammar_topic_slug": "noun-gender",
        "exercise_type": "multiple_choice",
        "question": "Jeg tager altid ___ (en cykel / cyklen) på arbejde.",
        "correct_answer": "cyklen",
        "alternatives": ["en cykel"],
        "explanation": "Ens egen, kendte cykel → bestemt form: 'cyklen'.",
        "module_level": 3,
        "difficulty": 1,
        "source": "speakspeak",
    },
]


def main() -> None:
    existing = load_existing()
    print(f"Existing exercises: {len(existing)}")

    filtered = dedupe(NEW_EXERCISES, existing)
    print(f"New exercises to add (after dedup): {len(filtered)}")

    # Stats by topic
    from collections import Counter
    counts = Counter(e["grammar_topic_slug"] for e in filtered)
    for topic, count in sorted(counts.items()):
        print(f"  {topic}: +{count}")

    combined = existing + filtered
    EXERCISES_FILE.write_text(
        json.dumps(combined, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\nTotal exercises after update: {len(combined)}")


if __name__ == "__main__":
    main()
