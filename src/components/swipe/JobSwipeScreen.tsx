import React from "react";
import { Job } from "@/types/job";
import { JobCard } from "./JobCard";
import { X, Heart } from "lucide-react";

interface JobSwipeScreenProps {
  offer: Job;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onOpenDetails?: () => void;
  formatSalary: (job: Job) => string | null;
  getJobDescription: (job: Job) => string;
  disabled?: boolean;
  score?: number | null;
}

/**
 * Composant JobSwipeScreen qui gère la carte swipeable + les boutons mobile
 * - Affiche la carte JobCard
 * - Affiche deux gros boutons en bas sur mobile : "Passer" (dislike) et "Ajouter à mes offres" (like)
 * - Les boutons appellent les mêmes callbacks que le swipe
 */
export const JobSwipeScreen = ({
  offer,
  onSwipeRight,
  onSwipeLeft,
  onOpenDetails,
  formatSalary,
  getJobDescription,
  disabled = false,
  score,
}: JobSwipeScreenProps) => {
  
  // Calcul de la couleur dynamique (Rouge 0 -> Vert 120)
  const hue = score !== undefined && score !== null ? Math.min(120, Math.max(0, (score / 100) * 120)) : 0;
  const scoreStyle = score !== undefined && score !== null ? {
    backgroundColor: `hsl(${hue}, 85%, 96%)`,
    color: `hsl(${hue}, 90%, 35%)`,
    borderColor: `hsl(${hue}, 80%, 80%)`,
  } : {};

  return (
    <div className="flex flex-col h-full">
      {/* Carte swipeable */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 relative">
        {score !== undefined && score !== null && (
          <div 
            className="absolute top-8 left-8 z-20 px-3 py-1 rounded-full border font-bold text-sm shadow-sm flex items-center gap-1 animate-in fade-in zoom-in duration-300"
            style={scoreStyle}
          >
            <span className="text-xs font-normal opacity-80">Match</span>
            {score}%
          </div>
        )}
        <JobCard
          offer={offer}
          onSwipeRight={onSwipeRight}
          onSwipeLeft={onSwipeLeft}
          onOpenDetails={onOpenDetails}
          formatSalary={formatSalary}
          getJobDescription={getJobDescription}
          disabled={disabled}
        />
      </div>

      {/* Boutons d'action mobile - visibles uniquement sur mobile */}
      <div className="md:hidden pb-6 px-4">
        <div className="flex gap-4 max-w-[850px] mx-auto">
          {/* Bouton "Passer" (dislike) */}
          <button
            onClick={onSwipeLeft}
            disabled={disabled}
            className="flex-1 bg-white border-2 border-rose-200 text-rose-600 rounded-2xl py-4 px-6 font-semibold text-lg shadow-lg hover:bg-rose-50 hover:scale-105 cursor-pointer active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <X className="w-6 h-6" strokeWidth={3} />
            <span>Passer</span>
          </button>

          {/* Bouton "Ajouter à mes offres" (like) */}
          <button
            onClick={onSwipeRight}
            disabled={disabled}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl py-4 px-6 font-semibold text-lg shadow-lg hover:from-emerald-600 hover:to-teal-600 hover:scale-105 cursor-pointer active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Heart className="w-6 h-6" fill="currentColor" />
            <span>Ajouter à mes offres</span>
          </button>
        </div>
      </div>
    </div>
  );
};
