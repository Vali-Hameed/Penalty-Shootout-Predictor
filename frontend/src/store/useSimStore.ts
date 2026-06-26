import { create } from 'zustand';
import { Player, Goalkeeper, TeamSetup, MonteCarloResult } from '@/types';

interface SimState {
  allPlayers: Player[];
  allKeepers: Goalkeeper[];
  teamA: TeamSetup;
  teamB: TeamSetup;
  simulationResult: MonteCarloResult | null;
  isSimulating: boolean;
  
  // Actions
  setAllData: (players: Player[], keepers: Goalkeeper[]) => void;
  setTeamALineup: (lineup: Player[]) => void;
  setTeamBLineup: (lineup: Player[]) => void;
  setTeamAGK: (gk: Goalkeeper) => void;
  setTeamBGK: (gk: Goalkeeper) => void;
  setTeamAName: (name: string) => void;
  setTeamBName: (name: string) => void;
  runSimulation: () => Promise<void>;
  resetSimulation: () => void;
}

export const useSimStore = create<SimState>((set, get) => ({
  allPlayers: [],
  allKeepers: [],
  teamA: { name: 'Team A', lineup: [], gk: null },
  teamB: { name: 'Team B', lineup: [], gk: null },
  simulationResult: null,
  isSimulating: false,
  
  setAllData: (players, keepers) => set({ allPlayers: players, allKeepers: keepers }),
  
  setTeamALineup: (lineup) => set((state) => ({ teamA: { ...state.teamA, lineup } })),
  setTeamBLineup: (lineup) => set((state) => ({ teamB: { ...state.teamB, lineup } })),
  
  setTeamAGK: (gk) => set((state) => ({ teamA: { ...state.teamA, gk } })),
  setTeamBGK: (gk) => set((state) => ({ teamB: { ...state.teamB, gk } })),
  
  setTeamAName: (name) => set((state) => ({ teamA: { ...state.teamA, name } })),
  setTeamBName: (name) => set((state) => ({ teamB: { ...state.teamB, name } })),
  
  resetSimulation: () => set({ simulationResult: null }),
  
  runSimulation: async () => {
    const { teamA, teamB } = get();
    if (teamA.lineup.length !== 10 || teamB.lineup.length !== 10 || !teamA.gk || !teamB.gk) {
      alert("Please ensure both teams have exactly 10 outfield takers and a goalkeeper selected.");
      return;
    }
    
    set({ isSimulating: true, simulationResult: null });
    
    try {
      const keeperToPlayer = (gk: Goalkeeper): Player => ({
        id: gk.id,
        name: gk.name + " (GK)",
        nation: gk.nation,
        club: gk.club,
        league: gk.league,
        club_nation: gk.club_nation,
        foot: "right",
        zone_alpha: [10, 10, 10, 10, 10, 10],
        pressure_beta: 0,
        n_penalties: 0,
        n_shootout: 0,
        is_active: gk.is_active
      });

      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_a_lineup: [...teamA.lineup, keeperToPlayer(teamA.gk!)],
          team_b_lineup: [...teamB.lineup, keeperToPlayer(teamB.gk!)],
          gk_a: teamA.gk,
          gk_b: teamB.gk,
          n_simulations: 10000
        }),
      });
      
      if (!response.ok) throw new Error("Simulation failed");
      const data: MonteCarloResult = await response.json();
      set({ simulationResult: data, isSimulating: false });
    } catch (error) {
      console.error(error);
      alert("Error running simulation");
      set({ isSimulating: false });
    }
  }
}));
