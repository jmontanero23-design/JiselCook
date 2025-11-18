import React from 'react';
import { Recipe } from '../types';
import { BookHeart, ArrowRight, ChefHat, Trash2 } from 'lucide-react';

interface CookbookProps {
  savedRecipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onRemoveRecipe: (recipeId: string) => void;
}

export const Cookbook: React.FC<CookbookProps> = ({ savedRecipes, onSelectRecipe, onRemoveRecipe }) => {
  if (savedRecipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
          <BookHeart size={40} className="text-emerald-200" />
        </div>
        <h3 className="text-lg font-medium text-slate-600">My Cookbook is empty</h3>
        <p className="max-w-md mt-2">Save your favorite AI-generated recipes here so you can cook them again later.</p>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <BookHeart className="text-emerald-600" size={32} />
          My Cookbook
        </h2>
        <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full">
          {savedRecipes.length} recipes
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedRecipes.map((recipe) => (
          <div 
            key={recipe.id} 
            className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
          >
            <div className="h-48 bg-slate-100 relative overflow-hidden">
              {recipe.imageUrl ? (
                <img 
                  src={recipe.imageUrl} 
                  alt={recipe.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ChefHat size={48} />
                </div>
              )}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-semibold text-slate-700 shadow-sm">
                {recipe.difficulty}
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2">{recipe.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{recipe.description}</p>
              
              <div className="mt-auto flex gap-2">
                 <button
                    onClick={() => onSelectRecipe(recipe)}
                    className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    View
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRecipe(recipe.id);
                    }}
                    className="px-3 py-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove from cookbook"
                  >
                      <Trash2 size={18} />
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};