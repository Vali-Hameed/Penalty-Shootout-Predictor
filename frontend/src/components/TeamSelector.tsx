"use client";

import { useSimStore } from '@/store/useSimStore';
import { Player, Goalkeeper } from '@/types';
import { useState, useMemo, useEffect, useRef } from 'react';
import { MatchupMode } from '@/app/page';

export default function TeamSelector({ teamId, mode }: { teamId: 'A' | 'B', mode: MatchupMode }) {
  const { allPlayers, allKeepers, nationalSquads, teamA, teamB, setTeamALineup, setTeamBLineup, setTeamAGK, setTeamBGK, setTeamAName, setTeamBName } = useSimStore();
  
  const team = teamId === 'A' ? teamA : teamB;
  const setLineup = teamId === 'A' ? setTeamALineup : setTeamBLineup;
  const setGK = teamId === 'A' ? setTeamAGK : setTeamBGK;
  const setTeamName = teamId === 'A' ? setTeamAName : setTeamBName;
  
  const [selectedSquad, setSelectedSquad] = useState<string>('');
  const [selectedNation, setSelectedNation] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [gkSearchQuery, setGkSearchQuery] = useState('');
  
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [showKeeperSearch, setShowKeeperSearch] = useState(false);
  
  const playerSearchRef = useRef<HTMLDivElement>(null);
  const keeperSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (playerSearchRef.current && !playerSearchRef.current.contains(event.target as Node)) {
        setShowPlayerSearch(false);
      }
      if (keeperSearchRef.current && !keeperSearchRef.current.contains(event.target as Node)) {
        setShowKeeperSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Reset selection when mode changes
  useEffect(() => {
    setSelectedSquad('');
    setSelectedNation('');
    setSelectedLeague('');
    setSearchQuery('');
    setGkSearchQuery('');
    setTeamName(`Team ${teamId}`);
  }, [mode, teamId, setTeamName]);

  const activePlayers = useMemo(() => allPlayers.filter(p => p.is_active), [allPlayers]);
  const activeKeepers = useMemo(() => allKeepers.filter(k => k.is_active), [allKeepers]);

  // For International Mode
  const internationalSquads = useMemo(() => {
    return Object.keys(nationalSquads).sort();
  }, [nationalSquads]);

  // For Club Mode - Hierarchy
  const clubNations = useMemo(() => {
    if (mode !== 'Club') return [];
    const s = new Set<string>();
    activePlayers.forEach(p => p.club && p.club_nation && p.club_nation !== "Unknown" && s.add(p.club_nation));
    return Array.from(s).sort();
  }, [activePlayers, mode]);

  const clubLeagues = useMemo(() => {
    if (mode !== 'Club' || !selectedNation) return [];
    const s = new Set<string>();
    activePlayers.forEach(p => {
      if (p.club && p.club_nation === selectedNation && p.league && p.league !== "Unknown") {
        s.add(p.league);
      }
    });
    return Array.from(s).sort();
  }, [activePlayers, mode, selectedNation]);

  const clubs = useMemo(() => {
    if (mode !== 'Club' || !selectedLeague) return [];
    const s = new Set<string>();
    activePlayers.forEach(p => {
      if (p.club && p.club_nation === selectedNation && p.league === selectedLeague) {
        s.add(p.club);
      }
    });
    return Array.from(s).sort();
  }, [activePlayers, mode, selectedNation, selectedLeague]);
  
  const availablePlayers = useMemo(() => {
    if (mode === 'Custom') {
      if (!searchQuery) return [];
      return allPlayers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 20);
    }
    if (mode === 'Club') return activePlayers.filter(p => p.club === selectedSquad);
    if (mode === 'International') {
      const roster = nationalSquads[selectedSquad] || [];
      return activePlayers.filter(p => {
        if (p.nation !== selectedSquad) return false;
        
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const pNorm = normalize(p.name);
        
        return roster.some(r => {
          const rNorm = normalize(r);
          if (rNorm === pNorm || pNorm.includes(rNorm) || rNorm.includes(pNorm)) return true;
          
          const pTokens = pNorm.split(/\s+/);
          const rTokens = rNorm.split(/\s+/);
          let matchCount = 0;
          for (const t of pTokens) {
            if (rTokens.includes(t)) matchCount++;
          }
          return matchCount >= 2;
        });
      });
    }
    return [];
  }, [allPlayers, activePlayers, selectedSquad, mode, searchQuery, nationalSquads]);

  const availableKeepers = useMemo(() => {
    if (mode === 'Custom') {
      if (!gkSearchQuery) return [];
      return allKeepers.filter(k => k.name.toLowerCase().includes(gkSearchQuery.toLowerCase())).slice(0, 10);
    }
    if (mode === 'Club') return activeKeepers.filter(k => k.club === selectedSquad);
    if (mode === 'International') {
      const roster = nationalSquads[selectedSquad] || [];
      return activeKeepers.filter(k => {
        if (k.nation !== selectedSquad) return false;
        
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const kNorm = normalize(k.name);
        
        return roster.some(r => {
          const rNorm = normalize(r);
          if (rNorm === kNorm || kNorm.includes(rNorm) || rNorm.includes(kNorm)) return true;
          
          const kTokens = kNorm.split(/\s+/);
          const rTokens = rNorm.split(/\s+/);
          let matchCount = 0;
          for (const t of kTokens) {
            if (rTokens.includes(t)) matchCount++;
          }
          return matchCount >= 2;
        });
      });
    }
    return [];
  }, [allKeepers, activeKeepers, selectedSquad, mode, gkSearchQuery, nationalSquads]);

  const handleAddPlayer = (p: Player) => {
    if (team.lineup.length < 10 && !team.lineup.find(x => x.id === p.id)) {
      setLineup([...team.lineup, p]);
    }
  };

  const handleRemovePlayer = (p: Player) => {
    setLineup(team.lineup.filter(x => x.id !== p.id));
  };

  return (
    <div className="p-4 bg-panel rounded-xl border border-gold-tint shadow-xl w-full max-w-md">
      <h2 className="text-2xl font-bold text-white mb-4">Team {teamId}</h2>
      
      {!selectedSquad && mode === 'International' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Select Nation
          </label>
          <select 
            className="w-full bg-input border border-gold-tint text-foreground rounded p-2"
            value={selectedSquad}
            onChange={(e) => {
              const newSquad = e.target.value;
              setSelectedSquad(newSquad);
              setTeamName(newSquad || `Team ${teamId}`);
              setGK(null);
            }}
          >
            <option value="">-- Choose a Nation --</option>
            {internationalSquads.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {!selectedSquad && mode === 'Club' && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Select Nation</label>
            <select 
              className="w-full bg-input border border-gold-tint text-foreground rounded p-2"
              value={selectedNation}
              onChange={(e) => {
                setSelectedNation(e.target.value);
                setSelectedLeague('');
                setSelectedSquad('');
                setTeamName(`Team ${teamId}`);
                setGK(null);
              }}
            >
              <option value="">-- Choose Nation --</option>
              {clubNations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {selectedNation && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Select League</label>
              <select 
                className="w-full bg-input border border-gold-tint text-foreground rounded p-2"
                value={selectedLeague}
                onChange={(e) => {
                  setSelectedLeague(e.target.value);
                  setSelectedSquad('');
                  setTeamName(`Team ${teamId}`);
                  setGK(null);
                }}
              >
                <option value="">-- Choose League --</option>
                {clubLeagues.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {selectedLeague && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Select Club</label>
              <select 
                className="w-full bg-input border border-gold-tint text-foreground rounded p-2"
                value={selectedSquad}
                onChange={(e) => {
                  const newSquad = e.target.value;
                  setSelectedSquad(newSquad);
                  setTeamName(newSquad || `Team ${teamId}`);
                  setGK(null);
                }}
              >
                <option value="">-- Choose Club --</option>
                {clubs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {selectedSquad && mode !== 'Custom' && (
        <div className="mb-4 flex items-center justify-between bg-input border border-gold-tint p-3 rounded-lg">
          <div className="font-condensed font-bold text-lg text-gold uppercase">{selectedSquad}</div>
          <button 
            onClick={() => {
              setSelectedSquad('');
              setTeamName(`Team ${teamId}`);
            }}
            className="text-xs font-mono text-gray-sec hover:text-white"
          >
            Change
          </button>
        </div>
      )}

      {(selectedSquad || mode === 'Custom') && (
        <>
          <div className="mb-4" ref={keeperSearchRef}>
            <label className="block text-sm font-medium text-slate-300 mb-1">Goalkeeper</label>
            {mode === 'Custom' && team.gk && (
              <div className="mb-2 p-2 bg-green-900/50 border border-green-500/30 rounded flex justify-between items-center text-sm">
                <span className="text-white font-semibold">Selected: {team.gk.name}</span>
                <button onClick={() => setGK(null)} className="text-red-400 hover:text-red-300 text-xs font-bold">Clear</button>
              </div>
            )}
            {mode === 'Custom' && (
              <input 
                type="text" 
                placeholder="Search keepers..." 
                className="w-full bg-input border border-gold-tint text-foreground rounded p-2 mb-2"
                value={gkSearchQuery}
                onFocus={() => setShowKeeperSearch(true)}
                onChange={e => {
                  setGkSearchQuery(e.target.value);
                  setShowKeeperSearch(true);
                }}
              />
            )}
            {mode !== 'Custom' ? (
              <select 
                className="w-full bg-input border border-gold-tint text-foreground rounded p-2"
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
              showKeeperSearch && (
                <div className="max-h-32 overflow-y-auto bg-input rounded border border-gold-tint p-2 space-y-1 absolute z-50 w-full max-w-[350px] shadow-2xl">

                  {availableKeepers.map(k => (
                    <div key={k.id} className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">{k.name} {!k.is_active && "(Legend)"}</span>
                      <button 
                        onClick={() => {
                          setGK(k);
                          setShowKeeperSearch(false);
                          setGkSearchQuery('');
                        }}
                        disabled={team.gk?.id === k.id}
                        className="px-2 py-1 bg-gold text-[#060812] disabled:opacity-50 disabled:bg-gray-sec rounded text-xs"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
            {availableKeepers.length === 0 && mode !== 'Custom' && (
              <p className="text-yellow-400 text-xs mt-1">No goalkeepers found for this squad in the dataset.</p>
            )}
          </div>

          <div className="mb-4 relative" ref={playerSearchRef}>
            <label className="block text-sm font-medium text-slate-300 mb-1">Available Takers (Pick 10)</label>
            {mode === 'Custom' && (
              <input 
                type="text" 
                placeholder="Search players..." 
                className="w-full bg-input border border-gold-tint text-foreground rounded p-2 mb-2"
                value={searchQuery}
                onFocus={() => setShowPlayerSearch(true)}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowPlayerSearch(true);
                }}
              />
            )}
            {mode === 'Custom' ? (
              showPlayerSearch && (
                <div className="max-h-40 overflow-y-auto bg-input rounded border border-gold-tint p-2 space-y-1 absolute z-50 w-full shadow-2xl">
                  {availablePlayers.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <div className="flex flex-col">
                        <span className="text-white">{p.name}</span>
                        <span className="text-xs text-slate-400">{p.club} | {p.nation} {!p.is_active && "| Legend"}</span>
                      </div>
                      <button 
                        onClick={() => {
                          handleAddPlayer(p);
                          setSearchQuery('');
                          setShowPlayerSearch(false);
                        }}
                        disabled={team.lineup.length >= 10 || team.lineup.some(x => x.id === p.id)}
                        className="px-2 py-1 bg-gold text-[#060812] disabled:opacity-50 disabled:bg-gray-sec rounded text-xs h-fit"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="max-h-40 overflow-y-auto bg-input rounded border border-gold-tint p-2 space-y-1">
                {availablePlayers.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                      <span className="text-white">{p.name}</span>
                    </div>
                    <button 
                      onClick={() => handleAddPlayer(p)}
                      disabled={team.lineup.length >= 10 || team.lineup.some(x => x.id === p.id)}
                      className="px-2 py-1 bg-gold text-[#060812] disabled:opacity-50 disabled:bg-gray-sec rounded text-xs h-fit"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Selected Lineup ({team.lineup.length + (team.gk ? 1 : 0)}/11)</label>
        
        {team.lineup.length > 0 && (
          <div className="mb-2">
            <h3 className="text-xs font-mono text-gold mb-1 uppercase tracking-wider">First 5 Takers</h3>
            <div className="space-y-2">
              {team.lineup.slice(0, 5).map((p, idx) => (
                <div key={p.id} className="flex justify-between items-center bg-input p-2 rounded text-sm border border-gold-tint">
                  <span className="text-white font-semibold">{idx + 1}. {p.name}</span>
                  <button 
                    onClick={() => handleRemovePlayer(p)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(team.lineup.length > 5 || team.gk) && (
          <div className="mb-2">
            <h3 className="text-xs font-mono text-gold mb-1 uppercase tracking-wider mt-3">Sudden Death Takers</h3>
            <div className="space-y-2">
              {team.lineup.slice(5).map((p, idx) => (
                <div key={p.id} className="flex justify-between items-center bg-input p-2 rounded text-sm border border-gold-tint">
                  <span className="text-white font-semibold">{idx + 6}. {p.name}</span>
                  <button 
                    onClick={() => handleRemovePlayer(p)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {team.gk && (
                <div key={team.gk.id} className="flex justify-between items-center bg-input p-2 rounded text-sm border border-gold-tint opacity-80">
                  <span className="text-white font-semibold">{Math.max(team.lineup.length + 1, 6)}. {team.gk.name} (GK)</span>
                  <span className="text-gold text-xs">Auto</span>
                </div>
              )}
            </div>
          </div>
        )}

        {team.lineup.length === 0 && !team.gk && <p className="text-slate-500 text-sm">No players selected.</p>}
      </div>
    </div>
  );
}
