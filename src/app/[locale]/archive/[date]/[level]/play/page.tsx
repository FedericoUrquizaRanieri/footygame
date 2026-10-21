import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlayScreen } from "@/components/game/PlayScreen";
import { PageStage } from "@/components/ui/PageStage";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { isArchiveDate } from "@/domain/daily-date";
import { isDifficulty } from "@/domain/difficulty";
import { hasLocale } from "@/i18n/config";

type Params = PageProps<"/[locale]/archive/[date]/[level]/play">["params"];

async function ArchivePlay({ params }: { params: Params }) {
  const { locale, date, level } = await params;
  if (!hasLocale(locale) || !isDifficulty(level)) notFound();
  // Solo se valida la forma de la fecha; que sea pasada lo valida la pantalla previa.
  if (!isArchiveDate(date, "9999-12-31")) notFound();

  return (
    <PageStage zone="center" calm>
      <SiteHeader locale={locale} />
      <PlayScreen level={level} mode="archive" date={date} />
    </PageStage>
  );
}

export default function ArchivePlayPage({
  params,
}: PageProps<"/[locale]/archive/[date]/[level]/play">) {
  return (
    <Suspense fallback={null}>
      <ArchivePlay params={params} />
    </Suspense>
  );
}
