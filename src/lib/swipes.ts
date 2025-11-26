import { supabase } from "@/lib/supabaseClient";
import { Job } from "@/types/job";

/**
 * Type pour la table swipes avec la colonne is_superlike
 */
export interface Swipe {
  user_id: string;
  job_id: string;
  direction: "like" | "dislike";
  is_superlike: boolean;
  created_at?: string;
}

/**
 * Superliker un job pour un utilisateur
 * 
 * Si un swipe existe déjà pour (user_id, job_id), il sera mis à jour avec:
 * - direction = "like"
 * - is_superlike = true
 * 
 * Si aucun swipe n'existe, un nouveau sera créé avec ces valeurs.
 * 
 * @param userId - ID de l'utilisateur
 * @param jobId - ID du job à superliker
 * @returns Promise qui résout si le superlike a été sauvegardé avec succès
 */
export async function superlikeJob(userId: string, jobId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("swipes")
      .upsert(
        {
          user_id: userId,
          job_id: jobId,
          direction: "like",
          is_superlike: true,
        },
        {
          onConflict: "user_id,job_id",
        }
      );

    if (error) {
      console.error("[superlikeJob] Error saving superlike:", error);
      throw new Error(`Erreur lors de l'enregistrement du superlike: ${error.message}`);
    }

    console.log(`[superlikeJob] Successfully superliked job ${jobId} for user ${userId}`);
  } catch (err) {
    console.error("[superlikeJob] Unexpected error:", err);
    throw err;
  }
}

/**
 * Récupérer tous les jobs superlikés par un utilisateur
 * 
 * @param userId - ID de l'utilisateur
 * @returns Promise qui résout avec un tableau de jobs superlikés, triés par date de création (plus récent en premier)
 */
export async function getSuperlikedJobs(userId: string): Promise<Job[]> {
  try {
    // Récupérer les swipes avec is_superlike = true et les jobs associés
    const { data: swipesData, error: swipesError } = await supabase
      .from("swipes")
      .select("job_id, created_at, jobs(*)")
      .eq("user_id", userId)
      .eq("is_superlike", true)
      .eq("direction", "like")
      .order("created_at", { ascending: false });

    if (swipesError) {
      console.error("[getSuperlikedJobs] Error fetching superliked swipes:", swipesError);
      throw new Error(`Erreur lors du chargement des offres superlikées: ${swipesError.message}`);
    }

    if (!swipesData || swipesData.length === 0) {
      console.log("[getSuperlikedJobs] No superliked swipes found");
      return [];
    }

    // Extraire les jobs de la réponse
    // La structure de la réponse Supabase avec join est: { job_id, created_at, jobs: { ... } }
    const jobs = swipesData
      .map((swipe: any) => {
        // Si jobs est un objet (join réussi), l'utiliser directement
        if (swipe.jobs && typeof swipe.jobs === "object" && !Array.isArray(swipe.jobs)) {
          return swipe.jobs as Job;
        }
        // Si jobs est null ou undefined, on devra récupérer le job séparément
        return null;
      })
      .filter((job): job is Job => job !== null);
    
    // Si certains jobs sont manquants (null), les récupérer séparément
    if (jobs.length < swipesData.length) {
      const missingJobIds = swipesData
        .filter((swipe: any) => !swipe.jobs || Array.isArray(swipe.jobs))
        .map((swipe: any) => swipe.job_id);
      
      if (missingJobIds.length > 0) {
        const { data: missingJobs, error: missingError } = await supabase
          .from("jobs")
          .select("*")
          .in("id", missingJobIds);
        
        if (!missingError && missingJobs) {
          jobs.push(...missingJobs);
        }
      }
    }

    // Trier les jobs selon l'ordre des swipes (plus récent en premier)
    const sortedJobs = jobs.sort((a, b) => {
      const aSwipe = swipesData.find((s: any) => s.job_id === a.id);
      const bSwipe = swipesData.find((s: any) => s.job_id === b.id);
      if (!aSwipe || !bSwipe) return 0;
      return new Date(bSwipe.created_at).getTime() - new Date(aSwipe.created_at).getTime();
    });

    console.log(`[getSuperlikedJobs] Loaded ${sortedJobs.length} superliked jobs for user ${userId}`);
    return sortedJobs;
  } catch (err) {
    console.error("[getSuperlikedJobs] Unexpected error:", err);
    throw err;
  }
}

