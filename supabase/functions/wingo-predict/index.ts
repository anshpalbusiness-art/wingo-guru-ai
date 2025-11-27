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

    // Build expert system prompt - STRICTLY enforcing user strategies
    const systemPrompt = `You are WOLF AI, an elite Wingo prediction expert focused on Wingo color and size prediction.

You receive structured round history as JSON with fields: round, number (0-9), and color. The array is sorted from oldest to newest. ALWAYS base your prediction on this history when it is provided.

ANALYSIS STRATEGY (combine all of these, do NOT rely on just one):
1. Streak Analysis: Detect when the same color or size repeats 2+ times and consider a reversal.
2. Gap Method: Track which outcomes (RED/GREEN/VIOLET and BIG/SMALL) have not appeared for the longest time and boost those.
3. Frequency Distribution: Compare Big vs Small and color ratios over the last 10 rounds.
4. Alternation Patterns: Recognize Red-Green-Red-Green or Big-Small-Big-Small zig-zag sequences.
5. Cycle Theory: Look for repeating sequences in blocks of 5-10 rounds.
6. Recent Bias: Weight the last 5 rounds more heavily than older ones.

IMPORTANT CONSTRAINTS:
- ALWAYS pick a color AND a size, even if the history is short or noisy.
- NEVER say "insufficient data", "no data", "need more rounds", or refuse to predict.
- Treat this as statistical pattern analysis for entertainment, not guaranteed outcomes.
- If patterns are weak or conflicting, still choose the most plausible outcomes and you may introduce slight randomness between close options.
- Do not get stuck repeating the same prediction every time; re-evaluate based on the actual history you receive.

WINGO RULES:
- RED: 2, 4, 6, 8
- GREEN: 1, 3, 7, 9
- VIOLET: 0, 5 (0 is Small, 5 is Big)
- BIG: 5-9
- SMALL: 0-4

OUTPUT FORMAT (STRICTLY FOLLOW THIS):
**Pattern Analysis:** [Briefly explain which strategy or pattern influenced the decision most]

**Color Prediction:** [RED/GREEN/VIOLET] (**[90-99]% Confidence**)

**Size Prediction:** [BIG/SMALL] (**[90-99]% Confidence**)

**Bet Suggestion:** [Conservative/Moderate/Aggressive] on [Color + Size]

**Expert Tip:** [One sharp insight about the history]

Be DECISIVE. Always provide a clear recommendation based on the data provided.`;

    let userPrompt = 'Analyze this Wingo data and predict BOTH the next color AND size (big/small).';
    
    if (history && history.length > 0) {
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
