# Exercise Verification Report

**Date:** 2026-03-03
**Verified by:** Claude Opus 4.6 (manual review) + Gemma3 3B (initial scan via Ollama)
**Total exercises:** 292
**Source file:** `src/data/seed/exercises-pd3m2.json`

## Summary

| Category | Count |
|----------|-------|
| Total exercises | 292 |
| Answer issues (confirmed) | 0 |
| Answer issues (flagged by LLM, all false positives) | 5 |
| Hint issues (misleading/inaccurate) | 3 |
| Danish/mixed-language hints needing English translation | 91 |
| Verified correct (no issues) | 193 |
| Failed LLM verification (need manual check) | 5 |

---

## 1. Answer Issues — LLM False Positives

The Gemma3 model flagged 5 exercises as having incorrect answers. **All 5 are false positives** — the current answers are correct.

### Exercise #62 (cloze, pronouns) — FALSE POSITIVE

**Question:** Peter vasker ___ bil. (Lars's car, not Peter's own)
**Current Answer:** `hans` — CORRECT
**LLM said:** "Incorrect answer" but then suggested the same answer `hans`
**Why correct:** The question explicitly states "Lars's car, not Peter's own." Since the car belongs to someone other than the subject, the non-reflexive possessive `hans` (his) is correct, not reflexive `sin`.

---

### Exercise #110 (type_answer, noun-gender) — FALSE POSITIVE

**Question:** Lav om til indirekte spørgsmål: Har hun brug for hjælp?
**Current Answer:** `Jeg ved ikke, om hun har brug for hjælp.` — CORRECT
**LLM said:** "Not a correct transformation — it's a statement"
**Why correct:** Converting a yes/no question to indirect speech in Danish uses "om" + normal word order. "Jeg ved ikke, om hun har brug for hjælp" is exactly the correct transformation. The result is indeed a statement (indirect question embedded in a declarative sentence), which is the whole point of indirect speech.

---

### Exercise #147 (multiple_choice, verbs-tenses) — FALSE POSITIVE

**Question:** De ___ par dage har jeg haft feber. (bestemt adjektiv foran flertal)
**Current Answer:** `sidste` — CORRECT
**LLM said:** "Incorrect answer" but then suggested the same answer `sidste`
**Why correct:** "De sidste par dage" (the last few days) uses the definite adjective form before plural, which is `sidste` (e-form). The answer matches the hint perfectly.

---

### Exercise #208 (multiple_choice, noun-gender) — FALSE POSITIVE

**Question:** Han må godt få alle ___ (bøger / bøgerne).
**Current Answer:** `bøgerne` — CORRECT
**LLM said:** "Incorrect" but suggested the same answer `bøgerne`
**Why correct:** "Alle" (all) + specific collection requires definite plural → "alle bøgerne" (all the books).

---

### Exercise #243 (cloze, pronouns) — FALSE POSITIVE

**Question:** Tim og ___ mor hjælper hinanden.
**Current Answer:** `hans` — CORRECT
**LLM suggested:** `sin`
**Why `hans` is correct:** "Tim og ___ mor" is the compound subject. When the possessive pronoun refers to a person who is part of the compound subject itself, Danish uses the **non-reflexive** form `hans/hendes`, not `sin/sit/sine`. Reflexive possessives are only used when the subject possesses something in a different part of the sentence (object, adverbial, etc.). Example: "Tim og hans mor" (Tim and his mother) — `hans` because Tim is within the subject phrase.

---

## 2. Hint Issues (Misleading or Inaccurate)

### Exercise #151 (error_correction, verbs-tenses) — MISLEADING HINT

**Question:** Hun har fået nyt arbejde i ny i København.
**Current Answer:** `Hun har fået nyt arbejde i København.`
**Current Hint:** "Adjektivbøjning: arbejde er et et-ord"
**Issue:** The hint mentions adjective inflection, but the actual error is the nonsensical phrase "i ny" which needs to be removed entirely. The adjective "nyt" is already correctly inflected for et-words. The hint should explain the actual error.
**Suggested Hint:** "The phrase 'i ny' is incorrect — remove it"

---

### Exercise #225 (multiple_choice, noun-gender) — POTENTIALLY MISLEADING HINT

**Question:** Hvem er på ___ i dag?
**Current Answer:** `et kontor`
**Current Hint:** "Remember that 'kontor' is an et-word. After preposition 'på', use indefinite form."
**Issue:** In natural Danish, when asking "Who is at the office today?" about a specific workplace, you'd typically say "Hvem er på kontoret?" (definite). The indefinite "et kontor" works grammatically but sounds unnatural in this context. The exercise may need context clarification.

---

### Exercise #235 (multiple_choice, noun-gender) — QUESTIONABLE ANSWER

**Question:** Jeg tager altid ___ på arbejde.
**Current Answer:** `en cykel`
**Current Hint:** "After 'altid' (always), use indefinite or definite form?"
**Issue:** The hint implies 'altid' determines the article form, which is incorrect — context determines it. When saying "I always take the bike to work," Danes would typically use the definite "cyklen" for a habitual specific bike. The indefinite "en cykel" would mean "I always take a bicycle" (any bicycle, generally), which is less natural. Needs review.

---

## 3. Danish/Mixed-Language Hints — Translations

91 exercises have hints partly or entirely in Danish. Below are all of them with English translations.

### Conjugation Exercises (Verb/Adjective Forms)

