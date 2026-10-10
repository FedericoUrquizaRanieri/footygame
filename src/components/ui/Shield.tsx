import type { CSSProperties } from "react";
import { initials, kitFor } from "@/lib/kits";
import s from "./ui.module.css";

const OUTLINE = "M10 8 H90 V62 C90 92 68 108 50 114 C32 108 10 92 10 62 Z";

interface ShieldProps {
  /** Id del club; define los colores. Sin id, se dibuja el escudo "misterioso" de la ruta. */
  id?: number;
  name?: string;
  /** Texto del escudo "misterioso" (por defecto "?"). */
  label?: string;
  size?: string;
  className?: string;
}

/** Escudo de club de reemplazo: la silueta distingue clubes (escudo) de jugadores (círculo). */
export function Shield({ id, name, label, size, className }: ShieldProps) {
  const mystery = id === undefined || name === undefined;
  const kit = mystery ? null : kitFor(id);
  const style = size ? ({ "--s": size } as CSSProperties) : undefined;
  return (
    <svg
      className={[s.shield, className].filter(Boolean).join(" ")}
      style={style}
      viewBox="0 0 100 120"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={OUTLINE}
        fill={kit ? kit.bg : "none"}
        style={{ stroke: kit ? "var(--ring, #f1f3ec)" : "rgba(241,243,236,0.74)" }}
        strokeWidth="5"
        strokeDasharray={kit ? undefined : "8 7"}
        strokeLinejoin="round"
      />
      {kit && (
        <path
          d={OUTLINE}
          transform="translate(7.5 9) scale(0.85)"
          fill="none"
          stroke={kit.fg}
          strokeOpacity="0.35"
          strokeWidth="2"
        />
      )}
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fontSize="44"
        fill={kit ? kit.fg : "rgba(241,243,236,0.74)"}
      >
        {kit ? initials(name!) : (label ?? "?")}
      </text>
    </svg>
  );
}
