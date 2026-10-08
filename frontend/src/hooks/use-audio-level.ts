"use client";

import { useEffect, useState } from "react";

/** Live microphone input level between 0 and 1, for the "is my mic working?" meter. */
export function useAudioLevel(stream: MediaStream | null): number {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0 || typeof AudioContext === "undefined") {
      setLevel(0);
      return;
    }

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    context.createMediaStreamSource(stream).connect(analyser);
    const samples = new Uint8Array(analyser.frequencyBinCount);

    let frame = 0;
    const tick = () => {
      analyser.getByteFrequencyData(samples);
      const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      setLevel(Math.min(1, average / 80));
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      void context.close();
    };
  }, [stream]);

  return level;
}
