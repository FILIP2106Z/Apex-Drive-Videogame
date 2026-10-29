/**
 * Apex Horizon - Procedural 3D Composite Vehicle Models
 * Zero external 3D files. Assembled from 8-15 distinct procedural meshes.
 */

import * as THREE from 'three';
import { VehicleId, VehicleCustomization, VehicleDamage } from '../../types/game';

export interface VehicleMeshRefs {
  group: THREE.Group;
  wheelMeshes: THREE.Group[]; // [FL, FR, RL, RR]
  wheelSpinNodes: THREE.Mesh[]; // inner cylinder nodes to spin
  bodyMaterials: THREE.MeshStandardMaterial[];
  accentMaterials: THREE.MeshStandardMaterial[];
  rimMaterials: THREE.MeshStandardMaterial[];
  spoilerNode: THREE.Group;
  neonLightNode: THREE.PointLight | null;
  neonStrips: THREE.Mesh[];
  headlightNodes: THREE.SpotLight[];
  taillightMaterials: THREE.MeshStandardMaterial[];
  nitroFlames: THREE.Mesh[];
  frontBumperNode: THREE.Mesh | THREE.Group;
  smokeParticles: THREE.Points;
  smokePositions: Float32Array;
  smokeVelocities: Float32Array;
}

export function createProceduralVehicle(
  vehicleId: VehicleId,
  customization: VehicleCustomization
): VehicleMeshRefs {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Vehicle_' + vehicleId;

  // Materials
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: customization.bodyColor,
    roughness: customization.paintFinish === 'matte' ? 0.75 : customization.paintFinish === 'metallic' ? 0.25 : 0.15,
    metalness: customization.paintFinish === 'chrome' ? 0.95 : customization.paintFinish === 'metallic' ? 0.8 : 0.2,
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: customization.accentColor,
    roughness: 0.35,
    metalness: 0.7,
  });

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x111622,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: customization.windowTintOpacity,
    depthWrite: false,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.95,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.45,
    metalness: 0.3,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c1d22,
    roughness: 0.85,
    metalness: 0.05,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: customization.rimColor,
    roughness: 0.25,
    metalness: 0.85,
  });

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xccf0ff,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  });

  const taillightMaterial = new THREE.MeshStandardMaterial({
    color: 0xdd1122,
    emissive: 0xff0022,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  const bodyMaterials = [bodyMaterial];
  const accentMaterials = [accentMaterial];
  const rimMaterials = [rimMaterial];
  const taillightMaterials = [taillightMaterial];

  // Primary Silhouette (Main Body Hull)
  let bodyGeometry: THREE.BufferGeometry;
  let cabinGeometry: THREE.BufferGeometry;
  let cabinW = 1.62;
  let cabinH = 0.46;
  let cabinD = 2.0;
  let groundOffset = 0.35; // height of bottom chassis above ground
  let wheelbaseX = 1.0;
  let wheelbaseZ = 1.35;
  let wheelRadius = 0.35;
  let wheelWidth = 0.26;

  if (vehicleId === 'cavallo_f80') {
    // Scuderia Cavallo (Ferrari-inspired aerodynamic mid-rear hypercar)
    groundOffset = 0.24;
    wheelRadius = 0.35;
    wheelbaseX = 1.06;
    wheelbaseZ = 1.42;
    cabinW = 1.55;
    cabinH = 0.38;
    cabinD = 1.95;
    bodyGeometry = new THREE.BoxGeometry(2.08, 0.42, 4.4);
    cabinGeometry = new THREE.BoxGeometry(cabinW, cabinH, cabinD);
  } else if (vehicleId === 'toro_aventis') {
    // Toro SV-Aventis (Lamborghini-inspired angular wedge stealth)
    groundOffset = 0.22;
    wheelRadius = 0.35;
    wheelbaseX = 1.1;
    wheelbaseZ = 1.44;
    cabinW = 1.6;
    cabinH = 0.36;
    cabinD = 1.85;
    bodyGeometry = new THREE.BoxGeometry(2.14, 0.4, 4.45);
    cabinGeometry = new THREE.BoxGeometry(cabinW, cabinH, cabinD);
  } else if (vehicleId === 'royale_w16') {
    // Royale Chironex (Bugatti-inspired grand tourer with horseshoe grille)
    groundOffset = 0.26;
    wheelRadius = 0.37;
    wheelbaseX = 1.08;
    wheelbaseZ = 1.46;
    cabinW = 1.62;
    cabinH = 0.44;
    cabinD = 2.1;
    bodyGeometry = new THREE.BoxGeometry(2.12, 0.48, 4.5);
    cabinGeometry = new THREE.BoxGeometry(cabinW, cabinH, cabinD);
  } else if (vehicleId === 'brawler_4x4') {
    groundOffset = 0.58;
    wheelRadius = 0.48;
    wheelWidth = 0.34;
    wheelbaseX = 1.15;
    wheelbaseZ = 1.5;
    cabinW = 1.85;
    cabinH = 0.75;
    cabinD = 2.2;
    bodyGeometry = new THREE.BoxGeometry(2.1, 0.7, 4.4);
    cabinGeometry = new THREE.BoxGeometry(cabinW, cabinH, cabinD);
  } else if (vehicleId === 'venom_v10') {
    groundOffset = 0.26;
    wheelRadius = 0.34;
    wheelbaseX = 1.05;
    wheelbaseZ = 1.4;
    cabinW = 1.6;
    cabinH = 0.42;
    cabinD = 1.9;
    bodyGeometry = new THREE.BoxGeometry(2.05, 0.45, 4.3);
    cabinGeometry = new THREE.BoxGeometry(cabinW, cabinH, cabinD);
  } else if (vehicleId === 'phantom_ev') {
    groundOffset = 0.28;
    wheelRadius = 0.35;
    wheelbaseX = 1.02;
    wheelbaseZ = 1.45;
    cabinW = 1.65;
    cabinH = 0.46;
    cabinD = 2.3;
    bodyGeometry = new THREE.BoxGeometry(2.0, 0.48, 4.5);
    cabinGeometry = new THREE.BoxGeometry(cabinW, cabinH, cabinD);
  } else if (vehicleId === 'viper_v8') {
    groundOffset = 0.32;
    wheelRadius = 0.36;
    wheelbaseX = 1.02;
    wheelbaseZ = 1.38;
    cabinW = 1.7;
    cabinH = 0.48;
    cabinD = 1.85;
    bodyGeometry = new THREE.BoxGeometry(2.0, 0.52, 4.35);
    cabinGeometry = new THREE.BoxGeometry(cabinW, cabinH, cabinD);
  } else {
    // Apex GT-R
    bodyGeometry = new THREE.BoxGeometry(1.95, 0.5, 4.25);
    cabinGeometry = new THREE.BoxGeometry(cabinW, cabinH, cabinD);
  }

  // 1. Lower Body Chassis
  const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  bodyMesh.position.y = groundOffset + 0.3;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  rootGroup.add(bodyMesh);

  // 2. Cabin / Glass Greenhouse
  const cabinMesh = new THREE.Mesh(cabinGeometry, windowMaterial);
  cabinMesh.position.set(0, groundOffset + 0.72, vehicleId === 'viper_v8' ? -0.3 : -0.15);
  cabinMesh.castShadow = true;
  rootGroup.add(cabinMesh);

  // Cabin roof
  const roofGeo = new THREE.BoxGeometry(cabinW * 0.94, 0.08, cabinD * 0.9);
  const roofMesh = new THREE.Mesh(roofGeo, bodyMaterial);
  roofMesh.position.copy(cabinMesh.position);
  roofMesh.position.y += cabinH * 0.5 + 0.04;
  roofMesh.castShadow = true;
  rootGroup.add(roofMesh);

  // 3. Front Bumper & Splitter
  const frontBumperGroup = new THREE.Group();
  const bumperGeo = new THREE.BoxGeometry(1.92, 0.32, 0.35);
  const bumperMesh = new THREE.Mesh(bumperGeo, accentMaterial);
  bumperMesh.position.set(0, groundOffset + 0.2, 2.15);
  bumperMesh.castShadow = true;
  frontBumperGroup.add(bumperMesh);

  const splitterGeo = new THREE.BoxGeometry(2.02, 0.06, 0.45);
  const splitterMesh = new THREE.Mesh(splitterGeo, carbonMaterial);
  splitterMesh.position.set(0, groundOffset + 0.05, 2.2);
  splitterMesh.castShadow = true;
  frontBumperGroup.add(splitterMesh);
  rootGroup.add(frontBumperGroup);

  // 4. Rear Diffuser & Bumper
  const rearDiffuserGeo = new THREE.BoxGeometry(1.92, 0.28, 0.4);
  const rearDiffuser = new THREE.Mesh(rearDiffuserGeo, carbonMaterial);
  rearDiffuser.position.set(0, groundOffset + 0.16, -2.15);
  rearDiffuser.castShadow = true;
  rootGroup.add(rearDiffuser);

  // 5. Headlights
  const headlightL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.15), headlightMaterial);
  headlightL.position.set(-0.68, groundOffset + 0.38, 2.15);
  const headlightR = headlightL.clone();
  headlightR.position.x = 0.68;
  rootGroup.add(headlightL);
  rootGroup.add(headlightR);

  // 6. Taillights
  const taillightL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.15), taillightMaterial);
  taillightL.position.set(-0.68, groundOffset + 0.42, -2.15);
  const taillightR = taillightL.clone();
  taillightR.position.x = 0.68;
  rootGroup.add(taillightL);
  rootGroup.add(taillightR);

  // Brand-Specific Bespoke Aero & Signature Details
  if (vehicleId === 'royale_w16') {
    // Bugatti-inspired Horseshoe Chrome Radiator Grille
    const horseshoeGeo = new THREE.TorusGeometry(0.32, 0.06, 12, 24, Math.PI);
    const horseshoe = new THREE.Mesh(horseshoeGeo, chromeMaterial);
    horseshoe.position.set(0, groundOffset + 0.32, 2.26);
    horseshoe.rotation.z = Math.PI; // arch shape
    rootGroup.add(horseshoe);

    // Signature sweeping Bugatti C-line along cabin flanks
    const cLineMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
    const cLineL = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 8, 24, Math.PI * 1.2), cLineMat);
    cLineL.position.set(-1.08, groundOffset + 0.55, -0.1);
    cLineL.rotation.y = Math.PI / 2;
    const cLineR = cLineL.clone();
    cLineR.position.x = 1.08;
    rootGroup.add(cLineL, cLineR);

    // Horizon rear LED lightbar
    const rearBar = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 0.1), taillightMaterial);
    rearBar.position.set(0, groundOffset + 0.45, -2.2);
    rootGroup.add(rearBar);
  } else if (vehicleId === 'cavallo_f80') {
    // Ferrari-inspired Side Air Intake Pontoons
    const scoopGeo = new THREE.BoxGeometry(0.24, 0.28, 0.85);
    const scoopL = new THREE.Mesh(scoopGeo, accentMaterial);
    scoopL.position.set(-1.05, groundOffset + 0.35, -0.4);
    const scoopR = scoopL.clone();
    scoopR.position.x = 1.05;
    rootGroup.add(scoopL, scoopR);

    // Mid-rear glass engine bay showing red V8 manifold
    const engineBlockMat = new THREE.MeshStandardMaterial({ color: 0xdd1122, roughness: 0.4, metalness: 0.6 });
    const redManifold = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.16, 0.8), engineBlockMat);
    redManifold.position.set(0, groundOffset + 0.52, -0.85);
    rootGroup.add(redManifold);

    // Signature round Ferrari taillight lenses
    const roundTailGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
    roundTailGeo.rotateX(Math.PI / 2);
    const roundTailL = new THREE.Mesh(roundTailGeo, taillightMaterial);
    roundTailL.position.set(-0.7, groundOffset + 0.42, -2.22);
    const roundTailR = roundTailL.clone();
    roundTailR.position.x = 0.7;
    rootGroup.add(roundTailL, roundTailR);
  } else if (vehicleId === 'toro_aventis') {
    // Lamborghini-inspired Sharp Angular Stealth Sidepods & Hexagon Intakes
    const sidePodGeo = new THREE.BoxGeometry(0.26, 0.3, 1.2);
    const sidePodL = new THREE.Mesh(sidePodGeo, accentMaterial);
    sidePodL.position.set(-1.1, groundOffset + 0.32, -0.3);
    sidePodL.rotation.y = -0.06;
    const sidePodR = sidePodL.clone();
    sidePodR.position.x = 1.1;
    sidePodR.rotation.y = 0.06;
    rootGroup.add(sidePodL, sidePodR);

    // Y-shaped LED headlight signature strips
    const yMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yStripL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.08), yMat);
    yStripL.position.set(-0.7, groundOffset + 0.4, 2.22);
    yStripL.rotation.z = 0.35;
    const yStripR = yStripL.clone();
    yStripR.position.x = 0.7;
    yStripR.rotation.z = -0.35;
    rootGroup.add(yStripL, yStripR);
  }

  // Real Headlight Spotlights (cast onto road)
  const spotLightL = new THREE.SpotLight(0xffffff, 4.5, 55, Math.PI / 6, 0.35, 1.2);
  spotLightL.position.set(-0.65, groundOffset + 0.4, 2.1);
  const spotTargetL = new THREE.Object3D();
  spotTargetL.position.set(-0.65, 0, 18);
  rootGroup.add(spotTargetL);
  spotLightL.target = spotTargetL;
  rootGroup.add(spotLightL);

  const spotLightR = new THREE.SpotLight(0xffffff, 4.5, 55, Math.PI / 6, 0.35, 1.2);
  spotLightR.position.set(0.65, groundOffset + 0.4, 2.1);
  const spotTargetR = new THREE.Object3D();
  spotTargetR.position.set(0.65, 0, 18);
  rootGroup.add(spotTargetR);
  spotLightR.target = spotTargetR;
  rootGroup.add(spotLightR);

  // 7. Spoiler Node
  const spoilerGroup = new THREE.Group();
  spoilerGroup.position.set(0, groundOffset + 0.6, -1.9);

  if (customization.spoilerStyle === 'carbon_gt') {
    // Uprights
    const standL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.12), carbonMaterial);
    standL.position.set(-0.55, 0.18, 0);
    const standR = standL.clone();
    standR.position.x = 0.55;
    // Wing blade
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 0.35), carbonMaterial);
    wingBlade.position.set(0, 0.35, 0.05);
    wingBlade.rotation.x = -0.08;
    spoilerGroup.add(standL, standR, wingBlade);
  } else if (customization.spoilerStyle === 'ducktail') {
    const ducktail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.18), bodyMaterial);
    ducktail.position.set(0, 0.05, 0);
    ducktail.rotation.x = 0.25;
    spoilerGroup.add(ducktail);
  } else if (customization.spoilerStyle === 'drag_wing') {
    const dragWing = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.06, 0.55), carbonMaterial);
    dragWing.position.set(0, 0.2, 0.2);
    spoilerGroup.add(dragWing);
  }
  rootGroup.add(spoilerGroup);

  // 8. Wheels (4 distinct corners with brake calipers and rims)
  const wheelMeshes: THREE.Group[] = [];
  const wheelSpinNodes: THREE.Mesh[] = [];
  const wheelOffsets = [
    { x: -wheelbaseX, z: wheelbaseZ, name: 'FL' },
    { x: wheelbaseX, z: wheelbaseZ, name: 'FR' },
    { x: -wheelbaseX, z: -wheelbaseZ, name: 'RL' },
    { x: wheelbaseX, z: -wheelbaseZ, name: 'RR' },
  ];

  const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
  tireGeo.rotateZ(Math.PI / 2);

  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth * 1.02, 16);
  rimGeo.rotateZ(Math.PI / 2);

  const caliperGeo = new THREE.BoxGeometry(0.08, 0.15, 0.18);
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xff1122, roughness: 0.3, metalness: 0.8 });

  wheelOffsets.forEach((pos) => {
    const wheelCornerGroup = new THREE.Group();
    wheelCornerGroup.position.set(pos.x, wheelRadius, pos.z);

    const spinNode = new THREE.Mesh(tireGeo, tireMaterial);
    spinNode.castShadow = true;

    // Rim inner mesh
    const rimMesh = new THREE.Mesh(rimGeo, rimMaterial);
    spinNode.add(rimMesh);

    // Spokes / accents
    const spokeMesh = new THREE.Mesh(new THREE.BoxGeometry(wheelWidth * 1.03, wheelRadius * 1.35, 0.06), rimMaterial);
    spinNode.add(spokeMesh);

    // Caliper
    const caliperMesh = new THREE.Mesh(caliperGeo, caliperMat);
    caliperMesh.position.set(pos.x > 0 ? -0.06 : 0.06, 0.08, 0);

    wheelCornerGroup.add(spinNode);
    wheelCornerGroup.add(caliperMesh);
    rootGroup.add(wheelCornerGroup);

    wheelMeshes.push(wheelCornerGroup);
    wheelSpinNodes.push(spinNode);
  });

  // 9. Underglow Neons
  const neonStrips: THREE.Mesh[] = [];
  let neonLightNode: THREE.PointLight | null = null;
  if (customization.neonColor !== 'none') {
    const neonHex =
      customization.neonColor === 'cyan'
        ? 0x00f0ff
        : customization.neonColor === 'magenta'
        ? 0xff0088
        : customization.neonColor === 'lime'
        ? 0x39ff14
        : customization.neonColor === 'amber'
        ? 0xffaa00
        : 0xffffff;

    const neonMat = new THREE.MeshBasicMaterial({ color: neonHex });
    const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 2.8), neonMat);
    stripL.position.set(-0.85, 0.06, 0);
    const stripR = stripL.clone();
    stripR.position.x = 0.85;

    neonStrips.push(stripL, stripR);
    rootGroup.add(stripL, stripR);

    neonLightNode = new THREE.PointLight(neonHex, 3.5, 6.0, 1.5);
    neonLightNode.position.set(0, 0.15, 0);
    rootGroup.add(neonLightNode);
  }

  // 10. Exhaust Pipes & Nitro Flame Meshes
  const nitroFlames: THREE.Mesh[] = [];
  if (vehicleId !== 'phantom_ev') {
    const pipeGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.25, 12);
    pipeGeo.rotateX(Math.PI / 2);

    const pipeL = new THREE.Mesh(pipeGeo, chromeMaterial);
    pipeL.position.set(-0.55, groundOffset + 0.12, -2.18);
    const pipeR = pipeL.clone();
    pipeR.position.x = 0.55;
    rootGroup.add(pipeL, pipeR);

    const flameGeo = new THREE.ConeGeometry(0.12, 0.65, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0 });

    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.position.set(-0.55, groundOffset + 0.12, -2.45);
    const flameR = flameL.clone();
    flameR.position.x = 0.55;

    nitroFlames.push(flameL, flameR);
    rootGroup.add(flameL, flameR);
  }

  // 11. Soft Radial Contact Shadow Disc
  const shadowGeo = new THREE.PlaneGeometry(2.6, 5.2);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.position.y = 0.02;
  rootGroup.add(contactShadow);

  // 12. Hood Engine Smoke Particle System (Activated on high damage)
  const particleCount = 40;
  const smokeGeo = new THREE.BufferGeometry();
  const smokePositions = new Float32Array(particleCount * 3);
  const smokeVelocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    smokePositions[i * 3 + 0] = (Math.random() - 0.5) * 0.4;
    smokePositions[i * 3 + 1] = groundOffset + 0.5;
    smokePositions[i * 3 + 2] = 1.2 + (Math.random() - 0.5) * 0.4;

    smokeVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.2;
    smokeVelocities[i * 3 + 1] = 0.8 + Math.random() * 0.8;
    smokeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));

  const smokeMat = new THREE.PointsMaterial({
    color: 0x444444,
    size: 0.28,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
  rootGroup.add(smokeParticles);

  return {
    group: rootGroup,
    wheelMeshes,
    wheelSpinNodes,
    bodyMaterials,
    accentMaterials,
    rimMaterials,
    spoilerNode: spoilerGroup,
    neonLightNode,
    neonStrips,
    headlightNodes: [spotLightL, spotLightR],
    taillightMaterials,
    nitroFlames,
    frontBumperNode: frontBumperGroup,
    smokeParticles,
    smokePositions,
    smokeVelocities,
  };
}

/**
 * Updates dynamic vehicle subparts per frame
 */
export function updateVehicleModelVisuals(
  refs: VehicleMeshRefs,
  speedMs: number,
  steerAngle: number,
  brakeActive: boolean,
  nitroActive: boolean,
  damage: VehicleDamage,
  headlightsOn: boolean,
  dt: number
) {
  // Steer front wheels (indices 0 and 1)
  refs.wheelMeshes[0].rotation.y = steerAngle;
  refs.wheelMeshes[1].rotation.y = steerAngle;

  // Spin all 4 wheels around X axis
  const wheelRadius = 0.35;
  const angularVelocity = (speedMs / wheelRadius) * dt;
  refs.wheelSpinNodes.forEach((node) => {
    node.rotation.x += angularVelocity;
  });

  // Headlights
  refs.headlightNodes.forEach((spot) => {
    spot.visible = headlightsOn;
  });

  // Taillights brake glow
  refs.taillightMaterials.forEach((mat) => {
    mat.emissiveIntensity = brakeActive ? 3.5 : headlightsOn ? 1.0 : 0.2;
  });

  // Nitro Flames
  refs.nitroFlames.forEach((flame) => {
    const mat = flame.material as THREE.MeshBasicMaterial;
    if (nitroActive) {
      mat.opacity = 0.75 + Math.random() * 0.25;
      flame.scale.set(1.0 + Math.random() * 0.3, 1.0 + Math.random() * 0.4, 1.0);
    } else {
      mat.opacity = 0;
    }
  });

  // Damage deformation & engine smoke
  const smokeMat = refs.smokeParticles.material as THREE.PointsMaterial;
  if (damage.engineHealth < 50) {
    smokeMat.opacity = Math.min(0.65, (50 - damage.engineHealth) / 50);
    const pos = refs.smokePositions;
    const vel = refs.smokeVelocities;
    const count = pos.length / 3;

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 0] += vel[i * 3 + 0] * dt;
      pos[i * 3 + 2] += (vel[i * 3 + 2] - speedMs * 0.3) * dt;

      // Reset when floating too high
      if (pos[i * 3 + 1] > 2.5) {
        pos[i * 3 + 0] = (Math.random() - 0.5) * 0.4;
        pos[i * 3 + 1] = 0.8;
        pos[i * 3 + 2] = 1.2 + (Math.random() - 0.5) * 0.4;
      }
    }
    refs.smokeParticles.geometry.attributes.position.needsUpdate = true;
  } else {
    smokeMat.opacity = 0;
  }

  // Front bumper sag/tilt on body damage
  if (damage.deformationFactor > 0.05) {
    refs.frontBumperNode.rotation.z = damage.deformationFactor * 0.08;
    refs.frontBumperNode.position.y = -damage.deformationFactor * 0.08;
  }
}
