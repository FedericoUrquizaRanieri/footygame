import { formatClock } from "@/lib/format";
import s from "./game.module.css";

/** Reloj con dígitos de ancho fijo para que no "tiemble" al cambiar los segundos. */
export function Clock({ ms, big = false }: { ms: number; big?: boolean }) {
  const text = formatClock(ms);
  return (
    <span className={big ? `${s.clock} ${s.big}` : s.clock} role="timer">
      <span className="sr-only">{text}</span>
      {[...text].map((ch, i) => (
        <span key={i} className={ch === ":" ? s.colon : s.digit} aria-hidden="true">
          {ch}
        </span>
      ))}
    </span>
  );
}
