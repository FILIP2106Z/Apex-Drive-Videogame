/**
 * Apex Horizon - AI Traffic System
 * Spawns and manages autonomous AI vehicles along open world road circuits and highway lanes.
 */

import * as THREE from 'three';

export interface TrafficWaypoint {
  x: number;
  z: number;
  speedLimitMs: number;
}

export interface TrafficRoute {
  id: string;
  name: string;
  waypoints: TrafficWaypoint[];
  isLoop: boolean;
}

export interface TrafficCar {
  id: string;
  modelType: 'sedan' | 'suv' | 'coupe' | 'cab';
  color: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speedMs: number;
  targetSpeedMs: number;
  routeId: string;
  waypointIndex: number;
  meshGroup: THREE.Group;
  wheelSpinNodes: THREE.Mesh[];
  headlightSpot?: THREE.SpotLight;
  taillightMat?: THREE.MeshStandardMaterial;
  width: number;
  length: number;
  braking: boolean;
}

// Pre-defined traffic routes around highway, central avenue, and coastal highway
export const TRAFFIC_ROUTES: TrafficRoute[] = [
  // Highway Northbound Lane (Right lane, X: 286, moving North from Z: -400 to +400)
  {
    id: 'highway_north',
    name: 'Interstate 99 Northbound',
    isLoop: false,
    waypoints: [
      { x: 286, z: -420, speedLimitMs: 28 },
      { x: 286, z: -200, speedLimitMs: 32 },
      { x: 286, z: 0, speedLimitMs: 34 },
      { x: 286, z: 200, speedLimitMs: 32 },
      { x: 286, z: 420, speedLimitMs: 28 },
    ],
  },
  // Highway Southbound Lane (Left lane, X: 274, moving South from Z: +400 to -400)
  {
    id: 'highway_south',
    name: 'Interstate 99 Southbound',
    isLoop: false,
    waypoints: [
      { x: 274, z: 420, speedLimitMs: 30 },
      { x: 274, z: 200, speedLimitMs: 34 },
      { x: 274, z: 0, speedLimitMs: 32 },
      { x: 274, z: -200, speedLimitMs: 30 },
      { x: 274, z: -420, speedLimitMs: 28 },
    ],
  },
  // Coastal Scenic Boulevard (X: -260, moving Z: -350 to +350)
  {
    id: 'coastal_north',
    name: 'Riviera Coast North',
    isLoop: false,
    waypoints: [
      { x: -264, z: -380, speedLimitMs: 22 },
      { x: -264, z: -150, speedLimitMs: 24 },
      { x: -264, z: 100, speedLimitMs: 22 },
      { x: -264, z: 380, speedLimitMs: 20 },
    ],
  },
  // Central Avenue Loop (East-West across downtown)
  {
    id: 'central_avenue_loop',
    name: 'Downtown Horizon Avenue Loop',
    isLoop: true,
    waypoints: [
      { x: -180, z: -4, speedLimitMs: 18 },
      { x: -60, z: -4, speedLimitMs: 20 },
      { x: 60, z: -4, speedLimitMs: 20 },
      { x: 180, z: -4, speedLimitMs: 22 },
      { x: 220, z: 10, speedLimitMs: 16 },
      { x: 180, z: 4, speedLimitMs: 22 },
      { x: 60, z: 4, speedLimitMs: 20 },
      { x: -60, z: 4, speedLimitMs: 20 },
      { x: -180, z: 4, speedLimitMs: 18 },
      { x: -210, z: -2, speedLimitMs: 16 },
    ],
  },
];

/**
 * Pure calculation to advance a traffic car along its route
 */
