'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGameStore } from '@/lib/game/state';
import { CLUES } from '@/lib/game/clues';
import { speakClue, stopAudio, unlockAudioContext } from '@/lib/voice/elevenlabs';
import Starfield from '@/components/game/Starfield';
import ElapsedTimer from '@/components/game/ElapsedTimer';

interface PageProps {
  params: Promise<{ stop: string }>;
}

export default function ClueScreen({ params }: PageProps) {
  const resolvedParams = use(params);
  const stopNumber = parseInt(resolvedParams.stop, 10);
  const router = useRouter();
  const {
    teamName,
    collectedSymbols,
    hintsUsed,
    setSpeaking,
    isSpeaking,
    addMessage,
    chatHistory,
    collectSymbol,
    advanceToNextStop,
    recordClueStart,
    audioUnlocked,
    unlockAudio,
    resetGame,
  } = useGameStore();

  const [granddaddyResponse, setGranddaddyResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePassword, setOverridePassword] = useState('');
  const [overrideError, setOverrideError] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [showTapPrompt, setShowTapPrompt] = useState(!audioUnlocked);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const clue = CLUES[stopNumber - 1];

  // Play the clue audio (cached)
  const playClueAudio = useCallback(async () => {
    if (!clue) return;
    setSpeaking(true);
    try {
      await speakClue(stopNumber, clue.verse, clue.scripture, clue.scriptureText);
    } catch (error) {
      console.error('Clue audio failed:', error);
    } finally {
      setSpeaking(false);
    }
  }, [clue, stopNumber, setSpeaking]);

  // Handle tap to unlock audio AND start playing (required for mobile)
  const handleTapToStart = useCallback(() => {
    unlockAudioContext();
    unlockAudio();
    setShowTapPrompt(false);
    // Start playing the clue
    playClueAudio();
  }, [unlockAudio, playClueAudio]);

  // If already unlocked (returning to page), hide the prompt
  useEffect(() => {
    if (audioUnlocked) {
      setShowTapPrompt(false);
    }
  }, [audioUnlocked]);

  // Record clue start time (only once per stop)
  useEffect(() => {
    if (!clue) return;
    recordClueStart(stopNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopNumber]);

  // Parent override handler
  const handleParentOverride = () => {
    if (overridePassword === '4343') {
      handleSuccess();
      setShowOverrideModal(false);
    } else {
      setOverrideError(true);
      setTimeout(() => setOverrideError(false), 2000);
    }
  };

  // Reset game handler
  const handleResetGame = () => {
    setShowResetConfirm(true);
  };

  const confirmResetGame = () => {
    stopAudio();
    setSpeaking(false);
    resetGame();
    setShowResetConfirm(false);
    router.push('/');
  };

  // Send message to Granddaddy
  const handleUserMessage = async (message: string) => {
    setIsProcessing(true);
    setLastUserMessage(message);
    addMessage('user', message);

    // Check if they're saying they found it
    if (/found it|we're here|i'm here|we found|i found|here it is/i.test(message)) {
      const response = "Great! Let me see - take a photo so I can check!";
      setGranddaddyResponse(response);
      addMessage('granddaddy', response);
      setShowCamera(true);
      setIsProcessing(false);
      return;
    }

    // Chat with Granddaddy (text-only responses for speed)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          currentStop: stopNumber,
          collectedSymbols,
          hintsUsed: hintsUsed[stopNumber] || 0,
          teamName,
          chatHistory,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      // Auto-unlock if description matched 3+ visual identifiers
      if (data.shouldUnlock) {
        setGranddaddyResponse(data.response);
        addMessage('granddaddy', data.response);
        handleSuccess();
        return;
      }

      setGranddaddyResponse(data.response);
      addMessage('granddaddy', data.response);

      if (data.shouldTriggerPhoto) {
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const fallback = "Hmm, I couldn't quite hear that. Try again!";
      setGranddaddyResponse(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  // Chat responses are text-only (no TTS) for faster interaction

  const handleSuccess = () => {
    stopAudio(); // Stop any playing audio before navigating
    setSpeaking(false);
    collectSymbol(clue.symbol);
    advanceToNextStop();
    // Wait for next tick to ensure Zustand persistence completes
    setTimeout(() => {
      router.push(`/quest/celebration/${stopNumber}`);
    }, 50);
  };

  const handlePhotoCapture = () => {
    // Unlock audio on first user gesture (for iOS)
    if (!audioUnlocked) {
      unlockAudioContext();
      unlockAudio();
    }
    setShowCamera(true);
  };

  if (!clue) {
    router.push('/quest/finale');
    return null;
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <Starfield />

      {/* Tap to Start Overlay - Required for mobile audio */}
      {showTapPrompt && !audioUnlocked && (
        <div
          className="fixed inset-0 z-50 bg-white/95 flex flex-col items-center justify-center cursor-pointer"
          onClick={handleTapToStart}
        >
          <div className="text-center px-8">
            <div className="text-6xl sm:text-8xl mb-6 animate-bounce">🔊</div>
            <h2 className="text-2xl sm:text-3xl font-serif text-slate-800 mb-4">
              Tap to Hear Clue {stopNumber}
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mb-8">
              {clue.name}
            </p>
            <div className="inline-block px-8 py-4 bg-amber-100 border-2 border-amber-600 rounded-full">
              <span className="text-amber-700 font-bold tracking-widest uppercase text-sm">
                Tap Anywhere
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header - Progress Stars */}
      <header className="relative z-10 p-3 sm:p-6 glass-light border-b-0">
        {/* Reset button - top left corner */}
        <button
          onClick={handleResetGame}
          className="absolute top-3 left-3 sm:top-6 sm:left-6 text-slate-300 hover:text-slate-500 transition-colors p-2 text-lg sm:text-xl"
          title="Start Over"
        >
          ⚙️
        </button>

        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-2">
            <ElapsedTimer />
          </div>
          <div className="flex justify-center gap-2 sm:gap-3 mb-2">
            {CLUES.map((_, i) => (
              <div
                key={i}
                className={`text-base sm:text-xl transition-all duration-500 ${
                  i < stopNumber - 1
                    ? 'text-amber-700 drop-shadow-[0_0_8px_rgba(245,209,126,0.6)]'
                    : i === stopNumber - 1
                    ? 'text-slate-800 animate-pulse'
                    : 'text-slate-300'
                }`}
              >
                ★
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] tracking-[0.2em] font-sans uppercase text-slate-400">
            <span>Bennett Quest</span>
            <span>Stop {stopNumber}/8</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-3 sm:p-6 overflow-y-auto scrollbar-hide">
        <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
          
          {/* Play Clue Button - Prominent */}
          {!isSpeaking ? (
            <button
              onClick={playClueAudio}
              className="w-full py-4 flex items-center justify-center gap-3 bg-amber-100 border-2 border-amber-400 text-amber-700 rounded-2xl hover:bg-amber-200 transition-all mb-4"
            >
              <span className="text-2xl">🔊</span>
              <span className="tracking-widest uppercase text-sm font-bold">Play Clue</span>
            </button>
          ) : (
            <button
              onClick={() => {
                stopAudio();
                setSpeaking(false);
              }}
              className="w-full py-4 flex items-center justify-center gap-3 bg-red-500/20 border-2 border-red-500/50 text-red-300 rounded-2xl hover:bg-red-500/30 transition-all mb-4"
            >
              <span className="text-2xl">⏹️</span>
              <span className="tracking-widest uppercase text-sm font-bold">Stop Audio</span>
            </button>
          )}

          {/* Granddaddy Clue Card */}
          <div className="glass-light rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-glass border-white/5">
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                <div className={`absolute inset-0 bg-amber-100 rounded-full blur-xl ${isSpeaking ? 'animate-pulse scale-110' : ''}`}></div>
                <div className={`relative z-10 w-full h-full rounded-full border-2 border-amber-200 overflow-hidden shadow-xl ${isSpeaking ? 'ring-2 ring-star-gold/30' : ''}`}>
                  <Image src="/granddaddy.webp" alt="Granddaddy" fill className="object-cover" priority />
                </div>
              </div>
              <div className="pt-1 sm:pt-2 flex-1">
                <p className="text-amber-700 text-[10px] sm:text-xs font-sans tracking-widest uppercase mb-1">Granddaddy Says:</p>
              </div>
            </div>
            <p className="text-base sm:text-xl leading-relaxed font-serif italic text-glow text-slate-800">
              &ldquo;{clue.verse}&rdquo;
            </p>
          </div>

          {/* Scripture Card */}
          <div className="glass-light rounded-2xl p-6 border-l-2 border-amber-300 shadow-xl">
            <p className="text-amber-700 text-xs font-sans tracking-[0.2em] uppercase mb-3">The Word</p>
            <p className="text-slate-700 text-base italic font-scripture leading-relaxed">
              &ldquo;{clue.scriptureText}&rdquo;
            </p>
            <p className="text-slate-400 text-xs mt-4 text-right font-sans tracking-widest uppercase">
              — {clue.scripture}
            </p>
          </div>

          {/* User Message */}
          {lastUserMessage && (
            <div className="glass-light rounded-2xl p-4 border border-blue-500/20 animate-in fade-in">
              <p className="text-blue-300 text-sm italic">
                You: &ldquo;{lastUserMessage}&rdquo;
              </p>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="glass-light rounded-2xl p-4 border border-amber-200 animate-pulse">
              <p className="text-amber-700 text-sm">Granddaddy is thinking...</p>
            </div>
          )}

          {/* Granddaddy Chat Response */}
          {granddaddyResponse && !isProcessing && (
            <div className="glass-light rounded-2xl p-4 border border-amber-200 animate-in zoom-in-95">
              <div className="flex items-start gap-3">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <Image src="/granddaddy.webp" alt="Granddaddy" fill className="rounded-full object-cover border border-amber-200" />
                </div>
                <p className="text-slate-700 text-base leading-relaxed">
                  {granddaddyResponse}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="relative z-10 p-3 sm:p-6 pb-6 sm:pb-10 glass-light border-t-0 rounded-t-2xl sm:rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto space-y-3">
          {/* Text Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textInput.trim() && !isProcessing) {
                handleUserMessage(textInput.trim());
                setTextInput('');
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ask Granddaddy..."
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-amber-50 border border-amber-200/60 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-amber-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="px-4 py-3 bg-amber-100 border border-amber-300 text-amber-700 rounded-xl disabled:opacity-50 active:scale-95 transition-all"
            >
              ➤
            </button>
          </form>

          {/* Found It Button */}
          <button
            onClick={handlePhotoCapture}
            disabled={isProcessing}
            className="premium-button w-full py-4 sm:py-5 px-3 sm:px-4 flex items-center justify-center gap-2 sm:gap-3"
          >
            <span className="text-xl sm:text-2xl">📷</span>
            <span className="tracking-widest uppercase text-xs sm:text-sm">Found it!</span>
          </button>
        </div>

        {/* Parent Override - Small discrete button */}
        <button
          onClick={() => setShowOverrideModal(true)}
          className="w-full mt-3 py-2 text-[10px] font-sans tracking-[0.2em] uppercase text-slate-300 hover:text-slate-400 transition-colors"
        >
          Parent Override
        </button>
      </footer>

      {/* Camera Modal */}
      {showCamera && (
        <CameraModal
          stopNumber={stopNumber}
          onClose={() => setShowCamera(false)}
          onSuccess={handleSuccess}
          targetGPS={clue.gps}
        />
      )}

      {/* Parent Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md" onClick={() => setShowOverrideModal(false)}></div>
          <div className="relative z-10 glass-light border-amber-200/40 rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="text-slate-800 text-lg font-serif text-center mb-4">Parent Override</h3>
            <p className="text-slate-400 text-xs text-center mb-4">Enter code to skip to next clue</p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={overridePassword}
              onChange={(e) => setOverridePassword(e.target.value)}
              placeholder="Enter 4-digit code"
              className={`w-full px-4 py-3 bg-amber-50 border ${overrideError ? 'border-red-500' : 'border-amber-200/60'} rounded-xl text-slate-800 text-center text-xl tracking-[0.5em] placeholder:text-slate-300 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-amber-400`}
              autoFocus
            />
            {overrideError && (
              <p className="text-red-400 text-xs text-center mt-2">Incorrect code</p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowOverrideModal(false);
                  setOverridePassword('');
                  setOverrideError(false);
                }}
                className="flex-1 py-3 text-xs tracking-widest uppercase text-slate-400 border border-amber-200/40 rounded-xl hover:bg-amber-50/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleParentOverride}
                className="flex-1 py-3 text-xs tracking-widest uppercase bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md" onClick={() => setShowResetConfirm(false)}></div>
          <div className="relative z-10 glass-light border-amber-200/40 rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="text-slate-800 text-lg font-serif text-center mb-4">Start Over?</h3>
            <p className="text-slate-400 text-sm text-center mb-6">All progress will be lost.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 text-xs tracking-widest uppercase text-slate-400 border border-amber-200/40 rounded-xl hover:bg-amber-50/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetGame}
                className="flex-1 py-3 text-xs tracking-widest uppercase bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Camera Modal Component with GPS + Photo verification
function CameraModal({
  stopNumber,
  onClose,
  onSuccess,
  targetGPS,
}: {
  stopNumber: number;
  onClose: () => void;
  onSuccess: () => void;
  targetGPS?: string;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingGPS, setIsCheckingGPS] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'success' | 'far' | 'error'>('idle');
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [gpsAttempts, setGpsAttempts] = useState(0);
  const [error, setError] = useState('');

  const MAX_GPS_ATTEMPTS = 5;

  // GPS verification
  const checkGPS = async () => {
    if (!targetGPS) {
      setError('No GPS coordinates for this stop');
      return;
    }

    // Check attempts
    if (gpsAttempts >= MAX_GPS_ATTEMPTS) {
      setError('GPS attempts exhausted. Use photo verification instead.');
      return;
    }

    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError('GPS not supported on this device');
      setGpsStatus('error');
      return;
    }

    setIsCheckingGPS(true);
    setGpsStatus('checking');
    setError('');
    setGpsAttempts(prev => prev + 1);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { isWithinRadius, GPS_RADIUS_METERS } = await import('@/lib/game/gps');
      const result = isWithinRadius(
        position.coords.latitude,
        position.coords.longitude,
        targetGPS,
        GPS_RADIUS_METERS
      );

      setGpsDistance(result.distance);

      if (result.isClose) {
        setGpsStatus('success');
        setTimeout(() => onSuccess(), 1000);
      } else {
        setGpsStatus('far');
        if (gpsAttempts >= MAX_GPS_ATTEMPTS) {
          setError('GPS attempts exhausted. Use photo verification instead.');
        }
      }
    } catch (err) {
      console.error('GPS error:', err);
      setGpsStatus('error');

      const geoError = err as GeolocationPositionError;
      if (geoError.code === 1) {
        setError('Location permission denied. Go to Settings → Safari → Location → Allow');
      } else if (geoError.code === 2) {
        setError('Could not determine location. Make sure GPS is enabled.');
      } else if (geoError.code === 3) {
        setError('Location request timed out. Try again.');
      } else {
        setError('Could not get location. Enable GPS and try again.');
      }
    } finally {
      setIsCheckingGPS(false);
    }
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setPhoto(reader.result as string);
      await verifyPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  // Photo verification - uses AI to check if correct location
  const verifyPhoto = async (base64: string) => {
    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo: base64,
          stopNumber,
        }),
      });

      const data = await res.json();

      if (data.isCorrect) {
        onSuccess();
      } else {
        setError(data.granddaddyResponse || "That doesn't look quite right. Try again!");
        setPhoto(null); // Clear photo to allow retry
      }
    } catch (err) {
      console.error('Photo verification error:', err);
      setError('Verification failed. Try again or use GPS.');
      setPhoto(null);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative z-10 glass-light border-amber-200/40 rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-hidden">
        {/* Decorative corner stars */}
        <div className="absolute top-2 left-2 text-amber-100 text-xs">★</div>
        <div className="absolute top-2 right-2 text-amber-100 text-xs">★</div>

        <h2 className="text-xl font-serif text-slate-800 text-center mb-6 tracking-wide">Prove Your Finding</h2>

        {/* GPS Attempts Counter - Always visible */}
        {targetGPS && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full">
              <span className="text-lg">📍</span>
              <span className="text-slate-800 font-bold text-lg">{MAX_GPS_ATTEMPTS - gpsAttempts}</span>
              <span className="text-slate-500 text-sm">GPS tries left</span>
            </div>
          </div>
        )}

        {/* GPS Verification - Primary method */}
        {targetGPS && (
          <div className="mb-6">
            <button
              onClick={checkGPS}
              disabled={isCheckingGPS || gpsStatus === 'success' || gpsAttempts >= MAX_GPS_ATTEMPTS}
              className={`w-full py-4 rounded-2xl border-2 transition-all ${
                gpsStatus === 'success'
                  ? 'bg-green-500/30 border-green-500/60 text-green-300'
                  : gpsAttempts >= MAX_GPS_ATTEMPTS
                  ? 'bg-amber-50 border-amber-200/60 text-slate-400 cursor-not-allowed'
                  : gpsStatus === 'far'
                  ? 'bg-orange-500/30 border-orange-500/60 text-orange-300'
                  : gpsStatus === 'error'
                  ? 'bg-red-500/30 border-red-500/60 text-red-300'
                  : 'bg-amber-100 border-amber-400 text-amber-700 hover:bg-amber-200'
              }`}
            >
              {isCheckingGPS ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm tracking-widest uppercase">Checking Location...</span>
                </div>
              ) : gpsStatus === 'success' ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">✓</span>
                  <span className="text-sm tracking-widest uppercase">You found it!</span>
                </div>
              ) : gpsAttempts >= MAX_GPS_ATTEMPTS ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm tracking-widest uppercase">No GPS Tries Left</span>
                  <span className="text-xs opacity-70">Take a photo instead!</span>
                </div>
              ) : gpsStatus === 'far' ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm tracking-widest uppercase">Not quite! {gpsDistance}m away</span>
                  <span className="text-xs opacity-70">Try again or move closer</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📍</span>
                  <span className="text-sm tracking-widest uppercase">Verify My Location</span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Photo Verification - Fallback */}
        <div className="border-t border-amber-200/40 pt-4">
          <p className="text-slate-400 text-[10px] text-center mb-3 tracking-widest uppercase">Or use photo</p>
          {photo ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-200">
              <img src={photo} alt="Captured" className="w-full aspect-[4/3] object-cover" />
              {isVerifying && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <div className="text-amber-700 text-xs tracking-widest uppercase font-bold">Verifying...</div>
                </div>
              )}
            </div>
          ) : (
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
              />
              <div className="py-3 px-4 rounded-xl border border-amber-200/60 bg-amber-50/50 flex items-center justify-center gap-2 hover:bg-amber-50 transition-colors">
                <span className="text-xl">📷</span>
                <span className="text-slate-500 text-xs tracking-widest uppercase">Take Photo</span>
              </div>
            </label>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center mt-4 uppercase tracking-widest">{error}</p>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 py-4 text-xs tracking-[0.3em] uppercase text-slate-400 font-bold hover:text-slate-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

