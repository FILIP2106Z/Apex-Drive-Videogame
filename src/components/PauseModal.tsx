/**
 * Apex Horizon - Pause Modal
 */

import React from 'react';
import { GameTelemetry } from '../types/game';

interface PauseModalProps {
  telemetry: GameTelemetry;
  onResume: () => void;
  onResetCar: () => void;
  onOpenGarage: () => void;
  onReturnToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  telemetry,
  onResume,
  onResetCar,
  onOpenGarage,
  onReturnToTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none text-white select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="text-center">
          <div className="text-xs font-mono font-bold tracking-[0.3em] uppercase text-rose-500 mb-1">
            SIMULATION PAUSED
          </div>
          <h2 className="text-3xl font-black italic tracking-wider">APEX HORIZON</h2>
        </div>

        {/* Current Vehicle Run Metrics */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-lg border border-slate-800 text-xs font-mono">
          <div>
            <div className="text-slate-400">Current Speed</div>
            <div className="text-base font-bold text-white tabular-nums">{Math.round(telemetry.speedKmh)} km/h</div>
          </div>
          <div>
            <div className="text-slate-400">Drift Score</div>
            <div className="text-base font-bold text-cyan-400 tabular-nums">
              {Math.round(telemetry.driftScore).toLocaleString()} pts
            </div>
          </div>
          <div>
            <div className="text-slate-400">Engine Health</div>
            <div className="text-base font-bold text-emerald-400 tabular-nums">
              {Math.round(telemetry.engineHealth)}%
            </div>
          </div>
          <div>
            <div className="text-slate-400">Body Integrity</div>
            <div className="text-base font-bold text-slate-200 tabular-nums">
              {Math.round(telemetry.bodyIntegrity)}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-sm py-3 rounded-lg shadow-lg cursor-pointer transition-all"
          >
            Resume Driving (Esc / P)
          </button>

          <button
            onClick={onResetCar}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-lg border border-slate-700 cursor-pointer transition-colors"
          >
            Reset Car to Center Road (R)
          </button>

          <button
            onClick={onOpenGarage}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-lg border border-slate-700 cursor-pointer transition-colors"
          >
            Tuning & Garage Menu
          </button>

          <button
            onClick={onReturnToTitle}
            className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-mono text-xs py-2 rounded-lg border border-slate-800 cursor-pointer transition-colors"
          >
            Return to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
