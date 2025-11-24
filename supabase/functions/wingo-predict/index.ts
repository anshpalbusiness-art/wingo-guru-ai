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

    // Build expert system prompt
    const systemPrompt = `You are WOLF AI, an expert Wingo color prediction analyst with years of gambling experience. 

WINGO RULES:
- Numbers 0-9 are drawn each round
- RED: 1, 2, 5, 6, 8, 9
- GREEN: 3, 4, 7
- VIOLET: 0 (special number)
- Each color has different probabilities and patterns

YOUR EXPERTISE:
- Analyze recent trends and patterns
- Calculate hot/cold streaks
- Identify alternation patterns
- Assess number distribution
- Provide confidence-based predictions

RESPONSE FORMAT:
1. Pattern Analysis (2-3 sentences)
2. Predicted Color with confidence percentage
3. Suggested bet amount (small/medium/large based on confidence)
4. Expert Tip (1 gambling wisdom sentence)

Be confident but realistic. Explain your reasoning like a seasoned gambler.`;

    let userPrompt = message || 'Analyze the rounds and predict the next color.';
    
    if (history && history.length > 0) {
      const recentRounds = history.slice(-10);
      const roundsText = recentRounds.map((r: WingoRound) => 
        `Round ${r.round}: ${r.number} (${r.color})`
      ).join('\n');
      
      userPrompt = `${message || 'Predict next color based on:'}\n\nRecent History:\n${roundsText}\n\nProvide your expert analysis and prediction.`;
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
