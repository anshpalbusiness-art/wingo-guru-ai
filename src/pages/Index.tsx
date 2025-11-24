import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/components/ChatMessage';
import { ImageUpload } from '@/components/ImageUpload';
import { WingoChart } from '@/components/WingoChart';
import { WingoHistory } from '@/components/WingoHistory';
import { StarfieldBackground } from '@/components/StarfieldBackground';
import { extractWingoData, WingoRound } from '@/utils/ocr';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import wolfLogo from '@/assets/wolf-logo.jpg';
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
  const {
    toast
  } = useToast();
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
      
      // Automatically get prediction
      setIsProcessing(false);
      await getPrediction('Analyze this data and give me your expert prediction');
      
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
    setInput('');
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);
    await getPrediction(userMessage);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return <div className="min-h-screen bg-black flex flex-col relative">
      <StarfieldBackground />
      
      {/* Header */}
      <div className="relative border-b border-white/10 bg-black/40 backdrop-blur-xl z-10">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        <header className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-sm overflow-hidden shadow-premium border border-white/30 flex-shrink-0">
                  <img src={wolfLogo} alt="WOLF AI Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none font-display">
                    WOLF AI
                  </h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest mt-1 font-medium">Expert Predictions</p>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr_380px] gap-4 sm:gap-6 lg:gap-8 h-full">
          {/* Main Chat Section */}
          <div className="flex flex-col gap-4 sm:gap-6 order-2 lg:order-1">
            {/* Chat Container */}
            <div className="flex-1 bg-black/60 rounded-lg border border-white/10 shadow-premium backdrop-blur-sm flex flex-col min-h-[400px] lg:min-h-[500px]">
              {/* Chat Header */}
              <div className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-white font-display">AI Analysis</h2>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      {history.length > 0 ? `${history.length} rounds analyzed` : 'Upload screenshot to begin'}
                    </p>
                  </div>
                  {history.length > 0 && <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-muted-foreground hidden sm:inline">Ready</span>
                    </div>}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">
                {messages.map((msg, index) => <ChatMessage key={index} role={msg.role} content={msg.content} />)}
                {isLoading && <div className="flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg bg-black/40 border border-white/10 animate-fade-in">
                    <div className="flex-shrink-0 w-10 h-10 rounded-sm overflow-hidden bg-gradient-premium flex items-center justify-center animate-glow border border-white/20">
                      <img src={wolfLogo} alt="WOLF AI" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-2 text-white font-display">WOLF AI</div>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{
                      animationDelay: '0ms'
                    }} />
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{
                      animationDelay: '150ms'
                    }} />
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{
                      animationDelay: '300ms'
                    }} />
                      </div>
                    </div>
                  </div>}
              </div>

              {/* Input Area */}
              <div className="border-t border-white/10 p-3 sm:p-4 bg-black/40">
                <div className="flex gap-2 sm:gap-3">
                  <Input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyPress={handleKeyPress} 
                    placeholder="Ask WOLF AI..." 
                    disabled={isLoading} 
                    className="flex-1 h-11 sm:h-12 bg-black/60 border-white/20 text-white placeholder:text-muted-foreground focus:border-white/50 transition-colors text-sm" 
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={isLoading || !input.trim()} 
                    className={cn(
                      "h-11 sm:h-12 px-4 sm:px-6 bg-gradient-premium text-black hover:shadow-glow border border-white/30 font-semibold transition-all hover:scale-105",
                      input.trim() && !isLoading && "animate-pulse-glow"
                    )}
                  >
                    <Send className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="flex flex-col gap-4 sm:gap-6 order-1 lg:order-2">
            {/* Upload Section */}
            <div className="bg-black/60 rounded-lg border border-white/10 shadow-premium backdrop-blur-sm p-4 sm:p-6">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white font-display">Upload Data</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Screenshot of Wingo rounds</p>
              </div>
              <ImageUpload onImageUpload={handleImageUpload} isProcessing={isProcessing} />
            </div>

            {/* Data Panels */}
            {history.length > 0 && <>
                {/* History */}
                <div className="bg-black/60 rounded-lg border border-white/10 shadow-premium backdrop-blur-sm">
                  <div className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white font-display">Round History</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Last {history.length} rounds</p>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="max-h-[250px] sm:max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {history.slice().reverse().map((round, index) => <div key={index} className="flex items-center justify-between p-2.5 sm:p-3 bg-black/40 rounded border border-white/5 hover:border-white/20 transition-colors">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono w-16 sm:w-20">
                              #{round.round}
                            </span>
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-white/10 flex items-center justify-center font-bold text-sm sm:text-base text-white border border-white/20">
                              {round.number}
                            </div>
                          </div>
                          <div className={cn("px-2.5 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border", round.color === 'Red' && "bg-wingo-red/20 text-wingo-red border-wingo-red/30", round.color === 'Green' && "bg-wingo-green/20 text-wingo-green border-wingo-green/30", round.color === 'Violet' && "bg-wingo-violet/20 text-wingo-violet border-wingo-violet/30")}>
                            {round.color}
                          </div>
                        </div>)}
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-black/60 rounded-lg border border-white/10 shadow-premium backdrop-blur-sm">
                  <div className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white font-display">Trend Analysis</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Color frequency patterns</p>
                  </div>
                  <div className="p-4 sm:p-6">
                    <WingoChart data={history} />
                  </div>
                </div>
              </>}

            {/* Disclaimer */}
            <div className="bg-black/60 backdrop-blur-sm p-4 sm:p-5 rounded-lg border border-white/20 text-xs">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl">⚠️</span>
                <div>
                  <p className="font-bold text-white mb-2 uppercase tracking-wider text-[10px] sm:text-xs font-display">Important Notice</p>
                  <p className="text-muted-foreground leading-relaxed text-[10px] sm:text-xs">
                    All predictions are for entertainment purposes only. Gambling involves substantial risk. 
                    This is not financial advice. Always play responsibly and within your means.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;