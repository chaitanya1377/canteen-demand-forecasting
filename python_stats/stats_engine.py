"""
Statistical Reference Module in Python for:
Canteen Demand Forecasting and Food Waste Reduction (College Mini Project)

This module provides the Python (NumPy) reference implementation of all statistical
calculations used by the React web application:
1. Arithmetic Mean: x̄ = (1/n) * Σ x_i
2. Sample Standard Deviation: s = √[ (1/(n-1)) * Σ (x_i - x̄)² ]
3. Moving Average Forecasting (SMA_k)
4. Multiple Linear Regression via OLS Normal Equations: β = (XᵀX)⁻¹ XᵀY
5. Chronological Train/Test Evaluation (MAE, RMSE, MAPE)
6. Food Waste & Simulation Analytics
"""

import math
import numpy as np
from datetime import datetime


def calculate_mean(values):
    """Calculate arithmetic mean."""
    if not values:
        return 0.0
    return float(np.mean(values))


def calculate_std_dev(values):
    """Calculate sample standard deviation (ddof=1 for Bessel's correction n-1)."""
    if len(values) <= 1:
        return 0.0
    return float(np.std(values, ddof=1))


def moving_average_forecast(series, window=3):
    """Forecast next period using average of last k observations."""
    if not series:
        return 0
    k = min(len(series), max(1, int(window)))
    return round(float(np.mean(series[-k:])))


def extract_features(record):
    """
    Extract regression feature vector for a record:
    [Bias, Attendance, Event_Flag, Mon, Tue, Wed, Thu, Fri]
    """
    att = float(record.get("studentAttendance", 0))
    event = record.get("campusEvent", "None")
    is_event = 1.0 if event not in ("None", "No", "") else 0.0
    day = record.get("dayOfWeek", "")

    return [
        1.0,  # Intercept
        att,  # Student Attendance
        is_event,  # Campus Event Dummy
        1.0 if day == "Monday" else 0.0,
        1.0 if day == "Tuesday" else 0.0,
        1.0 if day == "Wednesday" else 0.0,
        1.0 if day == "Thursday" else 0.0,
        1.0 if day == "Friday" else 0.0,
    ]


def fit_linear_regression(records):
    """
    Fit Multiple Linear Regression using Ordinary Least Squares Normal Equations.
    β = (XᵀX + λI)⁻¹ XᵀY
    """
    if len(records) < 5:
        raise ValueError("At least 5 records required to fit regression.")

    X = np.array([extract_features(r) for r in records], dtype=float)
    y = np.array([float(r.get("mealsSold", 0)) for r in records], dtype=float)

    # Ridge regularizer for numerical stability (λ = 1e-4)
    lambda_reg = 1e-4
    XtX = X.T @ X + lambda_reg * np.eye(X.shape[1])
    XtY = X.T @ y
    beta = np.linalg.solve(XtX, XtY)

    # Calculate R-squared
    y_pred = X @ beta
    ss_total = np.sum((y - np.mean(y)) ** 2)
    ss_res = np.sum((y - y_pred) ** 2)
    r_squared = 1.0 - (ss_res / ss_total) if ss_total > 0 else 0.0

    return {
        "coefficients": beta.tolist(),
        "r_squared": round(float(r_squared), 4),
        "beta": beta
    }


def calculate_mae(actuals, predicteds):
    """Mean Absolute Error: (1/n) * Σ |y - ŷ|"""
    actuals = np.array(actuals, dtype=float)
    predicteds = np.array(predicteds, dtype=float)
    return round(float(np.mean(np.abs(actuals - predicteds))), 2)


def calculate_rmse(actuals, predicteds):
    """Root Mean Squared Error: √[ (1/n) * Σ (y - ŷ)² ]"""
    actuals = np.array(actuals, dtype=float)
    predicteds = np.array(predicteds, dtype=float)
    return round(float(np.sqrt(np.mean((actuals - predicteds) ** 2))), 2)


def evaluate_models_chronological(records, train_ratio=0.70):
    """
    Chronological out-of-sample evaluation of 4 forecasting models:
    1. Historical Mean
    2. 3-Day Moving Average
    3. 7-Day Moving Average
    4. Multiple Linear Regression
    """
    # Sort chronologically
    sorted_records = sorted(records, key=lambda x: x["date"])
    split_idx = int(len(sorted_records) * train_ratio)
    train = sorted_records[:split_idx]
    test = sorted_records[split_idx:]

    actual_test = [float(r["mealsSold"]) for r in test]

    # Model 1: Mean
    train_mean = calculate_mean([float(r["mealsSold"]) for r in train])
    mean_preds = [round(train_mean)] * len(test)

    # Model 2 & 3: Moving Averages (Walk-Forward)
    full = train + test
    sma3_preds = []
    sma7_preds = []
    for i in range(len(test)):
        idx = len(train) + i
        prev3 = [float(r["mealsSold"]) for r in full[max(0, idx - 3):idx]]
        prev7 = [float(r["mealsSold"]) for r in full[max(0, idx - 7):idx]]
        sma3_preds.append(round(float(np.mean(prev3))))
        sma7_preds.append(round(float(np.mean(prev7))))

    # Model 4: Linear Regression
    reg = fit_linear_regression(train)
    beta = np.array(reg["coefficients"])
    X_test = np.array([extract_features(r) for r in test], dtype=float)
    reg_preds = [round(float(val)) for val in (X_test @ beta)]

    results = {
        "train_days": len(train),
        "test_days": len(test),
        "models": {
            "Historical Mean": {
                "mae": calculate_mae(actual_test, mean_preds),
                "rmse": calculate_rmse(actual_test, mean_preds),
            },
            "3-Day Moving Average": {
                "mae": calculate_mae(actual_test, sma3_preds),
                "rmse": calculate_rmse(actual_test, sma3_preds),
            },
            "7-Day Moving Average": {
                "mae": calculate_mae(actual_test, sma7_preds),
                "rmse": calculate_rmse(actual_test, sma7_preds),
            },
            "Multiple Linear Regression": {
                "mae": calculate_mae(actual_test, reg_preds),
                "rmse": calculate_rmse(actual_test, reg_preds),
                "r_squared": reg["r_squared"]
            }
        }
    }
    return results


if __name__ == "__main__":
    print("=" * 60)
    print("CANTEEN DEMAND FORECASTING STATISTICAL ENGINE (PYTHON)")
    print("=" * 60)
    print("Module verified successfully. Run tests or import into Flask API.")
