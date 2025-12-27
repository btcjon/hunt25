import { NextRequest, NextResponse } from 'next/server';
import { verifyPhoto, getFollowUpQuestion } from '@/lib/ai/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photo, stopNumber, referenceImages } = body;

    if (!photo || !stopNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await verifyPhoto({
      photo,
      stopNumber,
      referenceImages: referenceImages || [],
    });

    // Add follow-up question only for low-confidence rejections
    if (!result.isCorrect && result.confidence >= 30 && result.confidence < 60) {
      const followUpQuestion = getFollowUpQuestion(stopNumber);
      return NextResponse.json({
        ...result,
        followUpQuestion,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json(
      { error: 'Failed to verify photo' },
      { status: 500 }
    );
  }
}
