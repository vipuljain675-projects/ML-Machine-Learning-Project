# 🌍 Geopolitical Risk Monitor

A full-stack machine learning application that predicts geopolitical conflict risk for 12 major world powers from 2025 to 2040. Built with a RandomForest classifier trained on 75 years of real historical data, served via a FastAPI backend, and visualized through a Next.js dashboard with an interactive conflict map and live news sentiment analysis.

---

## 📸 Overview

| Feature | Description |
|---|---|
| ML Model | RandomForestClassifier, 97.3% accuracy |
| Training Data | 9,888 data points, 1946–2024 |
| Data Sources | UCDP Conflict Dataset + World Bank Indicators |
| Countries | 12 major world powers |
| Forecast Range | 2025–2040 |
| Backend | Python FastAPI |
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Map | Leaflet.js interactive conflict map |
| News | NewsAPI live feed with sentiment analysis |

---

## 🧠 How The Machine Learning Works

### The Core Idea

The model answers one question:

> **"Given a country's economic and military conditions, what is the probability it will experience armed conflict?"**

It was trained on 75 years of historical data — every year, for many countries — so it learned real patterns like: high military spending + economic decline + recent conflict history = high conflict risk.

### Training Data

**Source 1: UCDP (Uppsala Conflict Data Program)**
- The world's most comprehensive conflict database
- Records every armed conflict since 1946
- Used to define the target variable: `conflict = 1` (conflict occurred that year) or `conflict = 0` (no conflict)

**Source 2: World Bank Development Indicators**
- Economic data for every country going back decades
- GDP growth, inflation, unemployment, military expenditure, population data

Together these produced **9,888 rows** of country-year observations, each with 8 features and a conflict label.

### The 8 Features (Model Inputs)

| Feature | What It Measures | Why It Matters |
|---|---|---|
| `gdp_growth` | Annual GDP growth rate (%) | Economic decline correlates with instability |
| `military_spend` | Military spending as % of GDP | High spend signals conflict preparation |
| `working_age_pop` | % of population aged 15–64 | Youth bulges historically linked to conflict |
| `gdp_per_capita_growth` | Per capita GDP growth (%) | Measures living standard changes |
| `inflation` | Annual inflation rate (%) | Hyperinflation destabilizes governments |
| `unemployment` | Unemployment rate (%) | Economic desperation drives conflict |
| `conflict_last_year` | Was there conflict last year? (0–1) | Conflicts rarely start from nowhere |
| `conflict_3yr_avg` | Average conflict intensity, past 3 years | Medium-term conflict trend |

### The Target Variable

```
conflict = 1  →  Armed conflict occurred this year
conflict = 0  →  No armed conflict this year
```

### Model Architecture

```
RandomForestClassifier(
    n_estimators=100,     # 100 decision trees
    random_state=42,      # Reproducibility
    class_weight='balanced'  # Handles imbalanced conflict/no-conflict ratio
)
```

A Random Forest builds 100 individual decision trees, each trained on a random subset of the data. The final prediction is the average probability across all 100 trees. This makes it robust, resistant to overfitting, and excellent at capturing non-linear relationships.

### Model Performance

```
Accuracy:  97.3%
Features:  8
Classes:   Binary (conflict / no conflict)
Trained:   scikit-learn 1.6.1
```

---

## 🔮 How The Forecasting Works (2025–2040)

This is the most important part to understand.

### The Challenge

The model was trained on **historical data** (1946–2024). To forecast 2025–2040, we need to feed it **future input values** for all 8 features.

But nobody knows the future GDP of Russia in 2031.

### The Solution: Scenario-Based Forecasting

This is exactly how real institutions like the **IMF, World Bank, RAND Corporation, and CIA** forecast geopolitical risk. They build **scenarios** — educated projections based on current trends — and feed those into their models.

For each country, we built a 16-year scenario (2025–2040) for every feature. For example, Russia:

```python
"Russia": {
    "gdp_growth":      [-3.0, -2.0, -1.0, 0.0, 0.5, 1.0, 1.5 ...],
    #                   2025   2026   2027  2028  2029  2030  2031
    "military_spend":  [5.9,   6.0,   6.0,  5.5,  5.0,  4.5  ...],
    "conflict_last_year": [1.0, 1.0, 1.0, 0.8, 0.5, 0.3 ...],
    ...
}
```

