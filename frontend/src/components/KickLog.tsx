"use client";

import { useEffect, useRef } from "react";
import { MonteCarloResult } from "@/types";
import { useSimStore } from "@/store/useSimStore";

export default function KickLog({ result, visibleCount }: { result: MonteCarloResult, visibleCount: number }) {
  const { teamA, teamB } = useSimStore();
  const logs = result.demo_shootout_log;
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new shots appear
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleCount]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="bg-panel border border-gold-tint rounded-lg p-4 flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-sec font-condensed uppercase tracking-wider font-bold text-sm">Kick Log</h3>
          {visibleCount < logs.length && (
            <span className="text-gold animate-pulse text-xs font-mono">Simulating...</span>
          )}
        </div>
        
        <div 
          ref={containerRef}
          className="overflow-y-auto pr-2 space-y-3 flex-1 custom-scrollbar"
        >
          {logs.slice(0, visibleCount).map((log, index) => {
            const isGoal = log.result.outcome === "goal";
            const isSave = log.result.outcome === "save";

            const teamName = log.team === "A" ? teamA.name : teamB.name;

            return (
              <div 
                key={index} 
                className="flex flex-col gap-1 animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <div 
                  className={`flex items-center gap-3 p-3 rounded border ${
                    isGoal 
                      ? "bg-success-tint border-success/40" 
                      : "bg-fail-tint border-fail/40"
                  }`}
                >
                  <div className="w-8 text-center font-mono text-gray-sec text-xs">
                    {log.round_str}
                  </div>
                  
                  <div className="flex-1 font-mono text-foreground font-bold flex items-center">
                    <span className="opacity-70 mr-2 text-[10px] md:text-xs truncate max-w-[80px] md:max-w-[150px] inline-block">
                      {log.shooter_name}
                    </span>
                    <span className="text-xs md:text-sm">
                      {log.result.shoot_zone}
                    </span>
                  </div>

                  <div className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                    isGoal ? "text-success bg-success/10" : "text-fail bg-fail/10"
                  }`}>
                    {isGoal ? "GOL" : isSave ? "SAV" : "MIS"}
                  </div>
                </div>

                {/* Sub-details (Keeper action) */}
                <div className="pl-14 flex gap-4 text-xs font-sans text-gray-sec">
                  <div>
                    Keeper: <span className="text-foreground">{log.result.gk_dive}</span>
                  </div>
                  <div>
                    xS: <span className="text-foreground">{(log.result.save_prob_posterior_mean * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
