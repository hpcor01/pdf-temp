import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguageKey } from "@/hooks/use-i18n";
import type { BtnCreateColumnProps } from "@/types/buttons";

export function BtnCreateColumn({ onClick }: BtnCreateColumnProps) {
  const handleClick = () => {
    onClick(undefined);
  };

  // Btn create column translations
  const btnCreateColumnTranslations = useLanguageKey("btn-create-column");

  return (
    <Button
      onClick={handleClick}
      className="cursor-pointer fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
      aria-label={btnCreateColumnTranslations["create-column"]}
    >
      <Plus className="w-6 h-6 text-white" />
    </Button>
  );
}
