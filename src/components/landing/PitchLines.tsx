import s from "./landing.module.css";

/** Marcas de la cancha (líneas de tiza) de fondo: línea de mitad, círculo central y áreas. */
export function PitchLines() {
  return (
    <svg
      className={s.lines}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="4">
        <rect x="30" y="30" width="1140" height="740" rx="6" />
        <path d="M600 30 V770" />
        <circle cx="600" cy="400" r="120" />
        <circle cx="600" cy="400" r="6" fill="currentColor" />
        <path d="M30 230 H190 V570 H30" />
        <path d="M30 330 H90 V470 H30" />
        <path d="M1170 230 H1010 V570 H1170" />
        <path d="M1170 330 H1110 V470 H1170" />
      </g>
    </svg>
  );
}
