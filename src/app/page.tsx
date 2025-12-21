'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';

export default function Home() {
  const [familyName, setFamilyNameInput] = useState('');
  const [seekerCount, setSeekerCount] = useState(4);
  const { setTeamName, resetGame } = useGameStore();
  const router = useRouter();

  const handleStart = () => {
    if (familyName.trim()) {
      resetGame();
      setTeamName(familyName.trim());
      router.push('/quest/intro');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center px-6">
      <main className="w-full max-w-md text-center">
        {/* Title */}
        <div className="mb-8">
          <span className="text-6xl">⭐</span>
          <h1 className="text-5xl font-bold text-sacred-blue mt-4 font-crimson">
            STAR SEEKERS
          </h1>
          <p className="text-3xl font-semibold text-candlelight mt-1 font-lora">
            Quest
          </p>
        </div>

        {/* Granddaddy Avatar */}
        <div className="mb-8">
          <div className="w-28 h-28 mx-auto bg-gradient-to-br from-candlelight to-amber-600 rounded-full flex items-center justify-center text-6xl shadow-xl">
            👴
          </div>
          <p className="text-xl text-sacred-blue mt-4 italic font-lora">
            &ldquo;Ready for an adventure?&rdquo;
          </p>
        </div>

        {/* Seeker Counter */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-sacred-blue mb-3 font-lora">
            How many seekers?
          </label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setSeekerCount(Math.max(1, seekerCount - 1))}
              className="w-12 h-12 bg-white rounded-full shadow-md text-2xl font-bold text-candlelight hover:bg-amber-50 active:scale-95 transition-all"
            >
              −
            </button>
            <span className="text-5xl font-bold text-sacred-gold min-w-[80px]">
              {seekerCount}
            </span>
            <button
              onClick={() => setSeekerCount(seekerCount + 1)}
              className="w-12 h-12 bg-white rounded-full shadow-md text-2xl font-bold text-candlelight hover:bg-amber-50 active:scale-95 transition-all"
            >
              +
            </button>
          </div>
        </div>

        {/* Family Name Input */}
        <div className="mb-6">
          <label htmlFor="familyName" className="block text-lg font-medium text-sacred-blue mb-2 font-lora">
            What&apos;s your family name?
          </label>
          <input
            id="familyName"
            type="text"
            value={familyName}
            onChange={(e) => setFamilyNameInput(e.target.value)}
            placeholder="The Smith Family"
            className="w-full px-4 py-4 text-lg border-2 border-sacred-gold rounded-xl focus:outline-none focus:ring-4 focus:ring-candlelight/30 focus:border-candlelight bg-white text-sacred-blue placeholder:text-gray-400"
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!familyName.trim()}
          className="w-full py-5 text-2xl font-bold text-white bg-sacred-blue rounded-xl shadow-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          BEGIN QUEST
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
