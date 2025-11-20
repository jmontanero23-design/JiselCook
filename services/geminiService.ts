import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Recipe, Ingredient, MealPlan, NutritionalInfo, ShoppingList } from "../types";

// Initialize the Google GenAI SDK
// We will use specific models for different tasks as per the "Best-of-Breed" strategy
const apiKey = import.meta.env.VITE_API_KEY;
const genAI = new GoogleGenAI({ apiKey: apiKey || '' });

// --- Model Constants ---
// Complex Reasoning & Vision (Fridge Scan, Meal Plans, Nutrition)
const MODEL_COMPLEX = "gemini-3-pro-preview";

// Fast & Efficient (Voice Commands, Simple Text)
const MODEL_FAST = "gemini-2.5-flash";

// Image Generation
const MODEL_IMAGE = "imagen-3.0-generate-001";


export async function identifyIngredientsFromImage(imageFile: File): Promise<Ingredient[]> {
    if (!apiKey) throw new Error("API key not found");

    try {
        // Convert file to base64
        const base64Data = await fileToGenerativePart(imageFile);

        // Use Gemini 3.0 Pro for best vision analysis
        const response = await genAI.models.generateContent({
            model: MODEL_COMPLEX,
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Identify all the food ingredients visible in this image. Return a JSON array of objects with 'name', 'quantity' (estimated), 'unit' (estimated), and 'category'." },
                        base64Data
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            quantity: { type: Type.STRING },
                            unit: { type: Type.STRING },
                            category: { type: Type.STRING }
                        },
                        required: ["name", "category"]
                    }
                }
            }
        });

        const jsonString = response.text;
        if (!jsonString) return [];
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error identifying ingredients:", error);
        throw error;
    }
}

export async function analyzeFridgeAndSuggestRecipes(ingredients: Ingredient[], userProfile?: any): Promise<Recipe[]> {
    if (!apiKey) throw new Error("API key not found");

    try {
        const ingredientList = ingredients.map(i => `${i.quantity || ''} ${i.unit || ''} ${i.name}`).join(", ");

        // Use Gemini 3.0 Pro for complex recipe generation and dietary adherence
        const response = await genAI.models.generateContent({
            model: MODEL_COMPLEX,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Suggest 3 recipes based on these ingredients: ${ingredientList}. 
                            User Profile: ${JSON.stringify(userProfile || {})}.
                            Return a JSON array of Recipe objects.`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            ingredients: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        amount: { type: Type.STRING },
                                        unit: { type: Type.STRING }
                                    }
                                }
                            },
                            steps: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        instruction: { type: Type.STRING },
                                        duration: { type: Type.NUMBER } // minutes
                                    }
                                }
                            },
                            prepTime: { type: Type.NUMBER },
                            cookTime: { type: Type.NUMBER },
                            difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                            calories: { type: Type.NUMBER },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["title", "ingredients", "steps"]
                    }
                }
            }
        });

        const jsonString = response.text;
        if (!jsonString) return [];
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error suggesting recipes:", error);
        return [];
    }
}

export async function generateRecipeImage(recipeTitle: string, recipeDescription: string): Promise<string | null> {
    if (!apiKey) return null;

    try {
        // Use Imagen 4.0 for high-quality food photography
        const response = await genAI.models.generateContent({
            model: MODEL_IMAGE,
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `Professional food photography of ${recipeTitle}. ${recipeDescription}. High resolution, appetizing, studio lighting.` }
                    ]
                }
            ]
        });

        // Log response to debug structure for Imagen 4.0
        console.log("Imagen 4.0 Response:", response);

        // Attempt to extract image - structure may vary for Imagen models
        // Typically it might be in inlineData or a specific image field
        // For now, we'll inspect the response structure in the console

        // Check for standard generation output
        const imagePart = response.candidates?.[0]?.content?.parts?.[0];
        if (imagePart && 'inlineData' in imagePart && imagePart.inlineData) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }

        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
}

export async function generateSurpriseRecipe(userProfile?: any): Promise<Recipe | null> {
    if (!apiKey) return null;

    try {
        // Use Gemini 3.0 Pro for creativity
        const response = await genAI.models.generateContent({
            model: MODEL_COMPLEX,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Generate a unique, creative "Surprise Me" recipe. 
                            User Profile: ${JSON.stringify(userProfile || {})}.
                            Make it interesting but cookable.`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        ingredients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    amount: { type: Type.STRING },
                                    unit: { type: Type.STRING }
                                }
                            }
                        },
                        steps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    instruction: { type: Type.STRING },
                                    duration: { type: Type.NUMBER }
                                }
                            }
                        },
                        prepTime: { type: Type.NUMBER },
                        cookTime: { type: Type.NUMBER },
                        difficulty: { type: Type.STRING },
                        calories: { type: Type.NUMBER },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "ingredients", "steps"]
                }
            }
        });

        const jsonString = response.text;
        if (!jsonString) return null;
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error generating surprise recipe:", error);
        return null;
    }
}

