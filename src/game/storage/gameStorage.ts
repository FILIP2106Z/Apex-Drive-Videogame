/**
 * Game Storage & Offline Profile Management
 */

import {
  UserProfile,
  VehicleId,
  VehicleCustomization,
  VehicleUpgrades,
  GraphicsSettings,
  ControlBindings,
} from '../../types/game';

export const STORAGE_KEY_PROFILE = 'apex_horizon_profile_v1';
export const STORAGE_KEY_GRAPHICS = 'apex_horizon_graphics_v1';
export const STORAGE_KEY_CONTROLS = 'apex_horizon_controls_v1';

export const DEFAULT_CUSTOMIZATION: VehicleCustomization = {
  bodyColor: '#e62439', // Racing Crimson
  paintFinish: 'metallic',
  accentColor: '#111827',
  rimColor: '#e2e8f0',
  rimStyle: 'spoke',
  spoilerStyle: 'carbon_gt',
  neonColor: 'cyan',
  windowTintOpacity: 0.65,
};

export const DEFAULT_UPGRADES: VehicleUpgrades = {
  engineStage: 0,
  forcedInduction: 'na',
  transmissionStage: 0,
  suspensionStage: 0,
  brakeStage: 0,
  tireCompound: 'all_season',
};

export const DEFAULT_GRAPHICS: GraphicsSettings = {
  preset: 'ultra',
  rayTracingReflections: true,
  globalIllumination: true,
  shadowMapRes: 1024,
  renderScale: 1.0,
  bloom: true,
  motionBlur: true,
  rainDroplets: true,
  vignette: true,
  drawDistance: 600,
  targetFps: 60,
  antiAliasing: true,
  backend: 'WebGL 2.0 (High-PBR)',
};

export const DEFAULT_CONTROLS: ControlBindings = {
  throttle: 'KeyW',
  brake: 'KeyS',
  steerLeft: 'KeyA',
  steerRight: 'KeyD',
  handbrake: 'Space',
  nitro: 'ShiftLeft',
  resetCar: 'KeyR',
  changeCamera: 'KeyC',
  horn: 'KeyH',
  headlights: 'KeyL',
  gearUp: 'KeyE',
  gearDown: 'KeyQ',
  gamepadDeadzone: 0.12,
  steeringSensitivity: 1.0,
};

export function createDefaultProfile(): UserProfile {
  const defaultCustomizations: Record<VehicleId, VehicleCustomization> = {
    apex_gtr: { ...DEFAULT_CUSTOMIZATION, bodyColor: '#ff2247', neonColor: 'cyan' },
    cavallo_f80: { ...DEFAULT_CUSTOMIZATION, bodyColor: '#d4001a', paintFinish: 'metallic', neonColor: 'amber', rimColor: '#ffd700', spoilerStyle: 'carbon_gt' },
    toro_aventis: { ...DEFAULT_CUSTOMIZATION, bodyColor: '#ffcc00', paintFinish: 'gloss', neonColor: 'lime', rimColor: '#111111', spoilerStyle: 'drag_wing' },
    royale_w16: { ...DEFAULT_CUSTOMIZATION, bodyColor: '#0044cc', accentColor: '#111622', paintFinish: 'chrome', neonColor: 'cyan', spoilerStyle: 'carbon_gt' },
    venom_v10: { ...DEFAULT_CUSTOMIZATION, bodyColor: '#ffbb00', neonColor: 'amber', spoilerStyle: 'carbon_gt' },
    brawler_4x4: { ...DEFAULT_CUSTOMIZATION, bodyColor: '#2b7a4b', neonColor: 'none', rimStyle: 'deep_dish', spoilerStyle: 'none' },
    viper_v8: { ...DEFAULT_CUSTOMIZATION, bodyColor: '#185adb', neonColor: 'magenta', rimStyle: 'mesh' },
    phantom_ev: { ...DEFAULT_CUSTOMIZATION, bodyColor: '#00f2fe', neonColor: 'cyan', paintFinish: 'iridescent' },
  };

  const defaultUpgrades: Record<VehicleId, VehicleUpgrades> = {
    apex_gtr: { ...DEFAULT_UPGRADES, engineStage: 1 },
    cavallo_f80: { ...DEFAULT_UPGRADES, engineStage: 1, forcedInduction: 'twin_turbo' },
    toro_aventis: { ...DEFAULT_UPGRADES, engineStage: 1, suspensionStage: 1 },
    royale_w16: { ...DEFAULT_UPGRADES, engineStage: 2, forcedInduction: 'twin_turbo' },
    venom_v10: { ...DEFAULT_UPGRADES },
    brawler_4x4: { ...DEFAULT_UPGRADES, suspensionStage: 1 },
    viper_v8: { ...DEFAULT_UPGRADES },
    phantom_ev: { ...DEFAULT_UPGRADES },
  };

  return {
    playerName: 'Racer #' + Math.floor(1000 + Math.random() * 9000),
    credits: 25000,
    currentVehicleId: 'apex_gtr',
    ownedVehicles: ['apex_gtr'],
    customizations: defaultCustomizations,
    upgrades: defaultUpgrades,
    challengeScores: {},
    tutorialStep: 'welcome',
    tutorialCompleted: false,
    lastSavedAt: Date.now(),
    cloudSyncId: 'APX-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
  };
}

