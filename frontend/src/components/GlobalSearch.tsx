"use client";

import { useState, useRef, useEffect } from 'react';
import { useSimStore } from '@/store/useSimStore';
import { useRouter } from 'next/navigation';

export default function GlobalSearch() {
  const { allPlayers, allKeepers } = useSimStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results: any[] = [];
  if (query.length > 1) {
    const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const q = normalizeStr(query);
    const players = allPlayers.filter(p => normalizeStr(p.name).includes(q)).slice(0, 5);
    const keepers = allKeepers.filter(k => normalizeStr(k.name).includes(q)).slice(0, 5);
    
    players.forEach(p => results.push({ type: 'Player', ...p }));
    keepers.forEach(k => results.push({ type: 'Keeper', ...k }));
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="flex items-center bg-panel border border-gold-tint/50 rounded-full px-3 py-1.5 focus-within:border-gold-tint transition-colors">
        <svg className="w-4 h-4 text-gold/70 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input 
          type="text" 
          placeholder="Search profiles..." 
          className="bg-transparent border-none outline-none text-sm text-foreground w-32 md:w-48 placeholder-slate-500"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => { if (query.length > 1) setIsOpen(true); }}
        />
      </div>

      {isOpen && query.length > 1 && (
        <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2 w-[85vw] max-w-[320px] md:w-72 bg-panel border border-gold-tint rounded-lg shadow-2xl overflow-hidden z-[100]">
          {results.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {results.map(r => (
                <div 
                  key={`${r.type}-${r.id}`}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                    router.push(`/${r.type.toLowerCase()}/${r.id}`);
                  }}
                  className="px-4 py-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 last:border-0 flex justify-between items-center group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white group-hover:text-gold transition-colors">{r.name}</span>
                    <span className="text-xs text-slate-400">{r.nation} {r.club && r.club !== "Unknown" ? `• ${r.club}` : ''}</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${r.type === 'Keeper' ? 'bg-blue-900/50 text-blue-400' : 'bg-green-900/50 text-green-400'}`}>
                    {r.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-400 text-sm">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
