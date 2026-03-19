import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import { bootstrapSupabaseAuth } from "./lib/authBootstrap";

/**
 * HOTFIX: Gestion du HashRouter avec l'OAuth de Supabase.
 * Permet de corriger l'URL si Supabase renvoie un hash mal formé 
 * du type "#/#access_token=..." (fréquent sur GitHub Pages).
 */
(() => {
  const h = window.location.hash || "";
  if (h.startsWith("#/#access_token=") || h.startsWith("#/#error=")) {
    const fixed = "#" + h.slice(3); // On retire le "/#" superflu
    window.history.replaceState(null, "", window.location.pathname + window.location.search + fixed);
  }
})();

/**
 * GESTION DU CACHE ET DU SERVICE WORKER (PWA)
 * * Pour éviter que les utilisateurs ne voient une ancienne version du site,
 * nous désactivons le Service Worker en production pour l'instant.
 * Cela force le navigateur à toujours demander les fichiers frais à Render/GitHub.
 */
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      // On désinscrit tous les anciens service workers trouvés
      console.log("[ServiceWorker] Suppression du cache pour mise à jour forcée");
      registration.unregister();
    }
  });
}

/**
 * INITIALISATION ET RENDU
 */
const renderApp = async () => {
  try {
    // 1. On initialise l'auth Supabase (gestion des tokens, etc.)
    await bootstrapSupabaseAuth();

    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error("L'élément racine #root est introuvable.");

    // 2. On lance le rendu React
    createRoot(rootElement).render(
      <HelmetProvider>
        <App />
      </HelmetProvider>
    );
  } catch (error) {
    console.error("Erreur lors de l'initialisation de l'application :", error);
  }
};

renderApp();