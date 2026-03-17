import { Link, useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Sparkles,
  Target,
  FileText,
  Send,
  Calendar,
  ChevronRight,
  Check,
  MousePointer,
  Layers,
} from "lucide-react";
import { SEOHead } from "@/components/seo";
import { HeroPhoneMockup } from "@/components/landing/HeroPhoneMockup";

const STATS = [
  { value: "+1000", label: "Offres parcourues" },
  { value: "100", label: "Candidatures" },
  { value: "97%", label: "Satisfaction" },
] as const;

const PRICING_FEATURES = [
  "Recherches illimitées",
  "Swipes illimités",
  "CV et lettres IA illimités",
  "Calendrier de suivi intégré",
  "Support prioritaire",
] as const;

const BENEFITS = [
  {
    title: "Gagnez du temps",
    text: "Parcourez bien plus d'offres qu'avec une recherche classique grâce à l'interface swipe, intuitive et rapide.",
    icon: Zap,
  },
  {
    title: "IA personnalisée",
    text: "Des CV et lettres de motivation adaptés à chaque offre sont générés automatiquement à partir de votre profil.",
    icon: Sparkles,
  },
  {
    title: "Offres ciblées",
    text: "Filtrez selon la localisation, le type de contrat, le secteur ou le poste pour ne voir que les offres pertinentes.",
    icon: Target,
  },
  {
    title: "Documents professionnels",
    text: "Les documents générés peuvent être relus, ajustés et téléchargés en PDF pour une candidature soignée.",
    icon: FileText,
  },
  {
    title: "Candidature facilitée",
    text: "Accédez rapidement aux informations utiles pour postuler sans perdre de temps entre les plateformes.",
    icon: Send,
  },
  {
    title: "Suivi centralisé",
    text: "Candidatures, statuts et relances : tout se suit depuis un seul espace pour garder le contrôle.",
    icon: Calendar,
  },
] as const;

const STEPS = [
  {
    step: 1,
    title: "Définis tes critères",
    text: "Indique le poste, la localisation et le type de stage que tu recherches.",
    icon: Target,
  },
  {
    step: 2,
    title: "Swipe les offres",
    text: "Parcours rapidement les opportunités et conserve celles qui t'intéressent vraiment.",
    icon: MousePointer,
  },
  {
    step: 3,
    title: "Postule facilement",
    text: "Accède directement aux liens de candidature et avance plus vite dans ta recherche.",
    icon: Send,
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Comment fonctionne JobSwipe ?",
    a: "JobSwipe s'inspire du fonctionnement de Tinder appliqué à la recherche de stage. Vous définissez vos critères, puis vous parcourez les offres en les faisant glisser : à gauche pour ignorer, à droite pour sauvegarder et en superlike pour postuler directement. L'expérience est intuitive, rapide et pensée pour vous faire gagner du temps.",
  },
  {
    q: "Combien coûte l'abonnement ?",
    a: "L'abonnement JobSwipe coûte 3,99€ par mois. Il donne accès aux recherches illimitées, aux swipes illimités ainsi qu'à la génération de CV et lettres de motivation par IA.",
  },
  {
    q: "Comment sont générés les CV et lettres de motivation ?",
    a: "Notre intelligence artificielle s'appuie sur votre profil et sur les informations de l'offre pour produire des documents personnalisés, cohérents et optimisés. Vous pouvez ensuite les ajuster librement avant de les télécharger au format PDF.",
  },
  {
    q: "D'où proviennent les offres de stage ?",
    a: "Les offres sont agrégées depuis Google Search Jobs ainsi que d'autres plateformes majeures de l'emploi. Elles sont actualisées régulièrement afin de vous proposer des opportunités récentes et pertinentes.",
  },
  {
    q: "Puis-je annuler mon abonnement ?",
    a: "Oui, vous pouvez mettre fin à votre abonnement à tout moment directement depuis votre espace personnel, en toute simplicité.",
  },
] as const;

function scrollToHowItWorks() {
  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
}

