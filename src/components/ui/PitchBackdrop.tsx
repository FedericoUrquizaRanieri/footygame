import type { ReactNode } from "react";
import s from "./backdrop.module.css";

export type PitchZone = "center" | "box" | "corner";

/**
 * Cada pantalla es otra zona de la misma cancha: se cambia el encuadre (viewBox) del dibujo, no el dibujo.
 * Medidas de una cancha de 105 x 68 m a 10 unidades por metro, con 30 de margen.
 */
const FRAMES: Record<PitchZone, { viewBox: string; align: string }> = {
  center: { viewBox: "-30 -30 1110 740", align: "xMidYMid" },
  box: { viewBox: "-60 100 580 480", align: "xMinYMid" },
  corner: { viewBox: "720 380 380 340", align: "xMaxYMax" },
};

interface PitchBackdropProps {
  zone?: PitchZone;
  /** Más tenue, para las pantallas donde hay que leer y decidir (el juego). */
  calm?: boolean;
  /** Ocupa solo su contenedor (el héroe). Por defecto cubre toda la ventana y no se mueve al hacer scroll. */
  contained?: boolean;
}

/** Césped con franjas, grano, luz de reflectores y las marcas de la cancha. Decorativo. */
export function PitchBackdrop({
  zone = "center",
  calm = false,
  contained = false,
}: PitchBackdropProps) {
  const frame = FRAMES[zone];
  const className = [s.backdrop, "pitch", calm ? s.calm : "", contained ? s.contained : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={className} aria-hidden="true">
      <svg
        className={s.lines}
        viewBox={frame.viewBox}
        preserveAspectRatio={`${frame.align} slice`}
        focusable="false"
      >
        <g fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke">
          <PitchMarks />
        </g>
      </svg>
    </div>
  );
}

function PitchMarks(): ReactNode {
  return (
    <>
      <rect x="0" y="0" width="1050" height="680" />
      <path d="M525 0V680" />
      <circle cx="525" cy="340" r="91.5" />
      <circle cx="525" cy="340" r="5" fill="currentColor" />
      {/* Área grande, área chica, punto penal, medialuna y arco: izquierda y derecha */}
      <path d="M0 138H165V542H0M0 248H55V432H0" />
      <path d="M1050 138H885V542H1050M1050 248H995V432H1050" />
      <circle cx="110" cy="340" r="5" fill="currentColor" />
      <circle cx="940" cy="340" r="5" fill="currentColor" />
      <path d="M165 266.9A91.5 91.5 0 0 1 165 413.1" />
      <path d="M885 266.9A91.5 91.5 0 0 0 885 413.1" />
      <path d="M-24 303.4H0V376.6H-24ZM1074 303.4H1050V376.6H1074Z" />
      <path d="M10 0A10 10 0 0 1 0 10M1040 0A10 10 0 0 0 1050 10M0 670A10 10 0 0 1 10 680M1050 670A10 10 0 0 0 1040 680" />
    </>
  );
}
