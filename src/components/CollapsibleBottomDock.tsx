/**
 * Apex Horizon - Collapsible Bottom Control Dock
 * Pinned to bottom-center with zero center-viewport occlusion.
 */

import React, { useState } from 'react';
import {
  UserProfile,
  VehicleId,
  VehicleCustomization,
  VehicleUpgrades,
  GraphicsSettings,
  ControlBindings,
  PaintFinish,
  RimStyle,
  SpoilerStyle,
  NeonColor,
} from '../types/game';
import { VEHICLE_DATABASE } from '../game/physics/vehiclePhysics';
import { SEASONAL_CHALLENGES, INITIAL_RIVAL_LEADERBOARDS } from '../game/challenges/seasonalChallenges';
import { PLATFORM_SPECS, GITHUB_WORKFLOW_YML } from '../game/crossplatform/crossPlatformConfigs';
import { exportProfileToSyncCode, importProfileFromSyncCode } from '../game/storage/gameStorage';
import { FREE_3D_CAR_PRESETS, Free3DCarPreset } from '../game/models/carModelLoader';

interface CollapsibleBottomDockProps {
  profile: UserProfile;
  graphics: GraphicsSettings;
  controls: ControlBindings;
  onUpdateProfile: (updated: UserProfile) => void;
  onUpdateGraphics: (updated: GraphicsSettings) => void;
  onUpdateControls: (updated: ControlBindings) => void;
  onSelectVehicle: (id: VehicleId) => void;
  onOpenGitHubReleases?: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

type TabType = 'tuning' | 'challenges' | 'graphics' | 'controls' | 'cloud' | 'crossplatform';

export const CollapsibleBottomDock: React.FC<CollapsibleBottomDockProps> = ({
  profile,
  graphics,
  controls,
  onUpdateProfile,
  onUpdateGraphics,
  onUpdateControls,
  onSelectVehicle,
  onOpenGitHubReleases,
  isOpen,
  onToggleOpen,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('tuning');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('highway_speed_trap');
  const [importCodeInput, setImportCodeInput] = useState('');
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [customGlbUrl, setCustomGlbUrl] = useState('');
  const [modelStatusMsg, setModelStatusMsg] = useState<string | null>(null);

  const currentVehicleId = profile.currentVehicleId;
  const currentCustom = profile.customizations[currentVehicleId];
  const currentUpgrades = profile.upgrades[currentVehicleId];
  const currentSpec = VEHICLE_DATABASE[currentVehicleId];

  const handleUpdateCustomization = (patch: Partial<VehicleCustomization>) => {
    const updated = {
      ...profile,
      customizations: {
        ...profile.customizations,
        [currentVehicleId]: { ...currentCustom, ...patch },
      },
    };
    onUpdateProfile(updated);
  };

  const handleUpdateUpgrades = (patch: Partial<VehicleUpgrades>) => {
    const updated = {
      ...profile,
      upgrades: {
        ...profile.upgrades,
        [currentVehicleId]: { ...currentUpgrades, ...patch },
      },
    };
    onUpdateProfile(updated);
  };

  const handleExportCode = () => {
    const code = exportProfileToSyncCode(profile);
    navigator.clipboard.writeText(code).then(() => {
      setSyncStatusMsg({ text: 'Sync code copied to clipboard!', isError: false });
      setTimeout(() => setSyncStatusMsg(null), 3000);
    });
  };

  const handleImportCode = () => {
    if (!importCodeInput.trim()) return;
    const res = importProfileFromSyncCode(importCodeInput);
    if (res.success && res.profile) {
      onUpdateProfile(res.profile);
      setSyncStatusMsg({ text: 'Profile successfully imported and restored!', isError: false });
      setImportCodeInput('');
    } else {
      setSyncStatusMsg({ text: res.error || 'Failed to import code', isError: true });
    }
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleSelect3dPreset = (preset: Free3DCarPreset) => {
    onUpdateProfile({
      ...profile,
      custom3dModel: {
        enabled: true,
        modelUrl: preset.url,
        modelName: `${preset.brand} ${preset.name}`,
        scale: preset.scaleModifier,
        yOffset: preset.yOffset,
      },
    });
    setModelStatusMsg(`Loaded: ${preset.name} from GitHub!`);
    setTimeout(() => setModelStatusMsg(null), 3500);
  };

  const handleLoadCustomGlb = () => {
    if (!customGlbUrl.trim()) return;
    onUpdateProfile({
      ...profile,
      custom3dModel: {
        enabled: true,
        modelUrl: customGlbUrl.trim(),
        modelName: 'Custom 3D Model',
        scale: 1.0,
        yOffset: 0.0,
      },
    });
    setModelStatusMsg('Custom 3D model loaded from URL!');
    setTimeout(() => setModelStatusMsg(null), 3500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    onUpdateProfile({
      ...profile,
      custom3dModel: {
        enabled: true,
        modelUrl: objectUrl,
        modelName: file.name.replace(/\.[^/.]+$/, ''),
        scale: 1.0,
        yOffset: 0.0,
      },
    });
    setModelStatusMsg(`Local 3D file "${file.name}" loaded!`);
    setTimeout(() => setModelStatusMsg(null), 3500);
  };

  const handleResetToProcedural = () => {
    onUpdateProfile({
      ...profile,
      custom3dModel: {
        enabled: false,
        modelUrl: '',
        modelName: '',
        scale: 1.0,
        yOffset: 0.0,
      },
    });
    setModelStatusMsg('Restored procedural vehicle model.');
    setTimeout(() => setModelStatusMsg(null), 2500);
  };

  const handleApplyGraphicsPreset = (preset: 'ultra' | 'high' | 'medium' | 'low' | 'performance') => {
    if (preset === 'ultra') {
      onUpdateGraphics({
        ...graphics,
        preset: 'ultra',
        rayTracingReflections: true,
        globalIllumination: true,
        shadowMapRes: 4096,
        renderScale: 1.25,
        bloom: true,
        motionBlur: true,
        speedLines: true,
        rainDroplets: true,
        vignette: true,
        drawDistance: 1200,
        targetFps: 0,
        antiAliasing: true,
        toneMapping: 'aces_filmic',
        volumetricGodRays: true,
        fov: 65,
        particleDensity: 'ultra',
      });
    } else if (preset === 'high') {
      onUpdateGraphics({
        ...graphics,
        preset: 'high',
        rayTracingReflections: true,
        globalIllumination: true,
        shadowMapRes: 2048,
        renderScale: 1.0,
        bloom: true,
        motionBlur: false,
        speedLines: true,
        rainDroplets: true,
        vignette: true,
        drawDistance: 800,
        targetFps: 60,
        antiAliasing: true,
        toneMapping: 'aces_filmic',
        volumetricGodRays: true,
        fov: 65,
        particleDensity: 'high',
      });
    } else if (preset === 'medium') {
      onUpdateGraphics({
        ...graphics,
        preset: 'medium',
        rayTracingReflections: false,
        globalIllumination: false,
        shadowMapRes: 1024,
        renderScale: 0.85,
        bloom: false,
        motionBlur: false,
        speedLines: false,
        rainDroplets: false,
        vignette: true,
        drawDistance: 500,
        targetFps: 60,
        antiAliasing: false,
        toneMapping: 'reinhard',
        volumetricGodRays: false,
        fov: 65,
        particleDensity: 'medium',
      });
    } else if (preset === 'low') {
      onUpdateGraphics({
        ...graphics,
        preset: 'low',
        rayTracingReflections: false,
        globalIllumination: false,
        shadowMapRes: 512,
        renderScale: 0.75,
        bloom: false,
        motionBlur: false,
        speedLines: false,
        rainDroplets: false,
        vignette: false,
        drawDistance: 350,
        targetFps: 30,
        antiAliasing: false,
        toneMapping: 'neutral',
        volumetricGodRays: false,
        fov: 65,
        particleDensity: 'low',
      });
    } else {
      // performance / steam deck / older hardware
      onUpdateGraphics({
        ...graphics,
        preset: 'performance',
        rayTracingReflections: false,
        globalIllumination: false,
        shadowMapRes: 0,
        renderScale: 0.6,
        bloom: false,
        motionBlur: false,
        speedLines: false,
        rainDroplets: false,
        vignette: false,
        drawDistance: 250,
        targetFps: 30,
        antiAliasing: false,
        toneMapping: 'neutral',
        volumetricGodRays: false,
        fov: 65,
        particleDensity: 'low',
      });
    }
  };

  return (
    <div
      className="fixed z-40 transition-all duration-300 pointer-events-auto"
      style={{
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(980px, 95vw)',
      }}
    >
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={onToggleOpen}
          className="bg-slate-950/90 hover:bg-slate-900 border border-slate-700/80 border-b-0 px-4 py-1.5 rounded-t-lg text-xs font-mono font-bold tracking-wider text-slate-300 flex items-center gap-1.5 cursor-pointer shadow-lg"
        >
          <span>{isOpen ? '▾ Hide Tuning Dock' : '▴ Open Tuning & Settings'}</span>
          <span className="text-[10px] text-slate-500 font-normal">[H]</span>
        </button>
      </div>

      {/* Main Tabbed Dock Body */}
      {isOpen && (
        <div className="bg-slate-950/95 border border-slate-800 rounded-lg shadow-2xl p-4 md:p-5 text-white max-h-[480px] overflow-y-auto">
          {/* Tabs Navigation Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'tuning', label: 'Garage & Tuning' },
                { id: 'challenges', label: 'Leaderboard & Events' },
                { id: 'graphics', label: 'Graphics & Ray-Tracing' },
                { id: 'controls', label: 'Controls & Gamepad' },
                { id: 'cloud', label: 'Cloud Sync & Offline' },
                { id: 'crossplatform', label: 'Cross-Platform CI/CD' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Bank:</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">${profile.credits.toLocaleString()}</span>
            </div>
          </div>

          {/* TAB 1: GARAGE & TUNING */}
          {activeTab === 'tuning' && (
            <div className="space-y-5">
              {/* Vehicle Picker */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Current Car:</span>
                  <span className="text-base font-black italic text-cyan-400">{currentSpec.name}</span>
                  <span className="text-xs font-mono text-slate-400">({currentSpec.category})</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {Object.values(VEHICLE_DATABASE).map((veh) => {
                    const isSelected = veh.id === currentVehicleId;
                    const isOwned = profile.ownedVehicles.includes(veh.id);

                    return (
                      <button
                        key={veh.id}
                        onClick={() => onSelectVehicle(veh.id)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-500'
                            : isOwned
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        {veh.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aesthetic Customization Grid */}
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
                  Aesthetic Styling & Paint
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Paint Finish & Color */}
                  <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-2.5">
                    <div className="text-xs font-bold text-slate-300">Body Paint Finish</div>
                    <div className="flex flex-wrap gap-1">
                      {(['gloss', 'matte', 'metallic', 'chrome', 'iridescent'] as PaintFinish[]).map((finish) => (
                        <button
                          key={finish}
                          onClick={() => handleUpdateCustomization({ paintFinish: finish })}
                          className={`px-2 py-1 rounded text-[11px] font-mono capitalize cursor-pointer border ${
                            currentCustom.paintFinish === finish
                              ? 'bg-rose-600 text-white border-rose-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          {finish}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <div className="text-xs font-bold text-slate-300 mb-1">Body Color Hue</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentCustom.bodyColor}
                          onChange={(e) => handleUpdateCustomization({ bodyColor: e.target.value })}
                          className="w-8 h-8 rounded border border-slate-600 bg-transparent cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-300">{currentCustom.bodyColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rims & Calipers */}
                  <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-2.5">
                    <div className="text-xs font-bold text-slate-300">Wheel Rim Style</div>
                    <div className="flex flex-wrap gap-1">
                      {(['spoke', 'mesh', 'deep_dish', 'aero_blade'] as RimStyle[]).map((style) => (
                        <button
                          key={style}
                          onClick={() => handleUpdateCustomization({ rimStyle: style })}
                          className={`px-2 py-1 rounded text-[11px] font-mono capitalize cursor-pointer border ${
                            currentCustom.rimStyle === style
                              ? 'bg-rose-600 text-white border-rose-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          {style.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <div className="text-xs font-bold text-slate-300 mb-1">Rim Metal Color</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentCustom.rimColor}
                          onChange={(e) => handleUpdateCustomization({ rimColor: e.target.value })}
                          className="w-8 h-8 rounded border border-slate-600 bg-transparent cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-300">{currentCustom.rimColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Underglow Neon & Spoilers */}
                  <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-2.5">
                    <div className="text-xs font-bold text-slate-300">Underglow Neon Glow</div>
                    <div className="flex flex-wrap gap-1">
                      {(['none', 'cyan', 'magenta', 'lime', 'amber', 'white'] as NeonColor[]).map((neon) => (
                        <button
                          key={neon}
                          onClick={() => handleUpdateCustomization({ neonColor: neon })}
                          className={`px-2 py-1 rounded text-[11px] font-mono capitalize cursor-pointer border ${
                            currentCustom.neonColor === neon
                              ? 'bg-rose-600 text-white border-rose-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          {neon}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <div className="text-xs font-bold text-slate-300 mb-1">Aerodynamic Wing / Spoiler</div>
                      <div className="flex flex-wrap gap-1">
                        {(['none', 'ducktail', 'carbon_gt', 'drag_wing'] as SpoilerStyle[]).map((sp) => (
                          <button
                            key={sp}
                            onClick={() => handleUpdateCustomization({ spoilerStyle: sp })}
                            className={`px-2 py-1 rounded text-[11px] font-mono capitalize cursor-pointer border ${
                              currentCustom.spoilerStyle === sp
                                ? 'bg-cyan-600 text-white border-cyan-400'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                          >
                            {sp.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Engineering Upgrades */}
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
                  Mechanical Performance Upgrades
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Engine & Turbo */}
                  <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-300">Engine Tuning Stage</div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((stg) => (
                        <button
                          key={stg}
                          onClick={() => handleUpdateUpgrades({ engineStage: stg })}
                          className={`flex-1 py-1 rounded text-xs font-mono font-bold cursor-pointer border ${
                            currentUpgrades.engineStage === stg
                              ? 'bg-rose-600 text-white border-rose-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {stg === 0 ? 'Stock' : `Stg ${stg}`}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 text-xs font-bold text-slate-300">Forced Induction</div>
                    <div className="flex flex-wrap gap-1">
                      {['na', 'single_turbo', 'twin_turbo', 'supercharger'].map((fi) => (
                        <button
                          key={fi}
                          onClick={() => handleUpdateUpgrades({ forcedInduction: fi as any })}
                          className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer border ${
                            currentUpgrades.forcedInduction === fi
                              ? 'bg-cyan-600 text-white border-cyan-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {fi.replace('_', ' ').toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suspension & Brakes */}
                  <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-300">Suspension Stiffness</div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((stg) => (
                        <button
                          key={stg}
                          onClick={() => handleUpdateUpgrades({ suspensionStage: stg })}
                          className={`flex-1 py-1 rounded text-xs font-mono font-bold cursor-pointer border ${
                            currentUpgrades.suspensionStage === stg
                              ? 'bg-rose-600 text-white border-rose-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {stg === 0 ? 'Street' : stg === 1 ? 'Sport' : stg === 2 ? 'Track' : 'Lifted'}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 text-xs font-bold text-slate-300">Braking System</div>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((stg) => (
                        <button
                          key={stg}
                          onClick={() => handleUpdateUpgrades({ brakeStage: stg })}
                          className={`flex-1 py-1 rounded text-xs font-mono font-bold cursor-pointer border ${
                            currentUpgrades.brakeStage === stg
                              ? 'bg-rose-600 text-white border-rose-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {stg === 0 ? 'Stock' : stg === 1 ? 'Drilled' : 'Carbon Ceramic'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tires & Transmission */}
                  <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-300">Tire Compound Grip</div>
                    <div className="flex flex-wrap gap-1">
                      {['all_season', 'sport', 'semi_slick', 'mud_terrain'].map((cmp) => (
                        <button
                          key={cmp}
                          onClick={() => handleUpdateUpgrades({ tireCompound: cmp as any })}
                          className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer border ${
                            currentUpgrades.tireCompound === cmp
                              ? 'bg-cyan-600 text-white border-cyan-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {cmp.replace('_', ' ').toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 text-xs font-bold text-slate-300">Gearbox Transmission</div>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((stg) => (
                        <button
                          key={stg}
                          onClick={() => handleUpdateUpgrades({ transmissionStage: stg })}
                          className={`flex-1 py-1 rounded text-xs font-mono font-bold cursor-pointer border ${
                            currentUpgrades.transmissionStage === stg
                              ? 'bg-rose-600 text-white border-rose-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {stg === 0 ? 'Stock' : stg === 1 ? 'Short-Shift' : 'Sequential Race'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. FREE 3D CAR MODELS FROM GITHUB & CUSTOM GLTF/GLB IMPORTER */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <span>Free 3D Car Models from GitHub & GLTF/GLB Importer</span>
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">PBR 3D Engine</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Load free open-source 3D vehicles directly from GitHub raw repositories, CDNs, or upload your own local .glb model!
                    </div>
                  </div>

                  {profile.custom3dModel?.enabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                        Active: {profile.custom3dModel.modelName}
                      </span>
                      <button
                        onClick={handleResetToProcedural}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded cursor-pointer border border-slate-700"
                      >
                        Reset to Fleet
                      </button>
                    </div>
                  )}
                </div>

                {modelStatusMsg && (
                  <div className="text-xs font-mono bg-cyan-950/80 border border-cyan-700 text-cyan-300 p-2 rounded">
                    {modelStatusMsg}
                  </div>
                )}

                {/* 1-Click Free Presets from GitHub */}
                <div>
                  <div className="text-xs font-bold text-slate-300 mb-2">1-Click Free Models from GitHub / Open Repos:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {FREE_3D_CAR_PRESETS.map((preset) => {
                      const isActive = profile.custom3dModel?.enabled && profile.custom3dModel.modelUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleSelect3dPreset(preset)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            isActive
                              ? 'bg-cyan-950/80 border-cyan-400 shadow-md'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-[10px] font-mono text-cyan-400 font-bold">{preset.brand}</div>
                          <div className="text-xs font-bold text-white truncate">{preset.name}</div>
                          <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{preset.description}</div>
                          <div className="text-[9px] font-mono text-slate-500 mt-2 truncate">{preset.source}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom GitHub / CDN URL or File Upload */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Load from any GitHub Raw / Web URL (.glb / .gltf):
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        placeholder="https://raw.githubusercontent.com/.../car.glb"
                        value={customGlbUrl}
                        onChange={(e) => setCustomGlbUrl(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                      <button
                        onClick={handleLoadCustomGlb}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1 rounded text-xs cursor-pointer shadow"
                      >
                        Load
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Upload Local 3D Model File (.glb / .gltf):
                    </label>
                    <input
                      type="file"
                      accept=".glb,.gltf"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEASONAL CHALLENGES & LEADERBOARDS */}
          {activeTab === 'challenges' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                {SEASONAL_CHALLENGES.map((ch) => {
                  const isSelected = ch.id === selectedChallengeId;
                  const best = profile.challengeScores[ch.id] || 0;

                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChallengeId(ch.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-rose-950/80 border-rose-500 shadow-md'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase text-rose-400 font-bold mb-1">
                        {ch.type.replace('_', ' ')}
                      </div>
                      <div className="text-xs font-bold text-white truncate">{ch.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{ch.targetObjective}</div>
                      <div className="flex justify-between items-center text-[10px] font-mono mt-2 pt-1 border-t border-slate-800">
                        <span className="text-slate-500">Best:</span>
                        <span className="text-cyan-400 font-bold">{best > 0 ? best : 'Unranked'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Leaderboard Table for Selected Challenge */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {SEASONAL_CHALLENGES.find((c) => c.id === selectedChallengeId)?.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {SEASONAL_CHALLENGES.find((c) => c.id === selectedChallengeId)?.locationDescription}
                    </p>
                  </div>
                  <div className="text-xs font-mono bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 px-3 py-1 rounded">
                    Reward: +$
                    {SEASONAL_CHALLENGES.find((c) => c.id === selectedChallengeId)?.rewardCredits.toLocaleString()}{' '}
                    Credits
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 px-3">Rank</th>
                        <th className="py-2 px-3">Driver</th>
                        <th className="py-2 px-3">Vehicle</th>
                        <th className="py-2 px-3">Record Score</th>
                        <th className="py-2 px-3">Season</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(INITIAL_RIVAL_LEADERBOARDS[selectedChallengeId] || []).map((entry) => (
                        <tr
                          key={entry.id}
                          className={entry.isPlayer ? 'bg-rose-950/40 text-rose-300 font-bold' : 'text-slate-300'}
                        >
                          <td className="py-2 px-3">#{entry.rank}</td>
                          <td className="py-2 px-3 flex items-center gap-1.5">
                            {entry.rank === 1 && <span className="text-amber-400">👑</span>}
                            <span>{entry.playerName}</span>
                          </td>
                          <td className="py-2 px-3">{entry.vehicle}</td>
                          <td className="py-2 px-3 text-cyan-400 font-bold">{entry.displayValue}</td>
                          <td className="py-2 px-3 text-slate-500">{entry.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Forza Horizon 2 Bonus Boards Tracker */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💥</span>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Forza Horizon 2 Bonus Boards
                      </h4>
                      <div className="text-[11px] text-slate-400">
                        Smash bonus boards hidden across the Riviera coast, Tuscan vineyard, and festival arena!
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-mono bg-rose-950/80 border border-rose-600 text-rose-300 px-3 py-1 rounded">
                    Smashed: {(profile.smashedBoards || []).length} / 6
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'board_xp5000_cliff', name: '5,000 XP Coastal Cliff Overlook', reward: '$5,000', hint: 'Riviera seaside corniche cliff' },
                    { id: 'board_xp1000_vineyard', name: '1,000 XP Tuscan Vineyard Trellis', reward: '$1,000', hint: 'Inside the hillside grape rows' },
                    { id: 'board_xp5000_piazza', name: '5,000 XP Piazza Clock Tower', reward: '$5,000', hint: 'Next to the 38m Italian Campanile' },
                    { id: 'board_fasttravel_villa', name: 'Fast Travel 50% Bonus Board', reward: '$7,500', hint: 'Behind the Tuscan villa stone arch' },
                    { id: 'board_xp10000_mountain', name: '10,000 XP Mountain Hairpin', reward: '$10,000', hint: 'At the peak launch cliff' },
                    { id: 'board_xp5000_festival', name: '5,000 XP Festival Main Stage', reward: '$5,000', hint: 'Behind the DJ sound trusses' },
                  ].map((b) => {
                    const isSmashed = (profile.smashedBoards || []).includes(b.id);
                    return (
                      <div
                        key={b.id}
                        className={`p-2.5 rounded border flex items-center justify-between ${
                          isSmashed
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                            : 'bg-slate-950/70 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div>
                          <div className={`font-bold text-xs ${isSmashed ? 'text-emerald-300' : 'text-slate-300'}`}>
                            {b.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{b.hint}</div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              isSmashed
                                ? 'bg-emerald-900/60 text-emerald-300'
                                : 'bg-slate-800 text-amber-400'
                            }`}
                          >
                            {isSmashed ? 'SMASHED' : b.reward}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GRAPHICS & RAY-TRACING */}
          {activeTab === 'graphics' && (
            <div className="space-y-4">
              {/* Presets Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Graphics Quality Preset</div>
                  <div className="text-[11px] text-slate-400">Forza Horizon 2 Southern Europe visuals, ACES tone mapping & ray-traced reflections</div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(['ultra', 'high', 'medium', 'low', 'performance'] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleApplyGraphicsPreset(preset)}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase cursor-pointer border ${
                        graphics.preset === preset
                          ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {preset === 'ultra' ? 'Ultra (Forza Horizon 2 Max)' : preset === 'high' ? 'High (60 FPS PBR)' : preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* Ray Tracing Reflections */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Ray-Traced Screen Reflections</div>
                    <div className="text-[11px] text-slate-400">Planar wet road, puddles & sea reflections</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={graphics.rayTracingReflections}
                    onChange={(e) => onUpdateGraphics({ ...graphics, rayTracingReflections: e.target.checked })}
                    className="w-4 h-4 cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Global Illumination */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Global Illumination & Contact Shadows</div>
                    <div className="text-[11px] text-slate-400">Multi-bounce ambient lighting & wheel contact ambient occlusion</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={graphics.globalIllumination}
                    onChange={(e) => onUpdateGraphics({ ...graphics, globalIllumination: e.target.checked })}
                    className="w-4 h-4 cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Volumetric God Rays & Atmospheric Fog */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Volumetric Sun God Rays & Tuscan Fog</div>
                    <div className="text-[11px] text-slate-400">Atmospheric golden hour scattering & mist</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={graphics.volumetricGodRays}
                    onChange={(e) => onUpdateGraphics({ ...graphics, volumetricGodRays: e.target.checked })}
                    className="w-4 h-4 cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Shadow Map Quality */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Shadow Resolution</div>
                    <div className="text-[11px] text-slate-400">Directional sun shadow depth map</div>
                  </div>
                  <select
                    value={graphics.shadowMapRes}
                    onChange={(e) => onUpdateGraphics({ ...graphics, shadowMapRes: Number(e.target.value) as any })}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs cursor-pointer text-white font-mono"
                  >
                    <option value={0}>Disabled (Max FPS)</option>
                    <option value={512}>Low (512x512)</option>
                    <option value={1024}>High (1024x1024)</option>
                    <option value={2048}>Ultra (2048x2048 PCF Soft)</option>
                    <option value={4096}>Cinematic (4096x4096 Ultra)</option>
                  </select>
                </div>

                {/* Tone Mapping Engine */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Color Tone Mapping</div>
                    <div className="text-[11px] text-slate-400">High dynamic range color curve</div>
                  </div>
                  <select
                    value={graphics.toneMapping}
                    onChange={(e) => onUpdateGraphics({ ...graphics, toneMapping: e.target.value as any })}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs cursor-pointer text-white font-mono"
                  >
                    <option value="aces_filmic">ACES Filmic (Forza Horizon Style)</option>
                    <option value="reinhard">Reinhard (Smooth Contrast)</option>
                    <option value="cineon">Cineon (Vintage Film)</option>
                    <option value="neutral">Neutral (Standard Raw)</option>
                  </select>
                </div>

                {/* Camera Field of View Slider */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Camera Field of View (FOV)</div>
                    <div className="text-[11px] text-slate-400">Adjusts chase camera perspective ({graphics.fov}°)</div>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="105"
                    step="1"
                    value={graphics.fov}
                    onChange={(e) => onUpdateGraphics({ ...graphics, fov: parseInt(e.target.value) })}
                    className="w-24 cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Render Scale */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Render Resolution Scale</div>
                    <div className="text-[11px] text-slate-400">Internal pixel density ({graphics.renderScale}x)</div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={graphics.renderScale}
                    onChange={(e) => onUpdateGraphics({ ...graphics, renderScale: parseFloat(e.target.value) })}
                    className="w-24 cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Motion Blur & Speed Lines */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Dynamic Speed Warp Lines & Blur</div>
                    <div className="text-[11px] text-slate-400">High-speed radial velocity warp lines</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={graphics.speedLines}
                    onChange={(e) => onUpdateGraphics({ ...graphics, speedLines: e.target.checked })}
                    className="w-4 h-4 cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Particle Density */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Particle FX Density</div>
                    <div className="text-[11px] text-slate-400">Tire smoke, nitro flames & board debris</div>
                  </div>
                  <select
                    value={graphics.particleDensity}
                    onChange={(e) => onUpdateGraphics({ ...graphics, particleDensity: e.target.value as any })}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs cursor-pointer text-white font-mono"
                  >
                    <option value="low">Low (Mobile)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="ultra">Ultra (Max Debris)</option>
                  </select>
                </div>

                {/* Bloom & Neon Glow */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Bloom & Neon Emissive Glow</div>
                    <div className="text-[11px] text-slate-400">Headlights, festival lasers & neon strips</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={graphics.bloom}
                    onChange={(e) => onUpdateGraphics({ ...graphics, bloom: e.target.checked })}
                    className="w-4 h-4 cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Rain Droplets on Screen */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Rain Screen Droplets & Lens Vignette</div>
                    <div className="text-[11px] text-slate-400">Dynamic lens wet droplets during rainfall</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={graphics.rainDroplets}
                    onChange={(e) => onUpdateGraphics({ ...graphics, rainDroplets: e.target.checked })}
                    className="w-4 h-4 cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Target FPS */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Target Frame Rate Limiter</div>
                    <div className="text-[11px] text-slate-400">Smooth frame pacing & battery saver</div>
                  </div>
                  <select
                    value={graphics.targetFps}
                    onChange={(e) => onUpdateGraphics({ ...graphics, targetFps: Number(e.target.value) as any })}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs cursor-pointer text-white font-mono"
                  >
                    <option value={30}>30 FPS (Battery Saver)</option>
                    <option value={60}>60 FPS (Silky Smooth)</option>
                    <option value={120}>120 FPS (ProMotion / Esports)</option>
                    <option value={144}>144 FPS (Ultra-High Refresh)</option>
                    <option value={0}>Uncapped (Maximum Refresh)</option>
                  </select>
                </div>

                {/* Anti-Aliasing */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Anti-Aliasing (MSAA/FXAA)</div>
                    <div className="text-[11px] text-slate-400">Smooth jagged polygon edges</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={graphics.antiAliasing}
                    onChange={(e) => onUpdateGraphics({ ...graphics, antiAliasing: e.target.checked })}
                    className="w-4 h-4 cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Graphics Backend */}
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Graphics Rendering Pipeline</div>
                    <div className="text-[11px] text-slate-400">WebGL pipeline profile</div>
                  </div>
                  <select
                    value={graphics.backend}
                    onChange={(e) => onUpdateGraphics({ ...graphics, backend: e.target.value as any })}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs cursor-pointer text-white font-mono"
                  >
                    <option value="WebGL 2.0 (High-PBR)">WebGL 2.0 (High-PBR)</option>
                    <option value="WebGL 1.0 (Low-Power)">WebGL 1.0 (Low-Power Fallback)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTROLS & GAMEPAD */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Gamepad & Analog Steering Configuration
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Stick Deadzone</span>
                      <span className="font-mono text-cyan-400">{Math.round(controls.gamepadDeadzone * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.35"
                      step="0.01"
                      value={controls.gamepadDeadzone}
                      onChange={(e) => onUpdateControls({ ...controls, gamepadDeadzone: parseFloat(e.target.value) })}
                      className="w-full cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Steering Sensitivity</span>
                      <span className="font-mono text-cyan-400">{controls.steeringSensitivity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={controls.steeringSensitivity}
                      onChange={(e) => onUpdateControls({ ...controls, steeringSensitivity: parseFloat(e.target.value) })}
                      className="w-full cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Default Keyboard Mappings Reference */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Keybind Mapping Reference
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded flex justify-between">
                    <span className="text-slate-400">Accelerate</span>
                    <span className="text-white font-bold">W / ↑ / RT</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded flex justify-between">
                    <span className="text-slate-400">Brake / Reverse</span>
                    <span className="text-white font-bold">S / ↓ / LT</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded flex justify-between">
                    <span className="text-slate-400">Steer Left / Right</span>
                    <span className="text-white font-bold">A / D / L-Stick</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded flex justify-between">
                    <span className="text-slate-400">Handbrake Drift</span>
                    <span className="text-rose-400 font-bold">Space / A</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded flex justify-between">
                    <span className="text-slate-400">Nitro Boost</span>
                    <span className="text-cyan-400 font-bold">Shift / B / RB</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded flex justify-between">
                    <span className="text-slate-400">Quick Repair</span>
                    <span className="text-emerald-400 font-bold">R</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded flex justify-between">
                    <span className="text-slate-400">Change Camera</span>
                    <span className="text-white font-bold">C / Y</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded flex justify-between">
                    <span className="text-slate-400">Pause Menu</span>
                    <span className="text-white font-bold">Esc / P / Start</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLOUD SYNC & OFFLINE */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Cross-Device Cloud Profile Sync</h3>
                    <p className="text-xs text-slate-400">
                      Transfer your customized cars, tuning upgrades, and best challenge scores to any phone, laptop, or PC.
                    </p>
                  </div>
                  <div className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded border border-slate-700 text-cyan-400">
                    ID: {profile.cloudSyncId}
                  </div>
                </div>

                {syncStatusMsg && (
                  <div
                    className={`text-xs px-3 py-2 rounded font-mono ${
                      syncStatusMsg.isError ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {syncStatusMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Export */}
                  <div className="bg-slate-950/80 p-3 rounded border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-300">1. Export Sync Code</div>
                    <p className="text-[11px] text-slate-400">
                      Generates a secure serialized backup token of all your garage vehicles and high scores.
                    </p>
                    <button
                      onClick={handleExportCode}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2 rounded cursor-pointer transition-colors"
                    >
                      Copy Cloud Sync Code
                    </button>
                  </div>

                  {/* Import */}
                  <div className="bg-slate-950/80 p-3 rounded border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-300">2. Restore From Another Device</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste APEXSYNC code here..."
                        value={importCodeInput}
                        onChange={(e) => setImportCodeInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                      />
                      <button
                        onClick={handleImportCode}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded cursor-pointer transition-colors"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CROSS-PLATFORM CI/CD COMPILATION */}
          {activeTab === 'crossplatform' && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Multi-Architecture GitHub Compilation</h3>
                    <p className="text-xs text-slate-400">
                      Automated release pipeline for Android, iOS, Windows, macOS, and Linux (AppImage & Flatpak).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenGitHubReleases && (
                      <button
                        onClick={onOpenGitHubReleases}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
                      >
                        <span>1-Click Install Hub (v1.0.0)</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(GITHUB_WORKFLOW_YML);
                        setCopiedYaml(true);
                        setTimeout(() => setCopiedYaml(false), 3000);
                      }}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded cursor-pointer transition-colors"
                    >
                      {copiedYaml ? 'Copied YAML!' : 'Copy Workflow YAML'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {Object.entries(PLATFORM_SPECS).map(([key, spec]) => (
                    <div key={key} className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-cyan-400">{spec.name}</span>
                        <span className="text-[9px] font-mono uppercase bg-slate-900 border border-slate-700/60 px-1.5 py-0.5 rounded text-slate-400">
                          {spec.name === 'Linux' ? 'AppImage / Flatpak' : spec.name === 'Windows' ? 'EXE / MSIX' : spec.name === 'Android' ? 'APK / AAB' : spec.name === 'macOS' ? 'DMG' : 'IPA'}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Arch: <span className="text-slate-300">{spec.architecture}</span>
                      </div>
                      <div className="border-t border-slate-800/80 pt-2 space-y-1">
                        {spec.osExclusiveFeatures.map((feat, idx) => (
                          <div key={idx} className="text-[10px] text-slate-300 flex items-start gap-1.5 leading-snug">
                            <span className="text-rose-400 font-bold shrink-0">•</span>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
