'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/game/state';

function formatElapsed(startTime: number | null, endTime: number | null): string {
  if (!startTime) return '00:00:00';
  const end = endTime || Date.now();
  const totalSeconds = Math.floor((end - startTime) / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ElapsedTimer() {
  const { questStartTime, finaleCompletedTime } = useGameStore();
  const [, forceUpdate] = useState(0);

  // Force re-render every second to update the computed time
  useEffect(() => {
    // If no start time or timer is locked, no interval needed
    if (!questStartTime || finaleCompletedTime) return;

    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [questStartTime, finaleCompletedTime]);

  if (!questStartTime) return null;

  // Compute elapsed on each render
  const elapsed = formatElapsed(questStartTime, finaleCompletedTime);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-amber-200 rounded-full backdrop-blur-sm">
      <span className="text-amber-700/80 text-xs">TIME</span>
      <span className="text-amber-700 font-mono font-bold text-sm tracking-wider">
        {elapsed}
      </span>
      {finaleCompletedTime && (
        <span className="text-green-400 text-xs">LOCKED</span>
      )}
    </div>
  );
}
