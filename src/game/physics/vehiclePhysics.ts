/**
 * Vehicle Physics Engine - Pure calculation routines
 */

import { VehicleUpgrades, VehicleDamage, VehicleSpec } from '../../types/game';

export const VEHICLE_DATABASE: Record<string, VehicleSpec> = {
  apex_gtr: {
    id: 'apex_gtr',
    name: 'Apex GT-R',
    tagline: 'Twin-Turbo AWD Precision Track Weapon',
    category: 'Sports',
    baseHorsepower: 565,
    baseWeightKg: 1720,
    baseTopSpeedKmh: 315,
    baseAcceleration: 2.9,
    baseHandling: 8.8,
    unlockedByDefault: true,
    costCredits: 0,
  },
  cavallo_f80: {
    id: 'cavallo_f80',
    name: 'Scuderia Cavallo F80',
    tagline: 'Maranello Twin-Turbo V8 Aerodynamic Icon (Ferrari-Inspired)',
    category: 'Hypercar',
    baseHorsepower: 780,
    baseWeightKg: 1390,
    baseTopSpeedKmh: 362,
    baseAcceleration: 2.6,
    baseHandling: 9.6,
    unlockedByDefault: false,
    costCredits: 85000,
  },
  toro_aventis: {
    id: 'toro_aventis',
    name: 'Toro SV-Aventis',
    tagline: 'Sant\'Agata Naturally Aspirated V12 Wedge Stealth (Lamborghini-Inspired)',
    category: 'Hypercar',
    baseHorsepower: 820,
    baseWeightKg: 1450,
    baseTopSpeedKmh: 368,
    baseAcceleration: 2.5,
    baseHandling: 9.5,
    unlockedByDefault: false,
    costCredits: 95000,
  },
  royale_w16: {
    id: 'royale_w16',
    name: 'Royale Chironex W16',
    tagline: 'Molsheim Quad-Turbo W16 1,500 HP Grand Tourer (Bugatti-Inspired)',
    category: 'Hypercar',
    baseHorsepower: 1500,
    baseWeightKg: 1950,
    baseTopSpeedKmh: 420,
    baseAcceleration: 2.2,
    baseHandling: 9.2,
    unlockedByDefault: false,
    costCredits: 160000,
  },
  venom_v10: {
    id: 'venom_v10',
    name: 'Venom V10',
    tagline: 'Naturally Aspirated Mid-Engine Exotic',
    category: 'Hypercar',
    baseHorsepower: 740,
    baseWeightKg: 1420,
    baseTopSpeedKmh: 355,
    baseAcceleration: 2.5,
    baseHandling: 9.4,
    unlockedByDefault: false,
    costCredits: 125000,
  },
  brawler_4x4: {
    id: 'brawler_4x4',
    name: 'Brawler 4x4',
    tagline: 'Long-Travel Trophy Desert Runner',
    category: 'Off-Road',
    baseHorsepower: 450,
    baseWeightKg: 2150,
    baseTopSpeedKmh: 210,
    baseAcceleration: 4.8,
    baseHandling: 6.5,
    unlockedByDefault: false,
    costCredits: 45000,
  },
  viper_v8: {
    id: 'viper_v8',
    name: 'Viper V8 Muscle',
    tagline: 'Supercharged Raw American Torque',
    category: 'Muscle',
    baseHorsepower: 680,
    baseWeightKg: 1850,
    baseTopSpeedKmh: 290,
    baseAcceleration: 3.3,
    baseHandling: 7.2,
    unlockedByDefault: false,
    costCredits: 60000,
  },
  phantom_ev: {
    id: 'phantom_ev',
    name: 'Phantom EV Concept',
    tagline: 'Quad-Motor Instant Torque Cyber Speedster',
    category: 'Electric',
    baseHorsepower: 1020,
    baseWeightKg: 1980,
    baseTopSpeedKmh: 340,
    baseAcceleration: 1.9,
    baseHandling: 9.1,
    unlockedByDefault: false,
    costCredits: 180000,
  },
};

export interface VehiclePhysicsInputs {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 (left) to +1 (right)
  handbrake: boolean;
  nitro: boolean;
  reverse: boolean;
}

