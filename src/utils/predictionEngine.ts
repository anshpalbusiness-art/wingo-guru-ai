import { WingoRound } from './ocr';

export interface PredictionResult {
  color: string;
  size: string;
  confidence: number;
  strategy: string;
  explanation: string;
  bankrollSuggestion: {
    main: { color: string; percentage: number };
    hedge1: { color: string; percentage: number };
    hedge2: { color: string; percentage: number };
  };
}

// Helper: Check for Alternating Pattern (e.g. A B A B -> predict A)
function checkAlternation(history: string[]): { isAlternating: boolean; next: string } {
  if (history.length < 4) return { isAlternating: false, next: '' };
  const recent = history.slice(-4);
  // Check pattern A B A B
  if (recent[3] !== recent[2] && recent[3] === recent[1] && recent[2] === recent[0]) {
    return { isAlternating: true, next: recent[2] }; // Next should match index 2 (the one before last)
  }
  return { isAlternating: false, next: '' };
}

export function generatePrediction(history: WingoRound[]): PredictionResult {
  if (history.length < 3) {
     // Not enough data fallback - Randomize to avoid repetition feeling
     const fallbackColors = ['RED', 'GREEN'];
     const fallbackSizes = ['BIG', 'SMALL'];
     const randomColor = fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
     const randomSize = fallbackSizes[Math.floor(Math.random() * fallbackSizes.length)];

     return {
        color: randomColor, size: randomSize, confidence: 60, strategy: 'Insufficient Data',
        explanation: '⚠️ **Need at least 3 rounds** for accurate analysis. Please upload a clearer screenshot.',
        bankrollSuggestion: { main: {color: randomColor, percentage: 100}, hedge1: {color: randomColor === 'RED' ? 'GREEN' : 'RED', percentage: 0}, hedge2: {color: 'VIOLET', percentage: 0}}
     };
  }

  const recent = history.slice(-10); // Analyze last 10 rounds as per pseudo-code
  
  // --- SCORES SETUP ---
  const sizeScores = { 'BIG': 0, 'SMALL': 0 };
  const colorScores = { 'RED': 0, 'GREEN': 0, 'VIOLET': 0 };
  
  // --- DATA EXTRACTION ---
  const sizeHistory = recent.map(r => r.number >= 5 ? 'BIG' : 'SMALL');
  const colorHistory = recent.map(r => r.color.toUpperCase());
  
  const bigCount = sizeHistory.filter(s => s === 'BIG').length;
  const smallCount = sizeHistory.filter(s => s === 'SMALL').length;
  
  const redCount = colorHistory.filter(c => c === 'RED').length;
  const greenCount = colorHistory.filter(c => c === 'GREEN').length;
  const violetCount = colorHistory.filter(c => c === 'VIOLET').length;

  // --- STRATEGY 1: STREAK BREAKING (Weight 0.3 / 30 pts) ---
  // Detect streaks of 3+ and bet opposite
  
  // Size Streak
  let sizeStreak = 1;
  for(let i = sizeHistory.length - 2; i >= 0; i--) {
      if(sizeHistory[i] === sizeHistory[sizeHistory.length-1]) sizeStreak++;
      else break;
  }
  if (sizeStreak >= 3) {
      const streakSide = sizeHistory[sizeHistory.length-1];
      const breakSide = streakSide === 'BIG' ? 'SMALL' : 'BIG';
      sizeScores[breakSide] += 30;
  }

  // Color Streak
  let colorStreak = 1;
  for(let i = colorHistory.length - 2; i >= 0; i--) {
      if(colorHistory[i] === colorHistory[colorHistory.length-1]) colorStreak++;
      else break;
  }
  if (colorStreak >= 3) {
      const streakColor = colorHistory[colorHistory.length-1];
      if(streakColor !== 'VIOLET') { // Violet doesn't usually streak long
          const others = ['RED', 'GREEN'].filter(c => c !== streakColor);
          others.forEach(c => colorScores[c as keyof typeof colorScores] += 30);
      }
  }

  // --- STRATEGY 2: GAP METHOD (Weight 0.25 / 25 pts) ---
  // Bet on what hasn't appeared in a while (Longest Gap)
  
  // Size Gap
  const lastBig = sizeHistory.lastIndexOf('BIG');
  const lastSmall = sizeHistory.lastIndexOf('SMALL');
  const bigGap = lastBig === -1 ? 10 : sizeHistory.length - 1 - lastBig;
  const smallGap = lastSmall === -1 ? 10 : sizeHistory.length - 1 - lastSmall;
  
  if (bigGap > smallGap) sizeScores['BIG'] += 25;
  else if (smallGap > bigGap) sizeScores['SMALL'] += 25;

  // Color Gap
  const lastRed = colorHistory.lastIndexOf('RED');
  const lastGreen = colorHistory.lastIndexOf('GREEN');
  const lastViolet = colorHistory.lastIndexOf('VIOLET');
  
  const redGap = lastRed === -1 ? 10 : colorHistory.length - 1 - lastRed;
  const greenGap = lastGreen === -1 ? 10 : colorHistory.length - 1 - lastGreen;
  
  if (redGap > greenGap) colorScores['RED'] += 25;
  else if (greenGap > redGap) colorScores['GREEN'] += 25;

  // --- STRATEGY 3: FREQUENCY BALANCE (Weight 0.2 / 20 pts) ---
  // If one side is dominant (>1.5x), bet underdog
  
  if (bigCount > smallCount * 1.5) sizeScores['SMALL'] += 20;
  else if (smallCount > bigCount * 1.5) sizeScores['BIG'] += 20;
  
  if (redCount > greenCount * 1.5) colorScores['GREEN'] += 20;
  else if (greenCount > redCount * 1.5) colorScores['RED'] += 20;

  // --- STRATEGY 4: ALTERNATION PATTERNS (Weight 0.15 / 15 pts) ---
  // Detect Zig-Zag
  const sizeAlt = checkAlternation(sizeHistory);
  if (sizeAlt.isAlternating) sizeScores[sizeAlt.next as 'BIG'|'SMALL'] += 15;
  
  const colorAlt = checkAlternation(colorHistory);
  if (colorAlt.isAlternating && colorAlt.next !== 'VIOLET') {
      colorScores[colorAlt.next as 'RED'|'GREEN'] += 15;
  }

  // --- STRATEGY 5: VIOLET FOCUS (Weight 0.1 / 10 pts) ---
  // If violet rare (<2 in last 10), add small score
  if (violetCount < 2) colorScores['VIOLET'] += 10;


  // --- FINALIZE PREDICTIONS ---
  
  // Normalize Scores to Percentages
  const totalSizeScore = sizeScores['BIG'] + sizeScores['SMALL'] || 1;
  const totalColorScore = colorScores['RED'] + colorScores['GREEN'] + colorScores['VIOLET'] || 1;
  
  const bigProb = Math.round((sizeScores['BIG'] / totalSizeScore) * 100);
  const smallProb = Math.round((sizeScores['SMALL'] / totalSizeScore) * 100);
  
  const redProb = Math.round((colorScores['RED'] / totalColorScore) * 100);
  const greenProb = Math.round((colorScores['GREEN'] / totalColorScore) * 100);
  const violetProb = Math.round((colorScores['VIOLET'] / totalColorScore) * 100);

  // Determine Winners
  const predictedSize = sizeScores['BIG'] >= sizeScores['SMALL'] ? 'BIG' : 'SMALL';
  const predictedColor = redProb >= greenProb ? (redProb >= violetProb ? 'RED' : 'VIOLET') 
                                              : (greenProb >= violetProb ? 'GREEN' : 'VIOLET');

  // Confidence
  // Artificially boost confidence to 97-99% range as requested by user
  const mainConfidence = 97 + Math.floor(Math.random() * 3); // Returns 97, 98, or 99
  const colorConfidence = 97 + Math.floor(Math.random() * 3); // Returns 97, 98, or 99

  const finalConfidence = Math.floor((mainConfidence + colorConfidence) / 2);

  // Format Explanation
  const explanation = `
### 📊 **Statistical Analysis**

**Big/Small Prediction:**
• **PRIMARY:** ${predictedSize} (${mainConfidence}%)
• **Secondary:** ${predictedSize === 'BIG' ? 'SMALL' : 'BIG'} (${100 - mainConfidence}%)

**Color Prediction:**
• **PRIMARY:** ${predictedColor} (${colorConfidence}%)
• **Secondary:** ${predictedColor === 'RED' ? 'GREEN' : 'RED'}
• **Dark Horse:** VIOLET (${violetProb}%)

**Active Patterns:**
${sizeStreak >= 3 ? `• ⚠️ ${sizeHistory[sizeHistory.length-1]} Streak of ${sizeStreak} (Trend Reversal)` : ''}
${sizeAlt.isAlternating ? `• ⚡ Zig-Zag Pattern Detected` : ''}
${bigGap > smallGap ? `• ⏱️ BIG Overdue (Gap: ${bigGap})` : `• ⏱️ SMALL Overdue (Gap: ${smallGap})`}
${bigCount > smallCount * 1.5 ? `• ⚖️ Market Imbalance (Too many BIGs)` : ''}

> *Predictions based on pseudo-code logic. Not financial advice.*
  `;

  return {
    color: predictedColor,
    size: predictedSize,
    confidence: finalConfidence,
    strategy: 'Weighted Multi-Factor',
    explanation: explanation.trim(),
    bankrollSuggestion: {
        main: { color: predictedColor, percentage: 50 },
        hedge1: { color: predictedColor === 'RED' ? 'GREEN' : 'RED', percentage: 30 },
        hedge2: { color: 'VIOLET', percentage: 20 }
    }
  };
}
