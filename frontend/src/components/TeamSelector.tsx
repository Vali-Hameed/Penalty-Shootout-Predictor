"use client";

import { useSimStore } from '@/store/useSimStore';
import { Player, Goalkeeper } from '@/types';
import { useState, useMemo } from 'react';

export default function TeamSelector({ teamId }: { teamId: 'A' | 'B' }) {
  const { allPlayers, allKeepers, teamA, teamB, setTeamALineup, setTeamBLineup, setTeamAGK, setTeamBGK } = useSimStore();
  
  const team = teamId === 'A' ? teamA : teamB;
  const setLineup = teamId === 'A' ? setTeamALineup : setTeamBLineup;
  const setGK = teamId === 'A' ? setTeamAGK : setTeamBGK;
  
  const [selectedNation, setSelectedNation] = useState<string>('');
  
  const nations = useMemo(() => {
    const n = new Set<string>();
    allPlayers.forEach(p => p.nation && n.add(p.nation));
    return Array.from(n).sort();
  }, [allPlayers]);
  
  const availablePlayers = useMemo(() => {
    return allPlayers.filter(p => p.nation === selectedNation);
  }, [allPlayers, selectedNation]);

  const handleAddPlayer = (p: Player) => {
    if (team.lineup.length < 5 && !team.lineup.find(x => x.id === p.id)) {
      setLineup([...team.lineup, p]);
    }
  };

  const handleRemovePlayer = (p: Player) => {
    setLineup(team.lineup.filter(x => x.id !== p.id));
  };

  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 shadow-xl w-full max-w-md">
      <h2 className="text-2xl font-bold text-white mb-4">Team {teamId}</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-1">Select Squad (Nation)</label>
        <select 
          className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2"
          value={selectedNation}
          onChange={(e) => setSelectedNation(e.target.value)}
        >
          <option value="">-- Choose a Nation --</option>
          {nations.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-1">Goalkeeper</label>
        <select 
          className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2"
          value={team.gk?.id || ''}
          onChange={(e) => {
            const gk = allKeepers.find(k => k.id === e.target.value);
            if (gk) setGK(gk);
          }}
        >
          <option value="">-- Select Goalkeeper --</option>
          {allKeepers.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
      </div>
      
      {selectedNation && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1">Available Takers (Pick 5)</label>
          <div className="max-h-40 overflow-y-auto bg-slate-900 rounded border border-slate-700 p-2 space-y-1">
            {availablePlayers.map(p => (
              <div key={p.id} className="flex justify-between items-center text-sm">
                <span className="text-white">{p.name} ({p.foot})</span>
                <button 
                  onClick={() => handleAddPlayer(p)}
                  disabled={team.lineup.length >= 5 || team.lineup.some(x => x.id === p.id)}
                  className="px-2 py-1 bg-blue-600 disabled:bg-slate-700 rounded text-xs text-white"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Selected Lineup ({team.lineup.length}/5)</label>
        <div className="space-y-2">
          {team.lineup.map((p, idx) => (
            <div key={p.id} className="flex justify-between items-center bg-slate-700 p-2 rounded text-sm">
              <span className="text-white font-semibold">{idx + 1}. {p.name}</span>
              <button 
                onClick={() => handleRemovePlayer(p)}
                className="text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
          {team.lineup.length === 0 && <p className="text-slate-500 text-sm">No players selected.</p>}
        </div>
      </div>
    </div>
  );
}
