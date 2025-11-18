import React from 'react';
import { Recipe } from '../types';
import { Clock, Flame, ChefHat, AlertTriangle, ArrowRight, Star } from 'lucide-react';

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelectRecipe }) => {
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <ChefHat size={40} className="text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-600">No recipes yet</h3>
        <p className="max-w-md mt-2">Scan your fridge to generate personalized recipe suggestions based on your ingredients and pantry.</p>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Suggested Recipes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => {
            const missingCount = recipe.ingredients.filter(i => i.isMissing).length;
            
            return (
              <div 
                key={recipe.id} 
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
              >
                <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center relative overflow-hidden group">
                  {recipe.imageUrl ? (
                    <img 
                      src={recipe.imageUrl} 
                      alt={recipe.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 animate-in fade-in" 
                    />
                  ) : (
                    <ChefHat size={48} className="text-emerald-200" />
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-semibold text-slate-700 shadow-sm z-10">
                    {recipe.difficulty}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">{recipe.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 mb-3 text-amber-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-xs font-bold">{recipe.rating?.toFixed(1) || '4.5'}</span>
                        <span className="text-xs text-slate-400 font-normal">({recipe.reviewCount || 0} reviews)</span>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">{recipe.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-600 mb-4">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{recipe.prepTimeMinutes}m</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Flame size={14} />
                        <span>{recipe.calories} kcal</span>
                      </div>
                    </div>
                  </div>

                  {missingCount > 0 ? (
                    <div className="mb-4 flex items-start space-x-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                      <span>Missing {missingCount} ingredient{missingCount !== 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <div className="mb-4 flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                         <ChefHat size={14} />
                         <span>You have all ingredients!</span>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectRecipe(recipe)}
                    className="w-full mt-auto bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 transition-colors"
                  >
                    <span>View Recipe</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};