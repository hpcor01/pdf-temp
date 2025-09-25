// Define the structure of your language files based on pt-br.json
export interface LanguageStructure {
  "languages-selected": {
    label: string;
    locales: {
      "pt-br": {
        label: string;
        flag: string;
        "default-selected": boolean;
      };
      "en-en": {
        label: string;
        flag: string;
      };
      "fr-fr": {
        label: string;
        flag: string;
      };
      "it-it": {
        label: string;
        flag: string;
      };
      "es-es": {
        label: string;
        flag: string;
      };
      "el-gr": {
        label: string;
        flag: string;
      };
      "he-il": {
        label: string;
        flag: string;
      };
    };
  };
  buttons: {
    "toggle-button-theme": {
      label: string;
      theme: {
        light: string;
        dark: string;
        system: string;
      };
    };
    "button-save": string;
    "button-convert-to-pdf": string;
    "button-remove-background": string;
    "button-toggle-selected-all": {
      active: string;
      disabled: string;
    };
  };
  combobox: {
    placeholder: string;
    "search-placeholder": string;
    "no-language-found": string;
  };
}

// Type for the locale keys
export type SupportedLocale =
  | "pt-br"
  | "en-en"
  | "fr-fr"
  | "it-it"
  | "es-es"
  | "el-gr"
  | "he-il";

// Type-safe access to translation keys
type DotPrefix<T extends string> = T extends "" ? "" : `${T}.`;

type DotNestedKeys<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string
        ? T[K] extends object
          ? `${K}` | `${DotPrefix<K>}${DotNestedKeys<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : "";

export type I18nKeys = DotNestedKeys<LanguageStructure>;

export type I18nJSON = LanguageStructure;

// Context type for the i18n provider
export interface I18nContextType {
  locale: SupportedLocale;
  t: I18nJSON;
  setLocale: (locale: SupportedLocale) => void;
}

export type LocalesType = {
  [K in SupportedLocale]: LanguageStructure;
};
