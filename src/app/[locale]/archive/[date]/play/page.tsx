import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlayScreen } from "@/components/game/PlayScreen";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { isArchiveDate } from "@/domain/daily-date";
import { hasLocale } from "@/i18n/config";

type Params = PageProps<"/[locale]/archive/[date]/play">["params"];

async function ArchivePlay({ params }: { params: Params }) {
  const { locale, date } = await params;
  if (!hasLocale(locale)) notFound();
  // Solo se valida la forma de la fecha; que sea pasada lo valida la pantalla previa.
  if (!isArchiveDate(date, "9999-12-31")) notFound();

  return (
    <>
      <SiteHeader locale={locale} />
      <PlayScreen mode="archive" date={date} />
    </>
  );
}

export default function ArchivePlayPage({ params }: PageProps<"/[locale]/archive/[date]/play">) {
  return (
    <Suspense fallback={null}>
      <ArchivePlay params={params} />
    </Suspense>
  );
}
