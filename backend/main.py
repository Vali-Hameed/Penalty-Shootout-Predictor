import json
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from backend.models import Player, Goalkeeper, ShootoutRequest, MonteCarloResult
from backend.simulation import run_monte_carlo

app = FastAPI(title="Penalty Shootout Predictor")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for seeded data
players_db = {}
keepers_db = {}
national_squads_db = {}

def load_data():
    base_dir = Path(__file__).parent.parent / "etl" / "output"
    
    players_file = base_dir / "players.json"
    keepers_file = base_dir / "keepers.json"
    
    if players_file.exists():
        with open(players_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            for item in data:
                player = Player(**item)
                players_db[player.id] = player
                
    if keepers_file.exists():
        with open(keepers_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            for item in data:
                keeper = Goalkeeper(**item)
                keepers_db[keeper.id] = keeper

    squads_file = base_dir / "national_squads.json"
    if squads_file.exists():
        with open(squads_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            for nation, players in data.items():
                national_squads_db[nation] = players

@app.on_event("startup")
async def startup_event():
    load_data()

@app.get("/players", response_model=list[Player])
@limiter.limit("100/minute")
def get_players(request: Request):
    return list(players_db.values())

@app.get("/keepers", response_model=list[Goalkeeper])
@limiter.limit("100/minute")
def get_keepers(request: Request):
    return list(keepers_db.values())

@app.get("/national-squads")
@limiter.limit("100/minute")
def get_national_squads(request: Request):
    return national_squads_db

@app.get("/player/{player_id}", response_model=Player)
@limiter.limit("100/minute")
def get_player(request: Request, player_id: str):
    if player_id not in players_db:
        raise HTTPException(status_code=404, detail="Player not found")
    return players_db[player_id]

@app.get("/keeper/{keeper_id}", response_model=Goalkeeper)
@limiter.limit("100/minute")
def get_keeper(request: Request, keeper_id: str):
    if keeper_id not in keepers_db:
        raise HTTPException(status_code=404, detail="Goalkeeper not found")
    return keepers_db[keeper_id]

@app.post("/predict", response_model=MonteCarloResult)
@limiter.limit("5/minute")
def predict_shootout(request: Request, req: ShootoutRequest):
    return run_monte_carlo(
        lineup_a=req.team_a_lineup,
        lineup_b=req.team_b_lineup,
        gk_a=req.gk_a,
        gk_b=req.gk_b,
        n=req.n_simulations
    )

