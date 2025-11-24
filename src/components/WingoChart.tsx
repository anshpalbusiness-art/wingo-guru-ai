import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WingoRound } from '@/utils/ocr';

interface WingoChartProps {
  data: WingoRound[];
}

export const WingoChart = ({ data }: WingoChartProps) => {
  if (!data || data.length === 0) return null;

  // Transform data for chart
  const chartData = data.slice(-20).map((round, index) => ({
    round: round.round,
    number: round.number,
    redCount: data.slice(Math.max(0, index - 4), index + 1).filter(r => r.color === 'Red').length,
    greenCount: data.slice(Math.max(0, index - 4), index + 1).filter(r => r.color === 'Green').length,
    violetCount: data.slice(Math.max(0, index - 4), index + 1).filter(r => r.color === 'Violet').length,
  }));

  return (
    <div className="bg-card p-4 rounded-lg shadow-premium border border-white/10">
      <h3 className="text-lg font-semibold mb-4 text-white">Pattern Analysis (Last 20 Rounds)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
          <XAxis 
            dataKey="round" 
            stroke="hsl(0 0% 60%)"
            fontSize={12}
          />
          <YAxis stroke="hsl(0 0% 60%)" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(0 0% 5%)', 
              border: '1px solid hsl(0 0% 20%)',
              borderRadius: '8px',
              color: 'hsl(0 0% 100%)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="redCount" 
            stroke="hsl(var(--wingo-red))" 
            strokeWidth={2}
            name="Red Streak"
          />
          <Line 
            type="monotone" 
            dataKey="greenCount" 
            stroke="hsl(var(--wingo-green))" 
            strokeWidth={2}
            name="Green Streak"
          />
          <Line 
            type="monotone" 
            dataKey="violetCount" 
            stroke="hsl(var(--wingo-violet))" 
            strokeWidth={2}
            name="Violet Streak"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
