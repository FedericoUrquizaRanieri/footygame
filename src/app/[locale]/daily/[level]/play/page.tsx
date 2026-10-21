import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlayScreen } from "@/components/game/PlayScreen";
import { PageStage } from "@/components/ui/PageStage";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { isDifficulty } from "@/domain/difficulty";
import { hasLocale } from "@/i18n/config";

type Params = PageProps<"/[locale]/daily/[level]/play">["params"];

async function Play({ params }: { params: Params }) {
  const { locale, level } = await params;
  if (!hasLocale(locale) || !isDifficulty(level)) notFound();

  return (
    <PageStage zone="center" calm>
      <SiteHeader locale={locale} />
      <PlayScreen level={level} />
    </PageStage>
  );
}

export default function PlayPage({ params }: PageProps<"/[locale]/daily/[level]/play">) {
  return (
    <Suspense fallback={null}>
      <Play params={params} />
    </Suspense>
  );
}
