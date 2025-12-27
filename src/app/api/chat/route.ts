import { NextRequest, NextResponse } from 'next/server';
import { chatWithGranddaddy } from '@/lib/ai/claude';

export async function POST(request: NextRequest) {
  try {
    // Get raw text and fix Netlify's incorrect escaping
    let rawBody = await request.text();

    // Netlify Edge Functions sometimes incorrectly escape special chars
    // Fix common escape sequences that aren't valid JSON
    rawBody = rawBody.replace(/\\!/g, '!');
    rawBody = rawBody.replace(/\\'/g, "'");
    rawBody = rawBody.replace(/\\@/g, '@');
    rawBody = rawBody.replace(/\\#/g, '#');
    rawBody = rawBody.replace(/\\$/g, '$');
    rawBody = rawBody.replace(/\\%/g, '%');
    rawBody = rawBody.replace(/\\&/g, '&');
    rawBody = rawBody.replace(/\\\?/g, '?');

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request', raw: rawBody.substring(0, 200) },
        { status: 400 }
      );
    }
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Chat API error:', errorMessage, error);
    return NextResponse.json(
      { error: 'Failed to get response from Granddaddy', details: errorMessage },
      { status: 500 }
    );
  }
}
