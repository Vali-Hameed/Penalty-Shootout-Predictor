import json
from pathlib import Path
from thefuzz import process, fuzz
import uuid

ZONES = ["TL", "TC", "TR", "BL", "BC", "BR"]

# arXiv priors (2023 Paper on penalty shootout difficulty)
PRIOR_OPEN_PLAY_GOAL = 0.79
PRIOR_SHOOTOUT_GOAL = 0.75
KAPPA = 10 # Dirichlet prior strength
ALPHA_0_VAL = KAPPA / 6
ALPHA_0 = [ALPHA_0_VAL] * 6

def load_json(filepath):
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def run_merge():
    out_dir = Path(__file__).parent / "output"
    
    # 1. Load the new sources
    tm_squads = load_json(out_dir / "transfermarkt_squads.json")
    understat_stats = load_json(out_dir / "understat_penalties.json")
    
    # 2. Load Statsbomb fallback and GK data
    sb_players = load_json(out_dir / "players_statsbomb_backup.json")
    sb_keepers = load_json(out_dir / "keepers_statsbomb_backup.json")
    
    # If backups don't exist, use the current players.json as backup (which is pure StatsBomb right now)
    if not sb_players and (out_dir / "players.json").exists():
        sb_players = load_json(out_dir / "players.json")
        with open(out_dir / "players_statsbomb_backup.json", "w", encoding="utf-8") as f:
            json.dump(sb_players, f, indent=2)
            
    if not sb_keepers and (out_dir / "keepers.json").exists():
        sb_keepers = load_json(out_dir / "keepers.json")
        with open(out_dir / "keepers_statsbomb_backup.json", "w", encoding="utf-8") as f:
            json.dump(sb_keepers, f, indent=2)
    
    if not tm_squads:
        print("Transfermarkt data missing. Run transfermarkt_scraper.py first.")
        return
        
    print(f"Loaded {len(tm_squads)} TM players, {len(understat_stats)} Understat records")
    print(f"Loaded {len(sb_players)} SB players, {len(sb_keepers)} SB keepers")
    
    sb_p_names = {p['name']: p for p in sb_players}
    sb_k_names = {k['name']: k for k in sb_keepers}
    
    final_players = []
    final_keepers = []
    
    for p in tm_squads:
        name = p['name']
        nation = p['nation']
        club = p['club']
        is_active = True
        
        if "Goalkeeper" in p.get("position", ""):
            best_match, score = process.extractOne(name, list(sb_k_names.keys()) if sb_k_names else [""], scorer=fuzz.token_sort_ratio) if sb_k_names else ("", 0)
            if score > 80:
                k_data = sb_k_names[best_match]
                final_keepers.append({
                    "id": k_data['id'],
                    "name": name,
                    "nation": nation,
                    "club": club,
                    "save_beta": k_data['save_beta'],
                    "dive_alpha": k_data['dive_alpha'],
                    "n_faced": k_data['n_faced'],
                    "is_active": is_active
                })
            else:
                KAPPA_GK = 5
                # Using the arXiv open play goal rate for the beta distribution a priori
                a0 = (1 - PRIOR_OPEN_PLAY_GOAL) * KAPPA_GK  # save prior
                b0 = PRIOR_OPEN_PLAY_GOAL * KAPPA_GK        # goal prior
                save_beta = {}
                for sz in ZONES:
                    save_beta[sz] = {}
                    for dz in ZONES:
                        # Slightly higher save chance if dive zone == shot zone
                        a_prior = a0 * 1.5 if sz == dz else a0
                        save_beta[sz][dz] = {"a": a_prior, "b": b0}
                final_keepers.append({
                    "id": str(uuid.uuid4()),
                    "name": name,
                    "nation": nation,
                    "club": club,
                    "save_beta": save_beta,
                    "dive_alpha": ALPHA_0.copy(),
                    "n_faced": 0,
                    "is_active": is_active
                })
            continue

        n_penalties = 0
        n_shootout = 0
        zone_alpha = ALPHA_0.copy()
        foot = "right"
        pressure_beta = -0.5
        sb_id = None
        
        sb_match, sb_score = process.extractOne(name, list(sb_p_names.keys()) if sb_p_names else [""], scorer=fuzz.token_sort_ratio) if sb_p_names else ("", 0)
        if sb_score > 80:
            sb_data = sb_p_names[sb_match]
            sb_id = sb_data['id']
            zone_alpha = sb_data.get('zone_alpha', zone_alpha)
            foot = sb_data.get('foot', foot)
            n_penalties = sb_data.get('n_penalties', 0)
            n_shootout = sb_data.get('n_shootout', 0)
            pressure_beta = sb_data.get('pressure_beta', pressure_beta)
            
        if name in understat_stats:
            u_data = understat_stats[name]
            u_n_penalties = u_data['n_penalties']
            if u_n_penalties > n_penalties:
                added = u_n_penalties - n_penalties
                n_penalties = u_n_penalties
                # Distribute the additional un-mapped penalties evenly
                for i in range(6):
                    zone_alpha[i] += (added / 6)
                    
        final_players.append({
            "id": sb_id if sb_id else str(uuid.uuid4()),
            "name": name,
            "nation": nation,
            "club": club,
            "foot": foot,
            "zone_alpha": zone_alpha,
            "pressure_beta": pressure_beta,
            "n_penalties": n_penalties,
            "n_shootout": n_shootout,
            "is_active": is_active
        })

    print(f"Generated {len(final_players)} World Cup players and {len(final_keepers)} World Cup keepers.")
    
    with open(out_dir / "players.json", "w", encoding="utf-8") as f:
        json.dump(final_players, f, indent=2)
        
    with open(out_dir / "keepers.json", "w", encoding="utf-8") as f:
        json.dump(final_keepers, f, indent=2)
        
    print("Saved merged players.json and keepers.json")

if __name__ == "__main__":
    run_merge()
