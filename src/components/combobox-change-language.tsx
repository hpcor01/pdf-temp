"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguageKey } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { useI18nContext } from "@/providers/i18n-provider";
import type { SupportedLocale } from "@/types/i18n";
import type { LanguageInfo } from "@/types/language";

export default function ComboboxChangeLanguage() {
  const { locale, t, setLocale } = useI18nContext();
  const [open, setOpen] = React.useState(false);

  const placeholder = useLanguageKey("combobox.placeholder");
  const searchPlaceholder = useLanguageKey("combobox.search-placeholder");
  const noLanguageFound = useLanguageKey("combobox.no-language-found");
  const selectLanguageLabel = useLanguageKey(
    "combobox-change-language.select-language",
  );

  const languages = Object.entries(t["languages-selected"].locales).map(
    ([code, info]) => {
      const lang = info as LanguageInfo;
      return {
        value: code as SupportedLocale,
        label: lang.label,
        flag: lang.flag,
        defaultSelected: lang["default-selected"] ?? false,
      };
    },
  );

  const [value, setValue] = React.useState<SupportedLocale>(locale);

  const handleSelect = (selected: string) => {
    setValue(selected as SupportedLocale);
    setLocale(selected as SupportedLocale);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between cursor-pointer"
          aria-label={selectLanguageLabel}
        >
          {languages.find((lang) => lang.value === value)?.label ?? placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[200px] p-0"
        role="listbox"
        aria-label="Lista de idiomas"
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-9"
            aria-label={useLanguageKey("combobox.search-placeholder")}
          />
          <CommandList>
            <CommandEmpty>{noLanguageFound}</CommandEmpty>
            <CommandGroup>
              {languages.map((lang) => (
                <CommandItem
                  key={lang.value}
                  value={lang.value}
                  onSelect={() => handleSelect(lang.value)}
                  className="cursor-pointer"
                  role="option"
                  aria-selected={value === lang.value}
                >
                  <p>{lang.label}</p>
                  <Check
                    className={cn(
                      "ml-auto",
                      value === lang.value
                        ? "opacity-100 text-primary"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
