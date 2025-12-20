'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';

export default function Home() {
  const [teamName, setTeamNameInput] = useState('');
  const { setTeamName, resetGame } = useGameStore();
  const router = useRouter();

  const handleStart = () => {
    if (teamName.trim()) {
      resetGame();
      setTeamName(teamName.trim());
      router.push('/quest/intro');
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFCE8] flex flex-col items-center justify-center px-4">
      <main className="w-full max-w-md text-center">
        {/* Title */}
        <div className="mb-8">
          <span className="text-6xl">⭐</span>
          <h1 className="text-4xl font-bold text-[#1E293B] mt-4">
            STAR SEEKERS
          </h1>
          <p className="text-2xl font-semibold text-[#2563EB] mt-1">
            QUEST
          </p>
        </div>

        {/* Granddaddy Avatar */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-[#F59E0B] rounded-full flex items-center justify-center text-5xl shadow-lg">
            👴
          </div>
          <p className="text-lg text-[#1E293B] mt-4 italic">
            &ldquo;Ready for an adventure?&rdquo;
          </p>
        </div>

        {/* Team Name Input */}
        <div className="mb-6">
          <label htmlFor="teamName" className="block text-lg font-medium text-[#1E293B] mb-2">
            What&apos;s your team name?
          </label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamNameInput(e.target.value)}
            placeholder="The Treasure Hunters"
            className="w-full px-4 py-3 text-lg border-2 border-[#2563EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-[#1E293B]"
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!teamName.trim()}
          className="w-full py-4 text-xl font-bold text-white bg-[#2563EB] rounded-xl shadow-lg hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          BEGIN QUEST
        </button>

        {/* Footer */}
        <p className="mt-8 text-sm text-[#64748B] italic">
          &ldquo;We saw His star when it rose...&rdquo; — Matthew 2:2
        </p>
      </main>
    </div>
  );
}
