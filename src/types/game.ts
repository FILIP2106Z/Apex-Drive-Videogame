/**
 * Apex Horizon - Core Type Definitions
 */

export type VehicleId =
  | 'apex_gtr'
  | 'cavallo_f80'
  | 'toro_aventis'
  | 'royale_w16'
  | 'venom_v10'
  | 'brawler_4x4'
  | 'viper_v8'
  | 'phantom_ev';

export type WeatherType = 'clear' | 'sunset' | 'rain' | 'storm' | 'night' | 'overcast';

export type PaintFinish = 'gloss' | 'matte' | 'metallic' | 'chrome' | 'iridescent';

export type RimStyle = 'spoke' | 'mesh' | 'deep_dish' | 'aero_blade';

export type SpoilerStyle = 'none' | 'ducktail' | 'carbon_gt' | 'drag_wing';

export type NeonColor = 'none' | 'cyan' | 'magenta' | 'lime' | 'amber' | 'white' | 'rgb_pulse';

export interface VehicleCustomization {
  bodyColor: string;
  paintFinish: PaintFinish;
  accentColor: string;
  rimColor: string;
  rimStyle: RimStyle;
  spoilerStyle: SpoilerStyle;
  neonColor: NeonColor;
  windowTintOpacity: number; // 0 to 0.95
}

export interface VehicleUpgrades {
  engineStage: number; // 0: Stock, 1: ECU Tune, 2: Cold Air & Exhaust, 3: Forged Twin-Turbo
  forcedInduction: 'na' | 'single_turbo' | 'twin_turbo' | 'supercharger';
  transmissionStage: number; // 0: Street, 1: Sport Short-Shift, 2: Sequential Race
  suspensionStage: number; // 0: Street, 1: Sport Lowered, 2: Track Stiff, 3: Off-Road Lifted
  brakeStage: number; // 0: Stock, 1: Drilled Rotors, 2: Carbon Ceramic
  tireCompound: 'all_season' | 'sport' | 'semi_slick' | 'mud_terrain';
}

export interface VehicleSpec {
  id: VehicleId;
  name: string;
  tagline: string;
  category: 'Sports' | 'Hypercar' | 'Off-Road' | 'Muscle' | 'Electric';
  baseHorsepower: number;
  baseWeightKg: number;
  baseTopSpeedKmh: number;
  baseAcceleration: number; // 0-100 time in sec (lower is better)
  baseHandling: number; // 1-10 rating
  unlockedByDefault: boolean;
  costCredits: number;
}

export interface VehicleDamage {
  engineHealth: number; // 0 to 100
  bodyIntegrity: number; // 0 to 100
  tireHealth: number; // 0 to 100
  deformationFactor: number; // 0 to 1 visual mesh deformation
}

export type GraphicsPreset = 'ultra' | 'high' | 'medium' | 'low';

export interface GraphicsSettings {
  preset: GraphicsPreset;
  rayTracingReflections: boolean; // Screen-space / planar ground reflection simulation
  globalIllumination: boolean; // Dynamic GI contact shadows & bounce
  shadowMapRes: 512 | 1024 | 2048 | 0; // 0 means off
  renderScale: number; // 0.5 to 1.5
  bloom: boolean;
  motionBlur: boolean;
  rainDroplets: boolean;
  vignette: boolean;
  drawDistance: number; // 200m to 1200m
  targetFps: 30 | 60 | 0; // 0 means uncapped
  antiAliasing: boolean;
  backend: 'WebGL 2.0 (High-PBR)' | 'WebGL 1.0 (Low-Power)';
}

export interface ControlBindings {
  throttle: string;
  brake: string;
  steerLeft: string;
  steerRight: string;
  handbrake: string;
  nitro: string;
  resetCar: string;
  changeCamera: string;
  horn: string;
  headlights: string;
  gearUp: string;
  gearDown: string;
  gamepadDeadzone: number;
  steeringSensitivity: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  playerName: string;
  vehicle: string;
  score: number;
  displayValue: string;
  date: string;
  isPlayer?: boolean;
}

export type ChallengeType = 'speed_trap' | 'drift_zone' | 'time_trial' | 'stunt_jump';

export interface SeasonalChallenge {
  id: string;
  title: string;
  type: ChallengeType;
  description: string;
  targetObjective: string;
  rewardCredits: number;
  locationDescription: string;
  bestScore: number;
  targetBronze: number;
  targetSilver: number;
  targetGold: number;
  active: boolean;
}

export type TutorialStep =
  | 'welcome'
  | 'throttle_brake'
  | 'steering'
  | 'handbrake_drift'
  | 'nitro_boost'
  | 'garage_tuning'
  | 'completed';

export interface UserProfile {
  playerName: string;
  credits: number;
  currentVehicleId: VehicleId;
  ownedVehicles: VehicleId[];
  customizations: Record<VehicleId, VehicleCustomization>;
  upgrades: Record<VehicleId, VehicleUpgrades>;
  challengeScores: Record<string, number>;
  tutorialStep: TutorialStep;
  tutorialCompleted: boolean;
  lastSavedAt: number;
  cloudSyncId: string;
}

export interface GameTelemetry {
  speedKmh: number;
  speedMph: number;
  rpm: number;
  maxRpm: number;
  gear: number; // -1: R, 0: N, 1-6: gears
  isAutomatic: boolean;
  nitroPercent: number;
  nitroActive: boolean;
  driftAngle: number;
  driftScore: number;
  driftCombo: number;
  isDrifting: boolean;
  engineHealth: number;
  bodyIntegrity: number;
  headlightsOn: boolean;
  timeOfDayHours: number;
  weather: WeatherType;
  nearRepairStation: boolean;
  currentZoneName: string;
  gamepadConnected: boolean;
  gamepadName: string;
}
