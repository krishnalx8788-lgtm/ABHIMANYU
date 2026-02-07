import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ShieldAlert, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
  Search
} from 'lucide-react';
import type { SilentDegradation } from '@/types';

interface SilentDegradationViewProps {
  data: SilentDegradation | null;
}

export function SilentDegradationView({ data }: SilentDegradationViewProps) {
  if (!data) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <p className="text-slate-400">No degradation data available</p>
        </CardContent>
      </Card>
    );
  }

  const { evidence, why_this_is_dangerous, detection_methods } = data;

  return (
    <div className="space-y-6">
      {/* Problem Statement */}
      <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            {data.problem}
          </CardTitle>
          <CardDescription className="text-slate-300">
            {data.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Evidence Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Baseline (Week 1) */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Baseline (Week 1)
            </CardTitle>
            <CardDescription>
              Training data - model performs as expected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-400">
                  {(evidence.baseline_week1.accuracy * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-slate-400 mt-1">Accuracy</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-400">
                  {(evidence.baseline_week1.confidence * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-slate-400 mt-1">Confidence</p>
              </div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mean Amount</span>
                <span className="text-slate-200 font-medium">
                  ${evidence.baseline_week1.amount_mean.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current (Week 4) */}
        <Card className="bg-slate-900 border-red-800/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Current (Week 4)
            </CardTitle>
            <CardDescription>
              After data drift - model is confidently wrong
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-red-900/20 rounded-lg text-center border border-red-800/30">
                <p className="text-3xl font-bold text-red-400">
                  {(evidence.current_week4.accuracy * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-slate-400 mt-1">Accuracy</p>
              </div>
              <div className="p-3 bg-green-900/20 rounded-lg text-center border border-green-800/30">
                <p className="text-3xl font-bold text-green-400">
                  {(evidence.current_week4.confidence * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-slate-400 mt-1">Confidence</p>
              </div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mean Amount</span>
                <span className="text-amber-400 font-medium">
                  ${evidence.current_week4.amount_mean.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Degradation Metrics */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Degradation Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Accuracy Drop</span>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  -{(evidence.degradation.accuracy_drop * 100).toFixed(1)}%
                </Badge>
              </div>
              <Progress 
                value={(1 - evidence.degradation.accuracy_drop) * 100}
                className="h-3 bg-red-500"
              />
              <p className="text-xs text-slate-500">
                From {(evidence.baseline_week1.accuracy * 100).toFixed(0)}% to {(evidence.current_week4.accuracy * 100).toFixed(1)}%
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Confidence Change</span>
                <Badge 
                  variant={evidence.degradation.confidence_change >= 0 ? 'default' : 'secondary'}
                  className="text-lg px-3 py-1"
                >
                  {evidence.degradation.confidence_change >= 0 ? '+' : ''}
                  {(evidence.degradation.confidence_change * 100).toFixed(1)}%
                </Badge>
              </div>
              <Progress 
                value={evidence.current_week4.confidence * 100}
                className="h-3 bg-green-500"
              />
              <p className="text-xs text-slate-500">
                Confidence actually increased!
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Data Shift</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  +${evidence.degradation.data_shift.toFixed(0)}
                </Badge>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500"
                  style={{ width: '100%' }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Mean amount increased by ~100%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why This Is Dangerous */}
      <Card className="bg-slate-900 border-red-800/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Why This Is Dangerous
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {why_this_is_dangerous.map((item, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-red-900/10 rounded-lg border border-red-800/20">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Detection Methods */}
      <Card className="bg-slate-900 border-green-800/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-green-500" />
            Detection Methods (No Ground Truth Required)
          </CardTitle>
          <CardDescription>
            These unsupervised methods can detect drift without waiting for labels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detection_methods.map((method, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 bg-green-900/10 rounded-lg border border-green-800/20"
              >
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">{method}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insight */}
      <div className="p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-800/30">
        <div className="flex items-start gap-4">
          <Brain className="w-10 h-10 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Key Insight</h3>
            <p className="text-slate-300">
              The model was trained on data with amounts around $100. When amounts shifted to ~$200 in Week 4, 
              the model's decision boundary no longer matched the data distribution. However, the model 
              remained <span className="text-green-400 font-medium">highly confident</span> in its predictions 
              because it was never trained to recognize when inputs are out-of-distribution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
