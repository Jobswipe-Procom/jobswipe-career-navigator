// Récupère l'URL depuis le fichier .env
// Note : Vite exige le préfixe VITE_ pour exposer la variable au client
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export const buildUrl = (path: string): string => {
  const safePath = typeof path === "string" ? path : "";
  
  // On s'assure que le path commence par /
  const sanitizedPath = safePath.startsWith("/") ? safePath : `/${safePath}`;
  
  // On s'assure que BASE_URL n'a pas de slash final pour éviter le double //
  const cleanBaseUrl = BASE_URL.replace(/\/$/, "");

  return `${cleanBaseUrl}${sanitizedPath}`;
};