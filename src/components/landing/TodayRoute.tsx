import { connection } from "next/server";
import { challengeDateFor } from "@/domain/daily-date";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createT } from "@/i18n/translate";
import { formatChallengeDate } from "@/lib/format";
import { getChallengeForDate } from "@/server/queries";
import { PassMap } from "./PassMap";

/** Ruta del desafío de hoy, leída directo de la base (componente de servidor, nunca llega la solución). */
export async function TodayRoute({ locale }: { locale: Locale }) {
  await connection();
  const t = createT(getMessages(locale));
  const date = challengeDateFor(new Date());
  const challenge = await getChallengeForDate(date).catch(() => null);
  if (!challenge) return null;
  return (
    <PassMap
      t={t}
      origin={challenge.origin}
      destination={challenge.destination}
      dateLabel={formatChallengeDate(challenge.date, locale)}
    />
  );
}
