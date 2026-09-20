# Local AI Speech-to-Text & Transcription Engine

## Faster-Whisper Architecture

CaptionStudio uses **`faster-whisper`** (CTranslate2) for local speech-to-text.

### Why Faster-Whisper?
1. Up to **4x faster** than OpenAI's standard PyTorch Whisper implementation while consuming significantly less memory.
2. Direct 8-bit quantization (`compute_type="int8"`) on CPU without quality degradation.
3. Native support for word-level timestamps (`word_timestamps=True`) with voice activity detection (`vad_filter=True`).
4. Completely offline operation: models are downloaded once to `data/models` and executed without internet connectivity.

---

## Multilingual & Hinglish Support

The engine supports:
- **English** (`en`)
- **Hindi** (`hi`)
- **Gujarati** (`gu`)
- **Hinglish** (Spoken Hindi/English in Roman script)

### Hinglish Preservation Strategy
When speakers converse in Hinglish (e.g., *"Aaj hum confidence ke baare mein baat karenge"*), standard models sometimes mistakenly transliterate the output into Devanagari script. CaptionStudio uses targeted prompt priming:
```python
prompt = "Namaste, hello! Aaj hum baat karenge confidence and learning ke baare mein. Kem cho!"
```
This primes the decoder vocabulary to preserve Latin alphabet transliterations naturally without altering the speaker's original diction.

