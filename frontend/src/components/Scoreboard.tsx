"use client";

import { useSimStore } from "@/store/useSimStore";
import { MonteCarloResult } from "@/types";

export default function Scoreboard({ result, visibleCount }: { result: MonteCarloResult, visibleCount: number }) {
  const { teamA, teamB } = useSimStore();

  const aWinProb = (result.team_a_win_prob * 100).toFixed(1);
  const bWinProb = (result.team_b_win_prob * 100).toFixed(1);

  // Calculate animated score based on visible logs
  const visibleLogs = result.demo_shootout_log.slice(0, visibleCount);
  let animatedScoreA = 0;
  let animatedScoreB = 0;
  visibleLogs.forEach((log) => {
    if (log.result.outcome === "goal") {
      if (log.team === "A") animatedScoreA++;
      else animatedScoreB++;
    }
  });

  const aLogs = visibleLogs.filter(l => l.team === "A");
  const bLogs = visibleLogs.filter(l => l.team === "B");

  return (
    <div className="flex flex-col gap-6">
      <div 
        className="rounded-xl border border-gold-tint p-6"
        style={{
          background: "linear-gradient(135deg, rgba(201, 162, 39, 0.08) 0%, rgba(12, 16, 34, 1) 60%)"
        }}
      >
        <div className="flex items-center justify-between">
          
          {/* Home Team */}
          <div className="flex flex-col items-center w-40">
            <div className="font-condensed font-bold uppercase text-xl tracking-wide text-gold">
              {teamA.name || "Team A"}
            </div>
            <div className="text-gray-sec font-mono text-xs mt-1">HOME</div>
          </div>

          {/* Score & Probabilities */}
          <div className="flex flex-col items-center flex-1">
            <div className="font-condensed font-extrabold text-6xl text-gold tracking-widest flex items-center gap-4">
              <span>{animatedScoreA}</span>
              <span className="text-gray-sec opacity-40 text-4xl">—</span>
              <span>{animatedScoreB}</span>
            </div>
            
            <div className="mt-4 flex flex-col items-center">
              <div className="text-success font-mono font-bold tracking-widest text-sm mb-1">
                {result.team_a_win_prob > result.team_b_win_prob ? `${teamA.name || 'TEAM A'} FAVORITE` : `${teamB.name || 'TEAM B'} FAVORITE`}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-sec">
                <span>{aWinProb}%</span>
                <div className="w-32 h-1.5 bg-input rounded-full overflow-hidden flex">
                  <div className="bg-gold h-full" style={{ width: `${result.team_a_win_prob * 100}%` }}></div>
                  <div className="bg-gray-sec h-full" style={{ width: `${result.team_b_win_prob * 100}%` }}></div>
                </div>
                <span>{bWinProb}%</span>
              </div>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center w-40">
            <div className="font-condensed font-bold uppercase text-xl tracking-wide text-gold">
              {teamB.name || "Team B"}
            </div>
            <div className="text-gray-sec font-mono text-xs mt-1">AWAY</div>
          </div>

        </div>

        {/* Tally Dots */}
        <div className="mt-6 flex flex-col gap-2 items-center">
          <div className="flex gap-2">
            <span className="w-6 text-xs font-mono text-gray-sec flex items-center justify-end mr-2">A</span>
            {aLogs.map((l, i) => (
              <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                ${l.result.outcome === 'goal' ? 'bg-success/20 border border-success text-success' : 'bg-fail/20 border border-fail text-fail'}
              `}>
                {l.result.outcome === 'goal' ? '✓' : '✗'}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="w-6 text-xs font-mono text-gray-sec flex items-center justify-end mr-2">B</span>
            {bLogs.map((l, i) => (
              <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                ${l.result.outcome === 'goal' ? 'bg-success/20 border border-success text-success' : 'bg-fail/20 border border-fail text-fail'}
              `}>
                {l.result.outcome === 'goal' ? '✓' : '✗'}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
