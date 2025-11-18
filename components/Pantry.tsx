import React, { useState } from 'react';
import { Package, Plus, Trash2, CheckCircle } from 'lucide-react';

interface PantryProps {
  pantryItems: string[];
  onAddPantryItem: (item: string) => void;
  onRemovePantryItem: (item: string) => void;
}

export const Pantry: React.FC<PantryProps> = ({ pantryItems, onAddPantryItem, onRemovePantryItem }) => {
  const [newItem, setNewItem] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      onAddPantryItem(newItem.trim());
      setNewItem('');
    }
  };

  const suggestedStaples = ['Salt', 'Pepper', 'Olive Oil', 'Flour', 'Sugar', 'Rice', 'Pasta', 'Garlic', 'Onions'];

  return (
    <div className="p-8 h-full overflow-y-auto max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Package className="text-emerald-600" size={32} />
          Pantry Inventory
        </h2>
        <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full">
          {pantryItems.length} items
        </span>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <p className="text-slate-600 mb-4">Add staple ingredients you always have on hand. We'll combine these with your fridge scan to suggest recipes.</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input 
            type="text" 
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="e.g., Olive Oil, Flour, Spices..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-xl transition-colors font-medium">
            Add Item
          </button>
        </form>

        <div className="mt-4">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Quick Add Staples</p>
          <div className="flex flex-wrap gap-2">
            {suggestedStaples.map(staple => {
              const hasIt = pantryItems.includes(staple);
              return (
                <button
                  key={staple}
                  onClick={() => !hasIt && onAddPantryItem(staple)}
                  disabled={hasIt}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    hasIt 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >
                   {hasIt && <CheckCircle size={12} className="inline mr-1" />}
                   {staple}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {pantryItems.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Package size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-500">Your pantry is empty</h3>
          <p className="text-slate-400">Add items to help us suggest better recipes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {pantryItems.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <span className="font-medium text-slate-700">{item}</span>
              <button 
                onClick={() => onRemovePantryItem(item)}
                className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};