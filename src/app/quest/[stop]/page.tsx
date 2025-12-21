'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game/state';
import { CLUES, BACKUP_KEYWORDS } from '@/lib/game/clues';
import { speak } from '@/lib/voice/elevenlabs';
import { speakFallback } from '@/lib/voice/webSpeech';
import { startListening, stopListening, isSpeechRecognitionSupported } from '@/lib/voice/webSpeech';

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
    // For now, just navigate to camera - we'll implement full camera later
    setShowCamera(true);
  };

  if (!clue) {
    router.push('/quest/finale');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Header - Progress */}
      <header className="p-4 bg-midnight/80 backdrop-blur-sm shadow-lg border-b border-sacred-gold/20">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Progress Dots */}
          <div className="flex gap-1">
            {CLUES.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < stopNumber - 1
                    ? 'bg-sacred-gold'
                    : i === stopNumber - 1
                    ? 'bg-candlelight animate-pulse'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-soft-ivory font-lora">
            Stop {stopNumber}/8
          </span>
        </div>
        {/* Collected Symbols */}
        {collectedSymbols.length > 0 && (
          <div className="text-center mt-2 text-3xl">
            {collectedSymbols.join(' ')}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Granddaddy + Clue */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-xl mb-4 border-2 border-sacred-gold/30">
            <div className="flex items-start gap-3">
              <div className={`w-14 h-14 bg-gradient-to-br from-candlelight to-amber-600 rounded-full flex items-center justify-center text-3xl flex-shrink-0 ${isSpeaking ? 'animate-pulse ring-4 ring-sacred-gold/50' : ''}`}>
                👴
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sacred-blue mb-1 font-lora">Granddaddy</p>
                <p className="text-sacred-blue whitespace-pre-line text-lg leading-relaxed">
                  {clue.verse}
                </p>
              </div>
            </div>
          </div>

          {/* Scripture */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4 border-l-4 border-sacred-gold">
            <p className="text-base text-soft-ivory italic font-lora">
              📖 <strong>{clue.scripture}</strong>
            </p>
            <p className="text-base text-soft-ivory/90 mt-2 italic">
              &ldquo;{clue.scriptureText}&rdquo;
            </p>
          </div>

          {/* Hint */}
          {showHint ? (
            <div className="bg-candlelight/20 backdrop-blur-sm rounded-xl p-4 mb-4 border border-sacred-gold/30">
              <p className="text-base text-soft-ivory">
                💡 <strong>Hint:</strong> {clue.hint}
              </p>
            </div>
          ) : (
            <button
              onClick={handleShowHint}
              className="w-full py-3 text-base text-soft-ivory bg-white/10 border border-sacred-gold/30 rounded-xl mb-4 hover:bg-white/20 transition-all"
            >
              💡 Need a hint?
            </button>
          )}

          {/* Granddaddy Response */}
          {granddaddyResponse && (
            <div className="bg-sacred-gold/30 backdrop-blur-sm rounded-xl p-4 mb-4 border border-sacred-gold">
              <p className="text-base text-soft-ivory">
                👴 {granddaddyResponse}
              </p>
            </div>
          )}

          {/* Transcript */}
          {(isListening || transcript) && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-4 border border-sacred-gold/30">
              <p className="text-base text-sacred-blue">
                🎤 {transcript || 'Listening...'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer - Action Buttons */}
      <footer className="p-4 bg-midnight/90 backdrop-blur-sm border-t border-sacred-gold/30">
        <div className="max-w-md mx-auto flex gap-4">
          {/* Talk Button */}
          {isListening ? (
            <button
              onClick={handleStopListening}
              className="flex-1 py-5 text-xl font-bold text-white bg-red-500 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-pulse"
            >
              <span className="text-3xl">🎤</span>
              STOP
            </button>
          ) : (
            <button
              onClick={handleTalk}
              disabled={isSpeaking || isProcessing}
              className="flex-1 py-5 text-xl font-bold text-white bg-sacred-blue rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
            >
              <span className="text-3xl">🎤</span>
              TALK
            </button>
          )}

          {/* Found It Button */}
          <button
            onClick={handlePhotoCapture}
            disabled={isSpeaking || isProcessing}
            className="flex-1 py-5 text-xl font-bold text-white bg-sacred-gold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            <span className="text-3xl">📷</span>
            WE FOUND IT!
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

// Simple Camera Modal Component
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

    // Convert to base64
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
        // Partial match - ask follow-up
        onPartial(data.granddaddyResponse + (data.followUpQuestion ? ` ${data.followUpQuestion}` : ''));
        onClose();
      } else {
        // Wrong location
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
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-4">
        <h2 className="text-xl font-bold text-center mb-4">📷 Take a Photo!</h2>

        {photo ? (
          <div className="relative">
            <img src={photo} alt="Captured" className="w-full rounded-xl" />
            {isVerifying && (
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                <div className="text-white text-lg">Checking... 🔍</div>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-[#1E293B] rounded-xl flex items-center justify-center">
            <label className="cursor-pointer text-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
              />
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-4xl">📷</span>
              </div>
              <p className="text-white">Tap to take photo</p>
            </label>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-center mt-2">{error}</p>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-[#64748B] bg-[#F8FAFC] rounded-xl"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
