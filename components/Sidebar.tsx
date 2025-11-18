import React from 'react';
import { DietaryRestriction } from '../types';
import { ChefHat, ShoppingCart, Camera, Leaf, AlertCircle, Package, User, Calendar, MessageSquare, BookHeart } from 'lucide-react';

interface SidebarProps {
  activeView: 'home' | 'recipes' | 'cooking' | 'shopping' | 'pantry' | 'profile' | 'meal-planner' | 'kitchen-assistant' | 'cookbook';
  onNavigate: (view: 'home' | 'recipes' | 'shopping' | 'pantry' | 'profile' | 'meal-planner' | 'kitchen-assistant' | 'cookbook') => void;
  activeFilters: DietaryRestriction[];
  onToggleFilter: (filter: DietaryRestriction) => void;
  shoppingListCount: number;
}

const FILTERS: DietaryRestriction[] = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo', 'Dairy-Free'];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  activeFilters,
  onToggleFilter,
  shoppingListCount
}) => {
  return (
    <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xl">
          <ChefHat size={28} />
          <span>CulinaryLens</span>
        </div>
      </div>

      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        <div className="pb-4">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kitchen</p>
          <button
            onClick={() => onNavigate('home')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'home' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Camera size={20} />
            <span>Scan Fridge</span>
          </button>
          <button
            onClick={() => onNavigate('kitchen-assistant')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'kitchen-assistant' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare size={20} />
            <span>AI Chef Assistant</span>
          </button>
          <button
            onClick={() => onNavigate('recipes')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'recipes' || activeView === 'cooking' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ChefHat size={20} />
            <span>Recipes</span>
          </button>
          <button
            onClick={() => onNavigate('cookbook')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'cookbook' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookHeart size={20} />
            <span>My Cookbook</span>
          </button>
          <button
            onClick={() => onNavigate('meal-planner')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'meal-planner' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar size={20} />
            <span>Meal Planner</span>
          </button>
          <button
            onClick={() => onNavigate('pantry')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'pantry' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Package size={20} />
            <span>My Pantry</span>
          </button>
          <button
            onClick={() => onNavigate('shopping')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'shopping' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="relative">
              <ShoppingCart size={20} />
              {shoppingListCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {shoppingListCount}
                </span>
              )}
            </div>
            <span>Shopping List</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">You</p>
          <button
            onClick={() => onNavigate('profile')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors mb-3 ${
              activeView === 'profile' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User size={20} />
            <span>Profile & Preferences</span>
          </button>

          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-4">Dietary Filters</p>
          <div className="space-y-1">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => onToggleFilter(filter)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeFilters.includes(filter) 
                    ? 'bg-emerald-100 text-emerald-800 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center space-x-2">
                   <Leaf size={14} className={activeFilters.includes(filter) ? "text-emerald-600" : "text-slate-300"} />
                   <span>{filter}</span>
                </span>
                {activeFilters.includes(filter) && (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
          <div className="px-3 mt-4">
            <div className="bg-blue-50 p-3 rounded-lg flex items-start space-x-2 text-xs text-blue-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p>Filters and profile settings apply to the next scan.</p>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
        Powered by Gemini 3 Pro
      </div>
    </div>
  );
};