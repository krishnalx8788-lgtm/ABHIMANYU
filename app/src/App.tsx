import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  ShieldAlert,
  Brain,
  Database,
  GitCompare,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { WeekComparisonChart } from '@/sections/WeekComparisonChart';
import { DriftScoreCard } from '@/sections/DriftScoreCard';
import { SubgroupAnalysis } from '@/sections/SubgroupAnalysis';
import { SilentDegradationView } from '@/sections/SilentDegradationView';
import { PredictionTester } from '@/sections/PredictionTester';
import { API_BASE_URL } from '@/config';
import type { WeekComparison, DriftStatus, SubgroupAnalysis as SubgroupAnalysisType, SilentDegradation } from '@/types';

function App() {
  const [weekComparison, setWeekComparison] = useState<WeekComparison[]>([]);
  const [driftStatus, setDriftStatus] = useState<DriftStatus | null>(null);
  const [subgroupData, setSubgroupData] = useState<SubgroupAnalysisType | null>(null);
  const [silentDegradation, setSilentDegradation] = useState<SilentDegradation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch week comparison
      const weekRes = await fetch(`${API_BASE_URL}/week-comparison`);
      const weekData = await weekRes.json();
      setWeekComparison(weekData.comparison);

      // Fetch drift status
      const driftRes = await fetch(`${API_BASE_URL}/drift-status`);
      const driftData = await driftRes.json();
      setDriftStatus(driftData);

      // Fetch subgroup analysis
      const subgroupRes = await fetch(`${API_BASE_URL}/subgroup-analysis?week=4`);
      const subgroupData = await subgroupRes.json();
      setSubgroupData(subgroupData);

      // Fetch silent degradation
      const sdRes = await fetch(`${API_BASE_URL}/silent-degradation`);
      const sdData = await sdRes.json();
      setSilentDegradation(sdData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDriftBadgeVariant = (level: string) => {
    switch (level) {
      case 'STABLE': return 'default';
      case 'WARNING': return 'secondary';
      case 'MODERATE': return 'destructive';
      case 'CRITICAL': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading drift detection data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Model Drift Monitor
                </h1>
                <p className="text-xs text-slate-400">Detecting Silent Degradation in ML Systems</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {driftStatus && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">System Status:</span>
                  <Badge 
                    variant={getDriftBadgeVariant(driftStatus.drift_level)}
                    className={`${driftStatus.drift_level === 'CRITICAL' ? 'animate-pulse' : ''}`}
                  >
                    {driftStatus.drift_level}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Banner */}
        {silentDegradation && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-400">Silent Degradation Detected</AlertTitle>
            <AlertDescription className="text-slate-300">
              Model confidence remains at {(silentDegradation.evidence.current_week4.confidence * 100).toFixed(1)}% 
              while actual accuracy has dropped to {(silentDegradation.evidence.current_week4.accuracy * 100).toFixed(1)}%. 
              The system appears healthy but is making poor decisions.
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Drift Score</p>
                  <p className="text-2xl font-bold text-white">
                    {driftStatus ? (driftStatus.drift_score * 100).toFixed(1) : '--'}%
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <Progress 
                value={driftStatus ? driftStatus.drift_score * 100 : 0} 
                className="mt-3 h-2"
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Accuracy Drop</p>
                  <p className="text-2xl font-bold text-red-400">
                    {silentDegradation ? 
                      (silentDegradation.evidence.degradation.accuracy_drop * 100).toFixed(1) 
                      : '--'}%
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                From {(silentDegradation?.evidence.baseline_week1.accuracy || 1) * 100}% to {(silentDegradation?.evidence.current_week4.accuracy || 0) * 100}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Data Shift</p>
                  <p className="text-2xl font-bold text-amber-400">
                    +{silentDegradation ? silentDegradation.evidence.degradation.data_shift.toFixed(0) : '--'}
                  </p>
                </div>
                <Database className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Mean amount increase from baseline
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Confidence</p>
                  <p className="text-2xl font-bold text-green-400">
                    {(silentDegradation?.evidence.current_week4.confidence || 0) * 100}%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Remains high despite accuracy drop!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="degradation" className="data-[state=active]:bg-slate-800">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Silent Degradation
            </TabsTrigger>
            <TabsTrigger value="subgroups" className="data-[state=active]:bg-slate-800">
              <Users className="w-4 h-4 mr-2" />
              Subgroup Analysis
            </TabsTrigger>
            <TabsTrigger value="test" className="data-[state=active]:bg-slate-800">
              <GitCompare className="w-4 h-4 mr-2" />
              Test Predictions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeekComparisonChart data={weekComparison} />
              <DriftScoreCard data={driftStatus} />
            </div>

            {/* Week Comparison Table */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-blue-500" />
                  Performance Across Weeks
                </CardTitle>
                <CardDescription>
                  Compare model accuracy and confidence across different weeks showing data drift
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Week</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Accuracy</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Confidence</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Amount Mean</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Drift Detected</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekComparison.map((week) => (
                        <tr key={week.week} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-medium">Week {week.week}</td>
                          <td className="py-3 px-4">
                            <span className={week.accuracy < 0.6 ? 'text-red-400' : week.accuracy < 0.8 ? 'text-yellow-400' : 'text-green-400'}>
                              {(week.accuracy * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {(week.confidence * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            ${week.amount_mean.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            {week.drift_detected ? (
                              <XCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={week.accuracy > 0.9 ? 'default' : week.accuracy > 0.6 ? 'secondary' : 'destructive'}
                            >
                              {week.accuracy > 0.9 ? 'Healthy' : week.accuracy > 0.6 ? 'Degraded' : 'Critical'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="degradation">
            <SilentDegradationView data={silentDegradation} />
          </TabsContent>

          <TabsContent value="subgroups">
            <SubgroupAnalysis data={subgroupData} />
          </TabsContent>

          <TabsContent value="test">
            <PredictionTester />
          </TabsContent>
        </Tabs>

        <Separator className="my-8 bg-slate-800" />

        {/* Footer */}
        <footer className="text-center text-slate-500 text-sm">
          <p>Model Drift Monitor - Detecting silent degradation in automated decision systems</p>
          <p className="mt-1">Built with React, FastAPI, and scikit-learn</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