export function loadProfile(): UserProfile {
  try {
    if (typeof localStorage === 'undefined') return createDefaultProfile();
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return createDefaultProfile();
    const parsed = JSON.parse(raw);
    return {
      ...createDefaultProfile(),
      ...parsed,
      customizations: { ...createDefaultProfile().customizations, ...(parsed.customizations || {}) },
      upgrades: { ...createDefaultProfile().upgrades, ...(parsed.upgrades || {}) },
    };
  } catch {
    return createDefaultProfile();
  }
}

export function saveProfile(profile: UserProfile): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const updated = { ...profile, lastSavedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save profile to localStorage:', e);
  }
}

export function loadGraphicsSettings(): GraphicsSettings {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_GRAPHICS;
    const raw = localStorage.getItem(STORAGE_KEY_GRAPHICS);
    if (!raw) return DEFAULT_GRAPHICS;
    return { ...DEFAULT_GRAPHICS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GRAPHICS;
  }
}

export function saveGraphicsSettings(settings: GraphicsSettings): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_GRAPHICS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save graphics settings:', e);
  }
}

export function loadControlBindings(): ControlBindings {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_CONTROLS;
    const raw = localStorage.getItem(STORAGE_KEY_CONTROLS);
    if (!raw) return DEFAULT_CONTROLS;
    return { ...DEFAULT_CONTROLS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONTROLS;
  }
}

export function saveControlBindings(bindings: ControlBindings): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_CONTROLS, JSON.stringify(bindings));
  } catch (e) {
    console.warn('Failed to save control bindings:', e);
  }
}

/**
 * Encodes profile to a base64 transfer string for cross-device cloud sync
 */
export function exportProfileToSyncCode(profile: UserProfile): string {
  const jsonStr = JSON.stringify(profile);
  const base64 = typeof Buffer !== 'undefined'
    ? Buffer.from(jsonStr).toString('base64')
    : btoa(unescape(encodeURIComponent(jsonStr)));
  return `APEXSYNC::${profile.cloudSyncId}::${base64}`;
}

export function importProfileFromSyncCode(code: string): { success: boolean; profile?: UserProfile; error?: string } {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith('APEXSYNC::')) {
      return { success: false, error: 'Invalid Apex Horizon sync code format' };
    }
    const parts = trimmed.split('::');
    if (parts.length < 3) {
      return { success: false, error: 'Corrupted sync code segments' };
    }
    const base64Data = parts[2];
    const jsonStr = typeof Buffer !== 'undefined'
      ? Buffer.from(base64Data, 'base64').toString('utf-8')
      : decodeURIComponent(escape(atob(base64Data)));
    const parsed = JSON.parse(jsonStr) as UserProfile;

    if (!parsed.playerName || !parsed.currentVehicleId) {
      return { success: false, error: 'Corrupt or incompatible profile data' };
    }

    const merged: UserProfile = {
      ...createDefaultProfile(),
      ...parsed,
      lastSavedAt: Date.now(),
    };

    saveProfile(merged);
    return { success: true, profile: merged };
  } catch (e) {
    return { success: false, error: 'Could not decode sync code: ' + (e as Error).message };
  }
}
