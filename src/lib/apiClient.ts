// src/lib/apiClient.ts

// URL de base forcée (sans slash final)
const BASE_URL = "https://jobswipe-career-navigator-elue.onrender.com";

export const buildUrl = (path: string): string => {
  const safePath = typeof path === "string" ? path : "";
  const sanitizedPath = safePath.startsWith("/") ? safePath : `/${safePath}`;
  return `${BASE_URL}${sanitizedPath}`;
};
