/**
 * Statistical Engine for Canteen Demand Forecasting and Food Waste Reduction
 * 
 * Provides rigorous, standalone mathematical functions for:
 * 1. Descriptive Statistics (Mean, Variance, Sample Standard Deviation)
 * 2. Moving Average Forecasting (configurable window k)
 * 3. Multiple Linear Regression via Ordinary Least Squares (OLS) Normal Equations
 * 4. Model Evaluation Metrics (MAE, RMSE, MAPE) with Chronological Train/Test Split
 * 
 * Modular and framework-independent so it can be easily understood, verified,
 * or ported to Python (NumPy/scikit-learn) for academic presentation.
 */

/**
 * Calculate arithmetic mean of an array of numbers
 * Formula: x̄ = (1/n) * Σ(x_i)
 */
export function calculateMean(values) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + Number(v), 0);
  return sum / values.length;
}

/**
 * Calculate sample standard deviation (Bessel's correction n - 1)
 * Formula: s = sqrt( (1 / (n - 1)) * Σ(x_i - x̄)² )
 */
export function calculateStdDev(values) {
  if (!values || values.length <= 1) return 0;
  const mean = calculateMean(values);
  const sumSquaredDiffs = values.reduce((acc, v) => {
    const diff = Number(v) - mean;
    return acc + diff * diff;
  }, 0);
  return Math.sqrt(sumSquaredDiffs / (values.length - 1));
}

/**
 * Calculate Coefficient of Variation (CV) as percentage
 * Formula: CV = (s / x̄) * 100%
 */
export function calculateCV(values) {
  const mean = calculateMean(values);
  if (mean === 0) return 0;
  const std = calculateStdDev(values);
  return (std / mean) * 100;
}

/**
 * Calculate Simple Moving Average for a given time-ordered array
 * For index t >= k - 1: SMA_k(t) = (1/k) * Σ_{j=0}^{k-1} y_{t-j}
 * 
 * @param {Array<number>} values - Chronologically sorted demand values
 * @param {number} window - Window size k (e.g., 3, 5, 7)
 * @returns {Array<{ index: number, value: number, sma: number | null }>}
 */
export function calculateMovingAverageSeries(values, window = 3) {
  if (!values || values.length === 0) return [];
  const k = Math.max(1, Math.floor(window));
  
  return values.map((val, idx) => {
    if (idx < k - 1) {
      return { index: idx, value: val, sma: null };
    }
    const windowSlice = values.slice(idx - k + 1, idx + 1);
    const avg = calculateMean(windowSlice);
    return {
      index: idx,
      value: val,
      sma: Math.round(avg * 10) / 10
    };
  });
}

/**
 * Forecast next period using the last 'window' observations
 * Formula: ŷ_{t+1} = (1/k) * Σ_{j=0}^{k-1} y_{t-j}
 */
export function forecastNextMovingAverage(values, window = 3) {
  if (!values || values.length === 0) return 0;
  const k = Math.min(values.length, Math.max(1, Math.floor(window)));
  const recent = values.slice(-k);
  return Math.round(calculateMean(recent));
}

// -------------------------------------------------------------
// LINEAR ALGEBRA HELPERS FOR MULTIPLE LINEAR REGRESSION (OLS)
// -------------------------------------------------------------

/**
 * Transpose a matrix: X^T
 */
function matrixTranspose(A) {
  const rows = A.length;
  const cols = A[0].length;
  const result = [];
  for (let c = 0; c < cols; c++) {
    result[c] = new Array(rows);
    for (let r = 0; r < rows; r++) {
      result[c][r] = A[r][c];
    }
  }
  return result;
}

/**
 * Multiply two matrices: A * B
 */
function matrixMultiply(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;

  if (colsA !== rowsB) {
    throw new Error(`Matrix multiplication dimension mismatch: ${colsA} vs ${rowsB}`);
  }

  const result = [];
  for (let r = 0; r < rowsA; r++) {
    result[r] = new Array(colsB).fill(0);
    for (let c = 0; c < colsB; c++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[r][k] * B[k][c];
      }
      result[r][c] = sum;
    }
  }
  return result;
}

