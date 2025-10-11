export interface Recipe {
  id: string;
  url: string;
  title: string;
  notes?: string;
  images: string[];
}

export interface AuthResponse {
  session_id: string;
}

export interface ImageUploadResponse {
  filename: string;
}

declare global {
  const __API_URL__: string;
}

export {};
