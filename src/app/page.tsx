'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import Starfield from '@/components/game/Starfield';

export default function Home() {
  const { setTeamName, resetGame } = useGameStore();
  const router = useRouter();

  const handleStart = () => {
    resetGame();
    setTeamName('The Bennett Family');
    router.push('/quest/intro');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <Starfield />
      
      <main className="relative z-10 w-full max-w-md text-center">
        {/* Header */}
        <div className="mb-12">
          <p className="text-star-gold text-sm tracking-[0.3em] font-sans uppercase mb-2 animate-fade-in">
            The Bennett Family
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-white font-serif tracking-tight leading-none text-glow">
            Christmas Quest
          </h1>
          <p className="text-2xl md:text-3xl font-light text-star-gold/90 mt-2 font-serif italic tracking-wide">
            Follow the Star
          </p>
        </div>

        {/* Granddaddy Avatar */}
        <div className="mb-10 group">
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto">
            <div className="absolute inset-0 bg-star-gold/20 rounded-full blur-2xl group-hover:bg-star-gold/30 transition-all duration-700"></div>
            <div className="relative z-10 w-full h-full rounded-full border-2 border-star-gold/50 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
              <img src="/granddaddy.png" alt="Granddaddy" className="w-full h-full object-cover" />
            </div>
            {/* Pulsing Ring */}
            <div className="absolute inset-0 rounded-full border border-star-gold/30 animate-ping opacity-20"></div>
          </div>
        </div>

        {/* Welcome Message Card */}
        <div className="glass-indigo rounded-3xl p-8 mb-10 shadow-glass border-white/5">
          <p className="text-lg text-white/90 font-sans leading-relaxed">
            Granddaddy has prepared a special Christmas adventure for his favorite seekers:
          </p>
          
          {/* Grandchildren Chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Mackenzie', 'Braxton', 'Juniper', 'Michael', 'Ben', 'Ivy'].map((name) => (
              <span key={name} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-star-gold text-sm font-medium backdrop-blur-md">
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="premium-button w-full py-6 text-2xl tracking-widest uppercase mb-8"
        >
          Begin Journey
        </button>

        {/* Scripture Quote */}
        <div className="mt-4 px-6 border-l-2 border-star-gold/30">
          <p className="text-base text-white/70 italic font-scripture leading-relaxed">
            &ldquo;We saw His star when it rose and have come to worship Him.&rdquo;
          </p>
          <p className="text-xs text-star-gold font-sans tracking-widest uppercase mt-2 opacity-80">
            — Matthew 2:2
          </p>
        </div>

        {/* Dev Reset - tap 3 times */}
        <button
          onClick={() => {
            resetGame();
            alert('Game reset! Tap Begin Journey to start fresh.');
          }}
          className="mt-8 text-white/20 text-[10px] tracking-widest hover:text-white/40 transition-colors"
        >
          RESET GAME
        </button>
      </main>
    </div>
  );
}
