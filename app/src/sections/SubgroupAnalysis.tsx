import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import type { SubgroupAnalysis as SubgroupAnalysisType } from '@/types';

interface SubgroupAnalysisProps {
  data: SubgroupAnalysisType | null;
}

export function SubgroupAnalysis({ data }: SubgroupAnalysisProps) {
  if (!data) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <p className="text-slate-400">No subgroup data available</p>
        </CardContent>
      </Card>
    );
  }

  const getDriftColor = (level?: string) => {
    switch (level) {
      case 'STABLE': return 'bg-green-500';
      case 'WARNING': return 'bg-yellow-500';
      case 'MODERATE': return 'bg-orange-500';
      case 'CRITICAL': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getBadgeVariant = (level?: string) => {
    switch (level) {
      case 'STABLE': return 'default';
      case 'WARNING': return 'secondary';
      case 'MODERATE': return 'destructive';
      case 'CRITICAL': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert for localized bias */}
      {data.localized_bias_detected && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="text-amber-400 font-medium">Localized Bias Detected</h4>
            <p className="text-slate-400 text-sm mt-1">
              Some subgroups show significantly different drift patterns. Aggregate metrics may hide these issues.
            </p>
          </div>
        </div>
      )}

      {/* Subgroup Accuracy */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Accuracy by Subgroup
          </CardTitle>
          <CardDescription>
            Performance varies across different subgroups - aggregate metrics can be misleading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(data.subgroup_accuracy).map(([feature, subgroups]) => (
              <div key={feature} className="space-y-3">
                <h4 className="text-sm font-medium text-slate-300 capitalize flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  {feature}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(subgroups).map(([value, info]) => (
                    <div 
                      key={value} 
                      className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400 capitalize">{value}</span>
                        <Badge 
                          variant={info.accuracy > 0.7 ? 'default' : info.accuracy > 0.5 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {info.accuracy > 0.7 ? 'Good' : info.accuracy > 0.5 ? 'Fair' : 'Poor'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Accuracy</span>
                          <span className={info.accuracy < 0.5 ? 'text-red-400' : 'text-slate-200'}>
                            {(info.accuracy * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={info.accuracy * 100} 
                          className={`h-2 ${info.accuracy < 0.5 ? 'bg-red-500' : info.accuracy < 0.7 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>Confidence: {(info.confidence * 100).toFixed(1)}%</span>
                          <span>n={info.sample_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subgroup Drift Analysis */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Distribution Drift by Subgroup
          </CardTitle>
          <CardDescription>
            Statistical drift detection within each feature subgroup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(data.subgroup_drift).map(([feature, analysis]) => (
              <div key={feature} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-300 capitalize">{feature}</h4>
                  <div className="flex items-center gap-2">
                    {analysis.summary.critical_count ? (
                      <Badge variant="destructive" className="text-xs">
                        {analysis.summary.critical_count} Critical
                      </Badge>
                    ) : null}
                    {analysis.summary.warning_count ? (
                      <Badge variant="secondary" className="text-xs">
                        {analysis.summary.warning_count} Warning
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(analysis.subgroups).map(([value, subgroup]) => (
                    <div 
                      key={value} 
                      className={`p-3 rounded-lg border ${
                        subgroup.status === 'MISSING_DATA' 
                          ? 'bg-slate-800/30 border-slate-700/30' 
                          : 'bg-slate-800/50 border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400 capitalize">{value}</span>
                        {subgroup.status === 'ANALYZED' && subgroup.drift_level && (
                          <Badge 
                            variant={getBadgeVariant(subgroup.drift_level)}
                            className="text-xs"
                          >
                            {subgroup.drift_level}
                          </Badge>
                        )}
                      </div>

                      {subgroup.status === 'MISSING_DATA' ? (
                        <p className="text-xs text-slate-500">
                          Missing data for this subgroup
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {subgroup.drift_score !== undefined && (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500">Drift Score</span>
                                <span className="text-slate-300">
                                  {(subgroup.drift_score * 100).toFixed(1)}%
                                </span>
                              </div>
                              <Progress 
                                value={subgroup.drift_score * 100}
                                className={`h-1.5 ${getDriftColor(subgroup.drift_level)}`}
                              />
                            </div>
                          )}

                          {subgroup.baseline_stats && subgroup.current_stats && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-slate-500">
                                <span className="block">Baseline</span>
                                <span className="text-slate-300">
                                  μ={subgroup.baseline_stats.mean.toFixed(1)}
                                </span>
                              </div>
                              <div className="text-slate-500">
                                <span className="block">Current</span>
                                <span className="text-slate-300">
                                  μ={subgroup.current_stats.mean.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-slate-400">Stable Subgroups</p>
                <p className="text-xl font-bold text-slate-200">
                  {Object.values(data.subgroup_drift).reduce(
                    (acc, curr) => acc + (curr.summary.stable_count || 0), 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-slate-400">Warning Subgroups</p>
                <p className="text-xl font-bold text-slate-200">
                  {Object.values(data.subgroup_drift).reduce(
                    (acc, curr) => acc + (curr.summary.warning_count || 0), 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-slate-400">Critical Subgroups</p>
                <p className="text-xl font-bold text-slate-200">
                  {Object.values(data.subgroup_drift).reduce(
                    (acc, curr) => acc + (curr.summary.critical_count || 0), 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
