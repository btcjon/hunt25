'use client';

import { stopAudio, unlockAudioContext } from '@/lib/voice/elevenlabs';

interface ReplayAudioProps {
  onReplay: () => void;
  isPlaying?: boolean;
  onStop?: () => void;
  className?: string;
}

export default function ReplayAudio({ onReplay, isPlaying = false, onStop, className = '' }: ReplayAudioProps) {
  const handleClick = () => {
    // Always try to unlock audio on any tap (iOS requirement)
    unlockAudioContext();

    if (isPlaying) {
      // Stop the audio
      stopAudio();
      onStop?.();
    } else {
      // Play the audio
      onReplay();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center justify-center gap-2
        min-w-[140px] px-5 py-3
        glass-indigo rounded-full
        border border-star-gold/30
        text-star-gold text-sm font-medium
        transition-all duration-300
        hover:border-star-gold/60 hover:bg-star-gold/10
        active:scale-95
        ${isPlaying ? 'ring-2 ring-star-gold/30' : ''}
        ${className}
      `}
      aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
    >
      {isPlaying ? (
        <>
          <span className="text-lg">⏹️</span>
          <span>Stop</span>
        </>
      ) : (
        <>
          <span className="text-lg">🔊</span>
          <span>Replay</span>
        </>
      )}
    </button>
  );
}
