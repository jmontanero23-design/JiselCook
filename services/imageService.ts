// Image generation service with smart food image selection
// Uses Unsplash for high-quality, relevant food photos

import { generateRecipeImage as generateAIImageInternal } from './geminiService';

export async function generateRecipeImage(recipeTitle: string, recipeDescription: string): Promise<string | null> {
    try {
        // Try AI generation first
        const aiImage = await generateAIImageInternal(recipeTitle, recipeDescription);
        if (aiImage) return aiImage;

        // Fallback to a reliable placeholder service
        // Unsplash Source is deprecated/unreliable
        const encodedTitle = encodeURIComponent(recipeTitle);
        return `https://placehold.co/800x600/e2e8f0/1e293b?text=${encodedTitle}`;

    } catch (error) {
        console.error("Error generating recipe image:", error);
        return `https://placehold.co/800x600/e2e8f0/1e293b?text=Delicious+Food`;
    }
}

// Helper function to extract relevant food terms for better image matching
function extractFoodTerms(title: string, description: string): string[] {
    const combinedText = `${title} ${description}`.toLowerCase();

    // Comprehensive food categories and ingredients for better matching
    const foodKeywords = [
        // Proteins
        'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'tofu', 'egg', 'bacon',
        // Carbs
        'pasta', 'rice', 'noodles', 'bread', 'potato', 'quinoa', 'couscous',
        // Dishes
        'pizza', 'burger', 'sandwich', 'salad', 'soup', 'stew', 'curry', 'stir-fry', 'casserole',
        // Cooking methods
        'grilled', 'baked', 'roasted', 'fried', 'steamed', 'sauteed', 'braised',
        // Desserts
        'dessert', 'cake', 'cookies', 'chocolate', 'ice cream', 'pie', 'tart', 'pudding',
        // Cuisines
        'mexican', 'italian', 'asian', 'chinese', 'japanese', 'thai', 'indian', 'mediterranean',
        // Meal types
        'breakfast', 'lunch', 'dinner', 'brunch', 'appetizer', 'snack',
        // Vegetables
        'vegetable', 'salad', 'veggie', 'vegan', 'vegetarian'
    ];

    // Find matching keywords
    const matches = foodKeywords.filter(keyword => combinedText.includes(keyword));

    // If no specific matches, use words from the title
    if (matches.length === 0) {
        const titleWords = title.split(' ')
            .filter(word => word.length > 3 && !['with', 'and', 'the', 'for'].includes(word.toLowerCase()))
            .slice(0, 3);
        return titleWords.length > 0 ? titleWords : ['gourmet', 'homemade', 'delicious'];
    }

    // Return top 3 most relevant terms for best image matching
    return matches.slice(0, 3);
}

// Future: Integrate with actual AI image generation when available
export async function generateAIImage(prompt: string): Promise<string | null> {
    // For now, using the improved Unsplash approach
    // When Google Imagen or other APIs become available, we can implement here
    return generateRecipeImage(prompt, '');
}