function scrollToFaq() {
  document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-sky-50/50 text-slate-900 antialiased">
      <SEOHead
        title="JobSwipe — Le Tinder de la recherche d'emploi"
        description="Swipe pour découvrir des centaines d'offres de stage. CV et lettres de motivation générés par IA. Commencez gratuitement."
        canonical={`${window.location.origin}${window.location.pathname}${window.location.hash}`}
      />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="text-xl">JobSwipe</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={() => navigate("/auth")}
          >
            Connexion
          </Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-white px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
              <div>
                <span className="inline-flex items-center rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-700">
                  Nouvelle façon de chercher un emploi
                </span>
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Le Tinder de la recherche d'emploi
                </h1>
                <p className="mt-6 max-w-xl text-lg text-slate-600">
                  Swipe pour découvrir des centaines d'offres de stage. À gauche pour passer, à droite pour
                  sauvegarder, et superlike pour postuler directement.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md hover:from-blue-600 hover:to-violet-600"
                    onClick={() => navigate("/auth")}
                  >
                    Commencer gratuitement
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-100"
                    onClick={scrollToHowItWorks}
                  >
                    Comment ça marche ?
                  </Button>
                </div>
              </div>
              {/* Mockup mobile type app swipe */}
              <HeroPhoneMockup />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-slate-100/80 bg-white/70 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              JobSwipe en chiffres
            </h2>
            <p className="mt-2 text-center text-slate-600">Rejoignez notre version Bêta</p>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {STATS.map((stat, i) => (
                <Card
                  key={stat.label}
                  className="border-slate-200/80 bg-slate-50/40 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="pt-8 pb-8">
                    <span
                      className={`text-4xl font-bold sm:text-5xl ${
                        i === 0
                          ? "text-blue-600"
                          : i === 1
                            ? "text-violet-600"
                            : "text-slate-700"
                      }`}
                    >
                      {stat.value}
                    </span>
                    <p className="mt-2 text-slate-600">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-slate-100/80 bg-blue-50/40 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Un abonnement simple et transparent
            </h2>
            <p className="mt-2 text-center text-slate-600">
              10 swipes, 10 CV et 10 lettres de motivation gratuits pour commencer
            </p>
            <div className="mx-auto mt-12 max-w-md">
              <Card className="relative overflow-hidden border-slate-200/80 bg-white shadow-lg shadow-slate-200/50">
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    Recommandé
                  </span>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl">Premium</CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">3,99€</span>
                    <span className="text-slate-500">/ mois</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {PRICING_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-slate-700">
                      <Check className="h-5 w-5 shrink-0 text-blue-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="pt-4">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600"
                    size="lg"
                    onClick={() => navigate("/auth")}
                  >
                    S'abonner maintenant
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Pourquoi JobSwipe */}
        <section className="border-t border-slate-100/80 bg-white/60 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Pourquoi choisir JobSwipe ?
            </h2>
            <p className="mt-2 text-center text-slate-600">
              La puissance de l'IA au service de votre recherche d'emploi
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((item) => (
                <Card
                  key={item.title}
                  className="border-slate-200/80 bg-slate-50/30 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100/80 text-blue-600">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{item.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-t border-slate-100/80 bg-sky-50/50 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Comment ça marche ?
            </h2>
            <p className="mt-2 text-center text-slate-600">
              JobSwipe en 3 étapes simples
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((item) => (
                <Card
                  key={item.step}
                  className="border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100/80 text-sm font-bold text-blue-600">
                      {item.step}
                    </div>
                    <div className="flex items-center gap-2">
                      <item.icon className="h-5 w-5 text-slate-400" />
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{item.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-slate-100/80 bg-white/70 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Questions fréquentes
            </h2>
            <p className="mt-2 text-center text-slate-600">
              Tout ce que vous devez savoir sur JobSwipe
            </p>
            <div className="mt-12">
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-slate-200/80 px-0">
                    <AccordionTrigger className="py-5 text-left font-medium text-slate-900 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-blue-50/50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Layers className="h-5 w-5 text-blue-500" />
              JobSwipe
            </div>
            <p className="text-center text-sm text-slate-500 sm:text-left">
              La recherche d'emploi, simplifiée par le swipe et l'IA.
            </p>
            <nav className="flex items-center gap-6 text-sm">
              <Link to="/" className="text-slate-600 hover:text-slate-900">
                Accueil
              </Link>
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="text-slate-600 hover:text-slate-900"
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={scrollToFaq}
                className="text-slate-600 hover:text-slate-900"
              >
                FAQ
              </button>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
