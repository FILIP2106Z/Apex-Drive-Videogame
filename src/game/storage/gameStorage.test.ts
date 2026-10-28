import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultProfile,
  exportProfileToSyncCode,
  importProfileFromSyncCode,
  DEFAULT_GRAPHICS,
  DEFAULT_CONTROLS,
} from './gameStorage';

test('createDefaultProfile provides all required vehicles and default data', () => {
  const profile = createDefaultProfile();
  assert.ok(profile.playerName.startsWith('Racer #'));
  assert.equal(profile.credits, 25000);
  assert.equal(profile.currentVehicleId, 'apex_gtr');
  assert.ok(profile.ownedVehicles.includes('apex_gtr'));
  assert.ok(profile.customizations.apex_gtr.bodyColor);
  assert.ok(profile.upgrades.apex_gtr);
});

test('exportProfileToSyncCode and importProfileFromSyncCode serialize and restore accurately', () => {
  const profile = createDefaultProfile();
  profile.playerName = 'SpeedDemon99';
  profile.credits = 150000;
  profile.ownedVehicles.push('venom_v10');

  const syncCode = exportProfileToSyncCode(profile);
  assert.ok(syncCode.startsWith('APEXSYNC::'));

  const result = importProfileFromSyncCode(syncCode);
  assert.equal(result.success, true);
  assert.ok(result.profile);
  assert.equal(result.profile?.playerName, 'SpeedDemon99');
  assert.equal(result.profile?.credits, 150000);
  assert.ok(result.profile?.ownedVehicles.includes('venom_v10'));
});

test('importProfileFromSyncCode rejects invalid codes gracefully', () => {
  const invalid = importProfileFromSyncCode('NOT_A_VALID_CODE');
  assert.equal(invalid.success, false);
  assert.ok(invalid.error);
});

test('default graphics and controls are fully configured', () => {
  assert.equal(DEFAULT_GRAPHICS.preset, 'ultra');
  assert.equal(DEFAULT_GRAPHICS.rayTracingReflections, true);
  assert.equal(DEFAULT_CONTROLS.throttle, 'KeyW');
  assert.equal(DEFAULT_CONTROLS.brake, 'KeyS');
});
