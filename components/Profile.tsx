import React, { useState } from 'react';
import { User, ChefHat, Ban, Utensils, X, Plus, Award } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileProps {
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
}

export const Profile: React.FC<ProfileProps> = ({ profile, onUpdateProfile }) => {
  const [newCuisine, setNewCuisine] = useState('');
  const [newDislike, setNewDislike] = useState('');

  const updateSkill = (level: 'Beginner' | 'Intermediate' | 'Advanced') => {
    onUpdateProfile({ ...profile, skillLevel: level });
  };

  const addCuisine = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCuisine.trim() && !profile.preferredCuisines.includes(newCuisine.trim())) {
      onUpdateProfile({ 
        ...profile, 
        preferredCuisines: [...profile.preferredCuisines, newCuisine.trim()] 
      });
      setNewCuisine('');
    }
  };

  const removeCuisine = (cuisine: string) => {
    onUpdateProfile({ 
      ...profile, 
      preferredCuisines: profile.preferredCuisines.filter(c => c !== cuisine) 
    });
  };

  const addDislike = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDislike.trim() && !profile.dislikes.includes(newDislike.trim())) {
      onUpdateProfile({ 
        ...profile, 
        dislikes: [...profile.dislikes, newDislike.trim()] 
      });
      setNewDislike('');
    }
  };

  const removeDislike = (item: string) => {
    onUpdateProfile({ 
      ...profile, 
      dislikes: profile.dislikes.filter(d => d !== item) 
    });
  };

  return (
    <div className="p-8 h-full overflow-y-auto max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <User className="text-emerald-600" size={32} />
          Your Profile
        </h2>
      </div>

      <div className="space-y-8">
        {/* Gamification / Badges Section */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md text-white">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
                    <Award size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold">Chef Achievements</h3>
                    <p className="text-slate-400 text-sm">Recipes Cooked: {profile.recipesCooked || 0}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {profile.badges && profile.badges.length > 0 ? profile.badges.map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center text-center p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-2xl mb-2">{badge.icon}</span>
                        <span className="text-xs font-bold text-slate-200">{badge.name}</span>
                        <span className="text-[10px] text-slate-400 mt-1 leading-tight">{badge.description}</span>
                    </div>
                )) : (
                    <div className="col-span-3 text-center text-slate-400 text-sm py-4">
                        Cook recipes to unlock badges!
                    </div>
                )}
            </div>
        </section>

        {/* Cooking Skill */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ChefHat size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Cooking Skill Level</h3>
          </div>
          <p className="text-slate-600 mb-4">This helps us suggest recipes that match your experience.</p>
          
          <div className="grid grid-cols-3 gap-4">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
              <button
                key={level}
                onClick={() => updateSkill(level)}
                className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  profile.skillLevel === level
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </section>

        {/* Preferred Cuisines */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Utensils size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Preferred Cuisines</h3>
          </div>
          
          <form onSubmit={addCuisine} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCuisine}
              onChange={e => setNewCuisine(e.target.value)}
              placeholder="e.g., Italian, Mexican, Thai"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button type="submit" className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600">
              <Plus size={24} />
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {profile.preferredCuisines.length === 0 && <p className="text-slate-400 italic">No preferences added yet.</p>}
            {profile.preferredCuisines.map(cuisine => (
              <span key={cuisine} className="px-3 py-1.5 bg-orange-50 text-orange-800 rounded-full text-sm font-medium flex items-center gap-2">
                {cuisine}
                <button onClick={() => removeCuisine(cuisine)} className="hover:text-orange-900">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Dislikes / Allergies */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Ban size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Dislikes & Allergies</h3>
          </div>
          <p className="text-slate-600 mb-4 text-sm">Ingredients added here will be excluded from suggestions.</p>
          
          <form onSubmit={addDislike} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newDislike}
              onChange={e => setNewDislike(e.target.value)}
              placeholder="e.g., Peanuts, Cilantro, Shellfish"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button type="submit" className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600">
              <Plus size={24} />
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {profile.dislikes.length === 0 && <p className="text-slate-400 italic">No restrictions added.</p>}
            {profile.dislikes.map(item => (
              <span key={item} className="px-3 py-1.5 bg-red-50 text-red-800 rounded-full text-sm font-medium flex items-center gap-2">
                {item}
                <button onClick={() => removeDislike(item)} className="hover:text-red-900">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};