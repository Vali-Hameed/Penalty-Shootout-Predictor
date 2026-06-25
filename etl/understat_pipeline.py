import json
import time
from pathlib import Path
from thefuzz import process, fuzz
from understatapi import UnderstatClient

ZONES = ["TL", "TC", "TR", "BL", "BC", "BR"]

LEAGUES = ['EPL', 'La_liga', 'Bundesliga', 'Serie_A', 'Ligue_1', 'RFPL']
# Understat goes from 2014 to present
SEASONS = [str(y) for y in range(2014, 2026)]

def load_transfermarkt_squads():
    out_dir = Path(__file__).parent / "output"
    squads_file = out_dir / "transfermarkt_squads.json"
    if squads_file.exists():
        with open(squads_file, "r") as f:
            return json.load(f)
    return []

def fetch_understat_players():
    print("Fetching unique players from Understat leagues...")
    understat_players = {}
    with UnderstatClient() as client:
        for league in LEAGUES:
            for season in SEASONS:
                try:
                    players = client.league(league=league).get_player_data(season=season)
                    for p in players:
                        p_id = str(p['id'])
                        if p_id not in understat_players:
                            understat_players[p_id] = p['player_name']
                except Exception as e:
                    # Some seasons might not exist yet
                    pass
    print(f"Found {len(understat_players)} unique players in Understat.")
    return understat_players

def match_players(tm_squads, understat_players):
    """Fuzzy match Transfermarkt squad players to Understat players."""
    print("Matching players...")
    matched = []
    
    # Create a list of names for fuzzy matching
    u_names = list(understat_players.values())
    name_to_id = {v: k for k, v in understat_players.items()}
    
    for tm_p in tm_squads:
        # Match name
        best_match, score = process.extractOne(tm_p['name'], u_names, scorer=fuzz.token_sort_ratio)
        if score > 80: # 80 is a reasonable threshold
            matched.append({
                "tm_data": tm_p,
                "understat_id": name_to_id[best_match],
                "understat_name": best_match,
                "score": score
            })
            
    print(f"Matched {len(matched)} / {len(tm_squads)} players.")
    return matched

def get_player_penalties(matched_players):
    print("Fetching penalty shot data for matched players...")
    player_stats = {}
    with UnderstatClient() as client:
        for p in matched_players:
            p_id = p['understat_id']
            name = p['tm_data']['name']
            
            try:
                shots = client.player(player=p_id).get_shot_data()
                penalties = [s for s in shots if s['situation'] == 'Penalty']
                
                # Note: Understat provides X, Y representing pitch coordinates (origin of shot), 
                # but NOT goal-mouth placement coordinates. We can track conversion outcomes.
                n_penalties = len(penalties)
                goals = sum(1 for s in penalties if s['result'] == 'Goal')
                misses = n_penalties - goals
                
                player_stats[name] = {
                    "tm_data": p['tm_data'],
                    "n_penalties": n_penalties,
                    "goals": goals,
                    "misses": misses,
                    "understat_id": p_id
                }
            except Exception as e:
                print(f"Failed to fetch shots for {name}: {e}")
                
            time.sleep(0.1) # Rate limit
            
    return player_stats

if __name__ == "__main__":
    tm_squads = load_transfermarkt_squads()
    if not tm_squads:
        print("No Transfermarkt squads found. Run transfermarkt_scraper.py first.")
        exit(1)
        
    u_players = fetch_understat_players()
    matched = match_players(tm_squads, u_players)
    stats = get_player_penalties(matched)
    
    out_dir = Path(__file__).parent / "output"
    out_dir.mkdir(exist_ok=True)
    with open(out_dir / "understat_penalties.json", "w") as f:
        json.dump(stats, f, indent=2)
        
    print(f"Saved Understat penalty stats for {len(stats)} players.")
