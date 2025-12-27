'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGameStore } from '@/lib/game/state';
import { INTRO_DIALOG } from '@/lib/ai/granddaddy';
import { speakIntro, stopAudio, unlockAudioContext } from '@/lib/voice/elevenlabs';
import Starfield from '@/components/game/Starfield';
import ElapsedTimer from '@/components/game/ElapsedTimer';

export default function IntroPage() {
  const router = useRouter();
  const { teamName, setSpeaking, isSpeaking, audioUnlocked, unlockAudio, recordQuestStart } = useGameStore();
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [showTapPrompt, setShowTapPrompt] = useState(!audioUnlocked);
  const [audioError, setAudioError] = useState(false);
  const hasStartedRef = useRef(false);

  // Split intro into paragraphs for display
  const paragraphs = INTRO_DIALOG.split('\n\n').filter(p => p.trim());

  const playIntroAudio = useCallback(async (forceRetry = false) => {
    if (hasStartedRef.current && !forceRetry) return; // Prevent double-play
    hasStartedRef.current = true;
    setAudioError(false);
    setSpeaking(true);
    try {
      console.log('Playing intro audio...');
      await speakIntro();
      console.log('Intro audio completed');
    } catch (error) {
      console.error('Intro audio failed:', error);
      setAudioError(true);
      hasStartedRef.current = false; // Allow retry on error
    } finally {
      setSpeaking(false);
    }
  }, [setSpeaking]);

  // Handle initial tap to unlock audio AND start playing (required for mobile)
  const handleTapToStart = useCallback(() => {
    // CRITICAL: Unlock AudioContext immediately in gesture handler (iOS requirement)
    unlockAudioContext();
    unlockAudio();
    recordQuestStart(); // Start the race timer!
    setShowTapPrompt(false);
    // Start playing Granddaddy's intro
    playIntroAudio();
  }, [unlockAudio, recordQuestStart, playIntroAudio]);

  // If already unlocked (returning to page), just hide the prompt
  useEffect(() => {
    if (audioUnlocked) {
      setShowTapPrompt(false);
    }
  }, [audioUnlocked]);

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

  return (
    <div className="relative min-h-screen flex flex-col items-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
      <Starfield />

      {/* Tap to Start Overlay - Required for mobile audio */}
      {showTapPrompt && !audioUnlocked && (
        <div
          className="fixed inset-0 z-50 bg-white/95 flex flex-col items-center justify-center cursor-pointer"
          onClick={handleTapToStart}
        >
          <div className="text-center px-8">
            <div className="text-6xl sm:text-8xl mb-6 animate-bounce">🔊</div>
            <h2 className="text-2xl sm:text-3xl font-serif text-slate-800 mb-4">
              Tap to Begin
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mb-8">
              Granddaddy is ready to guide you!
            </p>
            <div className="inline-block px-8 py-4 bg-amber-100 border-2 border-amber-600 rounded-full">
              <span className="text-amber-800 font-bold tracking-widest uppercase text-sm">
                Tap Anywhere
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 text-center mt-2 sm:mt-4">
        <div className="flex justify-center mb-2">
          <ElapsedTimer />
        </div>
        <p className="text-amber-700 text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] font-sans uppercase mb-1">
          Welcome
        </p>
        <h2 className="text-2xl sm:text-3xl font-serif text-slate-800">{teamName}</h2>
      </div>

      {/* Granddaddy Speaking */}
      <main className="relative z-10 flex flex-col items-center w-full max-w-md px-2 my-4">
        {/* Avatar */}
        <div className="relative w-28 h-28 sm:w-48 sm:h-48 mb-4 sm:mb-8 flex-shrink-0">
          <div className={`absolute inset-0 bg-amber-200/30 rounded-full blur-2xl transition-all duration-700 ${isSpeaking ? 'scale-110 opacity-60' : 'scale-100 opacity-20'}`}></div>
          <div className={`relative z-10 w-full h-full rounded-full border-2 border-amber-400/60 overflow-hidden shadow-2xl transition-all duration-500 ${isSpeaking ? 'ring-4 ring-amber-400/40' : ''}`}>
            <Image src="/granddaddy.webp" alt="Granddaddy" fill className="object-cover" priority />
          </div>
          {isSpeaking && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 bg-amber-600 text-white text-[9px] sm:text-[10px] font-bold px-3 sm:px-4 py-1 rounded-full tracking-widest uppercase whitespace-nowrap shadow-lg">
              Speaking
            </div>
          )}
        </div>

        {/* Speech Bubble / Dialogue Card */}
        <div className="glass-light rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-glass w-full overflow-y-auto max-h-[40vh] sm:max-h-[50vh]">
          {paragraphs.slice(0, currentParagraph + 1).map((paragraph, index) => (
            <p
              key={index}
              className={`text-base sm:text-lg mb-4 sm:mb-6 last:mb-0 leading-relaxed font-sans ${index === currentParagraph ? 'animate-in fade-in slide-in-from-bottom-4 duration-1000' : ''}`}
            >
              <span className="text-slate-700">{paragraph}</span>
            </p>
          ))}
        </div>
      </main>

      {/* Buttons */}
      <div className="relative z-10 w-full max-w-md space-y-3 sm:space-y-4 mt-auto pt-4 pb-2 px-2">
        {/* Audio Error - Retry Button */}
        {audioError && (
          <div className="text-center mb-2">
            <p className="text-red-400 text-xs mb-2">Audio failed to load</p>
            <button
              onClick={() => playIntroAudio(true)}
              className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg text-sm"
            >
              Tap to Retry Audio
            </button>
          </div>
        )}

        {/* Play/Stop Audio Button - Prominent */}
        {!hasStartedRef.current || !isSpeaking ? (
          <button
            onClick={() => playIntroAudio(true)}
            className="w-full py-4 sm:py-5 flex items-center justify-center gap-3 bg-amber-100 border-2 border-amber-400 text-amber-800 rounded-2xl hover:bg-amber-200 transition-all"
          >
            <span className="text-2xl">🔊</span>
            <span className="tracking-widest uppercase text-sm font-bold">Play Granddaddy&apos;s Message</span>
          </button>
        ) : (
          <button
            onClick={() => {
              stopAudio();
              setSpeaking(false);
            }}
            className="w-full py-4 sm:py-5 flex items-center justify-center gap-3 bg-red-100 border-2 border-red-400 text-red-700 rounded-2xl hover:bg-red-200 transition-all"
          >
            <span className="text-2xl">⏹️</span>
            <span className="tracking-widest uppercase text-sm font-bold">Stop Audio</span>
          </button>
        )}

        <button
          onClick={handleStart}
          className="premium-button w-full py-4 sm:py-6 text-lg sm:text-xl tracking-widest uppercase rounded-2xl"
        >
          We&apos;re Ready!
        </button>
      </div>
    </div>
  );
}
