'use client';

import React, { useState } from 'react';

export default function Starfield() {
  // Generate stars once using useState initializer
  const [stars] = useState(() =>
    Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 3 + 2}s`,
      opacity: Math.random() * 0.5 + 0.2,
    }))
  );

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050A18]">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            '--duration': star.duration,
            '--opacity': star.opacity,
          } as React.CSSProperties}
        />
      ))}
      {/* North Star */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full blur-[2px] shadow-[0_0_20px_white,0_0_40px_rgba(245,209,126,0.8)] animate-pulse"
        style={{ animationDuration: '4s' }}
      >
        <div className="absolute inset-0 w-full h-full bg-white rotate-45 scale-x-[0.1] scale-y-150"></div>
        <div className="absolute inset-0 w-full h-full bg-white -rotate-45 scale-x-[0.1] scale-y-150"></div>
      </div>
    </div>
  );
}
