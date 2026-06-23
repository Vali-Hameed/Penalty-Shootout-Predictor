import json
import os
import subprocess
from pathlib import Path
from collections import defaultdict
import numpy as np

# ZONES
ZONES = ["TL", "TC", "TR", "BL", "BC", "BR"]

def clone_statsbomb_data():
    base_dir = Path(__file__).parent
    data_dir = base_dir / "open-data"
    if not data_dir.exists():
        print("Cloning StatsBomb open data...")
        subprocess.run(["git", "clone", "--depth", "1", "https://github.com/statsbomb/open-data.git", str(data_dir)])
    return data_dir

def get_zone(x, y):
    # x < 36 -> Left, 36-44 -> Centre, > 44 -> Right
    # y > 2.5 -> Top, <= 2.5 -> Bottom
    # Wait, StatsBomb pitch is 120x80.
    # Goal is on y between 36 and 44, z is height 0 to 2.67.
    # The prompt specified: x < 36 -> Left, 36-44 -> Centre, > 44 -> Right, y > 2.5 -> Top, <= 2.5 -> Bottom
    # Let's use the prompt's exact logic:
    if x < 36:
        col = "L"
    elif x <= 44:
        col = "C"
    else:
        col = "R"
        
    if y > 2.5:
        row = "T"
    else:
        row = "B"
        
    return f"{row}{col}"

