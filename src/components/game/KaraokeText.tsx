'use client';

import { useState, useEffect } from 'react';

interface KaraokeTextProps {
  text: string;
  isPlaying: boolean;
  wordsPerMinute?: number;
  className?: string;
  highlightClassName?: string;
}

export default function KaraokeText({
  text,
  isPlaying,
  wordsPerMinute = 130, // ElevenLabs typical speed (slowed for sync)
  className = '',
  highlightClassName = 'text-star-gold',
}: KaraokeTextProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  // Split text into words while preserving punctuation
  const words = text.split(/(\s+)/).filter(Boolean);

  // Calculate time per word in milliseconds
  const msPerWord = (60 * 1000) / wordsPerMinute;

  useEffect(() => {
    if (!isPlaying) {
      setCurrentWordIndex(-1);
      return;
    }

    // Start highlighting
    setCurrentWordIndex(0);

    let wordIndex = 0;
    const interval = setInterval(() => {
      wordIndex++;
      if (wordIndex >= words.length) {
        clearInterval(interval);
        return;
      }
      setCurrentWordIndex(wordIndex);
    }, msPerWord);

    return () => clearInterval(interval);
  }, [isPlaying, words.length, msPerWord]);

  return (
    <span className={className}>
      {words.map((word, index) => {
        // Skip whitespace highlighting
        if (/^\s+$/.test(word)) {
          return <span key={index}>{word}</span>;
        }

        const isHighlighted = isPlaying && index <= currentWordIndex;
        const isCurrent = isPlaying && index === currentWordIndex;

        return (
          <span
            key={index}
            className={`transition-colors duration-150 ${
              isHighlighted ? highlightClassName : 'text-white/60'
            } ${isCurrent ? 'scale-105 inline-block' : ''}`}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}
