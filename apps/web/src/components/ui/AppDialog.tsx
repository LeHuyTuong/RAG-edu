"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "./Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./Dialog";

type DialogTone = "primary" | "error" | "neutral";

const iconToneClasses: Record<DialogTone, string> = {
  primary: "bg-primary/10 text-primary",
  error: "bg-error/10 text-error",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

export interface AppDialogProps {
  readonly open: boolean;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: string;
  readonly tone?: DialogTone;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly className?: string;
  readonly bodyClassName?: string;
  readonly headerClassName?: string;
  readonly showClose?: boolean;
  readonly closeLabel?: string;
  readonly onOpenChange: (open: boolean) => void;
}

export function AppDialog({
  open,
  title,
  description,
  icon,
  tone = "primary",
  children,
  footer,
  className,
  bodyClassName,
  headerClassName,
  showClose = true,
  closeLabel = "Đóng",
  onOpenChange,
}: AppDialogProps): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-w-xl overflow-hidden p-0", className)}
        showClose={false}
      >
        <DialogHeader
          className={cn(
            "border-b border-outline-variant bg-surface-container-low px-6 py-5",
            headerClassName,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              {icon ? (
                <span
                  className={cn(
                    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    iconToneClasses[tone],
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[22px]"
                  >
                    {icon}
                  </span>
                </span>
              ) : null}
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
                {description ? (
                  <DialogDescription className="mt-1">
                    {description}
                  </DialogDescription>
                ) : null}
              </div>
            </div>

            {showClose ? (
              <Button
                aria-label={closeLabel}
                className="h-9 w-9 shrink-0 p-0 text-on-surface-variant hover:bg-surface-container-high"
                onClick={() => onOpenChange(false)}
                type="button"
                variant="ghost"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[20px]"
                >
                  close
                </span>
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        <div className={cn("px-6 py-5", bodyClassName)}>{children}</div>

        {footer ? (
          <DialogFooter className="border-t border-outline-variant bg-surface-container-low px-6 py-4">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
