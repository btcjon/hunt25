# Voice Cloning Learnings - Mac M2

## Summary

Tested local voice cloning on Mac M2 for Granddaddy's voice. **Chatterbox produced the best results** - XTTS v2 didn't capture the voice well despite being more popular.

---

## What We Tested

| Solution | Voice Match | Speed | Notes |
|----------|-------------|-------|-------|
| **Chatterbox** | Good | ~2 min | Best local option |
| XTTS v2 | Poor | ~23s | Didn't match voice |
| ElevenLabs | N/A | Fast | Already in production |

---

## Chatterbox Setup (Mac M2)

```bash
# Install
brew install ffmpeg libsndfile
pip install chatterbox-tts

# Generate
python3 -c "
from chatterbox.tts import ChatterboxTTS
import torchaudio

model = ChatterboxTTS.from_pretrained(device='mps')
wav = model.generate(
    text='Your text here',
    audio_prompt_path='voice_sample.wav'
)
torchaudio.save('output.wav', wav, model.sr)
"
```

---

## Voice Sample Requirements

- **Duration**: 10-30 seconds works best
- **Format**: WAV (convert M4A with ffmpeg)
- **Quality**: Clean audio, single speaker, no background noise

```bash
# Convert M4A to WAV
ffmpeg -i input.m4a -ar 22050 -ac 1 output.wav

# Extract 10s segment
ffmpeg -i input.m4a -ss 30 -t 10 -ar 22050 -ac 1 output.wav
```

---

## Generated Samples

Location: `docs/voice-samples/`

- `grandaddy_chatterbox.wav` - Short test
- `grandaddy_chatterbox_intro.wav` - Longer intro (best)
- `grandaddy_chatterbox_v2.wav` - Alt reference audio

---

## TODO

- [ ] Fine-tune Chatterbox parameters for better match
- [ ] Test with different audio segments
- [ ] Compare with ElevenLabs voice clone
- [ ] Consider training custom voice on VPS (GPU)

---

## Resources

- Chatterbox: https://github.com/resemble-ai/chatterbox
- XTTS v2: https://github.com/coqui-ai/TTS
- VPS Chatterbox: `http://5.161.192.198:4123`
