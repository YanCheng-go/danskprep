# Danish LLM Models — Reference Guide

**Last updated:** 2026-03-03
**Purpose:** Catalog of Danish-specific and Nordic LLMs for local inference in DanskPrep.

---

## Danish-Specific Models

### SnakModel 7B Instruct (Best Danish-only)

| Attribute | Value |
|-----------|-------|
| **Size** | 7B params (BF16, ~14GB) |
| **Base** | Llama 2 7B |
| **Training** | 350M docs / 13.6B Danish words + 3.7M instruction pairs |
| **Developed by** | NLPnorth, IT University of Copenhagen |
| **License** | Llama 2 |
| **Ollama** | No GGUF yet; MLX 4-bit for Apple Silicon available |
| **HuggingFace** | [NLPnorth/snakmodel-7b-instruct](https://huggingface.co/NLPnorth/snakmodel-7b-instruct) |
| **Paper** | [arXiv:2412.12956](https://arxiv.org/abs/2412.12956) |

**Benchmark (highest Danish-only 7B):**

| Task | Score |
|------|-------|
| Linguistic Acceptability (mF1) | 52.91 |
| NER (μF1) | 29.76 |
| Sentiment (mF1) | 66.70 |
| Summarization (BERTScore) | 66.61 |
| QA (F1) | 64.66 |
| Topic Modeling (Acc) | 71.05 |
| Cultural Tasks (Acc) | 71.88 |
| **Overall Average** | **56.63** |

Beats LLaMA2-7B Chat+INST_da (51.39), LLaMA2-7B Base+INST_da (49.35), Viking-7B (37.82).

**Variants:**
- `NLPnorth/snakmodel-7b-base` — base pretrained
- `NLPnorth/snakmodel-7b-instruct` — instruction-tuned (primary)
- `NLPnorth/snakmodel-7b-instruct-mlx-4bit` — Apple Silicon optimized

---

### Munin 7B Alpha (Danish Foundation Models)

| Attribute | Value |
|-----------|-------|
| **Size** | 7B params |
| **Base** | Mistral 7B v0.1 |
| **Training** | Continual pretraining on Danish Gigaword |
| **License** | Apache 2.0 |
| **Status** | Alpha — base model only (no instruction tuning) |
| **Ollama** | GGUF available (Q8_0) |
| **HuggingFace** | [danish-foundation-models/munin-7b-alpha](https://huggingface.co/danish-foundation-models/munin-7b-alpha) |
| **GGUF** | [munin-7b-alpha-Q8_0-GGUF](https://huggingface.co/danish-foundation-models/munin-7b-alpha-Q8_0-GGUF) |

**Run with llama.cpp:**
```bash
llama-cli --hf-repo saattrupdan/munin-7b-alpha-Q8_0-GGUF --hf-file munin-7b-alpha-q8_0.gguf
```

---

### OpenEuroLLM-Danish (Easiest to run)

| Attribute | Value |
|-----------|-------|
| **Size** | ~8GB |
| **Base** | Gemma 3 |
| **Context** | 128K tokens |
| **License** | Apache 2.0 |
| **Ollama** | `ollama run jobautomation/OpenEuroLLM-Danish` |
| **Downloads** | 481 |
| **Features** | Danish grammar rules, cultural awareness, authentic vocabulary |

**Run:**
```bash
ollama run jobautomation/OpenEuroLLM-Danish
```

---

## Nordic Multi-Language Models

### Viking 7B

| Attribute | Value |
|-----------|-------|
| **Languages** | Danish, Swedish, Norwegian, Finnish, Icelandic + English + code |
| **Developed by** | Silo AI |
| **Ollama** | `ollama run akx/viking-7b` |
| **Note** | Nordic generalist — less specialized for Danish than SnakModel |

### GPT-SW3

| Attribute | Value |
|-----------|-------|
| **Languages** | Swedish, Norwegian, Danish, Icelandic, English + code |
| **Sizes** | 356M to 40B params |
| **Developed by** | AI Sweden + RISE |
| **Note** | Swedish-focused, Danish is secondary |
| **HuggingFace** | [AI-Sweden-Models/gpt-sw3-356m](https://huggingface.co/AI-Sweden-Models/gpt-sw3-356m) |

---

## EuroEval Danish NLG Rankings (Nov 2025)

From the [State-of-the-art Danish Models collection](https://huggingface.co/collections/danish-foundation-models/state-of-the-art-danish-models):

| Size Range | Best Model | Danish-specific? |
|------------|-----------|-----------------|
| 10-100B | Mistral-Small-3.1-24B-Instruct | No |
| 10-100B | Gemma 3 27B IT | No |
| 7-9B | Gemma 2 9B IT | No |
| 7-9B | Gemma 3n E4B IT | No |
| Danish-only 7B | **SnakModel 7B Instruct** | Yes |

---

## Practical Comparison for DanskPrep Tasks

| Task | Best Pick | Why |
|------|-----------|-----|
| Verb conjugation | SnakModel or OpenEuroLLM-Danish | Purpose-built Danish grammar knowledge |
| Answer checking / typo detection | SnakModel | Highest linguistic acceptability score |
| Exercise generation | OpenEuroLLM-Danish | Easy Ollama setup, 128K context |
| Sentence translation | Gemma 3 27B or Mistral 24B | Larger models are better at translation |
| Speech-to-text | syvai/hviske-v3-conversation | Lowest WER on Danish conversations |
| Embeddings (similarity) | jina-embeddings-v3 or multilingual-e5-large | Best on Scandinavian Embedding Benchmark |

---

## Running on This Machine

**Currently installed (Ollama):**
- gemma3:latest (3.3GB) — general Gemma 3 1B/4B
- qwen3:4b (2.5GB)

**Recommended to add:**
```bash
# Danish-tuned Gemma 3 — easiest option
ollama run jobautomation/OpenEuroLLM-Danish

# Nordic multilingual
ollama run akx/viking-7b

# Danish foundation model (base only, no instruct)
# Download GGUF from HuggingFace, import to Ollama:
# https://huggingface.co/danish-foundation-models/munin-7b-alpha-Q8_0-GGUF
```

**For best quality (requires GGUF conversion):**
```bash
# SnakModel — needs manual conversion
# 1. Clone: git clone https://huggingface.co/NLPnorth/snakmodel-7b-instruct
# 2. Convert with llama.cpp: python convert_hf_to_gguf.py snakmodel-7b-instruct
# 3. Quantize: llama-quantize snakmodel-7b-instruct.gguf snakmodel-7b-instruct-Q4_K_M.gguf Q4_K_M
# 4. Import to Ollama with a Modelfile
```

---

## Resources

- [Danish Foundation Models](https://www.foundationmodels.dk/)
- [awesome-danish](https://github.com/fnielsen/awesome-danish) — curated list of Danish NLP resources
- [DaLA dataset](https://arxiv.org/pdf/2512.04799) — Danish Linguistic Acceptability evaluation
- [SnakModel paper](https://arxiv.org/abs/2412.12956) — training lessons learned
- [EuroEval benchmarks](https://huggingface.co/collections/danish-foundation-models/state-of-the-art-danish-models)
- [Ollama HuggingFace GGUF guide](https://huggingface.co/docs/hub/en/ollama)
