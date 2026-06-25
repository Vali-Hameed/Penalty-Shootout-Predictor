export interface Player {
  id: string;
  name: string;
  nation: string;
  club: string;
  league: string;
  club_nation: string;
  foot: "left" | "right" | "both";
  zone_alpha: number[];
  pressure_beta: number;
  n_penalties: number;
  n_shootout: number;
  is_active: boolean;
}

export interface Goalkeeper {
  id: string;
  name: string;
  club: string;
  nation: string;
  league: string;
  club_nation: string;
  save_beta: Record<string, Record<string, { a: number; b: number }>>;
  dive_alpha: number[];
  n_faced: number;
  is_active: boolean;
}

export interface KickResult {
  shoot_zone: string;
  gk_dive: string;
  gk_reaches: boolean;
  outcome: "goal" | "save" | "miss";
  save_prob_posterior_mean: number;
}

export interface KickLogEntry {
  round_str: string;
  team: "A" | "B";
  result: KickResult;
}

export interface MonteCarloResult {
  team_a_win_prob: number;
  team_b_win_prob: number;
  ci_low: number;
  ci_high: number;
  expected_score_a: number;
  expected_score_b: number;
  n_simulations: number;
  demo_shootout_log: KickLogEntry[];
  demo_score_a: number;
  demo_score_b: number;
}

export interface TeamSetup {
  name: string;
  lineup: Player[]; // 5 takers
  gk: Goalkeeper | null;
}
