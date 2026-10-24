import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: () => void;
  onFocus?: () => void;
  className?: string;
}

const PLACEHOLDERS = [
  'Search for parcel pickup',
  'Search for home assistance',
  'Search for event helpers',
  'Search for computer repair',
  'Search for nearby tasks',
];

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  onFocus,
  className = '',
}) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Rotate placeholder every 3 seconds if search input is empty
  useEffect(() => {
    if (value) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [value]);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onChange(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onChange]);

  const toggleVoiceSearch = () => {
    if (!voiceSupported) {
      alert('Voice search is not supported in this browser version. You can type directly.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className={`relative select-none ${className}`}>
      <div className="flex items-center bg-white rounded-2xl border border-neutral-200/80 shadow-quick px-3.5 py-2.5 transition focus-within:ring-2 focus-within:ring-part-green focus-within:border-part-green">
        <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-2.5" />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[placeholderIndex]}
          className="w-full bg-transparent text-xs sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-all duration-300"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition mr-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={toggleVoiceSearch}
          title={isListening ? 'Listening...' : 'Voice Search'}
          className={`p-1.5 rounded-full transition ${
            isListening
              ? 'bg-rose-100 text-rose-600 animate-pulse'
              : 'text-neutral-400 hover:text-part-green hover:bg-neutral-100'
          }`}
        >
          {isListening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      </div>

      {isListening && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-part-green text-white text-[11px] font-semibold py-1 px-3 rounded-lg text-center shadow-md animate-fade-in z-20">
          Listening to your neighborhood task request...
        </div>
      )}
    </div>
  );
};
