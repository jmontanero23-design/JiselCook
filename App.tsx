import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CameraCapture } from './components/CameraCapture';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { CookingMode } from './components/CookingMode';
import { Pantry } from './components/Pantry';
import { Profile } from './components/Profile';
import { MealPlanner } from './components/MealPlanner';
import { KitchenAssistant } from './components/KitchenAssistant';
import { ShoppingList } from './components/ShoppingList';
import { Cookbook } from './components/Cookbook';
import { LiveAPITest } from './components/LiveAPITest';
import { analyzeFridgeAndSuggestRecipes, generateSurpriseRecipe } from './services/geminiService';
import { generateRecipeImage } from './services/imageService';
import { Recipe, DietaryRestriction, UserProfile, Badge } from './types';
import { Menu, ChefHat } from 'lucide-react';

const STORAGE_KEYS = {
  PANTRY: 'culinarylens_pantry',
  SHOPPING: 'culinarylens_shopping',
  PROFILE: 'culinarylens_profile',
  SAVED_RECIPES: 'culinarylens_saved'
};

export default function App() {
  const [view, setView] = useState<'home' | 'recipes' | 'shopping' | 'pantry' | 'profile' | 'meal-planner' | 'kitchen-assistant' | 'cookbook'>('home');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isCooking, setIsCooking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<DietaryRestriction[]>([]);

  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLiveAPITest, setShowLiveAPITest] = useState(false);

  // Persisted State
  const [shoppingList, setShoppingList] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOPPING);
    return saved ? JSON.parse(saved) : [];
  });

  const [pantry, setPantry] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PANTRY);
    return saved ? JSON.parse(saved) : ['Salt', 'Pepper', 'Olive Oil'];
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : {
      skillLevel: 'Intermediate',
      preferredCuisines: [],
      dislikes: [],
      recipesCooked: 0,
      badges: []
    };
  });

  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_RECIPES);
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence Effects
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(shoppingList)), [shoppingList]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(pantry)), [pantry]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile)), [userProfile]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(savedRecipes)), [savedRecipes]);

  const handleNavigate = (newView: 'home' | 'recipes' | 'shopping' | 'pantry' | 'profile' | 'meal-planner' | 'kitchen-assistant' | 'cookbook') => {
    if (newView === 'home') {
      setRecipes([]);
      setSelectedRecipe(null);
    }
    setView(newView);
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  const handleSurpriseMe = async () => {
    setIsLoading(true);
    setView('home');
    try {
      const surpriseRecipes = await generateSurpriseRecipe(userProfile, activeFilters);
      setRecipes(surpriseRecipes);
      setView('recipes');

      surpriseRecipes.forEach(async (recipe) => {
        try {
          const imageUrl = await generateRecipeImage(recipe.title, recipe.description);
          if (imageUrl) {
            setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, imageUrl } : r));
          }
        } catch (e) {
          console.error(`Failed to generate image for ${recipe.title}`, e);
        }
      });

    } catch (e) {
      console.error("Failed to generate surprise recipe", e);
      alert("Chef is busy! Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageCaptured = async (file: File) => {
    setIsLoading(true);
    setView('home');

    const readFile = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const base64String = await readFile(file);
      const base64Data = base64String.split(',')[1];
      const mimeType = file.type;

      const suggestedRecipes = await analyzeFridgeAndSuggestRecipes(
        base64Data,
        mimeType,
        activeFilters,
        pantry,
        userProfile
      );

      setRecipes(suggestedRecipes);
      setView('recipes');

      suggestedRecipes.forEach(async (recipe) => {
        try {
          const imageUrl = await generateRecipeImage(recipe.title, recipe.description);
          if (imageUrl) {
            setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, imageUrl } : r));
          }
        } catch (e) {
          console.error(`Failed to generate image for ${recipe.title}`, e);
        }
      });

    } catch (error) {
      console.error("Failed to analyze image", error);
      alert("Something went wrong while analyzing the image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngredientsDetected = (ingredients: string[]) => {
    setPantry(prev => {
      const newItems = ingredients.filter(i => !prev.includes(i));
      if (newItems.length === 0) return prev;
      // Optional: Notify user
      // console.log("Added to pantry:", newItems);
      return [...prev, ...newItems];
    });
  };

  const handleToggleFilter = (filter: DietaryRestriction) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleAddToShoppingList = (item: string) => {
    if (!shoppingList.includes(item)) {
      setShoppingList(prev => [...prev, item]);
    }
  };

  const handleRemoveFromShoppingList = (index: number) => {
    setShoppingList(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPantryItem = (item: string) => {
    if (!pantry.includes(item)) {
      setPantry(prev => [...prev, item]);
    }
  };

  const handleRemovePantryItem = (item: string) => {
    setPantry(prev => prev.filter(i => i !== item));
  };

  const handleToggleSaveRecipe = (recipe: Recipe) => {
    const isSaved = savedRecipes.some(r => r.id === recipe.id);
    if (isSaved) {
      setSavedRecipes(prev => prev.filter(r => r.id !== recipe.id));
    } else {
      setSavedRecipes(prev => [...prev, recipe]);
    }
  };

  const checkForBadges = (currentCount: number): Badge[] => {
    const newBadges: Badge[] = [];
    const currentBadgeIds = new Set(userProfile.badges.map(b => b.id));

    if (currentCount >= 1 && !currentBadgeIds.has('novice')) {
      newBadges.push({ id: 'novice', name: 'Novice Chef', description: 'Cooked your first meal!', icon: '🥚', unlockedAt: Date.now() });
    }
    if (currentCount >= 5 && !currentBadgeIds.has('sous')) {
      newBadges.push({ id: 'sous', name: 'Sous Chef', description: 'Cooked 5 meals.', icon: '🔪', unlockedAt: Date.now() });
    }
    if (currentCount >= 10 && !currentBadgeIds.has('master')) {
      newBadges.push({ id: 'master', name: 'Head Chef', description: 'Cooked 10 meals. You are a pro!', icon: '👨‍🍳', unlockedAt: Date.now() });
    }
    return newBadges;
  };

  const handleFinishCooking = () => {
    setIsCooking(false);
    // Increment stats
    const newCount = (userProfile.recipesCooked || 0) + 1;
    const newBadges = checkForBadges(newCount);

    setUserProfile(prev => ({
      ...prev,
      recipesCooked: newCount,
      badges: [...prev.badges, ...newBadges]
    }));

    if (newBadges.length > 0) {
      alert(`Congratulations! You unlocked ${newBadges.length} new badge(s)! Check your profile.`);
    }
  };

  // Determine if mobile header should be shown
  const showMobileHeader = !isCooking && !selectedRecipe;

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Live API Test Component */}
      {showLiveAPITest && (
        <div id="live-api-test">
          <LiveAPITest />
        </div>
      )}

      {/* Test Button - Temporary for debugging */}
      <button
        onClick={() => setShowLiveAPITest(true)}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700"
      >
        Test Live API
      </button>

      <Sidebar
        activeView={view}
        onNavigate={handleNavigate}
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        shoppingListCount={shoppingList.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 h-full relative overflow-hidden flex flex-col">

        {/* Mobile Header */}
        {showMobileHeader && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0 z-30">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <ChefHat size={24} />
              <span>CulinaryLens</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full"
            >
              <Menu size={24} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {view === 'home' && (
            <CameraCapture
              onImageCaptured={handleImageCaptured}
              onSurpriseMe={handleSurpriseMe}
              isLoading={isLoading}
              onIngredientsDetected={handleIngredientsDetected}
            />
          )}

          {view === 'kitchen-assistant' && (
            <KitchenAssistant />
          )}

          {view === 'recipes' && !selectedRecipe && (
            <RecipeList
              recipes={recipes}
              onSelectRecipe={(r) => setSelectedRecipe(r)}
            />
          )}

          {view === 'cookbook' && !selectedRecipe && (
            <Cookbook
              savedRecipes={savedRecipes}
              onSelectRecipe={setSelectedRecipe}
              onRemoveRecipe={(id) => setSavedRecipes(prev => prev.filter(r => r.id !== id))}
            />
          )}

          {(view === 'recipes' || view === 'cookbook') && selectedRecipe && (
            <RecipeDetail
              recipe={selectedRecipe}
              onBack={() => setSelectedRecipe(null)}
              onStartCooking={() => setIsCooking(true)}
              onAddToShoppingList={handleAddToShoppingList}
              shoppingList={shoppingList}
              isSaved={savedRecipes.some(r => r.id === selectedRecipe.id)}
              onToggleSave={handleToggleSaveRecipe}
            />
          )}

          {view === 'pantry' && (
            <Pantry
              pantryItems={pantry}
              onAddPantryItem={handleAddPantryItem}
              onRemovePantryItem={handleRemovePantryItem}
            />
          )}

          {view === 'profile' && (
            <Profile
              profile={userProfile}
              onUpdateProfile={setUserProfile}
            />
          )}

          {view === 'meal-planner' && (
            <MealPlanner
              pantryItems={pantry}
              userProfile={userProfile}
            />
          )}

          {view === 'shopping' && (
            <ShoppingList
              items={shoppingList}
              onAddItem={handleAddToShoppingList}
              onRemoveItem={handleRemoveFromShoppingList}
            />
          )}
        </div>

        {/* Full Screen Cooking Mode Overlay */}
        {isCooking && selectedRecipe && (
          <CookingMode
            recipe={selectedRecipe}
            onClose={handleFinishCooking}
          />
        )}
      </main>
    </div>
  );
}