import { useCallback, useEffect, useRef } from 'react';

type WindowWithWebKitAudio = Window & { webkitAudioContext?: typeof AudioContext };

/**
 * Overlay-scoped Web Audio context.
 *
 * Returns a getter that lazily creates the `AudioContext` the first time it is
 * called (call it from a pointer/key handler so the browser treats it as a user
 * gesture) and resumes it if suspended. Returns `null` when Web Audio is
 * unavailable, so every caller must keep a visual cue. The context is closed on
 * unmount.
 */
export function useHobbyAudio(): () => AudioContext | null {
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(function closeAudioContextOnUnmount() {
    return () => {
      const context = contextRef.current;
      contextRef.current = null;
      if (context) void context.close().catch(() => undefined);
    };
  }, []);

  return useCallback(() => {
    if (!contextRef.current) {
      if (typeof window === 'undefined') return null;
      const AudioCtor = window.AudioContext ?? (window as WindowWithWebKitAudio).webkitAudioContext;
      if (!AudioCtor) return null;
      try {
        contextRef.current = new AudioCtor();
      } catch {
        return null;
      }
    }
    const context = contextRef.current;
    if (context.state === 'suspended') void context.resume().catch(() => undefined);
    return context;
  }, []);
}
