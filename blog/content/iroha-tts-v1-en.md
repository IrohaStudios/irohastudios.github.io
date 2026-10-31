# Iroha-TTS-V1: controllable emotional speech in Japanese

**Choose how a Japanese line is delivered: its emotion and intensity, a change of feeling halfway through, a laugh or sigh, a whisper, or a specific pronunciation—all with a reference voice you provide.**

Iroha Studios · October 31, 2026

[Listen](#listen) · [Model repository](https://huggingface.co/IrohaStudio/Iroha-TTS) · [Technical notes](/blog/research/en/)

---

## What is in this version

Iroha-TTS-V1 is an emotional speech synthesis model for Japanese character dialogue, adapted from [Fish Audio S2-Pro](https://huggingface.co/fishaudio/s2-pro). This version includes **model weights and runnable inference code**. Once you have repository access and download the files, you can run it on one NVIDIA GPU without an inference service from us.

Seven controls share the same weights:

| | Control | How to use it |
|---|---|---|
| 01 | Whole-line emotion | `joy`, `anger`, `sadness`, or `surprise` |
| 02 | Emotion intensity | Four presets or a float within the supported range; experimental |
| 03 | Mid-line emotion changes | `[happy]やっと会えた。[sad]でも、もうお別れだね。` in one generation |
| 04 | Voice cloning | A short reference recording and its transcript |
| 05 | Laughter, sighs, crying | Place `[laugh]`, `[sigh]`, or `[cry]` in the text |
| 06 | Whispering | `[whisper]ここだけの話だよ。` |
| 07 | Kana pronunciation | `水神[みずかみ]` for names or ambiguous readings |

The weights and code are hosted at [IrohaStudio/Iroha-TTS](https://huggingface.co/IrohaStudio/Iroha-TTS). As of October 31, 2026, anonymous access to the model repository and online Space is restricted. Downloads require the relevant Hugging Face access. You can listen to the [comparison below](#listen) and [all 20 audio samples](/blog/research/en/#listen) on this site without signing in.

---

## The problem we wanted to work on

Japanese TTS can already read text quite naturally. In character dialogue, audio drama and voice agents, the time-consuming part is often getting the delivery you want.

The same line might need to sound happy, begin with a sigh, turn from delight to disappointment, be whispered close to the listener, or pronounce a character’s name exactly as written in the script. This can take repeated sampling or manually joining separate recordings.

Iroha makes **these choices part of the input**. A text tag or an API parameter asks for a delivery without requiring you to construct its acoustic details by hand.

We focused on controllable expression in Japanese dialogue. This work does not establish better performance across every language or speech task.

---

## What the evaluations show

We use automatic evaluation and a Japanese listening study. The automatic results come from the October 29, 2026 technical report; listener scores are the October 30 snapshot.

### Automatic evaluation

The panel contains 6 speakers × 20 evaluation texts × 4 emotions, or 480 outputs per system. Request IDs, texts, requested emotions and reference audio are matched. EmoRuler, our adapted emotion classifier, measures emotion accuracy, with the public emotion2vec+ model as a cross-check. CER uses Qwen3-ASR, speaker similarity uses WavLM + ECAPA, and UTMOS predicts audio quality.

| System | Emotion accuracy<br>(emotion2vec+) | Emotion accuracy<br>(EmoRuler) | CER | Speaker similarity | UTMOS |
|---|---|---|---|---|---|
| **Iroha-TTS-V1** | **82.1%** | **89.0%** | **5.6%** | 0.645 | **3.58** |
| Original Fish S2-Pro | 17.9% | 6.0% | 5.6% | 0.685 | 3.51 |
| Fish Audio Drama 3 | 32.1% | 21.2% | 7.0% | 0.628 | 3.26 |
| IndexTTS-2.5 (emotion vector 0.8) | 40.2% | 30.6% | 6.9% | 0.612 | 2.26 |
| Irodori-TTS v4-Large (text description) | 30.8% | 20.6% | 6.0% | 0.649 | 3.03 |

<small>This development panel was reused for model selection; it is not an independent test set. Four of its six voices appeared in EmoRuler training, and the overlap audit remains limited. Each system uses one selected configuration; backends, interfaces and training budgets differ. Without emotion tags, Iroha scores 5.0% CER, 0.685 speaker similarity and 3.63 UTMOS.</small>

A **strictly paired comparison** isolates the weight adaptation: the same inference engine, inputs, reference encodings and random seeds, with only the weights changed.

- EmoRuler emotion accuracy: 6.04% → **89.17%**, up 83.13 percentage points (95% interval: 79.79–86.25).
- Public emotion2vec+ emotion accuracy: 17.92% → **83.54%**.
- Character error rate: essentially unchanged, −0.01 percentage points.
- Predicted quality, UTMOS: +0.06.

On these matched requests, better adherence to emotion tags did not come with a higher character error rate.

### Subjective listening test: MOS (Japanese)

We selected 15 groups × 5 emotions = 75 lines. Each listener heard all 75 lines.

| Model | Naturalness ↑ | Emotion match ↑ | Voice similarity ↑ | Overall score ↑ | Win share ↑ |
|---|---|---|---|---|---|
| Ours | 3.84 | **4.20** | 3.52 | **3.85** | **31.7%** |
| Fish Audio Drama 3 | **3.97** | 3.64 | 3.45 | 3.69 | 23.2% |
| Irodori-TTS v4 large · Text description | 3.61 | 3.95 | 3.32 | 3.63 | 28.1% |
| Fish S2 Pro Original | 3.75 | 2.93 | **3.72** | 3.47 | 12.1% |
| IndexTTS-2.5 | 2.35 | 3.49 | 2.81 | 2.88 | 4.9% |

<small>All three dimensions use human ratings on a five-point scale (MOS). The overall score is their unweighted mean. Win share compares the five models for each listener–line pair, splitting credit equally when models tie for first.</small>

#### Pairwise win rates

Ours’ pairwise win rates, based on the overall score, with ties counted as half a win:

| Comparison | Ours win rate ↑ |
|---|---|
| vs. Fish S2 Pro Original | **69.3%** |
| vs. Fish Audio Drama 3 | **58.0%** |
| vs. Irodori-TTS v4 large · Text description | **58.7%** |
| vs. IndexTTS-2.5 | **82.7%** |

### Other controls and benchmarks

- **Japanese benchmarks:** 4.80% CER on CV3-Eval, versus 5.30% for the original model rerun in the same environment. On the MiniMax Japanese set, CER is 3.33% and speaker similarity is 0.745.
- **Sighs:** an event recognizer detected 56 of 60 requests, or 93.3%.
- **Laughter:** an external event judge detected laughter in 44 of 59 evaluable clips, or 74.6%.
- **Whispering:** on 60 matched requests, inference guidance increased whisper detections from 4 to 32.
- **Kana readings:** 22 ambiguous words × 2 readings × 6 voices gave 264 outputs. Correct requested readings increased from 39.4% to **94.7%**. Success on both readings of the same word rose from 2.3% to 81.1%.

---

## Things to make with it

- **Character dialogue and audio stories:** keep a reference voice while choosing emotion, laughter and sighs for each line.
- **Voice agents and interactive fiction:** vary the tone and intensity of a reply with its context.
- **Games and fan projects:** use your own reference voice for character auditions, script rehearsals and temporary dialogue.
- **Controllable-speech research:** study tag adherence, intensity and the placement of vocal events with seven controls in one set of weights. The technical notes describe the evaluation conditions for comparison.

---

## Getting started

**Environment:** Linux, Python 3.12 and an NVIDIA GPU. We recommend at least 28 GB of free VRAM. The first run downloads roughly 11 GB for the Fish S2-Pro base.

```bash
python3.12 -m venv .venv && source .venv/bin/activate
pip install -U huggingface_hub
hf auth login  # Use an account with access to the model repository
hf download IrohaStudio/Iroha-TTS --local-dir Iroha-TTS
cd Iroha-TTS && pip install -r requirements.txt

python infer.py \
  --text "やっと会えたね！ずっと待ってたんだよ。" \
  --emotion joy --intensity -0.015 --seed 7 \
  --ref my_voice.wav --ref-text "参考音声の書き起こし" \
  --out joy.wav
```

Replace `my_voice.wav` and its transcript with your recording and an accurate transcript. The output is a 44.1 kHz WAV. Change `--seed` for another delivery.

The repository includes `AGENT_GUIDE.md` for coding agents, covering parameter combinations, batch calls and troubleshooting.

**Release scope:** model weights and inference code are included; training data and the training pipeline are not. The weights use the **Fish Audio Research License** (Copyright © 39 AI, INC.). Research and non-commercial use must follow its terms; **commercial use requires a separate license from Fish Audio** at business@fish.audio. Our new inference code (`emotts/` and `infer.py`) is also available under MIT. Refer to the repository’s license files for the full terms.

The [technical notes](/blog/research/en/) cover implementation and evaluation in more detail.

---

## Next

- More emotion and vocal-event tags.
- Intensity control in more tagged contexts.
- Qwen3-TTS, Ming-3.0-TTS and OmniVoice versions using the same training approach.
- A WebUI that can deploy different models.
- More listeners, with further analysis of agreement between human ratings and automatic metrics.

If you make something with Iroha or run into a problem, write to **ake.speechai@gmail.com**.
