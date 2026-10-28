/// <reference types="vite/client" />

interface Window { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition; }
interface SpeechRecognition extends EventTarget { continuous: boolean; interimResults: boolean; lang: string; onstart: (() => void) | null; onend: (() => void) | null; onerror: ((event: Event) => void) | null; onresult: ((event: SpeechRecognitionEvent) => void) | null; start(): void; stop?(): void; abort?(): void; }
interface SpeechRecognitionResult { readonly isFinal: boolean; readonly length: number; [index: number]: { readonly transcript: string; readonly confidence?: number }; }
interface SpeechRecognitionResultList { readonly length: number; [index: number]: SpeechRecognitionResult; }
interface SpeechRecognitionEvent extends Event { readonly resultIndex: number; readonly results: SpeechRecognitionResultList; }

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
