/**
 * Apex Horizon - Procedural Open World Map
 * Multiple Districts: Downtown City, Seaside Highway, Mountain Pass, Airport Stunt Park, Industrial Docks & Pit Lane Repair Bay.
 */

import * as THREE from 'three';
import { WeatherType } from '../../types/game';

export interface WorldEnvironmentRefs {
  scene: THREE.Scene;
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  ambientLight: THREE.AmbientLight;
  skyMesh: THREE.Mesh;
  rainSystem: THREE.Points;
  rainPositions: Float32Array;
  lightningLight: THREE.PointLight;
  roadMaterials: THREE.MeshStandardMaterial[];
  streetlights: THREE.PointLight[];
  speedTrapMarker: THREE.Group;
  driftZoneMarker: THREE.Group;
  stuntJumpMarker: THREE.Group;
  checkpointRings: THREE.Group[];
  repairBayZone: THREE.Group;
}

/**
 * Calculates terrain elevation at any (x, z) coordinate
 */
export function getGroundElevation(x: number, z: number): number {
  // Mountain Pass region (X: -300 to -150, Z: -300 to -100)
  if (x < -140 && z < -80) {
    const distToCenter = Math.hypot(x + 220, z + 200);
    const mountainPeak = Math.max(0, 48 - (distToCenter / 160) * 48);
    // Road cut through mountain
    const roadDist = Math.abs(Math.sin((z + 180) * 0.05) * 35 + (x + 220));
    if (roadDist < 12) {
      return (mountainPeak * 0.45);
    }
    return mountainPeak;
  }

  // Airport stunt ramp (X: 340 to 365, Z: -235 to -205)
  if (x >= 340 && x <= 365 && z >= -235 && z <= -205) {
    const progress = (z - -235) / 30; // 0 to 1
    return Math.max(0, progress * 8.5); // 8.5m high launch ramp!
  }

  // Coastal ocean area (X < -320)
  if (x < -320) {
    return -2.5; // below sea level
  }

  // Default ground elevation
  return 0.0;
}

