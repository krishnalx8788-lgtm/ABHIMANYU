"""
Drift detector classes for comprehensive model monitoring.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from dataclasses import dataclass, field
from collections import defaultdict

from .metrics import (
    calculate_psi,
    calculate_ks_statistic,
    calculate_wasserstein,
    calculate_drift_score
)


@dataclass
class DriftReport:
    """Container for drift detection results."""
    timestamp: str
    feature_name: str
    drift_score: float
    drift_level: str
    metrics: Dict[str, Any]
    baseline_stats: Dict[str, float]
    current_stats: Dict[str, float]
    sample_sizes: Dict[str, int]


class PSIDetector:
    """Population Stability Index-based drift detector."""
    
    def __init__(self, threshold: float = 0.25):
        self.threshold = threshold
        self.history: List[DriftReport] = []
    
    def detect(
        self, 
        baseline: np.ndarray, 
        current: np.ndarray,
        feature_name: str = "unknown"
    ) -> DriftReport:
        """Detect drift using PSI."""
        psi_value, psi_details = calculate_psi(baseline, current)
        
        # Determine drift level
        if psi_value < 0.1:
            drift_level = "STABLE"
        elif psi_value < 0.25:
            drift_level = "WARNING"
        else:
            drift_level = "CRITICAL"
        
        report = DriftReport(
            timestamp=datetime.utcnow().isoformat(),
            feature_name=feature_name,
            drift_score=psi_value,
            drift_level=drift_level,
            metrics={"psi": psi_details},
            baseline_stats=self._calculate_stats(baseline),
            current_stats=self._calculate_stats(current),
            sample_sizes={"baseline": len(baseline), "current": len(current)}
        )
        
        self.history.append(report)
        return report
    
    def _calculate_stats(self, data: np.ndarray) -> Dict[str, float]:
        """Calculate basic statistics."""
        return {
            "mean": float(np.mean(data)),
            "std": float(np.std(data)),
            "min": float(np.min(data)),
            "max": float(np.max(data)),
            "median": float(np.median(data))
        }


class KSDetector:
    """Kolmogorov-Smirnov test-based drift detector."""
    
    def __init__(self, alpha: float = 0.05):
        self.alpha = alpha
        self.history: List[DriftReport] = []
    
    def detect(
        self, 
        baseline: np.ndarray, 
        current: np.ndarray,
        feature_name: str = "unknown"
    ) -> DriftReport:
        """Detect drift using KS test."""
        ks_stat, ks_details = calculate_ks_statistic(baseline, current)
        
        # Determine drift level based on p-value
        p_value = ks_details.get("p_value", 1.0)
        if p_value < 0.01:
            drift_level = "CRITICAL"
        elif p_value < 0.05:
            drift_level = "WARNING"
        else:
            drift_level = "STABLE"
        
        report = DriftReport(
            timestamp=datetime.utcnow().isoformat(),
            feature_name=feature_name,
            drift_score=ks_stat,
            drift_level=drift_level,
            metrics={"ks": ks_details},
            baseline_stats=self._calculate_stats(baseline),
            current_stats=self._calculate_stats(current),
            sample_sizes={"baseline": len(baseline), "current": len(current)}
        )
        
        self.history.append(report)
        return report
    
    def _calculate_stats(self, data: np.ndarray) -> Dict[str, float]:
        """Calculate basic statistics."""
        return {
            "mean": float(np.mean(data)),
            "std": float(np.std(data)),
            "min": float(np.min(data)),
            "max": float(np.max(data)),
            "median": float(np.median(data))
        }


class WassersteinDetector:
    """Wasserstein distance-based drift detector."""
    
    def __init__(self, threshold: float = 0.3):
        self.threshold = threshold
        self.history: List[DriftReport] = []
    
    def detect(
        self, 
        baseline: np.ndarray, 
        current: np.ndarray,
        feature_name: str = "unknown"
    ) -> DriftReport:
        """Detect drift using Wasserstein distance."""
        distance, details = calculate_wasserstein(baseline, current)
        normalized = details.get("normalized", 0)
        
        # Determine drift level
        if normalized < 0.1:
            drift_level = "STABLE"
        elif normalized < 0.3:
            drift_level = "WARNING"
        else:
            drift_level = "CRITICAL"
        
        report = DriftReport(
            timestamp=datetime.utcnow().isoformat(),
            feature_name=feature_name,
            drift_score=normalized,
            drift_level=drift_level,
            metrics={"wasserstein": details},
            baseline_stats=self._calculate_stats(baseline),
            current_stats=self._calculate_stats(current),
            sample_sizes={"baseline": len(baseline), "current": len(current)}
        )
        
        self.history.append(report)
        return report
    
    def _calculate_stats(self, data: np.ndarray) -> Dict[str, float]:
        """Calculate basic statistics."""
        return {
            "mean": float(np.mean(data)),
            "std": float(np.std(data)),
            "min": float(np.min(data)),
            "max": float(np.max(data)),
            "median": float(np.median(data))
        }


class ConfidenceAnalyzer:
    """Analyze model confidence scores for drift detection."""
    
    def __init__(self, confidence_threshold: float = 0.7):
        self.confidence_threshold = confidence_threshold
        self.baseline_confidences: List[float] = []
        self.current_confidences: List[float] = []
    
    def set_baseline(self, confidences: List[float]):
        """Set baseline confidence scores."""
        self.baseline_confidences = confidences
    
    def add_predictions(self, confidences: List[float]):
        """Add new prediction confidences."""
        self.current_confidences.extend(confidences)
    
    def analyze(self) -> Dict[str, Any]:
        """Analyze confidence drift."""
        if not self.baseline_confidences or not self.current_confidences:
            return {"error": "Insufficient data for analysis"}
        
        baseline = np.array(self.baseline_confidences)
        current = np.array(self.current_confidences)
        
        # Calculate drift using multiple metrics
        drift_result = calculate_drift_score(baseline, current)
        
        # Additional confidence-specific metrics
        low_confidence_rate = np.mean(current < self.confidence_threshold)
        baseline_low_conf = np.mean(baseline < self.confidence_threshold)
        
        analysis = {
            "drift_score": drift_result["drift_score"],
            "drift_level": drift_result["drift_level"],
            "metrics": drift_result["metrics"],
            "confidence_metrics": {
                "baseline_mean": float(np.mean(baseline)),
                "current_mean": float(np.mean(current)),
                "baseline_std": float(np.std(baseline)),
                "current_std": float(np.std(current)),
                "low_confidence_rate": float(low_confidence_rate),
                "baseline_low_confidence_rate": float(baseline_low_conf),
                "confidence_degradation": float(low_confidence_rate - baseline_low_conf)
            }
        }
        
        return analysis
    
    def reset_current(self):
        """Reset current confidences while keeping baseline."""
        self.current_confidences = []


class SubgroupAnalyzer:
    """Analyze drift within subgroups of data."""
    
    def __init__(self, categorical_features: List[str]):
        self.categorical_features = categorical_features
        self.subgroup_reports: Dict[str, List[DriftReport]] = defaultdict(list)
    
    def analyze_subgroups(
        self,
        baseline_df: pd.DataFrame,
        current_df: pd.DataFrame,
        target_column: str = "amount"
    ) -> Dict[str, Any]:
        """Analyze drift within each subgroup."""
        results = {}
        
        for feature in self.categorical_features:
            if feature not in baseline_df.columns or feature not in current_df.columns:
                continue
            
            subgroups = {}
            baseline_groups = baseline_df.groupby(feature)
            current_groups = current_df.groupby(feature)
            
            all_categories = set(baseline_groups.groups.keys()) | set(current_groups.groups.keys())
            
            for category in all_categories:
                baseline_data = baseline_groups.get_group(category)[target_column].values if category in baseline_groups.groups else np.array([])
                current_data = current_groups.get_group(category)[target_column].values if category in current_groups.groups else np.array([])
                
                if len(baseline_data) == 0 or len(current_data) == 0:
                    subgroups[str(category)] = {
                        "status": "MISSING_DATA",
                        "baseline_count": len(baseline_data),
                        "current_count": len(current_data)
                    }
                    continue
                
                # Calculate drift for this subgroup
                drift_result = calculate_drift_score(baseline_data, current_data)
                
                subgroups[str(category)] = {
                    "status": "ANALYZED",
                    "drift_score": drift_result["drift_score"],
                    "drift_level": drift_result["drift_level"],
                    "baseline_stats": {
                        "mean": float(np.mean(baseline_data)),
                        "std": float(np.std(baseline_data)),
                        "count": len(baseline_data)
                    },
                    "current_stats": {
                        "mean": float(np.mean(current_data)),
                        "std": float(np.std(current_data)),
                        "count": len(current_data)
                    },
                    "metrics": drift_result["metrics"]
                }
            
            results[feature] = {
                "subgroups": subgroups,
                "summary": self._summarize_subgroups(subgroups)
            }
        
        return results
    
    def _summarize_subgroups(self, subgroups: Dict) -> Dict[str, Any]:
        """Create summary statistics for subgroups."""
        analyzed = [s for s in subgroups.values() if s.get("status") == "ANALYZED"]
        
        if not analyzed:
            return {"total_subgroups": len(subgroups), "analyzed": 0}
        
        drift_scores = [s["drift_score"] for s in analyzed]
        drift_levels = [s["drift_level"] for s in analyzed]
        
        return {
            "total_subgroups": len(subgroups),
            "analyzed": len(analyzed),
            "avg_drift_score": float(np.mean(drift_scores)),
            "max_drift_score": float(np.max(drift_scores)),
            "critical_count": drift_levels.count("CRITICAL"),
            "warning_count": drift_levels.count("WARNING"),
            "stable_count": drift_levels.count("STABLE")
        }
