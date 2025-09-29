import type { HeaderProps } from "./header";

export interface SelectionToggleProps {
  isProcessing: boolean;
  onToggleAllChange?: HeaderProps["onToggleAllChange"];
  toggleAllColumnsSave?: HeaderProps["toggleAllColumnsSave"];
}
