import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Profile, Project } from "@/types/profile";
import { Plus, Trash2 } from "lucide-react";

interface ProjectsSectionProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
}

export const ProjectsSection = ({ profile, onUpdate }: ProjectsSectionProps) => {
  const projects = profile.projects || [];

  const addProject = () => {
    const newProject: Project = {
      name: "",
      role: "",
      description: "",
      skills: "",
    };
    onUpdate({ projects: [...projects, newProject] });
  };

  const removeProject = (index: number) => {
    onUpdate({ projects: projects.filter((_, i) => i !== index) });
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ projects: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={addProject}
          className="px-4 py-2 rounded-2xl bg-mint text-white text-sm font-medium shadow-sm hover:bg-mint-dark transition-all duration-200 ease-out flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un projet
        </button>
      </div>
        {projects.length === 0 ? (
          <p className="text-gray-medium text-sm text-center py-4">
            Aucun projet ajouté. Cliquez sur "Ajouter un projet" pour commencer.
          </p>
        ) : (
          projects.map((project, index) => (
            <div key={index} className="p-4 rounded-2xl bg-ultra-light border border-gray-light space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-graphite">Projet {index + 1}</h3>
                <button
                  onClick={() => removeProject(index)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors duration-200"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-medium">Nom du projet</Label>
                  <Input
                    value={project.name}
                    onChange={(e) => updateProject(index, "name", e.target.value)}
                    placeholder="Application web de gestion"
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-medium">Rôle</Label>
                  <Input
                    value={project.role}
                    onChange={(e) => updateProject(index, "role", e.target.value)}
                    placeholder="Développeur Full Stack"
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-gray-medium">Description courte</Label>
                  <Textarea
                    value={project.description}
                    onChange={(e) => updateProject(index, "description", e.target.value)}
                    placeholder="Description du projet, objectifs, contexte..."
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint min-h-[100px]"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-gray-medium">Compétences mobilisées</Label>
                  <Input
                    value={project.skills}
                    onChange={(e) => updateProject(index, "skills", e.target.value)}
                    placeholder="React, TypeScript, Node.js, PostgreSQL..."
                    className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
                  />
                </div>
              </div>
            </div>
          ))
        )}
    </div>
  );
};




