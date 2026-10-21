"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import type { Difficulty } from "@/domain/difficulty";
import { useI18n } from "@/i18n/provider";
import type { TodaysChallenge } from "@/lib/challenge-types";
import { formatChallengeDate } from "@/lib/format";
import { readTodaySession } from "@/lib/game-store";
import { Countdown } from "./Countdown";
import { LevelMeter } from "./LevelBadge";
import s from "./game.module.css";

type Status = "won" | "lost" | "playing" | "new";

/** Los dos desafíos de hoy: elegís cuál jugar y ves cuál ya resolviste. */
export function DailyHub({ challenges }: { challenges: TodaysChallenge[] }) {
  const { locale, t } = useI18n();
  const [statuses, setStatuses] = useState<Partial<Record<Difficulty, Status>>>({});

  useEffect(() => {
    // Las partidas viven en el navegador: se leen una vez montado.
    const next: Partial<Record<Difficulty, Status>> = {};
    for (const c of challenges) {
      const status = readTodaySession(c.difficulty)?.game.status;
      if (status === "won" || status === "lost" || status === "playing")
        next[c.difficulty] = status;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatuses(next);
  }, [challenges]);

  if (challenges.length === 0) {
    return (
      <div className={s.briefing}>
        <div className={s.panel}>
          <h1 className={s.panelTitle}>{t("daily.noChallenge")}</h1>
          <p className={s.hint}>{t("daily.noChallengeHint")}</p>
          <Link className="btn btn-ghost" href={`/${locale}`}>
            {t("daily.back")}
          </Link>
        </div>
      </div>
    );
  }

  const label: Record<Status, string> = {
    won: t("archive.statusWon"),
    lost: t("archive.statusLost"),
    playing: t("archive.statusPlaying"),
    new: t("archive.statusNew"),
  };
  const chip: Record<Status, string> = {
    won: s.chipWon,
    lost: s.chipLost,
    playing: s.chipPlaying,
    new: s.chipNew,
  };

  return (
    <div className={s.archive}>
      <div>
        <h1 className={s.archiveTitle}>{t("daily.hubTitle")}</h1>
        <p className={s.archiveNote}>
          {t("landing.challengeOf", { date: formatChallengeDate(challenges[0].date, locale) })}
        </p>
      </div>

      <ul className={s.archiveList}>
        {challenges.map((c, i) => {
          const status = statuses[c.difficulty] ?? "new";
          return (
            <li key={c.id}>
              <Link
                className={`${s.archiveRow} ${c.difficulty === "hard" ? s.hubHard : s.hubNormal}`}
                href={`/${locale}/daily/${c.difficulty}`}
                style={{ "--i": i } as CSSProperties}
              >
                <span className={s.archiveDate}>{t(`difficulty.${c.difficulty}`)}</span>
                <span className={s.archiveRoute}>
                  {t("archive.route", { from: c.origin.name, to: c.destination.name })}
                </span>
                <span className={s.archiveLevel}>
                  <LevelMeter difficulty={c.difficulty} />
                  {t(`difficulty.${c.difficulty}Hint`)}
                </span>
                <span className={`${s.chip} ${chip[status]}`}>{label[status]}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className={s.hint}>
        {t("daily.nextIn", { time: "" }).trim()} <Countdown />
      </p>
    </div>
  );
}