export function stepTrafficCar(
  car: {
    x: number;
    z: number;
    yaw: number;
    speedMs: number;
    targetSpeedMs: number;
    waypointIndex: number;
  },
  route: TrafficRoute,
  otherObstacles: Array<{ x: number; z: number; width: number; length: number; speedMs: number }>,
  dt: number
): {
  x: number;
  z: number;
  yaw: number;
  speedMs: number;
  waypointIndex: number;
  braking: boolean;
  respawnNeeded: boolean;
} {
  const currentWaypoint = route.waypoints[car.waypointIndex];
  if (!currentWaypoint) {
    return { ...car, braking: false, respawnNeeded: true };
  }

  const dx = currentWaypoint.x - car.x;
  const dz = currentWaypoint.z - car.z;
  const distToTarget = Math.hypot(dx, dz);

  let newWaypointIndex = car.waypointIndex;
  let respawnNeeded = false;

  // Waypoint arrival threshold
  if (distToTarget < 6.0) {
    if (car.waypointIndex < route.waypoints.length - 1) {
      newWaypointIndex = car.waypointIndex + 1;
    } else if (route.isLoop) {
      newWaypointIndex = 0;
    } else {
      respawnNeeded = true;
    }
  }

  // Calculate desired heading toward next waypoint
  const targetYaw = Math.atan2(dx, dz);
  let deltaYaw = targetYaw - car.yaw;
  while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
  while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;

  const steerRate = 2.5;
  const newYaw = car.yaw + Math.sign(deltaYaw) * Math.min(Math.abs(deltaYaw), steerRate * dt);

  // Forward obstacle detection (look ahead 25m)
  let braking = false;
  let desiredSpeed = currentWaypoint.speedLimitMs;

  for (const obs of otherObstacles) {
    const ox = obs.x - car.x;
    const oz = obs.z - car.z;
    // Project into car's local forward coordinates
    const forwardDist = Math.sin(newYaw) * ox + Math.cos(newYaw) * oz;
    const lateralDist = Math.abs(Math.cos(newYaw) * ox - Math.sin(newYaw) * oz);

    if (forwardDist > 0.5 && forwardDist < 24.0 && lateralDist < 3.2) {
      braking = true;
      desiredSpeed = Math.min(desiredSpeed, Math.max(0, obs.speedMs - 2.0));
      if (forwardDist < 8.0) desiredSpeed = 0; // complete stop
    }
  }

  // Accelerate or brake toward desired speed
  let newSpeed = car.speedMs;
  if (car.speedMs < desiredSpeed) {
    newSpeed = Math.min(desiredSpeed, car.speedMs + 6.0 * dt);
  } else if (car.speedMs > desiredSpeed) {
    newSpeed = Math.max(desiredSpeed, car.speedMs - (braking ? 18.0 : 8.0) * dt);
  }

  const moveX = Math.sin(newYaw) * newSpeed * dt;
  const moveZ = Math.cos(newYaw) * newSpeed * dt;

  return {
    x: car.x + moveX,
    z: car.z + moveZ,
    yaw: newYaw,
    speedMs: newSpeed,
    waypointIndex: newWaypointIndex,
    braking,
    respawnNeeded,
  };
}

/**
 * Builds composite 3D mesh for an AI traffic vehicle
 */
