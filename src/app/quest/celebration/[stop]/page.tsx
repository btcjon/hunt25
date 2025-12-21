'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { CLUES } from '@/lib/game/clues';
import { speak } from '@/lib/voice/elevenlabs';
import { speakFallback } from '@/lib/voice/webSpeech';

interface PageProps {
  params: Promise<{ stop: string }>;
}

export default function CelebrationPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const stopNumber = parseInt(resolvedParams.stop, 10);
  const router = useRouter();
  const { collectedSymbols, currentStop, setSpeaking } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(true);

  const clue = CLUES[stopNumber - 1];

  // Celebration message
  const celebrationMessages = [
    "YES! We found it! The Wise Men would be SO proud of our family!",
    "AMAZING! We're doing incredible! Granddaddy is cheering for everyone!",
    "WOW! We found it together! The Christmas story continues!",
    "FANTASTIC! Another treasure collected! Everyone say hooray!",
    "INCREDIBLE! We're all star seekers for real!",
    "HOORAY! The journey continues! We're almost there together!",
    "WONDERFUL! We found it as a group! What amazing seekers!",
    "PERFECT! Everyone together, and right on time!",
  ];

  const message = celebrationMessages[stopNumber - 1] || "We found it!";

  useEffect(() => {
    const speakCelebration = async () => {
      setSpeaking(true);
      try {
        const fullMessage = `${message} You found ${clue.name}! ${clue.scriptureText}`;
        try {
          await speak(fullMessage);
        } catch {
          await speakFallback(fullMessage);
        }
      } finally {
        setSpeaking(false);
      }
    };

    speakCelebration();

    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [clue.name, clue.scriptureText, message, setSpeaking]);

  const handleNext = () => {
    if (currentStop > 8) {
      router.push('/quest/finale');
    } else {
      router.push(`/quest/${currentStop}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sacred-gold via-amber-500 to-candlelight flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      <main className="text-center z-10 max-w-lg">
        {/* Big Symbol */}
        <div className="text-9xl mb-6 animate-bounce drop-shadow-2xl">
          {clue.symbol}
        </div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold text-white mb-3 font-crimson drop-shadow-lg">
          WE FOUND IT!
        </h1>
        <p className="text-2xl text-white/95 mb-8 font-lora">
          {clue.name} Collected!
        </p>

        {/* Scripture */}
        <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-md mx-auto border-2 border-white/50 shadow-xl">
          <p className="text-lg text-white italic font-lora leading-relaxed">
            &ldquo;{clue.scriptureText}&rdquo;
          </p>
          <p className="text-white/90 text-base mt-3 font-semibold">
            — {clue.scripture}
          </p>
        </div>

        {/* Collected Symbols */}
        <div className="text-5xl mb-8 drop-shadow-lg">
          {collectedSymbols.join(' ')}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="px-10 py-5 text-2xl font-bold text-sacred-gold bg-white rounded-xl shadow-2xl hover:bg-soft-ivory transition-all active:scale-95"
        >
          {currentStop > 8 ? 'FINALE! 🏠' : 'NEXT CLUE →'}
        </button>

        {/* Group Prompt */}
        <p className="mt-6 text-xl text-white font-lora italic">
          Everyone say hooray! 🎉
        </p>
      </main>
    </div>
  );
}

// Simple Confetti Component - generates pieces once on mount
function Confetti() {
  const colors = ['#F59E0B', '#2563EB', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

  // Generate confetti pieces only once using useState with initializer
  const [confettiPieces] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 2 + Math.random() * 2,
      animationDelay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
      isCircle: Math.random() > 0.5,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            animationDuration: `${piece.animationDuration}s`,
            animationDelay: `${piece.animationDelay}s`,
            borderRadius: piece.isCircle ? '50%' : '0',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
