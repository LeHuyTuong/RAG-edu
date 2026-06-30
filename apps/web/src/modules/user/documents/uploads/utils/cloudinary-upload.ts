/**
 * Upload utility — tries Cloudinary first, falls back to backend server.
 */

import { apiClient } from "@/lib/axios";
import {
  buildCloudinaryUploadResult,
  type CloudinaryUploadResult,
} from "./cloudinary-upload-result";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "ddxstobvd";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export { UPLOAD_PRESET };

async function uploadToServer(file: File): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const result = await apiClient.post("/api/v1/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const data = result as unknown as Record<string, unknown>;

  return {
    url: (data.fileUrl as string) ?? "",
    publicId: (data.storedName as string) ?? "",
    bytes: (data.sizeInBytes as number) ?? file.size,
    format: (data.format as string) ?? "pdf",
    resourceType: (data.resourceType as string) ?? "local",
  };
}

async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Cloudinary upload failed (${res.status}): ${body.slice(0, 500)}`,
    );
  }

  const data = await res.json();
  return buildCloudinaryUploadResult(data, file);
}

export async function uploadFileToCloudinary(
  file: File,
): Promise<CloudinaryUploadResult> {
  if (UPLOAD_PRESET && UPLOAD_PRESET !== "PLACE_HOLDER") {
    return uploadToCloudinary(file);
  }
  return uploadToServer(file);
}
