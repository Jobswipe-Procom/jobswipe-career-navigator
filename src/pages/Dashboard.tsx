import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoHeader } from "@/components/LogoHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadFavorites } from "@/lib/storage";
import { ArrowLeft, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { SEOHead } from "@/components/seo";
import { OfferDetailModal } from "@/pages/OfferDetailModal";
import { Job } from "@/types/job";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const navigate = useNavigate();
  const favorites = loadFavorites();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Job | null>(null);

  const kpis = [
    { label: "Importé", value: 120 },
    { label: "Likée", value: 80 },
    { label: "Superliké", value: 30 },
    { label: "Postulé", value: 15 },
  ];

  const statusData = [
    { name: "En cours", value: favorites.length },
    { name: "Prix", value: 2 },
    { name: "Entretien", value: 1 },
    { name: "Réponses", value: 3 },
  ];

  const successData = [
    { name: "Réussite", value: 25 },
    { name: "En attente", value: 75 },
  ];

  const COLORS = [
    "hsl(215, 65%, 25%)",
    "hsl(142, 70%, 50%)",
    "hsl(350, 95%, 65%)",
    "hsl(220, 10%, 45%)",
  ];

  const mockOffer: Job = {
    id: "1",
    title: "Développeur Frontend",
    company: "Tech Solutions",
    location: "Paris, France",
    description: "Lorem ipsum dolor sit amet...",
    redirect_url: "https://example.com",
    salary_min: 50000,
    salary_max: 70000,
    contract_type: "CDI",
    created: "2023-10-27T10:00:00Z",
  };

  const handleKpiClick = () => {
    setSelectedOffer(mockOffer);
    setIsModalOpen(true);
  };

  const formatSalary = (job: Job) => {
    if (job.salary_min && job.salary_max) {
      return `${job.salary_min}€ - ${job.salary_max}€`;
    }
    return null;
  };

  const getJobDescription = (job: Job) => {
    return job.description;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Tableau de bord"
        description="Vue d'ensemble de votre recherche d'emploi"
        noindex={true}
      />
      <LogoHeader />

      <div className="px-6 py-8 max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <h1 className="text-2xl font-bold">Mon tableau de bord</h1>
          </CardHeader>

          <CardContent className="space-y-8">
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="details">Détail des offres</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">
                      Candidatures par statut
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={statusData}>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill="hsl(215, 65%, 25%)"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-4">
                      Taux de réussite
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={successData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {successData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Recommandations suggérées
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-foreground">
                        • Ingénieur Data Science - Paris
                      </p>
                      <p className="text-sm text-foreground">
                        • Développeur Full Stack - Lyon
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-4 gap-3">
                  {kpis.map((kpi, idx) => (
                    <div
                      key={idx}
                      className="text-center cursor-pointer"
                      onClick={handleKpiClick}
                    >
                      <div className="bg-primary/10 rounded-lg p-3 mb-2">
                        <p className="text-2xl font-bold text-primary">
                          {kpi.value}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <h3 className="font-semibold text-foreground mb-4">Liste des offres</h3>
                  <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                    <p>La liste des offres apparaîtra ici.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-3 pt-4">
              <PrimaryButton
                onClick={() => navigate("/calendrier")}
                className="bg-secondary hover:bg-secondary/90"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Calendrier intelligent
              </PrimaryButton>

              <PrimaryButton onClick={() => navigate("/")}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour
              </PrimaryButton>
            </div>
          </CardContent>
        </Card>
      </div>
      <OfferDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        offer={selectedOffer}
        formatSalary={formatSalary}
        getJobDescription={getJobDescription}
      />
    </div>
  );
};

export default Dashboard;
