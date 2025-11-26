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

interface ColorStats {
  red: number;
  green: number;
  violet: number;
}

interface SizeStats {
  big: number;
  small: number;
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

// Strategy 1: Pattern Observation - Detect streaks
function analyzeStreaks(history: WingoRound[]): { color: string; length: number; suggestion: 'continue' | 'break' } {
  if (history.length < 3) return { color: 'none', length: 0, suggestion: 'continue' };
  
  const recent = history.slice(-10);
  let currentStreak = 1;
  let streakColor = recent[recent.length - 1]?.color || 'Red';
  
  for (let i = recent.length - 2; i >= 0; i--) {
    if (recent[i].color === streakColor) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // If streak is 3+, suggest breaking; if 1-2, suggest continuing
  const suggestion = currentStreak >= 3 ? 'break' : 'continue';
  
  return { color: streakColor, length: currentStreak, suggestion };
}

// Strategy 2: Cycle Theory - Analyze color distribution in blocks
function analyzeCycles(history: WingoRound[]): ColorStats {
  const blockSize = 5;
  const recentBlock = history.slice(-blockSize);
  
  const stats: ColorStats = { red: 0, green: 0, violet: 0 };
  
  recentBlock.forEach(round => {
    const color = round.color.toLowerCase();
    if (color === 'red') stats.red++;
    else if (color === 'green') stats.green++;
    else if (color === 'violet') stats.violet++;
  });
  
  return stats;
}

// Strategy 4: Gap Method - Find color that hasn't appeared longest
function findGapColor(history: WingoRound[]): { color: string; gap: number } {
  const lastAppearance: { [key: string]: number } = {
    'Red': -1,
    'Green': -1,
    'Violet': -1
  };
  
  history.forEach((round, index) => {
    lastAppearance[round.color] = index;
  });
  
  let maxGap = 0;
  let gapColor = 'Red';
  
  Object.entries(lastAppearance).forEach(([color, lastIndex]) => {
    const gap = lastIndex === -1 ? history.length : history.length - lastIndex - 1;
    if (gap > maxGap) {
      maxGap = gap;
      gapColor = color;
    }
  });
  
  return { color: gapColor, gap: maxGap };
}

// Strategy 5: Violet Focus - Check if Violet is due
function checkVioletOpportunity(history: WingoRound[]): boolean {
  const recent = history.slice(-15);
  const violetCount = recent.filter(r => r.color === 'Violet').length;
  
  // Violet typically appears ~20% of time (numbers 0 and 5)
  // If it's below 10% in recent rounds, it might be "due"
  return violetCount < recent.length * 0.1;
}

// Analyze Big/Small patterns
function analyzeSizePatterns(history: WingoRound[]): { prediction: string; confidence: number } {
  const recent = history.slice(-12); // Look at last 12
  const stats: SizeStats = { big: 0, small: 0 };
  
  recent.forEach(round => {
    if (round.number >= 5) stats.big++;
    else stats.small++;
  });
  
  // 1. Check for Alternating Pattern (Zig-Zag) e.g. B S B S
  let isAlternating = true;
  if (recent.length >= 4) {
      for (let i = recent.length - 1; i > recent.length - 4; i--) {
          const current = recent[i].number >= 5 ? 'big' : 'small';
          const prev = recent[i-1].number >= 5 ? 'big' : 'small';
          if (current === prev) {
              isAlternating = false;
              break;
          }
      }
  } else {
      isAlternating = false;
  }

  if (isAlternating) {
      const lastSize = recent[recent.length - 1].number >= 5 ? 'big' : 'small';
      return {
          prediction: lastSize === 'big' ? 'SMALL' : 'BIG',
          confidence: 88 // High confidence in zig-zag
      };
  }

  // 2. Analyze Streaks
  let sizeStreak = 1;
  const lastSize = recent[recent.length - 1]?.number >= 5 ? 'big' : 'small';
  
  for (let i = recent.length - 2; i >= 0; i--) {
    const size = recent[i].number >= 5 ? 'big' : 'small';
    if (size === lastSize) sizeStreak++;
    else break;
  }
  
  // Strategy:
  // Streak = 1: No clear trend, look at stats
  // Streak = 2 or 3: Trend is forming, BET WITH IT
  // Streak >= 4: Trend is exhausted, BET AGAINST IT (Break)
  
  if (sizeStreak >= 4) {
    return {
      prediction: lastSize === 'big' ? 'SMALL' : 'BIG',
      confidence: Math.min(70 + sizeStreak * 4, 95)
    };
  } else if (sizeStreak >= 2) {
    return {
      prediction: lastSize === 'big' ? 'BIG' : 'SMALL',
      confidence: 75 + sizeStreak * 5
    };
  }
  
  // 3. Majority / Frequency Analysis
  if (stats.big !== stats.small) {
      const prediction = stats.big > stats.small ? 'BIG' : 'SMALL';
      const confidence = 60 + Math.abs(stats.big - stats.small) * 2;
      return { prediction, confidence: Math.min(confidence, 80) };
  }
  
  // 4. Tie Breaker: Flip the last result (expecting alternation)
  return { 
      prediction: lastSize === 'big' ? 'SMALL' : 'BIG', 
      confidence: 65 
  };
}

export function generatePrediction(history: WingoRound[]): PredictionResult {
  if (history.length < 5) {
     // Not enough data fallback
     return {
        color: 'RED', size: 'BIG', confidence: 60, strategy: 'Insufficient Data',
        explanation: '⚠️ **Need at least 5 rounds** for accurate analysis. Please upload a clearer screenshot.',
        bankrollSuggestion: { main: {color: 'RED', percentage: 100}, hedge1: {color: 'GREEN', percentage: 0}, hedge2: {color: 'VIOLET', percentage: 0}}
     };
  }

  const recent = history.slice(-15); // Analyze last 15 rounds
  
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
  // Bet on what hasn't appeared in a while
  
  // Size Gap
  const lastBig = sizeHistory.lastIndexOf('BIG');
  const lastSmall = sizeHistory.lastIndexOf('SMALL');
  const bigGap = lastBig === -1 ? 15 : sizeHistory.length - 1 - lastBig;
  const smallGap = lastSmall === -1 ? 15 : sizeHistory.length - 1 - lastSmall;
  
  if (bigGap > smallGap && bigGap >= 4) sizeScores['BIG'] += 25;
  if (smallGap > bigGap && smallGap >= 4) sizeScores['SMALL'] += 25;

  // Color Gap
  const lastRed = colorHistory.lastIndexOf('RED');
  const lastGreen = colorHistory.lastIndexOf('GREEN');
  const lastViolet = colorHistory.lastIndexOf('VIOLET');
  
  const redGap = lastRed === -1 ? 15 : colorHistory.length - 1 - lastRed;
  const greenGap = lastGreen === -1 ? 15 : colorHistory.length - 1 - lastGreen;
  const violetGap = lastViolet === -1 ? 15 : colorHistory.length - 1 - lastViolet;
  
  const maxColorGap = Math.max(redGap, greenGap); // Ignore violet for main gap
  if (redGap === maxColorGap && redGap >= 4) colorScores['RED'] += 25;
  if (greenGap === maxColorGap && greenGap >= 4) colorScores['GREEN'] += 25;

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
  // If violet rare (<2 in last 15), add small score
  if (violetCount < 2) colorScores['VIOLET'] += 10;
  // Also randomly violet appears every ~5-8 rounds
  if (violetGap >= 6) colorScores['VIOLET'] += 15;


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
  const mainConfidence = Math.max(bigProb, smallProb);
  const colorConfidence = Math.max(redProb, greenProb, violetProb);
  const finalConfidence = Math.round((mainConfidence + colorConfidence) / 2);

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
${sizeStreak >= 3 ? `• ⚠️ ${sizeHistory[sizeHistory.length-1]} Streak of ${sizeStreak} (Betting Break)` : ''}
${sizeAlt.isAlternating ? `• ⚡ Zig-Zag Pattern Detected` : ''}
${violetGap >= 6 ? `• 💜 Violet Overdue (${violetGap} rounds)` : ''}
${bigCount > smallCount * 1.5 ? `• ⚖️ Market Imbalance (Too many BIGs)` : ''}

> *Predictions based on weighted probability engine. Not financial advice.*
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