/**
 * Invert a square matrix using Gauss-Jordan elimination with partial pivoting.
 * Adds a tiny Tikhonov/Ridge regularizer (lambda = 1e-6) on the diagonal to guarantee
 * numerical stability and prevent errors if variables are colinear.
 */
function matrixInvert(A, lambda = 1e-6) {
  const n = A.length;
  // Create augmented matrix [A + λI | I]
  const aug = [];
  for (let i = 0; i < n; i++) {
    aug[i] = new Array(2 * n).fill(0);
    for (let j = 0; j < n; j++) {
      aug[i][j] = A[i][j] + (i === j ? lambda : 0);
    }
    aug[i][n + i] = 1;
  }

  // Gaussian elimination with partial pivoting
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    let maxVal = Math.abs(aug[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > maxVal) {
        maxVal = Math.abs(aug[k][i]);
        maxRow = k;
      }
    }

    if (maxVal < 1e-12) {
      throw new Error("Matrix is singular or ill-conditioned for regression.");
    }

    // Swap max row with current row
    if (maxRow !== i) {
      const temp = aug[i];
      aug[i] = aug[maxRow];
      aug[maxRow] = temp;
    }

    // Normalize pivot row
    const pivot = aug[i][i];
    for (let j = 0; j < 2 * n; j++) {
      aug[i][j] /= pivot;
    }

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = aug[k][i];
        for (let j = 0; j < 2 * n; j++) {
          aug[k][j] -= factor * aug[i][j];
        }
      }
    }
  }

  // Extract inverse
  const inv = [];
  for (let i = 0; i < n; i++) {
    inv[i] = aug[i].slice(n);
  }
  return inv;
}

/**
 * Standardize feature names used in regression:
 * Features:
 * 0: Intercept (bias = 1)
 * 1: Student Attendance
 * 2: Campus Event (1 if event, 0 otherwise)
 * 3: Monday dummy (1/0)
 * 4: Tuesday dummy (1/0)
 * 5: Wednesday dummy (1/0)
 * 6: Thursday dummy (1/0)
 * 7: Friday dummy (1/0)
 * (Saturday/Sunday acts as reference category)
 */
export const REGRESSION_FEATURE_LABELS = [
  "Intercept (β₀)",
  "Student Attendance (β₁)",
  "Campus Event (β₂)",
  "Monday (β₃)",
  "Tuesday (β₄)",
  "Wednesday (β₅)",
  "Thursday (β₆)",
  "Friday (β₇)"
];

/**
 * Extract feature vector from a record
 */
export function extractFeatures(record) {
  const attendance = Number(record.studentAttendance) || 0;
  const isEvent = record.campusEvent && record.campusEvent !== "None" && record.campusEvent !== "No" ? 1 : 0;
  const day = (record.dayOfWeek || "").trim();

  return [
    1, // Intercept
    attendance,
    isEvent,
    day === "Monday" ? 1 : 0,
    day === "Tuesday" ? 1 : 0,
    day === "Wednesday" ? 1 : 0,
    day === "Thursday" ? 1 : 0,
    day === "Friday" ? 1 : 0
  ];
}

/**
 * Fit Multiple Linear Regression using Ordinary Least Squares (OLS)
 * Equation: Y = X * β + ε
 * Normal Equation Solution: β = (X^T * X)^(-1) * X^T * Y
 * 
 * @param {Array<Object>} records - Training observations
 * @returns {Object} Trained regression model object
 */