export function createTrafficVehicleMesh(modelType: 'sedan' | 'suv' | 'coupe' | 'cab', color: number): {
  meshGroup: THREE.Group;
  wheelSpinNodes: THREE.Mesh[];
  taillightMat: THREE.MeshStandardMaterial;
  headlightSpot?: THREE.SpotLight;
} {
  const group = new THREE.Group();
  group.name = 'TrafficCar_' + modelType;

  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.65,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x111622,
    roughness: 0.1,
    metalness: 0.8,
  });

  const bumperMat = new THREE.MeshStandardMaterial({
    color: 0x22262e,
    roughness: 0.8,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18191d,
    roughness: 0.9,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.3,
    metalness: 0.8,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffeeaa,
    emissiveIntensity: 1.2,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xcc1122,
    emissive: 0xff0022,
    emissiveIntensity: 0.8,
  });

  let bodyW = 1.85;
  let bodyH = 0.55;
  let bodyL = 4.2;
  let cabinH = 0.55;

  if (modelType === 'suv') {
    bodyW = 2.0;
    bodyH = 0.75;
    bodyL = 4.5;
    cabinH = 0.7;
  } else if (modelType === 'cab') {
    bodyW = 1.9;
    bodyH = 0.58;
    bodyL = 4.3;
  }

  // 1. Main Chassis
  const chassisMesh = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyL), bodyMat);
  chassisMesh.position.y = 0.5 + bodyH / 2;
  chassisMesh.castShadow = true;
  group.add(chassisMesh);

  // 2. Cabin
  const cabinMesh = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.88, cabinH, bodyL * 0.55), glassMat);
  cabinMesh.position.set(0, 0.5 + bodyH + cabinH / 2, -0.1);
  cabinMesh.castShadow = true;
  group.add(cabinMesh);

  // 3. Cabin Roof
  const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.84, 0.08, bodyL * 0.5), bodyMat);
  roofMesh.position.set(0, 0.5 + bodyH + cabinH + 0.04, -0.1);
  group.add(roofMesh);

  // Taxi Sign on top if cab
  if (modelType === 'cab') {
    const taxiSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.2, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff9900, emissiveIntensity: 0.6 })
    );
    taxiSign.position.set(0, 0.5 + bodyH + cabinH + 0.18, -0.1);
    group.add(taxiSign);
  }

  // 4. Bumpers
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.98, 0.3, 0.35), bumperMat);
  frontBumper.position.set(0, 0.5, bodyL / 2 + 0.15);
  const rearBumper = frontBumper.clone();
  rearBumper.position.z = -bodyL / 2 - 0.15;
  group.add(frontBumper, rearBumper);

  // 5. Headlights & Taillights
  const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), headlightMat);
  hlL.position.set(-bodyW / 2 + 0.25, 0.65, bodyL / 2 + 0.05);
  const hlR = hlL.clone();
  hlR.position.x = bodyW / 2 - 0.25;

  const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.1), taillightMat);
  tlL.position.set(-bodyW / 2 + 0.25, 0.7, -bodyL / 2 - 0.05);
  const tlR = tlL.clone();
  tlR.position.x = bodyW / 2 - 0.25;

  group.add(hlL, hlR, tlL, tlR);

  // 6. Wheels (4 distinct)
  const wheelSpinNodes: THREE.Mesh[] = [];
  const wheelRadius = 0.34;
  const wheelWidth = 0.22;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  const wheelPositions = [
    { x: -bodyW / 2 - 0.05, z: bodyL * 0.32 },
    { x: bodyW / 2 + 0.05, z: bodyL * 0.32 },
    { x: -bodyW / 2 - 0.05, z: -bodyL * 0.32 },
    { x: bodyW / 2 + 0.05, z: -bodyL * 0.32 },
  ];

  wheelPositions.forEach((pos) => {
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.position.set(pos.x, wheelRadius, pos.z);
    wheel.castShadow = true;

    // Rim inner cap
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius * 0.68, wheelRadius * 0.68, wheelWidth * 1.02, 12),
      rimMat
    );
    rim.rotateZ(Math.PI / 2);
    wheel.add(rim);

    group.add(wheel);
    wheelSpinNodes.push(wheel);
  });

  // Soft contact shadow disc under traffic car
  const shadowGeo = new THREE.PlaneGeometry(bodyW * 1.2, bodyL * 1.15);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.03;
  group.add(shadowMesh);

  return {
    meshGroup: group,
    wheelSpinNodes,
    taillightMat,
  };
}

/**
 * Traffic Manager managing a pool of AI traffic vehicles
 */
export class TrafficManager {
  public trafficCars: TrafficCar[] = [];
  private scene: THREE.Scene;
  private colors = [0x224488, 0x992222, 0x111111, 0xdddddd, 0x336644, 0xddaa22];
  private models: Array<'sedan' | 'suv' | 'coupe' | 'cab'> = ['sedan', 'suv', 'coupe', 'cab'];

  constructor(scene: THREE.Scene, trafficCount = 14) {
    this.scene = scene;
    this.initPool(trafficCount);
  }

