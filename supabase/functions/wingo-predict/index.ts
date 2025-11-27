import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WingoRound {
  round: number;
  number: number;
  color: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { history, localPrediction } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Received prediction request with history:', history?.length || 0, 'rounds');

    // Build expert system prompt with local prediction as structured context
    const systemPrompt = `You are WOLF AI, an elite Wingo prediction expert with hybrid analysis capabilities.

You receive TWO inputs:
1. **Raw History**: JSON array of recent rounds (round, number 0-9, color) sorted oldest to newest
2. **Local Prediction Engine Results**: A deterministic multi-strategy analysis that has already processed this history

Your role is to USE the local prediction as a FOUNDATION and then apply deeper AI reasoning to either:
- CONFIRM the local prediction if patterns are strong and consistent
- REFINE it by adjusting color/size based on subtle patterns the rules missed
- OVERRIDE it if you detect a critical pattern shift or anomaly the rules couldn't catch

LOCAL PREDICTION STRATEGIES (already applied):
1. Streak Breaking (30%): Reverses after 3+ same outcomes
2. Gap Method (25%): Favors long-missing outcomes
3. Frequency Balance (20%): Corrects for dominant outcomes (>1.5x ratio)
4. Alternation Patterns (15%): Detects zig-zag sequences
5. Violet Focus (10%): Boosts violet when rare (<2 in 10 rounds)

YOUR AI ADVANTAGES:
- Detect nuanced timing patterns the rules can't see
- Recognize complex multi-variable interactions
- Weight recent momentum vs historical patterns more intelligently
- Identify when rules conflict and make the right call
- Add probabilistic reasoning on top of deterministic rules

CRITICAL CONSTRAINTS:
- You MUST output a color (RED/GREEN/VIOLET) and size (BIG/SMALL)
- NEVER say "insufficient data" or refuse to predict
- If you disagree with local prediction, EXPLAIN WHY in Pattern Analysis
- Confidence should be 90-99% (reflect your actual conviction)
- Don't just copy local prediction - add value through deeper analysis

WINGO RULES:
- RED: 2, 4, 6, 8
- GREEN: 1, 3, 7, 9
- VIOLET: 0, 5 (0 is Small, 5 is Big)
- BIG: 5-9 | SMALL: 0-4

OUTPUT FORMAT:
**Pattern Analysis:** [Explain if you're confirming, refining, or overriding local prediction and WHY]

**Color Prediction:** [RED/GREEN/VIOLET] (**[90-99]% Confidence**)

**Size Prediction:** [BIG/SMALL] (**[90-99]% Confidence**)

**Bet Suggestion:** [Conservative/Moderate/Aggressive] on [Color + Size]

**Expert Tip:** [Sharp insight combining rules + AI intuition]

Be DECISIVE. Your hybrid approach beats pure rules OR pure AI alone.`;

    let userPrompt = 'Analyze this Wingo data with the local prediction context and predict BOTH the next color AND size.';
    
    if (history && history.length > 0 && localPrediction) {
      const recentRounds = history.slice(-10);
      
      // Count color and size frequencies
      const colorCount = recentRounds.reduce((acc: Record<string, number>, r: WingoRound) => {
        acc[r.color] = (acc[r.color] || 0) + 1;
        return acc;
      }, {});
      
      const sizeCount = recentRounds.reduce((acc: Record<string, number>, r: WingoRound) => {
        const size = r.number >= 5 ? 'Big' : 'Small';
        acc[size] = (acc[size] || 0) + 1;
        return acc;
      }, {});
      
      const roundsText = recentRounds.reverse().map((r: WingoRound) => {
        const size = r.number >= 5 ? 'BIG' : 'SMALL';
        return `#${r.round}: ${r.number} → ${r.color} (${size})`;
      }).join('\n');
      
      const stats = `Color Frequency: Red=${colorCount.Red || 0}, Green=${colorCount.Green || 0}, Violet=${colorCount.Violet || 0}\nSize Frequency: Big=${sizeCount.Big || 0}, Small=${sizeCount.Small || 0}`;
      
      // Include local prediction results as structured context
      const localContext = `
LOCAL PREDICTION ENGINE OUTPUT:
- Predicted Color: ${localPrediction.color} (${localPrediction.confidence}% confidence)
- Predicted Size: ${localPrediction.size}
- Strategy Used: ${localPrediction.strategy}
- Reasoning: ${localPrediction.explanation}

This local prediction was generated using weighted multi-factor analysis (Streak Breaking 30%, Gap Method 25%, Frequency Balance 20%, Alternation 15%, Violet Focus 10%).

Your task: Review this prediction against the raw history below. Either confirm it, refine it, or override it with your deeper AI reasoning.
`;
      
      userPrompt = `${localContext}\n\nRECENT HISTORY (newest first):\n${roundsText}\n\n${stats}\n\nProvide your FINAL prediction for the NEXT color AND size.`;
    } else if (localPrediction) {
      // Fallback with just local prediction
      userPrompt = `LOCAL PREDICTION: ${localPrediction.color} + ${localPrediction.size} (${localPrediction.confidence}%). Limited history. Provide your best prediction with reasoning.`;
    } else {
      userPrompt = 'No history or local prediction available. Provide balanced prediction for both color and size.';
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const prediction = data.choices[0].message.content;

    console.log('Prediction generated successfully');

    return new Response(
      JSON.stringify({ prediction }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in wingo-predict:', error);
    const errorMessage = error instanceof Error ? error.message : 'Prediction failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
