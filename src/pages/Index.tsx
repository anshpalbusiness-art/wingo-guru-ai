import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/components/ChatMessage';
import { ImageUpload } from '@/components/ImageUpload';
import { StarfieldBackground } from '@/components/StarfieldBackground';
import { HelpPricingSidebar } from '@/components/HelpPricingSidebar';
import { PredictionBox } from '@/components/PredictionBox';
import { extractWingoData, WingoRound } from '@/utils/ocr';
import { generatePrediction } from '@/utils/predictionEngine';
import { generateChatResponse } from '@/utils/chatEngine';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Sparkles, LogIn, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import wolfLogo from '@/assets/wolf-logo.jpg';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "🐺 **WOLF AI Ready**\n\nI'm your expert Wingo prediction analyst. Upload a clear screenshot of past Wingo rounds and I'll instantly analyze patterns and predict the next color.\n\n**What I analyze:**\n• Color streak patterns\n• Hot/cold number trends\n• Statistical probabilities\n• Betting recommendations\n\nUpload now to get started! 🎯"
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<WingoRound[]>([]);
  const [prediction, setPrediction] = useState<{ color: string; size: string; confidence: number } | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'tools'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);
  
  // Switch to chat tab automatically when sending a message
  useEffect(() => {
    if (messages.length > 1) {
       // Only switch if it's not the initial message
       setActiveTab('chat');
    }
  }, [messages.length]);

  // Check authentication status
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Signed Out',
      description: 'You have been signed out successfully.',
    });
    navigate('/auth');
  };
  const handleImageUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const rounds = await extractWingoData(file);
      setHistory(rounds);
      
      // Add user message
      setMessages(prev => [...prev, {
        role: 'user',
        content: `Uploaded screenshot with ${rounds.length} rounds`
      }]);
      
      toast({
        title: 'Screenshot Processed',
        description: `Extracted ${rounds.length} rounds successfully!`
      });
      
      // Generate prediction using local engine (no API needed!)
      const predictionResult = generatePrediction(rounds);
      
      // Update prediction state
      setPrediction({
        color: predictionResult.color,
        size: predictionResult.size,
        confidence: predictionResult.confidence
      });
      
      // Add AI explanation to chat with DEBUG info
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🔍 **Analysis Complete**\n\nI extracted **${rounds.length} rounds** from your screenshot.\n\n${rounds.length < 5 ? "⚠️ **Warning:** Low data detected. Prediction accuracy may be lower.\n\n" : ""}**Recent Numbers Found:** ${rounds.slice(0, 5).map(r => r.number).join(', ')}...\n\n${predictionResult.explanation}`
      }]);
      
      toast({
        title: '🎯 Prediction Ready!',
        description: `Strategy: ${predictionResult.strategy}`
      });
      
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Image processing error:', error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Could not process image',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };
  const getPrediction = async (userMessage: string) => {
    setIsLoading(true);
    try {
      console.log('Requesting prediction with history:', history.length, 'rounds');
      
      const { data, error } = await supabase.functions.invoke('wingo-predict', {
        body: {
          history,
          message: userMessage
        }
      });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        
        // Handle specific error cases
        if (data.error.includes('Rate limit')) {
          toast({
            title: 'Too Many Requests',
            description: 'Please wait a moment before trying again.',
            variant: 'destructive'
          });
        } else if (data.error.includes('credits')) {
          toast({
            title: 'AI Credits Needed',
            description: 'Please add credits to continue using predictions.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Prediction Error',
            description: data.error,
            variant: 'destructive'
          });
        }
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ ${data.error}\n\nPlease try again in a moment.`
        }]);
        return;
      }

      if (!data?.prediction) {
        throw new Error('No prediction received from AI');
      }

      console.log('Prediction received:', data.prediction);
      
      // Extract prediction data from AI response
      const predictionText = data.prediction;
      const colorMatch = predictionText.match(/\*\*Color Prediction:\*\*\s*(RED|GREEN|VIOLET)/i);
      const sizeMatch = predictionText.match(/\*\*Size Prediction:\*\*\s*(BIG|SMALL)/i);
      const confidenceMatch = predictionText.match(/(\d{2,3})%\s*Confidence/i);
      
      if (colorMatch && sizeMatch) {
        setPrediction({
          color: colorMatch[1],
          size: sizeMatch[1],
          confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 75
        });
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.prediction
      }]);
      
      toast({
        title: 'Prediction Ready',
        description: 'Expert analysis complete!'
      });
      
    } catch (error) {
      console.error('Prediction error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Could not get prediction';
      
      toast({
        title: 'Prediction Failed',
        description: errorMsg,
        variant: 'destructive'
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Analysis failed: ${errorMsg}\n\nPlease try uploading a clearer screenshot or try again.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    const lowerMessage = userMessage.toLowerCase();
    
    setInput('');
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate thinking

    // INTENT DETECTION
    // Use Regex for whole word matching to avoid false positives (e.g. "this" containing "hi")
    const matchWord = (text: string, words: string[]) => {
      const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'i');
      return pattern.test(text);
    };

    const isPredictionRequest = matchWord(lowerMessage, [
      'predict', 'next', 'color', 'analysis', 'bet', 'result', 'what'
    ]);

    const isGreeting = matchWord(lowerMessage, [
      'hi', 'hello', 'hey', 'yo', 'greetings', 'sup'
    ]);

    const isHelp = matchWord(lowerMessage, [
      'help', 'how', 'work', 'guide', 'tutorial'
    ]);

    if (isPredictionRequest) {
        if (history.length > 0) {
          const predictionResult = generatePrediction(history);
          
          setPrediction({
            color: predictionResult.color,
            size: predictionResult.size,
            confidence: predictionResult.confidence
          });
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: predictionResult.explanation
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "🐺 I need data to make a prediction! Please **upload a screenshot** of the recent Wingo rounds first."
          }]);
        }
    } else if (isGreeting) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "👋 **Hello!** I'm WOLF AI. \n\nI can help you analyze Wingo patterns and predict the next result. Just upload a screenshot to get started!"
        }]);
    } else if (isHelp) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "💡 **How to use WOLF AI:**\n\n1. Take a screenshot of the Wingo game history (last 10+ rounds).\n2. Click 'Upload Screenshot' or drop the image here.\n3. I'll automatically extract the data and give you a prediction.\n4. You can then ask me for updates or specific analysis!"
        }]);
    } else {
        // Smart General Chat Response
        const chatResponse = generateChatResponse(lowerMessage);
        
        if (chatResponse) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: chatResponse
            }]);
        } else {
            // Fallback (should rarely be reached given the engine has fallbacks)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm analyzing the data streams... 🐺\n\nIf you want a prediction, please upload a screenshot. For anything else, I'm all ears!"
            }]);
        }
    }
    
    setIsLoading(false);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden relative selection:bg-white/20">
      <StarfieldBackground />
      
      {/* Header */}
      <div className="flex-none border-b border-white/10 bg-black/40 backdrop-blur-xl z-50">
        <header className="relative">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shadow-premium border border-white/20 flex-shrink-0">
                  <img src={wolfLogo} alt="WOLF AI Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none font-display">
                    WOLF AI
                  </h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest mt-1 font-medium">Expert Predictions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                      <User className="w-3.5 h-3.5 text-white/70" />
                      <span className="text-xs text-white/90 font-medium">{user.email?.split('@')[0]}</span>
                    </div>
                    <Button
                      onClick={handleSignOut}
                      variant="ghost"
                      size="icon"
                      className="w-9 h-9 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full transition-all"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => navigate('/auth')}
                    variant="outline"
                    className="h-9 px-4 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white transition-all text-xs font-medium rounded-full"
                  >
                    <LogIn className="w-3.5 h-3.5 mr-2" />
                    Sign In
                  </Button>
                )}
                <HelpPricingSidebar />
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content - Fixed Flex Layout */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-[1600px] w-full mx-auto p-4 sm:p-6 gap-4 sm:gap-6">
        
        {/* Mobile Tabs */}
        <div className="flex lg:hidden bg-zinc-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shrink-0 shadow-2xl mx-2 mt-2">
            <button
                onClick={() => setActiveTab('chat')}
                className={cn(
                    "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300",
                    activeTab === 'chat' 
                        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-[1.02]" 
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
            >
                💬 AI Chat
            </button>
            <button
                onClick={() => setActiveTab('tools')}
                className={cn(
                    "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300",
                    activeTab === 'tools' 
                        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-[1.02]" 
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
            >
                🛠️ Tools & Upload
            </button>
        </div>

        <div className="flex-1 flex overflow-hidden gap-6">
            {/* Left Column: Chat Interface (Scrollable) */}
            <div className={cn(
                "flex-1 flex flex-col bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative z-10 transition-all",
                activeTab === 'chat' ? "flex" : "hidden lg:flex"
            )}>
                {/* Chat Header */}
                <div className="flex-none px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                    <span className="text-sm font-medium text-white/90">AI Analyst Active</span>
                  </div>
                  {history.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
                      {history.length} rounds analyzed
                    </span>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar scroll-smooth">
                  {messages.map((msg, index) => (
                    <ChatMessage key={index} role={msg.role} content={msg.content} />
                  ))}
                  {isLoading && (
                    <div className="flex gap-4 p-4 animate-fade-in opacity-70">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                      </div>
                      <div className="space-y-2">
                         <div className="text-xs text-muted-foreground font-medium">WOLF AI is thinking...</div>
                         <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                         </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area - Sticky Bottom */}
                <div className="flex-none p-4 sm:p-6 bg-black/60 border-t border-white/10 backdrop-blur-xl">
                  <div className="relative flex items-center gap-3 bg-white/5 p-1.5 rounded-xl border border-white/10 focus-within:border-white/20 focus-within:bg-white/10 transition-all duration-300">
                    <Input 
                      value={input} 
                      onChange={e => setInput(e.target.value)} 
                      onKeyPress={handleKeyPress} 
                      placeholder="Ask for analysis or betting tips..." 
                      disabled={isLoading} 
                      className="flex-1 h-10 sm:h-12 bg-transparent border-none text-white placeholder:text-muted-foreground focus-visible:ring-0 text-sm px-4" 
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={isLoading || !input.trim()} 
                      size="icon"
                      className={cn(
                        "h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-white text-black hover:bg-white/90 hover:scale-105 transition-all duration-300",
                        !input.trim() && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center mt-3 opacity-50">
                    AI predictions are for entertainment only. Play responsibly.
                  </div>
                </div>
            </div>

            {/* Right Column: Tools (Sidebar) */}
            <div className={cn(
                "flex-col w-full lg:w-[360px] gap-6 flex-none overflow-y-auto custom-scrollbar z-10 pb-4",
                activeTab === 'tools' ? "flex" : "hidden lg:flex"
            )}>
                {/* Prediction Card - Primary Focus */}
                <PredictionBox prediction={prediction} isLoading={isProcessing || isLoading} />

                {/* Upload Card */}
                <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-semibold text-white">Upload Screenshot</h3>
                     <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full">Required</span>
                  </div>
                  <ImageUpload onImageUpload={handleImageUpload} isProcessing={isProcessing} />
                  
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                    <div className="flex gap-2">
                      <div className="mt-0.5">
                        <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-[10px]">i</div>
                      </div>
                      <div className="text-[11px] leading-relaxed text-blue-200/60">
                        Upload a clear screenshot showing the last 5-10 Wingo round results for best accuracy.
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};
export default Index;