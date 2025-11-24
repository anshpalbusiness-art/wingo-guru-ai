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

serve(async (req) => {
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
    const systemPrompt = `You are WOLF AI, an elite Wingo prediction expert. Your job is to predict the NEXT COLOR immediately.

WINGO GAME RULES:
- Numbers 0-9 drawn each round
- RED: 1, 2, 5, 6, 8, 9 (60% probability)
- GREEN: 3, 4, 7 (30% probability) 
- VIOLET: 0 only (10% probability)

ANALYSIS STRATEGY:
1. Check last 3-5 rounds for patterns (streaks, alternations)
2. Identify hot/cold colors
3. Consider number distribution patterns
4. Factor in statistical probabilities

OUTPUT FORMAT (be direct and brief):
**Pattern Analysis:** [2 sentences max - what patterns you see]

**Predicted Color:** [RED/GREEN/VIOLET] (**[60-95]% Confidence**)

**Bet Amount:** [Small/Medium/Large]

**Expert Tip:** [One sharp gambling insight]

Keep it SHORT, CONFIDENT, and ACTIONABLE. No fluff.`;

    let userPrompt = 'Analyze this Wingo data and predict the next color NOW.';
    
    if (history && history.length > 0) {
      const recentRounds = history.slice(-15); // Show more history
      
      // Count color frequencies
      const colorCount = recentRounds.reduce((acc: any, r: WingoRound) => {
        acc[r.color] = (acc[r.color] || 0) + 1;
        return acc;
      }, {});
      
      const roundsText = recentRounds.reverse().map((r: WingoRound) => 
        `#${r.round}: ${r.number} → ${r.color}`
      ).join('\n');
      
      const stats = `Color Frequency: Red=${colorCount.Red || 0}, Green=${colorCount.Green || 0}, Violet=${colorCount.Violet || 0}`;
      
      userPrompt = `RECENT HISTORY (newest first):\n${roundsText}\n\n${stats}\n\nPredict the NEXT color with your expert analysis.`;
    } else {
      userPrompt = 'No history available yet. Provide a general prediction based on Wingo probabilities.';
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
