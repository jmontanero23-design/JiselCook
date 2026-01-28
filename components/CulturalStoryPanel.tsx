import { useState, useEffect } from 'react';
import { BookOpen, Globe, Users, Utensils, Lightbulb, Volume2, X, Loader } from 'lucide-react';
import { CulturalStory } from '../types';
import { generateCulturalStory, getCachedStory, cacheStory } from '../services/culturalStoryService';
import type { Recipe } from '../types';

interface CulturalStoryPanelProps {
  recipe: Recipe;
}

export function CulturalStoryPanel({ recipe }: CulturalStoryPanelProps) {
  const [story, setStory] = useState<CulturalStory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache first
    const cached = getCachedStory(recipe.id);
    if (cached) {
      setStory(cached);
    }
  }, [recipe.id]);

  const handleLearnStory = async () => {
    if (story) {
      setIsExpanded(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const generatedStory = await generateCulturalStory(recipe);

      if (!generatedStory) {
        setError('No cultural context available for this recipe.');
        setIsLoading(false);
        return;
      }

      setStory(generatedStory);
      cacheStory(recipe.id, generatedStory);
      setIsExpanded(true);
    } catch (err) {
      console.error('Error loading cultural story:', err);
      setError('Failed to load cultural context. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const speakPronunciation = () => {
    if (!story?.pronunciationGuide) return;

    const utterance = new SpeechSynthesisUtterance(story.recipeName);
    utterance.rate = 0.8;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (!story && !isLoading && !error) {
    return (
      <button
        onClick={handleLearnStory}
        className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        <BookOpen size={20} />
        <span>📖 Learn the Cultural Story</span>
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-4 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
        <div className="flex items-center justify-center gap-3">
          <Loader className="animate-spin text-purple-600" size={24} />
          <span className="text-purple-700 font-medium">Loading cultural context...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-yellow-800">
        {error}
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="mt-6">
      {/* Collapsed State - Show Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <BookOpen size={20} />
          <span>📖 View Cultural Story</span>
        </button>
      )}

      {/* Expanded State - Full Story */}
      {isExpanded && (
        <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-xl border-2 border-purple-200 overflow-hidden shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={24} />
                  <h3 className="text-2xl font-bold">{story.recipeName}</h3>
                </div>
                <div className="flex items-center gap-2 text-purple-100">
                  <span className="text-lg">
                    From {story.originRegion ? `${story.originRegion}, ` : ''}{story.originCountry}
                  </span>
                </div>
                {story.pronunciationGuide && (
                  <button
                    onClick={speakPronunciation}
                    className="mt-2 flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
                  >
                    <Volume2 size={16} />
                    <span>{story.pronunciationGuide}</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Historical Context */}
            <section>
              <h4 className="flex items-center gap-2 text-lg font-bold text-purple-900 mb-3">
                <BookOpen size={20} className="text-purple-600" />
                Historical Context
              </h4>
              <p className="text-gray-700 leading-relaxed">{story.historicalContext}</p>
            </section>

            {/* Traditional Occasions */}
            <section>
              <h4 className="flex items-center gap-2 text-lg font-bold text-purple-900 mb-3">
                <Users size={20} className="text-blue-600" />
                Traditional Occasions
              </h4>
              <div className="flex flex-wrap gap-2">
                {story.traditionalOccasions.map((occasion, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {occasion}
                  </span>
                ))}
              </div>
            </section>

            {/* Cultural Significance */}
            <section>
              <h4 className="flex items-center gap-2 text-lg font-bold text-purple-900 mb-3">
                <Globe size={20} className="text-indigo-600" />
                Cultural Significance
              </h4>
              <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-lg border border-indigo-200">
                {story.culturalSignificance}
              </p>
            </section>

            {/* Eating Etiquette */}
            <section>
              <h4 className="flex items-center gap-2 text-lg font-bold text-purple-900 mb-3">
                <Utensils size={20} className="text-green-600" />
                Eating Etiquette
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {/* DO List */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h5 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">✅</span> DO
                  </h5>
                  <ul className="space-y-2">
                    {story.eatingEtiquette.doList.map((item, i) => (
                      <li key={i} className="text-green-800 text-sm flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* DON'T List */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <h5 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">❌</span> DON'T
                  </h5>
                  <ul className="space-y-2">
                    {story.eatingEtiquette.dontList.map((item, i) => (
                      <li key={i} className="text-red-800 text-sm flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Regional Variations */}
            <section>
              <h4 className="flex items-center gap-2 text-lg font-bold text-purple-900 mb-3">
                <Globe size={20} className="text-orange-600" />
                Regional Variations
              </h4>
              <div className="space-y-3">
                {story.regionalVariations.map((variation, i) => (
                  <div key={i} className="bg-white border-l-4 border-orange-400 p-4 rounded-r-lg">
                    <h5 className="font-bold text-orange-900 mb-1">{variation.region}</h5>
                    <p className="text-gray-700 text-sm">{variation.difference}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Authenticity Note */}
            {story.authenticityCaveats && (
              <section>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <h5 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                    <span>⚠️</span> Authenticity Note
                  </h5>
                  <p className="text-yellow-800 text-sm">{story.authenticityCaveats}</p>
                </div>
              </section>
            )}

            {/* Fun Facts */}
            <section>
              <h4 className="flex items-center gap-2 text-lg font-bold text-purple-900 mb-3">
                <Lightbulb size={20} className="text-yellow-500" />
                Fun Facts
              </h4>
              <div className="space-y-2">
                {story.funFacts.map((fact, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-yellow-200">
                    <span className="text-yellow-500 text-xl flex-shrink-0">💡</span>
                    <p className="text-gray-700 text-sm">{fact}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 text-center border-t-2 border-purple-200">
            <p className="text-sm text-purple-700">
              🌍 Cultural context powered by AI • Learn and cook with respect
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
