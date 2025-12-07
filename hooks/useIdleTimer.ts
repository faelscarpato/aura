import { useEffect, useCallback, useRef } from 'react';
import { useAuraStore } from '../store';

export const useIdleTimer = (timeoutMs: number = 60000, throttleMs: number = 1000) => {
  const { registerActivity, setSmartFrameActive, isSmartFrameActive, lastActivityAt } = useAuraStore();
  const lastThrottleTime = useRef<number>(Date.now());

  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottleTime.current >= throttleMs) {
      registerActivity();
      lastThrottleTime.current = now;
    }
  }, [registerActivity, throttleMs]);

  useEffect(() => {
    // Events to track
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];

    const onEvent = () => handleActivity();

    // Add listeners to window
    events.forEach(event => {
      window.addEventListener(event, onEvent, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, onEvent);
      });
    };
  }, [handleActivity]);

  // Check for idle
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastActivityAt) return;
      const now = Date.now();
      const diff = now - lastActivityAt;
      
      if (diff > timeoutMs && !isSmartFrameActive) {
        setSmartFrameActive(true);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [lastActivityAt, isSmartFrameActive, setSmartFrameActive, timeoutMs]);
};
