"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import s from "./header.module.css";

/** Guarda la elección para que el redireccionamiento de "/" la respete. */
function rememberLocale(next: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
}

/** Cambia el idioma conservando la página actual y recuerda la elección en una cookie. */
export function LangSwitcher() {
  const { locale, t } = useI18n();
  const pathname = usePathname() ?? `/${locale}`;
  const rest = pathname.replace(/^\/(es|en)(?=\/|$)/, "");

  return (
    <nav className={s.lang} aria-label={t("nav.language")}>
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          lang={l}
          hrefLang={l}
          aria-current={l === locale ? "true" : undefined}
          onClick={() => rememberLocale(l)}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