export function fitLinearRegression(records) {
  if (!records || records.length < 5) {
    return {
      isFitted: false,
      message: "Insufficient observations. At least 5 records required to fit regression.",
      coefficients: [0, 0, 0, 0, 0, 0, 0, 0],
      rSquared: 0,
      predict: () => 0
    };
  }

  // Build X matrix (n x p) and Y vector (n x 1)
  const X = [];
  const Y = [];
  const yValues = [];

  for (const r of records) {
    const yVal = Number(r.mealsSold) || 0;
    X.push(extractFeatures(r));
    Y.push([yVal]);
    yValues.push(yVal);
  }

  try {
    const Xt = matrixTranspose(X); // p x n
    const XtX = matrixMultiply(Xt, X); // p x p
    const XtX_inv = matrixInvert(XtX, 1e-4); // p x p with slight regularization
    const XtY = matrixMultiply(Xt, Y); // p x 1
    const betaMatrix = matrixMultiply(XtX_inv, XtY); // p x 1
    const beta = betaMatrix.map(row => row[0]);

    // Calculate predictions on training data to compute R²
    const yMean = calculateMean(yValues);
    let ssTotal = 0;
    let ssResidual = 0;

    for (let i = 0; i < records.length; i++) {
      const actual = yValues[i];
      const xRow = X[i];
      let pred = 0;
      for (let j = 0; j < beta.length; j++) {
        pred += xRow[j] * beta[j];
      }
      ssTotal += Math.pow(actual - yMean, 2);
      ssResidual += Math.pow(actual - pred, 2);
    }

    const rSquared = ssTotal > 0 ? Math.max(0, Math.min(1, 1 - (ssResidual / ssTotal))) : 0;

    // Prediction function for any new record/conditions
    const predict = (features) => {
      let result = 0;
      for (let j = 0; j < beta.length; j++) {
        result += (features[j] || 0) * beta[j];
      }
      return Math.max(0, Math.round(result));
    };

    return {
      isFitted: true,
      coefficients: beta,
      featureLabels: REGRESSION_FEATURE_LABELS,
      rSquared: Math.round(rSquared * 1000) / 1000,
      sampleSize: records.length,
      predict,
      // Helper for predicting directly from raw inputs
      predictFromInputs: (attendance, dayOfWeek, hasEvent) => {
        const dummyRecord = {
          studentAttendance: attendance,
          dayOfWeek: dayOfWeek,
          campusEvent: hasEvent ? "Yes" : "None"
        };
        const feat = extractFeatures(dummyRecord);
        return predict(feat);
      }
    };
  } catch (err) {
    console.error("Linear regression fitting error:", err);
    return {
      isFitted: false,
      message: `Regression computation error: ${err.message}`,
      coefficients: [0, 0, 0, 0, 0, 0, 0, 0],
      rSquared: 0,
      predict: () => 0
    };
  }
}

// -------------------------------------------------------------
// EVALUATION METRICS: MAE, RMSE, MAPE
// -------------------------------------------------------------

/**
 * Mean Absolute Error: MAE = (1/n) * Σ |actual - predicted|
 */
export function calculateMAE(actuals, predicteds) {
  if (!actuals || actuals.length === 0 || actuals.length !== predicteds.length) return 0;
  const n = actuals.length;
  let sumAbsErr = 0;
  for (let i = 0; i < n; i++) {
    sumAbsErr += Math.abs(Number(actuals[i]) - Number(predicteds[i]));
  }
  return Math.round((sumAbsErr / n) * 100) / 100;
}

/**
 * Root Mean Squared Error: RMSE = sqrt( (1/n) * Σ (actual - predicted)² )
 */
export function calculateRMSE(actuals, predicteds) {
  if (!actuals || actuals.length === 0 || actuals.length !== predicteds.length) return 0;
  const n = actuals.length;
  let sumSqErr = 0;
  for (let i = 0; i < n; i++) {
    const err = Number(actuals[i]) - Number(predicteds[i]);
    sumSqErr += err * err;
  }
  return Math.round(Math.sqrt(sumSqErr / n) * 100) / 100;
}

/**
 * Mean Absolute Percentage Error: MAPE = (100/n) * Σ |(actual - predicted) / actual|
 */
