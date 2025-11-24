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
    content: "🐺 Welcome to WOLF AI! I'm your expert Wingo color prediction analyst.\n\nUpload a screenshot of past Wingo rounds, and I'll analyze patterns to predict the next color with confidence. Let's beat the odds together!"
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
      setMessages(prev => [...prev, {
        role: 'user',
        content: `Uploaded screenshot with ${rounds.length} rounds`
      }, {
        role: 'assistant',
        content: `Perfect! I've extracted ${rounds.length} rounds from your screenshot. Check out the data below. Ready for my expert prediction?`
      }]);
      toast({
        title: 'Screenshot Processed',
        description: `Extracted ${rounds.length} rounds successfully!`
      });
    } catch (error) {
      console.error('Image processing error:', error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Could not process image',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  const getPrediction = async (userMessage: string) => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('wingo-predict', {
        body: {
          history,
          message: userMessage
        }
      });
      if (error) {
        throw error;
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.prediction
      }]);
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: 'Prediction Failed',
        description: error instanceof Error ? error.message : 'Could not get prediction',
        variant: 'destructive'
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble analyzing right now. Please try again in a moment."
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
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-sm overflow-hidden shadow-premium border border-white/30">
                  <img src={wolfLogo} alt="WOLF AI Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight leading-none">
                    WOLF AI
                  </h1>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Expert Wingo Predictions</p>
                </div>
              </div>
              
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 h-full">
          {/* Main Chat Section */}
          <div className="flex flex-col gap-6">
            {/* Chat Container */}
            <div className="flex-1 bg-black/60 rounded-lg border border-white/10 shadow-premium backdrop-blur-sm flex flex-col">
              {/* Chat Header */}
              <div className="border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">AI Analysis</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {history.length > 0 ? `${history.length} rounds analyzed` : 'Upload screenshot to begin'}
                    </p>
                  </div>
                  {history.length > 0 && <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-muted-foreground">Ready</span>
                    </div>}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 min-h-[400px] max-h-[500px]">
                {messages.map((msg, index) => <ChatMessage key={index} role={msg.role} content={msg.content} />)}
                {isLoading && <div className="flex gap-4 p-5 rounded-lg bg-black/40 border border-white/10 animate-fade-in">
                    <div className="flex-shrink-0 w-10 h-10 rounded-sm overflow-hidden bg-gradient-premium flex items-center justify-center animate-glow border border-white/20">
                      <img src={wolfLogo} alt="WOLF AI" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-2 text-white">WOLF AI</div>
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
              <div className="border-t border-white/10 p-4 bg-black/40">
                <div className="flex gap-3">
                  <Input value={input} onChange={e => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask WOLF AI for expert predictions..." disabled={isLoading} className="flex-1 h-12 bg-black/60 border-white/20 text-white placeholder:text-muted-foreground focus:border-white/50 transition-colors" />
                  <Button onClick={handleSend} disabled={isLoading || !input.trim()} className={cn("h-12 px-6 bg-gradient-premium text-black hover:shadow-glow border border-white/30 font-semibold transition-all hover:scale-105", input.trim() && !isLoading && "animate-pulse-glow")}>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Upload Section */}
            <div className="bg-black/60 rounded-lg border border-white/10 shadow-premium backdrop-blur-sm p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Upload Data</h3>
                <p className="text-xs text-muted-foreground mt-1">Screenshot of Wingo rounds</p>
              </div>
              <ImageUpload onImageUpload={handleImageUpload} isProcessing={isProcessing} />
            </div>

            {/* Data Panels */}
            {history.length > 0 && <>
                {/* History */}
                <div className="bg-black/60 rounded-lg border border-white/10 shadow-premium backdrop-blur-sm">
                  <div className="border-b border-white/10 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white">Round History</h3>
                    <p className="text-xs text-muted-foreground mt-1">Last {history.length} rounds</p>
                  </div>
                  <div className="p-6">
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {history.slice().reverse().map((round, index) => <div key={index} className="flex items-center justify-between p-3 bg-black/40 rounded border border-white/5 hover:border-white/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground font-mono w-20">
                              #{round.round}
                            </span>
                            <div className="w-9 h-9 rounded bg-white/10 flex items-center justify-center font-bold text-base text-white border border-white/20">
                              {round.number}
                            </div>
                          </div>
                          <div className={cn("px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border", round.color === 'Red' && "bg-wingo-red/20 text-wingo-red border-wingo-red/30", round.color === 'Green' && "bg-wingo-green/20 text-wingo-green border-wingo-green/30", round.color === 'Violet' && "bg-wingo-violet/20 text-wingo-violet border-wingo-violet/30")}>
                            {round.color}
                          </div>
                        </div>)}
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-black/60 rounded-lg border border-white/10 shadow-premium backdrop-blur-sm">
                  <div className="border-b border-white/10 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white">Trend Analysis</h3>
                    <p className="text-xs text-muted-foreground mt-1">Color frequency patterns</p>
                  </div>
                  <div className="p-6">
                    <WingoChart data={history} />
                  </div>
                </div>
              </>}

            {/* Disclaimer */}
            <div className="bg-black/60 backdrop-blur-sm p-5 rounded-lg border border-white/20 text-xs">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-bold text-white mb-2 uppercase tracking-wider">Important Notice</p>
                  <p className="text-muted-foreground leading-relaxed">
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