import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import type { DriftStatus } from '@/types';

interface DriftScoreCardProps {
  data: DriftStatus | null;
}

export function DriftScoreCard({ data }: DriftScoreCardProps) {
  if (!data) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <p className="text-slate-400">No drift data available</p>
        </CardContent>
      </Card>
    );
  }

  // ✅ SAFE HELPERS (THIS FIXES THE CRASH)
  const safe = (v?: number, digits = 1) =>
    typeof v === 'number' ? v.toFixed(digits) : '—';

  const safePct = (v?: number, digits = 1) =>
    typeof v === 'number' ? (v * 100).toFixed(digits) : '—';

  const getDriftColor = (level: string) => {
    switch (level) {
      case 'STABLE': return 'text-green-400';
      case 'WARNING': return 'text-yellow-400';
      case 'MODERATE': return 'text-orange-400';
      case 'CRITICAL': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getProgressColor = (score?: number) => {
    if (typeof score !== 'number') return 'bg-slate-600';
    if (score < 0.2) return 'bg-green-500';
    if (score < 0.4) return 'bg-yellow-500';
    if (score < 0.6) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const confidenceIsCritical =
    typeof data.details?.current_confidence === 'number' &&
    typeof data.details?.baseline_confidence === 'number' &&
    data.details.current_confidence < data.details.baseline_confidence * 0.8;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Drift Detection Status
        </CardTitle>
        <CardDescription>
          Unsupervised drift detection without ground truth labels
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Drift Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">Overall Drift Score</span>
            <span className={`text-2xl font-bold ${getDriftColor(data.drift_level)}`}>
              {safePct(data.drift_score)}%
            </span>
          </div>

          <Progress
            value={typeof data.drift_score === 'number' ? data.drift_score * 100 : 0}
            className={`h-3 ${getProgressColor(data.drift_score)}`}
          />

          <div className="flex justify-between mt-1 text-xs text-slate-500">
            <span>Stable</span>
            <span>Warning</span>
            <span>Critical</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
          <span className="text-slate-400">Status</span>
          <Badge
            variant={data.drift_level === 'STABLE' ? 'default' : 'destructive'}
            className={data.drift_level === 'CRITICAL' ? 'animate-pulse' : ''}
          >
            {data.status}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Baseline Confidence</span>
            </div>
            <p className="text-lg font-semibold text-slate-200">
              {safePct(data.details?.baseline_confidence)}%
            </p>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Current Confidence</span>
            </div>
            <p className={`text-lg font-semibold ${
              confidenceIsCritical ? 'text-red-400' : 'text-slate-200'
            }`}>
              {safePct(data.details?.current_confidence)}%
            </p>
          </div>
        </div>

        {/* Amount Shift */}
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Amount Distribution Shift</span>
            <Badge
              variant={data.details?.amount_z_score && data.details.amount_z_score > 2
                ? 'destructive'
                : 'secondary'}
            >
              Z-Score: {safe(data.details?.amount_z_score, 2)}
            </Badge>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-500">
              Baseline: ${safe(data.details?.baseline_amount_mean, 2)}
            </span>
            <span className="text-slate-500">
              Current: ${safe(data.details?.current_amount_mean, 2)}
            </span>
          </div>
        </div>

        {/* Drift Indicators */}
        {Array.isArray(data.details?.drift_indicators) &&
          data.details.drift_indicators.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Drift Indicators
              </span>
              <ul className="space-y-1">
                {data.details.drift_indicators.map((indicator, index) => (
                  <li key={index} className="text-sm text-amber-400 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
