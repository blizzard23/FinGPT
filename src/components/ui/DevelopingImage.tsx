"use client";

import Image, { ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type DevelopingImageProps = Omit<ImageProps, "onLoad"> & {
  containerClassName?: string;
};

const DEVELOP_DURATION_MS = 1500;

export function DevelopingImage({
  className,
  containerClassName,
  ...imageProps
}: DevelopingImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const developed = isLoaded && (reducedMotion || isVisible);

  // Announce the first time a photo finishes developing — the emotional beat the
  // install / push opt-in is timed to (Phase 6).
  const announced = useRef(false);
  useEffect(() => {
    if (developed && !announced.current) {
      announced.current = true;
      window.dispatchEvent(new CustomEvent("nachklang:developed"));
    }
  }, [developed]);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden", containerClassName)}
    >
      <Image
        {...imageProps}
        onLoad={() => setIsLoaded(true)}
        className={cn(
          reducedMotion
            ? ""
            : "transition-[filter] ease-out",
          className
        )}
        style={{
          transitionDuration: reducedMotion ? "0ms" : `${DEVELOP_DURATION_MS}ms`,
          filter: developed
            ? "blur(0px) brightness(1) saturate(1) sepia(0)"
            : "blur(14px) brightness(0.55) saturate(0.25) sepia(0.15)",
          ...imageProps.style,
        }}
      />
    </div>
  );
}
