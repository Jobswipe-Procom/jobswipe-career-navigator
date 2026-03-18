import { X, Star, Heart, MapPin, Bookmark, Clock } from "lucide-react";

export function HeroPhoneMockup() {
  return (
    <div className="relative flex justify-center lg:justify-end">
      <div className="absolute -inset-10 rounded-[3.5rem] bg-gradient-to-br from-violet-200/50 via-fuchsia-100/30 to-blue-200/40 blur-3xl" />

      <div className="relative mx-auto w-[220px] sm:w-[240px] aspect-[9/19.5]">
        <div className="absolute inset-0 overflow-hidden rounded-[2.75rem] border-[10px] border-slate-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)]">
          <div className="absolute left-1/2 top-0 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-slate-900" />

          <div className="relative flex h-full flex-col justify-start overflow-hidden rounded-[2rem] bg-gradient-to-b from-violet-50/95 to-violet-100/60">
            {/* Statut */}
            <div className="flex shrink-0 items-center justify-center pt-5 pb-0.5">
              <span className="text-[10px] font-semibold text-slate-500">9:41</span>
            </div>

            {/* Carte puis boutons : alignés en haut, espacement serré */}
            <div className="flex min-h-0 flex-1 flex-col justify-start gap-0 px-3 pb-1 pt-1">
              <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/60">
                {/* Header dégradé : uniquement arrondi en haut, intégré à la carte */}
                <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-violet-500">
                  {/* Fond décoratif (M) — ne pas dépasser */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                    <span className="text-5xl font-black leading-none text-white/15 select-none" aria-hidden>
                      M
                    </span>
                  </div>
                  <div className="pointer-events-none absolute bottom-0 right-0 h-14 w-14 rounded-full bg-white/10 blur-xl" />

                  {/* Barre header : gauche (badges) | droite (icônes) — pas de chevauchement */}
                  <div className="relative z-10 flex min-h-[76px] flex-row items-start justify-between gap-2 px-2.5 pb-2 pt-2.5">
                    {/* Gauche : badges empilés */}
                    <div className="flex min-w-0 max-w-[62%] flex-col gap-1">
                      <span className="block max-w-full rounded-full border border-white/30 bg-white/95 px-2 py-1 text-center text-[8px] font-medium leading-tight text-blue-700 shadow-sm backdrop-blur-sm">
                        Offre correspondant à votre profil
                      </span>
                      <span className="inline-flex w-fit items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
                        Match 80%
                      </span>
                    </div>
                    {/* Droite : icônes */}
                    <div className="flex shrink-0 gap-1.5 pt-0.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-md">
                        <Bookmark className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-md">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Corps carte */}
                <div className="rounded-b-2xl border-t border-slate-100 bg-white px-2.5 py-2.5">
                  <h3 className="text-[12px] font-bold leading-tight text-slate-900">
                    Software Engineer, DevEx
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="font-medium text-slate-700">Mistral AI</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      Paris
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-1 text-[8px] text-slate-500">
                    <span>CDI</span>
                    <span className="text-slate-300">•</span>
                    <span>Télétravail non autorisé</span>
                    <span className="text-slate-300">•</span>
                    <span>Salaire : Non spécifié</span>
                  </div>
                  <p className="mt-1 flex items-center gap-0.5 text-[8px] text-slate-400">
                    <Clock className="h-2.5 w-2.5 shrink-0" />
                    Il y a 4 jours
                  </p>
                  <p className="mt-1.5 text-[9px] leading-snug text-slate-600 line-clamp-3">
                    Rejoignez l'équipe Developer Experience pour améliorer le cycle de développement : tooling, CI/CD et qualité de code aux côtés des équipes produit.
                  </p>
                </div>
              </div>

              {/* Boutons — proches de la carte (mt-2 max) */}
              <div className="mt-2 flex shrink-0 items-center justify-start gap-2">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-white py-2.5 text-[11px] font-semibold text-red-500 shadow-sm"
                  aria-label="Passer"
                >
                  <X className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  <span>Passer</span>
                </button>
                <button
                  type="button"
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-blue-300 bg-blue-50 shadow-md"
                  aria-label="Superlike"
                >
                  <Star className="h-5 w-5 fill-blue-500 text-blue-500" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-[11px] font-semibold text-white shadow-md"
                  aria-label="Ajouter à mes offres"
                >
                  <Heart className="h-4 w-4 shrink-0 fill-current" strokeWidth={2} />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
