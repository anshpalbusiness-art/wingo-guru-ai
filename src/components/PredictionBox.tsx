
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
        return 'bg-wingo-red/20 text-wingo-red border-wingo-red/30';
      case 'green':
        return 'bg-wingo-green/20 text-wingo-green border-wingo-green/30';
      case 'violet':
        return 'bg-wingo-violet/20 text-wingo-violet border-wingo-violet/30';
      default:
        return 'bg-white/10 text-white border-white/20';
    }
  };

  const getSizeClass = (size: string) => {
    return size.toLowerCase() === 'big'
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      : 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  };

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-premium p-3 sm:p-4">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="w-5 h-5 text-black" />
          <h3 className="text-base sm:text-lg font-bold text-black font-display">
            NEXT PREDICTION
          </h3>
        </div>
      </div>

      {/* Predictions */}
      <div className="p-4 sm:p-6 space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-wingo-gold animate-spin" />
            <p className="text-sm font-medium text-white">Analyzing Patterns...</p>
            <p className="text-xs text-muted-foreground mt-1">Extracting Wingo data</p>
          </div>
        ) : !prediction ? (
          // Before upload - show placeholder
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a screenshot to get predictions
            </p>
          </div>
        ) : (
          // After upload - show predictions
          <>
            {/* Color Prediction */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                Color Prediction
              </p>
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg border-2 font-bold text-center text-lg uppercase tracking-wider',
                    getColorClass(prediction.color)
                  )}
                >
                  {prediction.color}
                </div>
                <div className="ml-3 text-right">
                  <div className="text-2xl font-bold text-white">
                    {prediction.confidence}%
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">
                    Confidence
                  </div>
                </div>
              </div>
            </div>

            {/* Size Prediction */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                Size Prediction
              </p>
              <div
                className={cn(
                  'py-3 px-4 rounded-lg border-2 font-bold text-center text-lg uppercase tracking-wider',
                  getSizeClass(prediction.size)
                )}
              >
                {prediction.size}
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Prediction Strength</span>
                <span>{prediction.confidence}%</span>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-premium transition-all duration-500"
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
