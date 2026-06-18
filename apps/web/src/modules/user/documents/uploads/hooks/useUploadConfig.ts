"use client";

import { DEFAULT_UPLOAD_CONFIG } from "@/constants/upload.const";
import { UploadConfig } from "@/types/upload";
import { useEffect, useState } from "react";

const isUploadConfig = (value: unknown): value is UploadConfig => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.maxFileSize === "number" &&
    typeof v.maxFiles === "number" &&
    Array.isArray(v.allowedMimeTypes) &&
    v.allowedMimeTypes.every((x) => typeof x === "string") &&
    Array.isArray(v.allowedExtensions) &&
    v.allowedExtensions.every((x) => typeof x === "string")
  );
};

export const useUploadConfig = () => {
  const [config, setConfig] = useState<UploadConfig>(DEFAULT_UPLOAD_CONFIG);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/upload-config");
        if (!response.ok) throw new Error("Failed to fetch upload config");

        const data: unknown = await response.json();
        if (!isUploadConfig(data))
          throw new Error("Invalid upload config payload");

        setConfig(data);
      } catch {
        // fallback default config
      }
    };

    fetchConfig();
  }, []);

  return config;
};