export function calculateMAPE(actuals, predicteds) {
  if (!actuals || actuals.length === 0 || actuals.length !== predicteds.length) return 0;
  let count = 0;
  let sumPctErr = 0;
  for (let i = 0; i < actuals.length; i++) {
    const act = Number(actuals[i]);
    if (act > 0) {
      sumPctErr += Math.abs((act - Number(predicteds[i])) / act);
      count++;
    }
  }
  if (count === 0) return 0;
  return Math.round((sumPctErr / count) * 1000) / 10;
}

// -------------------------------------------------------------
// CHRONOLOGICAL TRAIN / TEST SPLIT & MULTI-MODEL ACCURACY SUITE
// -------------------------------------------------------------

/**
 * Sorts records chronologically and partitions them into:
 * - Training Set (earlier observations, e.g. 70%)
 * - Testing Set (later observations, e.g. 30%)
 * 
 * Adheres strictly to time-series forecasting principles:
 * Never use future data to evaluate past predictions!
 */
export function splitTrainTestChronological(records, trainRatio = 0.7) {
  if (!records || records.length === 0) {
    return { train: [], test: [] };
  }

  // Ensure chronological ordering by date
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const splitIdx = Math.max(3, Math.floor(sorted.length * trainRatio));
  const train = sorted.slice(0, splitIdx);
  const test = sorted.slice(splitIdx);

  return {
    train,
    test,
    trainStartDate: train[0]?.date,
    trainEndDate: train[train.length - 1]?.date,
    testStartDate: test[0]?.date,
    testEndDate: test[test.length - 1]?.date,
    trainCount: train.length,
    testCount: test.length,
    totalCount: sorted.length
  };
}

/**
 * Evaluates all four statistical forecasting methods fairly on the out-of-sample Test Set:
 * 1. Historical Mean
 * 2. 3-Day Moving Average (rolling walk-forward)
 * 3. 7-Day Moving Average (rolling walk-forward)
 * 4. Multiple Linear Regression (fitted strictly on training set)
 * 
 * @param {Array<Object>} records - Full dataset
 * @param {number} trainRatio - Proportion for training (default 0.70)
 */
