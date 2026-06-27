import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.models import Player, Goalkeeper, ShootoutRequest, MonteCarloResult
from backend.simulation import run_monte_carlo

app = FastAPI(title="Penalty Shootout Predictor")

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
        with open(players_file, "r") as f:
            data = json.load(f)
            for item in data:
                player = Player(**item)
                players_db[player.id] = player
                
    if keepers_file.exists():
        with open(keepers_file, "r") as f:
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
def get_players():
    return list(players_db.values())

@app.get("/keepers", response_model=list[Goalkeeper])
def get_keepers():
    return list(keepers_db.values())

@app.get("/national-squads")
def get_national_squads():
    return national_squads_db

@app.get("/player/{player_id}", response_model=Player)
def get_player(player_id: str):
    if player_id not in players_db:
        raise HTTPException(status_code=404, detail="Player not found")
    return players_db[player_id]

@app.get("/keeper/{keeper_id}", response_model=Goalkeeper)
def get_keeper(keeper_id: str):
    if keeper_id not in keepers_db:
        raise HTTPException(status_code=404, detail="Goalkeeper not found")
    return keepers_db[keeper_id]

@app.post("/predict", response_model=MonteCarloResult)
def predict_shootout(req: ShootoutRequest):
    return run_monte_carlo(
        lineup_a=req.team_a_lineup,
        lineup_b=req.team_b_lineup,
        gk_a=req.gk_a,
        gk_b=req.gk_b,
        n=req.n_simulations
    )
