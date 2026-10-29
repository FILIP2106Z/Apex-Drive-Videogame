import test from 'node:test';
import assert from 'node:assert/strict';
import { stepTrafficCar, TRAFFIC_ROUTES } from './trafficSystem';

test('stepTrafficCar advances forward towards target waypoint', () => {
  const route = TRAFFIC_ROUTES[0]; // highway_north (x: 286, moving from z: -420 to +420)
  const initialCar = {
    x: 286,
    z: -300,
    yaw: 0,
    speedMs: 25,
    targetSpeedMs: 28,
    waypointIndex: 1, // targeting z: -200
  };

  const next = stepTrafficCar(initialCar, route, [], 0.1);
  assert.ok(next.z > initialCar.z, 'Traffic car should advance in Z direction');
  assert.equal(next.braking, false);
});

test('stepTrafficCar brakes when obstacle is detected directly ahead', () => {
  const route = TRAFFIC_ROUTES[0];
  const car = {
    x: 286,
    z: 0,
    yaw: 0,
    speedMs: 28,
    targetSpeedMs: 30,
    waypointIndex: 3,
  };

  // Obstacle right ahead at 12m
  const obstacles = [
    { x: 286, z: 12, width: 2.0, length: 4.5, speedMs: 5 },
  ];

  const next = stepTrafficCar(car, route, obstacles, 0.1);
  assert.equal(next.braking, true, 'Traffic car should engage brakes for forward obstacle');
  assert.ok(next.speedMs < car.speedMs, 'Traffic car speed should decrease under braking');
});

test('stepTrafficCar detects route termination and signals respawn', () => {
  const nonLoopRoute = TRAFFIC_ROUTES[0]; // non-loop
  const lastIndex = nonLoopRoute.waypoints.length - 1;
  const lastWaypoint = nonLoopRoute.waypoints[lastIndex];

  const car = {
    x: lastWaypoint.x,
    z: lastWaypoint.z - 2, // 2m from end
    yaw: 0,
    speedMs: 20,
    targetSpeedMs: 20,
    waypointIndex: lastIndex,
  };

  const next = stepTrafficCar(car, nonLoopRoute, [], 0.2);
  assert.equal(next.respawnNeeded, true);
});
