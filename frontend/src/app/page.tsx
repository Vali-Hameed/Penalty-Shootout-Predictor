"use client";

import { useEffect, useState } from 'react';
import { useSimStore } from '@/store/useSimStore';
import TeamSelector from '@/components/TeamSelector';
import Scoreboard from '@/components/Scoreboard';
import KickLog from '@/components/KickLog';
import GoalVisualization from '@/components/GoalVisualization';

export type MatchupMode = "Club" | "International" | "Custom";

export default function Home() {
  const { setAllData, runSimulation, isSimulating, simulationResult, teamA, teamB } = useSimStore();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<MatchupMode>("Club");
  const [visibleCount, setVisibleCount] = useState(0);

  // Staggered reveal animation state lifted to page level
  useEffect(() => {
    if (simulationResult && simulationResult.demo_shootout_log) {
      setVisibleCount(0); // Reset when results change
      
      const logs = simulationResult.demo_shootout_log;
      const interval = setInterval(() => {
        setVisibleCount((prev) => {
          if (prev < logs.length) {
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 800); // 800ms between each shot

      return () => clearInterval(interval);
    }
  }, [simulationResult]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [playersRes, keepersRes, squadsRes] = await Promise.all([
          fetch(`http://localhost:8000/players?t=${Date.now()}`),
          fetch(`http://localhost:8000/keepers?t=${Date.now()}`),
          fetch(`http://localhost:8000/national-squads?t=${Date.now()}`)
        ]);
        const players = await playersRes.json();
        const keepers = await keepersRes.json();
        const squads = await squadsRes.json();
        setAllData(players, keepers, squads);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setAllData]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading data...</div>;
  }

  const isReady = teamA.lineup.length === 10 && teamA.gk && teamB.lineup.length === 10 && teamB.gk;

  return (
    <div className="flex flex-col min-h-screen p-5">
      {/* HEADER */}
      <header className="flex items-center gap-4 border-b border-gold-tint pb-4" style={{ background: "linear-gradient(180deg, rgba(201, 162, 39, 0.06) 0%, rgba(0, 0, 0, 0) 100%)" }}>
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gold-tint border border-gold/30 text-2xl">
          ⚽
        </div>
        <div>
          <h1 className="text-gold font-condensed font-extrabold uppercase text-xl tracking-widest">
            Penalty Shootout Predictor
          </h1>
          <p className="text-gray-sec font-mono text-xs uppercase tracking-widest mt-1">
            FIFA World Cup 2026
          </p>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${simulationResult ? 'bg-success' : isReady ? 'bg-gold' : 'bg-gray-sec'}`}></div>
          <span className="text-gray-sec font-mono text-xs uppercase tracking-widest">
            {simulationResult ? 'RESULTS' : isReady ? 'READY' : 'STANDBY'}
          </span>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-6 mt-6 flex-1">
        
        {/* SIDEBAR (Match Setup) */}
        <aside className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4">
          
          <div className="bg-panel border border-gold-tint rounded-lg p-4 flex justify-between items-center text-xs font-mono">
            {["Club", "International", "Custom"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m as MatchupMode);
                  useSimStore.getState().setTeamALineup([]);
                  useSimStore.getState().setTeamBLineup([]);
                  useSimStore.getState().setTeamAGK(null);
                  useSimStore.getState().setTeamBGK(null);
                  useSimStore.getState().resetSimulation();
                }}
                className={`px-3 py-1.5 rounded transition-all uppercase tracking-wide ${
                  mode === m 
                    ? "bg-gold text-[#060812] font-bold shadow-[0_0_12px_rgba(201,162,39,0.3)]" 
                    : "text-gray-sec hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="bg-panel border border-gold-tint rounded-lg p-4 flex flex-col gap-4">
            <h2 className="text-gray-sec font-sans uppercase font-bold text-sm">Match Setup</h2>
            <TeamSelector teamId="A" mode={mode} />
            
            <div className="flex items-center gap-4 my-2">
              <div className="h-px bg-gold-tint flex-1"></div>
              <span className="text-gray-sec font-mono text-xs">VS</span>
              <div className="h-px bg-gold-tint flex-1"></div>
            </div>
            
            <TeamSelector teamId="B" mode={mode} />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button 
              onClick={runSimulation}
              disabled={isSimulating || !isReady}
              className="w-full py-3.5 bg-gold text-[#060812] rounded-lg font-condensed font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(201,162,39,0.25)] hover:bg-[#d4b036] disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {isSimulating ? "SIMULATING..." : simulationResult ? "SIMULATE AGAIN" : "SIMULATE"}
            </button>
            
            {simulationResult && (
              <button 
                onClick={() => useSimStore.getState().resetSimulation()}
                className="w-full py-3.5 border border-gold-tint text-gray-sec rounded-lg font-sans font-medium text-sm hover:text-foreground transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col gap-6 min-w-0">
          {!simulationResult ? (
            <div className="flex-1 flex items-center justify-center border border-gold-tint border-dashed rounded-xl p-8 text-center text-gray-sec font-mono">
              <div className="max-w-md">
                <p className="mb-2 text-xl text-gold">Awaiting Kickoff</p>
                <p className="text-xs">Select your teams and players in the sidebar to run a 10,000 match Monte Carlo shootout simulation.</p>
              </div>
            </div>
          ) : (
            <>
              <Scoreboard result={simulationResult} visibleCount={visibleCount} />
              
              {/* Splitting the bottom section like the design: left for Goal Vis, right for Kick Log */}
              <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-[1.5]">
                  <GoalVisualization log={simulationResult.demo_shootout_log[visibleCount - 1]} />
                </div>
                <div className="flex-1">
                  <KickLog result={simulationResult} visibleCount={visibleCount} />
                </div>
              </div>
            </>
          )}
        </main>

      </div>
    </div>
  );
}
