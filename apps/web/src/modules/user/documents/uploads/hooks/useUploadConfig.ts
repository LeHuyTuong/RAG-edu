"use client";

import { DEFAULT_UPLOAD_CONFIG } from "@/constants/upload.const";
import { UploadConfig } from "@/types/upload";
import { apiClient } from "@/lib/axios";
import { useEffect, useState } from "react";

interface ServerUploadConfig {
  maxFileSize: number;
  maxSizeMb: number;
  allowedTypes: string;
}

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

const mergeConfig = (server: ServerUploadConfig): UploadConfig => {
  const extensions = server.allowedTypes
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((ext) => (ext.startsWith(".") ? ext : `.${ext}`));

  const mimeTypes = extensions
    .map((ext) => EXT_TO_MIME[ext.replace(".", "")])
    .filter(
      (value, index, array): value is string =>
        Boolean(value) && array.indexOf(value) === index,
    );
  return {
    maxFileSize: server.maxFileSize,
    maxFiles: DEFAULT_UPLOAD_CONFIG.maxFiles,
    allowedMimeTypes:
      mimeTypes.length > 0 ? mimeTypes : DEFAULT_UPLOAD_CONFIG.allowedMimeTypes,
    allowedExtensions:
      extensions.length > 0
        ? extensions
        : DEFAULT_UPLOAD_CONFIG.allowedExtensions,
  };
};

export const useUploadConfig = () => {
  const [config, setConfig] = useState<UploadConfig>(DEFAULT_UPLOAD_CONFIG);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await apiClient.get("/api/v1/upload/config");
        const server = data as unknown as ServerUploadConfig;
        if (
          server &&
          typeof server.maxFileSize === "number" &&
          server.allowedTypes
        ) {
          setConfig(mergeConfig(server));
        }
      } catch {
        // fallback default config
      }
    };

    fetchConfig();
  }, []);

  return config;
};
