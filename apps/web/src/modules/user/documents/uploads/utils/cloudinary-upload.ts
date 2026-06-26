/**
 * Shared Cloudinary upload utility.
 *
 * Consolidates the Cloudinary unsigned-preset upload logic that was
 * duplicated across DocumentUploadForm, useDocumentUpload, and useFileUpload.
 *
 * Usage:
 *   import { uploadFileToCloudinary } from "../utils/cloudinary-upload";
 *   const result = await uploadFileToCloudinary(file);
 */

import {
  buildCloudinaryUploadResult,
  type CloudinaryUploadResult,
} from "./cloudinary-upload-result";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "ddxstobvd";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export { UPLOAD_PRESET };

/**
 * Uploads a file to Cloudinary using the unsigned preset.
 *
 * @throws Error with a descriptive message if the upload fails.
 *   Callers should log `err.message` for debugging and map to a
 *   user-facing message before displaying it.
 */
export async function uploadFileToCloudinary(
  file: File,
): Promise<CloudinaryUploadResult> {
  if (!UPLOAD_PRESET) {
    throw new Error("Cloudinary upload preset is not configured.");
  }

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
