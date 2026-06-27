import json
import random
from pathlib import Path

ZONES = ["TL", "TC", "TR", "BL", "BC", "BR"]

NATIONS = [
    "Argentina", "France", "England", "Brazil", "Spain", "Germany", 
    "Portugal", "Italy", "Netherlands", "Belgium", "Croatia", "Uruguay", 
    "Colombia", "USA", "Mexico", "Japan"
]

CLUBS = [
    "Real Madrid", "Barcelona", "Atletico Madrid",
    "Manchester City", "Arsenal", "Liverpool", "Manchester United", "Chelsea",
    "Bayern Munich", "Borussia Dortmund", "Bayer Leverkusen",
    "Paris Saint-Germain", "Marseille",
    "Inter Milan", "AC Milan", "Juventus", "Napoli",
    "Benfica", "Porto", "Sporting CP"
]

def generate_player(id_str, name, nation, club):
    # random alpha leaning towards a preferred zone
    base_alpha = [random.uniform(0.5, 2.0) for _ in range(6)]
    preferred = random.randint(0, 5)
    base_alpha[preferred] += random.uniform(3.0, 7.0)
    
    return {
        "id": id_str,
        "name": name,
        "nation": nation,
        "club": club,
        "league": "Synthetic League",
        "club_nation": "Unknown",
        "foot": random.choice(["right", "right", "right", "left"]),
        "zone_alpha": base_alpha,
        "pressure_beta": random.uniform(-1.0, 0.5),
        "n_penalties": random.randint(0, 30),
        "n_shootout": random.randint(0, 10)
    }

def generate_keeper(id_str, name):
    save_beta = {}
    for sz in ZONES:
        save_beta[sz] = {}
        for dz in ZONES:
            a = random.uniform(0.5, 3.0)
            b = random.uniform(3.0, 8.0)
            # higher save chance if dive == shoot
            if sz == dz:
                a += random.uniform(2.0, 5.0)
            save_beta[sz][dz] = {"a": a, "b": b}
            
    dive_alpha = [random.uniform(1.0, 4.0) for _ in range(6)]
    
    return {
        "id": id_str,
        "name": name,
        "save_beta": save_beta,
        "dive_alpha": dive_alpha,
        "n_faced": random.randint(0, 50)
    }

def run_synthetic():
    out_dir = Path(__file__).parent / "output"
    
    players_file = out_dir / "players.json"
    keepers_file = out_dir / "keepers.json"
    
    players = []
    keepers = []
    
    if players_file.exists():
        with open(players_file, "r") as f:
            players = json.load(f)
            
    if keepers_file.exists():
        with open(keepers_file, "r") as f:
            keepers = json.load(f)
            
    # Count existing
    existing_p_names = {p["name"] for p in players}
    existing_k_names = {k["name"] for k in keepers}
    
    synth_idx = 10000
    
    # Ensure at least 1 keeper and 5 takers for each nation and club
    for team_type, team_list in [("nation", NATIONS), ("club", CLUBS)]:
        for team in team_list:
            # Find players for this team
            team_players = [p for p in players if p.get(team_type) == team]
            # Add synthetic players if needed to reach 5
            while len(team_players) < 5:
                p = generate_player(f"synth_p_{synth_idx}", f"{team} Player {len(team_players)+1}", 
                                    team if team_type == "nation" else random.choice(NATIONS),
                                    team if team_type == "club" else random.choice(CLUBS))
                players.append(p)
                team_players.append(p)
                synth_idx += 1
                
            # Keepers don't have team tags in our simple schema, but we'll add some generic ones
            
    # Add enough generic keepers to reach 30
    while len(keepers) < 30:
        k = generate_keeper(f"synth_k_{synth_idx}", f"Synth Keeper {len(keepers)+1}")
        keepers.append(k)
        synth_idx += 1
        
    with open(players_file, "w") as f:
        json.dump(players, f, indent=2)
        
    with open(keepers_file, "w") as f:
        json.dump(keepers, f, indent=2)
        
    print(f"Added synthetic data. Now have {len(players)} players and {len(keepers)} keepers.")

if __name__ == "__main__":
    run_synthetic()
