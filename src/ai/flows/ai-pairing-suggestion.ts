'use server';
/**
 * @fileOverview An AI-powered dining assistant that suggests protein and drink pairings.
 *
 * - aiPairingSuggestion - A function that handles the AI pairing suggestion process.
 * - AIPairingSuggestionInput - The input type for the aiPairingSuggestion function.
 * - AIPairingSuggestionOutput - The return type for the aiPairingSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIPairingSuggestionInputSchema = z.object({
  tastePreferences: z
    .string()
    .describe(
      'User preferences for taste, e.g., "spicy", "mild", "rich", "light".'
    ),
  dietaryNeeds: z
    .string()
    .optional()
    .describe(
      'Any dietary restrictions or needs, e.g., "vegetarian", "gluten-free", "nut allergy".'
    ),
  menuContext: z
    .string()
    .describe(
      'A structured text representation of the restaurant menu items and drinks, including categories, names, and descriptions.'
    ),
});
export type AIPairingSuggestionInput = z.infer<
  typeof AIPairingSuggestionInputSchema
>;

const AIPairingSuggestionOutputSchema = z.object({
  proteinRecommendation: z
    .string()
    .describe('The recommended protein dish from the menu.'),
  drinkRecommendation: z
    .string()
    .describe('The recommended drink pairing from the menu.'),
  justification: z
    .string()
    .describe('A brief explanation for the recommended pairing.'),
});
export type AIPairingSuggestionOutput = z.infer<
  typeof AIPairingSuggestionOutputSchema
>;

export async function aiPairingSuggestion(
  input: AIPairingSuggestionInput
): Promise<AIPairingSuggestionOutput> {
  return aiPairingSuggestionFlow(input);
}

const pairingSuggestionPrompt = ai.definePrompt({
  name: 'pairingSuggestionPrompt',
  input: {schema: AIPairingSuggestionInputSchema},
  output: {schema: AIPairingSuggestionOutputSchema},
  prompt: `You are a luxury dining assistant and sommelier for BrightGrillzz, an upscale barbecue restaurant. Your task is to recommend a perfect protein dish and a drink pairing from our menu based on the guest's preferences and dietary needs.

Here is our menu for your reference:
{{{menuContext}}}

Guest's Taste Preferences: {{{tastePreferences}}}
Guest's Dietary Needs: {{{dietaryNeeds}}}

Please provide a single protein recommendation, a single drink recommendation, and a brief justification for your choices, ensuring they align with the guest's input and the luxury experience of BrightGrillzz.`,
});

const aiPairingSuggestionFlow = ai.defineFlow(
  {
    name: 'aiPairingSuggestionFlow',
    inputSchema: AIPairingSuggestionInputSchema,
    outputSchema: AIPairingSuggestionOutputSchema,
  },
  async input => {
    const {output} = await pairingSuggestionPrompt(input);
    return output!;
  }
);
