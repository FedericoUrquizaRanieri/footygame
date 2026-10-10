import Link from "next/link";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";
import { createT } from "@/i18n/translate";
import { LangSwitcher } from "./LangSwitcher";
import s from "./header.module.css";

export function SiteHeader({ locale, overlay = false }: { locale: Locale; overlay?: boolean }) {
  const t = createT(getMessages(locale));
  return (
    <header className={overlay ? `${s.header} ${s.overlay}` : s.header}>
      <div className={`container ${s.bar}`}>
        <Link className={s.brand} href={`/${locale}`} aria-label={`footygame, ${t("nav.home")}`}>
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <path
              d="M12 48 L26 22 L38 40 L52 16"
              fill="none"
              stroke="#f1f3ec"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1 9"
            />
            <circle cx="12" cy="48" r="7" fill="#ffd12e" />
            <circle cx="52" cy="16" r="7" fill="#8ad4f5" />
          </svg>
          footygame
        </Link>
        <LangSwitcher />
      </div>
    </header>
  );
}
