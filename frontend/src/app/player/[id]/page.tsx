import { Player } from '@/types';
import Link from 'next/link';
import GoalHeatmap from '@/components/GoalHeatmap';

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const res = await fetch(`${apiUrl}/player/${id}`, { cache: 'no-store' });
  
  if (!res.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <h1 className="text-2xl text-red-500">Player not found</h1>
        <Link href="/" className="ml-4 text-blue-400 hover:underline">Go Home</Link>
      </div>
    );
  }

  const player: Player = await res.json();
  const alphaSum = player.zone_alpha.reduce((a, b) => a + b, 0);
  
  // Array of floats
  const zoneProbs = player.zone_alpha.map(a => (a / alphaSum) * 100);
  const ZONES = ["TL", "TC", "TR", "BL", "BC", "BR"];
  
  // Find most favored
  let maxIdx = 0;
  for (let i = 1; i < zoneProbs.length; i++) {
    if (zoneProbs[i] > zoneProbs[maxIdx]) maxIdx = i;
  }
  
  // General Tendency
  const left = zoneProbs[0] + zoneProbs[3];
  const center = zoneProbs[1] + zoneProbs[4];
  const right = zoneProbs[2] + zoneProbs[5];
  
  let tendency = "Balanced";
  if (left > center + 10 && left > right + 10) tendency = "Prefers Left";
  else if (right > center + 10 && right > left + 10) tendency = "Prefers Right";
  else if (center > left + 10 && center > right + 10) tendency = "Prefers Center";

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-8 inline-block">&larr; Back to Simulator</Link>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-8">
            <div>
              <h1 className="text-5xl font-black mb-2">{player.name}</h1>
              <p className="text-xl text-slate-400">{player.nation} &bull; {player.club}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gold">{player.n_penalties}</div>
              <div className="text-sm text-slate-400 uppercase tracking-widest">Kicks Observed</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col items-center">
              <GoalHeatmap probabilities={zoneProbs} title="Shooting Heatmap" hasData={player.n_penalties > 0} />
              {player.n_penalties === 0 && (
                <div className="mt-4 px-4 py-2 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-500 text-sm text-center">
                  <span className="font-bold">No Penalty Data.</span> Showing Bayesian default prior (16.7% per zone).
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 text-slate-300">Statistical Profile</h2>
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">Most Favored Zone</span>
                  <span className="text-2xl font-bold text-red-400">{ZONES[maxIdx]} ({zoneProbs[maxIdx].toFixed(1)}%)</span>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">Directional Tendency</span>
                  <span className="text-xl font-bold text-white">{tendency}</span>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">Shootout Context Kicks</span>
                  <span className="text-2xl font-bold">{player.n_shootout}</span>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">Pressure Coefficient (β)</span>
                  <span className={`text-2xl font-bold ${player.pressure_beta < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {player.pressure_beta.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">Effective Sample Size (Σα)</span>
                  <span className="text-2xl font-bold text-blue-400">{alphaSum.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
