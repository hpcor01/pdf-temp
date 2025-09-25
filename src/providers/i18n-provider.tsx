"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import elGr from "@/locales/el-gr.json";
import enEn from "@/locales/en-en.json";
import esEs from "@/locales/es-es.json";
import frFr from "@/locales/fr-fr.json";
import heIl from "@/locales/he-il.json";
import itIt from "@/locales/it-it.json";
import ptBr from "@/locales/pt-br.json";
import type { LanguageStructure } from "@/types/i18n";

const locales = {
  "el-gr": elGr,
  "en-en": enEn,
  "es-es": esEs,
  "fr-fr": frFr,
  "he-il": heIl,
  "it-it": itIt,
  "pt-br": ptBr,
} as const;

type SupportedLocale = keyof typeof locales;

const I18nContext = createContext<
  | {
      locale: SupportedLocale;
      t: LanguageStructure;
      setLocale: (locale: SupportedLocale) => void;
    }
  | undefined
>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<SupportedLocale>("pt-br");

  return (
    <I18nContext.Provider value={{ locale, t: locales[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18nContext = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18nContext must be used within I18nProvider");
  return ctx;
};
