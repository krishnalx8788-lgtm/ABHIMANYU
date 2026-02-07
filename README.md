# Model Drift Monitor

A comprehensive solution for detecting **silent model degradation** in automated decision systems. This application demonstrates how ML models can maintain high confidence while actual accuracy plummets due to data drift - a critical problem in production ML systems.

## Problem Statement

Machine learning systems often continue producing outputs without any reliable indication that their behavior has meaningfully changed. As data distributions drift, predictions become less accurate or biased, yet the system provides no clear signal that performance has degraded.

### Key Challenges Addressed

1. **Gradual Accuracy Loss**: Predictions slowly deviate from reality without triggering alarms
2. **Localized Bias Emergence**: Performance degrades for specific subsets while aggregate metrics hide the issue
3. **Delayed Detection**: Issues discovered only after user complaints or audits
4. **No Ground Truth**: Labels are delayed, incomplete, or unavailable for live data

## Solution Overview

This application provides:

- **ML Model**: Random Forest classifier trained on baseline data (Week 1)
- **Drift Detection**: Multiple unsupervised methods (PSI, KS-test, Wasserstein distance)
- **Subgroup Analysis**: Detect localized bias within feature subgroups
- **Interactive Dashboard**: Visualize degradation across weeks
- **Prediction Tester**: Test individual predictions with drift warnings

## Data Drift Scenario

The dataset shows clear distribution drift across 4 weeks:

| Week | Amount Mean | Accuracy | Confidence | Status |
|------|-------------|----------|------------|--------|
| Week 1 | $100.14 | 100.0% | 99.9% | Baseline (Training) |
| Week 2 | $119.35 | 64.6% | 99.7% | Degraded |
| Week 3 | $160.73 | 53.2% | 100.0% | Poor |
| Week 4 | $199.30 | 48.6% | 100.0% | Worse than random! |

**The Silent Degradation Problem**: Model confidence remains near 100% while accuracy drops to ~48%!

## Architecture

```
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── drift_detection/       # Drift detection algorithms
│   │   ├── metrics.py         # PSI, KS-test, Wasserstein
│   │   └── detectors.py       # Detector classes
│   ├── model/
│   │   ├── model.pkl          # Trained Random Forest
│   │   └── features.json      # Feature mappings
│   ├── baseline/
│   │   └── baseline.json      # Baseline statistics
│   └── data/
│       ├── week1.csv          # Baseline data
│       ├── week2.csv          # Drifted data
│       ├── week3.csv          # More drift
│       └── week4.csv          # Severe drift
│
└── frontend/
    ├── src/
    │   ├── App.tsx            # Main dashboard
    │   ├── sections/
    │   │   ├── WeekComparisonChart.tsx
    │   │   ├── DriftScoreCard.tsx
    │   │   ├── SubgroupAnalysis.tsx
    │   │   ├── SilentDegradationView.tsx
    │   │   └── PredictionTester.tsx
    │   └── types/
    │       └── index.ts
    └── dist/                  # Built frontend
```

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend will start on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Core Endpoints

- `GET /` - API information
- `POST /predict` - Make prediction with drift monitoring
- `GET /drift-status` - Current drift status (unsupervised)

### Analysis Endpoints

- `GET /week-comparison` - Compare performance across weeks
- `GET /subgroup-analysis?week=4` - Analyze drift within subgroups
- `GET /unsupervised-drift?week=4` - Drift detection without ground truth
- `GET /silent-degradation` - Demonstrate the core problem

### Admin Endpoints

- `GET /admin/overview` - System overview (requires admin key)
- `POST /admin/clear-logs` - Clear prediction logs

## Drift Detection Methods

### 1. Population Stability Index (PSI)

Measures distribution shift using bin-wise comparison:
- PSI < 0.1: No significant change
- 0.1 ≤ PSI < 0.25: Moderate change
- PSI ≥ 0.25: Significant change

### 2. Kolmogorov-Smirnov Test

Tests if two samples come from the same distribution:
- p-value < 0.05: Significant difference detected
- KS statistic: Maximum difference between CDFs

### 3. Wasserstein Distance

Earth Mover's Distance - minimum work to transform distributions:
- Normalized to [0, 1] range
- More sensitive to location shifts than KS

### 4. Subgroup Analysis

Detects localized drift within feature subgroups:
- Category (A, B, C)
- User Type (new, old)
- Region (north, south)

## Key Findings

### Silent Degradation Evidence

1. **Week 1 (Baseline)**:
   - Accuracy: 100%
   - Confidence: 99.9%
   - Amount Mean: $100.14

2. **Week 4 (Current)**:
   - Accuracy: 48.6% (worse than random!)
   - Confidence: 99.9% (unchanged!)
   - Amount Mean: $199.30 (+99% shift)

3. **Degradation**:
   - Accuracy Drop: 51.4%
   - Confidence Change: 0% (no change!)
   - Data Shift: +$99.16

### Why This Is Dangerous

- Model reports 99.9% confidence on week 4 data
- But actual accuracy is only 48.6%
- Without ground truth, we would not know performance degraded
- System appears healthy while making poor decisions

## Detection Without Ground Truth

The system uses unsupervised methods to detect drift:

1. Monitor input distribution (PSI, KS test)
2. Track prediction distribution shifts
3. Use confidence calibration techniques
4. Implement out-of-distribution detection

## Blind Spots and Assumptions

### Known Limitations

1. **Feature Coverage**: Only monitors numeric features well
2. **Temporal Patterns**: Doesn't detect seasonal/cyclical drift
3. **Adversarial Inputs**: Not designed for adversarial attacks
4. **Concept Drift**: Detects data drift but not concept drift

### Assumptions

1. Baseline data is representative of training distribution
2. Features are measurable and available
3. Drift is gradual, not instantaneous
4. Sufficient sample sizes for statistical tests

## Technology Stack

- **Backend**: FastAPI, scikit-learn, scipy, pandas
- **Frontend**: React, TypeScript, Tailwind CSS, Recharts
- **ML**: Random Forest classifier
- **Statistics**: PSI, KS-test, Wasserstein distance



## Acknowledgments

This project demonstrates concepts from the paper on silent model degradation in automated decision systems, addressing real-world challenges in ML model monitoring.
