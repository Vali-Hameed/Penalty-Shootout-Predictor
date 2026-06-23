"use client";

import { useState, useEffect } from 'react';
import { MonteCarloResult } from '@/types';
import ShotHeatmap from './ShotHeatmap';
import { useSimStore } from '@/store/useSimStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function PenaltyMatchup({ result }: { result: MonteCarloResult }) {
  const { teamA, teamB } = useSimStore();
  const [kickIndex, setKickIndex] = useState(-1);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const log = result.demo_shootout_log;
  const isFinished = kickIndex >= log.length;

  useEffect(() => {
    if (kickIndex < log.length) {
      const timer = setTimeout(() => {
        setKickIndex(prev => prev + 1);
      }, 1500); // 1.5s delay between kicks
      return () => clearTimeout(timer);
    }
  }, [kickIndex, log.length]);

  useEffect(() => {
    // Update score based on the current kick being shown
    if (kickIndex >= 0 && kickIndex < log.length) {
      const currentKick = log[kickIndex];
      if (currentKick.result.outcome === 'goal') {
        if (currentKick.team === 'A') setScoreA(s => s + 1);
        if (currentKick.team === 'B') setScoreB(s => s + 1);
      }
    }
  }, [kickIndex, log]);

  const currentKick = kickIndex >= 0 && kickIndex < log.length ? log[kickIndex] : null;

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 mt-8 relative overflow-hidden">
      {/* Scoreboard */}
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl mb-8 border border-slate-700 shadow-inner">
        <div className="text-center w-1/3">
          <div className="text-lg text-slate-400 font-semibold">{teamA.name}</div>
          <div className="text-5xl font-black text-white">{scoreA}</div>
        </div>
        <div className="text-center w-1/3">
          <div className="text-sm text-slate-500 uppercase tracking-widest font-bold">Round</div>
          <div className="text-2xl font-bold text-yellow-500">
            {isFinished ? "FT" : currentKick ? currentKick.round_str : "-"}
          </div>
        </div>
        <div className="text-center w-1/3">
          <div className="text-lg text-slate-400 font-semibold">{teamB.name}</div>
          <div className="text-5xl font-black text-white">{scoreB}</div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* Heatmap Area */}
        <div className="w-full max-w-2xl bg-slate-900 rounded-xl p-8 border border-slate-700 shadow-inner relative">
          
          <AnimatePresence mode="wait">
            {currentKick ? (
              <motion.div
                key={kickIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-white mb-2">
                    {currentKick.team === 'A' ? teamA.name : teamB.name} Kick
                  </div>
                  <div className="inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider bg-slate-800 border border-slate-600 text-slate-300">
                    Outcome: <span className={
                      currentKick.result.outcome === 'goal' ? 'text-green-400' :
                      currentKick.result.outcome === 'save' ? 'text-red-400' : 'text-yellow-400'
                    }>{currentKick.result.outcome}</span>
                  </div>
                </div>
                
                <ShotHeatmap 
                  shootZone={currentKick.result.shoot_zone} 
                  gkDiveZone={currentKick.result.gk_dive} 
                  outcome={currentKick.result.outcome} 
                />
              </motion.div>
            ) : isFinished ? (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <h2 className="text-4xl font-black text-white mb-4">SHOOTOUT COMPLETE</h2>
                <p className="text-xl text-slate-400">
                  {scoreA > scoreB ? `${teamA.name} Wins!` : scoreA < scoreB ? `${teamB.name} Wins!` : "Draw?"}
                </p>
              </motion.div>
            ) : (
              <div className="py-20 text-center text-slate-500 font-semibold tracking-widest animate-pulse">
                PREPARING KICK...
              </div>
            )}
          </AnimatePresence>

        </div>
      </div>
      
      {/* Timeline tracker */}
      <div className="mt-8 flex justify-center gap-2 flex-wrap">
        {log.map((k, i) => (
          <div 
            key={i} 
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
              i < kickIndex 
                ? k.result.outcome === 'goal' ? 'bg-green-500 border-green-600 text-white' : 'bg-red-500 border-red-600 text-white'
                : i === kickIndex 
                  ? 'bg-yellow-400 border-yellow-500 animate-pulse text-slate-900' 
                  : 'bg-slate-800 border-slate-600 text-slate-500'
            }`}
          >
            {k.team}
          </div>
        ))}
      </div>
    </div>
  );
}
