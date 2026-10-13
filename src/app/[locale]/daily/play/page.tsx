import { notFound } from "next/navigation";
import { PlayScreen } from "@/components/game/PlayScreen";
import { PageStage } from "@/components/ui/PageStage";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { hasLocale } from "@/i18n/config";

export default async function PlayPage({ params }: PageProps<"/[locale]/daily/play">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <PageStage zone="center" calm>
      <SiteHeader locale={locale} />
      <PlayScreen />
    </PageStage>
  );
}