export function buildOpenWorldMap(scene: THREE.Scene): WorldEnvironmentRefs {
  // 1. Sky Dome with atmospheric shader/gradient
  const skyGeo = new THREE.SphereGeometry(1800, 32, 24);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x336699,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);

  // 2. Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0x90b8f8, 0x303848, 1.2);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.5);
  sunLight.position.set(300, 500, 200);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 1400;
  const d = 160;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  const lightningLight = new THREE.PointLight(0xddeeff, 0, 1200, 1.2);
  lightningLight.position.set(0, 250, 0);
  scene.add(lightningLight);

  // 3. Ground Terrain & Materials
  const terrainGeo = new THREE.PlaneGeometry(1600, 1600, 64, 64);
  terrainGeo.rotateX(-Math.PI / 2);

  // Deform terrain vertices with mountain elevation
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    posAttr.setY(i, getGroundElevation(vx, vz));
  }
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x242a35,
    roughness: 0.9,
    metalness: 0.1,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // Ocean Water Plane (West Coast)
  const oceanGeo = new THREE.PlaneGeometry(600, 1600);
  oceanGeo.rotateX(-Math.PI / 2);
  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x092b47,
    roughness: 0.15,
    metalness: 0.85,
    transparent: true,
    opacity: 0.88,
  });
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.position.set(-520, -0.6, 0);
  scene.add(oceanMesh);

  // 4. Roads System & Road Materials
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    roughness: 0.65,
    metalness: 0.15,
  });
  const roadMaterials = [roadMat];

  const roadLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xffbb00 });

  // Function to place a road segment with striping
  const createRoadStrip = (x: number, z: number, length: number, width: number, rotY = 0) => {
    const roadGroup = new THREE.Group();
    roadGroup.position.set(x, 0.03, z);
    roadGroup.rotation.y = rotY;

    // Asphalt surface
    const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(width, length), roadMat);
    asphalt.rotateX(-Math.PI / 2);
    asphalt.receiveShadow = true;
    roadGroup.add(asphalt);

    // Center dashed divider
    const dashCount = Math.floor(length / 8);
    for (let i = 0; i < dashCount; i++) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 4.0), yellowLineMat);
      dash.rotateX(-Math.PI / 2);
      dash.position.set(0, 0.01, -length / 2 + i * 8 + 4);
      roadGroup.add(dash);
    }

    // Curbs
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
    const curbL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, length), curbMat);
    curbL.position.set(-width / 2 - 0.25, 0.1, 0);
    const curbR = curbL.clone();
    curbR.position.x = width / 2 + 0.25;
    roadGroup.add(curbL, curbR);

    scene.add(roadGroup);
  };

  // Main Highway (North-South Eastern Arterial)
  createRoadStrip(280, 0, 900, 24, 0);
  // Central Avenue (East-West)
  createRoadStrip(0, 0, 700, 20, Math.PI / 2);
  // Coastal Scenic Highway
  createRoadStrip(-260, 0, 850, 18, 0);
  // Airport Access Boulevard
  createRoadStrip(200, -220, 400, 18, Math.PI / 4);

  // 5. Districts & Buildings
  // District A: Downtown City Skyscraper Blocks (around X: -80 to 120, Z: -120 to 120)
  const buildingMatA = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.35, metalness: 0.75 });
  const buildingMatB = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.25, metalness: 0.85 });
  const windowEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x0099bb,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });

  const skyscraperConfigs = [
    { x: -60, z: -60, w: 32, h: 140, d: 32 },
    { x: 50, z: -50, w: 40, h: 190, d: 36 },
    { x: -50, z: 60, w: 34, h: 160, d: 30 },
    { x: 60, z: 60, w: 36, h: 220, d: 42 },
    { x: 130, z: -60, w: 28, h: 110, d: 28 },
    { x: 130, z: 50, w: 30, h: 130, d: 30 },
    { x: -130, z: -40, w: 30, h: 115, d: 28 },
    { x: -130, z: 60, w: 35, h: 95, d: 32 },
  ];

  skyscraperConfigs.forEach((cfg, idx) => {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(cfg.x, cfg.h / 2, cfg.z);

    const bMat = idx % 2 === 0 ? buildingMatA : buildingMatB;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d), bMat);
    tower.castShadow = true;
    tower.receiveShadow = true;
    towerGroup.add(tower);

    // Glowing architectural roof beacon
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(cfg.w * 0.4, 6, cfg.d * 0.4), windowEmissiveMat);
    beacon.position.y = cfg.h / 2 + 3;
    towerGroup.add(beacon);

    scene.add(towerGroup);
  });

  // District B: Airport & Stunt Park (X: 300 to 500, Z: -400 to -150)
  // Runway
  const runwayGeo = new THREE.PlaneGeometry(60, 450);
  runwayGeo.rotateX(-Math.PI / 2);
  const runwayMat = new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.8 });
  const runwayMesh = new THREE.Mesh(runwayGeo, runwayMat);
  runwayMesh.position.set(350, 0.05, -220);
  runwayMesh.receiveShadow = true;
  scene.add(runwayMesh);

  // Stunt Mega Launch Ramp (X: 350, Z: -220)
  const rampGroup = new THREE.Group();
  rampGroup.position.set(350, 0, -220);

  const rampMat = new THREE.MeshStandardMaterial({
    color: 0xff3355,
    roughness: 0.4,
    metalness: 0.6,
  });
  const rampMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 8.5, 30), rampMat);
  rampMesh.position.set(0, 4.25, 0);
  rampMesh.rotation.x = 0.28; // tilted launch ramp
  rampMesh.castShadow = true;
  rampGroup.add(rampMesh);

  // Mega Neon Jump Arch
  const archGeo = new THREE.TorusGeometry(12, 1.2, 12, 24, Math.PI);
  const archMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const archMesh = new THREE.Mesh(archGeo, archMat);
  archMesh.position.set(0, 10, 15);
  archMesh.rotation.y = Math.PI / 2;
  rampGroup.add(archMesh);
  scene.add(rampGroup);

  // District C: Industrial Port Docks & Shipping Containers (X: 80 to 220, Z: 200 to 350)
  const containerColors = [0xdd3322, 0x2266cc, 0xee9900, 0x228833];
  for (let i = 0; i < 20; i++) {
    const col = containerColors[i % containerColors.length];
    const cMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, metalness: 0.4 });
    const cont = new THREE.Mesh(new THREE.BoxGeometry(5, 4.5, 12), cMat);
    cont.position.set(120 + (i % 5) * 8, 2.25, 230 + Math.floor(i / 5) * 16);
    cont.castShadow = true;
    cont.receiveShadow = true;
    scene.add(cont);
  }

  // -------------------------------------------------------------
  // FORZA HORIZON 2 - MEDITERRANEAN COAST & FESTIVAL EXPANSION
  // -------------------------------------------------------------

  // 1. Horizon Festival Main Entrance Arch (X: 280, Z: -260 across highway)
  const festivalArchGroup = new THREE.Group();
  festivalArchGroup.position.set(280, 0, -260);

  const trussMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
  const festivalPinkMat = new THREE.MeshBasicMaterial({ color: 0xff0066 });
  const festivalCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const festivalYellowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

  // Main Crossbeam Arch
  const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(32, 1.6, 2.4), trussMat);
  crossBeam.position.set(0, 10.5, 0);
  festivalArchGroup.add(crossBeam);

  // Pillar Towers L & R
  const towerGeo = new THREE.BoxGeometry(2.4, 11, 2.4);
  const pillarL = new THREE.Mesh(towerGeo, trussMat);
  pillarL.position.set(-15, 5.5, 0);
  const pillarR = pillarL.clone();
  pillarR.position.x = 15;
  festivalArchGroup.add(pillarL, pillarR);

  // Glowing "HORIZON FESTIVAL" Center Billboard
  const horizonSignMat = new THREE.MeshStandardMaterial({
    color: 0xff0055,
    emissive: 0xff0066,
    emissiveIntensity: 1.5,
  });
  const horizonSign = new THREE.Mesh(new THREE.BoxGeometry(16, 2.8, 0.4), horizonSignMat);
  horizonSign.position.set(0, 11, 1.25);
  festivalArchGroup.add(horizonSign);

  // Multi-colored Festival Banners
  for (let b = -12; b <= 12; b += 4) {
    const bannerColor = b % 8 === 0 ? festivalPinkMat : b % 6 === 0 ? festivalCyanMat : festivalYellowMat;
    const banner = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 0.1), bannerColor);
    banner.position.set(b, 7.8, 1.1);
    festivalArchGroup.add(banner);
  }
  scene.add(festivalArchGroup);

  // 2. Highway Coastal Mountain Tunnel (Interstate 99: Z = 160 to 280)
  const tunnelGroup = new THREE.Group();
  tunnelGroup.position.set(280, 0, 220);

  const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x2b303c, roughness: 0.8 });
  const tunnelRoof = new THREE.Mesh(new THREE.BoxGeometry(28, 1.5, 120), tunnelMat);
  tunnelRoof.position.set(0, 9.5, 0);
  const tunnelWallL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 9.5, 120), tunnelMat);
  tunnelWallL.position.set(-14, 4.75, 0);
  const tunnelWallR = tunnelWallL.clone();
  tunnelWallR.position.x = 14;
  tunnelGroup.add(tunnelRoof, tunnelWallL, tunnelWallR);

  // Tunnel Interior Orange Sodium Tube Lights
  const sodiumTubeMat = new THREE.MeshBasicMaterial({ color: 0xff9922 });
  for (let tz = -50; tz <= 50; tz += 25) {
    const tubeL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 8), sodiumTubeMat);
    tubeL.position.set(-12, 9.2, tz);
    const tubeR = tubeL.clone();
    tubeR.position.x = 12;
    tunnelGroup.add(tubeL, tubeR);

    const tunnelLight = new THREE.PointLight(0xffaa33, 1.8, 30, 1.4);
    tunnelLight.position.set(0, 8.5, tz);
    tunnelGroup.add(tunnelLight);
  }
  scene.add(tunnelGroup);

  // 3. Mediterranean Villas with Terracotta Roofs along coastal hills (X: -210 to -170, Z: -250 to -50)
  const villaWallMat = new THREE.MeshStandardMaterial({ color: 0xe8dcbe, roughness: 0.7 }); // Tuscan limestone
  const terracottaMat = new THREE.MeshStandardMaterial({ color: 0xb84b28, roughness: 0.6 }); // Terracotta tile roof

  const villaCoords = [
    { x: -200, z: -230, scale: 1.2 },
    { x: -180, z: -170, scale: 1.0 },
    { x: -210, z: -110, scale: 1.3 },
    { x: -190, z: -40, scale: 1.1 },
    { x: -175, z: 40, scale: 1.2 },
  ];

  villaCoords.forEach((v) => {
    const villa = new THREE.Group();
    const groundH = getGroundElevation(v.x, v.z);
    villa.position.set(v.x, groundH, v.z);

    // Villa Main House
    const house = new THREE.Mesh(new THREE.BoxGeometry(14 * v.scale, 8 * v.scale, 10 * v.scale), villaWallMat);
    house.position.y = (4 * v.scale);
    house.castShadow = true;
    house.receiveShadow = true;
    villa.add(house);

    // Terracotta Hipped Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(11 * v.scale, 4.5 * v.scale, 4), terracottaMat);
    roof.position.y = (8 * v.scale) + (2.25 * v.scale);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    villa.add(roof);

    // Pergola / Balcony
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(6 * v.scale, 0.4, 3 * v.scale), villaWallMat);
    balcony.position.set(0, 5 * v.scale, 5.5 * v.scale);
    villa.add(balcony);

    scene.add(villa);
  });

  // 4. Mediterranean Cypress Trees along Coastal Highway and Boulevard
  const cypressTrunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
  const cypressFoliageMat = new THREE.MeshStandardMaterial({ color: 0x1e3f20, roughness: 0.85 }); // deep Mediterranean pine green

  for (let cz = -350; cz <= 350; cz += 32) {
    // Coastal Highway Cypress row (X: -276)
    const treeGroup = new THREE.Group();
    const treeY = getGroundElevation(-276, cz);
    treeGroup.position.set(-276, treeY, cz);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 4), cypressTrunkMat);
    trunk.position.y = 2;
    trunk.castShadow = true;

    // Slender Italian Cypress Cone
    const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.6, 12, 8), cypressFoliageMat);
    foliage.position.y = 9;
    foliage.castShadow = true;

    treeGroup.add(trunk, foliage);
    scene.add(treeGroup);
  }

  // 5. Luxury Yachts in the Riviera Coastline Bay (X < -340)
  const yachtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1 });
  const teakWoodMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.7 });
  const mastMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8 });

  const yachtSpots = [
    { x: -390, z: -150, rotY: 0.4 },
    { x: -440, z: -40, rotY: -0.2 },
    { x: -410, z: 80, rotY: 0.8 },
    { x: -470, z: 180, rotY: 0.1 },
  ];

  yachtSpots.forEach((spot) => {
    const yacht = new THREE.Group();
    yacht.position.set(spot.x, -0.6, spot.z);
    yacht.rotation.y = spot.rotY;

    // Yacht Hull
    const hull = new THREE.Mesh(new THREE.BoxGeometry(8, 3.2, 24), yachtMat);
    hull.position.y = 1.2;
    hull.castShadow = true;
    yacht.add(hull);

    // Teak Wood Deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.2, 23.6), teakWoodMat);
    deck.position.y = 2.85;
    yacht.add(deck);

    // Cabin Bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.0, 11), yachtMat);
    bridge.position.set(0, 4.4, -1);
    bridge.castShadow = true;
    yacht.add(bridge);

    // Radar Mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8), mastMat);
    mast.position.set(0, 9.8, -2);
    yacht.add(mast);

    scene.add(yacht);
  });

  // District D: Pit Lane & Quick Repair Station Bay (X: 180, Z: 30)
  const repairBayZone = new THREE.Group();
  repairBayZone.position.set(180, 0, 30);

  const bayPadGeo = new THREE.PlaneGeometry(16, 26);
  bayPadGeo.rotateX(-Math.PI / 2);
  const bayPadMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.35 });
  const bayPad = new THREE.Mesh(bayPadGeo, bayPadMat);
  bayPad.position.y = 0.08;
  repairBayZone.add(bayPad);

  // Holographic Repair Ring
  const ringGeo = new THREE.RingGeometry(5.5, 6.2, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = 0.12;
  repairBayZone.add(ringMesh);

  // Canopy Roof & Pit sign
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.6, 28),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 })
  );
  canopy.position.set(0, 6.5, 0);
  canopy.castShadow = true;
  repairBayZone.add(canopy);

  // Canopy Pillars
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 });
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6.5), pillarMat);
  p1.position.set(-8, 3.25, -12);
  const p2 = p1.clone();
  p2.position.set(8, 3.25, -12);
  const p3 = p1.clone();
  p3.position.set(-8, 3.25, 12);
  const p4 = p1.clone();
  p4.position.set(8, 3.25, 12);
  repairBayZone.add(p1, p2, p3, p4);

  scene.add(repairBayZone);

  // 6. Streetlights along roads
  const streetlights: THREE.PointLight[] = [];
  const streetlightMat = new THREE.MeshBasicMaterial({ color: 0xfff0cc });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7 });

  for (let z = -350; z <= 350; z += 70) {
    // East highway poles
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 10), poleMat);
    pole.position.set(295, 5, z);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 1.2), streetlightMat);
    lamp.position.set(293, 10, z);
    scene.add(pole, lamp);

    const light = new THREE.PointLight(0xfff0bb, 2.5, 45, 1.8);
    light.position.set(293, 9.5, z);
    scene.add(light);
    streetlights.push(light);
  }

  // 7. Dynamic Seasonal Challenge In-World Visual Triggers
  // A. Speed Trap Gate (Highway Eastern Straightaway X: 280, Z: 60)
  const speedTrapMarker = new THREE.Group();
  speedTrapMarker.position.set(280, 0, 60);

  const speedGantryGeo = new THREE.BoxGeometry(26, 0.8, 1.2);
  const speedGantry = new THREE.Mesh(
    speedGantryGeo,
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9 })
  );
  speedGantry.position.set(0, 8.5, 0);

  const cameraFlash = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.2, 0.8),
    new THREE.MeshBasicMaterial({ color: 0xff0044 })
  );
  cameraFlash.position.set(0, 8.5, 0.8);
  speedTrapMarker.add(speedGantry, cameraFlash);
  scene.add(speedTrapMarker);

  // B. Mountain Drift Zone Start Gate (X: -240, Z: -180)
  const driftZoneMarker = new THREE.Group();
  driftZoneMarker.position.set(-240, getGroundElevation(-240, -180), -180);

  const driftBannerMat = new THREE.MeshBasicMaterial({ color: 0xff0088 });
  const driftArch = new THREE.Mesh(new THREE.BoxGeometry(20, 1.5, 0.4), driftBannerMat);
  driftArch.position.set(0, 7.5, 0);
  driftZoneMarker.add(driftArch);
  scene.add(driftZoneMarker);

  // C. Airport Stunt Jump Marker (X: 350, Z: -220)
  const stuntJumpMarker = new THREE.Group();
  stuntJumpMarker.position.set(350, 0, -220);
  scene.add(stuntJumpMarker);

  // D. Checkpoint Race Rings (8 neon rings around downtown & port)
  const checkpointCoords = [
    { x: 0, z: -150 },
    { x: 70, z: -80 },
    { x: 120, z: 50 },
    { x: 70, z: 180 },
    { x: -50, z: 140 },
    { x: -110, z: 40 },
    { x: -80, z: -80 },
    { x: -10, z: -120 },
  ];

  const ringGeometry = new THREE.TorusGeometry(5.0, 0.4, 12, 24);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
  const checkpointRings: THREE.Group[] = [];

  checkpointCoords.forEach((coord, i) => {
    const ringGroup = new THREE.Group();
    ringGroup.position.set(coord.x, 3.5, coord.z);
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ringGroup.add(ring);
    scene.add(ringGroup);
    checkpointRings.push(ringGroup);
  });

  // 8. Rain Particles System (Pooled Buffer)
  const rainCount = 1800;
  const rainGeo = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);

  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3 + 0] = (Math.random() - 0.5) * 350;
    rainPositions[i * 3 + 1] = Math.random() * 80;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 350;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

  const rainMat = new THREE.PointsMaterial({
    color: 0xbbddff,
    size: 0.35,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const rainSystem = new THREE.Points(rainGeo, rainMat);
  scene.add(rainSystem);

  return {
    scene,
    sunLight,
    hemiLight,
    ambientLight,
    skyMesh,
    rainSystem,
    rainPositions,
    lightningLight,
    roadMaterials,
    streetlights,
    speedTrapMarker,
    driftZoneMarker,
    stuntJumpMarker,
    checkpointRings,
    repairBayZone,
  };
}

/**
 * Updates dynamic day-night cycle, sun position, sky colors, and weather effects
 */
export function updateWorldEnvironment(
  refs: WorldEnvironmentRefs,
  timeOfDayHours: number, // 0 to 24
  weather: WeatherType,
  playerX: number,
  playerZ: number,
  dt: number
) {
  // 1. Sun & Moon orbital trajectory
  const sunAngle = ((timeOfDayHours - 6) / 24) * Math.PI * 2;
  const sunDistance = 800;
  const sunX = Math.cos(sunAngle) * sunDistance;
  const sunY = Math.sin(sunAngle) * sunDistance;
  const sunZ = Math.sin(sunAngle * 0.5) * 200;

  refs.sunLight.position.set(playerX + sunX, Math.max(10, sunY), playerZ + sunZ);

  // Time of day color blending
  const isNight = timeOfDayHours < 5.5 || timeOfDayHours > 20.0;
  const isSunset = (timeOfDayHours >= 17.5 && timeOfDayHours <= 20.0) || (timeOfDayHours >= 5.5 && timeOfDayHours <= 7.0);

  const skyMat = refs.skyMesh.material as THREE.MeshBasicMaterial;

  if (isNight) {
    // Midnight Blue
    skyMat.color.setHex(0x060914);
    refs.hemiLight.color.setHex(0x18223c);
    refs.hemiLight.groundColor.setHex(0x0a0e1a);
    refs.sunLight.intensity = 0.2;
    refs.sunLight.color.setHex(0x8899cc);
    refs.ambientLight.intensity = 0.25;
  } else if (isSunset) {
    // Golden Hour / Sunset
    skyMat.color.setHex(0x9a3b26);
    refs.hemiLight.color.setHex(0xff7744);
    refs.hemiLight.groundColor.setHex(0x2a1420);
    refs.sunLight.intensity = 2.2;
    refs.sunLight.color.setHex(0xffaa55);
    refs.ambientLight.intensity = 0.45;
  } else {
    // Bright Daylight
    skyMat.color.setHex(0x3878b4);
    refs.hemiLight.color.setHex(0xb5d8ff);
    refs.hemiLight.groundColor.setHex(0x2d3440);
    refs.sunLight.intensity = 2.8;
    refs.sunLight.color.setHex(0xfffaea);
    refs.ambientLight.intensity = 0.5;
  }

  // Streetlights power on during night or sunset
  const streetlightsOn = isNight || isSunset || weather === 'storm';
  refs.streetlights.forEach((light) => {
    light.visible = streetlightsOn;
  });

  // 2. Weather Dynamics
  const isWet = weather === 'rain' || weather === 'storm';

  // Wet road specular reflection (darkens and makes glossy)
  refs.roadMaterials.forEach((mat) => {
    if (isWet) {
      mat.roughness = 0.18; // slick wet asphalt
      mat.metalness = 0.45;
      mat.color.setHex(0x0a0c10);
    } else {
      mat.roughness = 0.65;
      mat.metalness = 0.15;
      mat.color.setHex(0x181a1f);
    }
  });

  // Rain Particles
  const rainMat = refs.rainSystem.material as THREE.PointsMaterial;
  if (isWet) {
    rainMat.opacity = weather === 'storm' ? 0.85 : 0.55;
    const pos = refs.rainPositions;
    const count = pos.length / 3;

    // Center rain box around player
    refs.rainSystem.position.set(playerX, 0, playerZ);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= 95 * dt; // fall speed
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 65 + Math.random() * 20;
      }
    }
    refs.rainSystem.geometry.attributes.position.needsUpdate = true;

    // Storm lightning flashes
    if (weather === 'storm' && Math.random() < 0.008) {
      refs.lightningLight.intensity = 8.0;
      setTimeout(() => {
        refs.lightningLight.intensity = 0;
      }, 70);
    }
  } else {
    rainMat.opacity = 0;
  }

  // Rotate checkpoint rings
  refs.checkpointRings.forEach((ringGroup, idx) => {
    ringGroup.rotation.y += (0.8 + idx * 0.1) * dt;
  });
}
