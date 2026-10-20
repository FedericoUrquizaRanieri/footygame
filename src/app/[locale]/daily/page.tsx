import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DailyHub } from "@/components/game/DailyHub";
import { PageStage } from "@/components/ui/PageStage";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { challengeDateFor } from "@/domain/daily-date";
import { hasLocale, type Locale } from "@/i18n/config";
import { getChallengesForDate } from "@/server/queries";

/** Desafíos de hoy leídos en el servidor: solo origen y destino, nunca la solución. */
async function Hub() {
  await connection();
  const challenges = await getChallengesForDate(challengeDateFor(new Date())).catch(() => []);
  return <DailyHub challenges={challenges} />;
}

export default async function DailyPage({ params }: PageProps<"/[locale]/daily">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <PageStage zone="box">
      <SiteHeader locale={locale as Locale} />
      <main id="main" className="container">
        <Suspense fallback={null}>
          <Hub />
        </Suspense>
      </main>
    </PageStage>
  );
}
