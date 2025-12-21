'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { CLUES } from '@/lib/game/clues';
import { speak } from '@/lib/voice/elevenlabs';
// Browser fallback removed - ElevenLabs only
import Starfield from '@/components/game/Starfield';
import ReplayAudio from '@/components/game/ReplayAudio';

interface PageProps {
  params: Promise<{ stop: string }>;
}

export default function CelebrationPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const stopNumber = parseInt(resolvedParams.stop, 10);
  const router = useRouter();
  const { collectedSymbols, currentStop, setSpeaking, isSpeaking, audioUnlocked } = useGameStore();

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

  const speakCelebration = useCallback(async () => {
    setSpeaking(true);
    try {
      const fullMessage = `${message} You found ${clue.name}! ${clue.scriptureText}`;
      await speak(fullMessage);
    } catch (error) {
      console.error('ElevenLabs failed:', error);
    } finally {
      setSpeaking(false);
    }
  }, [message, clue.name, clue.scriptureText, setSpeaking]);

  // Only auto-play if audio has been unlocked
  useEffect(() => {
    if (!audioUnlocked) return;
    speakCelebration();
  }, [speakCelebration, audioUnlocked]);

  const handleNext = () => {
    if (currentStop > 8) {
      router.push('/quest/finale');
    } else {
      router.push(`/quest/${currentStop}`);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden bg-midnight">
      <Starfield />
      <StarDust />

      <main className="relative z-10 text-center max-w-lg w-full">
        {/* Big Symbol with Glow */}
        <div className="relative mb-6 sm:mb-8 group">
          <div className="absolute inset-0 bg-star-gold/20 rounded-full blur-3xl scale-150 animate-pulse"></div>
          <div className="relative z-10 text-[80px] sm:text-[120px] drop-shadow-[0_0_30px_rgba(245,209,126,0.8)] animate-bounce duration-1000">
            {clue.symbol}
          </div>
        </div>

        {/* Success Message */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-star-gold text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase font-sans mb-2 drop-shadow-sm">
            Treasure Found
          </h1>
          <h2 className="text-3xl sm:text-5xl font-serif text-white text-glow mb-3">
            {clue.name}
          </h2>
          <p className="text-white/80 text-sm sm:text-base font-sans leading-relaxed px-4">
            {message}
          </p>
        </div>

        {/* Scripture Card */}
        <div className="glass-indigo rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-8 sm:mb-10 max-w-md mx-auto border-white/5 shadow-glass animate-in zoom-in duration-700">
          <p className="text-base sm:text-xl text-white italic font-scripture leading-relaxed">
            &ldquo;{clue.scriptureText}&rdquo;
          </p>
          <div className="h-px w-12 bg-star-gold/30 mx-auto my-4 sm:my-6"></div>
          <p className="text-star-gold text-[10px] sm:text-xs tracking-widest uppercase font-sans">
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

        {/* Replay Audio */}
        <div className="flex justify-center mt-4 sm:mt-6 mb-4">
          <ReplayAudio onReplay={speakCelebration} isPlaying={isSpeaking} onStop={() => setSpeaking(false)} />
        </div>

        {/* Group Prompt */}
        <p className="mt-4 text-white/40 text-[10px] sm:text-xs font-sans tracking-widest uppercase italic">
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
          className="absolute rounded-full bg-star-gold opacity-0 animate-dust"
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
