export interface Ingredient {
  name: string;
  amount?: string;
  quantity?: string;
  unit?: string;
  category?: string;
  isMissing?: boolean;
}

export interface Step {
  stepNumber: number;
  instruction: string;
  duration?: number;
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
  cookTime?: number;
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

export interface MealPlan {
  days: DayPlan[];
}

export interface NutritionalInfo {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  vitamins: string[];
}

export interface ShoppingList {
  categories: ShoppingCategory[];
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
  view: 'home' | 'recipes' | 'cooking' | 'shopping' | 'pantry' | 'profile' | 'meal-planner' | 'kitchen-assistant' | 'cookbook' | 'analytics' | 'techniques' | 'waste-tracker' | 'reels' | 'challenges' | 'cook-off' | 'classes' | 'flavor-lab' | 'family-profiles';
  selectedRecipeId: string | null;
  activeFilters: DietaryRestriction[];
  isLoading: boolean;
}

// ==========================================
// FEATURE 1: Taste Memory AI
// ==========================================

export interface FlavorPreference {
  sweet: number;        // -100 to +100 (relative to baseline)
  salty: number;
  sour: number;
  bitter: number;
  spicy: number;
  umami: number;
}

export interface IngredientPreference {
  ingredient: string;
  affinity: number;     // -100 (hate) to +100 (love)
  frequency: number;    // How often they choose recipes with this
  lastUsed: number;     // Timestamp
}

export interface CookingStylePreference {
  texturePreferences: {
    crispy: number;
    creamy: number;
    crunchy: number;
    soft: number;
  };
  preparationMethods: {
    fried: number;
    baked: number;
    grilled: number;
    steamed: number;
    raw: number;
  };
  cuisineAffinities: Record<string, number>; // e.g., {"Italian": 85, "Thai": 60}
}

export interface TasteProfile {
  flavorPreferences: FlavorPreference;
  ingredientPreferences: IngredientPreference[];
  cookingStyles: CookingStylePreference;
  overallProfile: string; // AI-generated description
  lastAnalyzed: number;   // Timestamp
  recipeInteractionCount: number; // How many data points we have
}

export interface RecipeInteraction {
  recipeId: string;
  recipeTitle: string;
  timestamp: number;
  action: 'viewed' | 'saved' | 'cooked' | 'rated' | 'remixed';
  rating?: number;        // 1-5 stars if rated
  cookingTimeActual?: number; // In minutes
  userNotes?: string;
  flavorProfile?: FlavorProfile; // From recipe
  ingredients: string[];
}

// ==========================================
// FEATURE 2: Kitchen Analytics Dashboard
// ==========================================

export interface CookingStats {
  totalRecipesCooked: number;
  totalCookingMinutes: number;
  recipesThisWeek: number;
  recipesThisMonth: number;
  currentStreak: number; // Days in a row
  longestStreak: number;
  firstCookDate: number; // Timestamp
}

export interface CuisineStats {
  cuisine: string;
  recipesCooked: number;
  masteryLevel: number; // 0-100
  lastCooked: number;
}

export interface IngredientMastery {
  ingredient: string;
  timesUsed: number;
  firstUsed: number;
  lastUsed: number;
  masteryLevel: number; // 0-100 based on variety of recipes
  icon: string; // Emoji
}

export interface NutritionalTracking {
  date: string; // YYYY-MM-DD
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealsCooked: number;
}

export interface SavingsTracking {
  totalEstimatedSavings: number;
  savingsThisMonth: number;
  mealsVsRestaurant: number; // Cost comparison
  ingredientsRescued: number; // From fridge scanner
}

export interface AnalyticsDashboard {
  cookingStats: CookingStats;
  cuisineBreakdown: CuisineStats[];
  topIngredients: IngredientMastery[];
  skillsUnlocked: string[]; // ["Knife Skills", "Sautéing", "Baking"]
  nutritionHistory: NutritionalTracking[];
  savings: SavingsTracking;
  achievements: Badge[];
  weeklyGoal: number; // Recipes per week
  weeklyProgress: number;
}

// ==========================================
// FEATURE 3: Technique Mastery Tree
// ==========================================

export interface CookingTechnique {
  id: string;
  name: string;
  category: 'Knife Skills' | 'Heat Methods' | 'Flavor Building' | 'Baking' | 'Advanced';
  description: string;
  icon: string;
  level: number; // 1-5
  requiredPractices: number; // How many times to level up
  currentPractices: number;
  prerequisites: string[]; // Other technique IDs required first
  unlocked: boolean;
  unlockedAt?: number; // Timestamp
  videoTutorialUrl?: string;
  relatedRecipes: string[]; // Recipe IDs that practice this
  relatedKeywords: string[]; // For detection
}

export interface TechniqueCategory {
  name: string;
  techniques: CookingTechnique[];
  totalMastery: number; // Percentage
}

export interface TechniqueTree {
  categories: TechniqueCategory[];
  overallMastery: number; // 0-100%
  unlockedCount: number;
  totalTechniques: number;
}

export interface TechniquePractice {
  techniqueId: string;
  recipeId: string;
  timestamp: number;
  quality: 'attempted' | 'completed' | 'mastered'; // Based on self-assessment
}

// ==========================================
// FEATURE 4: Waste Tracker & Savings Calculator
// ==========================================

export interface FoodWasteEntry {
  id: string;
  ingredient: string;
  category: string; // 'Produce', 'Dairy', 'Meat', etc.
  quantity: number;
  unit: string;
  estimatedCost: number; // In dollars
  reason: 'expired' | 'spoiled' | 'unused' | 'overcooked' | 'other';
  dateAdded: number; // When added to pantry
  dateWasted: number; // When thrown away
  daysInFridge: number;
  preventable: boolean; // Could JiselCook have prevented this?
}

export interface WasteAnalytics {
  totalWastedValue: number;
  wastedThisMonth: number;
  wastedThisYear: number;
  mostWastedCategory: string;
  mostWastedIngredient: string;
  wasteByMonth: { month: string; amount: number }[]; // Last 12 months
  preventableWastePercent: number; // How much could've been saved
}

export interface SavingsProjection {
  currentMonthlyWaste: number;
  projectedMonthlySavings: number; // If using app suggestions
  yearlyImpact: number;
  co2Saved: number; // Environmental impact in kg
  mealsWasted: number; // Equivalent meals
}

export interface FridgeInventoryItem {
  name: string;
  quantity: string;
  category: string;
  addedDate: number;
  expirationDate?: number; // Days until expiry
  estimatedDaysUntilExpiry?: number;
  usageCount: number; // Times used in recipes
  lastUsed?: number;
  averageCost: number; // Estimated price
}

export interface WasteTracker {
  wasteLog: FoodWasteEntry[];
  analytics: WasteAnalytics;
  savings: SavingsProjection;
  inventory: FridgeInventoryItem[];
}

export interface ExpiryAlert {
  ingredient: string;
  daysUntilExpiry: number;
  estimatedLoss: number;
  urgency: 'expired' | 'critical' | 'warning';
}

// ==========================================
// FEATURE 5: AI Cooking Reels Generator
// ==========================================

export interface Reel {
  id: string;
  userId: string;
  recipeId: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  duration: number; // seconds
  views: number;
  likes: number;
  shares: number;
  createdAt: number;
}

export interface ReelOptions {
  duration: number; // seconds (15, 30, 60)
  includeCaption: boolean;
  musicUrl?: string;
}

// ==========================================
// FEATURE 6: Cook-Off Mode (Multiplayer)
// ==========================================

export interface CookOffRoom {
  id: string;
  hostUserId: string;
  recipe: Recipe;
  players: CookOffPlayer[];
  maxPlayers: number;
  status: 'waiting' | 'active' | 'completed';
  startTime?: number;
  endTime?: number;
  winnerId?: string;
}

export interface CookOffPlayer {
  userId: string;
  userName: string;
  currentStep: number;
  completedAt?: number;
  videoStreamId?: string; // for WebRTC
}

// ==========================================
// FEATURE 7: Weekly Challenges with Prizes
// ==========================================

export interface Challenge {
  id: string;
  title: string;
  description: string;
  requiredIngredients: string[];
  startDate: number;
  endDate: number;
  sponsorName?: string;
  sponsorLogo?: string;
  prizeDescription: string;
  status: 'upcoming' | 'active' | 'judging' | 'completed';
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  photoUrl: string;
  description: string;
  votes: number;
  aiScore: number;
  submittedAt: number;
}

// ==========================================
// FEATURE 8: Live Sync Cooking Classes
// ==========================================

export interface LiveClass {
  id: string;
  instructorName: string;
  title: string;
  description: string;
  recipe: Recipe;
  videoUrl: string; // YouTube/Vimeo URL
  thumbnailUrl: string;
  scheduledTime: number;
  duration: number; // minutes
  currentStep: number; // synced real-time via Redis
  isLive: boolean;
  enrolledUsers: string[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

// ==========================================
// FEATURE 9: AR Portion Visualizer
// ==========================================

export interface PortionVisualization {
  foodItem: string;
  servingSize: string; // "1 cup", "4 oz"
  plateType: 'dinner' | 'salad' | 'bowl' | 'custom';
  calibrationObject?: string; // "hand", "fork", "coin"
  visualGuides: {
    type: 'circle' | 'zone' | 'grid';
    dimensions: { x: number; y: number; radius?: number };
    label: string;
  }[];
}

export interface PortionGuide {
  centerX: number; // 0-1, relative
  centerY: number; // 0-1, relative
  radiusPercent: number; // percentage of plate
  explanation: string;
}

// ==========================================
// FEATURE 10: Flavor Lab
// ==========================================

export interface FlavorPairing {
  ingredient1: string;
  ingredient2: string;
  sharedCompounds: string[]; // "vanillin", "limonene"
  weirdnessScore: number; // 1-10, how unexpected
  scientificReason: string;
  recipeIdea: string;
  source: 'FlavorDB' | 'AI-Generated';
}

export interface FlavorLabExperiment {
  id: string;
  name: string;
  baseIngredient: string;
  wildPairings: FlavorPairing[];
  generatedRecipe?: Recipe;
  userRating?: number;
  createdAt: number;
}

// ==========================================
// FEATURE 11: Proactive AI Chef
// ==========================================

export interface ProactiveNotification {
  id: string;
  type: 'expiration' | 'meal-prep-reminder' | 'recipe-suggestion' | 'seasonal';
  title: string;
  body: string;
  actionUrl?: string; // deep link to recipe/pantry
  scheduledFor: number;
  sent: boolean;
  userDismissed: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  expirationReminders: boolean;
  mealPrepReminders: boolean; // Sunday = meal prep day
  preferredReminderTime: string; // "16:00" for 4 PM
  quietHours: { start: string; end: string }; // "22:00" to "08:00"
}

// ==========================================
// FEATURE 12: Family Taste Profiles
// ==========================================

export interface FamilyMember {
  id: string;
  name: string;
  avatar?: string; // emoji or icon
  age?: number; // for kid-friendly suggestions
  dietaryRestrictions: DietaryRestriction[];
  allergies: string[];
  dislikes: string[];
  preferredCuisines: string[];
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot';
  isActive: boolean; // toggle on/off for recipe filtering
}

export interface FamilyProfile {
  familyId: string;
  members: FamilyMember[];
  sharedPantry: string[];
  createdAt: number;
}

// ==========================================
// FEATURE 13: Cultural Story Mode
// ==========================================

export interface CulturalStory {
  recipeName: string;
  originCountry: string;
  originRegion?: string;
  historicalContext: string; // 2-3 sentences
  traditionalOccasions: string[]; // ["Chinese New Year", "Family gatherings"]
  culturalSignificance: string;
  eatingEtiquette: {
    doList: string[];
    dontList: string[];
  };
  regionalVariations: {
    region: string;
    difference: string;
  }[];
  authenticityCaveats?: string; // "This is an Americanized version..."
  funFacts: string[];
  pronunciationGuide?: string; // "Pho: pronounced 'fuh'"
}

// ==========================================
// FEATURE 14: Sustainability Score
// ==========================================

export interface SustainabilityScore {
  overallScore: number; // 0-100 (100 = most sustainable)
  carbonFootprintKg: number; // kg CO2 equivalent
  waterUsageLiters: number;
  details: {
    ingredient: string;
    carbonKg: number;
    waterLiters: number;
    transportImpact: 'low' | 'medium' | 'high';
    seasonality: 'in-season' | 'out-of-season' | 'year-round';
  }[];
  improvements: {
    suggestion: string;
    impact: string; // "Reduces carbon by 40%"
  }[];
  comparisonText: string; // "Equivalent to driving 2.5 miles"
}

export interface SustainabilityPreferences {
  showScores: boolean;
  ecoModeEnabled: boolean; // Only show low-impact recipes
  maxCarbonKg?: number; // User-set threshold
  prioritizeLocal: boolean;
  prioritizeSeasonal: boolean;
}

// ==========================================
// FEATURE 15: One-Tap Smart Shopping
// ==========================================

export interface GroceryDeliveryService {
  id: 'instacart' | 'amazon-fresh' | 'walmart' | 'kroger';
  name: string;
  icon: string;
  deepLinkTemplate: string; // URL with {ITEMS} placeholder
  availableIn: string[]; // ZIP codes or "nationwide"
  affiliateLink?: string;
}

export interface CouponOffer {
  code: string;
  description: string;
  discount: string; // "20% off" or "$5 off"
  expiresAt: number;
  service: 'instacart' | 'amazon-fresh' | 'walmart';
  autoApply: boolean;
}

export interface ShoppingCartExport {
  items: string[];
  service: GroceryDeliveryService;
  estimatedTotal?: number;
  coupons: CouponOffer[];
  affiliateUrl: string;
}

// ==========================================
// EXTENDED USER PROFILE
// ==========================================

export interface ExtendedUserProfile extends UserProfile {
  tasteProfile?: TasteProfile;
  recipeHistory: RecipeInteraction[];
  notificationPreferences?: NotificationPreferences;
  sustainabilityPreferences?: SustainabilityPreferences;
  portionPreferences?: {
    dietGoal: 'maintain' | 'lose' | 'gain';
    servingSizeMultiplier: number; // 0.5 = half portions, 1.0 = standard
  };
}

// ==========================================
// USER AUTHENTICATION (for social features)
// ==========================================

export interface User {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: number;
  stats: {
    recipesCooked: number;
    reelsCreated: number;
    challengesWon: number;
    cookOffsWon: number;
    classesAttended: number;
  };
  following: string[];
  followers: string[];
}