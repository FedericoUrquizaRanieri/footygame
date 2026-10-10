import { notFound } from "next/navigation";
import { PlayScreen } from "@/components/game/PlayScreen";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { hasLocale } from "@/i18n/config";

export default async function PlayPage({ params }: PageProps<"/[locale]/daily/play">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <>
      <SiteHeader locale={locale} />
      <PlayScreen />
    </>
  );
}
