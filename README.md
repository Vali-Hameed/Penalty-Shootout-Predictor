<div align="center">
  <h1>⚽ Penalty Shootout Predictor</h1>
  <p><strong>A full-stack, predictive analytics engine utilizing Monte Carlo simulations and Bayesian statistics to forecast football penalty shootouts.</strong></p>
  
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Oracle](https://img.shields.io/badge/Oracle_VPS-F80000?style=flat-square&logo=oracle&logoColor=white)
</div>

<hr />

## 📖 Overview

An advanced, full-stack application that simulates and predicts football penalty shootouts. The engine consumes real-world open-source event data from StatsBomb, processes it via an automated ETL pipeline, and feeds it into a high-performance FastAPI backend. The results are visualized in a sleek, modern Next.js front-end featuring dynamic topological heatmaps and interactive data.

---

## ✨ Key Features

- **Monte Carlo Engine**: Runs thousands of simulated shootouts using Bayesian updates (Dirichlet distributions) to dynamically adjust goalkeeper save probabilities based on pressure multipliers and historical stats.
- **Topological Heatmaps**: Custom-built CSS gradient heatmaps visually represent penalty shot distributions and success rates across goal zones.
- **Automated ETL Pipeline**: Parses vast arrays of open-source StatsBomb JSON data, mapping `shot.end_location` coordinates into discrete analytical zones.
- **Split Architecture Deployment**: Containerized FastAPI Python backend deployed on an Oracle VPS, paired with an edge-network Next.js frontend deployed on Vercel.
- **Robust Security**: Locked down via configurable CORS origin environments and rate-limited via SlowAPI.

---

## 🧠 The Math & Simulation Engine

This predictor bridges the gap between software engineering, probability theory, and data engineering. The mathematical backbone of the engine relies on **Bayesian inference** and **Monte Carlo simulations**.

### Bayesian Inference and Priors
Instead of using raw percentages (e.g., an 80% success rate), the engine uses **Bayesian Statistics**. 
- **Beta Distribution:** A player's goal-scoring probability and a goalkeeper's save probability are modeled using a Beta distribution `Beta(α, β)`. A prior based on academic research establishes a baseline 75% conversion rate. As actual player data is loaded, their `α` (goals) and `β` (misses) are updated, giving veterans with robust data a highly confident distribution compared to rookies.
- **Dirichlet Distribution:** The goal is divided into 6 discrete topological zones. The engine models *where* a player is likely to shoot using a Dirichlet distribution (a multivariate generalization of Beta). If a player consistently favors a specific zone, their Dirichlet parameters skew random sampling in that direction.

### 3-Stage Stochastic Kick Resolution
Each kick simulation models the physical and psychological interaction between the shooter and the keeper in 3 stages:
1. **Shooter's Decision:** The engine samples the shooter's Dirichlet distribution to pick a target zone, squashing it toward a uniform distribution if psychological pressure is high.
2. **Goalkeeper's Decision:** The goalkeeper's Dirichlet dive tendencies are sampled, receiving a slight predictive "nudge" toward the shooter's most historically favored zone.
3. **Outcome Resolution:** If the keeper dives to the correct zone, their personal `Beta` save probability is evaluated against the shooter's `Beta` goal probability. An incorrect dive retains only an 18% handicap chance of making a trailing-leg save.

### Dynamic Pressure Multipliers
The math adapts to the psychological state of the shootout via a **Tension Multiplier**:
- Base tension is 1.0. It increases if the team is behind, during later rounds, in sudden death, or if a team *must* score to avoid elimination.
- High tension compresses the player's Dirichlet shot selection, increasing randomness, and severely penalizes the goalkeeper's reaction time. 
- High-volume penalty takers receive an experience modifier that mitigates these tension spikes.

### Sequential Live Learning
The Goalkeeper's Beta distribution is updated *live during the shootout simulation*. If a keeper makes a save in a specific zone during a Monte Carlo iteration, their `alpha` (success parameter) for that zone increments, simulating a boost in confidence.

### The Monte Carlo Engine
Because there are so many intersecting probabilities, `run_monte_carlo` plays out the entire shootout **10,000 times**. It aggregates the results to output an overall Win Probability and a 90% Statistical Credible Interval using Bootstrapping.

---

## 📁 Repository Structure

```text
Penalty-Shootout-Predictor/
├── backend/                  # FastAPI Application & Simulation Engine
│   ├── main.py               # REST API entrypoint
│   ├── simulation.py         # Monte Carlo Dirichlet logic
│   ├── models.py             # Pydantic schemas
│   ├── Dockerfile            # Backend container configuration
│   └── docker-compose.yml    # Orchestration for Oracle VPS
├── etl/                      # Data Extraction, Transformation, Loading
│   ├── statsbomb_pipeline.py # Coordinate mapping and aggregation
│   └── merge_datasets.py     # Final JSON roster compilation
├── frontend/                 # Next.js UI Application
│   ├── src/                  # React components, stores, and layouts
│   ├── Dockerfile            # Standalone build configuration
│   └── docker-compose.yml    # Local frontend container configuration
├── .dockerignore             # Docker build optimizations
└── .env.example              # Environment variables template
```

---

## 💻 Local Development Setup

### 1. Prerequisites
- Docker & Docker Compose (Recommended)
- Python 3.11+ and Node.js 18+ (If running manually)

### 2. Generate Data via ETL Pipeline
The backend requires aggregated data files before it can run. Because this pipeline fetches open-source data from multiple providers (StatsBomb, Understat, Transfermarkt), it is split into several scripts:

```bash
# Setup Python Environment
python3 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
export PYTHONPATH="."

# 1. Fetch Understat Penalty Data (Optional, recommended for accurate priors)
python etl/understat_pipeline.py

# 2. Scrape Transfermarkt Active Players (Optional, handles filtering)
python etl/transfermarkt_scraper.py

# 3. Process StatsBomb Open Data (Will clone ~3GB repository automatically)
python etl/statsbomb_pipeline.py

# 4. Merge all sources into final models and apply Bayesian priors
python etl/merge_datasets.py
```
*(Note: If you skip steps 1 and 2, step 4 will still succeed using cached fallback data).*

### 3. Run Application via Docker (Recommended)
The easiest way to run the full application (Backend + Frontend) is via Docker Compose.

```bash
# Navigate to the backend directory and start the backend
cd backend
docker-compose up -d --build

# Navigate to the frontend directory and start the frontend
cd ../frontend
docker-compose up -d --build
```
The Frontend will be available at `http://localhost:3000` and the API at `http://localhost:8002`.

### 4. Run Manually (Without Docker)

**Backend:**
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8002 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Deployment

This project is deployed across a split infrastructure:

### Backend (Oracle VPS)
1. Clone the repository on the VPS.
2. Ensure you have the `etl/output/players.json` and `keepers.json` files (either by committing them to git locally and pulling, or running the ETL pipeline on the VPS).
3. Start the Dockerized server from the backend directory: `cd backend && docker-compose up -d --build`.
4. Create a `.env` file in the `backend` directory containing `ALLOWED_ORIGINS` to secure the API against cross-site attacks.

### Frontend (Vercel)
1. Import the repository into Vercel, pointing the Root Directory to `frontend`.
2. Define the `NEXT_PUBLIC_API_URL` and `INTERNAL_API_URL` environment variables to point to your Oracle VPS IP address.
3. Deploy to the edge network.

---

## Tech Stack

### Application & APIs
- **Frontend Framework**: Next.js (App Router), React 18
- **Styling**: Tailwind CSS
- **Backend Framework**: FastAPI (Python 3.11+)
- **Server**: Uvicorn

### Data & Analytics
- **Data Source**: StatsBomb Open Data
- **Engine**: Custom Bayesian Monte Carlo Engine

### Infrastructure
- **Deployment**: Oracle VPS (Backend), Vercel (Frontend)
- **Containerization**: Docker & Docker Compose

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <i>Developed by <a href="https://github.com/Vali-Hameed">Vali Hameed</a></i>
</div>