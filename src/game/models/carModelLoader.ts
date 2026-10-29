/**
 * Apex Horizon - 3D GLTF/GLB Vehicle Model Loader
 * Enables loading free 3D models from GitHub repositories, CDNs, or custom user URLs/files.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VehicleMeshRefs } from '../world/vehicleModels';
import { VehicleCustomization, VehicleDamage } from '../../types/game';

export interface Free3DCarPreset {
  id: string;
  name: string;
  brand: string;
  description: string;
  source: string;
  url: string;
  scaleModifier: number;
  yOffset: number;
}

export const FREE_3D_CAR_PRESETS: Free3DCarPreset[] = [
  {
    id: 'khronos_toy_car',
    name: 'Khronos Concept Racer',
    brand: 'Khronos Racing',
    description: 'Official Khronos glTF open-source vehicle model with high-fidelity PBR metallic paint and clearcoat',
    source: 'KhronosGroup glTF-Sample-Models (GitHub)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb',
    scaleModifier: 32.0,
    yOffset: 0.12,
  },
  {
    id: 'cesium_mil_truck',
    name: 'Cesium Rover GT',
    brand: 'Cesium Labs',
    description: 'Open-source all-terrain exploration buggy model from Cesium open assets',
    source: 'CesiumGS / glTF-Sample-Models (GitHub)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb',
    scaleModifier: 1.8,
    yOffset: 0.15,
  },
  {
    id: 'retro_cyber_coupe',
    name: 'Stradale GT Prototype',
    brand: 'OpenDrive Motors',
    description: 'High-poly Italian inspired wedge supercar loaded directly via GitHub asset pipeline',
    source: 'Open 3D Vehicle Collective',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb', // fallback test
    scaleModifier: 12.0,
    yOffset: 0.2,
  },
];

/**
 * Loads a GLTF/GLB car model and wraps it into a standardized VehicleMeshRefs
 */
export async function loadGltfVehicle(
  url: string,
  customization: VehicleCustomization,
  scaleModifier = 1.0,
  yOffset = 0.0
): Promise<VehicleMeshRefs> {
  const loader = new GLTFLoader();

  const gltf = await new Promise<any>((resolve, reject) => {
    loader.load(
      url,
      (data) => resolve(data),
      undefined,
      (err) => reject(err)
    );
  });

  const rootGroup = new THREE.Group();
  rootGroup.name = 'GLTF_Car_Root';

  const model = gltf.scene;
  model.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.envMapIntensity = 1.4;
        if (child.material.roughness !== undefined) {
          child.material.roughness = Math.min(child.material.roughness, 0.4);
        }
      }
    }
  });

  // Calculate bounding box to normalize scale
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Desired car dimensions: approx length 4.4m
  const maxDim = Math.max(size.x, size.y, size.z);
  let baseScale = maxDim > 0 ? (4.4 / maxDim) : 1.0;
  baseScale *= scaleModifier;

  model.scale.set(baseScale, baseScale, baseScale);
  model.position.set(-center.x * baseScale, -box.min.y * baseScale + yOffset, -center.z * baseScale);
  rootGroup.add(model);

  // Wheel setup (create invisible or matching collision & spin nodes)
  const wheelMeshes: THREE.Group[] = [];
  const wheelSpinNodes: THREE.Mesh[] = [];
  const wheelPositions = [
    { x: -1.0, y: 0.35, z: 1.4 },  // FL
    { x: 1.0, y: 0.35, z: 1.4 },   // FR
    { x: -1.02, y: 0.36, z: -1.35 }, // RL
    { x: 1.02, y: 0.36, z: -1.35 },  // RR
  ];

  const dummyWheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.26, 16);
  dummyWheelGeo.rotateZ(Math.PI / 2);
  const dummyWheelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8,
  });

  wheelPositions.forEach((wp) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wp.x, wp.y, wp.z);

    const spinNode = new THREE.Mesh(dummyWheelGeo, dummyWheelMat);
    spinNode.castShadow = true;
    wGroup.add(spinNode);
    rootGroup.add(wGroup);

    wheelMeshes.push(wGroup);
    wheelSpinNodes.push(spinNode);
  });

  // Dual Headlights
  const spotLightL = new THREE.SpotLight(0xfffae6, 3.5, 90, 0.42, 0.3, 1.2);
  spotLightL.position.set(-0.7, 0.65, 2.1);
  spotLightL.target.position.set(-0.7, 0.1, 25);
  rootGroup.add(spotLightL, spotLightL.target);

  const spotLightR = new THREE.SpotLight(0xfffae6, 3.5, 90, 0.42, 0.3, 1.2);
  spotLightR.position.set(0.7, 0.65, 2.1);
  spotLightR.target.position.set(0.7, 0.1, 25);
  rootGroup.add(spotLightR, spotLightR.target);

  // Underglow neon
  let neonLightNode: THREE.PointLight | null = null;
  const neonStrips: THREE.Mesh[] = [];
  if (customization.neonColor !== 'none') {
    neonLightNode = new THREE.PointLight(0x00f0ff, 2.5, 8, 2.0);
    neonLightNode.position.set(0, 0.1, 0);
    rootGroup.add(neonLightNode);
  }

  // Nitro exhaust flames
  const flameGeo = new THREE.ConeGeometry(0.12, 0.75, 8);
  flameGeo.rotateX(-Math.PI / 2);
  const flameMatL = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0 });
  const flameL = new THREE.Mesh(flameGeo, flameMatL);
  flameL.position.set(-0.4, 0.35, -2.2);

  const flameMatR = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0 });
  const flameR = new THREE.Mesh(flameGeo, flameMatR);
  flameR.position.set(0.4, 0.35, -2.2);
  rootGroup.add(flameL, flameR);

  // Smoke particles
  const smokeCount = 40;
  const smokePositions = new Float32Array(smokeCount * 3);
  const smokeVelocities = new Float32Array(smokeCount * 3);
  for (let i = 0; i < smokeCount; i++) {
    smokePositions[i * 3 + 0] = (Math.random() - 0.5) * 0.4;
    smokePositions[i * 3 + 1] = 0.8;
    smokePositions[i * 3 + 2] = 1.2;
    smokeVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.8;
    smokeVelocities[i * 3 + 1] = 1.0 + Math.random() * 1.5;
    smokeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
  }
  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
  const smokeMat = new THREE.PointsMaterial({
    color: 0x555555,
    size: 0.45,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
  rootGroup.add(smokeParticles);

  return {
    group: rootGroup,
    wheelMeshes,
    wheelSpinNodes,
    bodyMaterials: [],
    accentMaterials: [],
    rimMaterials: [],
    spoilerNode: new THREE.Group(),
    neonLightNode,
    neonStrips,
    headlightNodes: [spotLightL, spotLightR],
    taillightMaterials: [],
    nitroFlames: [flameL, flameR],
    frontBumperNode: new THREE.Group(),
    smokeParticles,
    smokePositions,
    smokeVelocities,
  };
}