export interface VehiclePhysicsState {
  x: number;
  y: number;
  z: number;
  speedMs: number; // forward speed in m/s
  lateralSpeedMs: number; // sideways sliding speed in m/s
  yaw: number; // heading angle in radians
  steerAngle: number; // current front wheel steering angle
  rpm: number;
  gear: number; // -1 for reverse, 1..6 for forward
  pitch: number; // suspension pitch (dive/squat)
  roll: number; // suspension roll (cornering)
  verticalVelocity: number; // for jumps
  isAirborne: boolean;
  isDrifting: boolean;
  driftSlipAngle: number;
  wheelSlipRear: number;
  nitroRemaining: number; // 0 to 100
}

export interface PhysicsDerivedProps {
  effectiveHorsepower: number;
  effectiveWeightKg: number;
  topSpeedMs: number;
  gripFactor: number;
  brakingPower: number;
}

export const GEAR_RATIOS = [3.8, 2.6, 1.9, 1.4, 1.1, 0.85];
export const FINAL_DRIVE = 3.6;

/**
 * Calculates effective performance properties after applying upgrades
 */
export function calculatePerformance(spec: VehicleSpec, upgrades?: VehicleUpgrades): PhysicsDerivedProps {
  const engineBoost = upgrades ? (upgrades.engineStage * 0.12) : 0;
  const turboBoost = upgrades
    ? upgrades.forcedInduction === 'twin_turbo'
      ? 0.28
      : upgrades.forcedInduction === 'supercharger'
      ? 0.25
      : upgrades.forcedInduction === 'single_turbo'
      ? 0.16
      : 0
    : 0;
  
  const tireGrip = upgrades
    ? upgrades.tireCompound === 'semi_slick'
      ? 1.25
      : upgrades.tireCompound === 'sport'
      ? 1.12
      : upgrades.tireCompound === 'mud_terrain'
      ? 0.95
      : 1.0
    : 1.0;

  const brakePower = upgrades
    ? upgrades.brakeStage === 2
      ? 1.35
      : upgrades.brakeStage === 1
      ? 1.18
      : 1.0
    : 1.0;

  const suspensionHandling = upgrades
    ? upgrades.suspensionStage === 2
      ? 1.2
      : upgrades.suspensionStage === 1
      ? 1.1
      : 1.0
    : 1.0;

  const effectiveHorsepower = spec.baseHorsepower * (1 + engineBoost + turboBoost);
  const effectiveWeightKg = spec.baseWeightKg * (upgrades?.suspensionStage === 2 ? 0.94 : 1.0);
  const topSpeedMs = (spec.baseTopSpeedKmh * (1 + (engineBoost + turboBoost) * 0.4)) / 3.6;
  const gripFactor = tireGrip * suspensionHandling * (spec.baseHandling / 8.0);
  const brakingPower = 18.0 * brakePower;

  return {
    effectiveHorsepower,
    effectiveWeightKg,
    topSpeedMs,
    gripFactor,
    brakingPower,
  };
}

/**
 * Calculates RPM based on vehicle speed, gear, and throttle
 */
export function calculateEngineRpm(
  speedMs: number,
  gear: number,
  throttle: number,
  idleRpm = 950,
  redlineRpm = 8200
): number {
  if (gear === 0) {
    return Math.min(redlineRpm, idleRpm + throttle * 5500);
  }
  const gearIndex = Math.max(0, Math.min(GEAR_RATIOS.length - 1, Math.abs(gear) - 1));
  const ratio = GEAR_RATIOS[gearIndex] * FINAL_DRIVE;
  const wheelCircumference = 2.05; // 20-inch wheel ~ 0.65m diam
  const wheelRps = Math.max(0, Math.abs(speedMs)) / wheelCircumference;
  const computedRpm = wheelRps * 60 * ratio;

  // Blend with throttle so revs flare slightly when slipping or stationary
  const revFlare = throttle > 0.1 && Math.abs(speedMs) < 3 ? throttle * 2800 : 0;
  return Math.max(idleRpm, Math.min(redlineRpm, computedRpm + revFlare));
}

/**
 * Shift gear automatically based on RPM and speed
 */
