import { motion } from 'framer-motion';

interface ShotHeatmapProps {
  shootZone?: string;
  gkDiveZone?: string;
  outcome?: 'goal' | 'save' | 'miss';
}

const zoneMap: Record<string, { top: string; left: string; width: string; height: string }> = {
  'TL': { top: '0%', left: '0%', width: '33.33%', height: '50%' },
  'TC': { top: '0%', left: '33.33%', width: '33.33%', height: '50%' },
  'TR': { top: '0%', left: '66.66%', width: '33.33%', height: '50%' },
  'BL': { top: '50%', left: '0%', width: '33.33%', height: '50%' },
  'BC': { top: '50%', left: '33.33%', width: '33.33%', height: '50%' },
  'BR': { top: '50%', left: '66.66%', width: '33.33%', height: '50%' },
};

export default function ShotHeatmap({ shootZone, gkDiveZone, outcome }: ShotHeatmapProps) {
  return (
    <div className="relative w-full max-w-[400px] aspect-[2/1] mx-auto border-t-8 border-x-8 border-slate-300 rounded-t-lg bg-emerald-900/30 overflow-hidden">
      {/* Net pattern background */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 8px 8px' }} />
      
      {/* Grid lines */}
      <div className="absolute top-1/2 w-full h-[1px] bg-white/20" />
      <div className="absolute left-1/3 h-full w-[1px] bg-white/20" />
      <div className="absolute left-2/3 h-full w-[1px] bg-white/20" />

      {/* GK Dive Animation */}
      {gkDiveZone && zoneMap[gkDiveZone] && (
        <motion.div
          initial={{ top: '50%', left: '50%', x: '-50%', y: '-50%', scale: 0.5, opacity: 0 }}
          animate={{
            top: parseInt(zoneMap[gkDiveZone].top) + 25 + '%',
            left: parseInt(zoneMap[gkDiveZone].left) + 16 + '%',
            scale: 1,
            opacity: 0.7
          }}
          transition={{ duration: 0.4, type: "spring" }}
          className="absolute w-20 h-20 bg-blue-500/50 rounded-full blur-md"
        />
      )}

      {/* Shot Animation */}
      {shootZone && zoneMap[shootZone] && (
        <motion.div
          initial={{ top: '100%', left: '50%', scale: 2, opacity: 0 }}
          animate={{
            top: parseInt(zoneMap[shootZone].top) + 25 + '%',
            left: parseInt(zoneMap[shootZone].left) + 16 + '%',
            scale: 1,
            opacity: 1
          }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="absolute w-6 h-6 -ml-3 -mt-3 shadow-lg flex items-center justify-center"
        >
          <div className={`w-full h-full rounded-full border-2 border-white ${
            outcome === 'goal' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]' :
            outcome === 'save' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' :
            'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]'
          }`}></div>
        </motion.div>
      )}
      
      {!shootZone && (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 font-semibold tracking-wider text-sm">
          AWAITING KICK
        </div>
      )}
    </div>
  );
}
