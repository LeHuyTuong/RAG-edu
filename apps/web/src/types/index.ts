/**
 * Global Types & Interfaces
 */

// User Types
export type UserRole = "admin" | "moderator" | "teacher" | "student" | "guest";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: "ACTIVE" | "UNVERIFIED" | "BANNED" | string;
  avatar?: string;
  createdAt: Date;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Document Types
export interface Document {
  id: number;
  title: string;
  author: string;
  pages: number;
  views: string;
  rating: number;
  type: "PDF" | "DOCX";
  image: string;
  subject: string;
  university: string;
  category: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
