import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  TrendingUp,
  DollarSign,
  Users,
  MapPin,
  Tag
} from 'lucide-react';
import { API_BASE_URL } from '@/config';
import type { PredictionResponse } from '@/types';

export function PredictionTester() {
  const [amount, setAmount] = useState('150');
  const [category, setCategory] = useState('B');
  const [userType, setUserType] = useState('new');
  const [region, setRegion] = useState('north');
  const [week, setWeek] = useState('4');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          user_type: userType,
          region,
          week: parseInt(week)
        })
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.9) return 'text-green-400';
    if (confidence > 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPredictionColor = (prediction: number) => {
    return prediction === 1 ? 'text-blue-400' : 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              Test Prediction
            </CardTitle>
            <CardDescription>
              Submit a sample to see model prediction and drift warnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="week" className="text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Week
                </Label>
                <Select value={week} onValueChange={setWeek}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select week" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="1">Week 1 (Baseline)</SelectItem>
                    <SelectItem value="2">Week 2</SelectItem>
                    <SelectItem value="3">Week 3</SelectItem>
                    <SelectItem value="4">Week 4 (Drifted)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-300 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="A">Category A</SelectItem>
                    <SelectItem value="B">Category B</SelectItem>
                    <SelectItem value="C">Category C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userType" className="text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  User Type
                </Label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="User Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="new">New User</SelectItem>
                    <SelectItem value="old">Old User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region" className="text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Region
                </Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="north">North</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handlePredict}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⚡</span>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Get Prediction
                </span>
              )}
            </Button>

            {error && (
              <Alert className="border-red-800 bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Result Display */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Prediction Result
            </CardTitle>
            <CardDescription>
              Model output with confidence and drift warnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Prediction */}
                <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-sm text-slate-400 mb-1">Prediction</p>
                  <p className={`text-4xl font-bold ${getPredictionColor(result.prediction)}`}>
                    {result.prediction === 1 ? 'APPROVED' : 'REJECTED'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Score: {(result.score * 100).toFixed(1)}%
                  </p>
                </div>

                {/* Confidence */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Confidence</span>
                    <span className={`text-xl font-bold ${getConfidenceColor(result.confidence)}`}>
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        result.confidence > 0.9 ? 'bg-green-500' : 
                        result.confidence > 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Drift Warning */}
                {result.drift_warning ? (
                  <Alert className="border-amber-800 bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-400">
                      {result.drift_warning}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-green-800 bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-400">
                      Input within expected range - no drift detected
                    </AlertDescription>
                  </Alert>
                )}

                {/* Timestamp */}
                <p className="text-xs text-slate-500 text-center">
                  {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Submit a prediction to see results</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-slate-200">Baseline Amount</p>
                <p className="text-2xl font-bold text-blue-400">$100.14</p>
                <p className="text-xs text-slate-500">Training distribution mean</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-slate-200">Drift Threshold</p>
                <p className="text-2xl font-bold text-amber-400">2σ</p>
                <p className="text-xs text-slate-500">Warnings beyond 2 std devs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-slate-200">Model Confidence</p>
                <p className="text-2xl font-bold text-green-400">99.9%</p>
                <p className="text-xs text-slate-500">Average on training data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">How to Test Drift Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">1.</span>
              <span>Try amount = <span className="text-green-400">$100</span> (baseline) - should work normally</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">2.</span>
              <span>Try amount = <span className="text-yellow-400">$140</span> (2σ) - should show warning</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">3.</span>
              <span>Try amount = <span className="text-red-400">$200</span> (3σ) - should show extreme warning</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