  private initPool(count: number) {
    for (let i = 0; i < count; i++) {
      const route = TRAFFIC_ROUTES[i % TRAFFIC_ROUTES.length];
      const model = this.models[i % this.models.length];
      const color = model === 'cab' ? 0xffcc00 : this.colors[i % this.colors.length];

      const meshData = createTrafficVehicleMesh(model, color);

      // Start distributed along the route waypoints
      const startWaypointIndex = Math.min(route.waypoints.length - 1, (i * 2) % route.waypoints.length);
      const wp = route.waypoints[startWaypointIndex];

      const nextWp = route.waypoints[Math.min(route.waypoints.length - 1, startWaypointIndex + 1)] || wp;
      const initialYaw = Math.atan2(nextWp.x - wp.x, nextWp.z - wp.z);

      const car: TrafficCar = {
        id: 'traffic_' + i,
        modelType: model,
        color,
        x: wp.x,
        y: 0,
        z: wp.z + (Math.random() - 0.5) * 40,
        yaw: initialYaw,
        speedMs: 16.0 + Math.random() * 8.0,
        targetSpeedMs: wp.speedLimitMs,
        routeId: route.id,
        waypointIndex: startWaypointIndex,
        meshGroup: meshData.meshGroup,
        wheelSpinNodes: meshData.wheelSpinNodes,
        taillightMat: meshData.taillightMat,
        width: 2.1,
        length: 4.5,
        braking: false,
      };

      this.scene.add(car.meshGroup);
      this.trafficCars.push(car);
    }
  }

  public update(playerPos: { x: number; z: number; speedMs: number }, dt: number) {
    // Build obstacle list for AI cars including player
    const playerObstacle = {
      x: playerPos.x,
      z: playerPos.z,
      width: 2.2,
      length: 4.6,
      speedMs: playerPos.speedMs,
    };

    this.trafficCars.forEach((car) => {
      const route = TRAFFIC_ROUTES.find((r) => r.id === car.routeId) || TRAFFIC_ROUTES[0];

      // Other traffic cars within 40m
      const otherObstacles = [playerObstacle];
      for (const other of this.trafficCars) {
        if (other.id !== car.id && Math.hypot(other.x - car.x, other.z - car.z) < 40) {
          otherObstacles.push({
            x: other.x,
            z: other.z,
            width: other.width,
            length: other.length,
            speedMs: other.speedMs,
          });
        }
      }

      const next = stepTrafficCar(car, route, otherObstacles, dt);

      if (next.respawnNeeded) {
        // Respawn at route start
        const firstWp = route.waypoints[0];
        const secondWp = route.waypoints[1] || firstWp;
        car.x = firstWp.x;
        car.z = firstWp.z;
        car.yaw = Math.atan2(secondWp.x - firstWp.x, secondWp.z - firstWp.z);
        car.speedMs = 18.0;
        car.waypointIndex = 0;
      } else {
        car.x = next.x;
        car.z = next.z;
        car.yaw = next.yaw;
        car.speedMs = next.speedMs;
        car.waypointIndex = next.waypointIndex;
        car.braking = next.braking;
      }

      // Update 3D mesh transforms
      car.meshGroup.position.set(car.x, 0, car.z);
      car.meshGroup.rotation.y = car.yaw;

      // Spin wheels
      const wheelAngularVel = (car.speedMs / 0.34) * dt;
      car.wheelSpinNodes.forEach((node) => {
        node.rotation.x += wheelAngularVel;
      });

      // Brake light glow
      if (car.taillightMat) {
        car.taillightMat.emissiveIntensity = car.braking ? 3.0 : 0.8;
      }
    });
  }

  /**
   * Check collision between player car and any AI traffic car
   */
  public checkPlayerCollision(player: { x: number; z: number; speedMs: number }): TrafficCar | null {
    for (const car of this.trafficCars) {
      const dist = Math.hypot(player.x - car.x, player.z - car.z);
      if (dist < 3.2) {
        return car;
      }
    }
    return null;
  }

  public dispose() {
    for (const car of this.trafficCars) {
      this.scene.remove(car.meshGroup);
    }
    this.trafficCars = [];
  }
}
