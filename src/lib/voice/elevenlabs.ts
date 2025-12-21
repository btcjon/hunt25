// ElevenLabs TTS Client with Stop Support

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

interface TTSOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
}

// Global audio controller for stop functionality
let currentAudioContext: AudioContext | null = null;
let currentAudioSource: AudioBufferSourceNode | null = null;
let audioUnlockedByGesture = false;

// Call this immediately on user tap to unlock audio for iOS
export function unlockAudioContext(): void {
  if (audioUnlockedByGesture) return;

  try {
    // Create and immediately resume AudioContext on user gesture
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Play a silent buffer to fully unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    // Resume if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    audioUnlockedByGesture = true;
    console.log('Audio unlocked for mobile');
  } catch (e) {
    console.error('Failed to unlock audio:', e);
  }
}

export async function textToSpeech(options: TTSOptions): Promise<ArrayBuffer> {
  const {
    text,
    voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || '245u2NGJdh44gV9eWM9n', // Granddaddy voice
    modelId = 'eleven_turbo_v2_5', // ~75ms latency, 50% cheaper
    stability = 0.4, // Lower for expressive adventure narration
    similarityBoost = 0.85, // High for custom clone fidelity
    style = 0.7, // Style exaggeration for theatrical delivery
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

// Play audio from ArrayBuffer with stop support
export async function playAudio(audioData: ArrayBuffer): Promise<void> {
  // Stop any currently playing audio
  stopAudio();

  currentAudioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

  // Mobile browsers require resuming AudioContext after user interaction
  if (currentAudioContext.state === 'suspended') {
    await currentAudioContext.resume();
  }

  const audioBuffer = await currentAudioContext.decodeAudioData(audioData);

  currentAudioSource = currentAudioContext.createBufferSource();
  currentAudioSource.buffer = audioBuffer;
  currentAudioSource.connect(currentAudioContext.destination);

  return new Promise((resolve) => {
    if (currentAudioSource) {
      currentAudioSource.onended = () => {
        currentAudioSource = null;
        resolve();
      };
      currentAudioSource.start(0);
    } else {
      resolve();
    }
  });
}

// Stop currently playing audio
export function stopAudio(): void {
  // Stop ElevenLabs audio
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
    } catch {
      // Already stopped
    }
    currentAudioSource = null;
  }
  if (currentAudioContext) {
    try {
      currentAudioContext.close();
    } catch {
      // Already closed
    }
    currentAudioContext = null;
  }
  // Also cancel any browser speech
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Check if audio is currently playing
export function isAudioPlaying(): boolean {
  return currentAudioSource !== null;
}

// Combined speak function
export async function speak(text: string, voiceId?: string): Promise<void> {
  // Cancel any browser speech before ElevenLabs plays
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  const audioData = await textToSpeech({ text, voiceId });
  await playAudio(audioData);
}

// Streaming version for lower latency
export async function speakStreaming(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  voiceId?: string
): Promise<void> {
  const audioData = await textToSpeech({ text, voiceId });

  onStart?.();
  await playAudio(audioData);
  onEnd?.();
}
