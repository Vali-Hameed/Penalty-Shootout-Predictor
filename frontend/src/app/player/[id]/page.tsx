import { Player } from '@/types';
import Link from 'next/link';

export default async function PlayerPage({ params }: { params: { id: string } }) {
  const res = await fetch(`http://127.0.0.1:8000/player/${params.id}`, { cache: 'no-store' });
  
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
  const zoneProbs = player.zone_alpha.map(a => (a / alphaSum * 100).toFixed(1));
  const ZONES = ["TL", "TC", "TR", "BL", "BC", "BR"];

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-8 inline-block">&larr; Back to Simulator</Link>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-8">
            <div>
              <h1 className="text-5xl font-black mb-2">{player.name}</h1>
              <p className="text-xl text-slate-400">{player.nation} &bull; {player.club}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-slate-300">Bayesian Zone Tendencies</h2>
              <div className="grid grid-cols-3 gap-2">
                {ZONES.map((z, i) => (
                  <div key={z} className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center relative overflow-hidden group">
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-blue-600/30 transition-all"
                      style={{ height: `${zoneProbs[i]}%` }}
                    />
                    <div className="relative z-10">
                      <div className="text-lg font-bold text-slate-400">{z}</div>
                      <div className="text-2xl font-black text-white mt-1">{zoneProbs[i]}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 text-slate-300">Statistical Profile</h2>
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400">Total Kicks Observed</span>
                  <span className="text-2xl font-bold">{player.n_penalties}</span>
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
