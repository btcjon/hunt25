// Chatterbox TTS Client with Robust Mobile Audio Support
// Uses Granddaddy's actual cloned voice

const CHATTERBOX_API_URL = 'http://5.161.192.198:4123';

interface TTSOptions {
  text: string;
  voice?: string;
  exaggeration?: number;
  cfgWeight?: number;
  temperature?: number;
}

// Global audio state
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentHtmlAudio: HTMLAudioElement | null = null;
let isUnlocked = false;
let unlockPromise: Promise<void> | null = null;

// Get or create AudioContext
function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// Ensure AudioContext is resumed and ready
async function ensureAudioReady(): Promise<AudioContext> {
  const ctx = getAudioContext();

  if (ctx.state === 'suspended') {
    console.log('Resuming suspended AudioContext...');
    await ctx.resume();
    // Give iOS a moment
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return ctx;
}

// CRITICAL: Call this on first user tap to unlock audio for iOS
export function unlockAudioContext(): void {
  // Already unlocked or unlock in progress
  if (isUnlocked) return;
  if (unlockPromise) return;

  unlockPromise = (async () => {
    try {
      const ctx = getAudioContext();

      // Resume if suspended
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Play silent buffer to unlock
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      // Also create a silent HTML5 audio to unlock that path
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
      silentAudio.volume = 0;
      await silentAudio.play().catch(() => {});

      // Give iOS a moment to fully unlock
      await new Promise(resolve => setTimeout(resolve, 100));

      isUnlocked = true;
      console.log('Audio unlocked for mobile, context state:', ctx.state);
    } catch (e) {
      console.error('Failed to unlock audio:', e);
    }
  })();
}

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

// Retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export async function textToSpeech(options: TTSOptions): Promise<ArrayBuffer> {
  const {
    text,
    voice = 'granddaddy',
    exaggeration = 0.25,
    cfgWeight = 0.8,
    temperature = 0.3,
  } = options;

  console.log('Chatterbox TTS request:', { textLength: text.length, voice });

  return withRetry(async () => {
    const response = await fetchWithTimeout(
      `${CHATTERBOX_API_URL}/v1/audio/speech`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          voice,
          exaggeration,
          cfg_weight: cfgWeight,
          temperature,
        }),
      },
      60000 // 60 second timeout (Chatterbox is slower than ElevenLabs)
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chatterbox TTS error: ${error}`);
    }

    return response.arrayBuffer();
  }, 2, 1000); // 2 retries, 1s base delay
}

// Play audio with WebAudio (primary) or HTML5 Audio (fallback)
export async function playAudio(audioData: ArrayBuffer): Promise<void> {
  // Stop any currently playing audio
  stopAudio();

  // Wait for unlock to complete if in progress
  if (unlockPromise) {
    await unlockPromise;
  }

  // Try WebAudio API first
  try {
    const ctx = await ensureAudioReady();

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
        console.log('Playing via WebAudio API, context state:', ctx.state);
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
      // Convert ArrayBuffer to Blob URL (WAV format for Chatterbox)
      const blob = new Blob([audioData], { type: 'audio/wav' });
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

// Browser speech synthesis fallback
function speakWithBrowser(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not available'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
    console.log('Playing via browser speech synthesis (fallback)');
  });
}

// Combined speak function with retry and fallback
export async function speak(text: string, voice?: string): Promise<void> {
  console.log('speak() called, text length:', text.length);

  // Cancel any browser speech
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // Wait for unlock to complete
  if (unlockPromise) {
    console.log('Waiting for audio unlock...');
    await unlockPromise;
    console.log('Audio unlock complete');
  }

  try {
    console.log('Fetching Chatterbox TTS audio...');
    const audioData = await textToSpeech({ text, voice });
    console.log('Chatterbox audio received, size:', audioData.byteLength);
    await playAudio(audioData);
    console.log('Audio playback complete');
  } catch (error) {
    console.error('Chatterbox speak failed, trying browser fallback:', error);

    // Fallback to browser speech synthesis
    try {
      await speakWithBrowser(text);
    } catch (fallbackError) {
      console.error('Browser speech fallback also failed:', fallbackError);
      // Don't throw - at least the text is visible on screen
    }
  }
}

// Streaming version for lower latency
export async function speakStreaming(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  voice?: string
): Promise<void> {
  try {
    const audioData = await textToSpeech({ text, voice });
    onStart?.();
    await playAudio(audioData);
  } finally {
    onEnd?.();
  }
}
