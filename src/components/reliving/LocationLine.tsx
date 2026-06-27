"use client";

import { useState, useTransition } from "react";
import { setPhotoLocationVisible } from "@/app/app/c/[id]/p/[photoId]/actions";

export function LocationLine({
  photoId,
  capsuleId,
  locationName,
  visible,
  canToggle,
}: {
  photoId: string;
  capsuleId: string;
  locationName: string;
  visible: boolean;
  canToggle: boolean;
}) {
  const [isVisible, setIsVisible] = useState(visible);
  const [, startTransition] = useTransition();

  // For non-uploaders, respect the hidden state entirely.
  if (!isVisible && !canToggle) return null;

  function toggle() {
    const next = !isVisible;
    setIsVisible(next);
    startTransition(async () => {
      const result = await setPhotoLocationVisible(photoId, capsuleId, next);
      if (result?.error) setIsVisible(!next);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="font-mono text-xs text-ink-dim">
        📍 {isVisible ? locationName : "Ort verborgen"}{" "}
        <span className="text-ink-faint">· autom. erkannt</span>
      </p>
      {canToggle && (
        <button
          onClick={toggle}
          className="font-mono text-[0.65rem] text-glow underline"
        >
          {isVisible ? "verbergen" : "anzeigen"}
        </button>
      )}
    </div>
  );
}
