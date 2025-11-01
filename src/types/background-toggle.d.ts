import type { Dispatch, SetStateAction } from "react";

export interface BackgroundToggleProps {
  setIsRemoveBgChecked: Dispatch<SetStateAction<boolean>>;
}
