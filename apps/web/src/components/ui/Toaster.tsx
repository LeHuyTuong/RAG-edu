"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Custom Toaster component integrated with the app's global design tokens (Light/Dark themes).
 */
export function Toaster({ ...props }: ToasterProps): React.JSX.Element {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="w-4 h-4 text-emerald-500" />,
        info: <InfoIcon className="w-4 h-4 text-blue-500" />,
        warning: <TriangleAlertIcon className="w-4 h-4 text-amber-500" />,
        error: <OctagonXIcon className="w-4 h-4 text-rose-500" />,
        loading: (
          <Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as any
      }
      {...props}
    />
  );
}
