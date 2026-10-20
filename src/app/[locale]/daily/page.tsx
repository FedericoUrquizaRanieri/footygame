import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BriefingScreen } from "@/components/game/BriefingScreen";
import { PageStage } from "@/components/ui/PageStage";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { challengeDateFor } from "@/domain/daily-date";
import { hasLocale, type Locale } from "@/i18n/config";
import { getChallengeForDate } from "@/server/queries";

/** Desafío de hoy leído en el servidor: solo origen y destino, nunca la solución. */
async function Briefing() {
  await connection();
  const challenge = await getChallengeForDate(challengeDateFor(new Date())).catch(() => null);
  return <BriefingScreen challenge={challenge} />;
}

export default async function DailyPage({ params }: PageProps<"/[locale]/daily">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <PageStage zone="box">
      <SiteHeader locale={locale as Locale} />
      <main id="main" className="container">
        <Suspense fallback={null}>
          <Briefing />
        </Suspense>
      </main>
    </PageStage>
  );
}
