"use client";

import { useEffect, useRef } from "react";

/** Un haz de luz que sigue al puntero sobre el césped. Solo con mouse y sin "reducir movimiento". */
export function PointerLight() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = marker.current?.parentElement;
    if (!host) return;
    if (!matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = host.getBoundingClientRect();
        host.style.setProperty("--mx", `${e.clientX - box.left}px`);
        host.style.setProperty("--my", `${e.clientY - box.top}px`);
      });
    };
    host.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <span ref={marker} hidden />;
}
