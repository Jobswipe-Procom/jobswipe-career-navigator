import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Profile, Language } from "@/types/profile";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

interface SkillsSectionProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
}

export const SkillsSection = ({ profile, onUpdate }: SkillsSectionProps) => {
  const languages = profile.languages || [];
  const hardSkills = profile.hardSkills || [];
  const softSkills = profile.softSkills || [];

  // États pour les inputs temporaires
  const [newLanguage, setNewLanguage] = useState({ name: "", level: "" });
  const [newHardSkill, setNewHardSkill] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");

  // Langues
  const addLanguage = () => {
    if (newLanguage.name && newLanguage.level) {
      onUpdate({ languages: [...languages, { ...newLanguage }] });
      setNewLanguage({ name: "", level: "" });
    }
  };

  const removeLanguage = (index: number) => {
    onUpdate({ languages: languages.filter((_, i) => i !== index) });
  };

  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ languages: updated });
  };

  // Hard Skills
  const addHardSkill = () => {
    if (newHardSkill.trim()) {
      onUpdate({ hardSkills: [...hardSkills, newHardSkill.trim()] });
      setNewHardSkill("");
    }
  };

  const removeHardSkill = (index: number) => {
    onUpdate({ hardSkills: hardSkills.filter((_, i) => i !== index) });
  };

  // Soft Skills
  const addSoftSkill = () => {
    if (newSoftSkill.trim()) {
      onUpdate({ softSkills: [...softSkills, newSoftSkill.trim()] });
      setNewSoftSkill("");
    }
  };

  const removeSoftSkill = (index: number) => {
    onUpdate({ softSkills: softSkills.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
        {/* Langues */}
        <div className="space-y-4">
          <h3 className="font-medium text-graphite">Langues</h3>
          <div className="space-y-2">
            {languages.map((lang, index) => (
              <div key={index} className="flex items-center gap-2 p-3 rounded-2xl bg-ultra-light border border-gray-light">
                <Input
                  value={lang.name}
                  onChange={(e) => updateLanguage(index, "name", e.target.value)}
                  placeholder="Français"
                  className="flex-1 rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                />
                <Input
                  value={lang.level}
                  onChange={(e) => updateLanguage(index, "level", e.target.value)}
                  placeholder="Natif, C1, B2..."
                  className="w-32 rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                />
                <button
                  onClick={() => removeLanguage(index)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors duration-200"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input
                value={newLanguage.name}
                onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                placeholder="Nouvelle langue"
                className="flex-1 rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                onKeyPress={(e) => e.key === "Enter" && addLanguage()}
              />
              <Input
                value={newLanguage.level}
                onChange={(e) => setNewLanguage({ ...newLanguage, level: e.target.value })}
                placeholder="Niveau"
                className="w-32 rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                onKeyPress={(e) => e.key === "Enter" && addLanguage()}
              />
              <button
                onClick={addLanguage}
                className="px-4 py-2 rounded-2xl bg-mint text-white text-sm font-medium shadow-sm hover:bg-mint-dark transition-all duration-200 ease-out"
                type="button"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Compétences techniques */}
        <div className="space-y-4">
          <h3 className="font-medium text-graphite">Compétences techniques</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {hardSkills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-mint-light text-mint-dark border border-mint text-sm font-medium"
              >
                <span>{skill}</span>
                <button
                  onClick={() => removeHardSkill(index)}
                  className="hover:text-red-600 transition-colors duration-200"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newHardSkill}
              onChange={(e) => setNewHardSkill(e.target.value)}
              placeholder="Python, Power BI, LLM..."
              className="flex-1 rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
              onKeyPress={(e) => e.key === "Enter" && addHardSkill()}
            />
            <button
              onClick={addHardSkill}
              className="px-4 py-2 rounded-2xl bg-mint text-white text-sm font-medium shadow-sm hover:bg-mint-dark transition-all duration-200 ease-out"
              type="button"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Soft Skills */}
        <div className="space-y-4">
          <h3 className="font-medium text-graphite">Soft Skills</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {softSkills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo/10 text-indigo border border-indigo/20 text-sm font-medium"
              >
                <span>{skill}</span>
                <button
                  onClick={() => removeSoftSkill(index)}
                  className="hover:text-red-600 transition-colors duration-200"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSoftSkill}
              onChange={(e) => setNewSoftSkill(e.target.value)}
              placeholder="Gestion d'équipe, analyse, communication..."
              className="flex-1 rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
              onKeyPress={(e) => e.key === "Enter" && addSoftSkill()}
            />
            <button
              onClick={addSoftSkill}
              className="px-4 py-2 rounded-2xl bg-indigo text-white text-sm font-medium shadow-sm hover:bg-indigo/90 transition-all duration-200 ease-out"
              type="button"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
    </div>
  );
};


