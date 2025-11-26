
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
    <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl ring-1 ring-white/5">
      {/* Header */}
      <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-wingo-gold" />
          <h3 className="text-sm font-bold text-white font-display tracking-wider">
            NEXT ROUND PREDICTION
          </h3>
        </div>
        {prediction && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/5">
                Confidence: {prediction.confidence}%
            </span>
        )}
      </div>

      {/* Predictions */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-12 space-y-4">
            <div className="relative w-16 h-16 mx-auto">
                 <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin"></div>
                 <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-white animate-pulse">Analyzing Wingo Pattern...</p>
                <p className="text-xs text-muted-foreground">Calculating probabilities</p>
            </div>
          </div>
        ) : !prediction ? (
          // Before upload - show placeholder
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center group hover:scale-110 transition-transform duration-500">
              <Target className="w-10 h-10 text-white/20 group-hover:text-white/40 transition-colors" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
              Waiting for round data...
            </p>
          </div>
        ) : (
          // After upload - show predictions
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Main Result Card */}
            <div className="grid grid-cols-2 gap-4">
                {/* Color */}
                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center font-semibold">Color</p>
                    <div
                        className={cn(
                            'aspect-square rounded-2xl flex items-center justify-center border-2 transition-all duration-300 hover:scale-[1.02]',
                            getColorClass(prediction.color)
                        )}
                    >
                        <span className="text-xl sm:text-2xl font-black uppercase tracking-wider">
                            {prediction.color}
                        </span>
                    </div>
                </div>

                {/* Size */}
                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center font-semibold">Size</p>
                    <div className="aspect-square rounded-2xl bg-zinc-800 border-2 border-zinc-700 text-white flex items-center justify-center shadow-lg hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                        <span className="text-xl sm:text-2xl font-black uppercase tracking-wider">
                            {prediction.size}
                        </span>
                    </div>
                </div>
            </div>

            {/* Confidence Bar */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex justify-between text-xs font-medium text-white/80 mb-2">
                <span>Probability Analysis</span>
                <span>{prediction.confidence}% Reliable</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out"
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