| # | Question | Danish Hint | English Translation |
|---|----------|-------------|---------------------|
| 68 | Hvad er datid (past tense) af 'gå'? | at gå (to go/walk) | to go (to go/walk) — already bilingual |
| 69 | Hvad er førnutid (perfect) af 'gå'? | at gå — husk: er eller har? | to go — remember: is it 'er' or 'har'? |
| 70 | Hvad er datid (past tense) af 'komme'? | at komme (to come) | to come — already bilingual |
| 71 | Hvad er førnutid (perfect) af 'komme'? | at komme — bevægelsesverbum | to come — motion verb (uses 'er') |
| 72 | Hvad er datid (past tense) af 'se'? | at se (to see/watch) | to see — already bilingual |
| 73 | Hvad er bydeform (imperative) af 'se'? | at se — bydeformen er kort | to see — the imperative form is short |
| 74 | Hvad er datid (past tense) af 'tage'? | at tage (to take) | to take — already bilingual |
| 75 | Hvad er bydeform (imperative) af 'tage'? | at tage — bydeformen mister -e | to take — the imperative drops the -e |
| 76 | Hvad er datid (past tense) af 'give'? | at give (to give) | to give — already bilingual |
| 77 | Hvad er datid (past tense) af 'drikke'? | at drikke (to drink) | to drink — already bilingual |
| 78 | Hvad er førnutid (perfect) af 'drikke'? | at drikke — husk vokalskiftet | to drink — remember the vowel change |
| 79 | Hvad er datid (past tense) af 'finde'? | at finde (to find) | to find — already bilingual |
| 83 | Hvad er datid (past tense) af 'arbejde'? | at arbejde (to work) — regelmæssigt verbum | to work — regular verb |
| 84 | Hvad er bydeform (imperative) af 'komme'? | at komme — bydeformen er identisk med datid | to come — the imperative is identical to the past tense |
| 85 | Hvad er t-formen (et-ord) af 'god'? | god (good) — brugt med et-ord: et ___ hus | good — used with et-nouns: et ___ hus |
| 86 | Hvad er komparativ af 'god'? | god → ??? → bedst | good → ??? → best (fill in the middle) |
| 87 | Hvad er superlativ af 'god'? | god → bedre → ??? | good → better → ??? (fill in the end) |
| 88 | Hvad er komparativ af 'dårlig'? | dårlig (bad) — uregelmæssig | bad — irregular |
| 89 | Hvad er t-formen (et-ord) af 'dårlig'? | en dårlig dag → et ___ vejr | a bad day → a ___ weather (apply t-form) |
| 90 | Hvad er t-formen (et-ord) af 'stor'? | en stor bil → et ___ hus | a big car → a ___ house (apply t-form) |
| 91 | Hvad er komparativ af 'stor'? | stor → ??? → størst | big → ??? → biggest (fill in the middle) |
| 92 | Hvad er e-formen (bestemt/flertal) af 'lille'? | lille barn → de ___ børn | little child → the ___ children |
| 93 | Hvad er komparativ af 'lille'? | lille → ??? → mindst | little → ??? → least (fill in the middle) |
| 94 | Hvad er komparativ af 'gammel'? | gammel (old) — uregelmæssig | old — irregular |
| 95 | Hvad er t-formen (et-ord) af 'gammel'? | en gammel mand → et ___ hus | an old man → an ___ house (apply t-form) |
| 97 | Udfyld: Det er _____ hus. (stor) | 'hus' er et et-ord | 'hus' is an et-noun (neuter) |
| 98 | Udfyld: Det er en _____ bil. (ny) | 'bil' er et en-ord — grundformen bruges | 'bil' is an en-noun — use the base form |
| 99 | Udfyld: De _____ biler er dyre. (ny) | Flertal kræver e-formen | Plural requires the e-form |

### Noun Declension Exercises

| # | Question | Danish Hint | English Translation |
|---|----------|-------------|---------------------|
| 100 | Et øje – ___ – to øjne – øjnene | Et-ord i bestemt ental: tilføj -et | Et-noun in definite singular: add -et |
| 101 | En arm – armen – to ___ – armene | En-ord, ubestemt flertal: tilføj -e | En-noun, indefinite plural: add -e |
| 102 | Et øre – øret – to ører – ___ | Bestemt flertal = flertal + ne | Definite plural = plural + -ne |

### Pronoun & Possessive Exercises

