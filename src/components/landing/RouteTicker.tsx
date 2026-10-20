import Link from "next/link";
import { connection } from "next/server";
import type { CSSProperties } from "react";
import { challengeDateFor } from "@/domain/daily-date";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createT } from "@/i18n/translate";
import { getArchiveList } from "@/server/queries";
import s from "./landing.module.css";

const COUNT = 10;

/** Cartelería LED del borde de la cancha: pasa la ruta de los desafíos anteriores. Cada una abre ese día. */
export async function RouteTicker({ locale }: { locale: Locale }) {
  await connection();
  const t = createT(getMessages(locale));
  const past = await getArchiveList(challengeDateFor(new Date()), COUNT).catch(() => []);
  if (past.length === 0) return null;

  const label = (c: (typeof past)[number]) =>
    t("archive.route", { from: c.origin.name, to: c.destination.name });

  return (
    <div className={s.board} role="region" aria-label={t("landing.boardLabel")}>
      <div className={s.boardTrack} style={{ "--dur": `${past.length * 7}s` } as CSSProperties}>
        <ul className={s.boardList}>
          {past.map((c) => (
            <li key={c.id}>
              <Link href={`/${locale}/archive/${c.date}`}>{label(c)}</Link>
            </li>
          ))}
        </ul>
        {/* Segunda copia para que el recorrido no tenga corte; la leen solo los ojos. */}
        <ul className={s.boardList} aria-hidden="true">
          {past.map((c) => (
            <li key={c.id}>
              <span>{label(c)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
