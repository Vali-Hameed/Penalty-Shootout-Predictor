import { MonteCarloResult } from '@/types';
import { useSimStore } from '@/store/useSimStore';

export default function WinProbBar({ result }: { result: MonteCarloResult }) {
  const { teamA, teamB } = useSimStore();
  
  const probA = (result.team_a_win_prob * 100).toFixed(1);
  const probB = (result.team_b_win_prob * 100).toFixed(1);
  const ciLow = (result.ci_low * 100).toFixed(1);
  const ciHigh = (result.ci_high * 100).toFixed(1);

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">Monte Carlo Win Probability</h2>
      
      <div className="flex justify-between mb-2 px-1 text-lg font-semibold">
        <span className="text-blue-400">{teamA.name} ({probA}%)</span>
        <span className="text-red-400">{probB}%) {teamB.name}</span>
      </div>
      
      <div className="relative w-full h-8 bg-red-500 rounded-full overflow-hidden shadow-inner">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
          style={{ width: `${probA}%` }}
        >
        </div>
        
        {/* Credible Interval Overlay */}
        <div 
          className="absolute top-0 h-full bg-white/20 border-x-2 border-white/50 z-10"
          style={{ 
            left: `${ciLow}%`, 
            width: `${parseFloat(ciHigh) - parseFloat(ciLow)}%` 
          }}
          title={`90% Credible Interval: [${ciLow}%, ${ciHigh}%]`}
        ></div>
      </div>
      
      <div className="mt-4 text-center text-sm text-slate-400 flex flex-col gap-1">
        <p>Based on {result.n_simulations.toLocaleString()} simulations</p>
        <p>90% Credible Interval for {teamA.name} win: [{ciLow}%, {ciHigh}%]</p>
        <p>Expected Score: {teamA.name} {result.expected_score_a.toFixed(2)} - {result.expected_score_b.toFixed(2)} {teamB.name}</p>
      </div>
    </div>
  );
}
