import { WingoRound } from '@/utils/ocr';
import { cn } from '@/lib/utils';

interface WingoHistoryProps {
  data: WingoRound[];
}

export const WingoHistory = ({ data }: WingoHistoryProps) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-card p-4 rounded-lg shadow-card">
      <h3 className="text-lg font-semibold mb-4">Extracted History</h3>
      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {data.slice().reverse().map((round, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 bg-secondary rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Round {round.round}
              </span>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                {round.number}
              </div>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-semibold",
              round.color === 'Red' && "bg-wingo-red/20 text-wingo-red",
              round.color === 'Green' && "bg-wingo-green/20 text-wingo-green",
              round.color === 'Violet' && "bg-wingo-violet/20 text-wingo-violet"
            )}>
              {round.color}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
