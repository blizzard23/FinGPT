"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { addNote } from "@/app/app/c/[id]/p/[photoId]/actions";
import type { NoteSource } from "@/lib/supabase/types";

// Minimal typing for the (prefixed) Web Speech API.
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
};

export function NoteComposer({
  photoId,
  capsuleId,
}: {
  photoId: string;
  capsuleId: string;
}) {
  const [text, setText] = useState("");
  const [source, setSource] = useState<NoteSource>("text");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    setVoiceSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function toggleVoice() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "de-DE";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, i) =>
        event.results[i][0].transcript
      ).join(" ");
      setText((t) => (t ? `${t} ${transcript}` : transcript));
      setSource("voice");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function submit() {
    if (!text.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addNote(photoId, capsuleId, text, source);
      if (result?.error) {
        setError(result.error);
      } else {
        setText("");
        setSource("text");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSource("text");
          }}
          rows={2}
          placeholder="Was ist hier passiert?"
          className="min-h-12 flex-1 resize-none rounded-xl border border-line bg-night px-4 py-3 text-ink placeholder:text-ink-faint focus:border-glow focus:outline-none"
        />
        {voiceSupported && (
          <button
            onClick={toggleVoice}
            aria-label="Per Sprache aufnehmen"
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg transition-colors",
              listening
                ? "border-coral bg-coral/20 text-coral"
                : "border-line text-ink-dim hover:border-glow"
            )}
          >
            {listening ? "■" : "🎙"}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between">
        {error ? (
          <span className="text-xs text-coral">{error}</span>
        ) : (
          <span className="font-mono text-[0.65rem] text-ink-faint">
            Freiwillig — eine Zeile genügt.
          </span>
        )}
        <Button onClick={submit} disabled={pending || !text.trim()} className="px-4 py-2 text-sm">
          {pending ? "…" : "Festhalten"}
        </Button>
      </div>
    </div>
  );
}
