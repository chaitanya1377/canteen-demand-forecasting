# Canteen Demand Forecasting and Food Waste Reduction
**College Mini Project — Academic Implementation & Demonstration System**

A modern, fast, and statistically rigorous web application designed to forecast daily college canteen meal demand, optimize food preparation quantities, and minimize kitchen food waste while preventing meal shortages.

---

## 1. Project Objective

College canteens often face significant dilemmas:
- **Over-preparation** leads to financial losses and severe food waste.
- **Under-preparation** leads to student food shortages and dissatisfaction.

This project analyzes historical canteen operational logs (attendance, meal categories, day-of-the-week cyclicity, and campus events) using empirical statistical methods to predict daily meal demand. It provides staff with data-driven preparation quantities with configurable safety buffers.

---

## 2. Technology Stack

- **Frontend Framework:** React 19 with Vite 6 (ultra-fast compilation and HMR)
- **Styling:** Custom CSS Design System with sustainability emerald palette (`#059669`, `#10b981`), responsive card grids, and mobile navigation
- **Data Visualizations:** Recharts (responsive line charts, bar charts, custom interactive tooltips)
- **Icons:** Lucide React
- **Client-Side Persistence:** Browser `localStorage` (persists entries, edits, and deletions across page refreshes)
- **Data Interchange:** Standard CSV Import and Export
- **Statistical Engine:** Modular JavaScript library (`src/utils/statisticalEngine.js`) paired with an equivalent Python NumPy reference module (`python_stats/stats_engine.py`)
- **Zero Paid Dependencies:** 100% offline, local execution with no paid APIs or API keys required.

---

## 3. Website Modules & Features

### A. Executive Dashboard
- **Key Metric Cards (KPIs):** Total Meals Sold, Average Daily Demand, Total Food Waste (quantity & percentage), and Average Prediction Error (MAE).
- **Actual vs. Predicted Line Chart:** Interactive Recharts line graph comparing historical recorded meals sold with regression model forecasts.
- **Daily Food Waste Bar Chart:** Visualizes daily surplus quantities across operational days.
- **Operational Summary & Trends:** Highlights student attendance elasticity, weekend drop-offs, and top-demanded meal categories.

### B. Daily Data Entry
- **Validated Input Form:**
  - Date (`YYYY-MM-DD`)
  - Day of Week (automatically derived from the selected date)
  - Student Attendance (integer count)
  - Menu Item / Meal Category (Veg Thali, Special Biryani, Fried Rice, etc.)
  - Meals Prepared
  - Meals Sold
  - Quantity of Leftover Food (automatically calculated: `Meals Prepared − Meals Sold`)
  - Campus Event / Holiday status (None, Tech Symposium, Sports Fest, Exam Week, etc.)
  - Notes
- **Strict Input Validation:**
  - Prevents negative inputs.
  - Ensures `Meals Sold ≤ Meals Prepared` (prevents impossible inventory states).
- **Searchable Operations Table:**
  - Search by dish name, date, event, or notes.
  - Filter by record type (`Demo Data` vs `User Entry`) or category.
  - Full Edit and Delete operations with confirmation dialogs.

### C. Demand Forecasting
Features 5 core statistical methods with step-by-step mathematical explanations:
1. **Historical Mean:** Baseline average daily historical demand.
2. **Standard Deviation:** Quantifies dispersion and volatility of demand (includes Coefficient of Variation).
3. **Moving Average (SMA):** Configurable window (3-day, 5-day, 7-day, 14-day) to capture short-term operational trends.
4. **Time-Series Analysis:** Line chart visualizing historical demand oscillations alongside smoothed moving averages.
5. **Multiple Linear Regression (OLS):** Multivariate causal model taking student attendance, weekday dummies, and special events into account. Displays estimated coefficients ($\beta$) and $R^2$.
- **Interactive Next-Day Meal Planning Calculator:** Allows canteen managers to simulate tomorrow's conditions (attendance, day of week, campus event, safety buffer percentage) to compute immediate recommended preparation quantities.

### D. Forecast Accuracy Evaluation
- **Chronological Train/Test Partitioning Protocol:**
  - Strictly preserves time-series integrity: earlier 70% of days used for training, later 30% used for out-of-sample testing.
  - **Zero Data Leakage:** Models are never evaluated on the same observations used to fit them.
- **Evaluation Metrics:**
  - **MAE (Mean Absolute Error):** Average magnitude of forecast error in meals.
  - **RMSE (Root Mean Squared Error):** Heavily penalizes large prediction mistakes that cause kitchen shortages.
  - **MAPE (Mean Absolute Percentage Error):** Relative percentage deviation.
- **Model Comparison Table & Chart:** Side-by-side comparison identifying the optimal forecasting technique.

### E. Food Waste Analysis & Sustainability
- **Measured Historical Waste:**
  - Leftover Meals = Meals Prepared − Meals Sold
  - Waste Percentage = (Leftover Meals / Meals Prepared) × 100
  - Leftovers analyzed by Day of the Week and Menu Dish Category.
