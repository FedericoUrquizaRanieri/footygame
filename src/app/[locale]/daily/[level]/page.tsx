import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BriefingScreen } from "@/components/game/BriefingScreen";
import { PageStage } from "@/components/ui/PageStage";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { challengeDateFor } from "@/domain/daily-date";
import { isDifficulty } from "@/domain/difficulty";
import { hasLocale } from "@/i18n/config";
import { getChallengeForDate } from "@/server/queries";

type Params = PageProps<"/[locale]/daily/[level]">["params"];

/** Desafío de hoy en ese nivel leído en el servidor: solo origen y destino, nunca la solución. */
async function Briefing({ params }: { params: Params }) {
  const { locale, level } = await params;
  if (!hasLocale(locale) || !isDifficulty(level)) notFound();
  await connection();
  const challenge = await getChallengeForDate(challengeDateFor(new Date()), level).catch(
    () => null,
  );

  return (
    <PageStage zone="box">
      <SiteHeader locale={locale} />
      <main id="main" className="container">
        <BriefingScreen challenge={challenge} />
      </main>
    </PageStage>
  );
}

export default function DailyLevelPage({ params }: PageProps<"/[locale]/daily/[level]">) {
  return (
    <Suspense fallback={null}>
      <Briefing params={params} />
    </Suspense>
  );
}
