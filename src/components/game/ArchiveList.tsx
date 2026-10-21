"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useI18n } from "@/i18n/provider";
import type { TodaysChallenge } from "@/lib/challenge-types";
import { archiveKey, readArchiveStatuses } from "@/lib/game-store";
import { readHistory } from "@/lib/history-store";
import { LevelMeter } from "./LevelBadge";
import s from "./game.module.css";

type Status = "won" | "lost" | "playing" | "new";

function shortDate(date: string, locale: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Lista de desafíos anteriores, con tu resultado si ya jugaste ese día. */
export function ArchiveList({ challenges }: { challenges: TodaysChallenge[] }) {
  const { locale, t } = useI18n();
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  useEffect(() => {
    // Mezcla lo que hay en el navegador: partidas de práctica y resultados del historial.
    const keys = new Set(challenges.map((c) => archiveKey(c.date, c.difficulty)));
    const fromHistory: Record<string, Status> = {};
    for (const e of readHistory()) {
      const key = archiveKey(e.date, e.difficulty);
      if (keys.has(key)) fromHistory[key] = e.result;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatuses({
      ...fromHistory,
      ...readArchiveStatuses(challenges.map((c) => ({ date: c.date, level: c.difficulty }))),
    });
  }, [challenges]);

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
        <h1 className={s.archiveTitle}>{t("archive.title")}</h1>
        <p className={s.archiveNote}>{t("archive.note")}</p>
      </div>

      {challenges.length === 0 ? (
        <div className={s.notice}>
          <p className={s.noticeTitle}>{t("archive.empty")}</p>
          <p className={s.noticeText}>{t("archive.emptyHint")}</p>
        </div>
      ) : (
        <ul className={s.archiveList}>
          {challenges.map((c, i) => {
            const status = statuses[archiveKey(c.date, c.difficulty)] ?? "new";
            return (
              <li key={c.id}>
                <Link
                  className={`${s.archiveRow} ${c.difficulty === "hard" ? s.hubHard : s.hubNormal}`}
                  href={`/${locale}/archive/${c.date}/${c.difficulty}`}
                  style={{ "--i": i } as CSSProperties}
                >
                  <span className={s.archiveDate}>{shortDate(c.date, locale)}</span>
                  <span className={s.archiveRoute}>
                    {t("archive.route", { from: c.origin.name, to: c.destination.name })}
                  </span>
                  <span className={s.archiveLevel}>
                    <LevelMeter difficulty={c.difficulty} />
                    {t(`difficulty.${c.difficulty}`)}
                  </span>
                  <span className={`${s.chip} ${chip[status]}`}>{label[status]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
