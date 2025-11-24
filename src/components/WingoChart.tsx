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
    <div className="w-full">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
          <XAxis 
            dataKey="round" 
            stroke="hsl(0 0% 60%)"
            fontSize={10}
            tick={{ fill: 'hsl(0 0% 60%)' }}
          />
          <YAxis 
            stroke="hsl(0 0% 60%)" 
            fontSize={10}
            tick={{ fill: 'hsl(0 0% 60%)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(0 0% 5%)', 
              border: '1px solid hsl(0 0% 20%)',
              borderRadius: '6px',
              color: 'hsl(0 0% 100%)',
              fontSize: '12px'
            }}
          />
          <Legend 
            wrapperStyle={{
              fontSize: '11px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="redCount" 
            stroke="hsl(var(--wingo-red))" 
            strokeWidth={2}
            name="Red"
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="greenCount" 
            stroke="hsl(var(--wingo-green))" 
            strokeWidth={2}
            name="Green"
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="violetCount" 
            stroke="hsl(var(--wingo-violet))" 
            strokeWidth={2}
            name="Violet"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
