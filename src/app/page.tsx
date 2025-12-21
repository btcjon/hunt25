'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';

export default function Home() {
  const { setTeamName, resetGame } = useGameStore();
  const router = useRouter();

  const handleStart = () => {
    resetGame();
    setTeamName('The Bennett Family');
    router.push('/quest/intro');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center px-6">
      <main className="w-full max-w-md text-center">
        {/* Title */}
        <div className="mb-6">
          <span className="text-7xl">⭐</span>
          <h1 className="text-5xl font-bold text-sacred-blue mt-4 font-crimson">
            STAR SEEKERS
          </h1>
          <p className="text-3xl font-semibold text-candlelight mt-1 font-lora">
            Quest
          </p>
        </div>

        {/* Granddaddy Avatar */}
        <div className="mb-6">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-candlelight to-amber-600 rounded-full flex items-center justify-center text-7xl shadow-xl">
            👴
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-sacred-gold/30 shadow-lg">
          <p className="text-2xl text-sacred-blue font-lora mb-2">
            Welcome,
          </p>
          <p className="text-3xl font-bold text-sacred-gold font-crimson mb-3">
            Bennett Family!
          </p>
          <p className="text-lg text-sacred-blue/80 italic font-lora">
            Granddaddy has prepared a special Christmas adventure just for you...
          </p>
        </div>

        {/* Grandchildren */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="px-3 py-1 bg-sacred-gold/20 rounded-full text-sacred-blue font-medium">Mackenzie</span>
          <span className="px-3 py-1 bg-sacred-gold/20 rounded-full text-sacred-blue font-medium">Braxton</span>
          <span className="px-3 py-1 bg-sacred-gold/20 rounded-full text-sacred-blue font-medium">Juniper</span>
          <span className="px-3 py-1 bg-sacred-gold/20 rounded-full text-sacred-blue font-medium">Michael</span>
          <span className="px-3 py-1 bg-sacred-gold/20 rounded-full text-sacred-blue font-medium">Ben</span>
          <span className="px-3 py-1 bg-sacred-gold/20 rounded-full text-sacred-blue font-medium">Ivy</span>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-5 text-2xl font-bold text-white bg-sacred-blue rounded-xl shadow-lg hover:bg-blue-900 transition-all active:scale-95"
        >
          BEGIN QUEST ⭐
        </button>

        {/* Footer */}
        <div className="mt-8 px-4 py-3 bg-white/50 rounded-lg border-l-4 border-sacred-gold">
          <p className="text-base text-sacred-blue italic font-lora">
            &ldquo;We saw His star when it rose and have come to worship Him.&rdquo;
          </p>
          <p className="text-sm text-candlelight font-semibold mt-1">
            — Matthew 2:2
          </p>
        </div>
      </main>
    </div>
  );
}
