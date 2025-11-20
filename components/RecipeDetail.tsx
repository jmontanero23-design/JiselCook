import React, { useState, useEffect } from 'react';
import { Recipe, SearchResult } from '../types';
import { Clock, Flame, ChefHat, ArrowLeft, PlayCircle, Plus, Check, Star, Wand2, Image as ImageIcon, Loader2, Wine, BookOpen, ExternalLink, Info, Activity, Heart, Zap, ShoppingBag, Share2 } from 'lucide-react';
import { remixRecipe, generateRecipeImage, getNutritionalInsights } from '../services/geminiService';
import { NutritionalInfo } from '../types';

interface RecipeDetailProps {
    recipe: Recipe;
    onBack: () => void;
    onStartCooking: () => void;
    onAddToShoppingList: (ingredient: string) => void;
    shoppingList: string[];
    isSaved: boolean;
    onToggleSave: (recipe: Recipe) => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
    recipe: initialRecipe,
    onBack,
    onStartCooking,
    onAddToShoppingList,
    shoppingList,
    isSaved,
    onToggleSave
}) => {
    const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
    const [isRemixing, setIsRemixing] = useState(false);
    const [remixPrompt, setRemixPrompt] = useState('');
    const [showRemixInput, setShowRemixInput] = useState(false);

    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const [resources, setResources] = useState<SearchResult[]>([]);
    const [isLoadingResources, setIsLoadingResources] = useState(false);
    const [showResources, setShowResources] = useState(false);

    const [nutritionInfo, setNutritionInfo] = useState<NutritionalInfo | null>(null);
    const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
    const [showNutrition, setShowNutrition] = useState(false);

    const missingIngredients = recipe.ingredients.filter(i => i.isMissing);
    const allMissingAdded = missingIngredients.every(i => shoppingList.includes(i.name));

    useEffect(() => {
        setRecipe(initialRecipe);
    }, [initialRecipe]);

    const handleRemix = async (overridePrompt?: string) => {
        const promptToUse = overridePrompt || remixPrompt;
        if (!promptToUse.trim()) return;

        setIsRemixing(true);
        try {
            const newRecipe = await remixRecipe(recipe, promptToUse);
            if (newRecipe) {
                setRecipe(newRecipe);
            }
            setShowRemixInput(false);
            setRemixPrompt('');
        } catch (e) {
            alert("Could not remix recipe. Please try again.");
        } finally {
            setIsRemixing(false);
        }
    };

    const handleGenerateImage = async () => {
        setIsGeneratingImage(true);
        try {
            const imageUrl = await generateRecipeImage(recipe.title, recipe.description);
            if (imageUrl) {
                setRecipe(prev => ({ ...prev, imageUrl }));
            } else {
                alert("Could not generate image.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingImage(false);
        }
    };



    const handleGetNutrition = async () => {
        if (nutritionInfo) {
            setShowNutrition(!showNutrition);
            return;
        }
        setIsLoadingNutrition(true);
        try {
            const info = await getNutritionalInsights(recipe);
            setNutritionInfo(info);
            setShowNutrition(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingNutrition(false);
        }
    };

    const handleAddAllMissing = () => {
        missingIngredients.forEach(ing => {
            if (!shoppingList.includes(ing.name)) {
                onAddToShoppingList(ing.name);
            }
        });
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: recipe.title,
                    text: `Check out this recipe for ${recipe.title}! ${recipe.description}`,
                    url: window.location.href
                });
            } catch (err) {
                console.log("Error sharing", err);
            }
        } else {
            alert("Sharing is not supported on this device.");
        }
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back</span>
                </button>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleShare}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                        title="Share Recipe"
                    >
                        <Share2 size={20} />
                    </button>
                    <button
                        onClick={() => onToggleSave(recipe)}
                        className={`p-2 rounded-full transition-colors ${isSaved ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:bg-slate-100 hover:text-rose-400'}`}
                        title={isSaved ? "Remove from Cookbook" : "Save to Cookbook"}
                    >
                        <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                    <button
                        onClick={() => setShowRemixInput(!showRemixInput)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${showRemixInput ? 'bg-indigo-100 text-indigo-700' : 'text-indigo-600 hover:bg-indigo-50'
                            }`}
                    >
                        <Wand2 size={18} />
                        <span className="hidden sm:inline">Remix</span>
                    </button>
                    <button
                        onClick={onStartCooking}
                        className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <PlayCircle size={20} />
                        <span>Start Cooking</span>
                    </button>
                </div>
            </div>

            {showRemixInput && (
                <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 animate-in slide-in-from-top-2">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <button
                                onClick={() => handleRemix("Make this recipe extremely healthy, low calorie, and nutrient-dense.")}
                                disabled={isRemixing}
                                className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-emerald-600 font-bold"
                            >
                                <Heart size={18} />
                                Make it Healthy
                            </button>
                            <button
                                onClick={() => handleRemix("Make this recipe extremely indulgent, rich, cheesy, and decadent. Cheat day style!")}
                                disabled={isRemixing}
                                className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-rose-500 font-bold"
                            >
                                <Zap size={18} />
                                Cheat Day Mode
                            </button>
                            <button
                                onClick={() => handleRemix("Make this recipe vegan.")}
                                disabled={isRemixing}
                                className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-indigo-600 font-bold"
                            >
                                <Activity size={18} />
                                Make it Vegan
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={remixPrompt}
                                onChange={(e) => setRemixPrompt(e.target.value)}
                                placeholder="Or type a custom request (e.g., 'Add more spice', 'Make it for 2 people')..."
                                className="flex-1 border border-indigo-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={isRemixing}
                            />
                            <button
                                onClick={() => handleRemix()}
                                disabled={isRemixing || !remixPrompt.trim()}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isRemixing ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                                <span>Apply Magic</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto w-full p-8">

                {/* Recipe Image Hero */}
                <div className="mb-8 rounded-2xl overflow-hidden bg-slate-100 aspect-video relative group flex items-center justify-center border border-slate-200 shadow-sm">
                    {recipe.imageUrl ? (
                        <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center p-8">
                            <ChefHat size={64} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 mb-4">No image available</p>
                            <button
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage}
                                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-slate-50 flex items-center gap-2 mx-auto transition-all"
                            >
                                {isGeneratingImage ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                                <span>Visualize Dish with AI</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            {recipe.tags.map(tag => (
                                <span key={tag} className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full uppercase tracking-wide">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                            <Star size={16} className="text-amber-500" fill="currentColor" />
                            <span className="font-bold text-slate-800">{recipe.rating?.toFixed(1) || '4.5'}</span>
                            <span className="text-xs text-slate-500 ml-1">({recipe.reviewCount || 0} reviews)</span>
                        </div>
                    </div>

                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{recipe.title}</h1>
                    <p className="text-lg text-slate-600 mb-6 leading-relaxed">{recipe.description}</p>

                    <div className="flex flex-wrap gap-8 text-slate-700 font-medium border-y border-slate-100 py-6">
                        <div className="flex items-center space-x-2">
                            <Clock className="text-emerald-500" size={24} />
                            <div>
                                <span className="block text-xs text-slate-400 uppercase">Time</span>
                                <span>{recipe.prepTimeMinutes} mins</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Flame className="text-orange-500" size={24} />
                            <div>
                                <span className="block text-xs text-slate-400 uppercase">Calories</span>
                                <span>{recipe.calories}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <ChefHat className="text-blue-500" size={24} />
                            <div>
                                <span className="block text-xs text-slate-400 uppercase">Difficulty</span>
                                <span>{recipe.difficulty}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Flavor Profile Analysis */}
                {recipe.flavorProfile && (
                    <div className="mb-12 bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-slate-500" />
                            AI Flavor Analysis
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            {(Object.entries(recipe.flavorProfile) as [string, number][]).map(([flavor, score]) => {
                                let colorClass = 'bg-slate-400';
                                if (flavor === 'sweet') colorClass = 'bg-pink-400';
                                if (flavor === 'salty') colorClass = 'bg-blue-400';
                                if (flavor === 'sour') colorClass = 'bg-yellow-400';
                                if (flavor === 'bitter') colorClass = 'bg-green-700';
                                if (flavor === 'spicy') colorClass = 'bg-red-500';
                                if (flavor === 'umami') colorClass = 'bg-purple-500';

                                return (
                                    <div key={flavor} className="flex flex-col items-center">
                                        <div className="w-full h-24 bg-slate-200 rounded-lg relative overflow-hidden flex items-end mb-2">
                                            <div
                                                className={`w-full transition-all duration-1000 ${colorClass}`}
                                                style={{ height: `${score * 10}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{flavor}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* AI Features Toolbar */}
                <div className="flex flex-wrap gap-4 mb-12">

                    <button
                        onClick={handleGetNutrition}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${showNutrition ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {isLoadingNutrition ? <Loader2 className="animate-spin" size={16} /> : <Info size={16} />}
                        <span>Nutritional Deep Dive</span>
                    </button>
                </div>

                {/* Grounding Results */}
                {showResources && resources.length > 0 && (
                    <div className="mb-12 bg-sky-50 rounded-xl p-6 border border-sky-100 animate-in slide-in-from-top-2">
                        <h3 className="text-lg font-bold text-sky-900 mb-4 flex items-center gap-2">
                            <ExternalLink size={20} />
                            Curated Resources from Web
                        </h3>
                        <ul className="space-y-3">
                            {resources.map((res, idx) => (
                                <li key={idx} className="bg-white p-3 rounded-lg border border-sky-100 hover:shadow-sm transition-shadow">
                                    <a href={res.uri} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between group">
                                        <span className="text-sky-800 font-medium group-hover:underline">{res.title}</span>
                                        <ExternalLink size={14} className="text-sky-400 mt-1" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Nutrition Analysis */}
                {showNutrition && nutritionInfo && (
                    <div className="mb-12 bg-emerald-50 rounded-xl p-6 border border-emerald-100 animate-in slide-in-from-top-2">
                        <h3 className="text-lg font-bold text-emerald-900 mb-4">Detailed Nutritional Analysis</h3>
                        <div className="prose prose-emerald prose-sm max-w-none">
                            <div className="whitespace-pre-wrap">
                                <p><strong>Calories:</strong> {nutritionInfo.calories}</p>
                                <p><strong>Protein:</strong> {nutritionInfo.protein}</p>
                                <p><strong>Carbs:</strong> {nutritionInfo.carbs}</p>
                                <p><strong>Fat:</strong> {nutritionInfo.fat}</p>
                                <p><strong>Vitamins:</strong> {nutritionInfo.vitamins.join(', ')}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                                    <span>Ingredients</span>
                                    <span className="ml-2 text-sm font-normal text-slate-400">({recipe.ingredients.length} items)</span>
                                </h3>
                                {missingIngredients.length > 0 && (
                                    <button
                                        onClick={handleAddAllMissing}
                                        disabled={allMissingAdded}
                                        className={`text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${allMissingAdded
                                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                            : 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                                            }`}
                                    >
                                        {allMissingAdded ? <Check size={14} /> : <ShoppingBag size={14} />}
                                        {allMissingAdded ? 'Added to List' : `Add ${missingIngredients.length} Missing`}
                                    </button>
                                )}
                            </div>
                            <ul className="space-y-3">
                                {recipe.ingredients.map((ing, idx) => {
                                    const isInList = shoppingList.includes(ing.name);
                                    return (
                                        <li key={idx} className="flex items-start justify-between group p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start space-x-3">
                                                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${ing.isMissing ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                <div>
                                                    <span className={`font-medium ${ing.isMissing ? 'text-amber-900' : 'text-slate-700'}`}>{ing.name}</span>
                                                    {ing.amount && <span className="text-slate-400 text-sm ml-2">- {ing.amount}</span>}
                                                    {ing.isMissing ? (
                                                        <span className="block text-xs text-amber-600 font-medium mt-0.5">Needs to be bought</span>
                                                    ) : (
                                                        <span className="block text-xs text-emerald-600 font-medium mt-0.5">In Fridge or Pantry</span>
                                                    )}
                                                </div>
                                            </div>

                                            {ing.isMissing && (
                                                <button
                                                    onClick={() => !isInList && onAddToShoppingList(ing.name)}
                                                    disabled={isInList}
                                                    className={`p-1.5 rounded-md transition-all ${isInList
                                                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                                        : 'bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 shadow-sm'
                                                        }`}
                                                    title="Add to shopping list"
                                                >
                                                    {isInList ? <Check size={16} /> : <Plus size={16} />}
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Drink Pairing Card */}
                        {recipe.drinkPairing && (
                            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                                    <Wine size={20} />
                                    Sommelier Recommendation
                                </h3>
                                <div className="flex items-start gap-4">
                                    <div className="bg-white p-3 rounded-xl shadow-sm text-purple-500">
                                        {recipe.drinkPairing.type === 'Wine' ? <Wine size={24} /> : <div className="text-xl font-bold">?</div>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-purple-800 text-lg">{recipe.drinkPairing.name}</p>
                                        <p className="text-purple-600 text-sm mt-1 leading-relaxed">{recipe.drinkPairing.description}</p>
                                        <span className="inline-block mt-2 text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                            {recipe.drinkPairing.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Instructions Preview</h3>
                        <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            {recipe.steps.map((step, idx) => (
                                <div key={idx} className="relative pl-10">
                                    <div className="absolute left-0 top-0 w-7 h-7 bg-white border-2 border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold z-10">
                                        {step.stepNumber}
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">{step.instruction}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 p-4 bg-emerald-50 rounded-xl text-center">
                            <p className="text-emerald-800 font-medium mb-2">Ready to cook?</p>
                            <button
                                onClick={onStartCooking}
                                className="text-sm font-bold text-emerald-600 hover:text-emerald-700 underline"
                            >
                                Launch Step-by-Step Mode
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};