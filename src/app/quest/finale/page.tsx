'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { FINALE } from '@/lib/game/clues';
import { speakFinale, speak, stopAudio, unlockAudioContext } from '@/lib/voice/elevenlabs';
import Starfield from '@/components/game/Starfield';
import ElapsedTimer from '@/components/game/ElapsedTimer';

export default function FinalePage() {
  const router = useRouter();
  const {
    collectedSymbols,
    teamName,
    setSpeaking,
    isSpeaking,
    resetGame,
    audioUnlocked,
    unlockAudio,
    questStartTime,
    finaleCompletedTime,
    recordFinaleComplete,
  } = useGameStore();

  const [stage, setStage] = useState<'tap' | 'verse' | 'gps' | 'reveal' | 'complete'>('tap');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'success' | 'far' | 'error'>('idle');
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState('');

  const playFinaleVerse = useCallback(async () => {
    setSpeaking(true);
    try {
      await speakFinale();
    } catch (error) {
      console.error('Finale audio failed:', error);
    } finally {
      setSpeaking(false);
    }
  }, [setSpeaking]);

  const speakRevelation = useCallback(async () => {
    setSpeaking(true);
    try {
      // Calculate final time
      const finalTime = finaleCompletedTime && questStartTime
        ? formatTime(finaleCompletedTime - questStartTime)
        : '';
      const timeMessage = finalTime ? ` Your final time: ${finalTime}!` : '';
      const revelation = `${teamName}, together you found ALL 8 treasures! And now, the GREATEST treasure of all: Baby Jesus! ${FINALE.scripture} says: "${FINALE.scriptureText}"${timeMessage} Merry Christmas!`;
      await speak(revelation);
    } catch (error) {
      console.error('ElevenLabs failed:', error);
    } finally {
      setSpeaking(false);
    }
  }, [teamName, setSpeaking, finaleCompletedTime, questStartTime]);

  // Format time for speech
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h} hour${h > 1 ? 's' : ''}, ${m} minute${m !== 1 ? 's' : ''}, and ${s} second${s !== 1 ? 's' : ''}`;
    }
    return `${m} minute${m !== 1 ? 's' : ''} and ${s} second${s !== 1 ? 's' : ''}`;
  };

  // Handle tap to start finale
  const handleTapToStart = useCallback(async () => {
    unlockAudioContext();
    unlockAudio();
    setStage('verse');
    await playFinaleVerse();
    // After verse, show GPS modal
    setStage('gps');
  }, [unlockAudio, playFinaleVerse]);

  // If already unlocked, skip tap screen
  useEffect(() => {
    if (audioUnlocked && stage === 'tap') {
      const runVerse = async () => {
        setStage('verse');
        await playFinaleVerse();
        setStage('gps');
      };
      runVerse();
    }
  }, [audioUnlocked, stage, playFinaleVerse]);

  // GPS check for home base - NO retry limit
  const checkGPS = async () => {
    if (!FINALE.gps) {
      setGpsError('No GPS coordinates configured');
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('GPS not supported on this device');
      setGpsStatus('error');
      return;
    }

    setGpsStatus('checking');
    setGpsError('');

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
        FINALE.gps,
        GPS_RADIUS_METERS
      );

      setGpsDistance(result.distance);

      if (result.isClose) {
        setGpsStatus('success');
        recordFinaleComplete(); // Lock the timer!
        setTimeout(async () => {
          setStage('reveal');
          await speakRevelation();
          setStage('complete');
        }, 1500);
      } else {
        setGpsStatus('far');
      }
    } catch (err) {
      console.error('GPS error:', err);
      setGpsStatus('error');

      const geoError = err as GeolocationPositionError;
      if (geoError.code === 1) {
        setGpsError('Location permission denied. Enable in Settings.');
      } else if (geoError.code === 2) {
        setGpsError('Could not get location. Make sure GPS is enabled.');
      } else if (geoError.code === 3) {
        setGpsError('Location request timed out. Try again.');
      } else {
        setGpsError('GPS error. Try again.');
      }
    }
  };

  const handlePlayAgain = () => {
    stopAudio();
    resetGame();
    router.push('/');
  };

  // Calculate display time
  const getDisplayTime = () => {
    if (!questStartTime) return null;
    const endTime = finaleCompletedTime || Date.now();
    const totalSeconds = Math.floor((endTime - questStartTime) / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden bg-white">
      <Starfield />

      {/* Tap to Start Overlay */}
      {stage === 'tap' && !audioUnlocked && (
        <div
          className="fixed inset-0 z-50 bg-white/95 flex flex-col items-center justify-center cursor-pointer"
          onClick={handleTapToStart}
        >
          <div className="text-center px-8">
            <div className="text-6xl sm:text-8xl mb-6 animate-bounce">🏠</div>
            <h2 className="text-2xl sm:text-3xl font-serif text-slate-800 mb-4">
              Race Home!
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mb-8">
              The Greatest Treasure Awaits
            </p>
            <div className="inline-block px-8 py-4 bg-amber-100 border-2 border-amber-600 rounded-full">
              <span className="text-amber-700 font-bold tracking-widest uppercase text-sm">
                Tap to Continue
              </span>
            </div>
          </div>
        </div>
      )}

      {stage !== 'tap' && <FinaleGlow />}

      <main className="relative z-10 text-center max-w-lg w-full px-2 sm:px-4">
        {/* Timer - always visible */}
        <div className="flex justify-center mb-6">
          <ElapsedTimer />
        </div>

        {/* VERSE STAGE */}
        {stage === 'verse' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 opacity-60">
              {collectedSymbols.map((sym, i) => (
                <span key={i} className="text-2xl sm:text-4xl">{sym}</span>
              ))}
            </div>

            <div className="glass-light rounded-2xl sm:rounded-3xl p-6 sm:p-10 border-white/5 shadow-glass">
              <p className="text-slate-800 text-lg sm:text-2xl whitespace-pre-line leading-relaxed font-serif italic text-glow">
                {FINALE.verse}
              </p>
            </div>

            <p className="mt-6 text-amber-700 text-xs tracking-widest uppercase animate-pulse">
              {isSpeaking ? 'Speaking...' : 'Loading GPS...'}
            </p>
          </div>
        )}

        {/* GPS STAGE - Check in at Home */}
        {stage === 'gps' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="text-6xl sm:text-8xl mb-6 animate-bounce">🏠</div>
            <h2 className="text-2xl sm:text-3xl font-serif text-slate-800 mb-2">
              Race Home!
            </h2>
            <p className="text-slate-500 text-sm mb-8">
              Check in at Home Base to stop the clock!
            </p>

            <button
              onClick={checkGPS}
              disabled={gpsStatus === 'checking' || gpsStatus === 'success'}
              className={`w-full max-w-xs mx-auto py-5 rounded-2xl border-2 transition-all ${
                gpsStatus === 'success'
                  ? 'bg-green-500/30 border-green-500/60 text-green-300'
                  : gpsStatus === 'far'
                  ? 'bg-orange-500/30 border-orange-500/60 text-orange-300'
                  : gpsStatus === 'error'
                  ? 'bg-red-500/30 border-red-500/60 text-red-300'
                  : 'bg-amber-100 border-amber-400 text-amber-700 hover:bg-amber-200'
              }`}
            >
              {gpsStatus === 'checking' ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm tracking-widest uppercase">Checking Location...</span>
                </div>
              ) : gpsStatus === 'success' ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">✓</span>
                  <span className="text-sm tracking-widest uppercase">You&apos;re Home!</span>
                </div>
              ) : gpsStatus === 'far' ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm tracking-widest uppercase">Not quite! {gpsDistance}m away</span>
                  <span className="text-xs opacity-70">Keep going - tap to try again!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📍</span>
                  <span className="text-sm tracking-widest uppercase">I&apos;m Home!</span>
                </div>
              )}
            </button>

            {gpsError && (
              <p className="text-red-400 text-xs text-center mt-4">{gpsError}</p>
            )}

            <p className="text-slate-300 text-xs mt-6">
              No limit - keep trying until you&apos;re there!
            </p>
          </div>
        )}

        {/* REVEAL STAGE */}
        {(stage === 'reveal' || stage === 'complete') && (
          <div className="animate-in fade-in zoom-in duration-1000">
            {/* Big Baby Jesus */}
            <div className="relative mb-8 sm:mb-12 group">
              <div className="absolute inset-0 bg-amber-200 rounded-full blur-3xl scale-150 animate-pulse"></div>
              <div className="relative z-10 text-[100px] sm:text-[140px] drop-shadow-[0_0_50px_rgba(245,209,126,1)] animate-bounce duration-2000">
                👶
              </div>
            </div>

            <div className="mb-8 sm:mb-10">
              <h1 className="text-amber-700 text-xs sm:text-sm tracking-[0.4em] uppercase font-sans mb-2 drop-shadow-sm">
                The True Light
              </h1>
              <h2 className="text-4xl sm:text-6xl font-serif text-slate-800 text-glow mb-3">
                BABY JESUS
              </h2>
              <p className="text-slate-500 text-base sm:text-lg font-serif italic">
                The Greatest Treasure of All
              </p>
            </div>

            {/* Final Time Display - Prominent */}
            {finaleCompletedTime && (
              <div className="mb-8 p-4 bg-amber-100 border-2 border-amber-600 rounded-2xl">
                <p className="text-amber-700/80 text-xs tracking-widest uppercase mb-1">Final Time</p>
                <p className="text-amber-700 font-mono font-bold text-3xl sm:text-4xl">
                  {getDisplayTime()}
                </p>
              </div>
            )}

            {/* Symbols Bar */}
            <div className="flex justify-center items-center gap-2 sm:gap-3 mb-8 bg-amber-50/50 backdrop-blur-md rounded-full px-4 py-2 border border-amber-200/40 w-fit mx-auto">
              {collectedSymbols.map((sym, i) => (
                <span key={i} className="text-lg sm:text-2xl opacity-60">{sym}</span>
              ))}
              <span className="text-2xl sm:text-3xl text-amber-700 ml-2 animate-pulse">👶</span>
            </div>

            {/* Scripture */}
            <div className="glass-light rounded-2xl sm:rounded-3xl p-6 sm:p-10 mb-8 border-amber-200 shadow-[0_0_40px_rgba(245,209,126,0.15)]">
              <p className="text-lg sm:text-2xl text-slate-800 italic font-scripture leading-relaxed">
                &ldquo;{FINALE.scriptureText}&rdquo;
              </p>
              <div className="h-px w-12 bg-amber-300/40 mx-auto my-5"></div>
              <p className="text-amber-700 text-xs sm:text-sm tracking-widest uppercase font-sans">
                — {FINALE.scripture}
              </p>
            </div>

            {/* Team Victory */}
            <div className="mb-8">
              <p className="text-slate-600 text-lg sm:text-xl font-serif mb-2">
                Congratulations, <span className="text-amber-700 font-bold">{teamName}</span>!
              </p>
              <p className="text-slate-400 text-xs font-sans tracking-widest uppercase">
                Quest Completed • Christmas 2025
              </p>
            </div>

            {/* Play/Stop Audio */}
            {!isSpeaking ? (
              <button
                onClick={speakRevelation}
                className="w-full max-w-xs mx-auto py-3 mb-4 flex items-center justify-center gap-3 bg-amber-100 border-2 border-amber-400 text-amber-700 rounded-2xl hover:bg-amber-200 transition-all"
              >
                <span className="text-xl">🔊</span>
                <span className="tracking-widest uppercase text-xs font-bold">Play Message</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  stopAudio();
                  setSpeaking(false);
                }}
                className="w-full max-w-xs mx-auto py-3 mb-4 flex items-center justify-center gap-3 bg-red-500/20 border-2 border-red-500/50 text-red-300 rounded-2xl hover:bg-red-500/30 transition-all"
              >
                <span className="text-xl">⏹️</span>
                <span className="tracking-widest uppercase text-xs font-bold">Stop Audio</span>
              </button>
            )}

            {stage === 'complete' && (
              <button
                onClick={handlePlayAgain}
                className="premium-button w-full max-w-xs py-4 sm:py-6 text-base sm:text-xl tracking-widest uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000"
              >
                Merry Christmas!
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function FinaleGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[50vh] bg-gradient-to-t from-star-gold/20 to-transparent blur-3xl opacity-60"></div>
    </div>
  );
}
