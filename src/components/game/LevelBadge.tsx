"use client";

import type { Difficulty } from "@/domain/difficulty";
import { useI18n } from "@/i18n/provider";
import s from "./game.module.css";

const BARS: Record<Difficulty, number> = { normal: 2, hard: 3 };

/** Solo las tres barras (decorativas): una por nivel de dificultad. */
export function LevelMeter({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={s.meter} aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= BARS[difficulty] ? s.meterOn : s.meterOff} />
      ))}
    </span>
  );
}

/** Nivel del desafío: tres barras (como una señal) y el nombre del nivel. */
export function LevelBadge({ difficulty }: { difficulty: Difficulty }) {
  const { t } = useI18n();
  return (
    <p className={s.level}>
      <LevelMeter difficulty={difficulty} />
      <span>
        {t("difficulty.label")}: <strong>{t(`difficulty.${difficulty}`)}</strong>
      </span>
    </p>
  );
}
