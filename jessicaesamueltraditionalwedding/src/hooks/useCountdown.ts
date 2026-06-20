"use client";

import { useEffect, useState } from "react";

export type CountdownValues = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
};

function calculateCountdown(targetDate: Date): CountdownValues {
  const now = new Date().getTime();
  const distance = targetDate.getTime() - now;

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
    isComplete: false,
  };
}

export function useCountdown(targetDate: Date): CountdownValues {
  const [countdown, setCountdown] = useState<CountdownValues>(() =>
    calculateCountdown(targetDate),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
}

export function padTime(value: number): string {
  return value.toString().padStart(2, "0");
}
