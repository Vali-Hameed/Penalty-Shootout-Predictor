from pydantic import BaseModel, Field
from typing import List, Dict, Literal, Tuple, Union

Zone = Literal["TL", "TC", "TR", "BL", "BC", "BR"]

class BetaParams(BaseModel):
    a: float
    b: float

class Player(BaseModel):
    id: str
    name: str
    nation: str
    club: str
    league: str = "Unknown"
    club_nation: str = "Unknown"
    
    # Dirichlet concentration params (one per zone, in order: TL, TC, TR, BL, BC, BR)
    zone_alpha: List[float] = Field(..., min_length=6, max_length=6)
    
    # Logistic pressure coefficient
    pressure_beta: float
    
    n_penalties: int
    n_shootout: int
    is_active: bool = True

class Goalkeeper(BaseModel):
    id: str
    name: str
    club: str = "Unknown"
    nation: str = "Unknown"
    league: str = "Unknown"
    club_nation: str = "Unknown"
    
    # save_beta[shoot_zone][dive_zone] = {"a": float, "b": float}
    save_beta: Dict[str, Dict[str, BetaParams]]
    
    # Dive tendency — Dirichlet over 6 zones (TL, TC, TR, BL, BC, BR)
    dive_alpha: List[float] = Field(..., min_length=6, max_length=6)
    
    n_faced: int
    is_active: bool = True

class KickResult(BaseModel):
    shoot_zone: str
    gk_dive: str
    gk_reaches: bool
    outcome: Literal["goal", "save", "miss"]
    save_prob_posterior_mean: float

class KickLogEntry(BaseModel):
    round_str: str  # e.g. "1", "2", "SD1"
    team: Literal["A", "B"]
    shooter_name: str
    result: KickResult

class MonteCarloResult(BaseModel):
    team_a_win_prob: float
    team_b_win_prob: float
    ci_low: float
    ci_high: float
    expected_score_a: float
    expected_score_b: float
    n_simulations: int
    
    # We will also return the detailed log of exactly one simulation for animation
    demo_shootout_log: List[KickLogEntry]
    demo_score_a: int
    demo_score_b: int

class ShootoutRequest(BaseModel):
    team_a_lineup: List[Player]
    team_b_lineup: List[Player]
    gk_a: Goalkeeper
    gk_b: Goalkeeper
    n_simulations: int = 10000
