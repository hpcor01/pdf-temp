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
      "el-gr": {
        label: string;
        flag: string;
      };
      "he-il": {
        label: string;
        flag: string;
      };
      "es-es": {
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
    "button-toggle-previewer-image": {
      active: string;
      disabled: string;
    };
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
  header: {
    processing: string;
    "generating-file": string;
    "no-column-selected-title": string;
    "no-column-selected-description": string;
    "pdfs-generated-title": string;
    "pdfs-generated-description": string;
    "pdf-generated-title": string;
    "pdf-generated-description": string;
    "images-downloaded-title": string;
    "images-downloaded-description": string;
    "download-started-title": string;
    "download-started-description": string;
    "cancelled-title": string;
    "cancelled-description": string;
    "error-title": string;
    "error-description": string;
    "partial-error-title": string;
    "unsupported-browser-title": string;
    "unsupported-browser-description": string;
    "error-accessing-folder-title": string;
  };
  "combobox-change-language": {
    "select-language": string;
  };
  column: {
    "drag-drop-area": string;
    "column-label": string;
    "select-column": string;
    "edit-column-title": string;
    "edit-column": string;
    "remove-column": string;
    "images-in-column": string;
    "total-images": string;
  };
  "image-card": {
    "position-number": string;
    "image-actions": string;
    "remove-image": string;
    "rotate-image": string;
    "zoom-image": string;
    "preview-image": string;
  };
  "mouse-previewer": {
    "close-preview": string;
    rotation: string;
    size: string;
  };
  "previewer-image": {
    "modal-label": string;
    "preview-title": string;
    "crop-image": string;
    "zoom-out": string;
    "reset-zoom": string;
    "zoom-in": string;
    "close-preview": string;
    "zoom-level": string;
    "preview-container": string;
  };
  "crop-image": {
    "crop-title": string;
    "close-crop": string;
    cancel: string;
    save: string;
  };
  "btn-create-column": {
    "create-column": string;
  };
  "update-toast": {
    "new-version-title": string;
    "new-version-description": string;
    "close-notification": string;
    updating: string;
    update: string;
    later: string;
  };
  "save-location-toggle": {
    "folder-selected-title": string;
    "folder-selected-description": string;
    "error-selecting-folder-title": string;
    "error-selecting-folder-description": string;
    "single-folder": string;
    "folder-per-column": string;
    "default-folder": string;
    "select-folder-prompt": string;
  };
  "not-found": {
    "page-title": string;
    "page-description": string;
    "image-alt": string;
    "back-to-dashboard": string;
  };
}

export type SupportedLocale = "pt-br" | "en-en" | "es-es" | "el-gr" | "he-il";

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

export interface I18nContextType {
  locale: SupportedLocale;
  t: I18nJSON;
  setLocale: (locale: SupportedLocale) => void;
}

export type LocalesType = {
  [K in SupportedLocale]: LanguageStructure;
};
