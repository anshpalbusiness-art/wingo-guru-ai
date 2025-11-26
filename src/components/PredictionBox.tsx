
import { Target, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PredictionBoxProps {
  prediction: {
    color: string;
    size: string;
    confidence: number;
  } | null;
  isLoading?: boolean;
}

export const PredictionBox = ({ prediction, isLoading = false }: PredictionBoxProps) => {

  const getColorClass = (color: string) => {
    switch (color.toLowerCase()) {
      case 'red':
        return 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]';
      case 'green':
        return 'bg-green-600 text-white border-green-500 shadow-[0_0_15px_rgba(22,163,74,0.4)]';
      case 'violet':
        return 'bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.4)]';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden shadow-2xl ring-1 ring-white/5">
      {/* Header */}
      <div className="bg-white/5 p-3 sm:p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-wingo-gold" />
          <h3 className="text-xs sm:text-sm font-bold text-white font-display tracking-wider">
            NEXT ROUND
          </h3>
        </div>
        {prediction && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/5">
                Confidence: {prediction.confidence}%
            </span>
        )}
      </div>

      {/* Predictions */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="text-center py-8 sm:py-12 space-y-3 sm:space-y-4">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto">
                 <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin"></div>
                 <Loader2 className="absolute inset-0 m-auto w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="space-y-1">
                <p className="text-xs sm:text-sm font-medium text-white">Analyzing...</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Reading screenshot</p>
            </div>
          </div>
        ) : !prediction ? (
          // Before upload - show placeholder
          <div className="text-center py-6 sm:py-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center">
              <Target className="w-8 h-8 sm:w-10 sm:h-10 text-white/20" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[200px] mx-auto">
              Waiting for round data...
            </p>
          </div>
        ) : (
          // After upload - show predictions
          <div className="space-y-4 sm:space-y-6">
            
            {/* Main Result Card */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Color */}
                <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground text-center font-semibold">Color</p>
                    <div
                        className={cn(
                            'aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center border-2 active:scale-[0.98] sm:hover:scale-[1.02] transition-transform',
                            getColorClass(prediction.color)
                        )}
                    >
                        <span className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wider">
                            {prediction.color}
                        </span>
                    </div>
                </div>

                {/* Size */}
                <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground text-center font-semibold">Size</p>
                    <div className="aspect-square rounded-xl sm:rounded-2xl bg-zinc-800 border-2 border-zinc-700 text-white flex items-center justify-center active:scale-[0.98] sm:hover:scale-[1.02] transition-transform">
                        <span className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wider">
                            {prediction.size}
                        </span>
                    </div>
                </div>
            </div>

            {/* Confidence Bar */}
            <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/5">
              <div className="flex justify-between text-[10px] sm:text-xs font-medium text-white/80 mb-2">
                <span>Probability</span>
                <span>{prediction.confidence}%</span>
              </div>
              <div className="h-1 sm:h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
