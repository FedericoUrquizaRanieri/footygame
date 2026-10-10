"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PassMap } from "@/components/landing/PassMap";
import { createGame, startGame } from "@/domain/game";
import { useI18n } from "@/i18n/provider";
import type { TodaysChallenge } from "@/lib/challenge-types";
import { formatChallengeDate } from "@/lib/format";
import {
  clearSession,
  readArchiveSession,
  readTodaySession,
  writeGame,
  writeLabels,
  type Scope,
  type Session,
} from "@/lib/game-store";
import { entryFromResult, recordResult } from "@/lib/history-store";
import { nodeKey } from "@/lib/steps";
import { Countdown } from "./Countdown";
import { LevelBadge } from "./LevelBadge";
import { StatsPanel } from "./StatsPanel";
import s from "./game.module.css";

interface BriefingScreenProps {
  challenge: TodaysChallenge | null;
  /** "daily": el desafío de hoy. "archive": un desafío pasado, de práctica (no cuenta para la racha). */
  mode?: "daily" | "archive";
}

/** Pantalla previa: de dónde salís, a dónde llegás, y el botón Empezar (el reloj arranca ahí, no antes). */
export function BriefingScreen({ challenge, mode = "daily" }: BriefingScreenProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const archive = mode === "archive";
  const scope: Scope = archive && challenge ? { archive: challenge.date } : "daily";
  const base = archive && challenge ? `/${locale}/archive/${challenge.date}` : `/${locale}/daily`;
  const date = challenge?.date;

  useEffect(() => {
    // Lee el almacenamiento del navegador una vez montado (en el servidor no existe).
    const saved = archive ? (date ? readArchiveSession(date) : null) : readTodaySession();
    // Una partida terminada antes de existir el historial también cuenta en tus números.
    if (saved?.result && saved.game.status !== "playing" && saved.game.status !== "ready") {
      recordResult(entryFromResult(saved.game, saved.result, mode));
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(saved);
  }, [archive, date, mode]);

  if (!challenge) {
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

  const start = () => {
    const game = startGame(
      createGame({
        id: challenge.id,
        date: challenge.date,
        originId: challenge.origin.id,
        destinationId: challenge.destination.id,
      }),
      Date.now(),
    );
    clearSession(scope);
    writeGame(game, scope);
    writeLabels(
      {
        [nodeKey({ type: "player", id: challenge.origin.id })]: challenge.origin.name,
        [nodeKey({ type: "player", id: challenge.destination.id })]: challenge.destination.name,
      },
      scope,
    );
    router.push(`${base}/play`);
  };

  const status = session?.game.status;
  const finished = status === "won" || status === "lost";
  const inProgress = status === "playing";
  const dateLabel = formatChallengeDate(challenge.date, locale);

  return (
    <div className={s.briefing}>
      <div>
        <h1 className={s.briefTitle}>
          {archive ? t("archive.briefTitle", { date: dateLabel }) : t("daily.title")}
        </h1>
        {!archive && <p className={s.briefDate}>{t("landing.challengeOf", { date: dateLabel })}</p>}
        <LevelBadge difficulty={challenge.difficulty} />
      </div>

      <PassMap
        t={t}
        origin={challenge.origin}
        destination={challenge.destination}
        animate={false}
        captions={{ origin: t("daily.from"), destination: t("daily.to") }}
      />

      {session === undefined && <div className={s.briefActions} aria-hidden="true" />}

      {finished && (
        <div className={s.panel}>
          <h2 className={s.panelTitle}>
            {archive ? t("archive.doneTitle") : t("daily.doneTitle")}
          </h2>
          {!archive && (
            <p>
              {t("daily.nextIn", { time: "" }).trim()} <Countdown />
            </p>
          )}
          <Link className="btn btn-primary" href={`${base}/play`}>
            {t("daily.seeSummary")}
          </Link>
        </div>
      )}

      {inProgress && (
        <div className={s.panel}>
          <h2 className={s.panelTitle}>{t("daily.continueTitle")}</h2>
          <Link className="btn btn-primary" href={`${base}/play`}>
            {t("daily.continue")}
          </Link>
        </div>
      )}

      {session === null && (
        <>
          <ul className={s.briefRules}>
            <li>{t("landing.rule1")}</li>
            <li>{t("landing.rule2")}</li>
            <li>{t("landing.rule3")}</li>
          </ul>
          <div className={s.briefActions}>
            <button type="button" className="btn btn-primary btn-wide" onClick={start}>
              {t("daily.start")}
            </button>
            <p className={s.hint}>{archive ? t("archive.practiceNote") : t("daily.startHint")}</p>
          </div>
        </>
      )}

      <div className={s.briefLinks}>
        <Link className="btn btn-ghost" href={`/${locale}/archive`}>
          {archive ? t("archive.backToList") : t("archive.link")}
        </Link>
      </div>

      {!archive && <StatsPanel />}
    </div>
  );
}
