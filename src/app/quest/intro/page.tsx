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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-between px-4 py-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-xl text-sacred-blue font-lora">Welcome, {teamName}!</p>
      </div>

      {/* Granddaddy Speaking */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {/* Avatar */}
        <div className={`w-36 h-36 bg-gradient-to-br from-candlelight to-amber-600 rounded-full flex items-center justify-center text-7xl shadow-xl mb-6 ${isSpeaking ? 'animate-pulse ring-4 ring-sacred-gold/30' : ''}`}>
          👴
        </div>

        {/* Speech Bubble */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl w-full max-h-[50vh] overflow-y-auto border-2 border-sacred-gold/20">
          {paragraphs.slice(0, currentParagraph + 1).map((paragraph, index) => (
            <p
              key={index}
              className={`text-lg text-sacred-blue mb-4 last:mb-0 leading-relaxed ${index === currentParagraph ? 'animate-fade-in' : ''}`}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="mt-4 flex items-center gap-2 text-candlelight">
            <span className="w-2 h-2 bg-candlelight rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-candlelight rounded-full animate-bounce delay-100" />
            <span className="w-2 h-2 bg-candlelight rounded-full animate-bounce delay-200" />
            <span className="ml-2 font-lora">Granddaddy is speaking...</span>
          </div>
        )}
      </main>

      {/* Buttons */}
      <div className="w-full max-w-md space-y-3">
        {isReady ? (
          <button
            onClick={handleStart}
            className="w-full py-5 text-2xl font-bold text-white bg-sacred-blue rounded-xl shadow-lg hover:bg-blue-900 transition-all active:scale-95"
          >
            WE&apos;RE ALL READY! 🎯
          </button>
        ) : (
          <button
            onClick={handleSkip}
            className="w-full py-3 text-lg font-medium text-sacred-blue bg-white border-2 border-sacred-gold/30 rounded-xl hover:bg-amber-50 transition-all"
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
