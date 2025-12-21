'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { CLUES } from '@/lib/game/clues';
import { speak, stopAudio } from '@/lib/voice/elevenlabs';
// Browser fallback removed - ElevenLabs only
import Starfield from '@/components/game/Starfield';
import ReplayAudio from '@/components/game/ReplayAudio';
import KaraokeText from '@/components/game/KaraokeText';

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
  } = useGameStore();

  const [granddaddyResponse, setGranddaddyResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePassword, setOverridePassword] = useState('');
  const [overrideError, setOverrideError] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');

  const clue = CLUES[stopNumber - 1];

  // Speak the clue on load
  const speakClue = useCallback(async () => {
    if (!clue) return;
    setSpeaking(true);
    try {
      await speak(clue.verse);
    } catch (error) {
      console.error('ElevenLabs failed:', error);
    } finally {
      setSpeaking(false);
    }
  }, [clue, setSpeaking]);

  // No auto-play - user presses button to hear clue

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
      await speakResponse(response);
      setShowCamera(true);
      setIsProcessing(false);
      return;
    }

    // Chat with Granddaddy
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

      const data = await res.json();

      // Auto-unlock if description matched 2+ visual identifiers
      // Don't speak - celebration page will handle audio
      if (data.shouldUnlock) {
        setGranddaddyResponse(data.response);
        addMessage('granddaddy', data.response);
        handleSuccess();
        return;
      }

      setGranddaddyResponse(data.response);
      addMessage('granddaddy', data.response);
      await speakResponse(data.response);

      if (data.shouldTriggerPhoto) {
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const fallback = "Hmm, I couldn't quite hear that. Try again!";
      setGranddaddyResponse(fallback);
      await speakResponse(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string) => {
    setSpeaking(true);
    try {
      await speak(text);
    } catch (error) {
      console.error('ElevenLabs failed:', error);
    } finally {
      setSpeaking(false);
    }
  };

  const handleSuccess = () => {
    stopAudio(); // Stop any playing audio before navigating
    setSpeaking(false);
    collectSymbol(clue.symbol);
    advanceToNextStop();
    router.push(`/quest/celebration/${stopNumber}`);
  };

  const handlePhotoCapture = () => {
    setShowCamera(true);
  };

  if (!clue) {
    router.push('/quest/finale');
    return null;
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <Starfield />
      
      {/* Header - Progress Stars */}
      <header className="relative z-10 p-3 sm:p-6 glass-indigo border-b-0">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center gap-2 sm:gap-3 mb-2">
            {CLUES.map((_, i) => (
              <div
                key={i}
                className={`text-base sm:text-xl transition-all duration-500 ${
                  i < stopNumber - 1
                    ? 'text-star-gold drop-shadow-[0_0_8px_rgba(245,209,126,0.6)]'
                    : i === stopNumber - 1
                    ? 'text-white animate-pulse'
                    : 'text-white/20'
                }`}
              >
                ★
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] tracking-[0.2em] font-sans uppercase text-white/50">
            <span>Bennett Quest</span>
            <span>Stop {stopNumber}/8</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-3 sm:p-6 overflow-y-auto scrollbar-hide">
        <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
          
          {/* Granddaddy Clue Card */}
          <div className="glass-indigo rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-glass border-white/5">
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0">
                <div className={`absolute inset-0 bg-star-gold/20 rounded-full blur-xl ${isSpeaking ? 'animate-pulse scale-110' : ''}`}></div>
                <div className={`relative z-10 w-full h-full rounded-full border-2 border-star-gold/30 overflow-hidden shadow-xl ${isSpeaking ? 'ring-2 ring-star-gold/30' : ''}`}>
                  <img src="/granddaddy.png" alt="Granddaddy" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="pt-1 sm:pt-2 flex-1">
                <p className="text-star-gold text-[10px] sm:text-xs font-sans tracking-widest uppercase mb-1">Granddaddy</p>
                <ReplayAudio onReplay={speakClue} isPlaying={isSpeaking} onStop={() => setSpeaking(false)} />
              </div>
            </div>
            <p className="text-base sm:text-xl leading-relaxed font-serif italic text-glow">
              &ldquo;<KaraokeText
                text={clue.verse}
                isPlaying={isSpeaking}
                wordsPerMinute={130}
                highlightClassName="text-white"
              />&rdquo;
            </p>
          </div>

          {/* Scripture Card */}
          <div className="glass-indigo rounded-2xl p-6 border-l-2 border-star-gold/40 shadow-xl">
            <p className="text-star-gold text-xs font-sans tracking-[0.2em] uppercase mb-3">The Word</p>
            <p className="text-white/90 text-base italic font-scripture leading-relaxed">
              &ldquo;{clue.scriptureText}&rdquo;
            </p>
            <p className="text-white/40 text-xs mt-4 text-right font-sans tracking-widest uppercase">
              — {clue.scripture}
            </p>
          </div>

          {/* User Message */}
          {lastUserMessage && (
            <div className="glass-indigo rounded-2xl p-4 border border-blue-500/20 animate-in fade-in">
              <p className="text-blue-300 text-sm italic">
                You: &ldquo;{lastUserMessage}&rdquo;
              </p>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="glass-indigo rounded-2xl p-4 border border-star-gold/30 animate-pulse">
              <p className="text-star-gold text-sm">Granddaddy is thinking...</p>
            </div>
          )}

          {/* Granddaddy Chat Response */}
          {granddaddyResponse && !isProcessing && (
            <div className="glass-indigo rounded-2xl p-4 border border-star-gold/30 animate-in zoom-in-95">
              <div className="flex items-start gap-3">
                <img src="/granddaddy.png" alt="Granddaddy" className="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-star-gold/30" />
                <p className="text-white/90 text-base leading-relaxed">
                  {granddaddyResponse}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="relative z-10 p-3 sm:p-6 pb-6 sm:pb-10 glass-indigo border-t-0 rounded-t-2xl sm:rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto space-y-3">
          {/* Play/Stop Clue Audio Button */}
          {!isSpeaking ? (
            <button
              onClick={speakClue}
              className="w-full py-3 flex items-center justify-center gap-2 bg-star-gold/20 border border-star-gold/40 text-star-gold rounded-xl hover:bg-star-gold/30 transition-all"
            >
              <span className="text-lg">🔊</span>
              <span className="tracking-widest uppercase text-xs font-bold">Play Clue</span>
            </button>
          ) : (
            <button
              onClick={() => {
                stopAudio();
                setSpeaking(false);
              }}
              className="w-full py-3 flex items-center justify-center gap-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl hover:bg-red-500/30 transition-all"
            >
              <span className="text-lg">⏹️</span>
              <span className="tracking-widest uppercase text-xs font-bold">Stop Audio</span>
            </button>
          )}

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
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-star-gold/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="px-4 py-3 bg-star-gold/20 border border-star-gold/40 text-star-gold rounded-xl disabled:opacity-50 active:scale-95 transition-all"
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
          className="w-full mt-3 py-2 text-[10px] font-sans tracking-[0.2em] uppercase text-white/20 hover:text-white/40 transition-colors"
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
          onPartial={(response) => {
            setGranddaddyResponse(response);
            speakResponse(response);
          }}
          targetGPS={clue.gps}
        />
      )}

      {/* Parent Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-midnight/90 backdrop-blur-md" onClick={() => setShowOverrideModal(false)}></div>
          <div className="relative z-10 glass-indigo border-white/10 rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="text-white text-lg font-serif text-center mb-4">Parent Override</h3>
            <p className="text-white/50 text-xs text-center mb-4">Enter code to skip to next clue</p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={overridePassword}
              onChange={(e) => setOverridePassword(e.target.value)}
              placeholder="Enter 4-digit code"
              className={`w-full px-4 py-3 bg-white/10 border ${overrideError ? 'border-red-500' : 'border-white/20'} rounded-xl text-white text-center text-xl tracking-[0.5em] placeholder:text-white/30 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-star-gold/50`}
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
                className="flex-1 py-3 text-xs tracking-widest uppercase text-white/50 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleParentOverride}
                className="flex-1 py-3 text-xs tracking-widest uppercase bg-star-gold text-midnight font-bold rounded-xl hover:bg-star-gold/90 transition-colors"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Updated Camera Modal Component with GPS verification
function CameraModal({
  stopNumber,
  onClose,
  onSuccess,
  onPartial,
  targetGPS,
}: {
  stopNumber: number;
  onClose: () => void;
  onSuccess: () => void;
  onPartial: (response: string) => void;
  targetGPS?: string;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingGPS, setIsCheckingGPS] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'success' | 'far' | 'error'>('idle');
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [error, setError] = useState('');

  // GPS verification
  const checkGPS = async () => {
    if (!targetGPS) {
      setError('No GPS coordinates for this stop');
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

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000, // Longer timeout for mobile
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
      }
    } catch (err) {
      console.error('GPS error:', err);
      setGpsStatus('error');

      // Provide specific error messages
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
      } else if (data.confidence >= 50) {
        onPartial(data.granddaddyResponse + (data.followUpQuestion ? ` ${data.followUpQuestion}` : ''));
        onClose();
      } else {
        onPartial(data.granddaddyResponse);
        onClose();
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Could not verify photo. Try again!');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-midnight/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative z-10 glass-indigo border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-hidden">
        {/* Decorative corner stars */}
        <div className="absolute top-2 left-2 text-star-gold/20 text-xs">★</div>
        <div className="absolute top-2 right-2 text-star-gold/20 text-xs">★</div>

        <h2 className="text-xl font-serif text-white text-center mb-6 tracking-wide">Prove Your Finding</h2>

        {/* GPS Verification - Primary method */}
        {targetGPS && (
          <div className="mb-6">
            <button
              onClick={checkGPS}
              disabled={isCheckingGPS || gpsStatus === 'success'}
              className={`w-full py-4 rounded-2xl border-2 transition-all ${
                gpsStatus === 'success'
                  ? 'bg-green-500/30 border-green-500/60 text-green-300'
                  : gpsStatus === 'far'
                  ? 'bg-orange-500/30 border-orange-500/60 text-orange-300'
                  : gpsStatus === 'error'
                  ? 'bg-red-500/30 border-red-500/60 text-red-300'
                  : 'bg-star-gold/20 border-star-gold/50 text-star-gold hover:bg-star-gold/30'
              }`}
            >
              {isCheckingGPS ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-star-gold border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm tracking-widest uppercase">Checking Location...</span>
                </div>
              ) : gpsStatus === 'success' ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">✓</span>
                  <span className="text-sm tracking-widest uppercase">You found it!</span>
                </div>
              ) : gpsStatus === 'far' ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm tracking-widest uppercase">Not quite! {gpsDistance}m away</span>
                  <span className="text-xs opacity-70">Tap to try again</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📍</span>
                  <span className="text-sm tracking-widest uppercase">Verify My Location</span>
                </div>
              )}
            </button>
            <p className="text-white/30 text-[10px] text-center mt-2 tracking-wider">Must be within 15 meters</p>
          </div>
        )}

        {/* Photo Verification - Fallback */}
        <div className="border-t border-white/10 pt-4">
          <p className="text-white/40 text-[10px] text-center mb-3 tracking-widest uppercase">Or use photo</p>
          {photo ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-star-gold/30">
              <img src={photo} alt="Captured" className="w-full aspect-[4/3] object-cover" />
              {isVerifying && (
                <div className="absolute inset-0 bg-midnight/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-star-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                  <div className="text-star-gold text-xs tracking-widest uppercase font-bold">Verifying...</div>
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
              <div className="py-3 px-4 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                <span className="text-xl">📷</span>
                <span className="text-white/60 text-xs tracking-widest uppercase">Take Photo</span>
              </div>
            </label>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center mt-4 uppercase tracking-widest">{error}</p>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 py-4 text-xs tracking-[0.3em] uppercase text-white/40 font-bold hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

