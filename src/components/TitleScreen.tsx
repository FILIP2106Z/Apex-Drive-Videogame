/**
 * Apex Horizon - Title Screen
 * Live 3D centerpiece showcase, bespoke SVG title lockup, car carousel, and primary Start CTA.
 */

import React from 'react';
import { VehicleId, VehicleSpec } from '../types/game';
import { VEHICLE_DATABASE } from '../game/physics/vehiclePhysics';

interface TitleScreenProps {
  currentVehicleId: VehicleId;
  ownedVehicles: VehicleId[];
  onSelectVehicle: (id: VehicleId) => void;
  onStartGame: (startTutorial?: boolean) => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  credits: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  currentVehicleId,
  ownedVehicles,
  onSelectVehicle,
  onStartGame,
  onOpenGarage,
  onOpenSettings,
  credits,
}) => {
  const currentSpec: VehicleSpec = VEHICLE_DATABASE[currentVehicleId];
  const vehicleList = Object.values(VEHICLE_DATABASE);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col justify-between p-6 md:p-10 text-white select-none pointer-events-none"
      style={{
        background: 'linear-gradient(to right, rgba(9, 10, 15, 0.88) 0%, rgba(9, 10, 15, 0.45) 45%, rgba(9, 10, 15, 0.15) 100%)',
      }}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-4">
          {/* Bespoke Inline SVG Logo Lockup */}
          <div className="flex items-center gap-3">
            <svg className="w-10 h-10 text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]" viewBox="0 0 48 48" fill="none">
              <polygon points="24,4 44,40 32,40 24,24 16,40 4,40" fill="currentColor" />
              <polygon points="24,14 36,36 28,36 24,28 20,36 12,36" fill="#00f0ff" opacity="0.9" />
              <circle cx="24" cy="38" r="3" fill="#ffffff" />
            </svg>
            <div>
              <div className="text-2xl md:text-3xl font-black tracking-widest italic bg-gradient-to-r from-white via-slate-100 to-rose-400 bg-clip-text text-transparent">
                APEX HORIZON
              </div>
              <div className="text-[10px] tracking-[0.3em] font-semibold text-cyan-400 uppercase">
                Open World Driving Simulator
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right Player Stats & Settings */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-1.5 rounded-md flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Credits</span>
            <span className="text-emerald-400 font-bold tabular-nums">${credits.toLocaleString()}</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="bg-slate-800/80 hover:bg-slate-700 border border-slate-600 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider transition-colors cursor-pointer"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Center Left: Vehicle Showcase Specs & Actions */}
      <div className="max-w-xl pointer-events-auto my-auto space-y-6">
        <div>
          <div className="inline-block bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs px-2.5 py-0.5 rounded font-mono uppercase tracking-wider mb-2">
            {currentSpec.category} Class
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-wide text-white drop-shadow-md">
            {currentSpec.name}
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-1 font-medium">
            {currentSpec.tagline}
          </p>
        </div>

        {/* Telemetry Spec Bars */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Horsepower</span>
              <span className="text-white font-mono font-bold">{currentSpec.baseHorsepower} HP</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (currentSpec.baseHorsepower / 1000) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Top Speed</span>
              <span className="text-white font-mono font-bold">{currentSpec.baseTopSpeedKmh} km/h</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full"
                style={{ width: `${Math.min(100, (currentSpec.baseTopSpeedKmh / 380) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>0-100 km/h</span>
              <span className="text-white font-mono font-bold">{currentSpec.baseAcceleration}s</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: `${Math.max(10, 100 - (currentSpec.baseAcceleration / 6.0) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Handling Grip</span>
              <span className="text-white font-mono font-bold">{currentSpec.baseHandling}/10</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full"
                style={{ width: `${(currentSpec.baseHandling / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Primary Start CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            data-start="true"
            onClick={() => onStartGame(false)}
            className="flex-1 min-w-[200px] bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-black italic text-lg px-8 py-3.5 rounded-md shadow-lg shadow-rose-900/50 border border-rose-400/40 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>ENTER FREE ROAM</span>
            <span className="text-xs font-mono font-normal opacity-80 not-italic">(Press Enter / Space)</span>
          </button>

          <button
            onClick={() => onStartGame(true)}
            className="bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-sm px-5 py-3.5 rounded-md border border-cyan-400/50 transition-all cursor-pointer"
          >
            Driving Academy
          </button>

          <button
            onClick={onOpenGarage}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm px-5 py-3.5 rounded-md border border-slate-600 transition-all cursor-pointer"
          >
            Custom Garage & Tuning
          </button>
        </div>

        {/* Vehicle Carousel Pills */}
        <div className="pt-2">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Select Vehicle:</div>
          <div className="flex flex-wrap gap-2">
            {vehicleList.map((veh) => {
              const isSelected = veh.id === currentVehicleId;
              const isOwned = ownedVehicles.includes(veh.id);

              return (
                <button
                  key={veh.id}
                  onClick={() => onSelectVehicle(veh.id)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                      : isOwned
                      ? 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-slate-500'
                      : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{veh.name}</span>
                  {!isOwned && <span className="text-[10px] text-amber-400">(${veh.costCredits.toLocaleString()})</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Safe Margin: Flat Control Hint Line */}
      <div className="w-full text-center text-xs text-slate-400/80 font-mono tracking-wide pointer-events-auto">
        WASD / Left Stick Drive · Space / Gamepad (A) Handbrake · Shift / Gamepad (B) Nitro · R Repair · C Camera · Esc Pause
      </div>
    </div>
  );
};
