# Voice Cloning Setup for Mac M2 (Apple Silicon)

## Overview

This guide covers setting up local voice cloning on Mac M2 using **XTTS v2 (Coqui)** with Metal/MPS acceleration. Also includes Chatterbox as an alternative.

**Why XTTS v2?**
- Native Metal/MPS support (6-8x speedup over CPU)
- Zero-shot voice cloning with <10 second audio sample
- Active community, well-documented
- 17 language support

---

## Prerequisites

- **Hardware:** Mac M2/M1/M3 (Apple Silicon)
- **Python:** 3.10+ (tested with 3.11)
- **Storage:** ~3GB for model download
- **Audio sample:** 6-10 seconds of clean speech (your target voice)
  - WAV format preferred
  - No background music/noise
  - Natural conversational tone

---

## Option 1: XTTS v2 (Coqui) - RECOMMENDED

### 1.1 Verify MPS Availability

```bash
python3 -c "import torch; print(f'MPS: {torch.backends.mps.is_available()}')"
# Should print: MPS: True
```

If PyTorch isn't installed or MPS is False:
```bash
pip3 install torch torchvision torchaudio
```

### 1.2 Install XTTS v2

```bash
pip3 install coqui-tts
```

### 1.3 Quick Test

```python
from TTS.api import TTS
import torch

# Check device
device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"Using device: {device}")

# Load model (downloads ~3GB on first run)
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

# Generate speech (without cloning - uses default voice)
tts.tts_to_file(
    text="Hello, this is a test of XTTS on Mac M2.",
    file_path="test_output.wav",
    language="en"
)
print("Generated: test_output.wav")
```

### 1.4 Voice Cloning

```python
from TTS.api import TTS
import torch

device = "mps" if torch.backends.mps.is_available() else "cpu"
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

# Clone voice from sample
tts.tts_to_file(
    text="Hello, this is my cloned voice speaking.",
    file_path="cloned_output.wav",
    speaker_wav="my_voice_sample.wav",  # 6-10 seconds of your voice
    language="en"
)
```

**Voice Sample Tips:**
- 6-10 seconds is optimal (more isn't always better)
- Single speaker, consistent tone
- WAV format, 22kHz+ sample rate
- Clear articulation, no whispering/singing

---

## Option 2: Chatterbox Local

Alternative option - same model as our VPS but runs locally.

### 2.1 Install Prerequisites

```bash
brew install ffmpeg libsndfile
```

### 2.2 Create Virtual Environment

```bash
python3.11 -m venv ~/chatterbox-venv
source ~/chatterbox-venv/bin/activate
pip install chatterbox-tts
```

### 2.3 Basic Usage

```python
from chatterbox.tts import ChatterboxTTS

model = ChatterboxTTS.from_pretrained(device="mps")

# Text to speech with voice cloning
audio = model.generate(
    text="Hello, this is Chatterbox on Mac M2.",
    audio_prompt_path="voice_sample.wav"
)

# Save output
import torchaudio
torchaudio.save("output.wav", audio, 24000)
```

**Note:** Some users report MPS compatibility issues with Chatterbox. Falls back to CPU if problems occur.

---

## Option 3: Chatterbox VPS (Already Set Up)

For production use, we have Chatterbox running on VPS:

**API Endpoint:** `http://5.161.192.198:4123`

```python
# Via MCP tool
chatterbox_generate({
    text="Hello, this is the VPS voice.",
    voice="voice-v1",
    output_path="/tmp/output.wav"
})
```

**Pros:** No local compute, 1-3s latency, already configured
**Cons:** Requires network, can't fine-tune

---

## Troubleshooting

### MPS Not Available

```bash
# Check PyTorch version
python3 -c "import torch; print(torch.__version__)"

# Should be 2.0+. If not:
pip3 install --upgrade torch torchvision torchaudio
```

### Out of Memory

XTTS v2 needs ~3GB RAM. Close other apps or use CPU fallback:
```python
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to("cpu")
```

### Audio Quality Issues

1. Check source audio (must be clean, single speaker)
2. Try different sample lengths (6-10s optimal)
3. Adjust inference parameters:

```python
# For XTTS - more control via direct API
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

config = XttsConfig()
model = Xtts.init_from_config(config)
model.load_checkpoint(config, checkpoint_dir="path/to/model")

outputs = model.inference(
    text="Hello world",
    gpt_cond_latent=speaker_embedding,
    speaker_embedding=speaker_embedding,
    temperature=0.7,  # Higher = more variation
    top_k=50,
    top_p=0.85
)
```

### Slow First Run

Model downloads ~3GB on first use. Subsequent runs use cached model at:
- Linux/Mac: `~/.local/share/tts/`

---

## Performance Comparison

| Solution | Device | Speed | Voice Sample | Quality |
|----------|--------|-------|--------------|---------|
| XTTS v2 | MPS | ~0.4x realtime* | 6-10s | Excellent |
| XTTS v2 | CPU | ~0.1x realtime | 6-10s | Excellent |
| Chatterbox Local | MPS/CPU | ~0.3-0.5x realtime | 10-30s | Very Good |
| Chatterbox VPS | Remote | 1-3s total | Pre-trained | Very Good |
| ElevenLabs | API | 75-300ms | 2-3min | Excellent |

*Tested on Mac M2: 23s to generate 10s of audio

---

## Quick Reference

```bash
# Verify MPS
python3 -c "import torch; print(torch.backends.mps.is_available())"

# Install XTTS
pip3 install coqui-tts

# Test voice cloning
python3 << 'EOF'
from TTS.api import TTS
import torch

device = "mps" if torch.backends.mps.is_available() else "cpu"
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

tts.tts_to_file(
    text="Testing voice cloning on Mac M2.",
    file_path="output.wav",
    speaker_wav="sample.wav",
    language="en"
)
print("Done: output.wav")
EOF
```

---

## Next Steps

1. Record 6-10 second voice sample
2. Run voice cloning test
3. Integrate into app (see `src/lib/voice/` for existing TTS code)
4. Consider fine-tuning for specific voice characteristics

---

## References

- [XTTS v2 Documentation](https://docs.coqui.ai/en/latest/models/xtts.html)
- [Coqui TTS GitHub](https://github.com/coqui-ai/TTS)
- [Chatterbox GitHub](https://github.com/resemble-ai/chatterbox)
- [PyTorch MPS Documentation](https://pytorch.org/docs/stable/notes/mps.html)