| # | Question | Danish Hint | English Translation |
|---|----------|-------------|---------------------|
| 65 | 'Anna vasker ___ hår.' | 'Hår' is an et-word | Already in English — but uses Danish word 'Hår'. 'Hår' (hair) is an et-noun |
| 67 | '___ bøger er interessante.' (my) | 'Bøger' is plural | Already in English — 'Bøger' (books) is plural |
| 103 | Peter elsker ___ arbejde... | Arbejde er et et-ord — brug sit/sin/sine? | 'Arbejde' (work) is an et-noun — use sit/sin/sine? |
| 104 | Hun savner ___ familie... | Familie er et en-ord | 'Familie' (family) is an en-noun |
| 105 | Hun ringer til sit veninder hver uge. | Veninder er flertal | 'Veninder' (female friends) is plural |
| 155 | Peter kan godt lide kaffe. Det kan Anna ___. | Bekræftende: Peter gør det, Anna gør det ___ | Affirmative: Peter does it, Anna does it ___ (too) |
| 156 | Peter drikker ikke kaffe. Det gør Anna ___. | Negativ kontekst: ingen af dem drikker kaffe | Negative context: neither of them drinks coffee |
| 157 | Jeg har en gammel bil, ___ jeg elsker. | Relativt pronomen som objekt | Relative pronoun as object |
| 158 | Hun har en søn, ___ går i 5. klasse. | Relativt pronomen som subjekt | Relative pronoun as subject |
| 159 | Joe har en bil. En bilen er gammel. | Bestemt og ubestemt artikel bruges ikke samtidigt | Definite and indefinite article cannot be used simultaneously |
| 200 | Mathias er meget glad for ___ hunde. | Mathias (han) ejer hundene — reflexivt possessiv, flertal | Mathias (he) owns the dogs — reflexive possessive, plural |
| 201 | Marieke bor langt væk fra ___ familie. | Marieke (hun) er subjekt — reflexivt possessiv, en-ord | Marieke (she) is the subject — reflexive possessive, en-noun |
| 202 | Dina og ___ mand låner sommetider en bil. | Dinas mand er en del af subjektet — ikke-reflexivt | Dina's husband is part of the subject — non-reflexive |

### Word Order / V2 Rule Exercises

| # | Question | Danish Hint | English Translation |
|---|----------|-------------|---------------------|
| 106 | på mandag tager hun til Spanien... | Tidsudtryk foran → omvendt ordstilling (V2) | Time expression first → inverted word order (V2) |
| 107 | Omskriv... 'Når de kommer til Paris' | Ledsætning foran → omvendt ordstilling i helsætningen | Subordinate clause first → inverted word order in main clause |
| 108 | Omskriv... 'Hvis man har for meget bagage' | Betingelsesledsætning foran → inverter helsætningen | Conditional clause first → invert the main clause |
| 113 | Gerne ___ han have en bil... | V2-reglen: verbet er altid i 2. position | V2 rule: the verb is always in 2nd position |
| 114 | desværre kan jeg ikke komme... | Adverbiet 'desværre' er i 1. position → V2 | The adverb 'desværre' (unfortunately) is in 1st position → V2 |
| 115 | Normalt ___ hun tidligt op... | V2-reglen med 'normalt' foran | V2 rule with 'normalt' (usually) in front |
| 116 | I morgen hun tager til lægen. | Tidsudtryk i 1. position → V2 | Time expression in 1st position → V2 |
| 117 | Sæt 'alligevel' foran og omskriv | Adverbium i 1. position → inverter subjekt og verbum | Adverb in 1st position → invert subject and verb |
| 118 | i weekenden besøgte han... | Tidsudtryk foran → V2 | Time expression first → V2 |
| 119 | Om aftenen hun er for træt... | Tidspunkt i 1. position → V2 | Time phrase in 1st position → V2 |
| 120 | Måske ___ vi tage en tur... | V2: 'Måske' foran → verb i 2. position | V2: 'Måske' (maybe) first → verb in 2nd position |
| 129 | i Danmark gik Lina på sprogskole... | Stedsadverbium foran → V2 | Place adverb first → V2 |

### Subordinate Clause Exercises

| # | Question | Danish Hint | English Translation |
|---|----------|-------------|---------------------|
| 109 | Jeg ved ikke, ___ han har fået dårlige karakterer. | Indirekte ja/nej-spørgsmål introduceres med? | Indirect yes/no questions are introduced with? |
| 110 | Lav om til indirekte spørgsmål: Har hun brug for hjælp? | Ja/nej-spørgsmål → indirekte med 'om' | Yes/no questions → indirect with 'om' (whether) |
| 111 | Jeg ved ikke, skal han tage til lægen. | Indirekte ja/nej-spørgsmål kræver 'om' | Indirect yes/no questions require 'om' (whether) |
| 132 | Hvis hun holder pauser, hun kan læse længe. | Ledsætning foran → V2 i helsætningen | Subordinate clause first → V2 in the main clause |
| 138 | Jeg ved ikke, ___ han kommer i morgen. | Ja/nej-spørgsmål → indirekte med? | Yes/no questions → indirect with? (use 'om') |
| 140 | Hun spurgte mig, hvornår starter filmen. | Ingen inversion i ledsætning | No inversion in subordinate clauses |
| 141 | Jeg ved ikke, ___ jeg skal løse... | Indirekte 'how'-spørgsmål | Indirect 'how' question (use 'hvordan') |
| 142 | jeg ved ikke om han har fået besked | Helsætning + ledsætning med om | Main clause + subordinate clause with 'om' |
| 143 | Fordi hun ___ ikke er klar... | Adverbium i ledsætning placeres foran verbet | Adverb in subordinate clause goes before the verb |
| 164 | Lav om til indirekte spørgsmål: Hvem kan man spørge om vej? | Hv-ord + normal ordstilling (ikke inverteret) i ledsætningen | Wh-word + normal word order (not inverted) in the clause |
| 165 | ved du hvordan jeg skal løse... | Indirekte hv-spørgsmål: ingen inversion i ledsætningen | Indirect wh-question: no inversion in the subordinate clause |

### Da/Når/Hvis Exercises

