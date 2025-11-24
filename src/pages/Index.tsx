import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/components/ChatMessage';
import { ImageUpload } from '@/components/ImageUpload';
import { WingoChart } from '@/components/WingoChart';
import { WingoHistory } from '@/components/WingoHistory';
import { extractWingoData, WingoRound } from '@/utils/ocr';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "🐺 Welcome to WOLF AI! I'm your expert Wingo color prediction analyst.\n\nUpload a screenshot of past Wingo rounds, and I'll analyze patterns to predict the next color with confidence. Let's beat the odds together!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<WingoRound[]>([]);
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const rounds = await extractWingoData(file);
      setHistory(rounds);
      
      setMessages(prev => [...prev, 
        {
          role: 'user',
          content: `Uploaded screenshot with ${rounds.length} rounds`
        },
        {
          role: 'assistant',
          content: `Perfect! I've extracted ${rounds.length} rounds from your screenshot. Check out the data below. Ready for my expert prediction?`
        }
      ]);

      toast({
        title: 'Screenshot Processed',
        description: `Extracted ${rounds.length} rounds successfully!`,
      });
    } catch (error) {
      console.error('Image processing error:', error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Could not process image',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPrediction = async (userMessage: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('wingo-predict', {
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
        variant: 'destructive',
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

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header with glow effect */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-glow" />
        <header className="relative border-b border-border backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-glow">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-wingo-violet bg-clip-text text-transparent">
                  WOLF AI
                </h1>
                <p className="text-sm text-muted-foreground">Expert Wingo Prediction System</p>
              </div>
            </div>
          </div>
        </header>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main chat area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chat messages */}
            <div className="bg-card rounded-xl shadow-card p-6 min-h-[500px] max-h-[600px] overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <ChatMessage key={index} role={msg.role} content={msg.content} />
              ))}
              {isLoading && (
                <div className="flex gap-4 p-4 rounded-lg bg-card">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-2">WOLF AI</div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="bg-card rounded-xl shadow-card p-4">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask WOLF AI for predictions..."
                  disabled={isLoading}
                  className="flex-1 bg-background border-border"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image upload */}
            <ImageUpload 
              onImageUpload={handleImageUpload}
              isProcessing={isProcessing}
            />

            {/* History display */}
            {history.length > 0 && (
              <>
                <WingoHistory data={history} />
                <WingoChart data={history} />
              </>
            )}

            {/* Disclaimer */}
            <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border border-border text-xs text-muted-foreground">
              <p className="font-semibold mb-2">⚠️ Disclaimer</p>
              <p>Predictions are for entertainment purposes only. Gambling involves risk. This is not financial advice. Play responsibly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
