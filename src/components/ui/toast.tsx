import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Terminal, X } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const toastVariants = cva(
  // Posição + animação base
  "fixed top-6 right-6 z-50 w-full max-w-sm rounded-xl border p-5 shadow-xl backdrop-blur-sm transition-all duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
  {
    variants: {
      variant: {
        default: "bg-background/95 text-foreground border-border/40",
        success:
          "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-50 dark:border-emerald-800",
        warning:
          "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-50 dark:border-amber-800",
        destructive:
          "bg-red-50 text-red-900 border-red-200 dark:bg-red-900/30 dark:text-red-50 dark:border-red-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface ToastProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Toast({
  className,
  variant,
  title,
  description,
  open,
  onOpenChange,
  ...props
}: ToastProps) {
  if (!open) return null;

  const icon = {
    default: <Terminal className="h-6 w-6 text-foreground/80" />,
    success: (
      <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
    ),
    warning: (
      <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
    ),
    destructive: (
      <Terminal className="h-6 w-6 text-red-600 dark:text-red-400" />
    ),
  }[variant ?? "default"];

  return (
    <div
      data-slot="toast"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{icon}</div>

        <div className="flex-1 space-y-1">
          {title && (
            <h3 className="font-semibold text-base leading-tight tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm opacity-90 leading-snug">{description}</p>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full p-1 text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 transition"
          onClick={() => onOpenChange(false)}
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

export { Toast, toastVariants };
export type { ToastProps };
