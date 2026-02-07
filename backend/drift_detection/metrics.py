"""
Core drift detection metrics implementation.
"""

import numpy as np
from scipy import stats
from typing import Dict, List, Tuple, Optional
import warnings

def calculate_psi(expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> Tuple[float, Dict]:
    """
    Calculate Population Stability Index (PSI).
    
    PSI measures the shift in distribution between two datasets.
    Interpretation:
    - PSI < 0.1: No significant change
    - 0.1 <= PSI < 0.25: Moderate change
    - PSI >= 0.25: Significant change
    
    Args:
        expected: Baseline/reference distribution
        actual: Current distribution to compare
        bins: Number of bins for discretization
        
    Returns:
        Tuple of (PSI value, detailed breakdown)
    """
    # Handle edge cases
    expected = np.array(expected).flatten()
    actual = np.array(actual).flatten()
    
    if len(expected) == 0 or len(actual) == 0:
        return 0.0, {"error": "Empty arrays provided"}
    
    # Create bins based on expected distribution
    min_val = min(expected.min(), actual.min())
    max_val = max(expected.max(), actual.max())
    
    # Add small epsilon to handle edge cases
    epsilon = 1e-10
    bin_edges = np.linspace(min_val - epsilon, max_val + epsilon, bins + 1)
    
    # Calculate histograms
    expected_counts, _ = np.histogram(expected, bins=bin_edges)
    actual_counts, _ = np.histogram(actual, bins=bin_edges)
    
    # Convert to percentages
    expected_pct = expected_counts / len(expected) + epsilon
    actual_pct = actual_counts / len(actual) + epsilon
    
    # Calculate PSI for each bin
    psi_values = (actual_pct - expected_pct) * np.log(actual_pct / expected_pct)
    psi = np.sum(psi_values)
    
    # Detailed breakdown
    breakdown = {
        "total_psi": float(psi),
        "bins": [],
        "interpretation": _interpret_psi(psi)
    }
    
    for i in range(bins):
        breakdown["bins"].append({
            "bin_range": f"[{bin_edges[i]:.3f}, {bin_edges[i+1]:.3f})",
            "expected_pct": float(expected_pct[i]),
            "actual_pct": float(actual_pct[i]),
            "psi_contribution": float(psi_values[i])
        })
    
    return float(psi), breakdown


def calculate_ks_statistic(expected: np.ndarray, actual: np.ndarray) -> Tuple[float, Dict]:
    """
    Calculate Kolmogorov-Smirnov statistic.
    
    The KS test measures the maximum difference between two cumulative distributions.
    
    Args:
        expected: Baseline/reference distribution
        actual: Current distribution to compare
        
    Returns:
        Tuple of (KS statistic, detailed results)
    """
    expected = np.array(expected).flatten()
    actual = np.array(actual).flatten()
    
    if len(expected) == 0 or len(actual) == 0:
        return 0.0, {"error": "Empty arrays provided"}
    
    statistic, p_value = stats.ks_2samp(expected, actual)
    
    # Determine significance
    alpha = 0.05
    is_significant = p_value < alpha
    
    result = {
        "ks_statistic": float(statistic),
        "p_value": float(p_value),
        "is_significant": is_significant,
        "interpretation": _interpret_ks(statistic, p_value)
    }
    
    return float(statistic), result


def calculate_wasserstein(expected: np.ndarray, actual: np.ndarray) -> Tuple[float, Dict]:
    """
    Calculate Wasserstein distance (Earth Mover's Distance).
    
    Measures the minimum "work" needed to transform one distribution into another.
    
    Args:
        expected: Baseline/reference distribution
        actual: Current distribution to compare
        
    Returns:
        Tuple of (Wasserstein distance, normalized score)
    """
    expected = np.array(expected).flatten()
    actual = np.array(actual).flatten()
    
    if len(expected) == 0 or len(actual) == 0:
        return 0.0, {"error": "Empty arrays provided"}
    
    distance = stats.wasserstein_distance(expected, actual)
    
    # Normalize by the range of expected values
    value_range = expected.max() - expected.min()
    if value_range > 0:
        normalized = distance / value_range
    else:
        normalized = 0.0
    
    result = {
        "wasserstein_distance": float(distance),
        "normalized": float(normalized),
        "interpretation": _interpret_wasserstein(normalized)
    }
    
    return float(distance), result


def calculate_drift_score(
    expected: np.ndarray, 
    actual: np.ndarray,
    weights: Optional[Dict[str, float]] = None
) -> Dict:
    """
    Calculate comprehensive drift score combining multiple metrics.
    
    Args:
        expected: Baseline/reference distribution
        actual: Current distribution to compare
        weights: Optional weights for each metric
        
    Returns:
        Dictionary with combined drift score and individual metrics
    """
    if weights is None:
        weights = {
            "psi": 0.4,
            "ks": 0.3,
            "wasserstein": 0.3
        }
    
    psi_value, psi_details = calculate_psi(expected, actual)
    ks_value, ks_details = calculate_ks_statistic(expected, actual)
    wasserstein_value, wasserstein_details = calculate_wasserstein(expected, actual)
    
    # Normalize each metric to 0-1 scale
    psi_normalized = min(psi_value / 0.5, 1.0)  # PSI > 0.5 is considered extreme
    ks_normalized = ks_value  # Already 0-1
    wasserstein_normalized = wasserstein_details.get("normalized", 0)
    
    # Calculate weighted score
    combined_score = (
        weights["psi"] * psi_normalized +
        weights["ks"] * ks_normalized +
        weights["wasserstein"] * wasserstein_normalized
    )
    
    return {
        "drift_score": float(combined_score),
        "drift_level": _get_drift_level(combined_score),
        "metrics": {
            "psi": {
                "value": psi_value,
                "normalized": psi_normalized,
                "details": psi_details
            },
            "ks_statistic": {
                "value": ks_value,
                "normalized": ks_normalized,
                "details": ks_details
            },
            "wasserstein": {
                "value": wasserstein_value,
                "normalized": wasserstein_normalized,
                "details": wasserstein_details
            }
        }
    }


def _interpret_psi(psi: float) -> str:
    """Interpret PSI value."""
    if psi < 0.1:
        return "No significant change"
    elif psi < 0.25:
        return "Moderate change - monitoring recommended"
    else:
        return "Significant change - investigation required"


def _interpret_ks(statistic: float, p_value: float) -> str:
    """Interpret KS test results."""
    if p_value < 0.01:
        return f"Highly significant difference (p={p_value:.4f})"
    elif p_value < 0.05:
        return f"Significant difference (p={p_value:.4f})"
    else:
        return f"No significant difference (p={p_value:.4f})"


def _interpret_wasserstein(normalized: float) -> str:
    """Interpret Wasserstein distance."""
    if normalized < 0.1:
        return "Minimal distribution shift"
    elif normalized < 0.3:
        return "Moderate distribution shift"
    else:
        return "Significant distribution shift"


def _get_drift_level(score: float) -> str:
    """Get overall drift level from combined score."""
    if score < 0.2:
        return "STABLE"
    elif score < 0.4:
        return "WARNING"
    elif score < 0.6:
        return "MODERATE"
    else:
        return "CRITICAL"
