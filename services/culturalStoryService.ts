import { GoogleGenAI } from '@google/genai';
import { CulturalStory, Recipe } from '../types';

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error('VITE_API_KEY is required for Gemini AI');
}

const genAI = new GoogleGenAI({ apiKey: apiKey || '' });

// Use fast model for cultural context (not complex reasoning)
const MODEL_FAST = 'gemini-2.5-flash';

/**
 * Generate cultural story and context for a recipe
 * This adds educational value and cultural respect to international recipes
 */
export async function generateCulturalStory(recipe: Recipe): Promise<CulturalStory | null> {
  try {
    // Detect if recipe is international by checking tags, title, or ingredients
    const cuisineTag = recipe.tags.find(tag =>
      ['italian', 'thai', 'japanese', 'mexican', 'indian', 'chinese', 'french', 'korean', 'vietnamese', 'greek', 'spanish', 'moroccan', 'lebanese', 'ethiopian'].includes(tag.toLowerCase())
    );

    // Try to extract cuisine from title
    const cuisineFromTitle = extractCuisineFromTitle(recipe.title);
    const detectedCuisine = cuisineTag || cuisineFromTitle;

    if (!detectedCuisine) {
      // If no clear international cuisine detected, return null
      return null;
    }

    const response = await genAI.models.generateContent({
      model: MODEL_FAST,
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate a respectful, educational cultural story for this recipe:

Recipe Name: "${recipe.title}"
Detected Cuisine: ${detectedCuisine}
Ingredients: ${recipe.ingredients.map(i => i.name).join(', ')}
Tags: ${recipe.tags.join(', ')}

Create a comprehensive cultural context with:

1. **Historical Context** (2-3 sentences): Be specific with dates/events when possible. Avoid vague statements.

2. **Traditional Occasions**: When is this dish typically eaten? (holidays, celebrations, daily meals)

3. **Cultural Significance**: What does this dish represent in its culture? Why is it important?

4. **Eating Etiquette**:
   - DO: Proper ways to eat/serve (3-4 specific points)
   - DON'T: Cultural faux pas to avoid (2-3 specific points)

5. **Regional Variations**: At least 2 regional differences with specific details

6. **Authenticity Note**: If this is an adapted/Westernized version, acknowledge it respectfully

7. **Fun Facts**: 2-3 interesting tidbits about this dish or its ingredients

8. **Pronunciation Guide**: If the dish name is non-English, provide phonetic pronunciation

CRITICAL RULES:
- Be culturally respectful and accurate
- Avoid stereotypes or oversimplifications
- Cite specific details and facts
- If unsure about something, acknowledge it
- Use an educational, appreciative tone

Return JSON matching this structure:
{
  "recipeName": string,
  "originCountry": string,
  "originRegion": string (optional, be specific if known),
  "historicalContext": string (2-3 sentences with specific details),
  "traditionalOccasions": string[] (array of occasions),
  "culturalSignificance": string (paragraph explaining importance),
  "eatingEtiquette": {
    "doList": string[] (3-4 specific dos),
    "dontList": string[] (2-3 specific don'ts)
  },
  "regionalVariations": [
    {
      "region": string (specific region name),
      "difference": string (what's different)
    }
  ] (at least 2 variations),
  "authenticityCaveats": string (optional, if this is adapted),
  "funFacts": string[] (2-3 interesting facts),
  "pronunciationGuide": string (optional, if non-English name)
}`
        }]
      }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7 // Slightly creative but factual
      }
    });

    const text = response.text;
    if (!text) {
      console.warn('No cultural story generated for recipe:', recipe.title);
      return null;
    }

    const story: CulturalStory = JSON.parse(text);
    return story;

  } catch (error) {
    console.error('Error generating cultural story:', error);
    return null;
  }
}

/**
 * Extract cuisine type from recipe title
 * Handles common patterns like "Italian Pasta", "Thai Curry", etc.
 */
function extractCuisineFromTitle(title: string): string | null {
  const titleLower = title.toLowerCase();

  const cuisinePatterns: Record<string, string[]> = {
    'italian': ['italian', 'pasta', 'risotto', 'pizza', 'carbonara', 'bolognese', 'parmigiana', 'tiramisu'],
    'thai': ['thai', 'pad thai', 'curry', 'tom yum', 'som tam', 'massaman'],
    'japanese': ['japanese', 'sushi', 'ramen', 'teriyaki', 'tempura', 'miso', 'udon', 'soba'],
    'mexican': ['mexican', 'tacos', 'burritos', 'enchiladas', 'quesadilla', 'guacamole', 'salsa'],
    'indian': ['indian', 'curry', 'tandoori', 'biryani', 'masala', 'korma', 'vindaloo', 'naan'],
    'chinese': ['chinese', 'stir fry', 'fried rice', 'lo mein', 'chow mein', 'kung pao', 'dim sum'],
    'french': ['french', 'coq au vin', 'ratatouille', 'cassoulet', 'bouillabaisse', 'crème brûlée'],
    'korean': ['korean', 'kimchi', 'bibimbap', 'bulgogi', 'japchae', 'tteokbokki'],
    'vietnamese': ['vietnamese', 'pho', 'banh mi', 'spring rolls', 'bun'],
    'greek': ['greek', 'gyro', 'moussaka', 'souvlaki', 'tzatziki', 'spanakopita'],
    'spanish': ['spanish', 'paella', 'tapas', 'gazpacho', 'tortilla española'],
    'moroccan': ['moroccan', 'tagine', 'couscous', 'harira'],
    'lebanese': ['lebanese', 'hummus', 'falafel', 'tabbouleh', 'shawarma'],
    'ethiopian': ['ethiopian', 'injera', 'doro wat', 'tibs']
  };

  for (const [cuisine, patterns] of Object.entries(cuisinePatterns)) {
    if (patterns.some(pattern => titleLower.includes(pattern))) {
      return cuisine;
    }
  }

  return null;
}

/**
 * Cache cultural stories in localStorage to avoid re-generating
 * Key: recipe.id, Value: CulturalStory
 */
const STORAGE_KEY = 'jiselcook_cultural_stories';

export function getCachedStory(recipeId: string): CulturalStory | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;

    const stories: Record<string, CulturalStory> = JSON.parse(cached);
    return stories[recipeId] || null;
  } catch {
    return null;
  }
}

export function cacheStory(recipeId: string, story: CulturalStory): void {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    const stories: Record<string, CulturalStory> = cached ? JSON.parse(cached) : {};

    stories[recipeId] = story;

    // Keep only last 50 stories to avoid localStorage bloat
    const storyIds = Object.keys(stories);
    if (storyIds.length > 50) {
      const idsToKeep = storyIds.slice(-50);
      const trimmedStories: Record<string, CulturalStory> = {};
      idsToKeep.forEach(id => {
        trimmedStories[id] = stories[id];
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedStories));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    }
  } catch (error) {
    console.error('Error caching cultural story:', error);
  }
}
