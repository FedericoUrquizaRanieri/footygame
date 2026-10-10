"use client";

import { useEffect, useState } from "react";
import { challengeDateFor } from "@/domain/daily-date";
import { computeStats, type Stats } from "@/domain/stats";
import { useI18n } from "@/i18n/provider";
import { formatClock } from "@/lib/format";
import { readHistory } from "@/lib/history-store";
import s from "./game.module.css";

/** Tus números del desafío diario: racha, mejor tiempo y saltos promedio. Solo aparece si ya jugaste. */
export function StatsPanel() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // El historial vive en el navegador: se lee una vez montado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(computeStats(readHistory(), challengeDateFor(Date.now())));
  }, []);

  if (!stats || stats.played === 0) return null;

  const days = (n: number) => t(n === 1 ? "stats.day" : "stats.days", { n });
  return (
    <section className={s.statsPanel} aria-labelledby="stats-title">
      <h2 id="stats-title" className={s.statsTitle}>
        {t("stats.title")}
      </h2>
      <div className={s.statsGrid}>
        <div className={s.statTile}>
          <span className={s.statTileLabel}>{t("stats.streak")}</span>
          <span className={s.statTileValue}>{days(stats.currentStreak)}</span>
        </div>
        <div className={s.statTile}>
          <span className={s.statTileLabel}>{t("stats.bestStreak")}</span>
          <span className={s.statTileValue}>{days(stats.bestStreak)}</span>
        </div>
        <div className={s.statTile}>
          <span className={s.statTileLabel}>{t("stats.bestTime")}</span>
          <span className={s.statTileValue}>
            {stats.bestTimeMs === null ? t("stats.none") : formatClock(stats.bestTimeMs)}
          </span>
        </div>
        <div className={s.statTile}>
          <span className={s.statTileLabel}>{t("stats.avgJumps")}</span>
          <span className={s.statTileValue}>
            {stats.averageJumps === null ? t("stats.none") : stats.averageJumps.toFixed(1)}
          </span>
        </div>
      </div>
      <p className={s.statsNote}>
        {t("stats.record", { won: stats.won, played: stats.played })}
        {stats.optimalSolves > 0 && `. ${t("stats.optimal", { n: stats.optimalSolves })}`}
      </p>
    </section>
  );
}
