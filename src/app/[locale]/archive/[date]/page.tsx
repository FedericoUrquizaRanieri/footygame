import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BriefingScreen } from "@/components/game/BriefingScreen";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { challengeDateFor, isArchiveDate } from "@/domain/daily-date";
import { hasLocale } from "@/i18n/config";
import { getChallengeForDate } from "@/server/queries";

type Params = PageProps<"/[locale]/archive/[date]">["params"];

/** Pantalla previa de un desafío pasado. Hoy y el futuro no se pueden jugar por acá. */
async function ArchiveBriefing({ params }: { params: Params }) {
  const { locale, date } = await params;
  if (!hasLocale(locale)) notFound();
  await connection();
  if (!isArchiveDate(date, challengeDateFor(new Date()))) notFound();
  const challenge = await getChallengeForDate(date).catch(() => null);
  if (!challenge) notFound();

  return (
    <>
      <SiteHeader locale={locale} />
      <main id="main" className="container">
        <BriefingScreen challenge={challenge} mode="archive" />
      </main>
    </>
  );
}

export default function ArchiveBriefingPage({ params }: PageProps<"/[locale]/archive/[date]">) {
  return (
    <Suspense fallback={null}>
      <ArchiveBriefing params={params} />
    </Suspense>
  );
}