def run_pipeline():
    data_dir = clone_statsbomb_data()
    events_dir = data_dir / "data" / "events"
    
    if not events_dir.exists():
        print("Events directory not found. Please ensure the data is cloned properly.")
        return
        
    player_zone_counts = defaultdict(lambda: {z: 0 for z in ZONES})
    player_kicks = defaultdict(int)
    player_shootout_kicks = defaultdict(int)
    player_info = {}
    
    gk_saves = defaultdict(lambda: defaultdict(lambda: {z: 0 for z in ZONES}))
    gk_conceded = defaultdict(lambda: defaultdict(lambda: {z: 0 for z in ZONES}))
    gk_dive_counts = defaultdict(lambda: {z: 0 for z in ZONES})
    gk_faced = defaultdict(int)
    gk_info = {}

    print("Parsing events...")
    files = list(events_dir.glob("*.json"))
    for file in files:
        with open(file, "r", encoding="utf-8") as f:
            events = json.load(f)
            
        for event in events:
            if event.get("type", {}).get("name") == "Shot" and event.get("shot", {}).get("type", {}).get("name") == "Penalty":
                shot = event["shot"]
                player = event["player"]
                p_id = str(player["id"])
                
                # Info
                if p_id not in player_info:
                    player_info[p_id] = {
                        "name": player["name"],
                        "nation": "Unknown", # Not always available in event
                        "club": event["possession_team"]["name"],
                        "foot": shot.get("body_part", {}).get("name", "right").lower()
                    }
                    
                is_shootout = event.get("period", 0) >= 5
                
                player_kicks[p_id] += 1
                if is_shootout:
                    player_shootout_kicks[p_id] += 1
                    
                end_loc = shot.get("end_location", [0, 0, 0])
                if len(end_loc) >= 3:
                    # x is width, y is height? Or y is width, z is height?
                    # Statsbomb: x = 120, y = 36-44, z = 0-2.67
                    # Prompt specified x and y, so let's map: width -> x, height -> y based on prompt.
                    # In StatsBomb end_location for shots is [x, y, z].
                    # Wait, prompt says: x < 36 -> Left. So prompt x is actually StatsBomb y (width). 
                    # And prompt y > 2.5 -> Top. So prompt y is actually StatsBomb z (height).
                    w = end_loc[1] # width
                    h = end_loc[2] # height
                    zone = get_zone(w, h)
                else:
                    zone = "BC" # Default
                    
                player_zone_counts[p_id][zone] += 1
                
                outcome = shot.get("outcome", {}).get("name")
                
                # Find Goalkeeper
                freeze_frame = shot.get("freeze_frame", [])
                gk = None
                for p in freeze_frame:
                    if p.get("position", {}).get("name") == "Goalkeeper" and not p["teammate"]:
                        gk = p
                        break
                        
                if gk:
                    gk_id = str(gk["player"]["id"])
                    if gk_id not in gk_info:
                        gk_info[gk_id] = {
                            "name": gk["player"]["name"]
                        }
                    
                    gk_faced[gk_id] += 1
                    # Extract GK dive zone (approximate from freeze frame if available, else random for baseline)
                    # StatsBomb doesn't reliably have GK dive end location, we'll assign BC or based on outcome
                    # For simplicity, we'll assign dive to the shot zone if saved, otherwise BC.
                    if outcome == "Saved":
                        dive_zone = zone
                        gk_saves[gk_id][zone][dive_zone] += 1
                    else:
                        dive_zone = "BC"
                        if outcome == "Goal":
                            gk_conceded[gk_id][zone][dive_zone] += 1
                            
                    gk_dive_counts[gk_id][dive_zone] += 1

    print("Computing Priors...")
    # Dirichlet prior
    KAPPA = 10
    total_kicks = sum(player_kicks.values())
    if total_kicks > 0:
        zone_totals = {z: sum(player_zone_counts[p][z] for p in player_zone_counts) for z in ZONES}
        alpha_0 = [zone_totals[z] / total_kicks * KAPPA for z in ZONES]
    else:
        alpha_0 = [KAPPA / 6] * 6
        
    KAPPA_GK = 5
    pop_save_rate = 0.18 # Population average save rate
    a0 = pop_save_rate * KAPPA_GK
    b0 = (1 - pop_save_rate) * KAPPA_GK

    print("Building Bayesian JSONs...")
    players_output = []
    for p_id, info in player_info.items():
        # Alpha
        zone_alpha = [alpha_0[i] + player_zone_counts[p_id][ZONES[i]] for i in range(6)]
        
        # Pressure beta - simple fallback logic
        pressure_beta = -0.5
        
        players_output.append({
            "id": p_id,
            "name": info["name"],
            "nation": info["nation"],
            "club": info["club"],
            "foot": info["foot"] if info["foot"] in ["left", "right"] else "right",
            "zone_alpha": zone_alpha,
            "pressure_beta": pressure_beta,
            "n_penalties": player_kicks[p_id],
            "n_shootout": player_shootout_kicks[p_id]
        })
        
    keepers_output = []
    for gk_id, info in gk_info.items():
        save_beta = {}
        for sz in ZONES:
            save_beta[sz] = {}
            for dz in ZONES:
                saves = gk_saves[gk_id][sz][dz]
                goals = gk_conceded[gk_id][sz][dz]
                save_beta[sz][dz] = {
                    "a": a0 + saves,
                    "b": b0 + goals
                }
                
        dive_alpha = [alpha_0[i] + gk_dive_counts[gk_id][ZONES[i]] for i in range(6)]
        
        keepers_output.append({
            "id": gk_id,
            "name": info["name"],
            "save_beta": save_beta,
            "dive_alpha": dive_alpha,
            "n_faced": gk_faced[gk_id]
        })
        
    out_dir = Path(__file__).parent / "output"
    out_dir.mkdir(exist_ok=True)
    
    with open(out_dir / "players.json", "w") as f:
        json.dump(players_output, f, indent=2)
        
    with open(out_dir / "keepers.json", "w") as f:
        json.dump(keepers_output, f, indent=2)
        
    with open(out_dir / "priors.json", "w") as f:
        json.dump({"alpha_0": alpha_0, "a0": a0, "b0": b0}, f, indent=2)
        
    print("ETL complete. Processed", len(players_output), "players and", len(keepers_output), "keepers.")

if __name__ == "__main__":
    run_pipeline()
