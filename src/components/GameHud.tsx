/**
 * Apex Horizon - In-Game Telemetry HUD
 * High-performance, low-occlusion perimeter HUD with tachometer, digital speedometer, minimap, and drift counter.
 */

import React, { useState } from 'react';
import { GameTelemetry, TutorialStep } from '../types/game';
import { TUTORIAL_LESSONS } from '../game/tutorial/tutorialManager';
import { soundEngine } from '../game/audio/soundEngine';

interface GameHudProps {
  telemetry: GameTelemetry;
  tutorialStep: TutorialStep;
  tutorialActive: boolean;
  onNextTutorialStep?: () => void;
  onSkipTutorial?: () => void;
  onPause: () => void;
  onToggleCamera: () => void;
  onQuickRepair: () => void;
  onTouchSteer?: (val: number) => void;
  onTouchThrottle?: (val: number) => void;
  onTouchBrake?: (val: number) => void;
  onTouchHandbrake?: (val: boolean) => void;
  onTouchNitro?: (val: boolean) => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  telemetry,
  tutorialStep,
  tutorialActive,
  onSkipTutorial,
  onPause,
  onToggleCamera,
  onQuickRepair,
  onTouchSteer,
  onTouchThrottle,
  onTouchBrake,
  onTouchHandbrake,
  onTouchNitro,
}) => {
  const [speedUnit, setSpeedUnit] = useState<'kmh' | 'mph'>('kmh');
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());
  const [radioStation, setRadioStation] = useState(soundEngine.getRadioStation());

  const displaySpeed = speedUnit === 'kmh' ? Math.round(telemetry.speedKmh) : Math.round(telemetry.speedMph);
  const rpmPercent = Math.min(1.0, telemetry.rpm / telemetry.maxRpm);
  const gearLabel = telemetry.gear === -1 ? 'R' : telemetry.gear === 0 ? 'N' : String(telemetry.gear);

  // Tachometer needle angle: -120deg (0 RPM) to +120deg (Redline)
  const needleAngle = -120 + rpmPercent * 240;

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleNextStation = () => {
    const stations: Array<'off' | 'synthwave' | 'cyberpunk' | 'lofi'> = ['off', 'synthwave', 'cyberpunk', 'lofi'];
    const nextIdx = (stations.indexOf(radioStation) + 1) % stations.length;
    const nextStation = stations[nextIdx];
    soundEngine.setRadioStation(nextStation);
    setRadioStation(nextStation);
  };

  const currentLesson = tutorialActive ? TUTORIAL_LESSONS[tutorialStep] : null;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none select-none text-white font-sans flex flex-col justify-between p-4 md:p-6">
      {/* TOP PERIMETER BAR */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Telemetry & Status Badges */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Location & Time */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-md backdrop-blur-none">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-black tracking-wider uppercase text-slate-200">
              {telemetry.currentZoneName || 'Downtown Skyline'}
            </span>
            <span className="text-slate-500 font-mono text-xs">|</span>
            <span className="text-xs font-mono text-slate-400">
              {Math.floor(telemetry.timeOfDayHours).toString().padStart(2, '0')}:00
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              {telemetry.weather.toUpperCase()}
            </span>
          </div>

          {/* Engine Health & Body Integrity Bars */}
          <div className="bg-slate-950/85 border border-slate-800 p-2.5 rounded-md space-y-1.5 w-48">
            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-rose-400 inline" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  Body
                </span>
                <span className="font-mono tabular-nums text-slate-200">{Math.round(telemetry.bodyIntegrity)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    telemetry.bodyIntegrity > 50 ? 'bg-emerald-400' : telemetry.bodyIntegrity > 25 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${telemetry.bodyIntegrity}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-amber-400 inline" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 4V2H17V4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4H7ZM6 18H18V6H6V18Z" />
                  </svg>
                  Engine
                </span>
                <span className="font-mono tabular-nums text-slate-200">{Math.round(telemetry.engineHealth)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    telemetry.engineHealth > 50 ? 'bg-cyan-400' : telemetry.engineHealth > 25 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${telemetry.engineHealth}%` }}
                />
              </div>
            </div>

            {telemetry.engineHealth < 50 && (
              <div className="text-[10px] text-rose-400 font-mono font-bold tracking-tight">
                Warning: Engine Smoke / Output Loss
              </div>
            )}
          </div>

          {/* Offline Mode Badge */}
          <div className="bg-slate-900/80 border border-slate-700/60 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 w-fit flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>OFFLINE: LOCAL CACHED SAVE</span>
          </div>

          {/* Quick Repair Prompt */}
          {telemetry.nearRepairStation && (
            <div className="bg-emerald-500/90 text-slate-950 font-black text-xs px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              <span>PIT LANE: VEHICLE REPAIRING...</span>
            </div>
          )}
        </div>

        {/* Center: Drift Counter & Combo Popup */}
        {telemetry.isDrifting && (
          <div className="pointer-events-none flex flex-col items-center animate-bounce">
            <div className="text-3xl md:text-4xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-500 to-cyan-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.7)]">
              +{Math.round(telemetry.driftScore).toLocaleString()} PTS
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-rose-600 text-white font-mono font-bold text-xs px-2 py-0.5 rounded">
                DRIFT x{telemetry.driftCombo.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-cyan-300 font-bold">
                {Math.round(telemetry.driftAngle)}° ANGLE
              </span>
            </div>
          </div>
        )}

        {/* Top-Right: Quick Controls & Radio Selector */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Radio Station */}
          <button
            onClick={handleNextStation}
            className="bg-slate-950/85 hover:bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-md text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Switch Radio Station"
          >
            <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
              <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
              <circle cx="12" cy="12" r="2" />
              <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
              <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
            </svg>
            <span className="uppercase text-[11px] font-bold text-slate-300">
              {radioStation === 'off' ? 'Radio Off' : radioStation}
            </span>
          </button>

          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            className="bg-slate-950/85 hover:bg-slate-900 border border-slate-800 p-2 rounded-md transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? (
              <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          {/* Camera Switch */}
          <button
            onClick={onToggleCamera}
            className="bg-slate-950/85 hover:bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer"
            title="Toggle Camera View (C)"
          >
            [C] CAM
          </button>

          {/* Quick Repair */}
          <button
            onClick={onQuickRepair}
            className="bg-slate-950/85 hover:bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-md text-xs font-mono text-emerald-400 transition-colors cursor-pointer"
            title="Quick Repair (R)"
          >
            [R] REPAIR
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            className="bg-slate-950/85 hover:bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md text-xs font-mono font-bold text-rose-400 transition-colors cursor-pointer"
            title="Pause Game (Esc)"
          >
            PAUSE
          </button>
        </div>
      </div>

      {/* TUTORIAL LESSON BANNER (IF ACTIVE) */}
      {tutorialActive && currentLesson && (
        <div className="self-center pointer-events-auto bg-slate-950/90 border border-cyan-500/50 p-4 rounded-lg max-w-lg shadow-xl shadow-cyan-950/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              {currentLesson.title}
            </span>
            <button
              onClick={onSkipTutorial}
              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Skip Academy
            </button>
          </div>
          <div className="text-sm font-medium text-slate-200 mb-2">
            {currentLesson.instruction}
          </div>
          <div className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded text-xs font-mono">
            <span className="text-amber-300 font-bold">{currentLesson.actionHint}</span>
            <span className="text-slate-400 text-[10px]">{currentLesson.targetGoal}</span>
          </div>
        </div>
      )}

      {/* BOTTOM PERIMETER: TELEMETRY CLUSTER & CLUSTER CONTROLS */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom-Left: Minimap Compass & Gamepad Status */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Gamepad Detected Badge */}
          {telemetry.gamepadConnected && (
            <div className="bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 w-fit">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="6" />
                <path d="M6 12h4m-2-2v4m10-2h.01m-3-2h.01" />
              </svg>
              <span>Gamepad Connected</span>
            </div>
          )}

          {/* Stylized Circular Radar / Minimap */}
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-slate-700/80 bg-slate-950/90 overflow-hidden shadow-xl">
            {/* Grid concentric rings */}
            <div className="absolute inset-2 rounded-full border border-slate-800/80" />
            <div className="absolute inset-6 rounded-full border border-slate-800/60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-slate-800/80" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-px bg-slate-800/80" />
            </div>

            {/* Radar Sweep Line */}
            <div
              className="absolute inset-0 origin-center bg-gradient-to-r from-cyan-500/20 to-transparent pointer-events-none"
              style={{
                clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)',
                animation: 'spin 4s linear infinite',
              }}
            />

            {/* Player Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_8px_#f43f5e]" />
            </div>

            {/* Compass Heading */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-slate-400">
              N
            </div>
          </div>
        </div>

        {/* Bottom-Right: Automotive Tachometer & Digital Speedometer Cluster */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Radial Tachometer Dial */}
          <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full bg-slate-950/90 border-2 border-slate-800 p-2 flex items-center justify-center shadow-2xl">
            {/* SVG Tachometer Ticks & Redline Arc */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Dial Background Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="5"
                strokeDasharray="188 62"
                strokeDashoffset="31"
              />
              {/* Dynamic RPM Level Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={rpmPercent > 0.85 ? '#ef4444' : '#06b6d4'}
                strokeWidth="5"
                strokeDasharray={`${rpmPercent * 188} 250`}
                strokeDashoffset="31"
                className="transition-all duration-75"
              />
            </svg>

            {/* RPM Needle */}
            <div
              className="absolute w-1 h-16 origin-bottom bg-gradient-to-t from-transparent via-rose-500 to-rose-400 rounded-full shadow-[0_0_8px_#f43f5e] transition-transform duration-75"
              style={{
                bottom: '50%',
                left: 'calc(50% - 2px)',
                transform: `rotate(${needleAngle}deg)`,
              }}
            />
            {/* Needle Pivot Cap */}
            <div className="absolute w-4 h-4 rounded-full bg-slate-900 border border-slate-600 z-10" />

            {/* Inner Readout: Gear & Speed */}
            <div className="flex flex-col items-center justify-center z-10 pt-2">
              <span className="text-2xl md:text-3xl font-black italic text-cyan-400 drop-shadow">
                {gearLabel}
              </span>
              <span className="text-[9px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                GEAR
              </span>

              {/* Digital Speedometer */}
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl md:text-4xl font-black italic tracking-tighter text-white tabular-nums drop-shadow-md">
                  {displaySpeed}
                </span>
                <button
                  onClick={() => setSpeedUnit(speedUnit === 'kmh' ? 'mph' : 'kmh')}
                  className="text-[10px] font-mono font-bold text-slate-400 hover:text-white uppercase cursor-pointer"
                  title="Click to toggle km/h / mph"
                >
                  {speedUnit}
                </button>
              </div>

              {/* Nitro Boost Bar */}
              <div className="w-20 bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-700/60">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all"
                  style={{ width: `${telemetry.nitroPercent}%` }}
                />
              </div>
              <span className="text-[8px] font-mono text-cyan-300 font-bold tracking-widest mt-0.5">
                NOS {Math.round(telemetry.nitroPercent)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE ON-SCREEN TOUCH CONTROLS (Rendered when touch events detected) */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 flex justify-between items-end pointer-events-none z-30">
        {/* Left Side: Steering Left/Right Buttons */}
        <div className="flex gap-2 pointer-events-auto">
          <button
            onTouchStart={() => onTouchSteer?.(-1.0)}
            onTouchEnd={() => onTouchSteer?.(0)}
            onMouseDown={() => onTouchSteer?.(-1.0)}
            onMouseUp={() => onTouchSteer?.(0)}
            className="w-16 h-16 rounded-full bg-slate-900/80 active:bg-rose-600 border border-slate-700 text-xl font-bold flex items-center justify-center cursor-pointer shadow-lg"
          >
            ◀
          </button>
          <button
            onTouchStart={() => onTouchSteer?.(1.0)}
            onTouchEnd={() => onTouchSteer?.(0)}
            onMouseDown={() => onTouchSteer?.(1.0)}
            onMouseUp={() => onTouchSteer?.(0)}
            className="w-16 h-16 rounded-full bg-slate-900/80 active:bg-rose-600 border border-slate-700 text-xl font-bold flex items-center justify-center cursor-pointer shadow-lg"
          >
            ▶
          </button>
        </div>

        {/* Right Side: Throttle, Brake, Handbrake, Nitro */}
        <div className="flex gap-2 items-end pointer-events-auto">
          <button
            onTouchStart={() => onTouchHandbrake?.(true)}
            onTouchEnd={() => onTouchHandbrake?.(false)}
            className="w-12 h-12 rounded-full bg-slate-800/80 active:bg-amber-500 border border-slate-600 text-xs font-bold font-mono"
          >
            DRIFT
          </button>
          <button
            onTouchStart={() => onTouchNitro?.(true)}
            onTouchEnd={() => onTouchNitro?.(false)}
            className="w-12 h-12 rounded-full bg-cyan-900/80 active:bg-cyan-500 border border-cyan-500 text-xs font-bold font-mono text-cyan-300"
          >
            NOS
          </button>
          <button
            onTouchStart={() => onTouchBrake?.(1.0)}
            onTouchEnd={() => onTouchBrake?.(0)}
            className="w-14 h-14 rounded-full bg-rose-950/80 active:bg-rose-600 border border-rose-700 text-sm font-black"
          >
            STOP
          </button>
          <button
            onTouchStart={() => onTouchThrottle?.(1.0)}
            onTouchEnd={() => onTouchThrottle?.(0)}
            className="w-16 h-20 rounded-2xl bg-emerald-900/80 active:bg-emerald-500 border border-emerald-500 text-base font-black flex items-center justify-center"
          >
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};
