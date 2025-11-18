export interface Ingredient {
  name: string;
  amount?: string;
  isMissing?: boolean;
}

export interface Step {
  stepNumber: number;
  instruction: string;
}

export interface DrinkPairing {
  name: string;
  description: string;
  type: 'Wine' | 'Beer' | 'Cocktail' | 'Non-Alcoholic';
}

export interface FlavorProfile {
  sweet: number;
  salty: number;
  sour: number;
  bitter: number;
  spicy: number;
  umami: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTimeMinutes: number;
  calories: number;
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  drinkPairing?: DrinkPairing;
  flavorProfile?: FlavorProfile;
}

export type DietaryRestriction = 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Keto' | 'Paleo' | 'Dairy-Free';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number; // timestamp
}

export interface UserProfile {
  preferredCuisines: string[];
  dislikes: string[];
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  recipesCooked: number;
  badges: Badge[];
}

export interface Meal {
  type: 'Breakfast' | 'Lunch' | 'Dinner';
  title: string;
  description: string;
  ingredientsUsed: string[];
}

export interface DayPlan {
  day: number;
  meals: Meal[];
}

export interface SearchResult {
  title: string;
  uri: string;
}

export interface ShoppingCategory {
  category: string;
  items: string[];
}

export type ChefPersonality = 'Professional' | 'Grandma' | 'Gordon' | 'Robot';

export interface AppState {
  recipes: Recipe[];
  savedRecipes: Recipe[];
  shoppingList: string[];
  pantry: string[];
  userProfile: UserProfile;
  mealPlan: DayPlan[];
  view: 'home' | 'recipes' | 'cooking' | 'shopping' | 'pantry' | 'profile' | 'meal-planner' | 'kitchen-assistant' | 'cookbook';
  selectedRecipeId: string | null;
  activeFilters: DietaryRestriction[];
  isLoading: boolean;
}