export function runComparativeModelEvaluation(records, trainRatio = 0.70) {
  if (!records || records.length < 8) {
    return {
      isValid: false,
      message: "At least 8 records are required for a fair train/test split evaluation."
    };
  }

  const {
    train,
    test,
    trainStartDate,
    trainEndDate,
    testStartDate,
    testEndDate,
    trainCount,
    testCount
  } = splitTrainTestChronological(records, trainRatio);

  if (test.length === 0) {
    return {
      isValid: false,
      message: "Insufficient records to form a separate test partition."
    };
  }

  const actualTestDemand = test.map(r => Number(r.mealsSold));

  // --- Model 1: Historical Mean ---
  // Fit: Average of training set mealsSold
  const trainMean = calculateMean(train.map(r => Number(r.mealsSold)));
  const meanPredictions = test.map(() => Math.round(trainMean));

  // --- Model 2 & 3: Moving Averages (Rolling Walk-Forward) ---
  // We simulate real-time forecasting: at test day t, moving average uses the actuals
  // of the immediately preceding k days from historical records.
  const fullSorted = [...train, ...test];
  const sma3Predictions = [];
  const sma7Predictions = [];

  for (let i = 0; i < test.length; i++) {
    // Current test index in fullSorted
    const testGlobalIdx = train.length + i;
    
    // Previous 3 days
    const prev3Slice = fullSorted.slice(Math.max(0, testGlobalIdx - 3), testGlobalIdx);
    const sma3Val = calculateMean(prev3Slice.map(r => Number(r.mealsSold)));
    sma3Predictions.push(Math.round(sma3Val));

    // Previous 7 days
    const prev7Slice = fullSorted.slice(Math.max(0, testGlobalIdx - 7), testGlobalIdx);
    const sma7Val = calculateMean(prev7Slice.map(r => Number(r.mealsSold)));
    sma7Predictions.push(Math.round(sma7Val));
  }

  // --- Model 4: Multiple Linear Regression ---
  // Fit strictly on training records
  const regModel = fitLinearRegression(train);
  const regPredictions = test.map(r => {
    if (!regModel.isFitted) return Math.round(trainMean);
    const feat = extractFeatures(r);
    return regModel.predict(feat);
  });

  // Calculate Accuracy Metrics for each model
  const models = [
    {
      id: "mean",
      name: "Historical Mean",
      description: "Constant baseline equal to average historical training demand.",
      predictions: meanPredictions,
      mae: calculateMAE(actualTestDemand, meanPredictions),
      rmse: calculateRMSE(actualTestDemand, meanPredictions),
      mape: calculateMAPE(actualTestDemand, meanPredictions),
      color: "#94a3b8" // Slate
    },
    {
      id: "sma3",
      name: "3-Day Moving Average",
      description: "Short-term rolling average responding quickly to recent fluctuations.",
      predictions: sma3Predictions,
      mae: calculateMAE(actualTestDemand, sma3Predictions),
      rmse: calculateRMSE(actualTestDemand, sma3Predictions),
      mape: calculateMAPE(actualTestDemand, sma3Predictions),
      color: "#f59e0b" // Amber
    },
    {
      id: "sma7",
      name: "7-Day Moving Average",
      description: "Smooths weekly cyclical noise across a full 7-day operational cycle.",
      predictions: sma7Predictions,
      mae: calculateMAE(actualTestDemand, sma7Predictions),
      rmse: calculateRMSE(actualTestDemand, sma7Predictions),
      mape: calculateMAPE(actualTestDemand, sma7Predictions),
      color: "#3b82f6" // Blue
    },
    {
      id: "regression",
      name: "Multiple Linear Regression",
      description: "Accounts for student attendance, day of the week, and campus event status.",
      predictions: regPredictions,
      mae: calculateMAE(actualTestDemand, regPredictions),
      rmse: calculateRMSE(actualTestDemand, regPredictions),
      mape: calculateMAPE(actualTestDemand, regPredictions),
      color: "#10b981", // Emerald Green
      rSquared: regModel.rSquared,
      coefficients: regModel.coefficients
    }
  ];

  // Find best performing model by lowest MAE
  const bestModel = [...models].sort((a, b) => a.mae - b.mae)[0];

  // Build daily comparison points for charting the test period
  const testComparisonChartData = test.map((r, i) => ({
    date: r.date,
    dayOfWeek: r.dayOfWeek,
    event: r.campusEvent !== "None" ? r.campusEvent : "",
    actual: actualTestDemand[i],
    mean: meanPredictions[i],
    sma3: sma3Predictions[i],
    sma7: sma7Predictions[i],
    regression: regPredictions[i]
  }));

  return {
    isValid: true,
    splitInfo: {
      trainCount,
      testCount,
      trainStartDate,
      trainEndDate,
      testStartDate,
      testEndDate,
      trainRatio: Math.round(trainRatio * 100)
    },
    models,
    bestModel,
    testComparisonChartData,
    regModelDetails: regModel
  };
}

// -------------------------------------------------------------
// FOOD WASTE & POTENTIAL REDUCTION CALCULATIONS
// -------------------------------------------------------------

/**
 * Compute aggregate food waste metrics
 */