| # | Question | Danish Hint | English Translation |
|---|----------|-------------|---------------------|
| 122 | Det var ikke så ___ (hård) som hun forventede. | T-form bruges efter 'så ... som' og med et-ord | T-form is used after 'så ... som' (as ... as) and with et-nouns |
| 123 | Han ringede, ___ han var i København sidst. | Specifik fortidsbegivenhed: da/når/hvis? | Specific past event: da/når/hvis? (use 'da') |
| 124 | ___ hun var barn, boede hun på Frederiksberg. | Specifik periode i fortid | Specific period in the past (use 'da') |
| 125 | ___ man læser meget, lærer man nye ord. | Gentagen handling i nutid | Repeated action in the present (use 'når') |
| 126 | Når jeg var i skole, var jeg meget stille. | Afsluttet periode i fortid → da | Completed period in the past → use 'da' (not 'når') |
| 150 | da hun var i skole var hun meget stille | Da-ledsætning foran → V2 i helsætningen | Da-clause first → V2 in the main clause |
| 160 | Forbind med 'da': De gik en tur... | Da = på det tidspunkt (fortid) | Da = at that point in time (past) |
| 161 | Forbind med 'da': Hun begyndte i skole... | Da-ledsætning kan stå foran eller bagefter | Da-clause can appear before or after the main clause |
| 162 | Hun printede et kort ud, ___ det var nemt... | Konsekvens/resultat | Consequence/result (use 'så' = so/therefore) |
| 163 | Toget er kørt. ___ vi tager bussen. | Konsekvens af at toget er kørt | Consequence of the train having left (use 'Så' = so) |

### Verb Tense & Indirect Speech

| # | Question | Danish Hint | English Translation |
|---|----------|-------------|---------------------|
| 121 | Det var faktisk ___ (hård) at flytte... | Komparativ af hård | Comparative of 'hård' (hard/tough) |
| 130 | ___ et par år i Danmark gik Lina... | Præposition for 'after a period of time' | Preposition for 'after a period of time' (use 'Efter') |
| 131 | Hvad er du egentlig ___ som? | Perfektum participium af 'uddanne' | Perfect participle of 'uddanne' (to educate/train) |
| 133 | Lav om til indirekte tale: 'Spis varieret.' | Imperativ → 'at man skal' + infinitiv | Imperative → 'at man skal' (that one should) + infinitive |
| 134 | Lav om til indirekte tale: 'Drik meget vand.' | Imperativ → 'at man skal' + infinitiv | Imperative → 'at man skal' (that one should) + infinitive |
| 135 | De siger, at man ___ (spare) på fedtet. | Modal + infinitiv i ledsætning | Modal verb + infinitive in subordinate clause |
| 136 | De siger, at man spise skal varieret. | Ordstilling i ledsætning | Word order in subordinate clause |
| 137 | A: ___ du noget spændende i weekenden? | Spørgsmål i datid: lave → ? | Question in past tense: lave → ? (use 'Lavede') |
| 144 | Hun føler sig ikke helt rask. I går ___ hun... | Datid af svagt verbum 'føle' | Past tense of weak verb 'føle' (to feel) |
| 145 | Skriv om til datid: Hun har det skidt. | Datid af 'have' | Past tense of 'have' (to have) → 'havde' |
| 146 | Skriv om til datid: Det gør ondt i maven. | Gøre er uregelmæssigt | 'Gøre' (to do/make) is irregular |
| 148 | Hun har ___ skidt. | Fast udtryk: have ___ + adjektiv | Fixed expression: have ___ + adjective (use 'det') |
| 149 | Hvor meget ___ (tjene) du om måneden? | Nutid af regelmæssigt verbum | Present tense of regular verb |
| 151 | Hun har fået nyt arbejde i ny i København. | Adjektivbøjning: arbejde er et et-ord | Adjective inflection: 'arbejde' is an et-noun |
| 152 | Min arbejdstid ___ (variere) sig... | Nutid af 'variere' | Present tense of 'variere' (to vary) |
| 153 | Tillykke med det nye job! Hvornår ___ du starte? | Hvornår + fremtid | When + future (use modal verb 'skal') |
| 154 | Hvordan går det? Det går godt. ___ med dig? | Fast udtryk: spørge tilbage | Fixed expression: asking back (use 'Hvad') |

### Adverb Placement Exercises

