import { NextRequest, NextResponse } from 'next/server';
import { chatWithGranddaddy } from '@/lib/ai/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, currentStop, collectedSymbols, hintsUsed, teamName, chatHistory } = body;

    if (!message || !currentStop) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await chatWithGranddaddy({
      message,
      currentStop,
      collectedSymbols: collectedSymbols || [],
      hintsUsed: hintsUsed || 0,
      teamName: teamName || 'Treasure Hunters',
      chatHistory: chatHistory || [],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Granddaddy' },
      { status: 500 }
    );
  }
}
