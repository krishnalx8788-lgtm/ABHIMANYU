"""
Model Drift Detection API

This API provides comprehensive drift detection for ML models in production.
It demonstrates the "silent degradation" problem where model confidence remains
high even as actual accuracy plummets due to data drift.

Key Features:
- Model predictions with confidence scoring
- Unsupervised drift detection (no ground truth required)
- Subgroup drift analysis
- Performance degradation tracking
"""

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import pickle
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import asdict

# Import drift detection modules
from drift_detection import (
    PSIDetector, KSDetector, WassersteinDetector,
    ConfidenceAnalyzer, SubgroupAnalyzer,
    calculate_drift_score
)
def to_native(obj):
    """Convert numpy types to native Python types (recursively)."""
    if isinstance(obj, dict):
        return {k: to_native(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_native(v) for v in obj]
    if isinstance(obj, tuple):
        return tuple(to_native(v) for v in obj)
    if isinstance(obj, np.generic):
        return obj.item()
    return obj

app = FastAPI(
    title="Model Drift Monitor API",
    description="Detect silent model degradation due to data drift",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "model", "model.pkl")
BASELINE_PATH = os.path.join(BASE_DIR, "baseline", "baseline.json")
FEATURES_PATH = os.path.join(BASE_DIR, "model", "features.json")
DATA_PATH = os.path.join(BASE_DIR, "data")

# Admin key
ADMIN_KEY = "silent-admin-123"

# Load model
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

# Load baseline
with open(BASELINE_PATH, "r") as f:
    baseline = json.load(f)

# Load features
with open(FEATURES_PATH, "r") as f:
    features_info = json.load(f)

# Initialize drift detectors
psi_detector = PSIDetector(threshold=0.25)
ks_detector = KSDetector(alpha=0.05)
wasserstein_detector = WassersteinDetector(threshold=0.3)
confidence_analyzer = ConfidenceAnalyzer(confidence_threshold=0.7)
subgroup_analyzer = SubgroupAnalyzer(
    categorical_features=["category", "user_type", "region"]
)
# ================= DRIFT RESULT NORMALIZER =================

def unpack_drift_result(result):
    """
    Normalize drift detector outputs to (score, details)
    Works with DriftReport objects or tuples
    """
    if isinstance(result, tuple):
        return result

    if hasattr(result, "__dict__"):
        data = result.__dict__

        for key in [
            "metric_value",
            "value",
            "drift_score",
            "statistic",
            "distance",
            "psi",
            "score",
        ]:
            if key in data and isinstance(data[key], (int, float)):
                return float(data[key]), data

        for v in data.values():
            if isinstance(v, (int, float)):
                return float(v), data

    raise ValueError(f"Unsupported drift result type: {type(result)}")
# ================= PATCH PSI DETECTOR =================

_original_psi_detect = psi_detector.detect

def patched_psi_detect(*args, **kwargs):
    result = _original_psi_detect(*args, **kwargs)
    return unpack_drift_result(result)

psi_detector.detect = patched_psi_detect

# ================= PATCH calculate_drift_score =================

_original_calculate_drift_score = calculate_drift_score

def patched_calculate_drift_score(*args, **kwargs):
    result = _original_calculate_drift_score(*args, **kwargs)
    return unpack_drift_result(result)

calculate_drift_score = patched_calculate_drift_score


# In-memory storage for predictions and logs
prediction_logs: List[Dict] = []
weekly_data: Dict[str, pd.DataFrame] = {}

# Load all weekly data
for week in [1, 2, 3, 4]:
    try:
        weekly_data[f"week{week}"] = pd.read_csv(
            os.path.join(DATA_PATH, f"week{week}.csv")
        )
    except Exception as e:
        print(f"Warning: Could not load week{week}.csv: {e}")


# Pydantic models
class PredictRequest(BaseModel):
    amount: float = Field(..., description="Transaction amount")
    category: str = Field(..., description="Category (A, B, or C)")
    user_type: str = Field(..., description="User type (new or old)")
    region: str = Field(..., description="Region (north or south)")
    week: int = Field(default=1, description="Week number for tracking")


class PredictResponse(BaseModel):
    prediction: int
    score: float
    confidence: float
    timestamp: str
    drift_warning: Optional[str] = None


class DriftStatus(BaseModel):
    status: str
    drift_score: float
    drift_level: str
    confidence_trend: str
    details: Dict[str, Any]


class WeekComparison(BaseModel):
    week: int
    accuracy: float
    confidence: float
    prediction_rate: float
    true_label_rate: float
    amount_mean: float
    drift_detected: bool


# Helper functions
def prepare_features(amount, category, user_type, region):
    """Prepare feature vector for model prediction."""
    cat_map = {"A": 0, "B": 1, "C": 2}
    user_map = {"new": 0, "old": 1}
    region_map = {"north": 0, "south": 1}
    
    return np.array([[
        amount,
        cat_map.get(category, 0),
        user_map.get(user_type, 0),
        region_map.get(region, 0)
    ]])


def check_input_drift(amount: float) -> Optional[str]:
    """Check if input features show signs of drift."""
    baseline_mean = baseline.get("amount_mean", 100)
    baseline_std = baseline.get("amount_std", 20)
    
    # Check if amount is within 3 standard deviations
    z_score = abs(amount - baseline_mean) / baseline_std
    
    if z_score > 3:
        return f"EXTREME: Input amount ({amount:.2f}) is {z_score:.1f} std from baseline"
    elif z_score > 2:
        return f"WARNING: Input amount ({amount:.2f}) is {z_score:.1f} std from baseline"
    return None


@app.get("/")
def root():
    """API root endpoint."""
    return {
        "name": "Model Drift Monitor API",
        "version": "1.0.0",
        "endpoints": [
            "/predict - Make predictions with drift monitoring",
            "/drift-status - Get current drift status",
            "/week-comparison - Compare model performance across weeks",
            "/subgroup-analysis - Analyze drift by subgroups",
            "/unsupervised-drift - Drift detection without ground truth",
            "/silent-degradation - Demonstrate the silent degradation problem"
        ]
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """
    Make a prediction with drift monitoring.
    
    This endpoint demonstrates how model confidence can remain high
    even when the input data has drifted significantly from training distribution.
    """
    # Check for input drift
    drift_warning = check_input_drift(req.amount)
    
    # Prepare features
    features = prepare_features(req.amount, req.category, req.user_type, req.region)
    
    # Make prediction
    prediction = int(model.predict(features)[0])
    proba = model.predict_proba(features)[0]
    confidence = float(np.max(proba))
    score = float(proba[1])  # Probability of class 1
    
    timestamp = datetime.utcnow().isoformat()
    
    # Log prediction
    log_entry = {
        "timestamp": timestamp,
        "amount": req.amount,
        "category": req.category,
        "user_type": req.user_type,
        "region": req.region,
        "week": req.week,
        "prediction": prediction,
        "confidence": confidence,
        "score": score,
        "drift_warning": drift_warning
    }
    prediction_logs.append(log_entry)
    
    return PredictResponse(
        prediction=prediction,
        score=score,
        confidence=confidence,
        timestamp=timestamp,
        drift_warning=drift_warning
    )


@app.get("/drift-status", response_model=DriftStatus)
def drift_status():
    """
    Get current drift status based on logged predictions.
    
    This uses unsupervised methods that don't require ground truth labels.
    """
    if not prediction_logs:
        return DriftStatus(
            status="WAITING_DATA",
            drift_score=0.0,
            drift_level="UNKNOWN",
            confidence_trend="UNKNOWN",
            details={"message": "No predictions logged yet"}
        )
    
    # Extract confidences and amounts from logs
    confidences = [log["confidence"] for log in prediction_logs]
    amounts = [log["amount"] for log in prediction_logs]
    
    # Compare with baseline
    baseline_conf = baseline.get("avg_confidence", 0.8)
    baseline_amount_mean = baseline.get("amount_mean", 100)
    baseline_amount_std = baseline.get("amount_std", 20)
    
    # Calculate drift scores
    current_conf = np.mean(confidences)
    current_amount_mean = np.mean(amounts)
    current_amount_std = np.std(amounts)
    
    # Confidence drift (inverse - lower confidence is worse)
    conf_drift = max(0, baseline_conf - current_conf)
    
    # Amount distribution drift
    amount_drift = abs(current_amount_mean - baseline_amount_mean) / baseline_amount_std
    
    # Combined drift score
    drift_score = min(1.0, (conf_drift * 0.3 + min(amount_drift / 3, 1.0) * 0.7))
    
    # Determine drift level
    if drift_score < 0.2:
        drift_level = "STABLE"
        status = "HEALTHY"
    elif drift_score < 0.4:
        drift_level = "WARNING"
        status = "MONITORING_RECOMMENDED"
    elif drift_score < 0.6:
        drift_level = "MODERATE"
        status = "ATTENTION_REQUIRED"
    else:
        drift_level = "CRITICAL"
        status = "IMMEDIATE_ACTION"
    
    # Confidence trend
    if current_conf >= baseline_conf * 0.95:
        confidence_trend = "STABLE"
    elif current_conf >= baseline_conf * 0.8:
        confidence_trend = "DECLINING"
    else:
        confidence_trend = "DEGRADED"
    
    return DriftStatus(
        status=status,
        drift_score=round(drift_score, 3),
        drift_level=drift_level,
        confidence_trend=confidence_trend,
        details={
            "baseline_confidence": round(baseline_conf, 3),
            "current_confidence": round(current_conf, 3),
            "baseline_amount_mean": round(baseline_amount_mean, 2),
            "current_amount_mean": round(current_amount_mean, 2),
            "amount_z_score": round(amount_drift, 2),
            "total_predictions": len(prediction_logs),
            "drift_indicators": [
                "Confidence remains stable but may not reflect true accuracy",
                "Input distribution has shifted from baseline",
                "Model may be making confident but incorrect predictions"
            ]
        }
    )


@app.get("/week-comparison")
def week_comparison():
    """
    Compare model performance across all weeks.
    
    This demonstrates the silent degradation problem:
    - Week 1: 100% accuracy (training data)
    - Week 2-4: Gradual accuracy decline
    - But confidence remains near 100% throughout!
    """
    comparisons = []
    
    for week_num in [1, 2, 3, 4]:
        week_key = f"week{week_num}"
        if week_key not in weekly_data:
            continue
        
        df = weekly_data[week_key]
        
        # Prepare features
        cat_map = {"A": 0, "B": 1, "C": 2}
        user_map = {"new": 0, "old": 1}
        region_map = {"north": 0, "south": 1}
        
        X = pd.DataFrame({
            'amount': df['amount'],
            'category': df['category'].map(cat_map),
            'user_type': df['user_type'].map(user_map),
            'region': df['region'].map(region_map)
        })
        y = df['label']
        
        # Predictions
        y_pred = model.predict(X)
        y_proba = model.predict_proba(X)
        
        # Metrics
        accuracy = float((y_pred == y).mean())
        confidence = float(np.max(y_proba, axis=1).mean())
        prediction_rate = float(y_pred.mean())
        true_label_rate = float(y.mean())
        
        # Detect drift using PSI
        if week_num > 1:
            baseline_amounts = weekly_data['week1']['amount'].values
            current_amounts = df['amount'].values
            psi_score, psi_details = psi_detector.detect(
                baseline_amounts, current_amounts, f"amount_week{week_num}"
            )
            drift_detected = psi_score > 0.25
        else:
            drift_detected = False
        
        comparisons.append({
            "week": week_num,
            "accuracy": round(accuracy, 3),
            "confidence": round(confidence, 3),
            "prediction_rate": round(prediction_rate, 3),
            "true_label_rate": round(true_label_rate, 3),
            "amount_mean": round(df['amount'].mean(), 2),
            "amount_std": round(df['amount'].std(), 2),
            "drift_detected": drift_detected,
            "sample_size": len(df)
        })
    
    return {
        "comparison": comparisons,
        "insight": "Model confidence remains high (~100%) even as accuracy drops from 100% to ~48%",
        "silent_degradation_evidence": {
            "confidence_stable": all(c["confidence"] > 0.99 for c in comparisons),
            "accuracy_declining": comparisons[0]["accuracy"] - comparisons[-1]["accuracy"] > 0.5
        }
    }


@app.get("/subgroup-analysis")
def subgroup_analysis(week: int = Query(4, description="Week to analyze")):
    """
    Analyze drift within subgroups (category, user_type, region).
    
    This demonstrates localized bias emergence - performance may degrade
    for specific subgroups while aggregate metrics look acceptable.
    """
    week_key = f"week{week}"
    if week_key not in weekly_data:
        raise HTTPException(status_code=404, detail=f"Week {week} data not found")
    
    current_df = weekly_data[week_key]
    baseline_df = weekly_data['week1']
    
    # Run subgroup analysis
    results = subgroup_analyzer.analyze_subgroups(
        baseline_df, current_df, target_column="amount"
    )
    
    # Add prediction accuracy by subgroup
    cat_map = {"A": 0, "B": 1, "C": 2}
    user_map = {"new": 0, "old": 1}
    region_map = {"north": 0, "south": 1}
    
    X = pd.DataFrame({
        'amount': current_df['amount'],
        'category': current_df['category'].map(cat_map),
        'user_type': current_df['user_type'].map(user_map),
        'region': current_df['region'].map(region_map)
    })
    y = current_df['label']
    y_pred = model.predict(X)
    
    current_df = current_df.copy()
    current_df['correct'] = (y_pred == y)
    current_df['confidence'] = np.max(model.predict_proba(X), axis=1)
    
    # Calculate accuracy by subgroup
    subgroup_accuracy = {}
    for feature in ["category", "user_type", "region"]:
        subgroup_accuracy[feature] = {}
        for value in current_df[feature].unique():
            mask = current_df[feature] == value
            accuracy = float(current_df[mask]['correct'].mean())
            confidence = float(current_df[mask]['confidence'].mean())
            count = int(mask.sum())
            subgroup_accuracy[feature][str(value)] = {
                "accuracy": round(accuracy, 3),
                "confidence": round(confidence, 3),
                "sample_count": count
            }
    return to_native({
        "week": week,
        "subgroup_drift": results,
        "subgroup_accuracy": subgroup_accuracy,
        "localized_bias_detected": bool(
            any(
                any(
                    s.get("drift_level") == "CRITICAL"
                    for s in r.get("subgroups", {}).values()
                    if isinstance(s, dict)
                )
                for r in results.values()
            )
        )
})



@app.get("/unsupervised-drift")
def unsupervised_drift(week: int = Query(4, description="Week to analyze")):
    """
    Demonstrate drift detection WITHOUT ground truth labels.
    
    This is crucial for real-world scenarios where labels are delayed or unavailable.
    We use statistical methods to detect distribution shifts.
    """
    week_key = f"week{week}"
    if week_key not in weekly_data:
        raise HTTPException(status_code=404, detail=f"Week {week} data not found")
    
    baseline_df = weekly_data['week1']
    current_df = weekly_data[week_key]
    
    results = {
        "week": week,
        "methods": {},
        "summary": {}
    }
    
    # PSI for amount
    psi_score, psi_details = calculate_drift_score(
        baseline_df['amount'].values,
        current_df['amount'].values
    )
    results["methods"]["psi"] = {
        "name": "Population Stability Index",
        "description": "Measures distribution shift using bin-wise comparison",
        "score": round(psi_score, 3),
        "details": psi_details
    }
    
    # KS test for amount
    from drift_detection.metrics import calculate_ks_statistic
    ks_stat, ks_details = calculate_ks_statistic(
        baseline_df['amount'].values,
        current_df['amount'].values
    )
    results["methods"]["ks_test"] = {
        "name": "Kolmogorov-Smirnov Test",
        "description": "Tests if two samples come from the same distribution",
        "statistic": round(ks_stat, 3),
        "details": ks_details
    }
    
    # Wasserstein distance
    from drift_detection.metrics import calculate_wasserstein
    w_dist, w_details = calculate_wasserstein(
        baseline_df['amount'].values,
        current_df['amount'].values
    )
    results["methods"]["wasserstein"] = {
        "name": "Wasserstein Distance",
        "description": "Earth Mover's Distance - minimum work to transform distributions",
        "distance": round(w_dist, 3),
        "details": w_details
    }
    
    # Feature-wise drift
    feature_drift = {}
    for feature in ["category", "user_type", "region"]:
        baseline_dist = baseline_df[feature].value_counts(normalize=True).to_dict()
        current_dist = current_df[feature].value_counts(normalize=True).to_dict()
        
        # Calculate distribution difference
        all_categories = set(baseline_dist.keys()) | set(current_dist.keys())
        diff = sum(
            abs(baseline_dist.get(cat, 0) - current_dist.get(cat, 0))
            for cat in all_categories
        ) / 2
        
        feature_drift[feature] = {
            "baseline_distribution": {str(k): round(v, 3) for k, v in baseline_dist.items()},
            "current_distribution": {str(k): round(v, 3) for k, v in current_dist.items()},
            "distribution_shift": round(diff, 3)
        }
    
    results["feature_drift"] = feature_drift
    
    # Overall assessment
    avg_drift = (
        psi_score * 0.4 +
        ks_stat * 0.3 +
        w_details.get("normalized", 0) * 0.3
    )
    
    results["summary"] = {
        "overall_drift_score": round(avg_drift, 3),
        "drift_level": "CRITICAL" if avg_drift > 0.6 else "MODERATE" if avg_drift > 0.3 else "WARNING" if avg_drift > 0.1 else "STABLE",
        "ground_truth_required": False,
        "interpretation": "Drift detected using statistical methods without requiring ground truth labels"
    }
    
    return results


@app.get("/silent-degradation")
def silent_degradation():
    """
    Demonstrate the core problem: silent model degradation.
    
    This endpoint clearly shows:
    1. Model confidence remains high (~100%)
    2. But actual accuracy plummets (100% → 48%)
    3. The system provides no warning without explicit monitoring
    """
    baseline_df = weekly_data['week1']
    week4_df = weekly_data['week4']
    
    # Prepare features
    cat_map = {"A": 0, "B": 1, "C": 2}
    user_map = {"new": 0, "old": 1}
    region_map = {"north": 0, "south": 1}
    
    def get_metrics(df):
        X = pd.DataFrame({
            'amount': df['amount'],
            'category': df['category'].map(cat_map),
            'user_type': df['user_type'].map(user_map),
            'region': df['region'].map(region_map)
        })
        y = df['label']
        y_pred = model.predict(X)
        y_proba = model.predict_proba(X)
        
        return {
            "accuracy": float((y_pred == y).mean()),
            "confidence": float(np.max(y_proba, axis=1).mean()),
            "prediction_distribution": {
                "class_0": float((y_pred == 0).mean()),
                "class_1": float((y_pred == 1).mean())
            }
        }
    
    baseline_metrics = get_metrics(baseline_df)
    week4_metrics = get_metrics(week4_df)
    
    return {
        "problem": "Silent Model Degradation",
        "description": "Model continues producing confident predictions while accuracy degrades",
        "evidence": {
            "baseline_week1": {
                "accuracy": round(baseline_metrics["accuracy"], 3),
                "confidence": round(baseline_metrics["confidence"], 3),
                "amount_mean": round(baseline_df['amount'].mean(), 2)
            },
            "current_week4": {
                "accuracy": round(week4_metrics["accuracy"], 3),
                "confidence": round(week4_metrics["confidence"], 3),
                "amount_mean": round(week4_df['amount'].mean(), 2)
            },
            "degradation": {
                "accuracy_drop": round(baseline_metrics["accuracy"] - week4_metrics["accuracy"], 3),
                "confidence_change": round(week4_metrics["confidence"] - baseline_metrics["confidence"], 3),
                "data_shift": round(week4_df['amount'].mean() - baseline_df['amount'].mean(), 2)
            }
        },
        "why_this_is_dangerous": [
            "Model reports 99.9% confidence on week4 data",
            "But actual accuracy is only 48.6% (worse than random!)",
            "Without ground truth, we would not know performance degraded",
            "System appears healthy while making poor decisions"
        ],
        "detection_methods": [
            "Monitor input distribution (PSI, KS test)",
            "Track prediction distribution shifts",
            "Use confidence calibration techniques",
            "Implement out-of-distribution detection"
        ]
    }


@app.get("/admin/overview")
def admin_overview(x_admin_key: str = Header(None)):
    """Admin overview endpoint."""
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Admin access denied")
    
    files = os.listdir(DATA_PATH) if os.path.exists(DATA_PATH) else []
    
    return {
        "data_files": files,
        "total_predictions_logged": len(prediction_logs),
        "baseline_info": baseline,
        "model_features": features_info,
        "weekly_data_loaded": list(weekly_data.keys()),
        "drift_detectors": {
            "psi": "Population Stability Index",
            "ks": "Kolmogorov-Smirnov Test",
            "wasserstein": "Wasserstein Distance",
            "subgroup": "Subgroup Analysis"
        }
    }


@app.post("/admin/clear-logs")
def clear_logs(x_admin_key: str = Header(None)):
    """Clear prediction logs."""
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Admin access denied")
    
    global prediction_logs
    prediction_logs = []
    
    return {"status": "Logs cleared"}


# Serve static files (frontend)
static_dir = os.path.join(BASE_DIR, "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    @app.get("/")
    def serve_frontend():
        """Serve the frontend application."""
        return FileResponse(os.path.join(static_dir, "index.html"))
    
    @app.get("/{path:path}")
    def serve_frontend_routes(path: str):
        """Serve frontend routes."""
        file_path = os.path.join(static_dir, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)