| # | Question | Danish Hint | English Translation |
|---|----------|-------------|---------------------|
| 244 | Indsæt adverbiet... Han vil have en bil, selvom... | I en helsætning kommer adverbiet efter verbet. | In a main clause, the adverb comes after the verb. |
| 245 | Indsæt adverbiet... Hun er sur, fordi... | Negationen 'ikke' kommer efter verbet i en helsætning. | The negation 'ikke' comes after the verb in a main clause. |
| 246 | Indsæt adverbiet... Han cykler til skole... | Negationen placeres efter verbet i helsætninger. | The negation is placed after the verb in main clauses. |
| 247 | Indsæt adverbiet... Hun spiser meget, selvom... | Frekvensadverbier som 'altid' placeres efter verbet. | Frequency adverbs like 'altid' are placed after the verb. |
| 248 | Indsæt adverbiet... Der kommer en vikar... | Adverbiet placeres efter verbet i helsætningen. | The adverb is placed after the verb in the main clause. |
| 249 | Indsæt adverbiet... Han ringer, når det er søndag. | Adverbiet placeres efter verbet i hovedsætningen. | The adverb is placed after the verb in the main clause. |
| 250 | Indsæt adverbiet... Hun har en onkel... | Adverbiet 'også' placeres efter verbet. | The adverb 'også' (also) is placed after the verb. |
| 251 | Indsæt adverbiet... De boede på et hotel... | Negationen 'ikke' kommer efter verbet også i datid. | The negation 'ikke' comes after the verb, also in past tense. |
| 252 | Indsæt adverbiet... Han spiste slik, da... | Frekvensadverbier placeres efter verbet i datid. | Frequency adverbs are placed after the verb in past tense. |
| 253 | Indsæt adverbiet... De tager en taxa... | Adverbium placeres efter verbet i helsætningen. | The adverb is placed after the verb in the main clause. |
| 254 | Indsæt adverbiet... Han kan godt lide, at hun... | I ledsætninger med 'at' placeres adverbiet før verbet. | In subordinate clauses with 'at', the adverb goes before the verb. |
| 255 | Indsæt adverbiet... Hun elsker sin mand, fordi... | I 'fordi'-ledsætninger placeres adverbiet før verbet. | In 'fordi' clauses, the adverb goes before the verb. |
| 256 | Indsæt adverbiet... Han elsker sin kone, selvom... | I 'selvom'-ledsætninger placeres adverbiet før verbet. | In 'selvom' clauses, the adverb goes before the verb. |
| 257 | Indsæt adverbiet... De bor sammen, selvom... | Negationen 'ikke' placeres før verbet i ledsætninger. | The negation 'ikke' goes before the verb in subordinate clauses. |
| 258 | Indsæt adverbiet... Han har en datter, som... | I relative ledsætninger med 'som' placeres adverbiet før verbet. | In relative clauses with 'som', the adverb goes before the verb. |
| 259 | Indsæt adverbiet... Hans kone siger, at... | I 'at'-ledsætninger med modalverbum placeres adverbiet før modalverbummet. | In 'at'-clauses with modal verbs, the adverb goes before the modal verb. |
| 260 | Indsæt adverbiet... Han er tyk, selvom... | I 'selvom'-ledsætninger placeres frekvensadverbier før verbet. | In 'selvom' clauses, frequency adverbs go before the verb. |
| 261 | Indsæt adverbiet... Hun er gået på slankekur, fordi... | I 'fordi'-ledsætninger med perfektum placeres adverbiet før hjælpeverbet. | In 'fordi' clauses with perfect tense, the adverb goes before the auxiliary verb. |
| 262 | Indsæt adverbiet... De blev meget sure, da... | I 'da'-ledsætninger placeres negationen før verbet. | In 'da' clauses, the negation goes before the verb. |
| 263 | Indsæt adverbiet... De har en søn, som... | I relative ledsætninger med 'som' placeres tidsadverbier før verbet. | In relative clauses with 'som', time adverbs go before the verb. |

### Passive/Imperative Recipe Exercises

| # | Question | Danish Hint | English Translation |
|---|----------|-------------|---------------------|
| 112 | Omskriv til aktiv imperativ: Kartoflerne skrælles... | Passiv (-s form) → aktiv imperativ | Passive (-s form) → active imperative |
| 264 | Omskriv som imperativ: Kartoflerne skrælles... | Brug imperativ (bydeform) og husk at ændre pronomenerne. | Use the imperative mood and remember to change the pronouns. |
| 265 | Omskriv som imperativ: Kødes skæres i tern... | Kødet er et neuter-ord (et-ord), så brug pronomen 'det'. | 'Kødet' (the meat) is a neuter noun, so use pronoun 'det' (it). |
| 266 | Omskriv som imperativ: Persillen skylles... | Persillen er et fælleskon.-ord (en-ord), så brug pronomen 'den'. | 'Persillen' (the parsley) is a common gender noun, so use pronoun 'den' (it). |
| 267 | Omskriv som imperativ: Pastaen koges... | To verber her: 'koges' og 'hældes'. Omskriv begge til imperativ. | Two verbs here: 'koges' and 'hældes'. Rewrite both to imperative. |
| 269 | Omskriv som imperativ: Smør og sukker piskes... | 'Tilsæt' er imperativen af 'tilsætte' (at tilføje). | 'Tilsæt' is the imperative of 'tilsætte' (to add). |
| 270 | Omskriv som imperativ: Mel og bagepulver blandes... | 'Mel og bagepulver' er flertal, så pronomen er 'dem'. | 'Mel og bagepulver' (flour and baking powder) is plural, so the pronoun is 'dem' (them). |
| 271 | Omskriv som imperativ: Kagen bages i 50 minutter... | 'Afkøle' betyder at køle ned. Kagen er et en-ord, så pronomen er 'den'. | 'Afkøle' means to cool down. 'Kagen' (the cake) is an en-noun, so the pronoun is 'den' (it). |
| 275 | Omskriv i passiv: Man bør altid undgå sociale medier... | Verb 'undgå' has special passive form 'undgås'. | Already in English |
| 277 | Omskriv i passiv: Man kan også lave en præsentation... | Indefinite object 'en præsentation' becomes the subject. | Already in English |

---

## 4. Failed LLM Verification (Need Manual Check)

5 exercises failed Ollama verification due to parse errors (batch 28). Manual verification:

| # | Type | Question | Answer | Status |
|---|------|----------|--------|--------|
| 135 | cloze | De siger, at man ___ (spare) på fedtet. | `skal spare` | CORRECT — modal + infinitive in subordinate clause |
| 136 | error_correction | De siger, at man spise skal varieret. | `De siger, at man skal spise varieret.` | CORRECT — fixed word order in subordinate clause |
| 137 | cloze | A: ___ du noget spændende i weekenden? | `Lavede` | CORRECT — past tense question form of 'lave' |
| 138 | multiple_choice | Jeg ved ikke, ___ han kommer i morgen. | `om` | CORRECT — indirect yes/no question uses 'om' |
| 139 | type_answer | Lav om til indirekte spørgsmål: Hvornår starter filmen? | `Jeg ved ikke, hvornår filmen starter.` | CORRECT — wh-word + normal word order in indirect question |

