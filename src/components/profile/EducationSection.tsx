import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Profile, Education } from "@/types/profile";
import { Plus, Trash2 } from "lucide-react";

interface EducationSectionProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
}

export const EducationSection = ({ profile, onUpdate }: EducationSectionProps) => {
  const education = profile.education || [];

  const addEducation = () => {
    const newEducation: Education = {
      school: "",
      degree: "",
      location: "",
      startDate: "",
      endDate: "",
      details: "",
    };
    onUpdate({ education: [...education, newEducation] });
  };

  const removeEducation = (index: number) => {
    onUpdate({ education: education.filter((_, i) => i !== index) });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ education: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={addEducation}
          className="px-4 py-2 rounded-2xl bg-mint text-white text-sm font-medium shadow-sm hover:bg-mint-dark transition-all duration-200 ease-out flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une formation
        </button>
      </div>
        {education.length === 0 ? (
          <p className="text-gray-medium text-sm text-center py-4">
            Aucune formation ajoutée. Cliquez sur "Ajouter une formation" pour commencer.
          </p>
        ) : (
          education.map((edu, index) => (
            <div key={index} className="p-4 rounded-2xl bg-ultra-light border border-gray-light space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-graphite">Formation {index + 1}</h3>
                <button
                  onClick={() => removeEducation(index)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors duration-200"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-medium">Établissement</Label>
                  <Input
                    value={edu.school}
                    onChange={(e) => updateEducation(index, "school", e.target.value)}
                    placeholder="IMT Atlantique"
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-medium">Diplôme</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    placeholder="Master en Informatique"
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-medium">Ville</Label>
                  <Input
                    value={edu.location}
                    onChange={(e) => updateEducation(index, "location", e.target.value)}
                    placeholder="Brest"
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-medium">Date de début</Label>
                  <Input
                    type="month"
                    value={edu.startDate}
                    onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-gray-medium">Date de fin</Label>
                  <Input
                    type="month"
                    value={edu.endDate}
                    onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-gray-medium">Détails / Cours pertinents</Label>
                  <Textarea
                    value={edu.details || ""}
                    onChange={(e) => updateEducation(index, "details", e.target.value)}
                    placeholder="Cours pertinents, spécialités, mentions..."
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          ))
        )}
    </div>
  );
};




