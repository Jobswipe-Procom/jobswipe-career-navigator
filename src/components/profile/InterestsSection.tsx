import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Profile } from "@/types/profile";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface InterestsSectionProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
}

export const InterestsSection = ({ profile, onUpdate }: InterestsSectionProps) => {
  const interests = profile.interests || [];
  const activities = profile.activities || [];

  const [newInterest, setNewInterest] = useState("");
  const [newActivity, setNewActivity] = useState("");

  const addInterest = () => {
    if (newInterest.trim()) {
      onUpdate({ interests: [...interests, newInterest.trim()] });
      setNewInterest("");
    }
  };

  const removeInterest = (index: number) => {
    onUpdate({ interests: interests.filter((_, i) => i !== index) });
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      onUpdate({ activities: [...activities, newActivity.trim()] });
      setNewActivity("");
    }
  };

  const removeActivity = (index: number) => {
    onUpdate({ activities: activities.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
        {/* Centres d'intérêt */}
        <div className="space-y-4">
          <Label className="text-gray-medium font-medium">Centres d'intérêt</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {interests.map((interest, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-light text-gray-dark border border-gray-medium text-sm font-medium"
              >
                <span>{interest}</span>
                <button
                  onClick={() => removeInterest(index)}
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
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Sports, voyages, entrepreneuriat, cuisine..."
              className="flex-1 rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
              onKeyPress={(e) => e.key === "Enter" && addInterest()}
            />
            <button
              onClick={addInterest}
              className="px-4 py-2 rounded-2xl bg-mint text-white text-sm font-medium shadow-sm hover:bg-mint-dark transition-all duration-200 ease-out"
              type="button"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Activités / Associatif */}
        <div className="space-y-4">
          <Label className="text-gray-medium font-medium">Activités / Associatif</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo/10 text-indigo border border-indigo/20 text-sm font-medium"
              >
                <span>{activity}</span>
                <button
                  onClick={() => removeActivity(index)}
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
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="Clubs, rôles, responsabilités..."
              className="flex-1 rounded-2xl border-gray-light focus:border-mint focus:ring-mint"
              onKeyPress={(e) => e.key === "Enter" && addActivity()}
            />
            <button
              onClick={addActivity}
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




