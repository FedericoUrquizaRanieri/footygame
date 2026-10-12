import { useId, type CSSProperties, type ReactNode } from "react";
import { clubLookFor, readableOn, type ClubLook } from "@/lib/club-colors";
import { kitFor } from "@/lib/kits";
import s from "./ui.module.css";

const OUTLINE = "M10 8 H90 V62 C90 92 68 108 50 114 C32 108 10 92 10 62 Z";

/** Dibujo del patrón sobre el fondo; se recorta con la silueta del escudo. */
function Pattern({ look }: { look: ClubLook }): ReactNode {
  const c = look.secondary;
  switch (look.pattern) {
    case "stripes":
      return [1, 3, 5, 7].map((i) => (
        <rect key={i} x={10 + i * 10} y="0" width="10" height="120" fill={c} />
      ));
    case "halves":
      return <rect x="50" y="0" width="50" height="120" fill={c} />;
    case "hoops":
      return [26, 58, 90].map((y) => <rect key={y} x="0" y={y} width="100" height="16" fill={c} />);
    case "band":
      return <rect x="0" y="46" width="100" height="26" fill={c} />;
    case "sash":
      return <line x1="0" y1="0" x2="100" y2="120" stroke={c} strokeWidth="28" />;
    case "chevron":
      return <polyline points="0,26 50,74 100,26" fill="none" stroke={c} strokeWidth="16" />;
    case "cross":
      return (
        <>
          <rect x="43" y="0" width="14" height="120" fill={c} />
          <rect x="0" y="50" width="100" height="14" fill={c} />
        </>
      );
    default:
      return null;
  }
}

interface ShieldProps {
  /** Id del club; define los colores. Sin id, se dibuja el escudo "misterioso" de la ruta. */
  id?: number;
  name?: string;
  /** Texto del escudo "misterioso" (por defecto "?"). */
  label?: string;
  size?: string;
  className?: string;
}

/**
 * Escudo ilustrativo del club (no es el oficial): colores y diseño de camiseta reales sobre una
 * silueta propia. La silueta distingue clubes (escudo) de jugadores (círculo).
 */
export function Shield({ id, name, label, size, className }: ShieldProps) {
  const clipId = `shield-${useId().replace(/\W/g, "")}`;
  const mystery = id === undefined || name === undefined;
  const look = mystery ? null : clubLookFor(id);
  const base = mystery ? null : kitFor(id);
  const kit = look ? { bg: look.primary, fg: readableOn(look.primary) } : base;
  const style = size ? ({ "--s": size } as CSSProperties) : undefined;
  return (
    <svg
      className={[s.shield, className].filter(Boolean).join(" ")}
      style={style}
      viewBox="0 0 100 120"
      aria-hidden="true"
      focusable="false"
    >
      {look && (
        <clipPath id={clipId}>
          <path d={OUTLINE} />
        </clipPath>
      )}
      <path
        d={OUTLINE}
        fill={kit ? kit.bg : "none"}
        style={{ stroke: kit ? "var(--ring, #f1f3ec)" : "rgba(241,243,236,0.74)" }}
        strokeWidth="5"
        strokeDasharray={kit ? undefined : "8 7"}
        strokeLinejoin="round"
      />
      {look && (
        <g clipPath={`url(#${clipId})`}>
          <Pattern look={look} />
        </g>
      )}
      {look && (
        <path
          d={OUTLINE}
          fill="none"
          style={{ stroke: "var(--ring, #f1f3ec)" }}
          strokeWidth="5"
          strokeLinejoin="round"
        />
      )}
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
      {!kit && (
        <text x="50" y="72" textAnchor="middle" fontSize="44" fill="rgba(241,243,236,0.74)">
          {label ?? "?"}
        </text>
      )}
    </svg>
  );
}
