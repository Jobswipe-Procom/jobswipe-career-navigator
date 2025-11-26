import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Profile, ExperienceLevel } from "@/types/profile";

interface PersonalInfoSectionProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
}

export const PersonalInfoSection = ({ profile, onUpdate }: PersonalInfoSectionProps) => {
  const experienceLevelOptions: { value: ExperienceLevel | ""; label: string }[] = [
    { value: "", label: "Sélectionner..." },
    { value: "junior", label: "Junior" },
    { value: "intermediate", label: "Intermédiaire" },
    { value: "senior", label: "Senior" },
  ];

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-gray-medium">Prénom</Label>
            <Input
              id="first_name"
              value={profile.first_name || ""}
              onChange={(e) => onUpdate({ first_name: e.target.value })}
              placeholder="Jean"
              className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-gray-medium">Nom</Label>
            <Input
              id="last_name"
              value={profile.last_name || ""}
              onChange={(e) => onUpdate({ last_name: e.target.value })}
              placeholder="Dupont"
              className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-medium">Email</Label>
          <Input
            id="email"
            type="email"
            value={profile.email || ""}
            onChange={(e) => onUpdate({ email: e.target.value })}
            placeholder="jean.dupont@example.com"
            className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-gray-medium">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={profile.phone || ""}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+33 6 12 34 56 78"
            className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="text-gray-medium">Ville</Label>
          <Input
            id="city"
            value={profile.city || ""}
            onChange={(e) => onUpdate({ city: e.target.value })}
            placeholder="Paris"
            className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin" className="text-gray-medium">LinkedIn</Label>
          <Input
            id="linkedin"
            type="url"
            value={profile.linkedin || ""}
            onChange={(e) => onUpdate({ linkedin: e.target.value })}
            placeholder="https://linkedin.com/in/jean-dupont"
            className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_role" className="text-gray-medium">Rôle ciblé</Label>
          <Input
            id="target_role"
            value={profile.target_role || ""}
            onChange={(e) => onUpdate({ target_role: e.target.value })}
            placeholder="Développeur Full Stack"
            className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience_level" className="text-gray-medium">Niveau d'expérience</Label>
          <select
            id="experience_level"
            value={profile.experience_level || ""}
            onChange={(e) => onUpdate({ experience_level: e.target.value || null })}
            className="flex h-10 w-full rounded-2xl border border-gray-light bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {experienceLevelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability" className="text-gray-medium">Disponibilité</Label>
          <Input
            id="availability"
            value={profile.availability || ""}
            onChange={(e) => onUpdate({ availability: e.target.value })}
            placeholder="À partir d'avril 2026"
            className="rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
          />
        </div>
    </div>
  );
};




