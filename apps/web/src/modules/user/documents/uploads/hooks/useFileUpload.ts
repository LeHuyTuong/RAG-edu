"use client";

import { useState, useCallback } from "react";
// Bắt buộc phải cài đặt package: npm install @cloudinary/node-api
import { validateFile } from "@/utils/validate.file";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "ddxstobvd";
const UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
  "YOUR_UNSIGNED_PRESET_NAME";

// 1. Cập nhật Interface để khớp với yêu cầu của hàm validateFile
interface CloudinaryConfig {
  maxFiles: number;

  maxFileSize: number;
  allowedMimeTypes: string[]; // Đã sửa: Thêm thuộc tính này để khắc phục lỗi type
  allowedExtensions: string[];
}

export const useFileUpload = (initialConfig: CloudinaryConfig) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<
    Array<{ url: string; publicId: string }>
  >([]);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Hàm thực hiện việc upload file lên Cloudinary thông qua REST API (Unsigned)
   */
  const uploadToCloudinary = useCallback(async (file: File) => {
    console.log(`[Cloudinary] Bắt đầu upload file: ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        // Cloudinary trả về JSON trong trường hợp lỗi, cần xử lý parsing
        throw new Error(`Upload failed: ${errorBody}`);
      }

      const result = await response.json();
      return { url: result.secure_url, publicId: result.public_id };
    } catch (e) {
      console.error("Lỗi khi upload lên Cloudinary:", e);

      throw new Error(
        `Failed to upload ${file.name} to Cloudinary. ${e instanceof Error ? e.message : ""}`,
      );
    }
  }, []);

  /**
   * Xử lý việc chọn file và validation cơ bản
   */
  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length > initialConfig.maxFiles) {
      setError(`Maximum ${initialConfig.maxFiles} files allowed`);
      setFiles([]);
      return;
    }

    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      // Giả định validateFile vẫn tồn tại và hoạt động
      const result = validateFile(file, initialConfig);

      if (!result.valid) {
        setError(result.error || "Invalid file");
        setFiles([]);
        return;
      }

      validFiles.push(file);
    }

    setFiles(validFiles);
    setError("");
  };

  /**
   * Xử lý việc upload toàn bộ các file đã chọn lên Cloudinary
   */
  const handleUploadToCloudinary = useCallback(async () => {
    if (files.length === 0) {
      setError("Vui lòng chọn tài liệu để upload.");
      return;
    }

    setIsUploading(true);
    setError("");
    setUploadedAssets([]);

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          // Gọi hàm upload thực tế
          return uploadToCloudinary(file);
        }),
      );

      setUploadedAssets(results);
      setError("Upload thành công!");
    } catch (e) {
      // Lỗi từ việc upload sẽ được bắt và hiển thị ở đây
      setError(e instanceof Error ? e.message : "Lỗi upload không xác định.");
    } finally {
      setIsUploading(false);
      // Sau khi upload xong, chúng ta có thể reset trạng thái files để chọn file mới
      setFiles([]);
    }
  }, [files, uploadToCloudinary]);

  return {
    files,
    uploadedAssets,
    error,
    isUploading,
    handleSelectFiles,
    handleUploadToCloudinary,
    config: initialConfig,
  };
};
