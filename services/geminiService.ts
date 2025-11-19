import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Recipe, DietaryRestriction, UserProfile, DayPlan, SearchResult, ShoppingCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recipeSchema: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
            prepTimeMinutes: { type: Type.INTEGER },
            calories: { type: Type.INTEGER },
            rating: { type: Type.NUMBER, description: "A mock average rating between 3.5 and 5.0" },
            reviewCount: { type: Type.INTEGER, description: "A mock review count" },
            ingredients: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        amount: { type: Type.STRING },
                        isMissing: { type: Type.BOOLEAN, description: "For surprise recipes, assume the user needs to buy main proteins/produce but has staples." }
                    },
                    required: ['name', 'isMissing']
                }
            },
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        stepNumber: { type: Type.INTEGER },
                        instruction: { type: Type.STRING }
                    },
                    required: ['stepNumber', 'instruction']
                }
            },
            tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            drinkPairing: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Wine', 'Beer', 'Cocktail', 'Non-Alcoholic'] }
                },
                required: ['name', 'description', 'type']
            },
            flavorProfile: {
                type: Type.OBJECT,
                description: "Score from 0 to 10 for each flavor aspect",
                properties: {
                    sweet: { type: Type.INTEGER },
                    salty: { type: Type.INTEGER },
                    sour: { type: Type.INTEGER },
                    bitter: { type: Type.INTEGER },
                    spicy: { type: Type.INTEGER },
                    umami: { type: Type.INTEGER }
                },
                required: ['sweet', 'salty', 'sour', 'bitter', 'spicy', 'umami']
            }
        },
        required: ['title', 'difficulty', 'prepTimeMinutes', 'calories', 'ingredients', 'steps', 'rating', 'reviewCount', 'drinkPairing', 'flavorProfile']
    }
};

export async function analyzeFridgeAndSuggestRecipes(
    base64Image: string,
    mimeType: string,
    filters: DietaryRestriction[],
    pantryItems: string[],
    userProfile: UserProfile
): Promise<Recipe[]> {
    try {
        const filtersText = filters.length > 0
            ? `Strictly adhere to these dietary restrictions: ${filters.join(', ')}.`
            : 'No specific dietary restrictions.';

        const pantryText = pantryItems.length > 0
            ? `The user has these items in their pantry: ${pantryItems.join(', ')}. You can use these to complete recipes.`
            : 'The user has an empty pantry.';

        const profileText = `
      User Profile:
      - Skill Level: ${userProfile.skillLevel} (Adjust recipe complexity accordingly).
      - Preferred Cuisines: ${userProfile.preferredCuisines.length > 0 ? userProfile.preferredCuisines.join(', ') : 'No preference'}.
      - Disliked Ingredients/Allergies (DO NOT USE THESE): ${userProfile.dislikes.length > 0 ? userProfile.dislikes.join(', ') : 'None'}.
    `;

        const prompt = `
      Analyze this image of a refrigerator or food items. 
      1. Identify the visible ingredients.
      2. Suggest 4-6 distinct, delicious recipes that can be made primarily with the visible ingredients AND the pantry items provided.
      3. ${filtersText}
      4. ${pantryText}
      5. ${profileText}
      6. For each recipe, list ALL ingredients required. Mark 'isMissing' as true ONLY if the ingredient is NOT visible in the image AND is NOT in the pantry list.
      7. Provide step-by-step cooking instructions.
      8. Generate a realistic mock rating (3.5-5.0) and review count.
      9. Suggest a specific drink pairing.
      10. Analyze the flavor profile (0-10 scale for sweet, salty, etc).
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-3.0-pro',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType
                        }
                    },
                    {
                        text: prompt
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
                systemInstruction: "You are a world-class chef and culinary assistant. Generate precise, structured JSON data."
            }
        });

        const jsonText = response.text;
        if (!jsonText) return [];

        const recipesRaw = JSON.parse(jsonText) as Omit<Recipe, 'id'>[];

        // Add client-side IDs
        return recipesRaw.map((r, index) => ({
            ...r,
            id: `recipe-${Date.now()}-${index}`
        }));

    } catch (error) {
        console.error("Error calling Gemini:", error);
        throw error;
    }
}

export async function generateSurpriseRecipe(userProfile: UserProfile, filters: DietaryRestriction[]): Promise<Recipe[]> {
    try {
        const filtersText = filters.length > 0
            ? `Strictly adhere to these dietary restrictions: ${filters.join(', ')}.`
            : 'No specific dietary restrictions.';

        const profileText = `
          User Profile:
          - Skill Level: ${userProfile.skillLevel}.
          - Preferred Cuisines: ${userProfile.preferredCuisines.length > 0 ? userProfile.preferredCuisines.join(', ') : 'Any'}.
          - Disliked Ingredients/Allergies: ${userProfile.dislikes.length > 0 ? userProfile.dislikes.join(', ') : 'None'}.
        `;

        const prompt = `
            Generate 1 distinct, creative, and highly-rated "Chef's Special" recipe. 
            This should be a complete surprise but tailored to the user's taste.
            ${filtersText}
            ${profileText}
            
            Provide the full recipe details including drink pairing and flavor profile.
            Assume the user has basic staples (Salt, Pepper, Oil) but mark main ingredients as 'isMissing' = true so they know what to buy.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3.0-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
                systemInstruction: "You are a creative chef generating a daily special."
            }
        });

        const jsonText = response.text;
        if (!jsonText) return [];

        const recipesRaw = JSON.parse(jsonText) as Omit<Recipe, 'id'>[];
        return recipesRaw.map((r, index) => ({
            ...r,
            id: `surprise-${Date.now()}-${index}`
        }));
    } catch (error) {
        console.error("Error generating surprise recipe:", error);
        throw error;
    }
}

