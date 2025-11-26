/**
 * Hook pour gérer un timer/chronomètre
 */

import { useState, useEffect, useRef } from 'react';

export interface UseTimerReturn {
  time: number; // Temps en secondes
  formattedTime: string; // Format MM:SS
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useTimer(): UseTimerReturn {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const start = () => {
    setIsRunning(true);
  };

  const stop = () => {
    setIsRunning(false);
  };

  const reset = () => {
    setTime(0);
    setIsRunning(false);
  };

  // Formater le temps en MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    time,
    formattedTime: formatTime(time),
    isRunning,
    start,
    stop,
    reset,
  };
}

