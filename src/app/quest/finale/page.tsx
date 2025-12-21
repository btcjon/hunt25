'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { FINALE } from '@/lib/game/clues';
import { speak } from '@/lib/voice/elevenlabs';
import { speakFallback } from '@/lib/voice/webSpeech';

export default function FinalePage() {
  const router = useRouter();
  const { collectedSymbols, teamName, setSpeaking, resetGame } = useGameStore();
  const [stage, setStage] = useState<'verse' | 'reveal' | 'complete'>('verse');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const runFinale = async () => {
      // Stage 1: Speak the final verse
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

      // Sacred pause moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStage('reveal');
      setShowConfetti(true);

      // Speak the revelation
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

      await new Promise(resolve => setTimeout(resolve, 3000));
      setStage('complete');
    };

    runFinale();
  }, [teamName, setSpeaking]);

  const handlePlayAgain = () => {
    resetGame();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-midnight via-blue-950 to-slate-900 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Stars Background */}
      <StarsBackground />

      {/* Confetti */}
      {showConfetti && <GoldenConfetti />}

      <main className="text-center z-10 max-w-lg px-4">
        {stage === 'verse' && (
          <div className="animate-fade-in">
            {/* All Symbols */}
            <div className="text-5xl mb-8 drop-shadow-lg">
              {collectedSymbols.join(' ')}
            </div>

            {/* Final Verse */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6 border-2 border-sacred-gold/30">
              <p className="text-soft-ivory text-xl whitespace-pre-line leading-relaxed font-lora">
                {FINALE.verse}
              </p>
            </div>
          </div>
        )}

        {(stage === 'reveal' || stage === 'complete') && (
          <div className="animate-fade-in">
            {/* Big Baby Jesus Symbol with Golden Glow */}
            <div className="relative mb-8">
              <div className="absolute inset-0 blur-3xl bg-sacred-gold/40 animate-pulse" />
              <div className="relative text-9xl drop-shadow-2xl">
                👶
              </div>
            </div>

            <h1 className="text-5xl font-bold text-sacred-gold mb-3 font-crimson drop-shadow-lg">
              BABY JESUS!
            </h1>
            <p className="text-2xl text-soft-ivory mb-8 font-lora italic">
              The Greatest Treasure of All
            </p>

            {/* All Symbols */}
            <div className="text-5xl mb-8 drop-shadow-lg">
              {collectedSymbols.join(' ')} 👶
            </div>

            {/* Scripture - Sacred Styling */}
            <div className="bg-sacred-gold/20 backdrop-blur-sm rounded-xl p-6 mb-8 border-l-4 border-sacred-gold shadow-xl">
              <p className="text-soft-ivory italic text-xl font-lora leading-relaxed">
                &ldquo;{FINALE.scriptureText}&rdquo;
              </p>
              <p className="text-sacred-gold text-base mt-3 font-semibold">
                — {FINALE.scripture}
              </p>
            </div>

            {/* Sacred Pause Message */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-8 border border-soft-ivory/20">
              <p className="text-soft-ivory text-lg font-lora italic leading-relaxed">
                Let us take a sacred moment together to worship the newborn King...
              </p>
            </div>

            {/* Team Congratulations */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border-2 border-sacred-gold/30">
              <p className="text-soft-ivory text-xl font-lora">
                🎉 Congratulations, <strong className="text-sacred-gold">{teamName}</strong>! 🎉
              </p>
              <p className="text-soft-ivory/90 mt-3 text-lg leading-relaxed">
                Together, you followed the Star, made the Journey, and found the true meaning of Christmas!
              </p>
            </div>

            {stage === 'complete' && (
              <button
                onClick={handlePlayAgain}
                className="px-10 py-5 text-2xl font-bold text-white bg-sacred-gold rounded-xl shadow-2xl hover:bg-candlelight transition-all active:scale-95"
              >
                Play Again ⭐
              </button>
            )}
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}

// Stars Background - generated once on mount
function StarsBackground() {
  const [stars] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Golden Confetti for Finale - generated once on mount
function GoldenConfetti() {
  const colors = ['#F59E0B', '#FCD34D', '#FBBF24', '#D97706'];

  const [confettiPieces] = useState(() =>
    Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 3 + Math.random() * 3,
      animationDelay: Math.random() * 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 10 + Math.random() * 15,
      isCircle: Math.random() > 0.5,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-gold"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            animationDuration: `${piece.animationDuration}s`,
            animationDelay: `${piece.animationDelay}s`,
            borderRadius: piece.isCircle ? '50%' : '0',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-gold {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(1080deg);
            opacity: 0;
          }
        }
        .animate-confetti-gold {
          animation: confetti-gold linear forwards;
        }
      `}</style>
    </div>
  );
}