export async function generateRecipeImage(recipeTitle: string, recipeDescription: string): Promise<string | null> {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A professional, high-quality food photography shot of ${recipeTitle}. ${recipeDescription}. The lighting should be natural and appetizing, plated beautifully on a table.`,
            config: {
                numberOfImages: 1,
                aspectRatio: '4:3',
                outputMimeType: 'image/jpeg'
            }
        });

        if (!response.generatedImages?.[0]?.image?.imageBytes) {
            return null;
        }

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
}

export async function remixRecipe(originalRecipe: Recipe, modification: string): Promise<Recipe> {
    const prompt = `
        Act as a culinary expert. 
        Here is an existing recipe: ${JSON.stringify(originalRecipe)}.
        
        User Request: "${modification}".
        
        Please modify the recipe to strictly adhere to the user's request while maintaining the core identity of the dish if possible.
        Update the title, description, ingredients, steps, nutrition info, and flavor profile to reflect the changes.
        Keep the same JSON structure.
        Return ONLY the single modified recipe object.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3.0-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: recipeSchema,
        }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned");

    const recipes = JSON.parse(jsonText) as Omit<Recipe, 'id'>[];
    if (recipes.length === 0) throw new Error("Failed to modify recipe");

    return {
        ...recipes[0],
        id: originalRecipe.id + '-remix-' + Date.now()
    };
}

export async function generateMealPlan(ingredients: string[], userProfile: UserProfile): Promise<DayPlan[]> {
    const prompt = `
        Create a 3-day meal plan (Breakfast, Lunch, Dinner for each day) using these available ingredients: ${ingredients.join(', ')}.
        
        Profile constraints:
        - Diet: ${userProfile.dislikes.length > 0 ? `Avoid ${userProfile.dislikes.join(', ')}` : 'None'}.
        - Cuisine Preference: ${userProfile.preferredCuisines.join(', ')}.
        
        Goal: Minimize food waste and use the available ingredients creatively.
    `;

    const mealPlanSchema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                day: { type: Type.INTEGER },
                meals: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['Breakfast', 'Lunch', 'Dinner'] },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            ingredientsUsed: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['type', 'title', 'description', 'ingredientsUsed']
                    }
                }
            },
            required: ['day', 'meals']
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-3.0-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: mealPlanSchema
        }
    });

    return JSON.parse(response.text || '[]');
}

export async function findCookingResources(recipeTitle: string): Promise<SearchResult[]> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find top-rated video tutorials, blog posts, or cooking guides for the recipe: "${recipeTitle}". Focus on reputable food sources.`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const results: SearchResult[] = [];

        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web?.uri && chunk.web?.title) {
                    results.push({
                        title: chunk.web.title,
                        uri: chunk.web.uri
                    });
                }
            });
        }

        return Array.from(new Set(results.map(r => r.uri)))
            .map(uri => results.find(r => r.uri === uri)!)
            .slice(0, 5);

    } catch (error) {
        console.error("Error searching resources:", error);
        return [];
    }
}

export async function getNutritionalInsights(recipe: Recipe): Promise<string> {
    const prompt = `
        Provide a comprehensive nutritional analysis for the following recipe:
        Title: ${recipe.title}
        Ingredients: ${recipe.ingredients.map(i => `${i.amount || ''} ${i.name}`).join(', ')}
        
        Include:
        1. Macro breakdown (approximate Protein, Carbs, Fats).
        2. Key vitamins and minerals.
        3. Health benefits of key ingredients.
        4. Potential allergen warnings.
        
        Format the output as a clean Markdown list.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3.0-pro',
        contents: prompt,
    });

    return response.text || "Analysis unavailable.";
}

export async function organizeShoppingList(items: string[]): Promise<ShoppingCategory[]> {
    const prompt = `
        Organize this shopping list into logical grocery store aisles (e.g., Produce, Dairy, Meat, Pantry, Spices, Frozen).
        Items: ${items.join(', ')}.
        Return a JSON array of objects with 'category' and 'items' fields.
    `;

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['category', 'items']
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.0-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        return JSON.parse(response.text || '[]');
    } catch (error) {
        console.error("Error organizing shopping list:", error);
        // Fallback to single 'Uncategorized' list if AI fails
        return [{ category: 'Shopping List', items }];
    }
}

export interface ShoppingListCommand {
    action: 'add' | 'remove';
    item: string;
}

export async function processShoppingVoiceCommand(base64Audio: string, mimeType: string): Promise<ShoppingListCommand[]> {
    const prompt = `
        Listen to the user's voice command for a shopping list.
        Identify items they want to ADD and items they want to REMOVE.
        Return a JSON object with a list of commands.
        Example: "Add apples and bananas, remove milk" -> [{action: 'add', item: 'apples'}, {action: 'add', item: 'bananas'}, {action: 'remove', item: 'milk'}]
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            commands: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        action: { type: Type.STRING, enum: ['add', 'remove'] },
                        item: { type: Type.STRING }
                    },
                    required: ['action', 'item']
                }
            }
        },
        required: ['commands']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Audio,
                            mimeType: mimeType
                        }
                    },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const result = JSON.parse(response.text || '{}');
        return result.commands || [];
    } catch (error) {
        console.error("Error processing voice command:", error);
        return [];
    }
}

export async function identifyIngredientsFromImage(base64Image: string): Promise<string[]> {
    try {
        const prompt = `
            Identify the visible food ingredients in this image.
            Return a simple JSON array of strings, e.g., ["Apple", "Milk", "Eggs"].
            Only list distinct, recognizable food items.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        return JSON.parse(response.text || '[]');
    } catch (e) {
        console.error("Error identifying ingredients:", e);
        return [];
    }
}