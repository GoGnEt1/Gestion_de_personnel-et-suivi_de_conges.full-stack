import { useEffect, useRef, useState } from "react";

export function useSlideshow(
  images: string[],
  intervalMs = 5000,
  startIndex = 0
) {
  const [index, setIndex] = useState<number>(startIndex);
  const [isPaused, setPaused] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // précharger images
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [images.length, intervalMs, isPaused]);

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const goTo = (i: number) => setIndex(i % images.length);

  return {
    index,
    src: images[index],
    isPaused,
    setPaused,
    next,
    prev,
    goTo,
  };
}
