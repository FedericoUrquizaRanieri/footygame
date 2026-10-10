"use client";

import { secondsUntilNextChallengeDay } from "@/domain/daily-date";
import { formatCountdown } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import s from "./game.module.css";

/** Cuenta regresiva hasta el próximo desafío (medianoche de Buenos Aires). */
export function Countdown() {
  const now = useNow(1000);
  return (
    <span className={s.countdown}>
      {now === 0 ? "--:--:--" : formatCountdown(secondsUntilNextChallengeDay(now))}
    </span>
  );
}
