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
  
  resetSimulation: () => set({ simulationResult: null }),
  
  runSimulation: async () => {
    const { teamA, teamB } = get();
    if (teamA.lineup.length === 0 || teamB.lineup.length === 0 || !teamA.gk || !teamB.gk) {
      alert("Please ensure both teams have takers and a goalkeeper selected.");
      return;
    }
    
    set({ isSimulating: true, simulationResult: null });
    
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_a_lineup: teamA.lineup,
          team_b_lineup: teamB.lineup,
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