These scenario values reflect:
- Current geopolitical situation (Russia in active conflict in 2025)
- Reasonable economic trajectory based on sanctions and war costs
- Gradual de-escalation assumption over time

The model then takes these inputs year by year and outputs a conflict probability:

```
Input: Russia 2025 scenario values
Output: 89% conflict probability → CRITICAL
```

```
Input: Russia 2030 scenario values (economy recovering, conflict lower)
Output: 21% conflict probability → LOW
```

### Why This Is Legitimate

The hardcoded future values are not "making up data" — they are **scenario assumptions**, the same approach used by:
- IMF World Economic Outlook
- World Bank Global Economic Prospects  
- RAND Corporation geopolitical reports
- NATO threat assessments

The key insight: **the model's intelligence comes from training on 75 years of real data**. The scenario inputs just define which part of that learned pattern space we're querying.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────┐
│           Next.js Frontend              │
│   localhost:3000                        │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │Dashboard │  │Conflict  │            │
│  │(12 cards)│  │Map       │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │Country   │  │News Feed │            │
│  │Detail    │  │Sentiment │            │
│  └──────────┘  └──────────┘            │
└────────────────┬────────────────────────┘
                 │ HTTP Requests
                 ▼
┌─────────────────────────────────────────┐
│         FastAPI Backend                 │
│   127.0.0.1:8000                        │
│                                         │
│  GET /all-countries                     │
│  GET /country/{name}                    │
│  GET /compare/{c1}/{c2}                 │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  geopolitical_model.pkl           │  │
│  │  RandomForestClassifier           │  │
│  │  8 features → conflict probability│  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
geopolitical-dashboard/
│
├── src/
│   └── app/
│       ├── page.tsx              # Main dashboard — 12 country cards
│       ├── layout.tsx            # App layout
│       ├── globals.css           # Global styles
│       ├── country/
│       │   └── [name]/
│       │       └── page.tsx      # Country detail page with forecast chart
│       └── map/
│           └── page.tsx          # Interactive conflict map with news feed
│
├── python-api/
│   ├── main.py                   # FastAPI server — all endpoints + country data
│   ├── geopolitical_model.pkl    # Trained RandomForest model
│   └── requirements.txt          # Python dependencies
│
├── public/                       # Static assets
├── .env.local                    # API keys (not committed to git)
├── .gitignore
├── next.config.ts
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/vipuljain675-projects/ML-Machine-Learning-Project.git
cd ML-Machine-Learning-Project
```

**2. Install frontend dependencies**
```bash
npm install
```

**3. Install Python dependencies**
```bash
cd python-api
pip3 install fastapi uvicorn scikit-learn numpy
```

**4. Add the model file**

The `.pkl` model file is not committed to git (too large). You need to either:
- Train it yourself using the Colab notebook (see below)
- Or download it separately and place it in `python-api/geopolitical_model.pkl`

**5. Set up environment variables**

Create `.env.local` in the root directory:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_NEWS_API_KEY=your_newsapi_key_here
```

Get a free NewsAPI key at: https://newsapi.org

### Running The App

You need **two terminals running simultaneously**:

