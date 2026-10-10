"use client";

import { useEffect, useState } from "react";

/**
 * Hora actual (ms) que se actualiza cada `intervalMs`; con `null` queda quieta.
 * Vale 0 hasta montarse: leer la hora durante el prerender no está permitido (Cache Components).
 */
export function useNow(intervalMs: number | null): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (intervalMs === null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
