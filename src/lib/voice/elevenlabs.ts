// ElevenLabs TTS Client

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

interface TTSOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export async function textToSpeech(options: TTSOptions): Promise<ArrayBuffer> {
  const {
    text,
    voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'JoYo65swyP8hH6fVMeTO', // Granddaddy voice
    modelId = 'eleven_turbo_v2_5',
    stability = 0.5,
    similarityBoost = 0.75,
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
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS error: ${error}`);
  }

  return response.arrayBuffer();
}

// Play audio from ArrayBuffer
export async function playAudio(audioData: ArrayBuffer): Promise<void> {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(audioData);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);

  return new Promise((resolve) => {
    source.onended = () => resolve();
    source.start(0);
  });
}

// Combined speak function
export async function speak(text: string, voiceId?: string): Promise<void> {
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
