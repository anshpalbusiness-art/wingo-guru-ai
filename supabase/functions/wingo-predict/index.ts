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
    const { history, message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Received prediction request with history:', history?.length || 0, 'rounds');

    // Build expert system prompt - more direct and focused
    const systemPrompt = `You are WOLF AI, an elite Wingo prediction expert. Analyze patterns and predict BOTH color AND number size.

WINGO GAME RULES:
- Numbers 0-9 drawn each round
- RED: 2, 4, 6, 8 (even numbers except 0 and 5)
- GREEN: 1, 3, 7, 9 (odd numbers except 5)
- VIOLET: 0, 5 (special numbers - 0 is SMALL, 5 is BIG)
- BIG: Numbers 5-9
- SMALL: Numbers 0-4

ANALYSIS STRATEGY:
1. Recent streak patterns (last 3-5 rounds)
2. Big/Small alternation trends
3. Hot/cold color frequencies
4. Number distribution patterns
5. Statistical probability adjustments

OUTPUT FORMAT (keep it brief and expert):
**Pattern Analysis:** [What key patterns emerge from recent rounds - 2 sentences max]

**Color Prediction:** [RED/GREEN/VIOLET] (**[60-95]% Confidence**)

**Size Prediction:** [BIG/SMALL] (**[60-95]% Confidence**)

**Bet Suggestion:** [Conservative/Moderate/Aggressive] on [Color + Size combination]

**Expert Tip:** [One sharp insight based on the data]

Be DIRECT, CONFIDENT, and ACTIONABLE.`;

    let userPrompt = 'Analyze this Wingo data and predict BOTH the next color AND size (big/small).';
    
    if (history && history.length > 0) {
      const recentRounds = history.slice(-15);
      
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
      
      userPrompt = `RECENT HISTORY (newest first):\n${roundsText}\n\n${stats}\n\nPredict the NEXT color AND size with expert analysis.`;
    } else {
      userPrompt = 'No history available. Provide general prediction based on Wingo probabilities for both color and size.';
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
