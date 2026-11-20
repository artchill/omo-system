"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/app/actions";
import { locales, type Locale } from "@/i18n/config";

// Each language is always labelled in its own language so people can find it.
const NATIVE_NAMES: Record<Locale, string> = {
  "zh-Hant": "繁體中文",
  en: "English",
};

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const current = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <div role="group" aria-label={t("label")} className="inline-flex gap-1">
      {locales.map((code) => {
        const active = code === current;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            disabled={pending || active}
            onClick={() => startTransition(() => void setLocale(code))}
            className={`rounded-md px-3 py-1 text-sm ${
              active
                ? "bg-foreground text-background"
                : "border border-foreground/20 hover:bg-foreground/10"
            }`}
          >
            {NATIVE_NAMES[code]}
          </button>
        );
      })}
    </div>
  );
}
