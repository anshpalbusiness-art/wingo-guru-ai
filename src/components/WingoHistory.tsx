import { WingoRound } from '@/utils/ocr';
import { cn } from '@/lib/utils';

interface WingoHistoryProps {
  data: WingoRound[];
}

export const WingoHistory = ({ data }: WingoHistoryProps) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-card p-4 rounded-lg shadow-premium border border-white/10">
      <h3 className="text-lg font-semibold mb-4 text-white">Extracted History</h3>
      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {data.slice().reverse().map((round, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Round {round.round}
              </span>
              <div className="w-10 h-10 rounded-sm bg-white/10 flex items-center justify-center font-bold text-lg text-white border border-white/20">
                {round.number}
              </div>
            </div>
            <div className={cn(
              "px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border",
              round.color === 'Red' && "bg-wingo-red/20 text-wingo-red border-wingo-red/30",
              round.color === 'Green' && "bg-wingo-green/20 text-wingo-green border-wingo-green/30",
              round.color === 'Violet' && "bg-wingo-violet/20 text-wingo-violet border-wingo-violet/30"
            )}>
              {round.color}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
