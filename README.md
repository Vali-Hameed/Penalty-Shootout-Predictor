<div align="center">
  <h1>⚽ Penalty Shootout Predictor</h1>
  <p><strong>A full-stack, predictive analytics engine utilizing Monte Carlo simulations and Bayesian statistics to forecast football penalty shootouts.</strong></p>
  
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
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
- Python 3.11+
- Node.js 18+ (or Docker)

### 2. Generate Data via ETL
The backend requires aggregated data files before it can run.
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH="."
python etl/statsbomb_pipeline.py
python etl/merge_datasets.py
```

### 3. Run Backend (FastAPI)
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Run Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

*(Alternatively, run both services via `docker-compose -f backend/docker-compose.yml up --build` and `docker-compose -f frontend/docker-compose.yml up --build`)*

---

## 🚀 Deployment

This project is deployed across a split infrastructure:

### Backend (Oracle VPS)
1. Clone the repository on the VPS.
2. Run the ETL pipeline to generate the `players.json` and `keepers.json` files.
3. Start the Dockerized server: `docker-compose -f backend/docker-compose.yml up -d --build`.
4. Create a `.env` file containing `ALLOWED_ORIGINS` to secure the API against cross-site attacks.

### Frontend (Vercel)
1. Import the repository into Vercel, pointing the Root Directory to `frontend`.
2. Define the `NEXT_PUBLIC_API_URL` and `INTERNAL_API_URL` environment variables to point to your Oracle VPS IP address.
3. Deploy to the edge network.

---

## ??? Tech Stack

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