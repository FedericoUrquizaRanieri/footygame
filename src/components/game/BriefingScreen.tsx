"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PassMap } from "@/components/landing/PassMap";
import { createGame, startGame } from "@/domain/game";
import { useI18n } from "@/i18n/provider";
import { formatChallengeDate } from "@/lib/format";
import {
  clearSession,
  readTodaySession,
  writeGame,
  writeLabels,
  type Session,
} from "@/lib/game-store";
import { nodeKey } from "@/lib/steps";
import type { TodaysChallenge } from "@/lib/challenge-types";
import { Countdown } from "./Countdown";
import s from "./game.module.css";

/** Pantalla previa: de dónde salís, a dónde llegás, y el botón Empezar (el reloj arranca ahí, no antes). */
export function BriefingScreen({ challenge }: { challenge: TodaysChallenge | null }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Lee el almacenamiento del navegador una vez montado (en el servidor no existe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(readTodaySession());
  }, []);

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
    clearSession();
    writeGame(game);
    writeLabels({
      [nodeKey({ type: "player", id: challenge.origin.id })]: challenge.origin.name,
      [nodeKey({ type: "player", id: challenge.destination.id })]: challenge.destination.name,
    });
    router.push(`/${locale}/daily/play`);
  };

  const status = session?.game.status;
  const finished = status === "won" || status === "lost";
  const inProgress = status === "playing";

  return (
    <div className={s.briefing}>
      <div>
        <h1 className={s.briefTitle}>{t("daily.title")}</h1>
        <p className={s.briefDate}>
          {t("landing.challengeOf", { date: formatChallengeDate(challenge.date, locale) })}
        </p>
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
          <h2 className={s.panelTitle}>{t("daily.doneTitle")}</h2>
          <p>
            {t("daily.nextIn", { time: "" }).trim()} <Countdown />
          </p>
          <Link className="btn btn-primary" href={`/${locale}/daily/play`}>
            {t("daily.seeSummary")}
          </Link>
        </div>
      )}

      {inProgress && (
        <div className={s.panel}>
          <h2 className={s.panelTitle}>{t("daily.continueTitle")}</h2>
          <Link className="btn btn-primary" href={`/${locale}/daily/play`}>
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
            <p className={s.hint}>{t("daily.startHint")}</p>
          </div>
        </>
      )}
    </div>
  );
}
