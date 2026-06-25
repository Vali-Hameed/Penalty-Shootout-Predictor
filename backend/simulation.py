import numpy as np
import copy
from backend.models import Player, Goalkeeper, KickResult, KickLogEntry, MonteCarloResult

ZONES = ["TL", "TC", "TR", "BL", "BC", "BR"]

def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + np.exp(-x))

def is_shootout_context(round_num: int, score_diff: int) -> float:
    # A multiplier for pressure. 
    # Base shootout is 1.0. Increases in later rounds and if score is tight.
    tension = 1.0
    if round_num >= 4:
        tension += 0.5
    if score_diff < 0:
        tension += 0.5  # Behind, more pressure
    return tension

def simulate_kick(player: Player, gk: Goalkeeper, round_num: int, score_diff: int, gk_live_beta: dict) -> KickResult:
    # Stage 1: sample shooter zone from Dirichlet posterior
    shooter_alpha = np.maximum(player.zone_alpha, 0.01)
    zone_probs = np.random.dirichlet(shooter_alpha)
    
    pressure_logit = player.pressure_beta * is_shootout_context(round_num, score_diff)
    pressure_factor = sigmoid(pressure_logit)
    
    # Values < 0.5 increase spread -> more random (squash toward uniform)
    zone_probs = (1 - pressure_factor) * (1/6) + pressure_factor * zone_probs
    zone_probs /= zone_probs.sum()
    
    shoot_zone = np.random.choice(ZONES, p=zone_probs)
    
    is_top = shoot_zone.startswith("T")
    base_miss = 0.055 if is_top else 0.030
    
    # Stage 2: GK dive decision
    gk_dive_alpha = np.maximum(gk.dive_alpha, 0.01)
    dive_probs = np.random.dirichlet(gk_dive_alpha)
    shooter_modal_idx = np.argmax(player.zone_alpha)
    shooter_modal = ZONES[shooter_modal_idx]
    
    TENDENCY_WEIGHT = 0.45
    nudged = dive_probs.copy()
    nudged[shooter_modal_idx] += TENDENCY_WEIGHT
    nudged /= nudged.sum()
    
    gk_dive = np.random.choice(ZONES, p=nudged)
    
    gk_reaches = (gk_dive == shoot_zone) and (not is_top or np.random.random() < 0.32)
    
    # Stage 3: outcome resolution
    pair = gk_live_beta[shoot_zone][gk_dive]
    
    if np.random.random() < base_miss:
        outcome = "miss"
    elif gk_reaches:
        save_prob = np.random.beta(pair["a"], pair["b"])
        outcome = "save" if np.random.random() < save_prob else "goal"
    else:
        # No reach -> very low save chance
        save_prob = np.random.beta(pair["a"], pair["b"]) * 0.18
        outcome = "save" if np.random.random() < save_prob else "goal"
        
    # Sequential Bayesian update
    if outcome == "save":
        gk_live_beta[shoot_zone][gk_dive]["a"] += 1
    elif outcome == "goal":
        gk_live_beta[shoot_zone][gk_dive]["b"] += 1
        
    return KickResult(
        shoot_zone=shoot_zone,
        gk_dive=gk_dive,
        gk_reaches=gk_reaches,
        outcome=outcome,
        save_prob_posterior_mean=pair["a"] / (pair["a"] + pair["b"])
    )

def simulate_shootout(lineup_a: list[Player], lineup_b: list[Player], gk_a: Goalkeeper, gk_b: Goalkeeper):
    # Deep copy the beta dicts so we can mutate them during the shootout
    gk_a_live = {sz: {dz: {"a": pair.a, "b": pair.b} for dz, pair in dives.items()} for sz, dives in gk_a.save_beta.items()}
    gk_b_live = {sz: {dz: {"a": pair.a, "b": pair.b} for dz, pair in dives.items()} for sz, dives in gk_b.save_beta.items()}
    
    score_a, score_b = 0, 0
    log = []
    
    # Standard 5 rounds
    for rd in range(5):
        if rd < len(lineup_a):
            r_a = simulate_kick(lineup_a[rd], gk_b, rd+1, score_a - score_b, gk_b_live)
            if r_a.outcome == "goal": score_a += 1
            log.append(KickLogEntry(round_str=str(rd+1), team="A", result=r_a))
            
            # Early elimination check after Team A shoots
            if score_a - score_b > (5 - rd) or score_b - score_a > (4 - rd):
                break
                
        if rd < len(lineup_b):
            r_b = simulate_kick(lineup_b[rd], gk_a, rd+1, score_b - score_a, gk_a_live)
            if r_b.outcome == "goal": score_b += 1
            log.append(KickLogEntry(round_str=str(rd+1), team="B", result=r_b))
            
            # Early elimination check after Team B shoots
            if abs(score_a - score_b) > (4 - rd):
                break
                
    # Sudden death
    sd = 0
    while score_a == score_b and sd < 20:
        idx = (5 + sd) % len(lineup_a)
        r_a = simulate_kick(lineup_a[idx], gk_b, 6+sd, score_a - score_b, gk_b_live)
        if r_a.outcome == "goal": score_a += 1
        log.append(KickLogEntry(round_str=f"SD{sd+1}", team="A", result=r_a))
        
        idx_b = (5 + sd) % len(lineup_b)
        r_b = simulate_kick(lineup_b[idx_b], gk_a, 6+sd, score_b - score_a, gk_a_live)
        if r_b.outcome == "goal": score_b += 1
        log.append(KickLogEntry(round_str=f"SD{sd+1}", team="B", result=r_b))
        
        if score_a != score_b:
            break
        sd += 1
        
    return score_a, score_b, log

def run_monte_carlo(lineup_a: list[Player], lineup_b: list[Player], gk_a: Goalkeeper, gk_b: Goalkeeper, n: int = 10000) -> MonteCarloResult:
    wins_a, wins_b = 0, 0
    score_diffs = []
    
    demo_log = []
    demo_sa = 0
    demo_sb = 0
    
    total_sa = 0
    total_sb = 0
    
    for i in range(n):
        sa, sb, log = simulate_shootout(lineup_a, lineup_b, gk_a, gk_b)
        if sa > sb:
            wins_a += 1
        else:
            wins_b += 1
        score_diffs.append(sa - sb)
        total_sa += sa
        total_sb += sb
        
        if i == 0:
            demo_log = log
            demo_sa = sa
            demo_sb = sb
            
    win_prob_a = wins_a / n
    # Bootstrap 90% credible interval on win probability
    samples = np.array([np.random.binomial(1, win_prob_a) for _ in range(2000)])
    ci_low = float(np.percentile(samples, 5))
    ci_high = float(np.percentile(samples, 95))
    
    return MonteCarloResult(
        team_a_win_prob=win_prob_a,
        team_b_win_prob=wins_b / n,
        ci_low=ci_low,
        ci_high=ci_high,
        expected_score_a=total_sa / n,
        expected_score_b=total_sb / n,
        n_simulations=n,
        demo_shootout_log=demo_log,
        demo_score_a=demo_sa,
        demo_score_b=demo_sb
    )
