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
    if (!apiKey) {
        console.warn("⚠️ No API key provided for image generation");
        return null;
    }

    try {
        console.log(`🎨 Generating image for: ${recipeTitle}`);

        // Use Imagen 3.0 for high-quality food photography
        const prompt = `Professional food photography of ${recipeTitle}. ${recipeDescription}. High resolution, appetizing, natural lighting, close-up shot, restaurant quality plating, vibrant colors.`;

        const response = await genAI.models.generateContent({
            model: MODEL_IMAGE,
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt }
                    ]
                }
            ]
        });

        console.log("✅ Imagen 3.0 raw response received");

        // Debug: Log response structure
        console.log("Response structure:", {
            hasCandidates: !!response.candidates,
            candidatesLength: response.candidates?.length,
            firstCandidate: response.candidates?.[0],
            hasText: !!response.text
        });

        // Try multiple extraction methods for Imagen response structure

        // Method 1: Check candidates array
        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            const imagePart = candidate.content?.parts?.[0];

            if (imagePart && 'inlineData' in imagePart && imagePart.inlineData) {
                console.log("✅ Image extracted via candidates.content.parts");
                return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            }
        }

        // Method 2: Check if response directly contains image data
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if ('inlineData' in part && part.inlineData?.data) {
                    console.log("✅ Image extracted via parts iteration");
                    return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                }
            }
        }

        // Method 3: Check response.text for base64 data
        if (response.text) {
            const text = response.text;
            // Check if it's already base64 image data
            if (text.startsWith('data:image')) {
                console.log("✅ Image extracted from response.text (data URI)");
                return text;
            }
            // Check if it's raw base64
            if (text.length > 100 && /^[A-Za-z0-9+/=]+$/.test(text.substring(0, 100))) {
                console.log("✅ Image extracted from response.text (base64)");
                return `data:image/png;base64,${text}`;
            }
        }

        console.warn("⚠️ Could not extract image from Imagen response");
        console.warn("Full response:", JSON.stringify(response, null, 2));
        return null;

    } catch (error: any) {
        console.error("❌ Error generating image with Imagen 3.0:", error);
        console.error("Error details:", {
            message: error.message,
            status: error.status,
            statusText: error.statusText
        });

        // Check for specific error types
        if (error.message?.includes('quota') || error.message?.includes('QUOTA_EXCEEDED')) {
            console.error("💡 Imagen 3.0 quota exceeded. Using fallback.");
        }
        if (error.message?.includes('permission') || error.message?.includes('403') || error.message?.includes('not enabled')) {
            console.error("💡 Imagen 3.0 not enabled for this API key. Enable it at: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com");
        }
        if (error.message?.includes('MODEL_NOT_FOUND') || error.message?.includes('model')) {
            console.error("💡 Imagen model not found. Check model name:", MODEL_IMAGE);
        }

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