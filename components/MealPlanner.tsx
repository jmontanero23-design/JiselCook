import React, { useState } from 'react';
import { DayPlan, UserProfile } from '../types';
import { generateMealPlan } from '../services/geminiService';
import { Calendar, Loader2, RefreshCw, ChefHat } from 'lucide-react';

interface MealPlannerProps {
  pantryItems: string[];
  userProfile: UserProfile;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ pantryItems, userProfile }) => {
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const newPlan = await generateMealPlan(pantryItems, userProfile);
      setPlan(newPlan);
    } catch (error) {
      console.error("Failed to generate meal plan", error);
      alert("Failed to generate meal plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Calendar className="text-emerald-600" size={32} />
          Smart Meal Planner
        </h2>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
          <span>{plan.length > 0 ? 'Regenerate Plan' : 'Generate 3-Day Plan'}</span>
        </button>
      </div>

      {plan.length === 0 && !isLoading ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <ChefHat size={64} className="mx-auto text-slate-200 mb-6" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">No Meal Plan Yet</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
                Let AI analyze your pantry ({pantryItems.length} items) and create a personalized 3-day meal plan to minimize waste.
            </p>
            <button
                onClick={handleGenerate}
                className="bg-emerald-100 text-emerald-700 font-bold py-2 px-6 rounded-lg hover:bg-emerald-200 transition-colors"
            >
                Create My Plan
            </button>
        </div>
      ) : null}

      {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Chef AI is planning your menu...</p>
          </div>
      )}

      <div className="space-y-8">
        {plan.map((day) => (
          <div key={day.day} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Day {day.day}</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {day.meals.map((meal, idx) => (
                <div key={idx} className={idx > 0 ? "pt-4 md:pt-0 md:pl-6" : ""}>
                  <div className="flex items-center gap-2 mb-2">
                     <span className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${
                         meal.type === 'Breakfast' ? 'bg-amber-100 text-amber-700' :
                         meal.type === 'Lunch' ? 'bg-sky-100 text-sky-700' :
                         'bg-indigo-100 text-indigo-700'
                     }`}>
                         {meal.type}
                     </span>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1 leading-tight">{meal.title}</h4>
                  <p className="text-sm text-slate-500 mb-3">{meal.description}</p>
                  <p className="text-xs text-slate-400">
                      <span className="font-semibold">Uses:</span> {meal.ingredientsUsed.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};