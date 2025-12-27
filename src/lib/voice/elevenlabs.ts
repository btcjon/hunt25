// ElevenLabs TTS Client with Cached Audio Support

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
  baseDelayMs: number = 500
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
    voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'JoYo65swyP8hH6fVMeTO',
    modelId = 'eleven_turbo_v2_5',
    stability = 0.4,
    similarityBoost = 0.85,
    style = 0.7,
  } = options;

  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
  console.log('TTS request:', { textLength: text.length, voiceId, hasApiKey: !!apiKey });

  return withRetry(async () => {
    const response = await fetchWithTimeout(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
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
      },
      15000 // 15 second timeout
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs TTS error: ${error}`);
    }

    return response.arrayBuffer();
  }, 2, 500);
}

// Play audio with HTML5 Audio (simpler and more reliable for cached files)
export async function playAudioFromUrl(url: string): Promise<void> {
  stopAudio();

  if (unlockPromise) {
    await unlockPromise;
  }

  return new Promise((resolve, reject) => {
    try {
      currentHtmlAudio = new Audio(url);
      currentHtmlAudio.volume = 1.0;

      currentHtmlAudio.onended = () => {
        currentHtmlAudio = null;
        resolve();
      };

      currentHtmlAudio.onerror = (e) => {
        currentHtmlAudio = null;
        reject(e);
      };

      currentHtmlAudio.play()
        .then(() => console.log('Playing cached audio:', url))
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

// Play audio with WebAudio (primary) or HTML5 Audio (fallback)
export async function playAudio(audioData: ArrayBuffer): Promise<void> {
  stopAudio();

  if (unlockPromise) {
    await unlockPromise;
  }

  // Try WebAudio API first
  try {
    const ctx = await ensureAudioReady();
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
    return playWithHtmlAudio(audioData);
  }
}

// HTML5 Audio fallback
async function playWithHtmlAudio(audioData: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
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
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // Already stopped
    }
    currentSource = null;
  }

  if (currentHtmlAudio) {
    try {
      currentHtmlAudio.pause();
      currentHtmlAudio.currentTime = 0;
    } catch {
      // Already stopped
    }
    currentHtmlAudio = null;
  }

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

// ============ CACHED AUDIO SUPPORT ============

// Check if cached audio file exists by trying to fetch it
async function checkCachedAudioExists(filename: string): Promise<boolean> {
  try {
    const response = await fetch(`/audio/${filename}`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Speak using cached audio file with API fallback
export async function speakCached(filename: string, fallbackText: string): Promise<void> {
  console.log(`speakCached() called: ${filename}`);

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  if (unlockPromise) {
    await unlockPromise;
  }

  // Try cached audio first
  try {
    const exists = await checkCachedAudioExists(filename);
    if (exists) {
      console.log(`Playing cached audio: /audio/${filename}`);
      await playAudioFromUrl(`/audio/${filename}`);
      return;
    }
    console.log(`Cached audio not found: ${filename}, falling back to API`);
  } catch (err) {
    console.warn('Error checking cached audio:', err);
  }

  // Fall back to API generation
  try {
    const audioData = await textToSpeech({ text: fallbackText });
    await playAudio(audioData);
  } catch (error) {
    console.error('TTS failed, trying browser fallback:', error);
    try {
      await speakWithBrowser(fallbackText);
    } catch (fallbackError) {
      console.error('Browser speech fallback also failed:', fallbackError);
    }
  }
}

// Convenience functions for specific cached audio

export async function speakIntro(): Promise<void> {
  const INTRO_TEXT = `Well hello there, Bennett family treasure hunters! It's your Granddaddy!

Tonight's the night for a RACE so grand,
Two teams of seekers across this land!
Team ONE: Mackenzie, Ivy, and Michael too—
Team TWO: Braxton, Ben, and Juniper crew!

Long ago, Wise Men followed a STAR so bright,
Through desert and darkness, day and night.
Now YOU will race through clues galore,
Eight treasures to find — who'll find them before?

Here's how it works, so listen up tight:
Read each clue, then search left and right!
When you think you've found the right spot,
Use GPS or snap a photo — give it a shot!

Your TIMER starts now and won't stop ticking,
So move those feet — no lollygagging or picking!
The clock is watching every move you make,
First team home wins — for Christmas's sake!

If you're confused or need a little light,
Just tap "Ask Granddaddy" — I'll help you get it right!
But here's the secret, the key to success:
Work as a TEAM — no solo, no less!

Listen to each other, share what you see,
Work together closely — that's the key!
The youngest might spot what the oldest missed,
So keep your eyes open — nothing dismissed!

Now when you're ready, tap to begin,
The star is rising — may the best team win!
Race through the clues, then hurry back home,
First one to check in claims the Christmas throne!`;

  await speakCached('intro.mp3', INTRO_TEXT);
}

export async function speakClue(stopNumber: number, clueVerse: string, scripture: string, scriptureText: string): Promise<void> {
  const fullText = `${clueVerse} ... ${scripture} says: "${scriptureText}"`;
  await speakCached(`clue-${stopNumber}.mp3`, fullText);
}

export async function speakCelebration(stopNumber: number, message: string, clueName: string, scripture: string, scriptureText: string): Promise<void> {
  const fullText = `${message} You found ${clueName}! ${scripture} says: "${scriptureText}"`;
  await speakCached(`celebration-${stopNumber}.mp3`, fullText);
}

export async function speakFinale(): Promise<void> {
  const FINALE_TEXT = `"You followed the STAR when it first caught your eye,
You made the great JOURNEY beneath the wide sky,
Followed MARY and JOSEPH, patient and true,
GIFTS and the LITTLE TOWN waiting for you,
The ANGEL who sang and the INN with a light,
The CLOCK, God's perfect timing that holy night—

But what was it all for? Why travel so far?
Why follow the trail of that very first star?

BACK TO HOME BASE—your quest almost done!
The answer is waiting: GOD'S ONLY SON!" ... Luke 2:11 says: "Unto you is born this day in the city of David a Savior, who is Christ the Lord."`;

  await speakCached('finale.mp3', FINALE_TEXT);
}

// Generic speak function - uses API directly (for dynamic responses like chat)
export async function speak(text: string, voiceId?: string): Promise<void> {
  console.log('speak() called, text length:', text.length);

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  if (unlockPromise) {
    await unlockPromise;
  }

  try {
    const audioData = await textToSpeech({ text, voiceId });
    await playAudio(audioData);
  } catch (error) {
    console.error('ElevenLabs speak failed, trying browser fallback:', error);
    try {
      await speakWithBrowser(text);
    } catch (fallbackError) {
      console.error('Browser speech fallback also failed:', fallbackError);
    }
  }
}
