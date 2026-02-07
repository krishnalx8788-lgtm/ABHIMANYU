export interface WeekComparison {
  week: number;
  accuracy: number;
  confidence: number;
  prediction_rate: number;
  true_label_rate: number;
  amount_mean: number;
  amount_std: number;
  drift_detected: boolean;
  sample_size: number;
}

export interface DriftStatus {
  status: string;
  drift_score: number;
  drift_level: string;
  confidence_trend: string;
  details: {
    baseline_confidence: number;
    current_confidence: number;
    baseline_amount_mean: number;
    current_amount_mean: number;
    amount_z_score: number;
    total_predictions: number;
    drift_indicators: string[];
  };
}

export interface PredictionResponse {
  prediction: number;
  score: number;
  confidence: number;
  timestamp: string;
  drift_warning?: string;
}

export interface SubgroupInfo {
  accuracy: number;
  confidence: number;
  sample_count: number;
}

export interface SubgroupAnalysis {
  week: number;
  subgroup_drift: Record<string, {
    subgroups: Record<string, {
      status: string;
      drift_score?: number;
      drift_level?: string;
      baseline_stats?: { mean: number; std: number; count: number };
      current_stats?: { mean: number; std: number; count: number };
    }>;
    summary: {
      total_subgroups: number;
      analyzed: number;
      avg_drift_score?: number;
      max_drift_score?: number;
      critical_count?: number;
      warning_count?: number;
      stable_count?: number;
    };
  }>;
  subgroup_accuracy: Record<string, Record<string, SubgroupInfo>>;
  localized_bias_detected: boolean;
}

export interface UnsupervisedDrift {
  week: number;
  methods: Record<string, {
    name: string;
    description: string;
    score?: number;
    statistic?: number;
    distance?: number;
    details: Record<string, unknown>;
  }>;
  feature_drift: Record<string, {
    baseline_distribution: Record<string, number>;
    current_distribution: Record<string, number>;
    distribution_shift: number;
  }>;
  summary: {
    overall_drift_score: number;
    drift_level: string;
    ground_truth_required: boolean;
    interpretation: string;
  };
}

export interface SilentDegradation {
  problem: string;
  description: string;
  evidence: {
    baseline_week1: {
      accuracy: number;
      confidence: number;
      amount_mean: number;
    };
    current_week4: {
      accuracy: number;
      confidence: number;
      amount_mean: number;
    };
    degradation: {
      accuracy_drop: number;
      confidence_change: number;
      data_shift: number;
    };
  };
  why_this_is_dangerous: string[];
  detection_methods: string[];
}
