'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { INTRO_DIALOG } from '@/lib/ai/granddaddy';
import { speak } from '@/lib/voice/elevenlabs';
import { speakFallback } from '@/lib/voice/webSpeech';

export default function IntroPage() {
  const router = useRouter();
  const { teamName, setSpeaking, isSpeaking } = useGameStore();
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Split intro into paragraphs for display
  const paragraphs = INTRO_DIALOG.split('\n\n').filter(p => p.trim());

  const speakIntro = useCallback(async () => {
    setSpeaking(true);
    try {
      // Try ElevenLabs first, fallback to browser TTS
      try {
        await speak(INTRO_DIALOG);
      } catch {
        console.log('ElevenLabs failed, using fallback TTS');
        await speakFallback(INTRO_DIALOG);
      }
    } finally {
      setSpeaking(false);
      setIsReady(true);
    }
  }, [setSpeaking]);

  useEffect(() => {
    // Auto-play intro when page loads
    const timer = setTimeout(() => {
      speakIntro();
    }, 500);

    return () => clearTimeout(timer);
  }, [speakIntro]);

  // Animate paragraphs appearing
  useEffect(() => {
    if (isSpeaking && currentParagraph < paragraphs.length - 1) {
      const timer = setTimeout(() => {
        setCurrentParagraph(prev => prev + 1);
      }, 3000); // Show new paragraph every 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isSpeaking, currentParagraph, paragraphs.length]);

  const handleStart = () => {
    router.push('/quest/1');
  };

  const handleSkip = () => {
    setSpeaking(false);
    router.push('/quest/1');
  };

  return (
    <div className="min-h-screen bg-[#FEFCE8] flex flex-col items-center justify-between px-4 py-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-lg text-[#64748B]">Welcome, {teamName}!</p>
      </div>

      {/* Granddaddy Speaking */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {/* Avatar */}
        <div className={`w-32 h-32 bg-[#F59E0B] rounded-full flex items-center justify-center text-6xl shadow-lg mb-6 ${isSpeaking ? 'animate-pulse' : ''}`}>
          👴
        </div>

        {/* Speech Bubble */}
        <div className="bg-white rounded-2xl p-6 shadow-lg w-full max-h-[50vh] overflow-y-auto">
          {paragraphs.slice(0, currentParagraph + 1).map((paragraph, index) => (
            <p
              key={index}
              className={`text-lg text-[#1E293B] mb-4 last:mb-0 ${index === currentParagraph ? 'animate-fade-in' : ''}`}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="mt-4 flex items-center gap-2 text-[#2563EB]">
            <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce delay-100" />
            <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce delay-200" />
            <span className="ml-2">Granddaddy is speaking...</span>
          </div>
        )}
      </main>

      {/* Buttons */}
      <div className="w-full max-w-md space-y-3">
        {isReady ? (
          <button
            onClick={handleStart}
            className="w-full py-4 text-xl font-bold text-white bg-[#10B981] rounded-xl shadow-lg hover:bg-[#059669] transition-all active:scale-95"
          >
            LET&apos;S GO! 🎯
          </button>
        ) : (
          <button
            onClick={handleSkip}
            className="w-full py-3 text-lg font-medium text-[#64748B] bg-white border-2 border-[#E2E8F0] rounded-xl hover:bg-[#F8FAFC] transition-all"
          >
            Skip Intro →
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>
    </div>
  );
}
