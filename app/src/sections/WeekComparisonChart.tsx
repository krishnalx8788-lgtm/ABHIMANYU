import { useMemo } from 'react';
import { 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import type { WeekComparison } from '@/types';

interface WeekComparisonChartProps {
  data: WeekComparison[];
}

export function WeekComparisonChart({ data }: WeekComparisonChartProps) {
  const chartData = useMemo(() => {
    return data.map(week => ({
      week: `Week ${week.week}`,
      accuracy: Math.round(week.accuracy * 100),
      confidence: Math.round(week.confidence * 100),
      amountMean: week.amount_mean
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ color: string; name: string; value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="text-slate-200 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Accuracy vs Confidence Divergence
        </CardTitle>
        <CardDescription>
          The silent degradation problem: confidence stays high while accuracy drops
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="week" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                domain={[0, 100]}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar 
                dataKey="accuracy" 
                name="Actual Accuracy" 
                fill="#ef4444" 
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                name="Model Confidence" 
                stroke="#22c55e" 
                strokeWidth={3}
                dot={{ fill: '#22c55e', r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-400">
            <span className="text-red-400 font-medium">Red bars</span> show actual accuracy dropping from 100% to ~48%.
            <span className="text-green-400 font-medium"> Green line</span> shows confidence remaining near 100%.
            This is the <span className="text-amber-400">silent degradation</span> problem.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
