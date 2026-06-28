import React from 'react';

interface GoalHeatmapProps {
  probabilities: number[]; // Array of 6 percentages (0-100) in order: TL, TC, TR, BL, BC, BR
  title?: string;
  hasData?: boolean;
}

export default function GoalHeatmap({ probabilities, title = "Heatmap", hasData = true }: GoalHeatmapProps) {
  const ZONES = ["TL", "TC", "TR", "BL", "BC", "BR"];

  const ZONE_CENTERS = [
    { left: '16.66%', top: '25%' }, // TL
    { left: '50%', top: '25%' },    // TC
    { left: '83.33%', top: '25%' }, // TR
    { left: '16.66%', top: '75%' }, // BL
    { left: '50%', top: '75%' },    // BC
    { left: '83.33%', top: '75%' }  // BR
  ];

  // Maps 0-40% to a Blue -> Yellow -> Red gradient
  const getColor = (percentage: number) => {
    if (!hasData) return `hsla(210, 20%, 30%, 0.4)`; // Gray for no data
    
    // Cap at 40% for the color scale
    const maxScale = 40; 
    const p = Math.max(0, Math.min(maxScale, percentage));
    const normalized = (p / maxScale) * 100;
    
    // Hue: 240 (Blue) -> 60 (Yellow) -> 0 (Red)
    const hue = 240 - (normalized * 2.4);
    
    return `hsla(${hue}, 100%, 50%, 0.85)`;
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h3 className="text-xl font-bold text-slate-300 mb-6">{title}</h3>
      
      {/* Goal Frame Wrapper */}
      <div className="w-full max-w-2xl relative mt-2 mb-2">
        
        {/* Main Goal Container */}
        <div className="relative w-full aspect-[3/1] bg-slate-900 rounded-t-xl overflow-hidden shadow-inner">
          
          {/* Heatmap Blobs Layer */}
          <div className="absolute inset-0 z-0 blur-[24px] saturate-150">
            {ZONES.map((zone, i) => {
              const prob = probabilities[i] || 0;
              if (!hasData || prob === 0) return null;
              
              // Scale the blob size based on probability so hot zones bleed further
              const scale = 0.8 + (prob / 40) * 1.0; 
              
              return (
                <div
                  key={`blob-${zone}`}
                  className="absolute rounded-full aspect-square w-[35%]"
                  style={{
                    left: ZONE_CENTERS[i].left,
                    top: ZONE_CENTERS[i].top,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    background: `radial-gradient(circle, ${getColor(prob)} 0%, transparent 60%)`,
                  }}
                />
              );
            })}
          </div>

          {/* Text Overlay Grid */}
          <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-2 p-2 gap-2 pointer-events-none">
            {ZONES.map((zone, i) => {
              const prob = probabilities[i] || 0;
              return (
                <div key={`text-${zone}`} className="relative flex flex-col items-center justify-center">
                  <span className="text-white/60 text-xs font-bold tracking-widest uppercase drop-shadow-md">{zone}</span>
                  <span className="text-white font-black text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{prob.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>

          {/* Goal Posts Overlay */}
          <div className="absolute inset-0 border-t-[6px] border-l-[6px] border-r-[6px] border-white/90 rounded-t-xl z-20 pointer-events-none shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
          
          {/* Optional Netting Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-black/30 z-20 pointer-events-none"></div>
        </div>
        
        {/* Ground Line */}
        <div className="h-3 w-full bg-green-900/40 border-t-2 border-green-500/20 rounded-b-lg shadow-[0_-2px_10px_rgba(34,197,94,0.1)]"></div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-3 mt-8 text-xs font-mono text-slate-400">
        <span>0%</span>
        <div className="w-40 h-2.5 rounded-full shadow-inner" style={{ background: 'linear-gradient(to right, hsla(240,100%,50%,0.8), hsla(60,100%,50%,0.9), hsla(0,100%,50%,1))' }}></div>
        <span>40%+</span>
      </div>
    </div>
  );
}
