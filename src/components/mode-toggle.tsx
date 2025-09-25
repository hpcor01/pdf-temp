"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguageKey } from "@/hooks/use-i18n";
import type { ThemeOption } from "@/types/theme";

export function ModeToggle() {
  const { setTheme } = useTheme();
  const label = useLanguageKey("buttons.toggle-button-theme.label");

  const themes: ThemeOption[] = [
    {
      value: "light",
      label: useLanguageKey("buttons.toggle-button-theme.theme.light"),
    },
    {
      value: "dark",
      label: useLanguageKey("buttons.toggle-button-theme.theme.dark"),
    },
    {
      value: "system",
      label: useLanguageKey("buttons.toggle-button-theme.theme.system"),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer relative"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <p className="sr-only">{label}</p>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {themes.map(({ value, label }) => (
          <DropdownMenuItem
            key={value}
            className="cursor-pointer"
            onClick={() => setTheme(value)}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
