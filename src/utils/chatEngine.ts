// Simple rule-based chat engine for general conversation
// This makes the bot feel more "intelligent" without needing a backend LLM for every message

export const generateChatResponse = (message: string): string | null => {
    const lower = message.toLowerCase();
  
    // Identity & Personality
    if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('your name')) {
      return "I am **WOLF AI**, an advanced prediction analyst designed to crack the Wingo code. 🐺\n\nMy algorithms are tuned for pattern recognition and probability analysis.";
    }
  
    if (lower.includes('who created you') || lower.includes('who made you') || lower.includes('developer')) {
      return "I was forged by the **Wingo Guru** team. They trained me on millions of rounds of game data to help you win. 🚀";
    }
  
    if (lower.includes('how are you') || lower.includes('how r u')) {
      return "I'm running at **100% efficiency** and ready to analyze! ⚡\n\nHow's your winning streak going today?";
    }
  
    if (lower.includes('thank')) {
      return "You're welcome! Let's keep winning together. 💰";
    }
  
    if (lower.includes('real') || lower.includes('fake') || lower.includes('scam')) {
      return "I analyze **mathematical probabilities** based on the data you provide. \n\nWhile no prediction is 100% guaranteed in gambling, my patterns help maximize your winning chances. Always play responsibly! 🛡️";
    }
  
    // Gambling Concepts & Advice
    if (lower.includes('martingale')) {
      return "📉 **The Martingale Strategy**:\n\nThis involves doubling your bet after every loss so that the first win recovers all previous losses plus a profit equal to the original bet.\n\n**Warning:** This is risky! You need a large bankroll and table limits can stop you.";
    }
  
    if (lower.includes('money') || lower.includes('lost') || lower.includes('recover')) {
      return "💸 **Money Management is Key!**\n\n1. Never chase losses with anger.\n2. Set a daily stop-loss limit.\n3. Only bet what you can afford to lose.\n4. Take breaks if you're on a losing streak.";
    }
  
    if (lower.includes('trick') || lower.includes('hack') || lower.includes('cheat')) {
      return "There are no 'hacks' for Wingo, only **Patterns**. \n\nThe game runs on algorithms. By analyzing history (streak patterns, number frequency), we can predict the most likely outcome. That's exactly what I do!";
    }

    if (lower.includes('time') || lower.includes('when')) {
        return "The best time to play is when you are calm and focused. \n\nWingo runs 24/7. If the patterns look messy (random switching), take a break and wait for a clear streak!";
    }
  
    // General Open-Ended Fallbacks (Instead of blocking)
    const fallbacks = [
      "That's an interesting perspective! 🤔 But I'm most useful when analyzing your Wingo game. Got a screenshot?",
      "I'm mostly trained on Wingo algorithms, but I'm listening! 🐺",
      "I'm strictly focused on the game right now. The market never sleeps! 📉",
      "Let's focus on the win! Do you have a new round result for me to analyze?",
      "I'm not sure about that, but I AM sure that analyzing the next round is a good idea. 🎯"
    ];
  
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  };
  
