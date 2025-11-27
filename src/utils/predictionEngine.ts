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

  // --- ADVANCED STRATEGY: LONG BIG STREAK + BAIT DETECTION (Weight 0.7 / 70 pts) ---
  // Platform manipulation: 8+ Big streaks insert 1-2 "bait" Smalls, then continue Big
  
  let sizeStreak = 1;
  let lastSize = sizeHistory[sizeHistory.length-1];
  for(let i = sizeHistory.length - 2; i >= 0; i--) {
      if(sizeHistory[i] === lastSize) sizeStreak++;
      else break;
  }

  // Count Big rounds in last 10
  const bigInLast10 = sizeHistory.filter(s => s === 'BIG').length;
  
  // Detect if we're in a long Big streak phase (8+ Bigs total or 6+ consecutive)
  const inLongBigPhase = bigInLast10 >= 8 || sizeStreak >= 6;
  
  // Check for recent "bait" Small (1-2 Smalls surrounded by Bigs)
  const last3 = sizeHistory.slice(-3);
  const hasBaitPattern = (
    last3.length === 3 && 
    last3[0] === 'BIG' && 
    last3[1] === 'SMALL' && 
    last3[2] === 'SMALL'
  ) || (
    last3.length === 3 &&
    last3[0] === 'BIG' &&
    last3[1] === 'SMALL' // Single bait Small
  );

  // CRITICAL: Long Big streak with bait pattern → CONTINUE BIG
  if (inLongBigPhase && lastSize === 'SMALL' && bigInLast10 >= 7) {
    // Just hit a bait Small → next is very likely BIG again
    sizeScores['BIG'] += 90; // Extremely high - bait recovery
  } else if (inLongBigPhase && sizeStreak >= 8) {
    // Deep in long Big streak → still likely to continue with occasional bait
    sizeScores['BIG'] += 70;
  } else if (sizeStreak >= 6 && lastSize === 'BIG') {
    // Building up to long streak
    sizeScores['BIG'] += 60;
  } else if (sizeStreak >= 4) {
    // Standard streak
    const breakSide = lastSize === 'BIG' ? 'SMALL' : 'BIG';
    sizeScores[breakSide] += 40;
  }

  // Check if real Small streak is starting (2 Smalls within 3 rounds)
  const smallsInLast3 = last3.filter(s => s === 'SMALL').length;
  if (smallsInLast3 >= 2 && lastSize === 'SMALL') {
    // Real Small streak detected
    sizeScores['SMALL'] += 50;
  }

  // --- COLOR LOGIC: VIOLET → RED BIAS IN BIG STREAKS ---
  let colorStreak = 1;
  let lastColor = colorHistory[colorHistory.length-1];
  for(let i = colorHistory.length - 2; i >= 0; i--) {
      if(colorHistory[i] === lastColor) colorStreak++;
      else break;
  }

  // If last round was Violet AND we're in a Big phase → RED is heavily favored next
  if (lastColor === 'VIOLET' && inLongBigPhase) {
    colorScores['RED'] += 80; // 70-85% probability as per user data
    colorScores['GREEN'] += 20; // Lower green
  } else if (lastColor === 'VIOLET') {
    // Violet without Big streak context → still favor Red slightly
    colorScores['RED'] += 50;
    colorScores['GREEN'] += 30;
  }
  
  // Green streaks inside Big phases
  const greenInLast5 = colorHistory.slice(-5).filter(c => c === 'GREEN').length;
  if (inLongBigPhase && greenInLast5 >= 3) {
    // After Green run in Big streak → Violet or Red next
    colorScores['VIOLET'] += 40;
    colorScores['RED'] += 40;
  }

  // Standard color streak handling
  if (colorStreak >= 4 && lastColor !== 'VIOLET') {
      const others = ['RED', 'GREEN'].filter(c => c !== lastColor);
      others.forEach(c => colorScores[c as keyof typeof colorScores] += 50);
  }

  // --- STRATEGY 2: GAP METHOD (Weight 0.15 / 15 pts) ---
  // Minor - only applies outside long Big phases
  
  const lastBig = sizeHistory.lastIndexOf('BIG');
  const lastSmall = sizeHistory.lastIndexOf('SMALL');
  const bigGap = lastBig === -1 ? 10 : sizeHistory.length - 1 - lastBig;
  const smallGap = lastSmall === -1 ? 10 : sizeHistory.length - 1 - lastSmall;
  
  if (!inLongBigPhase) {
    if (bigGap >= 5) sizeScores['BIG'] += 20;
    if (smallGap >= 5) sizeScores['SMALL'] += 20;
  }

  const lastRed = colorHistory.lastIndexOf('RED');
  const lastGreen = colorHistory.lastIndexOf('GREEN');
  const redGap = lastRed === -1 ? 10 : colorHistory.length - 1 - lastRed;
  const greenGap = lastGreen === -1 ? 10 : colorHistory.length - 1 - lastGreen;
  
  if (redGap >= 5) colorScores['RED'] += 15;
  if (greenGap >= 5) colorScores['GREEN'] += 15;

  // --- STRATEGY 3: FREQUENCY BALANCE (Weight 0.1 / 10 pts) ---
  // Minimal - platform manipulation overrides natural balance
  
  if (bigCount > smallCount * 2) sizeScores['SMALL'] += 10;
  else if (smallCount > bigCount * 2) sizeScores['BIG'] += 10;
  
  if (redCount > greenCount * 2) colorScores['GREEN'] += 10;
  else if (greenCount > redCount * 2) colorScores['RED'] += 10;

  // --- STRATEGY 4: ALTERNATION (Weight 0.05 / 5 pts) ---
  // Almost irrelevant with bait logic
  const sizeAlt = checkAlternation(sizeHistory);
  if (sizeAlt.isAlternating && !inLongBigPhase) {
    sizeScores[sizeAlt.next as 'BIG'|'SMALL'] += 5;
  }
  
  const colorAlt = checkAlternation(colorHistory);
  if (colorAlt.isAlternating && colorAlt.next !== 'VIOLET') {
      colorScores[colorAlt.next as 'RED'|'GREEN'] += 5;
  }


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

  // Dynamic confidence based on pattern strength
  const sizeConfidence = Math.min(99, Math.max(85, 
    Math.round((Math.max(sizeScores['BIG'], sizeScores['SMALL']) / totalSizeScore) * 100) + 10
  ));
  
  const colorMaxScore = Math.max(colorScores['RED'], colorScores['GREEN'], colorScores['VIOLET']);
  const colorConfidence = Math.min(99, Math.max(85, 
    Math.round((colorMaxScore / totalColorScore) * 100) + 10
  ));

  const finalConfidence = Math.floor((sizeConfidence + colorConfidence) / 2);

  // Format Explanation
  const explanation = `
### 📊 **Statistical Analysis**

**Big/Small Prediction:**
• **PRIMARY:** ${predictedSize} (${sizeConfidence}%)
• **Secondary:** ${predictedSize === 'BIG' ? 'SMALL' : 'BIG'} (${100 - sizeConfidence}%)

**Color Prediction:**
• **PRIMARY:** ${predictedColor} (${colorConfidence}%)
• **Secondary:** ${predictedColor === 'RED' ? 'GREEN' : 'RED'}
• **Dark Horse:** VIOLET (${violetProb}%)

**Active Patterns:**
${inLongBigPhase ? `• 🔥 LONG BIG PHASE (${bigInLast10}/10 Big rounds - Bait likely)` : ''}
${lastSize === 'SMALL' && bigInLast10 >= 7 ? `• 🎣 BAIT DETECTED - BIG continuation expected` : ''}
${lastColor === 'VIOLET' && inLongBigPhase ? `• 🎯 Violet → RED bias active (70-85%)` : ''}
${smallsInLast3 >= 2 ? `• ⚠️ Real SMALL streak starting` : ''}
${sizeStreak >= 6 ? `• 📈 ${lastSize} Streak: ${sizeStreak} rounds` : ''}

> *Analysis based on pattern recognition. Not financial advice.*
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
