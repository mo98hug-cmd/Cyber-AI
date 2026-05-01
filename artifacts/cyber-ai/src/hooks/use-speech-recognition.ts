import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }
}

export type SpeechLanguage = 'en-US' | 'ar-SA';

export function useSpeechRecognition(
  onResult: (text: string) => void,
  language: SpeechLanguage = 'en-US'
) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasSupport, setHasSupport] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  const languageRef = useRef(language);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    languageRef.current = language;
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const instance = new SpeechRecognitionClass();
    instance.continuous = false;
    instance.interimResults = false;
    instance.lang = languageRef.current;

    instance.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      onResultRef.current(text);
      setIsRecording(false);
    };

    instance.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    instance.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = instance;
    setHasSupport(true);

    return () => {
      instance.abort();
    };
  }, []);

  const toggleRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.lang = languageRef.current;
      recognition.start();
      setIsRecording(true);
    }
  }, [isRecording]);

  return { isRecording, toggleRecording, hasSupport };
}