export function updateAutomaticGear(currentGear: number, rpm: number, speedMs: number, reverse: boolean): number {
  if (reverse && speedMs <= 0.5) return -1;
  if (!reverse && currentGear === -1) return 1;
  if (currentGear === -1) return -1;

  if (rpm > 7200 && currentGear < 6) {
    return currentGear + 1;
  }
  if (rpm < 3200 && currentGear > 1) {
    return currentGear - 1;
  }
  return currentGear <= 0 ? 1 : currentGear;
}

/**
 * Calculates collision damage given impact speed and normal
 */
export function calculateCollisionDamage(
  impactSpeedMs: number,
  currentDamage: VehicleDamage
): { newDamage: VehicleDamage; deltaIntegrity: number } {
  // Minor bumps (< 4 m/s ~ 14 km/h) deal negligible damage
  if (impactSpeedMs < 4.0) {
    return { newDamage: { ...currentDamage }, deltaIntegrity: 0 };
  }

  const rawImpact = (impactSpeedMs - 4.0) * 1.8;
  const bodyIntegrityLoss = Math.min(currentDamage.bodyIntegrity, rawImpact * 1.2);
  const engineHealthLoss = impactSpeedMs > 10.0 ? Math.min(currentDamage.engineHealth, (impactSpeedMs - 10.0) * 1.5) : 0;

  const newDamage: VehicleDamage = {
    bodyIntegrity: Math.max(0, currentDamage.bodyIntegrity - bodyIntegrityLoss),
    engineHealth: Math.max(0, currentDamage.engineHealth - engineHealthLoss),
    tireHealth: Math.max(10, currentDamage.tireHealth - rawImpact * 0.2),
    deformationFactor: Math.min(1.0, currentDamage.deformationFactor + bodyIntegrityLoss * 0.008),
  };

  return {
    newDamage,
    deltaIntegrity: bodyIntegrityLoss,
  };
}

/**
 * Step vehicle physics simulation
 */
