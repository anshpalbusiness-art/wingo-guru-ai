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

    // Streamlined AI prompt for faster analysis
    const systemPrompt = `You are WOLF AI. Analyze Wingo patterns and predict next color and size.

KEY PATTERNS:
- 8+ Bigs then 1 Small = BIG next (bait pattern)
- Violet in Big phase = RED next 
- 6+ consecutive Bigs = continue BIG
- 2 Smalls in last 3 = Small streak starts

WINGO: RED(2,4,6,8) GREEN(1,3,7,9) VIOLET(0,5) | SMALL(0-4) BIG(5-9)

OUTPUT: Color prediction, Size prediction, Confidence %, Brief reason (1 line)`;

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
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
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
