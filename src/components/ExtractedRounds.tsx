import { WingoRound } from '@/utils/ocr';

interface ExtractedRoundsProps {
  rounds: WingoRound[];
}

export const ExtractedRounds = ({ rounds }: ExtractedRoundsProps) => {
  if (rounds.length === 0) return null;

  const getColorClasses = (color: string) => {
    switch (color.toLowerCase()) {
      case 'red':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'green':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'violet':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-white/10 text-white/70 border-white/20';
    }
  };

  const last10 = rounds.slice(-10);

  return (
    <div className="w-full bg-black/40 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-white">Extracted Last 10 Rounds</h3>
        <span className="text-[9px] sm:text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
          {last10.length} Rounds
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {last10.map((round, index) => (
          <div
            key={round.round}
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-2.5 sm:p-3"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[10px] sm:text-xs text-white/50 font-mono shrink-0">
                #{index + 1}
              </span>
              <span className="text-[10px] sm:text-xs text-white/40 font-mono truncate">
                {round.round}
              </span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="text-sm sm:text-lg font-bold text-white">{round.number}</span>
              </div>
              
              <div className={`px-2 sm:px-3 py-1 rounded-full border text-[10px] sm:text-xs font-medium uppercase ${getColorClasses(round.color)}`}>
                {round.color}
              </div>
              
              <div className={`px-2 sm:px-3 py-1 rounded-full border text-[10px] sm:text-xs font-medium uppercase ${
                round.number >= 5 
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
              }`}>
                {round.number >= 5 ? 'BIG' : 'SMALL'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-2.5 sm:p-3">
        <div className="flex gap-2">
          <div className="mt-0.5 shrink-0">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-[9px] sm:text-[10px]">!</div>
          </div>
          <div className="text-[10px] sm:text-[11px] leading-relaxed text-yellow-200/60">
            Verify these extracted rounds match your screenshot. If numbers or colors are wrong, try uploading a clearer, cropped screenshot showing only the results table.
          </div>
        </div>
      </div>
    </div>
  );
};
