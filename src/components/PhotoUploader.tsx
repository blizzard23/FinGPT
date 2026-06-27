"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function PhotoUploader({ capsuleId }: { capsuleId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const form = new FormData();
    Array.from(files).forEach((file) => form.append("files", file));

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", `/api/capsules/${capsuleId}/photos`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      setProgress(null);
      xhrRef.current = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        router.refresh();
      } else {
        setError("Upload fehlgeschlagen. Bitte erneut versuchen.");
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      xhrRef.current = null;
      setError("Netzwerkfehler beim Upload.");
    };

    setProgress(0);
    xhr.send(form);
  }

  function abort() {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setProgress(null);
  }

  const uploading = progress !== null;

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {!uploading ? (
        <Button onClick={() => inputRef.current?.click()} variant="secondary">
          Fotos hinzufügen
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-glow transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-ink-faint">
              {progress}% — wird hochgeladen…
            </span>
            <button
              onClick={abort}
              className="font-mono text-xs text-coral underline"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-coral">{error}</p>}
    </div>
  );
}
