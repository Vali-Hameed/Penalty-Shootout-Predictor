"use client";

import { KickLogEntry } from "@/types";

export default function GoalVisualization({ log }: { log?: KickLogEntry }) {
  if (!log) {
    return (
      <div className="bg-panel border border-gold-tint rounded-lg flex items-center justify-center h-full min-h-[300px]">
        <span className="text-gray-sec font-mono text-sm animate-pulse">Waiting for kick...</span>
      </div>
    );
  }

  const { shoot_zone, gk_dive, outcome } = log.result;
  const isGoal = outcome === "goal";
  const isSave = outcome === "save";

  // Coordinates for the 6 zones (TL, TC, TR, BL, BC, BR)
  // Percentages from top-left of the goal frame.
  const zoneCoords: Record<string, { x: string, y: string }> = {
    "TL": { x: "15%", y: "20%" },
    "TC": { x: "50%", y: "20%" },
    "TR": { x: "85%", y: "20%" },
    "BL": { x: "15%", y: "85%" },
    "BC": { x: "50%", y: "85%" },
    "BR": { x: "85%", y: "85%" },
  };

  const ballPos = zoneCoords[shoot_zone] || { x: "50%", y: "50%" };
  const keeperPos = zoneCoords[gk_dive] || { x: "50%", y: "50%" };

  return (
    <div className="bg-panel border border-gold-tint rounded-lg p-6 flex flex-col items-center justify-center h-full">
      <div className="relative w-full max-w-[400px] aspect-[2/1] border-x-8 border-t-8 border-gray-300 rounded-t-lg bg-green-900/20 overflow-hidden shadow-[inset_0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Net pattern (simplified via CSS background) */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px"
          }}
        ></div>

        {/* Keeper Indicator */}
        <div 
          className="absolute w-16 h-16 -ml-8 -mt-8 flex items-center justify-center transition-all duration-500 ease-out"
          style={{ left: keeperPos.x, top: keeperPos.y }}
        >
          <div className="w-12 h-12 bg-blue-500/80 rounded-full blur-md absolute"></div>
          <span className="text-3xl relative z-10">🧤</span>
        </div>

        {/* Ball Indicator */}
        <div 
          className="absolute w-8 h-8 -ml-4 -mt-4 transition-all duration-300 ease-out"
          style={{ left: ballPos.x, top: ballPos.y }}
        >
          <div className={`w-full h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] flex items-center justify-center text-sm
            ${isGoal ? "bg-white" : "bg-red-500"}
          `}>
            ⚽
          </div>
        </div>

      </div>

      <div className="mt-6 flex gap-4 w-full">
        <div className="flex-1 bg-input rounded p-3 border border-gold-tint flex flex-col items-center">
          <span className="text-gray-sec font-mono text-xs mb-1">TARGET</span>
          <span className="text-foreground font-bold text-sm">{shoot_zone}</span>
        </div>
        <div className="flex-1 bg-input rounded p-3 border border-gold-tint flex flex-col items-center">
          <span className="text-gray-sec font-mono text-xs mb-1">KEEPER</span>
          <span className="text-foreground font-bold text-sm">{gk_dive}</span>
        </div>
        <div className={`flex-1 rounded p-3 border flex flex-col items-center ${isGoal ? 'bg-success/10 border-success/40' : isSave ? 'bg-blue-500/10 border-blue-500/40' : 'bg-fail/10 border-fail/40'}`}>
          <span className="text-gray-sec font-mono text-xs mb-1">OUTCOME</span>
          <span className={`font-bold text-sm ${isGoal ? 'text-success' : isSave ? 'text-blue-400' : 'text-fail'}`}>
            {outcome.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