- **Retrospective What-If Simulation:**
  - Simulates what leftovers would have been if kitchen had prepared: `Planned Preparation = Forecasted Demand × (1 + Safety Buffer)`.
  - Calculates potential meals saved, waste reduction %, and financial savings in currency.
  - **Clear Academic Distinction:** Distinguishes measured historical waste logs from estimated potential model savings.
- **Actionable Kitchen Recommendations:** Data-backed kitchen scheduling strategies (e.g., reducing weekend batches by 30%, batch-cooking volatile items).

### F. Data Management
- **Load Demonstration Benchmark:** Loads 42 days (6 full weeks) of realistic synthetic college canteen data.
- **CSV Export:** One-click download of the active dataset (`canteen_data.csv`).
- **CSV Import:** Upload and validate external spreadsheets.
- **Sample Template Download:** Download a clean `.csv` template for easy data collection.
- **Clear Records:** Erase local storage with a safe confirmation modal.

---

## 4. Mathematical & Statistical Formulas

### 1. Arithmetic Mean
$$\bar{y} = \frac{1}{n} \sum_{i=1}^{n} y_i$$

### 2. Sample Standard Deviation
$$s = \sqrt{\frac{1}{n - 1} \sum_{i=1}^{n} (y_i - \bar{y})^2}$$

### 3. Simple Moving Average (Window $k$)
$$SMA_k(t) = \frac{1}{k} \sum_{j=0}^{k-1} y_{t-j}$$

### 4. Multiple Linear Regression (OLS)
$$\hat{y} = \beta_0 + \beta_1 \cdot \text{Attendance} + \beta_2 \cdot \text{Event} + \sum_{d} \beta_d \cdot \text{DayDummy}_d$$
Matrix solution via Normal Equations:
$$\beta = (X^T X + \lambda I)^{-1} X^T Y$$
*(Includes Tikhonov regularizer $\lambda = 10^{-4}$ for numerical stability)*

### 5. Mean Absolute Error (MAE)
$$MAE = \frac{1}{m} \sum_{i=1}^{m} |y_i - \hat{y}_i|$$

### 6. Root Mean Squared Error (RMSE)
$$RMSE = \sqrt{\frac{1}{m} \sum_{i=1}^{m} (y_i - \hat{y}_i)^2}$$

---

## 5. Getting Started & Installation

### Prerequisites
- Node.js (version 18 or higher)
- npm (bundled with Node)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:5173/
```

### 3. Build for Production
```bash
npm run build
```

---

## 6. Python Statistical Reference

For academic project viva or presentation to professors, an equivalent standalone Python module is provided in [`python_stats/stats_engine.py`](python_stats/stats_engine.py):

To run the Python reference verification:
```bash
python python_stats/stats_engine.py
```

---

## 7. Project File Structure

```
mdm mini project/
├── index.html                   # Entry HTML with meta tags and SVG favicon
├── package.json                 # Project configuration & dependencies
├── vite.config.js               # Vite build configuration
├── README.md                    # Project documentation & presentation guide
├── python_stats/
│   └── stats_engine.py          # Python statistical reference implementation
└── src/
    ├── main.jsx                 # React root mount
    ├── App.jsx                  # Main application container & tab router
    ├── index.css                # Sustainability green design tokens & styling
    ├── context/
    │   └── DataContext.jsx      # State management, LocalStorage, CSV operations
    ├── data/
    │   └── sampleData.js        # 42-day realistic synthetic demonstration dataset
    ├── utils/
    │   └── statisticalEngine.js # Core mathematical & statistical algorithms
    ├── components/
    │   ├── Header.jsx           # Top navbar with quick actions
    │   └── Sidebar.jsx          # Responsive navigation sidebar
    └── pages/
        ├── Dashboard.jsx        # Executive summary, KPI cards, Recharts
        ├── DataEntry.jsx        # Operations entry form & searchable table
        ├── Forecasting.jsx      # 5 statistical models & next-day calculator
        ├── Accuracy.jsx         # Train/test split, MAE/RMSE benchmarking
        ├── WasteAnalysis.jsx    # Measured waste & potential reduction simulation
        └── DataManagement.jsx   # CSV import/export & demo reset controls
```

---

## 8. College Viva & Presentation Tips

When presenting this project to your evaluators:
1. **Explain the Motivation:** Emphasize that traditional canteens rely on guesswork, producing high waste on weekends or running out of food during events.
2. **Show the Train/Test Split:** Highlight that model accuracy (MAE/RMSE) is calculated strictly out-of-sample without lookahead bias.
3. **Demonstrate the Next-Day Calculator:** Enter tomorrow's attendance and show how the model gives a preparation number with a 5% safety buffer.
4. **Discuss Waste Distinction:** Point out that measured historical waste is distinguished from simulated potential reduction, maintaining scientific rigor.