export async function remixRecipe(recipe: Recipe, instruction: string): Promise<Recipe | null> {
    if (!apiKey) return null;

    try {
        // Use Gemini 3.0 Pro for complex modification
        const response = await genAI.models.generateContent({
            model: MODEL_COMPLEX,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Remix this recipe: ${JSON.stringify(recipe)}.
                            Instruction: "${instruction}" (e.g., make it spicy, make it vegan).
                            Return the modified recipe in JSON.`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        ingredients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    amount: { type: Type.STRING },
                                    unit: { type: Type.STRING }
                                }
                            }
                        },
                        steps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    instruction: { type: Type.STRING },
                                    duration: { type: Type.NUMBER }
                                }
                            }
                        },
                        prepTime: { type: Type.NUMBER },
                        cookTime: { type: Type.NUMBER },
                        difficulty: { type: Type.STRING },
                        calories: { type: Type.NUMBER },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "ingredients", "steps"]
                }
            }
        });

        const jsonString = response.text;
        if (!jsonString) return null;
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error remixing recipe:", error);
        return null;
    }
}

export async function generateMealPlan(userProfile: any, pantryIngredients: Ingredient[]): Promise<MealPlan | null> {
    if (!apiKey) return null;

    try {
        // Use Gemini 3.0 Pro for planning
        const response = await genAI.models.generateContent({
            model: MODEL_COMPLEX,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Generate a 3-day meal plan.
                            User Profile: ${JSON.stringify(userProfile)}.
                            Available Pantry: ${JSON.stringify(pantryIngredients)}.
                            Return a JSON object with 'days' array.`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                // Schema definition omitted for brevity, relying on prompt for now or add full schema if needed
            }
        });

        const jsonString = response.text;
        if (!jsonString) return null;
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error generating meal plan:", error);
        return null;
    }
}

export async function getNutritionalInsights(recipe: Recipe): Promise<NutritionalInfo | null> {
    if (!apiKey) return null;

    try {
        // Use Gemini 3.0 Pro for analysis
        const response = await genAI.models.generateContent({
            model: MODEL_COMPLEX,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Analyze the nutrition for this recipe: ${JSON.stringify(recipe)}.
                            Return JSON with calories, protein, carbs, fat, and key vitamins.`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonString = response.text;
        if (!jsonString) return null;
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error getting nutritional insights:", error);
        return null;
    }
}

export async function organizeShoppingList(items: string[]): Promise<ShoppingList | null> {
    if (!apiKey) return null;

    try {
        // Use Gemini 3.0 Pro for categorization
        const response = await genAI.models.generateContent({
            model: MODEL_COMPLEX,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Organize these items into a shopping list with categories (Produce, Dairy, etc.): ${items.join(", ")}.
                            Return JSON.`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonString = response.text;
        if (!jsonString) return null;
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error organizing shopping list:", error);
        return null;
    }
}

export async function processShoppingVoiceCommand(base64Audio: string, mimeType: string): Promise<{ action: 'add' | 'remove', item: string }[]> {
    if (!apiKey) return [];

    try {
        const response = await genAI.models.generateContent({
            model: MODEL_FAST,
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Extract shopping list commands from this audio. Return a JSON array of objects with 'action' ('add' or 'remove') and 'item' (the ingredient name)." },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Audio
                            }
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonString = response.text;
        if (!jsonString) return [];
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error processing voice command:", error);
        return [];
    }
}


// --- Helpers ---

async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}