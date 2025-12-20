// Claude AI Client for Chat and Vision
import Anthropic from '@anthropic-ai/sdk';
import { getGranddaddySystemPrompt, getVerificationSystemPrompt } from './granddaddy';
import { CLUES } from '../game/clues';

// Initialize Anthropic client (server-side only)
function getClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

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
}

// Chat with Granddaddy
export async function chatWithGranddaddy(options: ChatOptions): Promise<ChatResponse> {
  const { message, currentStop, collectedSymbols, hintsUsed, teamName, chatHistory = [] } = options;

  const client = getClient();

  const systemPrompt = getGranddaddySystemPrompt({
    currentStop,
    collectedSymbols,
    hintsUsed,
    teamName,
  });

  // Convert chat history to Anthropic format
  const messages: Anthropic.MessageParam[] = chatHistory.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));

  // Add the current message
  messages.push({
    role: 'user',
    content: message,
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150, // Keep responses short for TTS
    system: systemPrompt,
    messages,
  });

  const textContent = response.content.find((c) => c.type === 'text');
  const responseText = textContent?.type === 'text' ? textContent.text : "I couldn't quite understand that. Can you try again?";

  // Check if response suggests taking a photo
  const shouldTriggerPhoto = /photo|picture|snap|camera|show me|let me see/i.test(message);

  return {
    response: responseText,
    shouldTriggerPhoto,
  };
}

interface VerifyPhotoOptions {
  photo: string; // Base64 encoded image
  stopNumber: number;
  referenceImages?: string[]; // Base64 encoded reference images
}

interface VerificationResult {
  matches: string[];
  confidence: number;
  isCorrect: boolean;
  granddaddyResponse: string;
}

// Verify photo with Claude Vision
export async function verifyPhoto(options: VerifyPhotoOptions): Promise<VerificationResult> {
  const { photo, stopNumber, referenceImages = [] } = options;

  const client = getClient();
  const systemPrompt = getVerificationSystemPrompt(stopNumber);

  // Build content array with reference images + kid's photo
  const content: Anthropic.ContentBlockParam[] = [];

  // Add reference images if provided
  for (let i = 0; i < referenceImages.length; i++) {
    content.push({
      type: 'text',
      text: `Reference image ${i + 1} for Stop ${stopNumber}:`,
    });
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: referenceImages[i],
      },
    });
  }

  // Add the kid's photo
  content.push({
    type: 'text',
    text: "Now here's the photo the kids just took. Compare it to the reference images and visual identifiers:",
  });
  content.push({
    type: 'image',
    source: {
      type: 'base64',
      media_type: 'image/jpeg',
      data: photo,
    },
  });

  content.push({
    type: 'text',
    text: 'Analyze this photo and respond with JSON as specified in the system prompt.',
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  const responseText = textContent?.type === 'text' ? textContent.text : '';

  // Parse JSON response
  try {
    // Extract JSON from response (might be wrapped in markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as VerificationResult;
      return result;
    }
  } catch (error) {
    console.error('Failed to parse verification response:', error);
  }

  // Fallback response
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
  // Random question from the pool
  const randomIndex = Math.floor(Math.random() * clue.followUpQuestions.length);
  return clue.followUpQuestions[randomIndex];
}
