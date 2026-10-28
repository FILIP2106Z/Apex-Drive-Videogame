import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePerformance,
  calculateEngineRpm,
  updateAutomaticGear,
  calculateCollisionDamage,
  stepVehiclePhysics,
  VEHICLE_DATABASE,
  VehiclePhysicsState,
  VehiclePhysicsInputs,
} from './vehiclePhysics';

test('calculatePerformance scales with upgrades', () => {
  const baseSpec = VEHICLE_DATABASE.apex_gtr;
  const stockPerf = calculatePerformance(baseSpec);
  const upgradedPerf = calculatePerformance(baseSpec, {
    engineStage: 3,
    forcedInduction: 'twin_turbo',
    transmissionStage: 2,
    suspensionStage: 2,
    brakeStage: 2,
    tireCompound: 'semi_slick',
  });

  assert.ok(upgradedPerf.effectiveHorsepower > stockPerf.effectiveHorsepower);
  assert.ok(upgradedPerf.topSpeedMs > stockPerf.topSpeedMs);
  assert.ok(upgradedPerf.gripFactor > stockPerf.gripFactor);
  assert.ok(upgradedPerf.brakingPower > stockPerf.brakingPower);
});

test('calculateEngineRpm responds to speed and throttle', () => {
  const idleRpm = calculateEngineRpm(0, 1, 0);
  assert.ok(idleRpm >= 900 && idleRpm <= 1000);

  const highSpeedRpm = calculateEngineRpm(30, 3, 1.0);
  assert.ok(highSpeedRpm > 2500 && highSpeedRpm <= 8200);
});

test('updateAutomaticGear upshifts and downshifts correctly', () => {
  // Upshift when RPM exceeds 7200
  const nextGear = updateAutomaticGear(2, 7500, 25, false);
  assert.equal(nextGear, 3);

  // Downshift when RPM falls below 3200
  const prevGear = updateAutomaticGear(3, 2800, 20, false);
  assert.equal(prevGear, 2);

  // Reverse gear when reverse requested at stop
  const revGear = updateAutomaticGear(1, 1000, 0, true);
  assert.equal(revGear, -1);
});

test('calculateCollisionDamage applies damage above threshold', () => {
  const initialDamage = {
    engineHealth: 100,
    bodyIntegrity: 100,
    tireHealth: 100,
    deformationFactor: 0,
  };

  // Low speed impact should not cause damage
  const lowSpeed = calculateCollisionDamage(2.0, initialDamage);
  assert.equal(lowSpeed.newDamage.bodyIntegrity, 100);

  // High speed collision causes damage
  const highSpeed = calculateCollisionDamage(18.0, initialDamage);
  assert.ok(highSpeed.newDamage.bodyIntegrity < 100);
  assert.ok(highSpeed.newDamage.engineHealth < 100);
  assert.ok(highSpeed.newDamage.deformationFactor > 0);
});

test('stepVehiclePhysics accelerates forward on throttle', () => {
  const spec = VEHICLE_DATABASE.apex_gtr;
  const props = calculatePerformance(spec);
  const damage = {
    engineHealth: 100,
    bodyIntegrity: 100,
    tireHealth: 100,
    deformationFactor: 0,
  };

  const initialState: VehiclePhysicsState = {
    x: 0,
    y: 0,
    z: 0,
    speedMs: 0,
    lateralSpeedMs: 0,
    yaw: 0,
    steerAngle: 0,
    rpm: 1000,
    gear: 1,
    pitch: 0,
    roll: 0,
    verticalVelocity: 0,
    isAirborne: false,
    isDrifting: false,
    driftSlipAngle: 0,
    wheelSlipRear: 0,
    nitroRemaining: 100,
  };

  const inputs: VehiclePhysicsInputs = {
    throttle: 1.0,
    brake: 0,
    steer: 0,
    handbrake: false,
    nitro: false,
    reverse: false,
  };

  const nextState = stepVehiclePhysics(initialState, inputs, props, damage, 1.0, 0.05);
  assert.ok(nextState.speedMs > 0);
  assert.ok(nextState.z > 0); // moves forward along yaw=0
});
