// AI Client for Chat and Vision - Routes through CLIProxyAPI
import { getGranddaddySystemPrompt, getVerificationSystemPrompt } from './granddaddy';
import { CLUES } from '../game/clues';

// CLIProxyAPI via HTTPS (Gemini respects system prompts)
const PROXY_URL = 'https://llm-proxy.genr8ive.ai/v1/chat/completions';
const MODEL = 'gemini-2.5-flash';

interface ChatOptions {
  message: string;
  currentStop: number;
  collectedSymbols: string[];
  hintsUsed: number;
  teamName: string;
  chatHistory?: Array<{ role: 'user' | 'granddaddy'; content: string }>;
}

interface ChatResponse {
  response: string;
  shouldTriggerPhoto?: boolean;
  matchCount?: number;
  shouldUnlock?: boolean;
}

// Chat with Granddaddy
export async function chatWithGranddaddy(options: ChatOptions): Promise<ChatResponse> {
  const { message, currentStop, collectedSymbols, hintsUsed, teamName, chatHistory = [] } = options;

  const systemPrompt = getGranddaddySystemPrompt({
    currentStop,
    collectedSymbols,
    hintsUsed,
    teamName,
  });

  // Build messages array
  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API ${response.status}: ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  let responseText = data.choices?.[0]?.message?.content || "I couldn't quite understand that. Can you try again?";

  // Parse match count from response (format: <!--MATCH:N-->)
  let matchCount = 0;
  const matchRegex = /<!--MATCH:(\d+)-->/;
  const matchResult = responseText.match(matchRegex);
  if (matchResult) {
    matchCount = parseInt(matchResult[1], 10);
    responseText = responseText.replace(matchRegex, '').trim();
  }

  // Check if response suggests taking a photo
  const shouldTriggerPhoto = /photo|picture|snap|camera|show me|let me see/i.test(message);

  // Unlock if 2+ identifiers matched
  const shouldUnlock = matchCount >= 2;

  return {
    response: responseText,
    shouldTriggerPhoto,
    matchCount,
    shouldUnlock,
  };
}

interface VerifyPhotoOptions {
  photo: string;
  stopNumber: number;
  referenceImages?: string[];
}

interface VerificationResult {
  matches: string[];
  confidence: number;
  isCorrect: boolean;
  granddaddyResponse: string;
}

// Verify photo with Vision model
export async function verifyPhoto(options: VerifyPhotoOptions): Promise<VerificationResult> {
  const { photo, stopNumber, referenceImages = [] } = options;

  const systemPrompt = getVerificationSystemPrompt(stopNumber);

  // Build content with images
  const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

  for (let i = 0; i < referenceImages.length; i++) {
    contentParts.push({ type: 'text', text: `Reference image ${i + 1} for Stop ${stopNumber}:` });
    contentParts.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${referenceImages[i]}` },
    });
  }

  contentParts.push({
    type: 'text',
    text: "Now here's the photo the kids just took:",
  });
  contentParts.push({
    type: 'image_url',
    image_url: { url: `data:image/jpeg;base64,${photo}` },
  });

  contentParts.push({
    type: 'text',
    text: 'Analyze this photo and respond with JSON as specified.',
  });

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentParts },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API ${response.status}: ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as VerificationResult;
    }
  } catch (error) {
    console.error('Failed to parse verification response:', error);
  }

  return {
    matches: [],
    confidence: 0,
    isCorrect: false,
    granddaddyResponse: "Hmm, I'm having trouble seeing that photo. Can you try taking another one?",
  };
}

// Get follow-up question for partial matches
export function getFollowUpQuestion(stopNumber: number): string {
  const clue = CLUES[stopNumber - 1];
  if (!clue?.followUpQuestions?.length) {
    return "Tell me what you see around you!";
  }
  const randomIndex = Math.floor(Math.random() * clue.followUpQuestions.length);
  return clue.followUpQuestions[randomIndex];
}
