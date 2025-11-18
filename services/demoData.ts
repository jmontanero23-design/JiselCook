import { Recipe } from '../types';

export const DEMO_RECIPE: Recipe = {
  id: 'demo-carbonara',
  title: 'Classic Spaghetti Carbonara',
  description: 'A Roman classic made with eggs, hard cheese, cured pork, and black pepper. No cream allowed! This silky, savory pasta dish is comfort food at its finest.',
  difficulty: 'Medium',
  prepTimeMinutes: 20,
  calories: 650,
  rating: 4.8,
  reviewCount: 1240,
  imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=1200&q=80',
  tags: ['Italian', 'Pasta', 'Comfort Food'],
  drinkPairing: {
    name: 'Chardonnay or Pinot Grigio',
    description: 'A crisp, acidic white wine cuts through the richness of the egg and cheese sauce, cleansing the palate between bites.',
    type: 'Wine'
  },
  flavorProfile: {
      sweet: 1,
      salty: 8,
      sour: 2,
      bitter: 1,
      spicy: 4,
      umami: 9
  },
  ingredients: [
    { name: 'Spaghetti', amount: '400g', isMissing: false },
    { name: 'Guanciale or Pancetta', amount: '150g', isMissing: true },
    { name: 'Pecorino Romano', amount: '100g', isMissing: false },
    { name: 'Large Eggs', amount: '3', isMissing: false },
    { name: 'Black Pepper', amount: 'To taste', isMissing: false }
  ],
  steps: [
    { stepNumber: 1, instruction: 'Bring a large pot of salted water to a boil.' },
    { stepNumber: 2, instruction: 'Cut the guanciale into thick strips and sauté in a pan over medium heat until golden and crispy. Remove from heat but keep the fat.' },
    { stepNumber: 3, instruction: 'In a bowl, whisk the eggs and grated Pecorino Romano with a generous amount of black pepper until creamy.' },
    { stepNumber: 4, instruction: 'Cook the pasta until al dente. Reserve 1/2 cup of pasta water.' },
    { stepNumber: 5, instruction: 'Toss the pasta in the pan with the guanciale fat. Remove from heat completely.' },
    { stepNumber: 6, instruction: 'Pour the egg mixture over the pasta, tossing quickly and vigorously to create a creamy sauce without scrambling the eggs. Add pasta water if needed.' },
    { stepNumber: 7, instruction: 'Serve immediately with extra cheese and pepper.' }
  ]
};