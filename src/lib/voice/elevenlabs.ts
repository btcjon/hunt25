// ElevenLabs TTS Client with Robust Mobile Audio Support

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

interface TTSOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
}

// Global audio state
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentHtmlAudio: HTMLAudioElement | null = null;
let isUnlocked = false;

// Get or create AudioContext
function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// CRITICAL: Call this on first user tap to unlock audio for iOS
export function unlockAudioContext(): void {
  if (isUnlocked) return;

  try {
    const ctx = getAudioContext();

    // Play silent buffer to unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    // Resume if suspended
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        console.log('AudioContext resumed via unlock');
      });
    }

    // Also create a silent HTML5 audio to unlock that path
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
    silentAudio.volume = 0;
    silentAudio.play().catch(() => {});

    isUnlocked = true;
    console.log('Audio unlocked for mobile, context state:', ctx.state);
  } catch (e) {
    console.error('Failed to unlock audio:', e);
  }
}

export async function textToSpeech(options: TTSOptions): Promise<ArrayBuffer> {
  const {
    text,
    voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || '245u2NGJdh44gV9eWM9n',
    modelId = 'eleven_turbo_v2_5',
    stability = 0.4,
    similarityBoost = 0.85,
    style = 0.7,
  } = options;

  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
        style,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS error: ${error}`);
  }

  return response.arrayBuffer();
}

// Play audio with WebAudio (primary) or HTML5 Audio (fallback)
export async function playAudio(audioData: ArrayBuffer): Promise<void> {
  // Stop any currently playing audio
  stopAudio();

  // Try WebAudio API first
  try {
    const ctx = getAudioContext();

    // Resume if suspended
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Decode audio data (need to clone buffer as it gets detached)
    const audioBuffer = await ctx.decodeAudioData(audioData.slice(0));

    currentSource = ctx.createBufferSource();
    currentSource.buffer = audioBuffer;
    currentSource.connect(ctx.destination);

    return new Promise((resolve) => {
      if (currentSource) {
        currentSource.onended = () => {
          currentSource = null;
          resolve();
        };
        currentSource.start(0);
        console.log('Playing via WebAudio API');
      } else {
        resolve();
      }
    });
  } catch (webAudioError) {
    console.warn('WebAudio failed, trying HTML5 Audio fallback:', webAudioError);

    // Fallback to HTML5 Audio
    return playWithHtmlAudio(audioData);
  }
}

// HTML5 Audio fallback for problematic browsers
async function playWithHtmlAudio(audioData: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Convert ArrayBuffer to Blob URL
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      currentHtmlAudio = new Audio(url);
      currentHtmlAudio.volume = 1.0;

      currentHtmlAudio.onended = () => {
        URL.revokeObjectURL(url);
        currentHtmlAudio = null;
        resolve();
      };

      currentHtmlAudio.onerror = (e) => {
        URL.revokeObjectURL(url);
        currentHtmlAudio = null;
        reject(e);
      };

      currentHtmlAudio.play()
        .then(() => console.log('Playing via HTML5 Audio'))
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

// Stop currently playing audio
export function stopAudio(): void {
  // Stop WebAudio source
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // Already stopped
    }
    currentSource = null;
  }

  // Stop HTML5 audio
  if (currentHtmlAudio) {
    try {
      currentHtmlAudio.pause();
      currentHtmlAudio.currentTime = 0;
    } catch {
      // Already stopped
    }
    currentHtmlAudio = null;
  }

  // Cancel browser speech synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Check if audio is currently playing
export function isAudioPlaying(): boolean {
  return currentSource !== null || (currentHtmlAudio !== null && !currentHtmlAudio.paused);
}

// Combined speak function with retry
export async function speak(text: string, voiceId?: string): Promise<void> {
  // Cancel any browser speech
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  try {
    const audioData = await textToSpeech({ text, voiceId });
    await playAudio(audioData);
  } catch (error) {
    console.error('ElevenLabs speak failed:', error);
    throw error;
  }
}

// Streaming version for lower latency
export async function speakStreaming(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  voiceId?: string
): Promise<void> {
  try {
    const audioData = await textToSpeech({ text, voiceId });
    onStart?.();
    await playAudio(audioData);
  } finally {
    onEnd?.();
  }
}