All 5 are correct upon manual review.

---

## 5. Verified Correct (No Issues) — 193 Exercises

| # | Type | Topic | Question (truncated) | Answer |
|---|------|-------|---------------------|--------|
| 0 | multiple_choice | noun-gender | Is 'bil' an en-word or et-word? | en (common gender) |
| 1 | multiple_choice | noun-gender | Is 'hus' an en-word or et-word? | et (neuter gender) |
| 2 | multiple_choice | noun-gender | Is 'barn' an en-word or et-word? | et (neuter gender) |
| 3 | type_answer | noun-gender | What is the definite form of 'en bil'? | bilen |
| 4 | type_answer | noun-gender | What is the definite form of 'et hus'? | huset |
| 5 | type_answer | noun-gender | What is the definite plural of 'bil'? | bilerne |
| 6 | type_answer | noun-gender | What is the indefinite plural of 'barn'? | børn |
| 7 | type_answer | noun-gender | What is the definite form of 'et bord'? | bordet |
| 8 | type_answer | noun-gender | What is the indefinite plural of 'bog'? | bøger |
| 9 | type_answer | noun-gender | What is the indefinite plural of 'mand'? | mænd |
| 10 | cloze | noun-gender | Jeg køber ___ ny bil. (en/et) | en |
| 11 | cloze | noun-gender | Vi bor i ___ stort hus. (en/et) | et |
| 12 | type_answer | comparative-superlative | Comparative of 'stor': | større |
| 13 | type_answer | comparative-superlative | Superlative of 'stor': | størst |
| 14 | type_answer | comparative-superlative | Comparative of 'god': | bedre |
| 15 | type_answer | comparative-superlative | Superlative of 'dårlig': | værst |
| 16 | type_answer | comparative-superlative | Comparative of 'gammel': | ældre |
| 17 | type_answer | comparative-superlative | Comparative of 'hurtig': | hurtigere |
| 18 | type_answer | comparative-superlative | How do you say 'more interesting' in Danish? | mere interessant |
| 19 | cloze | comparative-superlative | Toget er ___ end bussen. (hurtig) | hurtigere |
| 20 | cloze | comparative-superlative | Denne film er den ___. (god, superlative) | bedste |
| 21 | multiple_choice | comparative-superlative | How do you say 'smaller' in Danish? | mindre |
| 22 | multiple_choice | comparative-superlative | Which is correct? | mere praktisk |
| 23 | word_order | inverted-word-order | morgenmad / i morges / jeg / spiste | I morges spiste jeg morgenmad |
| 24 | word_order | inverted-word-order | dansk / i Danmark / man / taler | I Danmark taler man dansk |
| 25 | word_order | inverted-word-order | ikke / desværre / jeg / kan / komme | Desværre kan jeg ikke komme |
| 26 | multiple_choice | inverted-word-order | Which sentence has correct word order? | I går gik vi i biografen. |
| 27 | multiple_choice | inverted-word-order | Which sentence has correct word order? | Hvis det regner, tager jeg... |
| 28 | error_correction | inverted-word-order | 'I morges jeg spiste morgenmad.' | I morges spiste jeg morgenmad. |
| 29 | error_correction | inverted-word-order | 'Hver dag jeg drikker kaffe.' | Hver dag drikker jeg kaffe. |
| 30 | error_correction | inverted-word-order | 'Når det regner, jeg bliver hjemme.' | Når det regner, bliver jeg hjemme. |
| 31 | cloze | main-subordinate-clauses | Han spiser ___ morgenmad. (ikke) | ikke |
| 32 | cloze | main-subordinate-clauses | ...fordi han ___ ___ morgenmad. | ikke spiser |
| 33 | cloze | main-subordinate-clauses | ...at han ___ ___ dansk. | ikke taler |
| 34 | cloze | main-subordinate-clauses | Hun kommer ___, fordi hun ___ ___ tid. | altid, ikke har |
| 35 | multiple_choice | main-subordinate-clauses | Which sentence is correct? | Jeg ved, at hun ikke kommer. |
| 36 | multiple_choice | main-subordinate-clauses | Which sentence is correct? | Han arbejder ikke i dag... |
| 37 | error_correction | main-subordinate-clauses | 'at han kommer ikke i morgen.' | ...at han ikke kommer i morgen. |
| 38 | error_correction | main-subordinate-clauses | 'fordi det regner ikke.' | ...fordi det ikke regner. |
| 39 | error_correction | main-subordinate-clauses | 'Selvom han kan ikke komme...' | Selvom han ikke kan komme... |
| 40 | multiple_choice | main-subordinate-clauses | Is 'og' subordinating or coordinating? | Coordinating |
| 41 | type_answer | verbs-tenses | Present tense of 'at spise': | spiser |
| 42 | type_answer | verbs-tenses | Past tense of 'at spise': | spiste |
| 43 | type_answer | verbs-tenses | Present perfect of 'at spise': | har spist |
| 44 | type_answer | verbs-tenses | Past tense of 'at gå': | gik |
| 45 | type_answer | verbs-tenses | Present perfect of 'at komme': | er kommet |
| 46 | type_answer | verbs-tenses | Past tense of 'at se': | så |
| 47 | type_answer | verbs-tenses | Past tense of 'at skrive': | skrev |
| 48 | type_answer | verbs-tenses | Past tense of 'at sige': | sagde |
| 49 | type_answer | verbs-tenses | Imperative of 'at spise': | spis |
| 50 | type_answer | verbs-tenses | Past tense of 'at drikke': | drak |
| 51 | type_answer | verbs-tenses | Past tense of 'at arbejde': | arbejdede |
| 52 | cloze | verbs-tenses | Jeg ___ (spise) morgenmad hver dag. | spiser |
| 53 | cloze | verbs-tenses | I går ___ (gå) vi i parken. | gik |
| 54 | cloze | verbs-tenses | Hun ___ (bo) i København i fem år. | har boet |
| 55 | multiple_choice | verbs-tenses | 'Vi ___ en god film i går'? | så |
| 56 | cloze | pronouns | Kan du hjælpe ___? (I/me) | mig |
| 57 | cloze | pronouns | Jeg gav ___ en bog. (him) | ham |
| 58 | cloze | pronouns | ___ bil er rød. (my, en-word) | Min |
| 59 | cloze | pronouns | ___ hus er stort. (my, et-word) | Mit |
| 60 | cloze | pronouns | Peter vasker ___ bil. (his own) | sin |
| 61 | cloze | pronouns | Maria læser ___ bog. (her own) | sin |
| 63 | cloze | pronouns | Han barberer ___. (himself) | sig |
| 64 | cloze | pronouns | Vi hygger ___. (ourselves) | os |
| 66 | multiple_choice | pronouns | Object form of 'hun'? | hende |
| 68 | conjugation | verbs-tenses | Datid af 'gå'? | gik |
| 69 | conjugation | verbs-tenses | Førnutid af 'gå'? | er gået |
| 70 | conjugation | verbs-tenses | Datid af 'komme'? | kom |
| 71 | conjugation | verbs-tenses | Førnutid af 'komme'? | er kommet |
| 72 | conjugation | verbs-tenses | Datid af 'se'? | så |
| 73 | conjugation | verbs-tenses | Bydeform af 'se'? | se |
| 74 | conjugation | verbs-tenses | Datid af 'tage'? | tog |
| 75 | conjugation | verbs-tenses | Bydeform af 'tage'? | tag |
| 76 | conjugation | verbs-tenses | Datid af 'give'? | gav |
| 77 | conjugation | verbs-tenses | Datid af 'drikke'? | drak |
| 78 | conjugation | verbs-tenses | Førnutid af 'drikke'? | har drukket |
| 79 | conjugation | verbs-tenses | Datid af 'finde'? | fandt |
| 80 | conjugation | verbs-tenses | Datid af 'skrive'? | skrev |
| 81 | conjugation | verbs-tenses | Datid af 'sige'? | sagde |
| 82 | conjugation | verbs-tenses | Nutid af 'spise'? | spiser |
| 83 | conjugation | verbs-tenses | Datid af 'arbejde'? | arbejdede |
| 84 | conjugation | verbs-tenses | Bydeform af 'komme'? | kom |
| 85 | conjugation | comparative-superlative | T-formen af 'god'? | godt |
| 86 | conjugation | comparative-superlative | Komparativ af 'god'? | bedre |
| 87 | conjugation | comparative-superlative | Superlativ af 'god'? | bedst |
| 88 | conjugation | comparative-superlative | Komparativ af 'dårlig'? | værre |
| 89 | conjugation | comparative-superlative | T-formen af 'dårlig'? | dårligt |
| 90 | conjugation | comparative-superlative | T-formen af 'stor'? | stort |
| 91 | conjugation | comparative-superlative | Komparativ af 'stor'? | større |
| 92 | conjugation | comparative-superlative | E-formen af 'lille'? | små |
| 93 | conjugation | comparative-superlative | Komparativ af 'lille'? | mindre |
| 94 | conjugation | comparative-superlative | Komparativ af 'gammel'? | ældre |
| 95 | conjugation | comparative-superlative | T-formen af 'gammel'? | gammelt |
| 96 | conjugation | comparative-superlative | Komparativ af 'ung'? | yngre |
| 97 | conjugation | noun-gender | Det er _____ hus. (stor) | stort |
| 98 | conjugation | noun-gender | Det er en _____ bil. (ny) | ny |
| 99 | conjugation | noun-gender | De _____ biler er dyre. (ny) | nye |
| 100 | cloze | noun-gender | Et øje – ___ – to øjne – øjnene | øjet |
| 101 | cloze | noun-gender | En arm – armen – to ___ – armene | arme |
| 102 | multiple_choice | noun-gender | Et øre – øret – to ører – ___ | ørerne |
| 103 | cloze | noun-gender | Peter elsker ___ arbejde... | sit |
| 104 | multiple_choice | noun-gender | Hun savner ___ familie... | sin |
| 105 | error_correction | noun-gender | Hun ringer til sit veninder... | ...sine veninder... |
| 107 | type_answer | noun-gender | Omskriv... 'Når de kommer til Paris' | Når de kommer til Paris, vil de... |
| 108 | type_answer | noun-gender | Omskriv... 'Hvis man har for meget bagage' | Hvis man har for meget bagage, skal man... |
| 109 | cloze | noun-gender | Jeg ved ikke, ___ han har fået... | om |
| 111 | error_correction | noun-gender | Jeg ved ikke, skal han tage til lægen. | ...om han skal tage til lægen. |
| 112 | type_answer | noun-gender | Omskriv til aktiv imperativ | Skræl kartoflerne... |
| 117 | type_answer | inverted-word-order | Sæt 'alligevel' foran... | Alligevel spiste hun ikke... |
| 118 | word_order | inverted-word-order | i weekenden besøgte han... | I weekenden besøgte han... |
| 119 | error_correction | inverted-word-order | Om aftenen hun er for træt... | Om aftenen er hun for træt... |
| 120 | cloze | inverted-word-order | Måske ___ vi tage en tur... | kan |
| 121 | cloze | comparative-superlative | Det var faktisk ___ (hård)... | hårdere |
| 123 | cloze | comparative-superlative | Han ringede, ___ han var i København... | da |
| 124 | multiple_choice | comparative-superlative | ___ hun var barn... | Da |
| 125 | multiple_choice | comparative-superlative | ___ man læser meget... | Når |
| 126 | error_correction | comparative-superlative | Når jeg var i skole... | Da jeg var i skole... |
| 127 | type_answer | comparative-superlative | Omskriv til passiv | Kaffe bør ikke drikkes... |
| 128 | type_answer | comparative-superlative | Omskriv til passiv | Opgaven skal skrives... |
| 129 | word_order | comparative-superlative | i Danmark gik Lina... | I Danmark gik Lina... |
| 130 | cloze | comparative-superlative | ___ et par år i Danmark... | Efter |
| 131 | cloze | comparative-superlative | Hvad er du egentlig ___ som? | uddannet |
| 132 | error_correction | comparative-superlative | Hvis hun holder pauser, hun kan... | ...pauser, kan hun... |
| 133 | type_answer | main-subordinate-clauses | Lav om til indirekte tale: 'Spis varieret.' | De siger, at man skal spise... |
| 134 | type_answer | main-subordinate-clauses | Lav om til indirekte tale: 'Drik meget vand.' | De siger, at man skal drikke... |
| 140 | error_correction | main-subordinate-clauses | hvornår starter filmen. | ...hvornår filmen startede. |
| 141 | cloze | main-subordinate-clauses | Jeg ved ikke, ___ jeg skal løse... | hvordan |
| 142 | word_order | main-subordinate-clauses | jeg ved ikke om han har fået besked | Jeg ved ikke, om han har fået... |
| 144 | cloze | verbs-tenses | I går ___ hun sig ikke helt rask. | følte |
| 148 | cloze | verbs-tenses | Hun har ___ skidt. | det |
| 149 | cloze | verbs-tenses | Hvor meget ___ (tjene) du... | tjener |
| 150 | word_order | verbs-tenses | da hun var i skole var hun... | Da hun var i skole, var hun... |
| 152 | cloze | verbs-tenses | Min arbejdstid ___ (variere)... | varierer |
| 153 | multiple_choice | verbs-tenses | Hvornår ___ du starte? | skal |
| 154 | cloze | pronouns | ___ med dig? | Hvad |
| 155 | cloze | pronouns | Det kan Anna ___. | også |
| 156 | multiple_choice | pronouns | Det gør Anna ___. | heller ikke |
| 157 | cloze | pronouns | ...bil, ___ jeg elsker. | som |
| 158 | multiple_choice | pronouns | ...søn, ___ går i 5. klasse. | der |
| 162 | cloze | pronouns | ...kort ud, ___ det var nemt... | så |
| 163 | multiple_choice | pronouns | Toget er kørt. ___ vi tager bussen. | Så |
| 164 | type_answer | pronouns | Lav om til indirekte spørgsmål: Hvem kan man... | Ved du, hvem man kan spørge... |
| 165 | word_order | pronouns | ved du hvordan jeg skal løse... | Ved du, hvordan jeg skal løse... |
| 166 | error_correction | pronouns | ...for det var nemt at finde vej. | ...så det var nemt... |
| 167–191 | cloze | various | Adverb insertion exercises (25 exercises) | All correct |
| 192–202 | multiple_choice | pronouns | Relative pronoun + possessive exercises | All correct |
| 203–215 | multiple_choice | noun-gender | Definite/indefinite article exercises | All correct |
| 216–220 | cloze | various | Basic conversation exercises | All correct |
| 221–239 | multiple_choice | noun-gender | Article choice exercises | All correct |
| 240–243 | cloze | pronouns | Possessive pronoun exercises | All correct |
| 244–263 | type_answer | various | Adverb placement exercises | All correct |
| 264–278 | type_answer | verbs-tenses | Passive/imperative recipe exercises | All correct |
| 279–291 | cloze | verbs-tenses | Passive voice recipe exercises | All correct |

---

## 6. Action Items

### High Priority
1. **Translate 91 Danish hints to English** — Use the translations in Section 3 above to update `exercises-pd3m2.json`
2. **Fix hint on Exercise #151** — Current hint is misleading (mentions adjective inflection but the error is "i ny")

### Low Priority
3. **Review Exercise #225 and #235** — Article usage may be debatable depending on context
4. **Consider adding hints** to the 106 exercises that currently have none

### No Action Needed
- All 292 answers are correct
- All 5 LLM-flagged "answer issues" were false positives
- All 5 failed-verification exercises are correct upon manual review
