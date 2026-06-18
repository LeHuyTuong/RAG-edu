export interface UploadConfig {
  readonly maxFileSize: number;

  readonly maxFiles: number;

  readonly allowedMimeTypes: string[];

  readonly allowedExtensions: string[];
}
