import { get } from "lodash-es";
import { useI18nContext } from "@/providers/i18n-provider";
import type { I18nJSON, I18nKeys } from "@/types/i18n";

export function useLanguage<K extends keyof I18nJSON>(key?: K) {
  const { t } = useI18nContext();
  if (!key) return t;
  return get(t, key as string);
}

export function useLanguageKey<K extends I18nKeys>(key: K) {
  const { t } = useI18nContext();
  return get(t, key);
}
