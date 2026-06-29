import { Goalkeeper } from '@/types';
import Link from 'next/link';
import GoalHeatmap from '@/components/GoalHeatmap';

export default async function KeeperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8002";
  const res = await fetch(`${apiUrl}/keeper/${id}`, { cache: 'no-store' });

  if (!res.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <h1 className="text-2xl text-red-500">Goalkeeper not found</h1>
        <Link href="/" className="ml-4 text-blue-400 hover:underline">Go Home</Link>
      </div>
    );
  }

  const keeper: Goalkeeper = await res.json();
  const alphaSum = keeper.dive_alpha.reduce((a, b) => a + b, 0);

  // Array of floats
  const zoneProbs = keeper.dive_alpha.map(a => (a / alphaSum) * 100);
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

  let tendency = "Balanced / Unpredictable";
  if (left > center + 10 && left > right + 10) tendency = "Dives Left Often";
  else if (right > center + 10 && right > left + 10) tendency = "Dives Right Often";
  else if (center > left + 10 && center > right + 10) tendency = "Stays Center Often";

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-4 md:mb-8 inline-block">&larr; Back to Simulator</Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-0 mb-8 border-b border-slate-800 pb-8">
            <div>
              <h1 className="text-3xl md:text-5xl font-black mb-1 md:mb-2 leading-tight">{keeper.name}</h1>
              <p className="text-base md:text-xl text-slate-400">Goalkeeper &bull; {keeper.nation}</p>
            </div>
            <div className="text-left md:text-right border-l-2 md:border-l-0 border-gold pl-4 md:pl-0">
              <div className="text-2xl md:text-3xl font-black text-gold">{keeper.n_faced}</div>
              <div className="text-xs md:text-sm text-slate-400 uppercase tracking-widest">Penalties Faced</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col items-center">
              <GoalHeatmap probabilities={zoneProbs} title="Dive Heatmap" hasData={keeper.n_faced > 0} />
              {keeper.n_faced === 0 && (
                <div className="mt-4 px-4 py-2 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-500 text-sm text-center">
                  <span className="font-bold">No Penalty Data.</span> Showing Bayesian default prior (16.7% per zone).
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 text-slate-300">Statistical Profile</h2>
              <div className="space-y-3 md:space-y-4">
                <div className="bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-1 md:gap-0">
                  <span className="text-xs md:text-base text-slate-400">Most Frequent Dive</span>
                  <span className="text-lg md:text-2xl font-bold text-red-400">{ZONES[maxIdx]} ({zoneProbs[maxIdx].toFixed(1)}%)</span>
                </div>
                <div className="bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-1 md:gap-0">
                  <span className="text-xs md:text-base text-slate-400">Directional Tendency</span>
                  <span className="text-lg md:text-xl font-bold text-white">{tendency}</span>
                </div>
                <div className="bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-1 md:gap-0">
                  <span className="text-xs md:text-base text-slate-400">Effective Dive Sample Size (Σα)</span>
                  <span className="text-lg md:text-2xl font-bold text-blue-400">{alphaSum.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
