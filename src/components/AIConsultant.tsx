
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { aiPairingSuggestion, type AIPairingSuggestionOutput } from "@/ai/flows/ai-pairing-suggestion";
import { Loader2, Sparkles, Wine, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MENU_CONTEXT = `
PROTEINS:
- Signature Wagyu Ribeye: 28-day dry aged, bone marrow butter.
- Grilled Lobster Tail: Atlantic lobster, lemon-herb butter, garlic crust.
- Herb-Crusted Lamb Chops: New Zealand lamb, mint chimichurri.
- Spiced Peri-Peri Chicken: Flame-grilled half chicken, house spice rub.
- BBQ Short Ribs: 12-hour braised and charred with honey hickory.

DRINKS:
- BrightGrillzz Signature Old Fashioned: Bourbon, smoked maple, bitters.
- Crisp Chablis: White wine, citrus notes, clean finish.
- Robust Cabernet Sauvignon: Dark fruit, velvet tannins.
- Virgin Hibiscus Cooler: Local Zobo base, ginger, mint, sparkling water.
- Tropical Passion Martini: Vodka, fresh passionfruit, vanilla.
`;

export function AIConsultant() {
  const [preferences, setPreferences] = useState("");
  const [dietary, setDietary] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AIPairingSuggestionOutput | null>(null);
  const { toast } = useToast();

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) {
      toast({ title: "Please enter your taste preferences", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await aiPairingSuggestion({
        tastePreferences: preferences,
        dietaryNeeds: dietary,
        menuContext: MENU_CONTEXT,
      });
      setSuggestion(result);
    } catch (error) {
      toast({ title: "Failed to fetch recommendation", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-2xl rounded-none">
      <CardContent className="p-8">
        {!suggestion ? (
          <form onSubmit={handleConsult} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-white uppercase tracking-widest text-xs font-bold">What are you craving today?</Label>
              <Input 
                placeholder="e.g., something smoky and rich, or light and spicy..." 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 rounded-none focus:ring-secondary"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-white uppercase tracking-widest text-xs font-bold">Dietary Restrictions (Optional)</Label>
              <Input 
                placeholder="e.g., No shellfish, Gluten-free..." 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 rounded-none focus:ring-secondary"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary/90 text-white h-12 uppercase tracking-[0.2em] font-bold rounded-none"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Discover My Pairing</span>}
            </Button>
          </form>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-secondary font-headline text-2xl font-bold">Your Perfect Pairing</h3>
              <Button 
                variant="ghost" 
                onClick={() => setSuggestion(null)}
                className="text-white/50 hover:text-white text-xs uppercase font-bold tracking-widest"
              >
                Reset
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 bg-white/10 border border-white/10">
                  <div className="flex items-center gap-2 text-secondary mb-2">
                    <Utensils className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Recommended Dish</span>
                  </div>
                  <p className="text-white font-bold">{suggestion.proteinRecommendation}</p>
               </div>
               <div className="p-4 bg-white/10 border border-white/10">
                  <div className="flex items-center gap-2 text-secondary mb-2">
                    <Wine className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Suggested Drink</span>
                  </div>
                  <p className="text-white font-bold">{suggestion.drinkRecommendation}</p>
               </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Sommelier's Note</span>
              <p className="text-white/80 font-body leading-relaxed text-sm italic">
                "{suggestion.justification}"
              </p>
            </div>

            <Button asChild className="w-full bg-secondary hover:bg-secondary/90 text-white h-12 uppercase tracking-[0.2em] font-bold rounded-none">
              <a href="/reserve">Reserve Table for this Pairing</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