**Terminal 1 — Python API:**
```bash
cd python-api
python3 -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Next.js Frontend:**
```bash
npm run dev
```

**Access:**
- Dashboard: http://localhost:3000
- Conflict Map: http://localhost:3000/map
- API Docs: http://127.0.0.1:8000/docs

---

## 🔌 API Endpoints

### `GET /all-countries`
Returns risk scores for all 12 countries for 2025.

```json
[
  {
    "country": "Russia",
    "flag": "🇷🇺",
    "region": "Europe/Asia",
    "risk_score": 89.0,
    "risk_level": "CRITICAL",
    "risk_color": "#ef4444"
  },
  ...
]
```

### `GET /country/{country_name}`
Returns full 2025–2040 forecast for a specific country.

```json
{
  "country": "Russia",
  "current_risk": 89.0,
  "risk_level": "CRITICAL",
  "forecast": [
    { "year": 2025, "risk_score": 89.0, "gdp_growth": -3.0, ... },
    { "year": 2026, "risk_score": 90.5, ... },
    ...
  ],
  "key_indicators": {
    "gdp_growth": -3.0,
    "military_spend": 5.9,
    "inflation": 7.0,
    "unemployment": 4.0
  }
}
```

### `GET /compare/{country1}/{country2}`
Returns side-by-side forecast data for two countries.

---

## 🗺️ Features In Detail

### Main Dashboard
- 12 country cards with real-time risk scores
- Color coded: 🔴 CRITICAL (70%+), 🟠 HIGH (50-70%), 🟡 MODERATE (30-50%), 🟢 LOW (<30%)
- Region filters: Asia, Middle East, Europe, Americas
- Summary stats: countries monitored, critical count, high risk count

### Country Detail Page
- 2025–2040 risk forecast line chart
- 50% threshold line (conflict likely above this)
- Year-by-year breakdown table with GDP, military spend, inflation
- Click any country card from dashboard to open

### Conflict Map (`/map`)
- Interactive Leaflet.js world map
- Colored bubble markers on each country
- Bubble size scales with risk score
- Year slider: drag from 2025 → 2040, bubbles update live
- Click any bubble or country card → loads live news in sidebar

### Live News Sidebar
- Pulls real headlines from NewsAPI for the selected country
- Keyword-based sentiment analysis:
  - ⚠️ NEGATIVE: war, attack, conflict, crisis, missile, bomb...
  - ✅ POSITIVE: peace, deal, agreement, ceasefire, diplomatic...
  - 📰 NEUTRAL: everything else
- Shows news-adjusted risk score vs base model score

---

## 🌍 Countries Monitored

| Country | Region | 2025 Risk |
|---|---|---|
| 🇷🇺 Russia | Europe/Asia | CRITICAL |
| 🇮🇱 Israel | Middle East | CRITICAL |
| 🇮🇷 Iran | Middle East | CRITICAL |
| 🇵🇰 Pakistan | Asia | HIGH |
| 🇸🇦 Saudi Arabia | Middle East | HIGH |
| 🇹🇷 Turkey | Middle East/Europe | MODERATE |
| 🇨🇳 China | Asia | MODERATE |
| 🇮🇳 India | Asia | MODERATE |
| 🇺🇸 USA | Americas | LOW |
| 🇬🇧 UK | Europe | LOW |
| 🇫🇷 France | Europe | LOW |
| 🇮🇩 Indonesia | Asia | LOW |

---

## 🧪 Training The Model (Google Colab)

The model was trained in Google Colab using:

1. **UCDP GED Dataset** — georeferenced conflict events 1946–2024
2. **World Bank WDI** — economic indicators via `wbgapi` Python library

Training steps:
```python
# Load and merge datasets
df = merge(ucdp_data, worldbank_data, on=['country', 'year'])

# Define features and target
X = df[['gdp_growth', 'military_spend', 'working_age_pop',
        'gdp_per_capita_growth', 'inflation', 'unemployment',
        'conflict_last_year', 'conflict_3yr_avg']]
y = df['conflict']

# Train model
model = RandomForestClassifier(n_estimators=100, class_weight='balanced')
model.fit(X_train, y_train)

# Result: 97.3% accuracy on test set
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 16.1.6 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Map | Leaflet.js |
| Backend | FastAPI |
| ML | scikit-learn RandomForest |
| Data Processing | pandas, numpy |
| News API | NewsAPI.org |
| Model Serialization | pickle |

---

## ⚠️ Limitations & Disclaimers

- **Future scenarios are estimates**, not real forecasts. They represent plausible trajectories based on current geopolitical trends, not guaranteed predictions.
- **Model trained on historical patterns** — it cannot predict unprecedented events (black swans).
- **NewsAPI free tier** limits 100 requests/day and only works from browser (not server-side).
- **12 countries only** — a production system would cover 190+ nations.
- **Static economic data** — a production system would pull live World Bank/IMF data automatically.

---

## 🔮 Future Improvements

- [ ] Live World Bank API integration for real 2025 current values
- [ ] IMF official forecasts replacing manual scenario inputs
- [ ] Expand to 50+ countries
- [ ] Deploy to Vercel + Railway for public access
- [ ] Automated daily model retraining with new conflict data
- [ ] War zone polygon overlays on map (ACLED/GeoJSON data)
- [ ] Country comparison feature
- [ ] Historical timeline visualization (1946–2024)
- [ ] Export reports as PDF

---

## 👨‍💻 Author

**Vipul Jain**  
ML + Full Stack Project  
Built: March 2026

---

## 📄 License

This project is for educational and portfolio purposes.  
Conflict data © UCDP Uppsala University.  
Economic data © World Bank Open Data.