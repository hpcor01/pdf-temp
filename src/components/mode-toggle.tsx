"use client";

import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguageKey } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import type { ThemeOption } from "@/types/theme";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
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
          aria-label={label}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <p className="sr-only">{label}</p>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" role="menu" aria-label="Theme options">
        {themes.map(({ value, label }) => (
          <DropdownMenuItem
            key={value}
            className="cursor-pointer flex justify-between"
            onClick={() => setTheme(value)}
            role="menuitem"
            aria-label={label}
          >
            {label}
            <Check
              className={cn(
                "ml-2 h-4 w-4",
                theme === value ? "opacity-100 text-primary" : "opacity-0"
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
