/// <reference types="vite/client" />

interface Window { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition; }
interface SpeechRecognition extends EventTarget { continuous: boolean; interimResults: boolean; lang: string; onstart: (() => void) | null; onend: (() => void) | null; onerror: (() => void) | null; onresult: ((event: SpeechRecognitionEvent) => void) | null; start(): void; }
interface SpeechRecognitionEvent extends Event { results: { [index: number]: { [index: number]: { transcript: string }; length: number }; length: number }; }

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
