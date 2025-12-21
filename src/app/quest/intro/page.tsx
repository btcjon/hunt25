'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { INTRO_DIALOG } from '@/lib/ai/granddaddy';
import { speak } from '@/lib/voice/elevenlabs';
import { speakFallback } from '@/lib/voice/webSpeech';
import Starfield from '@/components/game/Starfield';
import ReplayAudio from '@/components/game/ReplayAudio';

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
    <div className="relative min-h-screen flex flex-col items-center justify-between px-4 py-8 overflow-hidden">
      <Starfield />
      
      {/* Header */}
      <div className="relative z-10 text-center mt-4">
        <p className="text-star-gold text-sm tracking-[0.3em] font-sans uppercase mb-1">
          Welcome
        </p>
        <h2 className="text-3xl font-serif text-white">{teamName}</h2>
      </div>

      {/* Granddaddy Speaking */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {/* Avatar */}
        <div className="relative w-36 h-36 mb-8">
          <div className={`absolute inset-0 bg-star-gold/20 rounded-full blur-2xl transition-all duration-700 ${isSpeaking ? 'scale-110 opacity-60' : 'scale-100 opacity-20'}`}></div>
          <div className={`relative z-10 w-full h-full rounded-full border-2 border-star-gold/40 glass-indigo flex items-center justify-center text-7xl shadow-2xl transition-all duration-500 ${isSpeaking ? 'ring-4 ring-star-gold/30' : ''}`}>
            👴
          </div>
          {isSpeaking && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-star-gold text-midnight text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
              Speaking
            </div>
          )}
        </div>

        {/* Speech Bubble / Dialogue Card */}
        <div className="glass-indigo rounded-3xl p-8 shadow-glass w-full max-h-[45vh] overflow-y-auto border-white/5 scrollbar-hide">
          {paragraphs.slice(0, currentParagraph + 1).map((paragraph, index) => (
            <p
              key={index}
              className={`text-lg text-white/90 mb-6 last:mb-0 leading-relaxed font-sans ${index === currentParagraph ? 'animate-in fade-in slide-in-from-bottom-4 duration-1000' : ''}`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </main>

      {/* Buttons */}
      <div className="relative z-10 w-full max-w-md space-y-4 mb-4">
        {/* Replay Button */}
        <div className="flex justify-center mb-2">
          <ReplayAudio onReplay={speakIntro} isPlaying={isSpeaking} />
        </div>

        {isReady ? (
          <button
            onClick={handleStart}
            className="premium-button w-full py-6 text-xl tracking-widest uppercase rounded-2xl"
          >
            We&apos;re Ready, Granddaddy
          </button>
        ) : (
          <button
            onClick={handleSkip}
            className="w-full py-4 text-sm font-medium text-star-gold/70 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest"
          >
            Skip Intro
          </button>
        )}
      </div>
    </div>
  );
}
