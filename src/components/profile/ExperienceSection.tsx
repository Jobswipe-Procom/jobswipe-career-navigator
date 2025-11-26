import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Profile, Experience } from "@/types/profile";
import { Plus, Trash2 } from "lucide-react";

interface ExperienceSectionProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
}

export const ExperienceSection = ({ profile, onUpdate }: ExperienceSectionProps) => {
  const experiences = profile.experiences || [];

  const addExperience = () => {
    const newExperience: Experience = {
      company: "",
      role: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    onUpdate({ experiences: [...experiences, newExperience] });
  };

  const removeExperience = (index: number) => {
    onUpdate({ experiences: experiences.filter((_, i) => i !== index) });
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ experiences: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={addExperience}
          className="px-4 py-2 rounded-2xl bg-indigo text-white text-sm font-medium shadow-sm hover:bg-indigo/90 transition-all duration-200 ease-out flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une expérience
        </button>
      </div>
        {experiences.length === 0 ? (
          <p className="text-gray-medium text-sm text-center py-4">
            Aucune expérience ajoutée. Cliquez sur "Ajouter une expérience" pour commencer.
          </p>
        ) : (
          experiences.map((exp, index) => (
            <div key={index} className="p-4 rounded-2xl bg-ultra-light border border-gray-light space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-graphite">Expérience {index + 1}</h3>
                <button
                  onClick={() => removeExperience(index)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors duration-200"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-medium">Entreprise</Label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    placeholder="Nom de l'entreprise"
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-medium">Poste</Label>
                  <Input
                    value={exp.role}
                    onChange={(e) => updateExperience(index, "role", e.target.value)}
                    placeholder="Développeur Full Stack"
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-medium">Ville</Label>
                  <Input
                    value={exp.location}
                    onChange={(e) => updateExperience(index, "location", e.target.value)}
                    placeholder="Paris"
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-medium">Date de début</Label>
                  <Input
                    type="month"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-medium">Date de fin</Label>
                  <Input
                    type="month"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                    placeholder="En cours si actuel"
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-gray-medium">Description / Missions principales</Label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(index, "description", e.target.value)}
                    placeholder="Décrivez vos missions principales, réalisations, technologies utilisées..."
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint min-h-[120px]"
                  />
                </div>
              </div>
            </div>
          ))
        )}
    </div>
  );
};




