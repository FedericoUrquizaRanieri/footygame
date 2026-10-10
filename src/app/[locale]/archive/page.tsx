import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArchiveList } from "@/components/game/ArchiveList";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { challengeDateFor } from "@/domain/daily-date";
import { hasLocale } from "@/i18n/config";
import { getArchiveList } from "@/server/queries";

const LIMIT = 60;

/** Desafíos anteriores a hoy: solo origen, destino y nivel; la solución nunca sale de acá. */
async function Archive() {
  await connection();
  const challenges = await getArchiveList(challengeDateFor(new Date()), LIMIT).catch(() => []);
  return <ArchiveList challenges={challenges} />;
}

export default async function ArchivePage({ params }: PageProps<"/[locale]/archive">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <>
      <SiteHeader locale={locale} />
      <main id="main" className="container">
        <Suspense fallback={null}>
          <Archive />
        </Suspense>
      </main>
    </>
  );
}
