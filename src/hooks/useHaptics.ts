import { useEffect, useRef } from 'react';

export function useHapticFeedback() {
  // Web fallback — uses the Vibration API where available
  const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  return {
    impactMedium: () => {
      if (supported) navigator.vibrate(15);
    },
    selection: () => {
      if (supported) navigator.vibrate(8);
    },
    notificationSuccess: () => {
      if (supported) navigator.vibrate([10, 30, 10]);
    },
    notificationError: () => {
      if (supported) navigator.vibrate([30, 40, 30, 40, 30]);
    },
  };
}

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
