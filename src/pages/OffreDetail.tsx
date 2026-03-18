import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LogoHeader } from "@/components/LogoHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchJobById } from "@/lib/supabase";
import { supabase } from "@/lib/supabaseClient";
import { addFavorite, removeFavorite, isFavorite } from "@/lib/storage";
import { downloadFile } from "@/lib/utils";
import { Job, UserProfile } from "@/types/job";
import { Profile } from "@/types/profile";
import { Loader2, ExternalLink, FileText, TrendingUp, Heart, Mail, Sparkles, PenTool, ArrowLeft, Home, Puzzle, Check, Save, HelpCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GeneratedDocumentView } from "@/components/GeneratedDocumentView";
import { SEOHead } from "@/components/seo";
import { buildUrl } from "@/lib/apiClient";

const OffreDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingCV, setGeneratingCV] = useState(false);
  const [generatingCL, setGeneratingCL] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<{
    cv?: { pdf: string; content: any; html?: string };
    cl?: { pdf: string; content: any; html?: string };
  } | null>(null);
  const [initialTab, setInitialTab] = useState<'cv' | 'cl'>('cv');
  const [showDocuments, setShowDocuments] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [showConfirmUnapply, setShowConfirmUnapply] = useState(false);
  const [isSuperlike, setIsSuperlike] = useState(false);
  const [isImported, setIsImported] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (data) {
          const loaded: Profile = {
            id: data.id,
            first_name: data.first_name,
            last_name: data.last_name,
            city: data.city,
            target_role: data.target_role,
            experience_level: data.experience_level,
            created_at: data.created_at,
            email: data.email,
            phone: data.phone,
            linkedin: data.linkedin,
            availability: data.availability,
            education: Array.isArray(data.education) ? data.education : [],
            experiences: Array.isArray(data.experiences) ? data.experiences : [],
            projects: Array.isArray(data.projects) ? data.projects : [],
            languages: Array.isArray(data.languages) ? data.languages : [],
            hardSkills: Array.isArray(data.hard_skills) ? data.hard_skills : [],
            softSkills: Array.isArray(data.soft_skills) ? data.soft_skills : [],
            interests: Array.isArray(data.interests) ? data.interests : [],
            activities: Array.isArray(data.activities) ? data.activities : [],
            gender: data.gender,
            handicap: data.handicap,
            salary_expectations: data.salary_expectations,
          } as unknown as Profile;
          setUserProfile(loaded);
        }
      }
    };
    fetchProfile();
  }, []);

  const profile: UserProfile = userProfile
    ? {
        firstName: userProfile.first_name || "Utilisateur",
        lastName: userProfile.last_name || "",
        formations: userProfile.education && userProfile.education.length > 0
          ? userProfile.education.map(e => `${e.degree} - ${e.school} (${e.startDate} - ${e.endDate})`).join('\n')
          : "Aucune formation renseignée.",
        experiences: userProfile.experiences && userProfile.experiences.length > 0
          ? userProfile.experiences.map(e => `${e.role} chez ${e.company} (${e.startDate} - ${e.endDate})\n${e.description}`).join('\n\n')
          : "Aucune expérience renseignée.",
        competences: [
          ...(userProfile.hardSkills || []),
          ...(userProfile.softSkills || []),
          ...(userProfile.languages?.map(l => `${l.name} (${l.level})`) || [])
        ].join(', ') || "Aucune compétence renseignée.",
        contact: [userProfile.email, userProfile.phone, userProfile.city, userProfile.linkedin].filter(Boolean).join(' | ') || "Aucun contact renseigné."
      }
    : {
        firstName: "Utilisateur",
        lastName: "Exemple",
        formations: "Aucune formation renseignée. Allez sur la page de profil pour en ajouter.",
        experiences: "Aucune expérience renseignée. Allez sur la page de profil pour en ajouter.",
        competences: "Aucune compétence renseignée. Allez sur la page de profil pour en ajouter.",
        contact: "Aucun contact renseigné. Allez sur la page de profil pour en ajouter.",
      };

  useEffect(() => {
    if (id) {
      loadJob(id);
      setFavorite(isFavorite(id));
    }
  }, [id]);

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && id) {
        const { data } = await supabase
          .from('swipes')
          .select('status, is_superlike')
          .eq('user_id', user.id)
          .eq('job_id', id)
          .maybeSingle();
        
        if (data) {
          setApplicationStatus(data.status || 'liked');
          setIsSuperlike(data.is_superlike);
        }
      }
    };
    checkStatus();
  }, [id]);

  // Chargement des documents générés depuis le localStorage
  useEffect(() => {
    if (id) {
      const savedDocs = localStorage.getItem(`jobswipe_docs_${id}`);
      if (savedDocs) {
        try {
          setGeneratedDocs(JSON.parse(savedDocs));
        } catch (e) {
          console.error("Erreur lors du chargement des documents sauvegardés", e);
        }
      }
    }
  }, [id]);

  const loadJob = async (jobId: string) => {
    try {
      // Vérifier d'abord dans le stockage local
      const localJobs: Job[] = JSON.parse(localStorage.getItem("JOBSWIPE_LOCAL_IMPORTED_JOBS") || "[]");
      const localJob = localJobs.find(j => j.id === jobId);
      
      if (localJob) {
        setJob(localJob);
        setIsImported(true);
        return;
      }

      setIsImported(false);
      const data = await fetchJobById(jobId);
      setJob(data);
    } catch (error) {
      console.error("Error loading job:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    if (!id) return;

    if (favorite) {
      removeFavorite(id);
      toast({ description: "Retiré des favoris" });
    } else {
      addFavorite(id);
      toast({ description: "Ajouté aux favoris" });
    }
    setFavorite(!favorite);
  };

  const formatProfileForBackend = (profile: Profile) => {
    return {
      first_name: profile.first_name,
      last_name: profile.last_name,
      full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Candidat",
      contacts: {
        emails: [profile.email],
        phones: [profile.phone],
        locations: [profile.city]
      },
      social_links: profile.linkedin ? [{ platform: "LinkedIn", url: profile.linkedin }] : [],
      raw_summary: `${profile.target_role} - ${profile.experience_level}`,
      professional_experiences: profile.experiences.map(e => ({
        title: e.role,
        company: e.company,
        start_date: e.startDate,
        end_date: e.endDate,
        description: e.description,
        location: "" 
      })),
      education: profile.education.map(e => ({
        degree: e.degree,
        school: e.school,
        start_date: e.startDate,
        end_date: e.endDate,
        description: ""
      })),
      skills: {
        hard_skills: profile.hardSkills,
        soft_skills: profile.softSkills,
        languages: profile.languages.map(l => `${l.name} (${l.level})`)
      },
      interests: profile.interests,
      academic_projects: profile.projects || []
    };
  };

  const formatJobForBackend = (job: Job) => {
    return {
      title: job.title,
      company_name: job.company,
      location: job.location,
      contract_type: job.contract_type,
      seniority_level: job.niveau,
      description: job.description || job.raw?.description,
      // Champs optionnels pour le générateur
      missions: [], 
      requirements: [],
      hard_skills: [],
      soft_skills: [],
      language: "fr"
    };
  };

  // Fonction robuste pour télécharger un PDF depuis une chaîne Base64
  const downloadBase64Pdf = (filename: string, base64Data: string) => {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Erreur téléchargement PDF:", e);
      toast({ variant: "destructive", description: "Erreur lors de la création du fichier PDF." });
    }
  };

  const handleGenerateApplication = async () => {
    if (!job || !userProfile) {
      toast({ variant: "destructive", description: "Profil ou offre manquant" });
      return;
    }

    setGenerating(true);
    toast({ description: "Démarrage du Pack Candidature IA..." });

    // Vérifier si des documents existent déjà dans le localStorage
    let existingDocs: { cv?: any, cl?: any } = {};
    if (id) {
      const saved = localStorage.getItem(`jobswipe_docs_${id}`);
      if (saved) {
        try {
          existingDocs = JSON.parse(saved);
        } catch (e) {
          console.error("Erreur parsing localStorage", e);
        }
      }
    }

    // Si le pack complet existe déjà, on l'affiche directement
    if (existingDocs.cv && existingDocs.cl) {
      setInitialTab('cv');
      setGeneratedDocs(existingDocs);
      setShowDocuments(true);
      setGenerating(false);
      return;
    }

    try {
      const cvData = formatProfileForBackend(userProfile);
      const offerData = formatJobForBackend(job);
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      let cvResult = existingDocs.cv;
      let clResult = existingDocs.cl;

      // --- ÉTAPE 1 : CV (si pas déjà généré) ---
      if (!cvResult) {
        toast({ description: "1/2 Génération du CV optimisé..." });
        const resCV = await fetch(buildUrl("/generate-cv"), {
          method: 'POST',
          headers,
          body: JSON.stringify({ cv_data: cvData, offer_data: offerData, gender: (userProfile as any)?.gender || "M" })
        });

        if (!resCV.ok) {
          toast({ variant: "destructive", description: `Erreur backend CV (${resCV.status})` });
          throw new Error(`Erreur lors de la génération du CV (${resCV.status})`);
        }
        const dataCV = await resCV.json();
        
        cvResult = dataCV.files?.cv_pdf 
          ? { pdf: dataCV.files.cv_pdf, content: dataCV.content, html: dataCV.html } 
          : undefined;
      }

      // --- ÉTAPE 2 : Lettre de motivation (si pas déjà générée) ---
      if (!clResult) {
        toast({ description: "2/2 Génération de la lettre de motivation..." });
        const resCL = await fetch(buildUrl("/generate-cover-letter"), {
          method: 'POST',
          headers,
          body: JSON.stringify({ cv_data: cvData, offer_data: offerData, gender: (userProfile as any)?.gender || "M" })
        });

        if (!resCL.ok) {
          toast({ variant: "destructive", description: `Erreur backend lettre (${resCL.status})` });
          throw new Error(`Erreur lors de la génération de la lettre (${resCL.status})`);
        }
        const dataCL = await resCL.json();
        
        clResult = dataCL.files?.cl_pdf 
          ? { pdf: dataCL.files.cl_pdf, content: dataCL.content, html: dataCL.html } 
          : undefined;
      }

      const newDocs = {
        cv: cvResult,
        cl: clResult
      };

      setInitialTab('cv');
      setGeneratedDocs(newDocs);
      setShowDocuments(true);
      localStorage.setItem(`jobswipe_docs_${id}`, JSON.stringify(newDocs));
      toast({ description: "Pack Candidature généré !" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", description: error instanceof Error ? error.message : "Erreur technique" });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateCV = async () => {
    if (!job || !userProfile) {
      toast({ variant: "destructive", description: "Profil ou offre manquant" });
      return;
    }

    // Vérifier si le CV existe déjà dans le localStorage
    let existingDocs: { cv?: any, cl?: any } = {};
    if (id) {
      const saved = localStorage.getItem(`jobswipe_docs_${id}`);
      if (saved) {
        try { existingDocs = JSON.parse(saved); } catch (e) {}
      }
    }
    if (existingDocs.cv) {
      setInitialTab('cv');
      setGeneratedDocs(existingDocs);
      setShowDocuments(true);
      return;
    }

    setGeneratingCV(true);
    toast({ description: "Génération de votre CV par l'IA en cours..." });

    try {
      const cvData = formatProfileForBackend(userProfile);
      const offerData = formatJobForBackend(job);
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      const response = await fetch(buildUrl("/generate-cv"), {
        method: 'POST',
        headers,
        body: JSON.stringify({ cv_data: cvData, offer_data: offerData, gender: (userProfile as any)?.gender || "M" })
      });

      if (!response.ok) {
        toast({ variant: "destructive", description: `Erreur backend CV (${response.status})` });
        throw new Error(`Erreur lors de la génération du CV (${response.status})`);
      }

      const data = await response.json();

      if (data.files?.cv_pdf) {
        const newDocs = {
          cv: { pdf: data.files.cv_pdf, content: data.content, html: data.html },
          cl: existingDocs.cl // Conserver la lettre si elle existe
        };
        setInitialTab('cv');
        setShowDocuments(true);
        setGeneratedDocs(newDocs);
        localStorage.setItem(`jobswipe_docs_${id}`, JSON.stringify(newDocs));
        toast({ description: "CV généré avec succès !" });
      } else {
        throw new Error("Le fichier CV PDF n'a pas été retourné par l'API.");
      }

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", description: error instanceof Error ? error.message : "Erreur technique" });
    } finally {
      setGeneratingCV(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!job || !userProfile) {
      toast({ variant: "destructive", description: "Profil ou offre manquant" });
      return;
    }

    // Vérifier si la lettre existe déjà dans le localStorage
    let existingDocs: { cv?: any, cl?: any } = {};
    if (id) {
      const saved = localStorage.getItem(`jobswipe_docs_${id}`);
      if (saved) {
        try { existingDocs = JSON.parse(saved); } catch (e) {}
      }
    }
    if (existingDocs.cl) {
      setInitialTab('cl');
      setGeneratedDocs(existingDocs);
      setShowDocuments(true);
      return;
    }

    setGeneratingCL(true);
    toast({ description: "Génération de votre lettre de motivation par l'IA en cours..." });

    try {
      const cvData = formatProfileForBackend(userProfile);
      const offerData = formatJobForBackend(job);
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      const response = await fetch(buildUrl("/generate-cover-letter"), {
        method: 'POST',
        headers,
        body: JSON.stringify({ cv_data: cvData, offer_data: offerData, gender: (userProfile as any)?.gender || "M" })
      });

      if (!response.ok) {
        toast({ variant: "destructive", description: `Erreur backend lettre (${response.status})` });
        throw new Error(`Erreur lors de la génération de la lettre (${response.status})`);
      }

      const data = await response.json();

      if (data.files?.cl_pdf) {
        const newDocs = {
          cv: existingDocs.cv, // Conserver le CV s'il existe
          cl: { pdf: data.files.cl_pdf, content: data.content, html: data.html }
        };
        setInitialTab('cl');
        setShowDocuments(true);
        setGeneratedDocs(newDocs);
        localStorage.setItem(`jobswipe_docs_${id}`, JSON.stringify(newDocs));
        toast({ description: "Lettre de motivation générée avec succès !" });
      } else {
        throw new Error("Le fichier de lettre de motivation PDF n'a pas été retourné par l'API.");
      }

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", description: error instanceof Error ? error.message : "Erreur technique" });
    } finally {
      setGeneratingCL(false);
    }
  };

  const handleUpdateContent = async (newContent: any, docType: 'cv' | 'cl', style: string = "finance") => {
    if (!job || !userProfile || !id) {
      toast({ variant: "destructive", description: "Données manquantes pour la mise à jour." });
      return;
    }

    toast({ description: "Mise à jour du document en cours..." });

    try {
      const cvData = formatProfileForBackend(userProfile);
      const offerData = formatJobForBackend(job);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      const endpoint = docType === 'cv' ? '/generate-cv' : '/generate-cover-letter';
      
      const response = await fetch(buildUrl(endpoint), {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          cv_data: cvData, 
          offer_data: offerData, 
          gender: (userProfile as any)?.gender || "M",
          manual_content: newContent,
          style: style 
        })
      });

      if (!response.ok) {
        toast({ variant: "destructive", description: `Erreur backend (${response.status})` });
        throw new Error(`Erreur lors de la mise à jour du document (${response.status})`);
      }

      const data = await response.json();

      if (docType === 'cv' && data.files?.cv_pdf) {
        setGeneratedDocs(prevDocs => {
          const updatedDocs = {
            ...prevDocs,
            cv: { pdf: data.files.cv_pdf, content: data.content, html: data.html },
          };
          localStorage.setItem(`jobswipe_docs_${id}`, JSON.stringify(updatedDocs));
          return updatedDocs;
        });
        toast({ description: "CV mis à jour avec succès !" });
      } 
      else if (docType === 'cl' && data.files?.cl_pdf) {
        setGeneratedDocs(prevDocs => {
          const updatedDocs = {
            ...prevDocs,
            cl: { 
              pdf: data.files.cl_pdf, 
              content: data.content,
              html: data.html || prevDocs?.cl?.html // Fallback si pas de HTML renvoyé (cas update manuel vs IA)
            },
          };
          localStorage.setItem(`jobswipe_docs_${id}`, JSON.stringify(updatedDocs));
          return updatedDocs;
        });
        toast({ description: "Document mis à jour avec succès !" });
      } else {
        throw new Error("Le fichier CV PDF mis à jour n'a pas été retourné par l'API.");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du contenu:", error);
      toast({ variant: "destructive", description: error instanceof Error ? error.message : "Erreur technique lors de la mise à jour" });
      throw error;
    }
  };

  const handleRegenerateWithAI = async () => {
    if (!job || !userProfile || !id) {
      toast({ variant: "destructive", description: "Données manquantes pour la régénération." });
      return;
    }

    toast({ description: "Régénération du contenu par l'IA..." });

    try {
      const cvData = formatProfileForBackend(userProfile);
      const offerData = formatJobForBackend(job);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      const response = await fetch(buildUrl("/generate-cv"), {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          cv_data: cvData, 
          offer_data: offerData,
          gender: (userProfile as any)?.gender || "M"
          // manual_content est omis pour déclencher la régénération par l'IA
        })
      });

      if (!response.ok) {
        toast({ variant: "destructive", description: `Erreur backend CV (${response.status})` });
        throw new Error(`Erreur lors de la régénération du CV (${response.status})`);
      }

      const data = await response.json();

      if (data.files?.cv_pdf) {
        setGeneratedDocs(prevDocs => {
          const updatedDocs = {
            ...prevDocs,
            cv: { pdf: data.files.cv_pdf, content: data.content, html: data.html },
          };
          localStorage.setItem(`jobswipe_docs_${id}`, JSON.stringify(updatedDocs));
          return updatedDocs;
        });
        toast({ description: "Contenu régénéré avec succès !" });
      } else {
        throw new Error("Le fichier CV PDF régénéré n'a pas été retourné par l'API.");
      }
    } catch (error) {
      console.error("Erreur lors de la régénération du contenu:", error);
      toast({ variant: "destructive", description: error instanceof Error ? error.message : "Erreur technique lors de la régénération" });
      throw error;
    }
  };

  const handleSyncWithExtension = () => {
    if (!generatedDocs?.cv && !generatedDocs?.cl) {
        toast({ variant: "destructive", description: "Veuillez d'abord générer les documents (CV ou Lettre) avant d'envoyer." });
        return;
    }

    // Priorité aux infos du CV généré, sinon fallback sur le profil utilisateur
    const cvContact = generatedDocs?.cv?.content?.contact_info;
    
    // Extraction intelligente du nom/prénom
    let firstname = userProfile?.first_name || "";
    let lastname = userProfile?.last_name || "";
    
    if (cvContact?.name && (!firstname || !lastname)) {
        const parts = cvContact.name.trim().split(" ");
        if (parts.length > 0) {
             if (!firstname) firstname = parts[0];
             if (!lastname) lastname = parts.slice(1).join(" ");
        }
    }

    const identity = { 
      firstname: firstname, 
      lastname: lastname, 
      email: cvContact?.email || userProfile?.email || "", 
      phone: cvContact?.phone || userProfile?.phone || "",
      city: cvContact?.city || userProfile?.city || "",
      gender: (userProfile as any)?.gender || "",
      handicap: (userProfile as any)?.handicap || ""
    };

    const links = { 
      linkedin: cvContact?.linkedin || userProfile?.linkedin || "", 
      portfolio: "" 
    };

    const documents = { 
      cv_base64: "", 
      cv_name: "", 
      cv_type: "", 
      cover_letter_text: "", 
      cover_letter_base64: "", 
      cover_letter_name: "", 
      cover_letter_type: "" 
    };

    // Préparation du CV PDF
    if (generatedDocs?.cv?.pdf) {
        const prefix = "data:application/pdf;base64,";
        documents.cv_base64 = generatedDocs.cv.pdf.startsWith("data:") 
            ? generatedDocs.cv.pdf 
            : prefix + generatedDocs.cv.pdf;
        documents.cv_name = `CV_${lastname || "Candidat"}.pdf`;
        documents.cv_type = "application/pdf";
    }

    // Préparation de la Lettre de Motivation
    if (generatedDocs?.cl) {
        if (generatedDocs.cl.pdf) {
            const prefix = "data:application/pdf;base64,";
            documents.cover_letter_base64 = generatedDocs.cl.pdf.startsWith("data:") 
                ? generatedDocs.cl.pdf 
                : prefix + generatedDocs.cl.pdf;
            documents.cover_letter_name = `Lettre_Motivation_${lastname || "Candidat"}.pdf`;
            documents.cover_letter_type = "application/pdf";
        }

        // Texte brut pour remplissage automatique des champs texte
        const content = generatedDocs.cl.content;
        if (content) {
            const textParts = [
                content.greeting,
                content.para1,
                content.para2,
                content.para3,
                content.para4,
                content.signature
            ].filter(Boolean);
            documents.cover_letter_text = textParts.join("\n\n");
        }
    }

    const extensionData = {
      identity,
      links,
      documents,
      ai_responses: { 
        why_us: "", 
        salary_expectations: (userProfile as any)?.salary_expectations || "" 
      },
      structured_cv: generatedDocs?.cv?.content || null
    };

    console.log("Données envoyées à l'extension :", extensionData);

    window.postMessage({
      type: "JOBSWIPE_SYNC_PROFILE",
      payload: extensionData
    }, "*");

    toast({ description: "Données (CV, Lettre, Profil) envoyées à l'extension !" });
  };

  const handleApply = async () => {
    if (!job) return;
    
    window.open(job.redirect_url, "_blank");

    // Marquer comme postulé automatiquement si ce n'est pas déjà le cas
    if (applicationStatus !== 'applied') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from('swipes').upsert({
            user_id: user.id,
            job_id: job.id,
            direction: 'like',
            status: 'applied'
          }, { onConflict: 'user_id,job_id' });
          
          if (error) {
            console.error("handleApply: Erreur Supabase", error);
            throw error;
          }

          setApplicationStatus('applied');
          toast({ description: "Offre marquée comme postulée" });
        }
      } catch (e) {
        console.error("Erreur lors de la mise à jour du statut:", e);
      }
    }
  };

  const updateApplicationStatus = async (newStatus: string) => {
    if (!job) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
        const { error } = await supabase.from('swipes').upsert({
          user_id: user.id,
          job_id: job.id,
          direction: 'like',
          status: newStatus
        }, { onConflict: 'user_id,job_id' });
        
        if (error) {
            console.error("updateApplicationStatus: Erreur Supabase", error);
            throw error;
        }

        setApplicationStatus(newStatus);
        toast({ description: newStatus === 'applied' ? "Offre marquée comme postulée" : "Statut 'Postulé' retiré" });
    } catch (e) {
        console.error(e);
        toast({ variant: "destructive", description: "Erreur lors de la mise à jour du statut" });
    }
  };

  const toggleApplicationStatus = () => {
    if (applicationStatus === 'applied') {
      setShowConfirmUnapply(true);
    } else {
      updateApplicationStatus('applied');
    }
  };

  const handleBack = () => {
    if (isSuperlike) {
      navigate('/jobswipe/offres', { state: { initialView: 'superliked' } });
    } else if (isImported) {
      navigate('/jobswipe/offres', { state: { initialView: 'imported' } });
    } else if (applicationStatus) {
      navigate('/jobswipe/offres', { state: { initialView: 'liked' } });
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <LogoHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50">
        <LogoHeader />
        <div className="px-6 py-8 text-center">
          <p className="text-slate-600">Offre non trouvée</p>
        </div>
      </div>
    );
  }

  if (showDocuments && generatedDocs && job) {
    return (
      <GeneratedDocumentView 
        cvData={generatedDocs.cv}
        clData={generatedDocs.cl}
        onBack={() => setShowDocuments(false)}
        jobTitle={job.title}
        companyName={job.company}
        userProfile={userProfile}
        initialTab={initialTab}
        onUpdateContent={handleUpdateContent}
        onRegenerateWithAI={handleRegenerateWithAI}
      />
    );
  }

  // Generate JobPosting schema for rich results
  const generateJobSchema = (job: Job) => {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.raw?.description || `Offre d'emploi: ${job.title} chez ${job.company}`,
      "datePosted": job.created_at,
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.location,
          "addressCountry": "FR"
        }
      },
      "employmentType": mapContractTypeToSchema(job.contract_type)
    };

    // Add salary if available
    if (job.salary_min && job.salary_max) {
      schema.baseSalary = {
        "@type": "MonetaryAmount",
        "currency": "EUR",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": job.salary_min,
          "maxValue": job.salary_max,
          "unitText": "YEAR"
        }
      };
    }

    return schema;
  };

  // Generate BreadcrumbList schema for navigation hierarchy
  const generateBreadcrumbSchema = (job: Job) => {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": window.location.origin
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Offres d'emploi",
          "item": `${window.location.origin}/#/jobswipe/offres`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": `${job.title} chez ${job.company}`,
          "item": `${window.location.origin}${window.location.pathname}${window.location.hash}`
        }
      ]
    };
  };

  const mapContractTypeToSchema = (contractType: string): string => {
    const mapping: { [key: string]: string } = {
      "CDI": "FULL_TIME",
      "CDD": "TEMPORARY",
      "Stage": "INTERN",
      "Alternance": "INTERN",
      "Freelance": "CONTRACTOR"
    };
    return mapping[contractType] || "OTHER";
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {job && (
        <SEOHead
          title={`${job.title} chez ${job.company}`}
          description={`Postulez à ${job.title} chez ${job.company} à ${job.location}. ${job.contract_type}. Découvrez les détails de l'offre.`}
          canonical={`${window.location.origin}${window.location.pathname}${window.location.hash}`}
          jsonLd={[generateJobSchema(job), generateBreadcrumbSchema(job)]}
        />
      )}
      {/* Bordures colorées subtiles sur les côtés */}
      <div className="fixed left-0 top-0 bottom-0 w-[5cm] bg-gradient-to-b from-violet-200 via-purple-200 to-indigo-200 opacity-50 blur-3xl z-0 pointer-events-none" />
      <div className="fixed right-0 top-0 bottom-0 w-[5cm] bg-gradient-to-b from-blue-200 via-indigo-200 to-violet-200 opacity-50 blur-3xl z-0 pointer-events-none" />
      
      {/* Bouton Retour - Fixe en haut à gauche */}
      <button
        onClick={handleBack}
        className="fixed top-4 left-4 z-50 w-12 h-12 rounded-full bg-white/80 backdrop-blur-lg border border-white/50 shadow-lg flex items-center justify-center transition-all duration-200 ease-out hover:bg-white/95 hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
        title="Retour"
        aria-label="Retour"
      >
        <ArrowLeft className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
      </button>

      {/* Bouton Accueil - Fixe en haut à droite */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-white/80 backdrop-blur-lg border border-white/50 shadow-lg flex items-center justify-center transition-all duration-200 ease-out hover:bg-white/95 hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
        title="Retour à l'accueil"
        aria-label="Retour à l'accueil"
      >
        <Home className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
      </button>

      <div className="relative z-10">
        <LogoHeader />
      </div>
      
      <div className="px-6 py-8 max-w-7xl mx-auto relative z-10 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-slate-100 h-full">
          <CardHeader className="relative">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-foreground pr-16">Poste</h2>
            </div>
            <p className="text-muted-foreground text-sm mt-1">{job.company}</p>
            
            <SecondaryButton
              variant={favorite ? "favorite" : "default"}
              onClick={toggleFavorite}
              className="mt-3"
            >
              <Heart className={`w-4 h-4 mr-2 ${favorite ? "fill-current" : ""}`} />
              {favorite ? "Retirer des favoris" : "Favoris"}
            </SecondaryButton>
          </CardHeader>

          <CardContent className="space-y-6">
            {userProfile && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Profil</h3>
                <p className="text-sm text-muted-foreground">
                  {profile.formations.split("\n")[0]} • {profile.competences.split(",")[0]}
                </p>
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{job.title}</h1>
              <p className="text-sm text-muted-foreground">Offre d'emploi</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">À propos de l'entreprise</h3>
              <p className="text-sm text-muted-foreground">
                {job.company} - Secteur {job.secteur}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Détails du poste</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p>📍 {job.location || "Non spécifié"}</p>
                  <p>📄 {job.contract_type || job.raw?.contract_type || "Non spécifié"}</p>
                  <p>🎓 {job.niveau || job.raw?.seniority_level || "Non spécifié"}</p>
                  {job.famille && <p>💼 {job.famille}</p>}
                  {job.raw?.salary && <p>💰 {job.raw.salary}</p>}
                </div>
                {job.raw?.keywords && job.raw.keywords.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium text-foreground">Mots-clés :</p>
                    <div className="flex flex-wrap gap-1">
                      {job.raw.keywords.map((kw: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs font-normal">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {job.raw?.missions && Array.isArray(job.raw.missions) && job.raw.missions.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Missions</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {job.raw.missions.map((mission: string, index: number) => (
                    <li key={index}>{mission}</li>
                  ))}
                </ul>
              </div>
            )}

            {((job.raw?.Education && job.raw.Education.length > 0) || (job.raw?.requirements && job.raw.requirements.length > 0)) && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Profil recherché</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {job.raw?.Education && job.raw.Education.length > 0 && (
                    <div>
                      <span className="font-medium text-foreground">Formation : </span>
                      <ul className="list-disc pl-5 mt-1">
                        {job.raw.Education.map((edu: string, i: number) => (
                          <li key={i}>{edu}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.raw?.requirements && job.raw.requirements.length > 0 && (
                    <div>
                      <span className="font-medium text-foreground">Pré-requis : </span>
                      <ul className="list-disc pl-5 mt-1">
                        {job.raw.requirements.map((req: string, i: number) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {((job.raw?.hard_skills && job.raw.hard_skills.length > 0) || (job.raw?.soft_skills && job.raw.soft_skills.length > 0)) && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Compétences</h3>
                <div className="space-y-3">
                  {job.raw?.hard_skills && job.raw.hard_skills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Techniques</p>
                      <div className="flex flex-wrap gap-2">
                        {job.raw.hard_skills.map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.raw?.soft_skills && job.raw.soft_skills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Comportementales</p>
                      <div className="flex flex-wrap gap-2">
                        {job.raw.soft_skills.map((skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-slate-600 border-slate-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {job.raw?.description && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Description brute du poste</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line bg-slate-100/50 p-4 rounded-lg border border-slate-200/50">
                  {job.raw.description}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-lg border-slate-100">
                <CardHeader>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Outils & Actions
                  </h3>
                </CardHeader>
                <CardContent className="space-y-3">
              <PrimaryButton onClick={handleApply}>
                <ExternalLink className="w-5 h-5 mr-2" />
                Voir l'annonce
              </PrimaryButton>

              <Button
                variant="outline"
                onClick={toggleApplicationStatus}
                className={`w-full py-6 text-lg font-semibold rounded-lg shadow-sm ${
                  applicationStatus === 'applied' 
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {applicationStatus === 'applied' ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Postulé
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-5 h-5 mr-2" />
                    Postulé ?
                  </>
                )}
              </Button>

              <PrimaryButton
                onClick={() => navigate(`/offres/${id}/score`)}
                className="bg-secondary hover:bg-secondary/90"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analyse CV (IA)
              </PrimaryButton>
              
              {generatedDocs?.cv ? (
                <PrimaryButton
                  onClick={() => {
                    setInitialTab('cv');
                    setShowDocuments(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Voir mon CV
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  onClick={handleGenerateCV}
                  disabled={generatingCV || generating}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {generatingCV ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  {generatingCV ? "Génération..." : "Générer CV"}
                </PrimaryButton>
              )}

              {generatedDocs?.cl ? (
                <PrimaryButton
                  onClick={() => {
                    setInitialTab('cl');
                    setShowDocuments(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Voir ma Lettre
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  onClick={handleGenerateCoverLetter}
                  disabled={generatingCL || generating}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {generatingCL ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenTool className="w-4 h-4 mr-2" />}
                  {generatingCL ? "Génération..." : "Générer Lettre"}
                </PrimaryButton>
              )}

              <SecondaryButton
                onClick={handleSyncWithExtension}
                className="w-full border-dashed border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
              >
                <Puzzle className="w-5 h-5 mr-2" />
                Envoyer vers l'extension
              </SecondaryButton>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton flottant pour mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-20 flex justify-center">
          <PrimaryButton 
              onClick={() => setIsActionsModalOpen(true)}
              className="w-full max-w-xs shadow-lg"
          >
              <Sparkles className="w-5 h-5 mr-2" />
              Actions & Outils
          </PrimaryButton>
      </div>

      {/* Modal d'actions pour mobile */}
      {isActionsModalOpen && (
          <div 
              className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
              onClick={() => setIsActionsModalOpen(false)}
          >
              <div 
                  className="bg-white rounded-t-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-24 duration-300"
                  onClick={(e) => e.stopPropagation()}
              >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-600" />
                          Outils & Actions
                      </h3>
                      <button onClick={() => setIsActionsModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100">
                          <X className="w-5 h-5 text-slate-500" />
                      </button>
                  </div>
                  
                  <PrimaryButton onClick={handleApply} className="w-full">
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Voir l'annonce
                  </PrimaryButton>

                  <Button
                    variant="outline"
                    onClick={toggleApplicationStatus}
                    className={`w-full py-6 text-lg font-semibold rounded-lg shadow-sm ${
                      applicationStatus === 'applied' 
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {applicationStatus === 'applied' ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Postulé
                      </>
                    ) : (
                      <>
                        <HelpCircle className="w-5 h-5 mr-2" />
                        Postulé ?
                      </>
                    )}
                  </Button>

                  <PrimaryButton
                    onClick={() => navigate(`/offres/${id}/score`)}
                    className="bg-secondary hover:bg-secondary/90 w-full"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analyse du CV (IA)
                  </PrimaryButton>
                  
                  {generatedDocs?.cv ? (
                    <PrimaryButton
                      onClick={() => { setInitialTab('cv'); setShowDocuments(true); }}
                      className="bg-green-600 hover:bg-green-700 w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Voir mon CV
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton onClick={handleGenerateCV} disabled={generatingCV || generating} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full">
                      {generatingCV ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      {generatingCV ? "Génération..." : "Générer CV"}
                    </PrimaryButton>
                  )}

                  {generatedDocs?.cl ? (
                    <PrimaryButton onClick={() => { setInitialTab('cl'); setShowDocuments(true); }} className="bg-green-600 hover:bg-green-700 w-full">
                      <PenTool className="w-4 h-4 mr-2" />
                      Voir ma Lettre
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton onClick={handleGenerateCoverLetter} disabled={generatingCL || generating} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 w-full">
                      {generatingCL ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenTool className="w-4 h-4 mr-2" />}
                      {generatingCL ? "Génération..." : "Générer Lettre"}
                    </PrimaryButton>
                  )}

                  <SecondaryButton onClick={handleSyncWithExtension} className="w-full border-dashed border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300">
                    <Puzzle className="w-5 h-5 mr-2" />
                    Envoyer vers l'extension
                  </SecondaryButton>
              </div>
          </div>
      )}

      {/* Modal de confirmation pour retirer le statut postulé */}
      {showConfirmUnapply && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 p-6 border border-slate-100">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <HelpCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Retirer le statut "Postulé" ?</h3>
              <p className="text-slate-600">
                Voulez-vous vraiment retirer le statut "Postulé" de cette offre ? Elle repassera en statut "Enregistré".
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirmUnapply(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all duration-200"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  updateApplicationStatus('liked');
                  setShowConfirmUnapply(false);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all duration-200"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffreDetail;
