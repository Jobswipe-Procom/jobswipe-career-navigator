import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SEOHead } from '@/components/seo';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, Bell, Home, User, Briefcase, Loader2, ChevronDown, ChevronUp, BrainCircuit, CalendarClock, Lightbulb, CheckCircle2, AlertCircle, MessageSquare, FileText, XCircle, RefreshCw, Clock, Calendar as CalendarIcon, ArrowRight, Mail, Trash2, Phone, Video, MapPin, Heart, Search, Copy, X, LayoutDashboard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/lib/supabaseClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

type ApplicationStatus = "imported" | "liked" | "superliked" | "applied" | "interview" | "job_offer" | "accepted" | "rejected";

interface Application {
  id: string;
  company: string;
  title: string;
  status: ApplicationStatus;
  isSuperlike: boolean;
  interviewDate?: Date;
  interviewType?: string;
  rejectionReason?: string;
  rejectionStage?: 'before_interview' | 'after_interview';
  offerDeadline?: Date;
  dates: {
    imported?: Date;
    liked: Date;
    superliked?: Date;
    applied?: Date;
    response_received?: Date;
    interview?: Date;
    job_offer?: Date;
    accepted?: Date;
    rejected?: Date;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const initialApplications: Application[] = [];

const statusLabels: Record<ApplicationStatus, string> = {
  imported: "Importée",
  liked: "Likée",
  superliked: "Superlikée",
  applied: "Postulée",
  interview: "Entretien",
  job_offer: "Proposition reçue",
  accepted: "Acceptée",
  rejected: "Refusée",
};

const KpiCard = ({ title, value, rate, onClick, isSelected }: { title: string, value: string | number, rate?: string, onClick?: () => void, isSelected?: boolean }) => (
    <Card className={`p-3 transition-all ${onClick ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:shadow-md'}` } onClick={onClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1 h-9">
            <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="text-xl font-bold">{value}</div>
            {rate && <p className="text-xs text-muted-foreground">{rate}</p>}
        </CardContent>
    </Card>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background/90 backdrop-blur-sm p-2 shadow-sm animate-in fade-in-0 zoom-in-95">
          <p className="text-sm font-bold text-foreground mb-1">{label}</p>
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex items-center justify-between">
              <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: p.color }}/>
                  <p className="text-xs text-muted-foreground">{p.name}</p>
              </div>
              <p className="text-xs font-semibold text-foreground ml-4">{p.value}</p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

const EvolutionChart = ({ data, lines }: { data: any[], lines: { key: string, color: string, name: string }[] }) => (
    <Card>
      <CardHeader>
        <CardTitle>Évolution temporelle</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {lines.map(line => (
                <linearGradient key={line.key} id={`color-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={line.color} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={line.color} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted) / 0.5)" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              width={20}
            />
            <RechartsTooltip 
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
              content={<CustomTooltip />} 
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            {lines.map((line) => (
              <Area 
                  key={line.key} 
                  type="monotone" 
                  dataKey={line.key} 
                  stroke={line.color} 
                  fillOpacity={1}
                  fill={`url(#color-${line.key})`}
                  name={line.name} 
                  strokeWidth={2} 
                  activeDot={{ r: 6 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

const MarkdownText = ({ text, className }: { text: string, className?: string }) => {
  if (!text) return null;
  // Divise le texte pour trouver les parties en gras (**texte**)
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

const ApplicationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [activeTab, setActiveTab] = useState<"overview" | "offers" | "applications" | "analyst" | "contacts">("overview");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [pendingResponseApp, setPendingResponseApp] = useState<Application | null>(null);
  const [pendingRejectionApp, setPendingRejectionApp] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{id: string, status: ApplicationStatus} | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [selectedInterviewCategory, setSelectedInterviewCategory] = useState("RH");
  const [selectedInterviewMedium, setSelectedInterviewMedium] = useState("Visio");
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<any | null>(null);
  const [timingAnalysis, setTimingAnalysis] = useState<any | null>(null);
  const [isTimingLoading, setIsTimingLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedbackApp, setSelectedFeedbackApp] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [contactSearchJobId, setContactSearchJobId] = useState<string>("");
  const [contactSearchResults, setContactSearchResults] = useState<Array<{ nom: string, poste: string, email: string, is_rh: boolean, detail_bio: string, custom_mail_body: string }> | null>(null);
  const [selectedContact, setSelectedContact] = useState<{ nom: string, poste: string, email: string, is_rh: boolean, detail_bio: string, custom_mail_body: string } | null>(null);
  const [isContactSearching, setIsContactSearching] = useState(false);
  const [contactSearchError, setContactSearchError] = useState<string | null>(null);
  const [showNavPopup, setShowNavPopup] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [modalListData, setModalListData] = useState<{title: string, statuses: ApplicationStatus[] | null}>({ title: '', statuses: null });


  const tabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'offers', label: "Détails des offres", icon: FileText },
    { id: 'applications', label: "Suivi candidatures", icon: Briefcase },
    { id: 'analyst', label: "IA Analyste", icon: BrainCircuit },
    { id: 'contacts', label: "Contacts", icon: User },
  ];
  const activeTabInfo = tabs.find(t => t.id === activeTab);

  useEffect(() => {
    if (location.state?.initialView) {
      const { initialView } = location.state;
      const status = initialView as ApplicationStatus;
      if (Object.keys(statusLabels).includes(status)){
        const tab = ['imported', 'liked', 'superliked'].includes(status) ? 'offers' : 'applications';
        setActiveTab(tab);
        handleKpiClick(statusLabels[status], [status]);
      }
    }
  }, [location.state, applications]);

  // Charger les contacts sauvegardés quand l'offre sélectionnée change
  useEffect(() => {
    if (contactSearchJobId) {
      const saved = localStorage.getItem(`JOBSWIPE_CONTACTS_${contactSearchJobId}`);
      if (saved) {
        try {
          setContactSearchResults(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing saved contacts", e);
          setContactSearchResults(null);
        }
      } else {
        setContactSearchResults(null);
      }
    } else {
      setContactSearchResults(null);
    }
  }, [contactSearchJobId]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Récupérer les offres importées localement
        const localJobs: any[] = JSON.parse(localStorage.getItem("JOBSWIPE_LOCAL_IMPORTED_JOBS") || "[]");
        const importedApps: Application[] = localJobs.map(job => ({
            id: job.id,
            company: job.company || "Entreprise inconnue",
            title: job.title || "Poste inconnu",
            status: 'imported',
            isSuperlike: false,
            dates: {
                imported: new Date(job.created_at),
                liked: new Date(job.created_at) // Fallback
            }
        }));

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setApplications(importedApps);
            return;
        }

        // Récupérer les swipes (likes et superlikes) avec les détails du job
        const { data, error } = await supabase
          .from('swipes')
          .select(`
            *,
            job:jobs (
              id,
              title,
              company
            )
          `)
          .eq('user_id', user.id)
          .eq('direction', 'like'); // On récupère tous les likes (incluant superlikes)

        if (error) throw error;

        if (data) {
          const mappedApps: Application[] = data.map((item: any) => ({
            id: item.job.id,
            company: item.job.company || "Entreprise inconnue",
            title: item.job.title || "Poste inconnu",
            // Si le statut est 'liked' ou null, on vérifie si c'est un superlike pour le mettre dans la bonne colonne
            status: (item.status && item.status !== 'liked') 
              ? item.status 
              : (item.is_superlike ? 'superliked' : 'liked'),
            isSuperlike: item.is_superlike,
            interviewDate: item.interview_date ? new Date(item.interview_date) : undefined,
            interviewType: item.interview_type,
            rejectionReason: item.rejection_reason,
            rejectionStage: item.rejection_stage,
            offerDeadline: item.offer_deadline ? new Date(item.offer_deadline) : undefined,
            dates: {
              liked: new Date(item.created_at),
              // Si on a une date de mise à jour pour le statut, on pourrait l'utiliser ici
              [item.status || (item.is_superlike ? 'superliked' : 'liked')]: new Date(item.updated_at || item.created_at)
            }
          }));
          setApplications([...importedApps, ...mappedApps]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des candidatures:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleStatusChangeClick = (applicationId: string, newStatus: ApplicationStatus | 'delete' | 'new_interview' | 'response_received') => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    const willOpenModal = ['delete', 'new_interview', 'response_received', 'interview', 'job_offer'].includes(newStatus) || (newStatus === 'rejected' && (app.status === 'interview' || app.status === 'job_offer'));

    if (willOpenModal) {
      setIsListModalOpen(false);
    }

    if (newStatus === 'delete') {
        setItemToDelete(applicationId);
        setShowDeleteModal(true);
        return;
    }

    if (newStatus === 'response_received') {
      setPendingResponseApp(app);
      setShowResponseModal(true);
      return;
    }

    if (newStatus === 'interview' || newStatus === 'job_offer') {
      setPendingStatus({ id: applicationId, status: newStatus as ApplicationStatus });
      setShowDatePicker(true);
      setSelectedDate(new Date());
      setSelectedTime("10:00");
      setSelectedInterviewCategory("RH");
      setSelectedInterviewMedium("Visio");
    } else if (newStatus === 'new_interview') {
      setPendingStatus({ id: applicationId, status: 'interview' });
      setShowDatePicker(true);
      setSelectedDate(new Date());
      setSelectedTime("10:00");
      setSelectedInterviewCategory("RH");
      setSelectedInterviewMedium("Visio");
    } else if (newStatus === 'rejected' && (app.status === 'interview' || app.status === 'job_offer')) {
      // Refus après entretien
      setPendingRejectionApp(app);
      setRejectionReason("");
      setShowRejectionModal(true);
    } else {
      // Transitions simples (ex: retour à postulée, retour à like)
      executeStatusChange(applicationId, newStatus as ApplicationStatus);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    // Vérifier d'abord si c'est une offre locale
    const localJobs: any[] = JSON.parse(localStorage.getItem("JOBSWIPE_LOCAL_IMPORTED_JOBS") || "[]");
    const localIndex = localJobs.findIndex(j => j.id === itemToDelete);
    
    if (localIndex !== -1) {
        localJobs.splice(localIndex, 1);
        localStorage.setItem("JOBSWIPE_LOCAL_IMPORTED_JOBS", JSON.stringify(localJobs));
        setApplications(prev => prev.filter(a => a.id !== itemToDelete));
        toast.success("Candidature importée supprimée.");
        setShowDeleteModal(false);
        setItemToDelete(null);
        return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous n'êtes pas connecté.");
        return;
      }

      const { error } = await supabase.from('swipes').delete().eq('user_id', user.id).eq('job_id', itemToDelete);

      if (error) {
        throw error;
      }

      setApplications(prev => prev.filter(a => a.id !== itemToDelete));
      toast.success("Candidature supprimée avec succès.");

    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la candidature.");
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const confirmStatusChange = () => {
    if (!pendingStatus || !selectedDate) return;
    
    const finalDate = new Date(selectedDate);
    if (pendingStatus.status === 'interview') {
       const [hours, minutes] = selectedTime.split(':').map(Number);
       finalDate.setHours(hours, minutes);
    } else {
       // Pour une deadline, on peut mettre fin de journée ou garder l'heure par défaut
       finalDate.setHours(23, 59, 0, 0);
    }
    
    const interviewType = pendingStatus.status === 'interview' 
        ? `${selectedInterviewCategory} - ${selectedInterviewMedium}`
        : undefined;

    executeStatusChange(pendingStatus.id, pendingStatus.status, finalDate, interviewType);
    setShowDatePicker(false);
    setPendingStatus(null);
  };

  const executeStatusChange = async (applicationId: string, newStatus: ApplicationStatus, dateValue?: Date, extraData?: string) => {
    // Mise à jour optimiste de l'UI
    setApplications(prev => prev.map(app => 
      app.id === applicationId ? { 
        ...app, 
        status: newStatus, 
        dates: { ...app.dates, [newStatus]: new Date() },
        interviewDate: newStatus === 'interview' ? dateValue : app.interviewDate,
        offerDeadline: newStatus === 'job_offer' ? dateValue : app.offerDeadline,
        interviewType: newStatus === 'interview' && extraData ? extraData : app.interviewType,
        rejectionReason: newStatus === 'rejected' && extraData ? extraData : app.rejectionReason,
        rejectionStage: newStatus === 'rejected' ? (['interview', 'job_offer'].includes(app.status) ? 'after_interview' : 'before_interview') : app.rejectionStage
      } : app
    ));

    // Mise à jour en base de données (si la colonne status existe dans swipes)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Si on revient aux likes (superliked ou liked), on enregistre 'liked' en base
    // car la distinction se fait via la colonne is_superlike qui ne change pas.
    const dbStatus = newStatus === 'superliked' ? 'liked' : newStatus;

    const updates: any = { 
        status: dbStatus,
        updated_at: new Date().toISOString()
    };

    if (dateValue) {
        if (newStatus === 'interview') {
            updates.interview_date = dateValue.toISOString();
            if (extraData) updates.interview_type = extraData;
        }
        if (newStatus === 'job_offer') updates.offer_deadline = dateValue.toISOString();
    } else if (newStatus === 'rejected') {
        updates.rejection_stage = ['interview', 'job_offer'].includes(applications.find(a => a.id === applicationId)?.status || '') ? 'after_interview' : 'before_interview';
        if (extraData) updates.rejection_reason = extraData;
    }

    await supabase
      .from('swipes')
      .update(updates)
      .eq('user_id', user.id)
      .eq('job_id', applicationId);
  };

  const isFollowUpSuggested = (appliedDate: Date | undefined) => {
    if (!appliedDate) return false;
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - appliedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  };

  const handleAnalyzeFeedback = async (app: Application) => {
    setAnalyzingId(app.id);
    setFeedbackAnalysis(null);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: app.title,
          company: app.company
        })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'analyse du feedback");
      }

      const data = await response.json();
      setFeedbackAnalysis(data);

    } catch (error) {
      console.error("Erreur feedback:", error);
      toast.error("Impossible d'analyser le feedback pour le moment.");
    } finally {
        setAnalyzingId(null);
    }
  };

  const handleTimingAnalysis = async () => {
    setIsTimingLoading(true);
    
    // Récupération du profil pour le contexte (simulation de l'envoi au backend)
    const { data: { user } } = await supabase.auth.getUser();
    let userRole = "Candidat";
    if (user) {
        const { data } = await supabase.from('profiles').select('target_role').eq('id', user.id).single();
        if (data?.target_role) userRole = data.target_role;
    }

    // Collecte des données pour l'analyse (Détails des offres & Suivi candidatures)
    const offerDetailsStats = {
        liked: applications.filter(a => a.status === 'liked').length,
        superliked: applications.filter(a => a.status === 'superliked').length,
        total_potential: applications.filter(a => ['liked', 'superliked'].includes(a.status)).length
    };

    const trackingStats = {
        applied: applications.filter(a => a.status === 'applied').length,
        interviews: applications.filter(a => a.status === 'interview').length,
        responses: applications.filter(a => ['response_received', 'interview', 'job_offer', 'accepted', 'rejected'].includes(a.status)).length,
        active_processes: applications.filter(a => ['applied', 'response_received', 'interview', 'job_offer'].includes(a.status)).length
    };

    try {
        const response = await fetch(`${API_BASE_URL}/timing-strategy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stats: { ...offerDetailsStats, ...trackingStats },
            user_role: userRole
          })
        });

        if (!response.ok) throw new Error("Erreur serveur timing");
        
        const data = await response.json();

        setTimingAnalysis(data);
        
        if (data.best_days?.length > 0) {
             const today = new Date();
             for(let i=1; i<=7; i++) {
                 const d = new Date(today);
                 d.setDate(today.getDate() + i);
                 if (data.best_days.includes(d.getDay())) {
                     setDate(d);
                     break;
                 }
             }
        }
    } catch (error) {
        console.error("Erreur Gemini:", error);
        toast.error("Erreur lors de la génération de la stratégie.");
    } finally {
        setIsTimingLoading(false);
    }
  };

  const handleContactSearch = async () => {
    if (!contactSearchJobId) return;
    
    const app = applications.find(a => a.id === contactSearchJobId);
    if (!app) return;

    // Capture existing names for exclusion BEFORE clearing state
    const existingNames = contactSearchResults?.map(c => c.nom) || [];

    setIsContactSearching(true);
    setContactSearchError(null);
    setContactSearchResults(null);

    try {
      const response = await fetch(`${API_BASE_URL}/search-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: app.company,
          job_title: app.title,
          excluded_names: existingNames
        })
      });

      if (!response.ok) throw new Error("Erreur lors de la recherche");
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setContactSearchResults(data);
        localStorage.setItem(`JOBSWIPE_CONTACTS_${contactSearchJobId}`, JSON.stringify(data));
      } else {
        throw new Error("Format de réponse invalide");
      }

    } catch (err: any) {
      console.error("Erreur recherche contacts:", err);
      setContactSearchError(err.message || "Une erreur est survenue lors de la recherche.");
    } finally {
      setIsContactSearching(false);
    }
  };

  const kpis = {
      imported: applications.filter(a => a.status === 'imported').length,
      liked: applications.filter(a => a.status === 'liked').length,
      superliked: applications.filter(a => a.status === 'superliked').length,
      applied: applications.filter(a => ['applied', 'interview', 'job_offer', 'accepted', 'rejected'].includes(a.status)).length,
      applied_only: applications.filter(a => a.status === 'applied').length,
      responses: applications.filter(a => ['interview', 'job_offer', 'accepted', 'rejected'].includes(a.status)).length,
      interviews: applications.filter(a => ['interview', 'job_offer', 'accepted'].includes(a.status)).length,
      interviews_only: applications.filter(a => a.status === 'interview').length,
      offers: applications.filter(a => ['job_offer', 'accepted'].includes(a.status)).length,
      offers_only: applications.filter(a => a.status === 'job_offer').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const responseRate = kpis.applied > 0 ? ((kpis.responses / kpis.applied) * 100).toFixed(0) + '%' : 'N/A';
  const interviewRate = kpis.responses > 0 ? ((kpis.interviews / kpis.responses) * 100).toFixed(0) + '%' : 'N/A';
  const offerRate = kpis.interviews > 0 ? ((kpis.offers / kpis.interviews) * 100).toFixed(0) + '%' : 'N/A';
  const acceptanceRate = kpis.offers > 0 ? ((kpis.accepted / kpis.offers) * 100).toFixed(0) + '%' : 'N/A';

  const modalList = isListModalOpen ? applications.filter(app => modalListData.statuses?.includes(app.status)) : [];

  const handleKpiClick = (title: string, statuses: ApplicationStatus[]) => {
    setModalListData({ title, statuses });
    setIsListModalOpen(true);
  };

  // Préparation des données pour le graphique
  const getChartData = () => {
    const data: Record<string, { 
      date: string; 
      timestamp: number; 
      imported: number;
      liked: number; 
      superliked: number;
            applied: number; 
            interview: number;
            job_offer: number;
            accepted: number;
            rejected: number;
          }> = {};
          
          applications.forEach(app => {
            const processDate = (dateObj: Date | undefined, type: string) => {
              if (!dateObj) return;
              const dateStr = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
              
              if (!data[dateStr]) {
                data[dateStr] = { 
                  date: dateStr, 
                  timestamp: dateObj.setHours(0,0,0,0),
                  imported: 0,
                  liked: 0, 
                  superliked: 0,
                  applied: 0, 
                  interview: 0,
                  job_offer: 0,
                  accepted: 0,
                  rejected: 0
                };
              }
              // @ts-ignore
              data[dateStr][type]++;
            };
      
            processDate(app.dates.imported, 'imported');
            processDate(app.dates.liked, 'liked');
            if (app.isSuperlike) processDate(app.dates.liked, 'superliked'); // On utilise la date de like pour le superlike
            processDate(app.dates.applied, 'applied');
            processDate(app.dates.interview, 'interview');
            processDate(app.dates.job_offer, 'job_offer');
            processDate(app.dates.accepted, 'accepted');
            processDate(app.dates.rejected, 'rejected');
          });
      
          return Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        };
  const getAvailableTransitions = (app: Application): { status: ApplicationStatus | 'delete' | 'new_interview' | 'response_received', label: string, icon?: any }[] => {
    const transitions: { status: ApplicationStatus | 'delete' | 'new_interview' | 'response_received', label: string, icon?: any }[] = [];

    switch (app.status) {
      case 'imported':
        transitions.push({ status: 'applied', label: 'Postuler', icon: Briefcase });
        break;
      case 'liked':
      case 'superliked':
        transitions.push({ status: 'applied', label: 'Postuler', icon: Briefcase });
        break;
      case 'applied':
        transitions.push({ status: 'response_received', label: 'Réponse reçue', icon: MessageSquare });
        break;
      case 'interview':
        transitions.push(
          { status: 'job_offer', label: 'Proposition reçue', icon: CheckCircle2 },
          { status: 'rejected', label: 'Pas retenu', icon: XCircle },
          { status: 'new_interview', label: 'Nouvel entretien', icon: RefreshCw },
          { status: 'applied', label: 'Retour à Postulée', icon: ArrowRight }
        );
        break;
      case 'job_offer':
        transitions.push(
          { status: 'accepted', label: 'Accepter l\'offre', icon: CheckCircle2 },
          { status: 'rejected', label: 'Refuser l\'offre', icon: XCircle },
          { status: 'interview', label: 'Retour à Entretien', icon: ArrowRight }
        );
        break;
      case 'accepted':
        transitions.push({ status: 'job_offer', label: 'Retour à Proposition', icon: ArrowRight });
        break;
      case 'rejected':
        transitions.push({ status: 'applied', label: 'Repasser en Postulée', icon: RefreshCw });
        break;
    }

    if (app.status !== 'liked' && app.status !== 'superliked' && app.status !== 'imported') {
        transitions.push({ 
            status: app.isSuperlike ? 'superliked' : 'liked', 
            label: 'Retour aux likes', 
            icon: Heart 
        });
    }

    transitions.push({ status: 'delete', label: 'Supprimer', icon: Trash2 });

    return transitions;
  };

  return (
    <TooltipProvider>
      <SEOHead
        title="Suivi des candidatures"
        description="Suivez vos candidatures en temps réel"
        noindex={true}
      />
      <div className="h-screen overflow-hidden p-4 lg:p-8 pb-48">
        <div className="fixed top-4 right-4 z-50 flex gap-3">
          <button
            onClick={() => navigate("/jobswipe/offres")}
            className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-lg border border-white/50 shadow-lg hidden sm:flex items-center justify-center transition-all duration-200 ease-out hover:bg-white/95 hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
            title="Offres"
          >
            <Briefcase className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate("/profil")}
            className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-lg border border-white/50 shadow-lg hidden sm:flex items-center justify-center transition-all duration-200 ease-out hover:bg-white/95 hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
            title="Profil"
          >
            <User className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-lg border border-white/50 shadow-lg flex items-center justify-center transition-all duration-200 ease-out hover:bg-white/95 hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
            title="Accueil"
          >
            <Home className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Suivi des candidatures</h1>
          <p className="text-slate-500">Gérez vos candidatures en un seul endroit.</p>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                <KpiCard title="Offres likées" value={kpis.liked} onClick={() => handleKpiClick("Offres likées", ['liked'])} />
                <KpiCard title="Offres superlikées" value={kpis.superliked} onClick={() => handleKpiClick("Offres superlikées", ['superliked'])} />
                <KpiCard title="Candidatures envoyées" value={kpis.applied} onClick={() => handleKpiClick("Candidatures envoyées", ['applied', 'interview', 'job_offer', 'accepted', 'rejected'])} />
                <KpiCard title="Réponses reçues" value={kpis.responses} rate={`${responseRate} de réponses`} onClick={() => handleKpiClick("Réponses reçues", ['interview', 'job_offer', 'accepted', 'rejected'])} />
                <KpiCard title="Entretiens obtenus" value={kpis.interviews} rate={`${interviewRate} d'entretiens`} onClick={() => handleKpiClick("Entretiens obtenus", ['interview', 'job_offer', 'accepted'])} />
                <KpiCard title="Propositions reçues" value={kpis.offers} rate={`${offerRate} de conversion`} onClick={() => handleKpiClick("Propositions reçues", ['job_offer', 'accepted'])} />
            </div>

            <EvolutionChart 
              data={getChartData()} 
              lines={[
                { key: "liked", color: "#8884d8", name: "Likées" },
                { key: "applied", color: "#82ca9d", name: "Postulées" },
                { key: "interview", color: "#ffc658", name: "Entretiens" }
              ]}
            />
          </div>
        )}

        {activeTab === "offers" && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard 
                    title="Offres Importées" 
                    value={kpis.imported}
                    onClick={() => handleKpiClick("Offres importées", ['imported'])} />
                <KpiCard 
                    title="Offres Likées" 
                    value={kpis.liked} 
                    onClick={() => handleKpiClick("Offres likées", ['liked'])} />
                <KpiCard 
                    title="Offres Superlikées" 
                    value={kpis.superliked}
                    onClick={() => handleKpiClick("Offres superlikées", ['superliked'])} />
                <KpiCard 
                    title="Offres Postulées" 
                    value={kpis.applied_only}
                    onClick={() => handleKpiClick("Offres postulées", ['applied'])} />
            </div>

            <EvolutionChart 
              data={getChartData()} 
              lines={[
                { key: "imported", color: "#10b981", name: "Importée" },
                { key: "liked", color: "#94a3b8", name: "Likée" },
                { key: "superliked", color: "#fbbf24", name: "Superlikée" },
                { key: "applied", color: "#3b82f6", name: "Postulée" },
              ]}
            />
          </div>
        )}

        {activeTab === "applications" && (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <KpiCard title="Postulées" value={kpis.applied_only} onClick={() => handleKpiClick("Candidatures postulées", ['applied'])} />
                <KpiCard title="Entretiens" value={kpis.interviews_only} onClick={() => handleKpiClick("Entretiens", ['interview'])} />
                <KpiCard title="Propositions" value={kpis.offers_only} onClick={() => handleKpiClick("Propositions reçues", ['job_offer'])} />
                <KpiCard title="Acceptées" value={kpis.accepted} onClick={() => handleKpiClick("Candidatures acceptées", ['accepted'])} />
                <KpiCard title="Refusées" value={kpis.rejected} onClick={() => handleKpiClick("Candidatures refusées", ['rejected'])} />
            </div>

          <EvolutionChart 
            data={getChartData()} 
            lines={[
              { key: "applied", color: "#3b82f6", name: "Postulée" },
              { key: "interview", color: "#a855f7", name: "Entretien" },
              { key: "job_offer", color: "#14b8a6", name: "Proposition" },
              { key: "accepted", color: "#22c55e", name: "Acceptée" },
              { key: "rejected", color: "#ef4444", name: "Refusée" },
            ]}
          />
        </div>
        )}

        {activeTab === "analyst" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Tabs defaultValue="analyse" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="analyse">Analyse & Feedback</TabsTrigger>
                <TabsTrigger value="timing">Assistant Timing</TabsTrigger>
              </TabsList>
              <TabsContent value="analyse">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BrainCircuit className="w-6 h-6 text-indigo-600" />
                            Analyse & Feedback IA
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <h4 className="font-semibold text-indigo-900 flex items-center gap-2 mb-2">
                                <Lightbulb className="w-4 h-4" />
                                Conseil Général
                            </h4>
                            <p className="text-sm text-indigo-800">
                                Vos candidatures ont un meilleur taux de réponse lorsque vous postulez le mardi matin. Pensez à préparer vos brouillons le week-end !
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-700">Analyses spécifiques</h3>
                            {applications.filter(app => app.status === 'rejected').length === 0 ? (
                                <p className="text-slate-500 text-sm italic">Aucune candidature refusée à analyser pour le moment.</p>
                            ) : (
                                applications
                                    .filter(app => app.status === 'rejected')
                                    .map(app => (
                                        <div key={app.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-medium text-slate-900">{app.company}</h4>
                                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                                                    Refusé
                                                </span>
                                            </div>
                                            
                                            {feedbackAnalysis && !analyzingId && selectedFeedbackApp === app.id ? (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700">
                                                        <p className="font-medium mb-1 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-indigo-500"/> Analyse IA</p>
                                                        <MarkdownText text={feedbackAnalysis.analysis} />
                                                    </div>
                                                    
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Hypothèses de refus</p>
                                                        <ul className="text-sm space-y-1">
                                                            {feedbackAnalysis.potential_reasons.map((reason: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-2 text-slate-600">
                                                                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                                                    {reason}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Conseils d'amélioration</p>
                                                        <ul className="text-sm space-y-1">
                                                            {feedbackAnalysis.improvement_tips.map((tip: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-2 text-slate-600">
                                                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                                    {tip}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="pt-2">
                                                        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigator.clipboard.writeText(feedbackAnalysis.email_template)}>
                                                            <MessageSquare className="w-4 h-4" />
                                                            Copier l'email de demande de feedback
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button 
                                                    onClick={() => {
                                                        setSelectedFeedbackApp(app.id); 
                                                        handleAnalyzeFeedback(app);
                                                    }} 
                                                    disabled={analyzingId === app.id}
                                                    className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                                                >
                                                    {analyzingId === app.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                                                    {analyzingId === app.id ? "Analyse en cours..." : "Demander une analyse détaillée"}
                                                </Button>
                                            )}
                                        </div>
                                    ))
                            )}
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="timing">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarClock className="w-6 h-6 text-indigo-600" />
                            Assistant de Timing
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!timingAnalysis ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-6 p-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
                                    <div className="bg-indigo-50 p-6 rounded-full relative">
                                        <CalendarClock className="w-10 h-10 text-indigo-600" />
                                    </div>
                                </div>
                                <div className="space-y-2 max-w-xs">
                                    <h3 className="text-lg font-semibold text-slate-900">Stratégie de Timing IA</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Laissez l'IA analyser vos données pour déterminer le moment idéal pour postuler et maximiser vos chances.
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleTimingAnalysis} 
                                    disabled={isTimingLoading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200 w-full max-w-xs"
                                >
                                    {isTimingLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                                    {isTimingLoading ? "Analyse du marché en cours..." : "Générer ma stratégie"}
                                </Button>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                {/* Calendrier et Meilleur Créneau */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
                                                <Clock className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-indigo-900 text-xs uppercase tracking-wide mb-1">Meilleur Créneau</h4>
                                                <p className="text-lg font-bold text-slate-800">{timingAnalysis.best_time_range}</p>
                                                <MarkdownText text={timingAnalysis.reasoning} className="text-sm text-slate-600 mt-2 leading-relaxed" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            className="rounded-md"
                                            modifiers={{
                                                actionDay: (date) => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    return timingAnalysis.action_plan.some((item: any) => {
                                                        const planDate = new Date(today);
                                                        planDate.setDate(today.getDate() + item.day_offset);
                                                        return planDate.toDateString() === date.toDateString();
                                                    });
                                                }
                                            }}
                                            modifiersClassNames={{
                                                actionDay: "bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-md"
                                            }}
                                        />
                                    </div>
                                </div>
                                
                                {/* Plan d'action Timeline */}
                                <div>
                                    <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                                        <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                                        Plan d'action suggéré
                                    </h4>
                                    <div className="relative pl-4 border-l-2 border-slate-100 space-y-4 ml-2">
                                        {timingAnalysis.action_plan.map((item: any, idx: number) => (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-[21px] top-3 w-3 h-3 rounded-full border-2 border-white shadow-sm ${idx === 0 ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-slate-300'}`} />
                                                <div className={`p-3 rounded-lg border ${idx === 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100'} shadow-sm transition-all hover:shadow-md`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${idx === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {item.day_offset === 0 ? "Aujourd'hui" : `J+${item.day_offset}`}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 font-medium">{item.action}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Conseil Pro */}
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start shadow-sm">
                                    <div className="bg-white p-1.5 rounded-full shadow-sm shrink-0">
                                        <Lightbulb className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Conseil Pro</p>
                                        <MarkdownText text={`"${timingAnalysis.general_tip}"`} className="text-sm text-amber-900/80 italic leading-relaxed" />
                                    </div>
                                </div>
                        </div>
                        )}
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-6 h-6 text-indigo-600" />
                  Recherche de Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                   <Label>Sélectionner une offre (Likée ou Superlikée)</Label>
                   <div className="flex flex-col sm:flex-row gap-4">
                     <select 
                       className="flex-1 p-3 text-base sm:p-2 sm:text-sm border rounded-md bg-white"
                       value={contactSearchJobId || ""}
                       onChange={(e) => setContactSearchJobId(e.target.value)}
                     >
                       <option value="">Choisir une entreprise...</option>
                       {applications
                         .filter(a => ['imported', 'liked', 'superliked'].includes(a.status))
                         .map(app => (
                           <option key={app.id} value={app.id}>
                             {app.company} - {app.title}
                           </option>
                         ))
                       }
                     </select>
                     <Button 
                       onClick={handleContactSearch}
                       disabled={!contactSearchJobId || isContactSearching}
                       className="bg-indigo-600 hover:bg-indigo-700 text-white text-base sm:text-sm py-3 px-4 sm:py-2"
                     >
                       {isContactSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                       <span className="ml-2">Rechercher</span>
                     </Button>
                   </div>
                </div>

                {contactSearchError && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {contactSearchError}
                  </div>
                )}

                {contactSearchResults && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contactSearchResults.map((contact, idx) => (
                      <Card 
                        key={idx} 
                        className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                        onClick={() => setSelectedContact(contact)}
                      >
                        {contact.is_rh && (
                          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">
                            RH
                          </div>
                        )}
                        <CardContent className="p-4 flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${contact.is_rh ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                              {contact.nom.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{contact.nom}</p>
                              <p className="text-xs text-slate-500 truncate">{contact.poste}</p>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-400 line-clamp-2">{contact.detail_bio}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
          </>
        )}

        {/* Barre d'onglets en bas - Desktop */}
        <div className="fixed bottom-4 left-0 right-0 z-40 px-3 sm:bottom-8 hidden sm:flex justify-center">
            <div className="mx-auto flex gap-1 p-1.5 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-full overflow-x-auto">
                {tabs.map(tab => (
                    <Button 
                        key={tab.id}
                        variant={activeTab === tab.id ? "default" : "ghost"}
                        onClick={() => setActiveTab(tab.id as any)}
                        className="rounded-full px-6 text-sm whitespace-nowrap transition-all duration-300"
                    >
                        {tab.label}
                    </Button>
                ))}
            </div>
        </div>

        {/* Mobile - Barre de navigation qui ouvre le popup */}
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:hidden" onClick={() => setShowNavPopup(true)}>
            <div className="flex items-center justify-between p-2 h-14 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl cursor-pointer">
                <div className="flex items-center">
                    {activeTabInfo && <activeTabInfo.icon className="w-5 h-5 text-indigo-600 ml-2" />}
                    <span className="text-base font-semibold text-slate-800 ml-3">{activeTabInfo?.label}</span>
                </div>
                <ChevronUp className="w-5 h-5 text-slate-500 mr-2" />
            </div>
        </div>

        {/* Mobile - Popup de navigation */}
        {showNavPopup && (
        <div 
          className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm animate-in fade-in-50 sm:hidden"
          onClick={() => setShowNavPopup(false)}
        >
          <div 
            className="fixed bottom-0 left-0 right-0 p-3 animate-in slide-in-from-bottom-10"
            onClick={e => e.stopPropagation()}
          >
            <Card className="p-2">
                <div className="flex items-center justify-between p-2 mb-2 cursor-pointer" onClick={() => setShowNavPopup(false)}>
                    <span className="text-base font-semibold text-slate-800 ml-3">Navigation</span>
                    <ChevronDown className="w-5 h-5 text-slate-500 mr-2" />
                </div>
              <div className="grid grid-cols-1 gap-1">
                {tabs.map(tab => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    size="lg"
                    className="w-full justify-start text-base h-14"
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setShowNavPopup(false);
                    }}
                  >
                    <tab.icon className="w-5 h-5 mr-4" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>
        )}

        <div className="h-20 sm:h-0" />
      </div>

      {/* Modal de la liste des offres */}
      {isListModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col">
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <CardTitle>{modalListData.title}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsListModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto p-4">
              {modalList.length > 0 ? (
                modalList.map(app => (
                  <Card key={app.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold">{app.title}</CardTitle>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-[150]">
                            {getAvailableTransitions(app).map((transition) => (
                                <DropdownMenuItem
                                key={transition.status}
                                onClick={() => handleStatusChangeClick(app.id, transition.status)}
                                className="py-2 px-3 text-base"
                                >
                                {transition.icon && <transition.icon className="w-5 h-5 mr-3" />}
                                {transition.label}
                                </DropdownMenuItem>
                            ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-sm text-slate-600">{app.company}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-sm text-slate-500 text-center py-8">
                    Aucune offre dans cette catégorie.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de sélection de date */}
      {showDatePicker && pendingStatus && (
        <div className="fixed inset-0 z-[151] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {pendingStatus.status === 'interview' ? <CalendarClock className="w-5 h-5 text-purple-600"/> : <AlertCircle className="w-5 h-5 text-teal-600"/>}
                {pendingStatus.status === 'interview' ? "Planifier l'entretien" : "Date limite de réponse"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center border rounded-lg p-2 bg-slate-50">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md bg-white"
                />
              </div>
              
              {pendingStatus.status === 'interview' && (
                <div className="flex items-center gap-3 justify-center bg-slate-50 p-3 rounded-lg border">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <label className="text-sm font-medium text-slate-700">Heure :</label>
                  <input 
                    type="time" 
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="border rounded-md p-1 text-sm bg-white"
                  />
                </div>
              )}

              {pendingStatus.status === 'interview' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <select 
                            className="w-full p-2 border rounded-md bg-white text-sm"
                            value={selectedInterviewCategory}
                            onChange={(e) => setSelectedInterviewCategory(e.target.value)}
                        >
                            <option value="RH">RH</option>
                            <option value="Technique">Technique</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Moyen</Label>
                        <select 
                            className="w-full p-2 border rounded-md bg-white text-sm"
                            value={selectedInterviewMedium}
                            onChange={(e) => setSelectedInterviewMedium(e.target.value)}
                        >
                            <option value="Visio">Visio</option>
                            <option value="Présentiel">Présentiel</option>
                        </select>
                    </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowDatePicker(false)}>Annuler</Button>
                <Button onClick={confirmStatusChange} disabled={!selectedDate}>Confirmer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Réponse Reçue */}
      {showResponseModal && pendingResponseApp && (
        <div className="fixed inset-0 z-[151] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600"/>
                Réponse reçue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">Quelle réponse avez-vous reçue pour le poste de <strong>{pendingResponseApp.title}</strong> chez <strong>{pendingResponseApp.company}</strong> ?</p>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                    variant="outline" 
                    className="justify-start border-red-200 hover:bg-red-50 text-red-700"
                    onClick={() => {
                        executeStatusChange(pendingResponseApp.id, 'rejected', undefined, "Pas retenu");
                        setShowResponseModal(false);
                    }}
                >
                    <XCircle className="w-4 h-4 mr-2" />
                    Pas retenu
                </Button>
                <Button 
                    variant="outline" 
                    className="justify-start border-orange-200 hover:bg-orange-50 text-orange-700"
                    onClick={() => {
                        executeStatusChange(pendingResponseApp.id, 'rejected', undefined, "Refusée");
                        setShowResponseModal(false);
                    }}
                >
                    <XCircle className="w-4 h-4 mr-2" />
                    Refusée
                </Button>
                <Button 
                    className="justify-start bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => {
                        setShowResponseModal(false);
                        setPendingStatus({ id: pendingResponseApp.id, status: 'interview' });
                        setShowDatePicker(true);
                        setSelectedDate(new Date());
                        setSelectedTime("10:00");
                        setSelectedInterviewCategory("RH");
                        setSelectedInterviewMedium("Visio");
                    }}
                >
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Entretien
                </Button>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="ghost" onClick={() => setShowResponseModal(false)}>Annuler</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Motif de Refus */}
      {showRejectionModal && pendingRejectionApp && (
        <div className="fixed inset-0 z-[151] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5"/>
                Motif du refus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pourquoi la candidature n'a-t-elle pas abouti ?</Label>
                <Textarea 
                    placeholder="Ex: Salaire trop bas, culture d'entreprise, compétences manquantes..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowRejectionModal(false)}>Annuler</Button>
                <Button variant="destructive" onClick={() => { executeStatusChange(pendingRejectionApp.id, 'rejected', undefined, rejectionReason); setShowRejectionModal(false); }}>Confirmer le refus</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Contact */}
      {selectedContact && (
        <div className="fixed inset-0 z-[151] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setSelectedContact(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
            
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shrink-0 ${selectedContact.is_rh ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                  {selectedContact.nom.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="mt-2 sm:mt-0">
                  <CardTitle className="text-xl flex items-center justify-center sm:justify-start gap-2">
                    {selectedContact.nom}
                    {selectedContact.is_rh && <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">RH</span>}
                  </CardTitle>
                  <p className="text-slate-500 text-sm">{selectedContact.poste}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700">
                <p className="font-medium mb-1">Bio</p>
                {selectedContact.detail_bio}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Email professionnel</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={selectedContact.email} className="bg-white" />
                  <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(selectedContact.email); toast.success("Email copié"); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Message d'approche suggéré</Label>
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 text-sm text-slate-700 italic relative">
                  "{selectedContact.custom_mail_body}"
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedContact(null)}>
                  Fermer
                </Button>
                <Button 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  onClick={() => {
                    const subject = encodeURIComponent(`Prise de contact - ${selectedContact.poste}`);
                    const body = encodeURIComponent(selectedContact.custom_mail_body);
                    window.location.href = `mailto:${selectedContact.email}?subject=${subject}&body=${body}`;
                  }}
                >
                  <Mail className="w-4 h-4" />
                  Envoyer un mail
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Confirmation de Suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[151] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5"/>
                Supprimer la candidature ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Êtes-vous sûr de vouloir supprimer cette candidature ? Cette action est irréversible.
              </p>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
                <Button variant="destructive" onClick={confirmDelete}>Confirmer la suppression</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </TooltipProvider>
  );
};

export default ApplicationDashboard;
