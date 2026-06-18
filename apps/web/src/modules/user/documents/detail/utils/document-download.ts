const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";
const CLOUDINARY_ATTACHMENT_TRANSFORMATION = "fl_attachment";

function isCloudinaryDeliveryUrl(fileUrl: string): boolean {
  try {
    return new URL(fileUrl).hostname === CLOUDINARY_HOST;
  } catch {
    return false;
  }
}

function normalizeExtension(format: string): string {
  const extension = format.trim().toLowerCase().replace(/^\.+/, "");
  return extension && extension !== "unknown" ? extension : "";
}

export function buildDownloadFileName(title: string, format: string): string {
  const baseName =
    title
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/\.+$/g, "")
      .slice(0, 120) || "document";
  const extension = normalizeExtension(format);

  if (!extension || baseName.toLowerCase().endsWith(`.${extension}`)) {
    return baseName;
  }

  return `${baseName}.${extension}`;
}

export function buildCloudinaryDownloadUrl(fileUrl: string): string {
  if (
    !isCloudinaryDeliveryUrl(fileUrl) ||
    !fileUrl.includes(CLOUDINARY_UPLOAD_SEGMENT) ||
    fileUrl.includes(
      `${CLOUDINARY_UPLOAD_SEGMENT}${CLOUDINARY_ATTACHMENT_TRANSFORMATION}`,
    )
  ) {
    return fileUrl;
  }

  return fileUrl.replace(
    CLOUDINARY_UPLOAD_SEGMENT,
    `${CLOUDINARY_UPLOAD_SEGMENT}${CLOUDINARY_ATTACHMENT_TRANSFORMATION}/`,
  );
}
