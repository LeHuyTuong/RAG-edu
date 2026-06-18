/**
 * Utility Functions
 */

// String utilities
export const truncate = (str: string, length: number) => {
  return str.length > length ? str.slice(0, length) + "..." : str;
};

export const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  return /\S+@\S+\.\S+/.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

// Storage utilities
export const setLocalStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to set localStorage:", error);
  }
};

export const getLocalStorage = <T = unknown>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Failed to get localStorage:", error);
    return null;
  }
};

export const removeLocalStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove from localStorage:", error);
  }
};

const DEVICE_ID_STORAGE_KEY = "device_id";

const generateDeviceId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getOrCreateDeviceId = (): string => {
  if (typeof window === "undefined") {
    return generateDeviceId();
  }

  const existingDeviceId = getLocalStorage<string>(DEVICE_ID_STORAGE_KEY);
  if (typeof existingDeviceId === "string" && existingDeviceId.length > 0) {
    return existingDeviceId;
  }

  const deviceId = generateDeviceId();
  setLocalStorage(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
};

// Format utilities
export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};

export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString("vi-VN");
};

/**
 * Converts a raw byte count into a human-readable string (KB / MB / GB).
 * Handles undefined/null gracefully — returns "—" when size is unknown.
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes == null || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
