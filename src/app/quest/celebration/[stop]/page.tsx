'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { CLUES } from '@/lib/game/clues';
import { speakCelebration, stopAudio, unlockAudioContext } from '@/lib/voice/elevenlabs';
import Starfield from '@/components/game/Starfield';
import ElapsedTimer from '@/components/game/ElapsedTimer';

interface PageProps {
  params: Promise<{ stop: string }>;
}

export default function CelebrationPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const stopNumber = parseInt(resolvedParams.stop, 10);
  const router = useRouter();
  const { collectedSymbols, currentStop, setSpeaking, isSpeaking, audioUnlocked, unlockAudio } = useGameStore();
  const [showTapPrompt, setShowTapPrompt] = useState(!audioUnlocked);

  const clue = CLUES[stopNumber - 1];

  // Celebration message with Christmas story meaning
  const celebrationMessages = [
    "YES! You found THE STAR! Just like the Wise Men, when we look for God's signs, He shows us the way!",
    "AMAZING! THE JOURNEY has begun! The Wise Men traveled far because their faith moved them to ACTION. Keep moving, seekers!",
    "WOW! You found their RESTING SPOT! Mary and Joseph needed a place to rest on their long journey - just like these two chairs watching over the lake together. Faith means trusting God even when the road is long!",
    "FANTASTIC! THE GIFTS! We give gifts at Christmas because God gave us the GREATEST gift - His Son!",
    "INCREDIBLE! BETHLEHEM! God chose a tiny, humble town. He doesn't need big places to do BIG things!",
    "HOORAY! THE ANGEL! 'Do not be afraid!' The angels brought GOOD NEWS of great joy for ALL people!",
    "WONDERFUL! THE INN! The world had no room, but God ALWAYS makes a way for those who seek Him!",
    "PERFECT! FULLNESS OF TIME! At just the right moment, God sent Jesus. His timing is ALWAYS perfect!",
  ];

  const message = celebrationMessages[stopNumber - 1] || "We found it!";

  const playCelebrationAudio = useCallback(async () => {
    setSpeaking(true);
    try {
      await speakCelebration(stopNumber, message, clue.name, clue.scripture, clue.scriptureText);
    } catch (error) {
      console.error('Celebration audio failed:', error);
    } finally {
      setSpeaking(false);
    }
  }, [stopNumber, message, clue.name, clue.scripture, clue.scriptureText, setSpeaking]);

  // Handle tap to unlock audio AND start playing
  const handleTapToStart = useCallback(() => {
    unlockAudioContext();
    unlockAudio();
    setShowTapPrompt(false);
    // Start playing the celebration
    playCelebrationAudio();
  }, [unlockAudio, playCelebrationAudio]);

  // If already unlocked, just hide prompt (no auto-play)
  useEffect(() => {
    if (audioUnlocked) {
      setShowTapPrompt(false);
    }
  }, [audioUnlocked]);

  const handleNext = () => {
    stopAudio(); // Stop any playing audio before navigating
    setSpeaking(false);
    if (currentStop > 8) {
      router.push('/quest/finale');
    } else {
      router.push(`/quest/${currentStop}`);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden bg-white">
      <Starfield />
      <StarDust />

      {/* Tap to Celebrate Overlay - Required for mobile audio */}
      {showTapPrompt && !audioUnlocked && (
        <div
          className="fixed inset-0 z-50 bg-white/95 flex flex-col items-center justify-center cursor-pointer"
          onClick={handleTapToStart}
        >
          <div className="text-center px-8">
            <div className="text-6xl sm:text-8xl mb-6 animate-bounce">{clue.symbol}</div>
            <h2 className="text-2xl sm:text-3xl font-serif text-slate-800 mb-4">
              You Found It!
            </h2>
            <p className="text-amber-700 text-lg sm:text-xl mb-8">
              {clue.name}
            </p>
            <div className="inline-block px-8 py-4 bg-amber-100 border-2 border-amber-600 rounded-full">
              <span className="text-amber-700 font-bold tracking-widest uppercase text-sm">
                Tap to Celebrate!
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 text-center max-w-lg w-full">
        {/* Timer */}
        <div className="flex justify-center mb-4">
          <ElapsedTimer />
        </div>

        {/* Play/Stop Button at Top */}
        {!isSpeaking ? (
          <button
            onClick={playCelebrationAudio}
            className="w-full max-w-xs mx-auto py-3 mb-6 flex items-center justify-center gap-3 bg-amber-100 border-2 border-amber-400 text-amber-700 rounded-2xl hover:bg-amber-200 transition-all"
          >
            <span className="text-xl">🔊</span>
            <span className="tracking-widest uppercase text-xs font-bold">Play Message</span>
          </button>
        ) : (
          <button
            onClick={() => {
              stopAudio();
              setSpeaking(false);
            }}
            className="w-full max-w-xs mx-auto py-3 mb-6 flex items-center justify-center gap-3 bg-red-500/20 border-2 border-red-500/50 text-red-300 rounded-2xl hover:bg-red-500/30 transition-all"
          >
            <span className="text-xl">⏹️</span>
            <span className="tracking-widest uppercase text-xs font-bold">Stop Audio</span>
          </button>
        )}

        {/* Big Symbol with Glow */}
        <div className="relative mb-6 sm:mb-8 group">
          <div className="absolute inset-0 bg-amber-100 rounded-full blur-3xl scale-150 animate-pulse"></div>
          <div className="relative z-10 text-[80px] sm:text-[120px] drop-shadow-[0_0_30px_rgba(245,209,126,0.8)] animate-bounce duration-1000">
            {clue.symbol}
          </div>
        </div>

        {/* Success Message */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-amber-700 text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase font-sans mb-2 drop-shadow-sm">
            Treasure Found
          </h1>
          <h2 className="text-3xl sm:text-5xl font-serif text-slate-800 text-glow mb-3">
            {clue.name}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-sans leading-relaxed px-4">
            {message}
          </p>
        </div>

        {/* Scripture Card */}
        <div className="glass-light rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-8 sm:mb-10 max-w-md mx-auto border-white/5 shadow-glass animate-in zoom-in duration-700">
          <p className="text-base sm:text-xl text-slate-800 italic font-scripture leading-relaxed">
            &ldquo;{clue.scriptureText}&rdquo;
          </p>
          <div className="h-px w-12 bg-amber-200 mx-auto my-4 sm:my-6"></div>
          <p className="text-amber-700 text-[10px] sm:text-xs tracking-widest uppercase font-sans">
            — {clue.scripture}
          </p>
        </div>

        {/* Collected Inventory Progress */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 opacity-80 scale-90">
          {collectedSymbols.map((sym, i) => (
            <span key={i} className="text-2xl sm:text-3xl drop-shadow-[0_0_10px_rgba(245,209,126,0.3)]">{sym}</span>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="premium-button w-full max-w-xs py-4 sm:py-6 text-base sm:text-xl tracking-widest uppercase"
        >
          {currentStop > 8 ? 'Final Destination' : 'Follow the Star'}
        </button>

        {/* Group Prompt */}
        <p className="mt-4 text-slate-400 text-[10px] sm:text-xs font-sans tracking-widest uppercase italic">
          Granddaddy is proud of you!
        </p>
      </main>
    </div>
  );
}

// Star Dust (Golden Particles) for celebration
function StarDust() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 3,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-amber-500 opacity-0 animate-dust"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            '--delay': `${p.delay}s`,
            '--duration': `${p.duration}s`,
          } as React.CSSProperties}
        />
      ))}
      <style jsx>{`
        @keyframes dust {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: scale(1.5) rotate(180deg) translate(20px, 20px); opacity: 0; }
        }
        .animate-dust {
          animation: dust var(--duration) var(--delay) infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