export function calculateWasteMetrics(records) {
  if (!records || records.length === 0) {
    return {
      totalPrepared: 0,
      totalSold: 0,
      totalLeftover: 0,
      overallWastePercentage: 0,
      categoryStats: [],
      dayOfWeekStats: []
    };
  }

  let totalPrepared = 0;
  let totalSold = 0;
  let totalLeftover = 0;

  const categoryMap = {};
  const dayMap = {};

  records.forEach(r => {
    const prep = Math.max(0, Number(r.mealsPrepared) || 0);
    const sold = Math.max(0, Number(r.mealsSold) || 0);
    const left = Math.max(0, prep - sold);

    totalPrepared += prep;
    totalSold += sold;
    totalLeftover += left;

    // By category
    const cat = r.mealCategory || "Standard Meal";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, prepared: 0, sold: 0, leftover: 0, count: 0 };
    }
    categoryMap[cat].prepared += prep;
    categoryMap[cat].sold += sold;
    categoryMap[cat].leftover += left;
    categoryMap[cat].count += 1;

    // By day of week
    const day = r.dayOfWeek || "Unknown";
    if (!dayMap[day]) {
      dayMap[day] = { day, prepared: 0, sold: 0, leftover: 0, count: 0 };
    }
    dayMap[day].prepared += prep;
    dayMap[day].sold += sold;
    dayMap[day].leftover += left;
    dayMap[day].count += 1;
  });

  const overallWastePercentage = totalPrepared > 0
    ? Math.round((totalLeftover / totalPrepared) * 1000) / 10
    : 0;

  // Transform maps to sorted lists with individual waste %
  const categoryStats = Object.values(categoryMap).map(c => ({
    ...c,
    wastePercentage: c.prepared > 0 ? Math.round((c.leftover / c.prepared) * 1000) / 10 : 0
  })).sort((a, b) => b.leftover - a.leftover);

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayOfWeekStats = Object.values(dayMap).map(d => ({
    ...d,
    wastePercentage: d.prepared > 0 ? Math.round((d.leftover / d.prepared) * 1000) / 10 : 0
  })).sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

  return {
    totalPrepared,
    totalSold,
    totalLeftover,
    overallWastePercentage,
    categoryStats,
    dayOfWeekStats
  };
}

/**
 * Simulate Potential Waste Reduction using Forecasting Model + Safety Buffer
 * 
 * Compares measured historical kitchen preparation against what would have
 * happened if the kitchen had prepared:
 * Planned Preparation = Forecasted Demand * (1 + Safety Buffer)
 * 
 * @param {Array<Object>} records - Observations
 * @param {number} safetyBuffer - Buffer fraction (e.g., 0.05 for 5%)
 * @param {number} avgMealCost - Cost per meal in currency (e.g., 50)
 */
export function simulateWasteReduction(records, safetyBuffer = 0.05, avgMealCost = 50) {
  if (!records || records.length < 5) return null;

  // Fit regression on historical records
  const regModel = fitLinearRegression(records);
  if (!regModel.isFitted) return null;

  let actualHistoricalWaste = 0;
  let simulatedModelWaste = 0;
  let simulatedShortageCount = 0;
  let totalSimulatedPrepared = 0;
  let totalActualPrepared = 0;
  let totalActualSold = 0;

  records.forEach(r => {
    const actPrep = Number(r.mealsPrepared) || 0;
    const actSold = Number(r.mealsSold) || 0;
    const actLeft = Math.max(0, actPrep - actSold);

    actualHistoricalWaste += actLeft;
    totalActualPrepared += actPrep;
    totalActualSold += actSold;

    // Simulated preparation based on model forecast
    const feat = extractFeatures(r);
    const forecast = regModel.predict(feat);
    const plannedPrep = Math.ceil(forecast * (1 + safetyBuffer));
    totalSimulatedPrepared += plannedPrep;

    if (plannedPrep >= actSold) {
      simulatedModelWaste += (plannedPrep - actSold);
    } else {
      // Shortage occurred
      simulatedShortageCount++;
    }
  });

  const mealsSaved = Math.max(0, actualHistoricalWaste - simulatedModelWaste);
  const reductionPercentage = actualHistoricalWaste > 0
    ? Math.round((mealsSaved / actualHistoricalWaste) * 1000) / 10
    : 0;

  const costSavings = mealsSaved * avgMealCost;

  return {
    safetyBufferPercent: Math.round(safetyBuffer * 100),
    actualHistoricalWaste,
    simulatedModelWaste,
    mealsSaved,
    reductionPercentage,
    estimatedCostSavings: costSavings,
    simulatedShortageCount,
    shortageRiskPercent: Math.round((simulatedShortageCount / records.length) * 1000) / 10,
    disclaimer: "This is a statistical simulation of potential waste reduction based on retrospective model forecasts plus safety buffer. It distinguishes estimated savings from measured historical kitchen waste."
  };
}
