export interface UseSaveLocationProps {
  showToast: (
    variant: "default" | "destructive",
    title: string,
    description: string
  ) => void;
}
