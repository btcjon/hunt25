'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { CLUES, BACKUP_KEYWORDS } from '@/lib/game/clues';
import { speak } from '@/lib/voice/elevenlabs';
import { speakFallback } from '@/lib/voice/webSpeech';
import { startListening, stopListening, isSpeechRecognitionSupported } from '@/lib/voice/webSpeech';
import Starfield from '@/components/game/Starfield';

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
    recordHint,
    setSpeaking,
    isSpeaking,
    isListening,
    setListening,
    addMessage,
    chatHistory,
    collectSymbol,
    advanceToNextStop,
  } = useGameStore();

  const [showHint, setShowHint] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [granddaddyResponse, setGranddaddyResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const clue = CLUES[stopNumber - 1];

  // Speak the clue on load
  const speakClue = useCallback(async () => {
    if (!clue) return;
    setSpeaking(true);
    try {
      try {
        await speak(clue.verse);
      } catch {
        await speakFallback(clue.verse);
      }
    } finally {
      setSpeaking(false);
    }
  }, [clue, setSpeaking]);

  useEffect(() => {
    const timer = setTimeout(() => speakClue(), 500);
    return () => clearTimeout(timer);
  }, [speakClue]);

  // Handle voice input
  const handleTalk = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Voice recognition not supported in this browser');
      return;
    }

    setListening(true);
    setTranscript('');

    startListening({
      onResult: (result) => {
        setTranscript(result.transcript);
        if (result.isFinal) {
          handleUserMessage(result.transcript);
        }
      },
      onError: (error) => {
        console.error('Speech recognition error:', error);
        setListening(false);
      },
      onEnd: () => {
        setListening(false);
      },
    });
  };

  const handleStopListening = () => {
    stopListening();
    setListening(false);
  };

  // Send message to Granddaddy
  const handleUserMessage = async (message: string) => {
    setListening(false);
    setIsProcessing(true);
    addMessage('user', message);

    // Check for backup keyword
    const keyword = BACKUP_KEYWORDS[stopNumber];
    if (keyword && message.toUpperCase().includes(keyword)) {
      const response = "Ah, I see a wise helper gave you the secret! Onward we go!";
      setGranddaddyResponse(response);
      addMessage('granddaddy', response);
      await speakResponse(response);
      handleSuccess();
      return;
    }

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
      try {
        await speak(text);
      } catch {
        await speakFallback(text);
      }
    } finally {
      setSpeaking(false);
    }
  };

  const handleSuccess = () => {
    collectSymbol(clue.symbol);
    advanceToNextStop();
    router.push(`/quest/celebration/${stopNumber}`);
  };

  const handleShowHint = () => {
    recordHint(stopNumber);
    setShowHint(true);
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
      <header className="relative z-10 p-6 glass-indigo border-b-0">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center gap-3 mb-2">
            {CLUES.map((_, i) => (
              <div
                key={i}
                className={`text-xl transition-all duration-500 ${
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
          <div className="flex items-center justify-between text-[10px] tracking-[0.2em] font-sans uppercase text-white/50">
            <span>The Bennett Quest</span>
            <span>Stop {stopNumber} of 8</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-6 overflow-y-auto scrollbar-hide">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Granddaddy Clue Card */}
          <div className="glass-indigo rounded-3xl p-6 shadow-glass border-white/5">
            <div className="flex items-start gap-4 mb-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <div className={`absolute inset-0 bg-star-gold/20 rounded-full blur-xl ${isSpeaking ? 'animate-pulse scale-110' : ''}`}></div>
                <div className={`relative z-10 w-full h-full rounded-full border border-star-gold/30 glass flex items-center justify-center text-4xl shadow-xl ${isSpeaking ? 'ring-2 ring-star-gold/30' : ''}`}>
                  👴
                </div>
              </div>
              <div className="pt-2">
                <p className="text-star-gold text-xs font-sans tracking-widest uppercase mb-1">Granddaddy</p>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs">Clue is ready</span>
                  <button onClick={speakClue} className="text-star-gold hover:text-white transition-colors">
                    <span className="text-lg">🔊</span>
                  </button>
                </div>
              </div>
            </div>
            <p className="text-white text-xl leading-relaxed font-serif italic text-glow">
              &ldquo;{clue.verse}&rdquo;
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

          {/* Hint Section */}
          <div className="pt-2">
            {showHint ? (
              <div className="glass-indigo rounded-2xl p-5 border border-star-gold/20 animate-in fade-in slide-in-from-top-2">
                <p className="text-star-gold text-sm font-sans mb-1 uppercase tracking-widest">A Little Light:</p>
                <p className="text-white/80 text-base italic">
                  {clue.hint}
                </p>
              </div>
            ) : (
              <button
                onClick={handleShowHint}
                className="w-full py-4 text-xs font-sans tracking-[0.3em] uppercase text-white/30 border border-white/5 rounded-2xl hover:bg-white/5 transition-all"
              >
                Seeking a Hint?
              </button>
            )}
          </div>

          {/* Granddaddy Chat Response */}
          {granddaddyResponse && (
            <div className="glass-indigo rounded-2xl p-5 border border-star-gold/30 animate-in zoom-in-95">
              <p className="text-white/90 text-base leading-relaxed">
                👴 {granddaddyResponse}
              </p>
            </div>
          )}

          {/* Transcript / Listening State */}
          {(isListening || transcript) && (
            <div className="glass-indigo rounded-2xl p-4 border border-blue-500/20">
              <p className="text-blue-300 text-sm italic">
                {isListening ? 'Granddaddy is listening...' : `You: "${transcript}"`}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="relative z-10 p-6 pb-10 glass-indigo border-t-0 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
          {/* Talk Button */}
          {isListening ? (
            <button
              onClick={handleStopListening}
              className="py-5 px-4 bg-red-900/40 border border-red-500/50 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3 animate-pulse"
            >
              <span className="text-2xl">⏹</span>
              <span className="tracking-widest uppercase text-sm">Stop</span>
            </button>
          ) : (
            <button
              onClick={handleTalk}
              disabled={isSpeaking || isProcessing}
              className="py-5 px-4 glass border border-white/20 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95 transition-all"
            >
              <span className="text-2xl">🎤</span>
              <span className="tracking-widest uppercase text-sm">Talk</span>
            </button>
          )}

          {/* Found It Button */}
          <button
            onClick={handlePhotoCapture}
            disabled={isSpeaking || isProcessing}
            className="premium-button py-5 px-4 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">📷</span>
            <span className="tracking-widest uppercase text-sm">Found it!</span>
          </button>
        </div>
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
        />
      )}
    </div>
  );
}

// Updated Camera Modal Component
function CameraModal({
  stopNumber,
  onClose,
  onSuccess,
  onPartial,
}: {
  stopNumber: number;
  onClose: () => void;
  onSuccess: () => void;
  onPartial: (response: string) => void;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

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
          <div className="aspect-[4/3] glass bg-white/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/10">
            <label className="cursor-pointer text-center group">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
              />
              <div className="w-24 h-24 bg-star-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-star-gold/20 group-hover:scale-110 transition-transform duration-500">
                <span className="text-5xl">📷</span>
              </div>
              <p className="text-white/60 text-sm tracking-widest uppercase">Tap to Capture</p>
            </label>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-xs text-center mt-4 uppercase tracking-widest">{error}</p>
        )}

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 text-xs tracking-[0.3em] uppercase text-white/40 font-bold hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

