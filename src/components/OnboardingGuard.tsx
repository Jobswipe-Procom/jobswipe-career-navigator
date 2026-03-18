import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

interface OnboardingGuardProps {
  children: ReactNode;
}

export const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const checkProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          // Si pas d'utilisateur, on laisse la logique d'auth gérer (routes publiques)
          if (!cancelled) {
            setAllowed(false);
            setChecking(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("first_name,target_role,experiences")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("[OnboardingGuard] Erreur chargement profil:", error);
        }

        const firstName = data?.first_name;
        const targetRole = data?.target_role;
        const experiences = Array.isArray(data?.experiences) ? data?.experiences : [];
        const hasExperience = experiences.length > 0;

        const isComplete = Boolean(firstName && targetRole && hasExperience);

        if (!cancelled) {
          if (isComplete) {
            setAllowed(true);
          } else {
            // Redirection vers la page de profil pour onboarding
            navigate("/profil", {
              replace: true,
              state: { fromOnboarding: true, redirectTo: location.pathname },
            });
            setAllowed(false);
          }
          setChecking(false);
        }
      } catch (e) {
        console.error("[OnboardingGuard] Erreur inattendue:", e);
        if (!cancelled) {
          // En cas de doute, on redirige vers le profil pour sécuriser le flux
          navigate("/profil", {
            replace: true,
            state: { fromOnboarding: true, redirectTo: location.pathname },
          });
          setAllowed(false);
          setChecking(false);
        }
      }
    };

    checkProfile();

    return () => {
      cancelled = true;
    };
  }, [navigate, location.pathname]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Vérification de votre profil...</div>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
};