export function stepVehiclePhysics(
  state: VehiclePhysicsState,
  inputs: VehiclePhysicsInputs,
  props: PhysicsDerivedProps,
  damage: VehicleDamage,
  surfaceFriction = 1.0,
  dt = 0.016
): VehiclePhysicsState {
  const clampedDt = Math.min(dt, 0.05);

  // Engine health throttle degradation (if engine is heavily damaged, reduce max power)
  const engineHealthPenalty = damage.engineHealth < 40 ? 0.4 + (damage.engineHealth / 40) * 0.6 : 1.0;

  // Nitro boost effect
  let nitroActive = false;
  let nitroMultiplier = 1.0;
  let newNitroRemaining = state.nitroRemaining;

  if (inputs.nitro && state.nitroRemaining > 0 && inputs.throttle > 0.2) {
    nitroActive = true;
    nitroMultiplier = 1.45;
    newNitroRemaining = Math.max(0, state.nitroRemaining - clampedDt * 22);
  } else {
    // Regenerate nitro slowly when not in use
    newNitroRemaining = Math.min(100, state.nitroRemaining + clampedDt * 5.0);
  }

  // Calculate drive force
  const powerWatts = props.effectiveHorsepower * 745.7 * engineHealthPenalty * nitroMultiplier;
  const maxDriveForce = (powerWatts / Math.max(4.0, Math.abs(state.speedMs))) * 0.85;

  let longitudinalForce = 0;
  if (inputs.reverse) {
    // Reverse drive
    longitudinalForce = -props.effectiveHorsepower * 3.5 * inputs.throttle;
  } else {
    longitudinalForce = maxDriveForce * inputs.throttle;
  }

  // Braking force
  if (inputs.brake > 0) {
    const brakeForce = props.effectiveWeightKg * props.brakingPower * inputs.brake;
    if (state.speedMs > 0.1) {
      longitudinalForce -= brakeForce;
    } else if (state.speedMs < -0.1) {
      longitudinalForce += brakeForce;
    }
  }

  // Aerodynamic drag + Rolling resistance
  const airDrag = 0.5 * 1.225 * 0.32 * 2.2 * state.speedMs * Math.abs(state.speedMs);
  const rollingResistance = props.effectiveWeightKg * 9.81 * 0.015 * Math.sign(state.speedMs);
  longitudinalForce -= (airDrag + rollingResistance);

  // Acceleration
  const acceleration = longitudinalForce / props.effectiveWeightKg;
  let newSpeedMs = state.speedMs + acceleration * clampedDt;

  // Steering rate with speed-sensitive dampening (higher speed = lower max angle)
  const maxSteerAngle = Math.max(0.2, 0.65 - (Math.abs(newSpeedMs) / 50) * 0.35);
  const targetSteerAngle = inputs.steer * maxSteerAngle;
  const steerRate = 6.0;
  const newSteerAngle = state.steerAngle + (targetSteerAngle - state.steerAngle) * Math.min(1.0, steerRate * clampedDt);

  // Drift & lateral dynamics
  const effectiveGrip = props.gripFactor * surfaceFriction;
  let rearTireSlip = 0;
  let isDrifting = false;

  // Yaw rotation rate
  const wheelbase = 2.7; // 2.7m average wheelbase
  let yawRate = (newSpeedMs / wheelbase) * Math.sin(newSteerAngle);

  // Handbrake oversteer drift initiation
  if (inputs.handbrake && Math.abs(newSpeedMs) > 6.0) {
    rearTireSlip = 1.0;
    isDrifting = true;
    yawRate += Math.sign(inputs.steer || 1) * 1.25;
    newSpeedMs *= (1.0 - clampedDt * 0.8); // handbrake friction
  } else if (Math.abs(state.lateralSpeedMs) > 2.5 && Math.abs(newSpeedMs) > 10.0) {
    isDrifting = true;
    rearTireSlip = Math.min(1.0, Math.abs(state.lateralSpeedMs) / 8.0);
  }

  // Lateral sliding damping
  const lateralFriction = effectiveGrip * 9.81 * (inputs.handbrake ? 0.35 : 0.85);
  let newLateralSpeedMs = state.lateralSpeedMs - Math.sign(state.lateralSpeedMs) * lateralFriction * clampedDt;
  if (Math.abs(newLateralSpeedMs) < 0.2) newLateralSpeedMs = 0;

  // Update yaw
  const newYaw = state.yaw + yawRate * clampedDt;

  // Compute position delta in world coordinates
  const forwardDx = Math.sin(newYaw) * newSpeedMs * clampedDt;
  const forwardDz = Math.cos(newYaw) * newSpeedMs * clampedDt;
  const lateralDx = Math.cos(newYaw) * newLateralSpeedMs * clampedDt;
  const lateralDz = -Math.sin(newYaw) * newLateralSpeedMs * clampedDt;

  const newX = state.x + forwardDx + lateralDx;
  const newZ = state.z + forwardDz + lateralDz;

  // Suspension weight transfer pitch and roll
  const targetPitch = Math.max(-0.15, Math.min(0.15, -acceleration / 35.0)); // dive when braking, squat on accel
  const targetRoll = Math.max(-0.18, Math.min(0.18, (yawRate * newSpeedMs) / 45.0)); // roll into corner

  const newPitch = state.pitch + (targetPitch - state.pitch) * Math.min(1.0, 10.0 * clampedDt);
  const newRoll = state.roll + (targetRoll - state.roll) * Math.min(1.0, 10.0 * clampedDt);

  // Automatic gear and RPM
  const newGear = updateAutomaticGear(state.gear, state.rpm, newSpeedMs, inputs.reverse);
  const newRpm = calculateEngineRpm(newSpeedMs, newGear, inputs.throttle);

  // Drift slip angle in degrees
  const driftSlipAngle = Math.atan2(Math.abs(newLateralSpeedMs), Math.max(1.0, Math.abs(newSpeedMs))) * (180 / Math.PI);

  return {
    ...state,
    x: newX,
    z: newZ,
    speedMs: newSpeedMs,
    lateralSpeedMs: newLateralSpeedMs,
    yaw: newYaw,
    steerAngle: newSteerAngle,
    rpm: newRpm,
    gear: newGear,
    pitch: newPitch,
    roll: newRoll,
    isDrifting,
    driftSlipAngle,
    wheelSlipRear: rearTireSlip,
    nitroRemaining: newNitroRemaining,
  };
}
