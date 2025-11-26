import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ImageUpload';
import { StarfieldBackground } from '@/components/StarfieldBackground';
import { HelpPricingSidebar } from '@/components/HelpPricingSidebar';
import { PredictionBox } from '@/components/PredictionBox';
import { extractWingoData, WingoRound } from '@/utils/ocr';
import { generatePrediction } from '@/utils/predictionEngine';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogIn, LogOut, User } from 'lucide-react';
import wolfLogo from '@/assets/wolf-logo.jpg';
import { User as SupabaseUser } from '@supabase/supabase-js';

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<WingoRound[]>([]);
  const [prediction, setPrediction] = useState<{ color: string; size: string; confidence: number } | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

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
      
      toast({
        title: 'Screenshot Processed',
        description: `Extracted ${rounds.length} rounds successfully!`
      });
      
      // Generate prediction locally
      const predictionResult = generatePrediction(rounds);
      
      // Update prediction state
      setPrediction({
        color: predictionResult.color,
        size: predictionResult.size,
        confidence: predictionResult.confidence
      });
      
      setExplanation(predictionResult.explanation);
      
      toast({
        title: '🎯 Prediction Ready!',
        description: `Strategy: ${predictionResult.strategy}`
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

      {/* Main Content - Simplified Centered Layout */}
      <main className="flex-1 flex flex-col items-center overflow-y-auto custom-scrollbar w-full max-w-3xl mx-auto p-4 sm:p-6 gap-6 pb-24 animate-in fade-in duration-500">
        
        {/* Prediction Section - Delay 0ms */}
        <div className="w-full shrink-0 animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-backwards">
            <PredictionBox prediction={prediction} isLoading={isProcessing} />
        </div>


        {/* Risk Management Tip - Delay 200ms */}
        <div className="w-full shrink-0 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200 fill-mode-backwards bg-gradient-to-r from-zinc-900/80 to-black border border-white/20 rounded-2xl p-5 flex items-start gap-4 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md relative group hover:border-white/40 transition-all">
          {/* Glow Effect - confined by rounded-2xl */}
          <div className="absolute top-0 left-0 w-1 h-full bg-white/50 group-hover:bg-white transition-colors rounded-l-full"></div>
          
          <div className="p-2 bg-white/10 rounded-lg shrink-0 mt-0.5 group-hover:bg-white/20 transition-colors">
            <div className="w-6 h-6 flex items-center justify-center text-white font-bold text-xl">🛡️</div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-1 flex items-center gap-2 flex-wrap">
               Risk Management
               <span className="text-[10px] bg-white text-black px-1.5 py-0.5 rounded font-bold whitespace-nowrap">ESSENTIAL</span>
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed group-hover:text-zinc-200 transition-colors mb-3 break-words">
              Bet <strong className="text-white bg-white/10 px-1 rounded">50%</strong> on <strong className="text-white">Size</strong> and <strong className="text-white bg-white/10 px-1 rounded">50%</strong> on <strong className="text-white">Color</strong>. This diversification strategy protects your bankroll against single-outcome losses.
            </p>
            
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-xs overflow-x-auto">
               <div className="font-bold text-white mb-1 flex items-center gap-1 whitespace-nowrap">
                 💡 Example (Total Bet: ₹100)
               </div>
               <ul className="space-y-1 text-zinc-400 pl-1">
                  <li className="flex items-center gap-2 whitespace-nowrap">
                     <span className="w-1 h-1 bg-white rounded-full shrink-0"></span>
                     Bet <span className="text-white font-medium">₹50</span> on Color (e.g. Red)
                  </li>
                  <li className="flex items-center gap-2 whitespace-nowrap">
                     <span className="w-1 h-1 bg-white rounded-full shrink-0"></span>
                     Bet <span className="text-white font-medium">₹50</span> on Size (e.g. Big)
                  </li>
               </ul>
            </div>
          </div>
        </div>

        {/* Upload Section - Delay 300ms */}
        <div className="w-full shrink-0 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300 fill-mode-backwards bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-4 shadow-lg">
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
                Upload a clear screenshot showing the last 5-10 Wingo round results. The AI will analyze streaks and patterns to predict the next color.
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
export default Index;