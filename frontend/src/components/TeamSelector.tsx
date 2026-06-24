"use client";

import { useSimStore } from '@/store/useSimStore';
import { Player, Goalkeeper } from '@/types';
import { useState, useMemo } from 'react';
import { MatchupMode } from '@/app/page';

export default function TeamSelector({ teamId, mode }: { teamId: 'A' | 'B', mode: MatchupMode }) {
  const { allPlayers, allKeepers, teamA, teamB, setTeamALineup, setTeamBLineup, setTeamAGK, setTeamBGK } = useSimStore();
  
  const team = teamId === 'A' ? teamA : teamB;
  const setLineup = teamId === 'A' ? setTeamALineup : setTeamBLineup;
  const setGK = teamId === 'A' ? setTeamAGK : setTeamBGK;
  
  const [selectedSquad, setSelectedSquad] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [gkSearchQuery, setGkSearchQuery] = useState('');
  
  // Reset selection when mode changes
  useMemo(() => {
    setSelectedSquad('');
    setSearchQuery('');
    setGkSearchQuery('');
  }, [mode]);

  const activePlayers = useMemo(() => allPlayers.filter(p => p.is_active), [allPlayers]);
  const activeKeepers = useMemo(() => allKeepers.filter(k => k.is_active), [allKeepers]);

  const squads = useMemo(() => {
    const s = new Set<string>();
    if (mode === 'Club') {
      activePlayers.forEach(p => p.club && s.add(p.club));
    } else if (mode === 'International') {
      activePlayers.forEach(p => p.nation && s.add(p.nation));
    }
    return Array.from(s).sort();
  }, [activePlayers, mode]);
  
  const availablePlayers = useMemo(() => {
    if (mode === 'Custom') {
      if (!searchQuery) return [];
      return allPlayers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 20);
    }
    if (mode === 'Club') return activePlayers.filter(p => p.club === selectedSquad);
    if (mode === 'International') return activePlayers.filter(p => p.nation === selectedSquad);
    return [];
  }, [allPlayers, activePlayers, selectedSquad, mode, searchQuery]);

  const availableKeepers = useMemo(() => {
    if (mode === 'Custom') {
      if (!gkSearchQuery) return [];
      return allKeepers.filter(k => k.name.toLowerCase().includes(gkSearchQuery.toLowerCase())).slice(0, 10);
    }
    if (mode === 'Club') return activeKeepers.filter(k => k.club === selectedSquad);
    if (mode === 'International') return activeKeepers.filter(k => k.nation === selectedSquad);
    return [];
  }, [allKeepers, activeKeepers, selectedSquad, mode, gkSearchQuery]);

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
      
      {mode !== 'Custom' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Select {mode === 'Club' ? 'Club' : 'Nation'}
          </label>
          <select 
            className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2"
            value={selectedSquad}
            onChange={(e) => {
              setSelectedSquad(e.target.value);
              setGK(null);
            }}
          >
            <option value="">-- Choose {mode === 'Club' ? 'a Club' : 'a Nation'} --</option>
            {squads.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {(selectedSquad || mode === 'Custom') && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Goalkeeper</label>
            {mode === 'Custom' && (
              <input 
                type="text" 
                placeholder="Search keepers..." 
                className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2 mb-2"
                value={gkSearchQuery}
                onChange={e => setGkSearchQuery(e.target.value)}
              />
            )}
            {mode !== 'Custom' ? (
              <select 
                className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2"
                value={team.gk?.id || ''}
                onChange={(e) => {
                  const gk = allKeepers.find(k => k.id === e.target.value);
                  if (gk) setGK(gk);
                }}
              >
                <option value="">-- Select Goalkeeper --</option>
                {availableKeepers.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            ) : (
              <div className="max-h-32 overflow-y-auto bg-slate-900 rounded border border-slate-700 p-2 space-y-1">
                {team.gk && (
                  <div className="mb-2 p-2 bg-green-900/50 rounded flex justify-between">
                    <span className="text-white font-semibold">Selected: {team.gk.name}</span>
                    <button onClick={() => setGK(null)} className="text-red-400 text-xs">Clear</button>
                  </div>
                )}
                {availableKeepers.map(k => (
                  <div key={k.id} className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">{k.name} {!k.is_active && "(Legend)"}</span>
                    <button 
                      onClick={() => setGK(k)}
                      disabled={team.gk?.id === k.id}
                      className="px-2 py-1 bg-blue-600 disabled:bg-slate-700 rounded text-xs text-white"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
            {availableKeepers.length === 0 && mode !== 'Custom' && (
              <p className="text-yellow-400 text-xs mt-1">No goalkeepers found for this squad in the dataset.</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Available Takers (Pick 5)</label>
            {mode === 'Custom' && (
              <input 
                type="text" 
                placeholder="Search players..." 
                className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2 mb-2"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            )}
            <div className="max-h-40 overflow-y-auto bg-slate-900 rounded border border-slate-700 p-2 space-y-1">
              {availablePlayers.map(p => (
                <div key={p.id} className="flex justify-between items-center text-sm">
                  <div className="flex flex-col">
                    <span className="text-white">{p.name} ({p.foot})</span>
                    {mode === 'Custom' && <span className="text-xs text-slate-400">{p.club} | {p.nation} {!p.is_active && "| Legend"}</span>}
                  </div>
                  <button 
                    onClick={() => handleAddPlayer(p)}
                    disabled={team.lineup.length >= 5 || team.lineup.some(x => x.id === p.id)}
                    className="px-2 py-1 bg-blue-600 disabled:bg-slate-700 rounded text-xs text-white h-fit"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
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
