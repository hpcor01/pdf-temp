import { cva, type VariantProps } from "class-variance-authority";
import { Terminal } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "fixed top-4 right-4 z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border",
        destructive:
          "bg-destructive text-destructive-foreground border-destructive/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
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

  return (
    <div
      data-slot="toast"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        {variant === "destructive" ? (
          <Terminal className="h-5 w-5 text-destructive" />
        ) : (
          <Terminal className="h-5 w-5 text-foreground" />
        )}
        <div className="flex-1 space-y-1">
          {title && (
            <h3
              className={cn(
                "font-medium leading-none tracking-tight",
                variant === "destructive" ? "text-destructive-foreground" : ""
              )}
            >
              {title}
            </h3>
          )}
          {description && (
            <p
              className={cn(
                "text-sm opacity-90",
                variant === "destructive"
                  ? "text-destructive-foreground/90"
                  : "text-muted-foreground"
              )}
            >
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Close"
          >
            <title>Close</title>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export { Toast, toastVariants };
export type { ToastProps };
