import json
import os
import subprocess
import concurrent.futures
import wikipedia
from pathlib import Path
from collections import defaultdict

# ZONES
ZONES = ["TL", "TC", "TR", "BL", "BC", "BR"]

# Setup Wikipedia API
wikipedia.set_user_agent("PenaltyPredictorBot/1.0 (valih@example.com)")

def clone_statsbomb_data():
    base_dir = Path(__file__).parent
    data_dir = base_dir / "open-data"
    if not data_dir.exists():
        print("Cloning StatsBomb open data...")
        subprocess.run(["git", "clone", "--depth", "1", "https://github.com/statsbomb/open-data.git", str(data_dir)])
    return data_dir

def get_zone(x, y):
    # Width goes from 36 to 44. Split into three equal ~2.66 yard sections.
    if x < 38.67:
        col = "L"
    elif x <= 41.33:
        col = "C"
    else:
        col = "R"
        
    # Height goes up to 2.67 yards. Split evenly at ~1.33 yards.
    if y > 1.33:
        row = "T"
    else:
        row = "B"
        
    return f"{row}{col}"

def is_player_active(name):
    try:
        search_results = wikipedia.search(name + " footballer", results=1)
        if not search_results:
            return True # default to active if not found
        try:
            page = wikipedia.page(search_results[0], auto_suggest=False)
        except wikipedia.exceptions.DisambiguationError as e:
            if e.options:
                page = wikipedia.page(e.options[0], auto_suggest=False)
            else:
                return True
        except wikipedia.exceptions.PageError:
            return True

        summary = page.summary.lower()
        first_sentence = summary.split('.')[0]
        
        inactive_keywords = [" retired ", " former ", " late ", " passed away ", " was a "]
        if any(kw in summary[:300] for kw in inactive_keywords):
            return False
            
        if " is a former " in first_sentence:
            return False
            
        return True
    except wikipedia.exceptions.WikipediaException:
        return True # Default to active on failure
    except Exception as e:
        print(f"Error fetching {name}: {e}")
        return True # Default to active on failure

