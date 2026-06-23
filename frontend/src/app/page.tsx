"use client";

import { useEffect, useState } from 'react';
import { useSimStore } from '@/store/useSimStore';
import TeamSelector from '@/components/TeamSelector';
import PenaltyMatchup from '@/components/PenaltyMatchup';
import WinProbBar from '@/components/WinProbBar';

export default function Home() {
  const { setAllData, runSimulation, isSimulating, simulationResult } = useSimStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [playersRes, keepersRes] = await Promise.all([
          fetch('http://localhost:8000/players'),
          fetch('http://localhost:8000/keepers')
        ]);
        const players = await playersRes.json();
        const keepers = await keepersRes.json();
        setAllData(players, keepers);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setAllData]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading data...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
            Bayesian Penalty Predictor
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Build lineups and run Monte Carlo shootout simulations.</p>
        </header>

        {!simulationResult ? (
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col md:flex-row gap-8 w-full justify-center">
              <TeamSelector teamId="A" />
              <TeamSelector teamId="B" />
            </div>
            
            <button 
              onClick={runSimulation}
              disabled={isSimulating}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSimulating ? "Simulating 10,000 Matches..." : "Run Monte Carlo Simulation"}
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            <WinProbBar result={simulationResult} />
            <PenaltyMatchup result={simulationResult} />
            
            <div className="text-center">
              <button 
                onClick={() => useSimStore.getState().resetSimulation()}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white font-semibold transition-colors"
              >
                New Simulation
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
