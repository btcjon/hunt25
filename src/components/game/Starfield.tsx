'use client';

import React from 'react';

export default function Starfield() {
  // Create 8 golden rays emanating from top-center
  const rays = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * 360;
    return { id: i, angle };
  });

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#FFFBEB]">
      {/* Central light glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-radial from-amber-100/40 via-transparent to-transparent blur-3xl"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(251, 146, 60, 0.15), transparent 70%)',
        }}
      />

      {/* Golden rays */}
      {rays.map((ray) => (
        <div
          key={ray.id}
          className="ray absolute top-0 left-1/2 origin-top"
          style={{
            transform: `translateX(-50%) rotate(${ray.angle}deg)`,
            width: '120px',
            height: '100vh',
            background: `linear-gradient(to bottom, rgba(251, 191, 36, 0.15), transparent 60%)`,
          }}
        />
      ))}

      {/* North Star */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-600 rounded-full blur-[2px] shadow-[0_0_20px_rgba(184,134,11,0.8),0_0_40px_rgba(184,134,11,0.4)] animate-pulse"
        style={{ animationDuration: '4s' }}
      >
        <div className="absolute inset-0 w-full h-full bg-amber-600 rotate-45 scale-x-[0.1] scale-y-150"></div>
        <div className="absolute inset-0 w-full h-full bg-amber-600 -rotate-45 scale-x-[0.1] scale-y-150"></div>
      </div>
    </div>
  );
}