def run_pipeline():
    data_dir = clone_statsbomb_data()
    events_dir = data_dir / "data" / "events"
    lineups_dir = data_dir / "data" / "lineups"
    
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

    # First pass: map every player ID to a club and nation
    print("Parsing lineups for nations and all players...")
    player_id_to_nation = {}
    player_id_to_name = {}
    if lineups_dir.exists():
        for file in lineups_dir.glob("*.json"):
            with open(file, "r", encoding="utf-8") as f:
                lineups = json.load(f)
            for team in lineups:
                for p in team.get("lineup", []):
                    p_id = str(p["player_id"])
                    player_id_to_name[p_id] = p["player_name"]
                    if "country" in p and p["country"]:
                        player_id_to_nation[p_id] = p["country"]["name"]

    print("Parsing events for clubs and shots...")
    files = list(events_dir.glob("*.json"))
    player_id_to_club = {}
    
    for file in files:
        with open(file, "r", encoding="utf-8") as f:
            events = json.load(f)
            
        # Map clubs
        for event in events:
            if "player" in event and "team" in event:
                p_id = str(event["player"]["id"])
                if p_id not in player_id_to_club:
                    player_id_to_club[p_id] = event["team"]["name"]
                    
        # Process shots
        for i, event in enumerate(events):
            if event.get("type", {}).get("name") == "Shot" and event.get("shot", {}).get("type", {}).get("name") == "Penalty":
                shot = event["shot"]
                player = event["player"]
                p_id = str(player["id"])
                
                if p_id not in player_info:
                    player_info[p_id] = {
                        "name": player["name"],
                        "nation": player_id_to_nation.get(p_id, "Unknown"),
                        "club": player_id_to_club.get(p_id, event.get("possession_team", {}).get("name", "Unknown"))
                    }
                    
                is_shootout = event.get("period", 0) >= 5
                player_kicks[p_id] += 1
                if is_shootout:
                    player_shootout_kicks[p_id] += 1
                    
                end_loc = shot.get("end_location", [0, 0, 0])
                if len(end_loc) >= 3:
                    w = end_loc[1] 
                    h = end_loc[2] 
                    zone = get_zone(w, h)
                else:
                    zone = "BC" 
                    
                player_zone_counts[p_id][zone] += 1
                
                outcome = shot.get("outcome", {}).get("name")
                
                # Find Goalkeeper
                gk_player = None
                # Check upcoming events for the specific Goal Keeper action
                for j in range(i+1, min(i+10, len(events))):
                    if events[j].get("type", {}).get("name") == "Goal Keeper":
                        gk_player = events[j].get("player")
                        break
                
                # Fallback to freeze_frame
                if not gk_player:
                    freeze_frame = shot.get("freeze_frame", [])
                    for p in freeze_frame:
                        if p.get("position", {}).get("name") == "Goalkeeper" and not p.get("teammate", True):
                            gk_player = p.get("player")
                            break
                        
                if gk_player:
                    gk_id = str(gk_player["id"])
                    if gk_id not in gk_info:
                        gk_info[gk_id] = {
                            "name": gk_player["name"],
                            "nation": player_id_to_nation.get(gk_id, "Unknown"),
                            "club": player_id_to_club.get(gk_id, "Unknown")
                        }
                    
                    gk_faced[gk_id] += 1
                    if outcome == "Saved":
                        dive_zone = zone
                        gk_saves[gk_id][zone][dive_zone] += 1
                    else:
                        dive_zone = "BC"
                        if outcome == "Goal":
                            gk_conceded[gk_id][zone][dive_zone] += 1
                            
                    gk_dive_counts[gk_id][dive_zone] += 1

    # Add all players found in lineups to player_info if they didn't kick a penalty
    for p_id, name in player_id_to_name.items():
        if p_id not in player_info:
            player_info[p_id] = {
                "name": name,
                "nation": player_id_to_nation.get(p_id, "Unknown"),
                "club": player_id_to_club.get(p_id, "Unknown")
            }

    print("Skipping active status check, assuming all active...")
    unique_names = list({info["name"] for info in player_info.values()} | {info["name"] for info in gk_info.values()})
    active_status = {name: True for name in unique_names}

    print("Computing Priors...")
    KAPPA = 10
    total_kicks = sum(player_kicks.values())
    if total_kicks > 0:
        zone_totals = {z: sum(player_zone_counts[p][z] for p in player_zone_counts) for z in ZONES}
        alpha_0 = [zone_totals[z] / total_kicks * KAPPA for z in ZONES]
    else:
        alpha_0 = [KAPPA / 6] * 6
        
    KAPPA_GK = 5
    pop_save_rate = 0.18
    a0 = pop_save_rate * KAPPA_GK
    b0 = (1 - pop_save_rate) * KAPPA_GK

    print("Building Bayesian JSONs...")
    players_output = []
    for p_id, info in player_info.items():
        zone_alpha = [alpha_0[i] + player_zone_counts[p_id][ZONES[i]] for i in range(6)]
        
        players_output.append({
            "id": p_id,
            "name": info["name"],
            "nation": info["nation"],
            "club": info["club"],
            "zone_alpha": zone_alpha,
            "pressure_beta": -0.5,
            "n_penalties": player_kicks[p_id],
            "n_shootout": player_shootout_kicks[p_id],
            "is_active": active_status.get(info["name"], True)
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
            "nation": info.get("nation", "Unknown"),
            "club": info.get("club", "Unknown"),
            "save_beta": save_beta,
            "dive_alpha": dive_alpha,
            "n_faced": gk_faced[gk_id],
            "is_active": active_status.get(info["name"], True)
        })
        
    out_dir = Path(__file__).parent / "output"
    out_dir.mkdir(exist_ok=True)
    
    with open(out_dir / "players_statsbomb_backup.json", "w") as f:
        json.dump(players_output, f, indent=2)
        
    with open(out_dir / "keepers_statsbomb_backup.json", "w") as f:
        json.dump(keepers_output, f, indent=2)
        
    with open(out_dir / "priors.json", "w") as f:
        json.dump({"alpha_0": alpha_0, "a0": a0, "b0": b0}, f, indent=2)
        
    print("ETL complete. Processed", len(players_output), "players and", len(keepers_output), "keepers.")

if __name__ == "__main__":
    run_pipeline()
