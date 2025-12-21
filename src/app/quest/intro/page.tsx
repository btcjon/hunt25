'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { INTRO_DIALOG } from '@/lib/ai/granddaddy';
import { speak, stopAudio, unlockAudioContext } from '@/lib/voice/elevenlabs';
// Browser fallback removed - ElevenLabs only
import Starfield from '@/components/game/Starfield';
import ReplayAudio from '@/components/game/ReplayAudio';
import KaraokeText from '@/components/game/KaraokeText';

export default function IntroPage() {
  const router = useRouter();
  const { teamName, setSpeaking, isSpeaking, audioUnlocked, unlockAudio } = useGameStore();
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [showTapPrompt, setShowTapPrompt] = useState(true);

  // Split intro into paragraphs for display
  const paragraphs = INTRO_DIALOG.split('\n\n').filter(p => p.trim());

  const speakIntro = useCallback(async () => {
    setSpeaking(true);
    try {
      await speak(INTRO_DIALOG);
    } catch (error) {
      console.error('ElevenLabs failed:', error);
    } finally {
      setSpeaking(false);
    }
  }, [setSpeaking]);

  // Handle initial tap to unlock audio (required for mobile)
  const handleTapToStart = useCallback(() => {
    // CRITICAL: Unlock AudioContext immediately in gesture handler (iOS requirement)
    unlockAudioContext();
    unlockAudio();
    setShowTapPrompt(false);
    speakIntro();
  }, [unlockAudio, speakIntro]);

  // If already unlocked (returning to page), auto-play
  useEffect(() => {
    if (audioUnlocked) {
      setShowTapPrompt(false);
      const timer = setTimeout(() => speakIntro(), 500);
      return () => clearTimeout(timer);
    }
  }, [audioUnlocked, speakIntro]);

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
    stopAudio();
    setSpeaking(false);
    router.push('/quest/1');
  };

  const handleSkip = () => {
    stopAudio();
    setSpeaking(false);
    router.push('/quest/1');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between px-3 sm:px-4 py-4 sm:py-8 overflow-hidden">
      <Starfield />

      {/* Tap to Start Overlay - Required for mobile audio */}
      {showTapPrompt && !audioUnlocked && (
        <div
          className="fixed inset-0 z-50 bg-midnight/95 flex flex-col items-center justify-center cursor-pointer"
          onClick={handleTapToStart}
        >
          <div className="text-center px-8">
            <div className="text-6xl sm:text-8xl mb-6 animate-bounce">🔊</div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white mb-4">
              Tap to Begin
            </h2>
            <p className="text-white/60 text-sm sm:text-base mb-8">
              Granddaddy is ready to guide you!
            </p>
            <div className="inline-block px-8 py-4 bg-star-gold/20 border-2 border-star-gold rounded-full">
              <span className="text-star-gold font-bold tracking-widest uppercase text-sm">
                Tap Anywhere
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 text-center mt-2 sm:mt-4">
        <p className="text-star-gold text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] font-sans uppercase mb-1">
          Welcome
        </p>
        <h2 className="text-2xl sm:text-3xl font-serif text-white">{teamName}</h2>
      </div>

      {/* Granddaddy Speaking */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-md px-2">
        {/* Avatar */}
        <div className="relative w-36 h-36 sm:w-48 sm:h-48 mb-4 sm:mb-8">
          <div className={`absolute inset-0 bg-star-gold/20 rounded-full blur-2xl transition-all duration-700 ${isSpeaking ? 'scale-110 opacity-60' : 'scale-100 opacity-20'}`}></div>
          <div className={`relative z-10 w-full h-full rounded-full border-2 border-star-gold/40 overflow-hidden shadow-2xl transition-all duration-500 ${isSpeaking ? 'ring-4 ring-star-gold/30' : ''}`}>
            <img src="/granddaddy.png" alt="Granddaddy" className="w-full h-full object-cover" />
          </div>
          {isSpeaking && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 bg-star-gold text-midnight text-[9px] sm:text-[10px] font-bold px-3 sm:px-4 py-1 rounded-full tracking-widest uppercase whitespace-nowrap shadow-lg">
              Speaking
            </div>
          )}
        </div>

        {/* Speech Bubble / Dialogue Card */}
        <div className="glass-indigo rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-glass w-full border-white/5 overflow-hidden">
          {paragraphs.slice(0, currentParagraph + 1).map((paragraph, index) => (
            <p
              key={index}
              className={`text-base sm:text-lg mb-4 sm:mb-6 last:mb-0 leading-relaxed font-sans ${index === currentParagraph ? 'animate-in fade-in slide-in-from-bottom-4 duration-1000' : ''}`}
            >
              {index === currentParagraph && isSpeaking ? (
                <KaraokeText
                  text={paragraph}
                  isPlaying={isSpeaking}
                  wordsPerMinute={135}
                  highlightClassName="text-white"
                />
              ) : (
                <span className="text-white/90">{paragraph}</span>
              )}
            </p>
          ))}
        </div>
      </main>

      {/* Buttons */}
      <div className="relative z-10 w-full max-w-md space-y-3 sm:space-y-4 mb-2 sm:mb-4 px-2">
        {/* Replay Button */}
        <div className="flex justify-center mb-1 sm:mb-2">
          <ReplayAudio onReplay={speakIntro} isPlaying={isSpeaking} onStop={() => setSpeaking(false)} />
        </div>

        <button
          onClick={handleStart}
          className="premium-button w-full py-4 sm:py-6 text-lg sm:text-xl tracking-widest uppercase rounded-2xl"
        >
          We&apos;re Ready!
        </button>

        {isSpeaking && (
          <button
            onClick={handleSkip}
            className="w-full py-3 sm:py-4 text-xs sm:text-sm font-medium text-star-gold/70 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest"
          >
            Skip Intro
          </button>
        )}
      </div>
    </div>
  );
}
