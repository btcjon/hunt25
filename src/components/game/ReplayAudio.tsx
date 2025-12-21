'use client';

interface ReplayAudioProps {
  onReplay: () => void;
  isPlaying?: boolean;
  className?: string;
}

export default function ReplayAudio({ onReplay, isPlaying = false, className = '' }: ReplayAudioProps) {
  return (
    <button
      onClick={onReplay}
      disabled={isPlaying}
      className={`
        flex items-center justify-center gap-2
        px-5 py-3
        glass-indigo rounded-full
        border border-star-gold/30
        text-star-gold text-sm font-medium
        transition-all duration-300
        hover:border-star-gold/60 hover:bg-star-gold/10
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isPlaying ? 'animate-pulse' : ''}
        ${className}
      `}
      aria-label="Replay audio"
    >
      {isPlaying ? (
        <>
          <span className="text-lg">🔊</span>
          <span>Playing...</span>
        </>
      ) : (
        <>
          <span className="text-lg">🔁</span>
          <span>Replay Audio</span>
        </>
      )}
    </button>
  );
}
