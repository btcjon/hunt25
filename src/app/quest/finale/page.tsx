'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { FINALE } from '@/lib/game/clues';
import { speak } from '@/lib/voice/elevenlabs';
import { speakFallback } from '@/lib/voice/webSpeech';
import Starfield from '@/components/game/Starfield';
import ReplayAudio from '@/components/game/ReplayAudio';

export default function FinalePage() {
  const router = useRouter();
  const { collectedSymbols, teamName, setSpeaking, isSpeaking, resetGame } = useGameStore();
  const [stage, setStage] = useState<'verse' | 'reveal' | 'complete'>('verse');

  const speakVerse = useCallback(async () => {
    setSpeaking(true);
    try {
      try {
        await speak(FINALE.verse);
      } catch {
        await speakFallback(FINALE.verse);
      }
    } finally {
      setSpeaking(false);
    }
  }, [setSpeaking]);

  const speakRevelation = useCallback(async () => {
    setSpeaking(true);
    try {
      const revelation = `${teamName}, together you found ALL 8 treasures! And now, the GREATEST treasure of all: Baby Jesus! ${FINALE.scriptureText} Let us take a moment to worship Him.`;
      try {
        await speak(revelation);
      } catch {
        await speakFallback(revelation);
      }
    } finally {
      setSpeaking(false);
    }
  }, [teamName, setSpeaking]);

  useEffect(() => {
    const runFinale = async () => {
      // Stage 1: Speak the final verse
      await speakVerse();

      // Sacred pause moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStage('reveal');

      // Speak the revelation
      await speakRevelation();

      await new Promise(resolve => setTimeout(resolve, 3000));
      setStage('complete');
    };

    runFinale();
  }, [speakVerse, speakRevelation]);

  const handlePlayAgain = () => {
    resetGame();
    router.push('/');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden bg-midnight">
      <Starfield />
      
      {stage !== 'verse' && <FinaleGlow />}

      <main className="relative z-10 text-center max-w-lg w-full px-4">
        {stage === 'verse' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* All Symbols */}
            <div className="flex flex-wrap justify-center gap-4 mb-10 opacity-60">
              {collectedSymbols.map((sym, i) => (
                <span key={i} className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{sym}</span>
              ))}
            </div>

            {/* Final Clue Card */}
            <div className="glass-indigo rounded-3xl p-10 border-white/5 shadow-glass">
              <p className="text-white text-2xl whitespace-pre-line leading-relaxed font-serif italic text-glow">
                {FINALE.verse}
              </p>
            </div>
            
            {/* Replay Button */}
            <div className="flex justify-center mt-8 mb-4">
              <ReplayAudio onReplay={speakVerse} isPlaying={isSpeaking} />
            </div>

            <p className="mt-4 text-star-gold text-xs tracking-[0.4em] uppercase font-sans animate-pulse">
              Follow the light...
            </p>
          </div>
        )}

        {(stage === 'reveal' || stage === 'complete') && (
          <div className="animate-in fade-in zoom-in duration-1000">
            {/* Big Baby Jesus Symbol with Intense Golden Glow */}
            <div className="relative mb-12 group">
              <div className="absolute inset-0 bg-star-gold/30 rounded-full blur-3xl scale-150 animate-pulse"></div>
              <div className="relative z-10 text-[140px] drop-shadow-[0_0_50px_rgba(245,209,126,1)] animate-bounce duration-2000">
                👶
              </div>
            </div>

            <div className="mb-10">
              <h1 className="text-star-gold text-sm tracking-[0.5em] uppercase font-sans mb-3 drop-shadow-sm">
                The True Light
              </h1>
              <h2 className="text-6xl font-serif text-white text-glow mb-4">
                BABY JESUS
              </h2>
              <p className="text-white/60 text-lg font-serif italic">
                The Greatest Treasure of All
              </p>
            </div>

            {/* Symbols Bar */}
            <div className="flex justify-center items-center gap-3 mb-10 bg-white/5 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 w-fit mx-auto">
              {collectedSymbols.map((sym, i) => (
                <span key={i} className="text-2xl opacity-60">{sym}</span>
              ))}
              <span className="text-3xl text-star-gold ml-2 animate-pulse">👶</span>
            </div>

            {/* Scripture - Sacred Card */}
            <div className="glass-indigo rounded-3xl p-10 mb-10 border-star-gold/30 shadow-[0_0_40px_rgba(245,209,126,0.15)]">
              <p className="text-2xl text-white italic font-scripture leading-relaxed">
                &ldquo;{FINALE.scriptureText}&rdquo;
              </p>
              <div className="h-px w-16 bg-star-gold/40 mx-auto my-8"></div>
              <p className="text-star-gold text-sm tracking-widest uppercase font-sans">
                — {FINALE.scripture}
              </p>
            </div>

            {/* Replay Button */}
            <div className="flex justify-center mb-8">
              <ReplayAudio onReplay={speakRevelation} isPlaying={isSpeaking} />
            </div>

            {/* Team Victory Message */}
            <div className="mb-12">
              <p className="text-white/80 text-xl font-serif mb-2">
                Congratulations, <span className="text-star-gold font-bold">{teamName}</span>
              </p>
              <p className="text-white/40 text-sm font-sans tracking-widest uppercase">
                Quest Completed • Christmas 2025
              </p>
            </div>

            {stage === 'complete' && (
              <button
                onClick={handlePlayAgain}
                className="premium-button w-full max-w-xs py-6 text-xl tracking-widest uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500"
              >
                Rejoice & Play Again
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function FinaleGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[50vh] bg-gradient-to-t from-star-gold/20 to-transparent blur-3xl opacity-60"></div>
      {/* Falling star dust */}
      <div className="star-dust-container"></div>
    </div>
  );
}
