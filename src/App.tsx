/**
 * Apex Horizon - Open World 3D Driving Simulator
 * Core Game Shell, Three.js Renderer, and 60FPS Physics Simulation Loop
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  UserProfile,
  VehicleId,
  GraphicsSettings,
  ControlBindings,
  GameTelemetry,
  TutorialStep,
} from './types/game';
import {
  VEHICLE_DATABASE,
  calculatePerformance,
  stepVehiclePhysics,
  calculateCollisionDamage,
  VehiclePhysicsState,
  VehiclePhysicsInputs,
} from './game/physics/vehiclePhysics';
import {
  loadProfile,
  saveProfile,
  loadGraphicsSettings,
  saveGraphicsSettings,
  loadControlBindings,
  saveControlBindings,
} from './game/storage/gameStorage';
import {
  buildOpenWorldMap,
  updateWorldEnvironment,
  getGroundElevation,
  WorldEnvironmentRefs,
} from './game/world/openWorldMap';
import {
  createProceduralVehicle,
  updateVehicleModelVisuals,
  VehicleMeshRefs,
} from './game/world/vehicleModels';
import { loadGltfVehicle } from './game/models/carModelLoader';
import { TrafficManager } from './game/traffic/trafficSystem';
import { soundEngine } from './game/audio/soundEngine';
import { InputManager } from './game/input/inputManager';
import { TUTORIAL_LESSONS, TUTORIAL_ORDER } from './game/tutorial/tutorialManager';
import { TitleScreen } from './components/TitleScreen';
import { GameHud } from './components/GameHud';
import { CollapsibleBottomDock } from './components/CollapsibleBottomDock';
import { PauseModal } from './components/PauseModal';
import { GitHubReleaseModal } from './components/GitHubReleaseModal';

type GameState = 'title' | 'playing' | 'paused';
type CameraView = 'chase' | 'hood' | 'cinematic';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // User persistent state
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [graphics, setGraphics] = useState<GraphicsSettings>(loadGraphicsSettings);
  const [controls, setControls] = useState<ControlBindings>(loadControlBindings);

  // Game UI State
  const [gameState, setGameState] = useState<GameState>('title');
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>('welcome');

  // Low-frequency telemetry for HUD (throttled to ~10Hz)
  const [telemetry, setTelemetry] = useState<GameTelemetry>({
    speedKmh: 0,
    speedMph: 0,
    rpm: 950,
    maxRpm: 8200,
    gear: 1,
    isAutomatic: true,
    nitroPercent: 100,
    nitroActive: false,
    driftAngle: 0,
    driftScore: 0,
    driftCombo: 1.0,
    isDrifting: false,
    engineHealth: 100,
    bodyIntegrity: 100,
    headlightsOn: false,
    timeOfDayHours: 18.5, // start at golden sunset
    weather: 'clear',
    nearRepairStation: false,
    currentZoneName: 'Downtown Skyline',
    gamepadConnected: false,
    gamepadName: '',
  });

  // Mutable refs for high-frequency 60Hz loop
  const inputManagerRef = useRef<InputManager | null>(null);
  const gameStateRef = useRef<GameState>('title');
  const cameraViewRef = useRef<CameraView>('chase');
  const profileRef = useRef<UserProfile>(profile);
  const graphicsRef = useRef<GraphicsSettings>(graphics);
  const tutorialActiveRef = useRef<boolean>(false);
  const tutorialStepRef = useRef<TutorialStep>('welcome');
  const tutorialStepStartTimeRef = useRef<number>(Date.now());

  // Simulation physics state
  const physicsStateRef = useRef<VehiclePhysicsState>({
    x: 280,
    y: 0,
    z: -100,
    speedMs: 0,
    lateralSpeedMs: 0,
    yaw: 0,
    steerAngle: 0,
    rpm: 950,
    gear: 1,
    pitch: 0,
    roll: 0,
    verticalVelocity: 0,
    isAirborne: false,
    isDrifting: false,
    driftSlipAngle: 0,
    wheelSlipRear: 0,
    nitroRemaining: 100,
  });

  const damageRef = useRef({
    engineHealth: 100,
    bodyIntegrity: 100,
    tireHealth: 100,
    deformationFactor: 0,
  });

  const headlightsOnRef = useRef(false);
  const timeOfDayRef = useRef(18.5); // 0 to 24
  const driftScoreAccumulatorRef = useRef(0);
  const driftComboRef = useRef(1.0);
  const lastTelemetryUpdateRef = useRef(0);

  // Keep refs in sync with React state
  useEffect(() => {
    gameStateRef.current = gameState;
    document.body.dataset.state = gameState;
  }, [gameState]);

  useEffect(() => {
    profileRef.current = profile;
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    graphicsRef.current = graphics;
    saveGraphicsSettings(graphics);
  }, [graphics]);

  useEffect(() => {
    saveControlBindings(controls);
    if (inputManagerRef.current) {
      inputManagerRef.current.updateBindings(controls);
    }
  }, [controls]);

  useEffect(() => {
    tutorialActiveRef.current = tutorialActive;
  }, [tutorialActive]);

  useEffect(() => {
    tutorialStepRef.current = tutorialStep;
    tutorialStepStartTimeRef.current = Date.now();
  }, [tutorialStep]);

  // Autostart URL query parameter check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      soundEngine.init();
      setGameState('playing');
    }
  }, []);

  // Keyboard shortcut listener for H (toggle dock) and Space/Enter to start
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') {
        setIsDockOpen((prev) => !prev);
      }
      if (gameStateRef.current === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        soundEngine.init();
        setGameState('playing');
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameStateRef.current === 'playing') {
          setGameState('paused');
        } else if (gameStateRef.current === 'paused') {
          setGameState('playing');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Quick repair action
  const handleQuickRepair = useCallback(() => {
    damageRef.current = {
      engineHealth: 100,
      bodyIntegrity: 100,
      tireHealth: 100,
      deformationFactor: 0,
    };
    soundEngine.playRepairSound();
  }, []);

  // Reset car position
  const handleResetCar = useCallback(() => {
    const currentGroundY = getGroundElevation(280, -100);
    physicsStateRef.current = {
      ...physicsStateRef.current,
      x: 280,
      y: currentGroundY,
      z: -100,
      speedMs: 0,
      lateralSpeedMs: 0,
      yaw: 0,
      steerAngle: 0,
      pitch: 0,
      roll: 0,
    };
    handleQuickRepair();
    if (gameStateRef.current === 'paused') {
      setGameState('playing');
    }
  }, [handleQuickRepair]);

  // Toggle Camera View
  const handleToggleCamera = useCallback(() => {
    const views: CameraView[] = ['chase', 'hood', 'cinematic'];
    const nextIdx = (views.indexOf(cameraViewRef.current) + 1) % views.length;
    cameraViewRef.current = views[nextIdx];
  }, []);

  // Start Game handler
  const handleStartGame = useCallback((startTutorial = false) => {
    soundEngine.init();
    if (startTutorial) {
      setTutorialActive(true);
      setTutorialStep('welcome');
    } else {
      setTutorialActive(false);
    }
    setGameState('playing');
  }, []);

  // Select Vehicle handler
  const handleSelectVehicle = useCallback((id: VehicleId) => {
    const isOwned = profileRef.current.ownedVehicles.includes(id);
    const spec = VEHICLE_DATABASE[id];

    if (!isOwned) {
      if (profileRef.current.credits >= spec.costCredits) {
        // Purchase vehicle
        const updatedProfile = {
          ...profileRef.current,
          credits: profileRef.current.credits - spec.costCredits,
          ownedVehicles: [...profileRef.current.ownedVehicles, id],
          currentVehicleId: id,
        };
        setProfile(updatedProfile);
        confetti({ particleCount: 40, spread: 60 });
      } else {
        alert(`Need $${spec.costCredits.toLocaleString()} Credits to unlock ${spec.name}. Current balance: $${profileRef.current.credits.toLocaleString()}`);
        return;
      }
    } else {
      setProfile((prev) => ({ ...prev, currentVehicleId: id }));
    }
  }, []);

  // -------------------------------------------------------------
  // THREE.JS SCENE INITIALIZATION & 60FPS SIMULATION LIFECYCLE
  // -------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl && graphicsRef.current.antiAliasing,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl && graphicsRef.current.shadowMapRes > 0;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Camera & Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a243b, 0.0018);

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      graphicsRef.current.drawDistance
    );
    camera.position.set(0, 5, -12);

    // 3. Build Procedural Open World Map
    const worldRefs: WorldEnvironmentRefs = buildOpenWorldMap(scene);

    // Studio PBR reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Vehicle Model Mesh Container
    let activeVehicleId = profileRef.current.currentVehicleId;
    let vehicleMeshRefs = createProceduralVehicle(
      activeVehicleId,
      profileRef.current.customizations[activeVehicleId]
    );
    scene.add(vehicleMeshRefs.group);

    // 5. AI Traffic Simulation Manager
    const trafficManager = new TrafficManager(scene, 14);

    // 6. Input Manager
    const inputManager = new InputManager(controls);
    inputManagerRef.current = inputManager;

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop Variables
    let frameId = 0;
    let lastTime = performance.now();
    let titleCamAngle = 0;
    let lastSpeedTrapTriggerTime = 0;
    let activeVehicleKey: string = profileRef.current.currentVehicleId;
    let isLoadingModel = false;

    // Software WebGL Pace Guard
    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    // MAIN 60FPS TICK FUNCTION
    const tick = () => {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      // Check if vehicle model or custom 3D model changed in profile
      const isCustomModel = !!(profileRef.current.custom3dModel?.enabled && profileRef.current.custom3dModel.modelUrl);
      const currentModelKey = isCustomModel ? profileRef.current.custom3dModel!.modelUrl : profileRef.current.currentVehicleId;

      if (currentModelKey !== activeVehicleKey && !isLoadingModel) {
        activeVehicleKey = currentModelKey;
        activeVehicleId = profileRef.current.currentVehicleId;

        if (isCustomModel) {
          isLoadingModel = true;
          loadGltfVehicle(
            profileRef.current.custom3dModel!.modelUrl,
            profileRef.current.customizations[activeVehicleId],
            profileRef.current.custom3dModel!.scale,
            profileRef.current.custom3dModel!.yOffset
          ).then((newRefs) => {
            scene.remove(vehicleMeshRefs.group);
            vehicleMeshRefs = newRefs;
            scene.add(vehicleMeshRefs.group);
            isLoadingModel = false;
          }).catch((e) => {
            console.warn('Failed to load custom GLB model, falling back to procedural:', e);
            isLoadingModel = false;
            scene.remove(vehicleMeshRefs.group);
            vehicleMeshRefs = createProceduralVehicle(activeVehicleId, profileRef.current.customizations[activeVehicleId]);
            scene.add(vehicleMeshRefs.group);
          });
        } else {
          scene.remove(vehicleMeshRefs.group);
          vehicleMeshRefs = createProceduralVehicle(
            activeVehicleId,
            profileRef.current.customizations[activeVehicleId]
          );
          scene.add(vehicleMeshRefs.group);
        }
      }

      // Dynamic Graphics Sync (FOV & Tone Mapping)
      if (Math.abs(camera.fov - graphicsRef.current.fov) > 0.1) {
        camera.fov = graphicsRef.current.fov;
        camera.updateProjectionMatrix();
      }
      if (graphicsRef.current.toneMapping === 'aces_filmic' && renderer.toneMapping !== THREE.ACESFilmicToneMapping) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
      } else if (graphicsRef.current.toneMapping === 'reinhard' && renderer.toneMapping !== THREE.ReinhardToneMapping) {
        renderer.toneMapping = THREE.ReinhardToneMapping;
      } else if (graphicsRef.current.toneMapping === 'neutral' && renderer.toneMapping !== THREE.NoToneMapping) {
        renderer.toneMapping = THREE.NoToneMapping;
      }

      const currentSpec = VEHICLE_DATABASE[activeVehicleId];
      const derivedProps = calculatePerformance(
        currentSpec,
        profileRef.current.upgrades[activeVehicleId]
      );

      // Poll inputs
      const inputs: VehiclePhysicsInputs = {
        throttle: 0,
        brake: 0,
        steer: 0,
        handbrake: false,
        nitro: false,
        reverse: false,
      };

      if (inputManagerRef.current) {
        const polled = inputManagerRef.current.pollInputs();

        if (gameStateRef.current === 'playing') {
          inputs.throttle = polled.throttle;
          inputs.brake = polled.brake;
          inputs.steer = polled.steer;
          inputs.handbrake = polled.handbrake;
          inputs.nitro = polled.nitro;
          inputs.reverse = polled.reverse;

          if (polled.resetCarJustPressed) handleQuickRepair();
          if (polled.cameraJustPressed) handleToggleCamera();
          if (polled.headlightsJustPressed) {
            headlightsOnRef.current = !headlightsOnRef.current;
          }
          if (polled.pauseJustPressed) {
            setGameState('paused');
          }
        }
      }

      // Step physics if simulation is running
      const isSimulating = gameStateRef.current === 'playing';
      if (isSimulating) {
        // Query terrain elevation under car
        const groundY = getGroundElevation(physicsStateRef.current.x, physicsStateRef.current.z);

        // Step vehicle physics
        physicsStateRef.current = stepVehiclePhysics(
          physicsStateRef.current,
          inputs,
          derivedProps,
          damageRef.current,
          1.0, // surface friction
          dt
        );

        // Ground clamping & jumping
        physicsStateRef.current.y = groundY;

        // Sound Engine Updates
        soundEngine.updateEngine(
          physicsStateRef.current.rpm,
          inputs.throttle,
          physicsStateRef.current.speedMs,
          inputs.nitro && physicsStateRef.current.nitroRemaining > 0,
          currentSpec.category === 'Electric'
        );
        soundEngine.updateTireScreech(
          physicsStateRef.current.wheelSlipRear,
          physicsStateRef.current.speedMs
        );

        // Drift scoring calculation
        if (physicsStateRef.current.isDrifting && Math.abs(physicsStateRef.current.speedMs) > 6.0) {
          driftComboRef.current = Math.min(4.0, driftComboRef.current + dt * 0.3);
          driftScoreAccumulatorRef.current +=
            dt * 120 * driftComboRef.current * (physicsStateRef.current.driftSlipAngle / 20.0);
        } else {
          driftComboRef.current = Math.max(1.0, driftComboRef.current - dt * 0.8);
        }

        // AI Traffic simulation update
        trafficManager.update(
          { x: physicsStateRef.current.x, z: physicsStateRef.current.z, speedMs: physicsStateRef.current.speedMs },
          dt
        );

        // Check collision between player and AI traffic
        const hitTrafficCar = trafficManager.checkPlayerCollision(physicsStateRef.current);
        if (hitTrafficCar && Math.abs(physicsStateRef.current.speedMs) > 3.5) {
          const deltaSpeed = Math.abs(physicsStateRef.current.speedMs - hitTrafficCar.speedMs);
          const { newDamage } = calculateCollisionDamage(deltaSpeed + 6.0, damageRef.current);
          damageRef.current = newDamage;
          soundEngine.playCollisionSound(deltaSpeed);
          inputManagerRef.current?.triggerGamepadHaptics(220, 0.7, 0.95);
          physicsStateRef.current.speedMs *= 0.6; // decelerate on collision
        }

        // Pit lane repair check (X: 180, Z: 30)
        const distToPitLane = Math.hypot(physicsStateRef.current.x - 180, physicsStateRef.current.z - 30);
        const nearRepairStation = distToPitLane < 14;
        if (nearRepairStation) {
          if (damageRef.current.engineHealth < 100 || damageRef.current.bodyIntegrity < 100) {
            damageRef.current.engineHealth = Math.min(100, damageRef.current.engineHealth + dt * 25);
            damageRef.current.bodyIntegrity = Math.min(100, damageRef.current.bodyIntegrity + dt * 25);
            damageRef.current.deformationFactor = Math.max(0, damageRef.current.deformationFactor - dt * 0.2);
            soundEngine.playRepairSound();
          }
        }

        // Tutorial Check
        if (tutorialActiveRef.current) {
          const lesson = TUTORIAL_LESSONS[tutorialStepRef.current];
          const timeInStep = (Date.now() - tutorialStepStartTimeRef.current) / 1000;
          if (
            lesson &&
            lesson.completionCheck({
              speedKmh: Math.abs(physicsStateRef.current.speedMs * 3.6),
              driftScore: driftScoreAccumulatorRef.current,
              nitroActive: inputs.nitro && physicsStateRef.current.nitroRemaining > 0,
              engineHealth: damageRef.current.engineHealth,
              nearRepairStation,
              timeInStepSec: timeInStep,
            })
          ) {
            const currentIdx = TUTORIAL_ORDER.indexOf(tutorialStepRef.current);
            if (currentIdx < TUTORIAL_ORDER.length - 1) {
              const nextStep = TUTORIAL_ORDER[currentIdx + 1];
              setTutorialStep(nextStep);
              confetti({ particleCount: 30, spread: 50 });
            } else {
              setTutorialActive(false);
              confetti({ particleCount: 80, spread: 90 });
            }
          }
        }

        // Interactive Forza Horizon 2 Bonus Boards Collision Check
        if (worldRefs.bonusBoards) {
          worldRefs.bonusBoards.forEach((board) => {
            if (!board.smashed && !(profileRef.current.smashedBoards || []).includes(board.id)) {
              const dist = Math.hypot(physicsStateRef.current.x - board.x, physicsStateRef.current.z - board.z);
              if (dist < 3.2) {
                board.smashed = true;
                board.smashTime = Date.now();
                board.panelMesh.visible = false;
                soundEngine.playDriftScoreChime();
                confetti({ particleCount: 65, spread: 80 });
                const updatedBoards = [...(profileRef.current.smashedBoards || []), board.id];
                setProfile((prev) => ({
                  ...prev,
                  credits: prev.credits + board.rewardCredits,
                  smashedBoards: updatedBoards,
                }));
                setTelemetry((prev) => ({
                  ...prev,
                  recentBoardSmashed: { name: board.name, rewardCredits: board.rewardCredits },
                }));
                setTimeout(() => {
                  setTelemetry((prev) => ({ ...prev, recentBoardSmashed: null }));
                }, 4000);
              }
            }
          });
        }

        // Radar Speed Trap Cameras (Highway X: 280, Z: 60 and Riviera Coast X: -260, Z: 80)
        const currentSpeedKmh = Math.abs(physicsStateRef.current.speedMs * 3.6);
        const speedTraps = [
          { x: 280, z: 60, id: 'highway_speed_trap', flashIdx: 0 },
          { x: -260, z: 80, id: 'coastal_speed_trap', flashIdx: 1 },
        ];
        speedTraps.forEach((trap) => {
          const dist = Math.hypot(physicsStateRef.current.x - trap.x, physicsStateRef.current.z - trap.z);
          if (dist < 8.0 && currentSpeedKmh > 100 && (now - lastSpeedTrapTriggerTime) > 6000) {
            lastSpeedTrapTriggerTime = now;
            if (worldRefs.speedTrapFlashes && worldRefs.speedTrapFlashes[trap.flashIdx]) {
              worldRefs.speedTrapFlashes[trap.flashIdx].intensity = 25.0;
            }
            const speedRecord = Math.round(currentSpeedKmh);
            const reward = Math.round(speedRecord * 12);
            setProfile((prev) => ({
              ...prev,
              credits: prev.credits + reward,
              challengeScores: {
                ...prev.challengeScores,
                [trap.id]: Math.max(speedRecord, prev.challengeScores[trap.id] || 0),
              },
            }));
            confetti({ particleCount: 45, spread: 65 });
            setTelemetry((prev) => ({
              ...prev,
              speedTrapFlash: { speedKmh: speedRecord, rewardCredits: reward },
            }));
            setTimeout(() => {
              setTelemetry((prev) => ({ ...prev, speedTrapFlash: null }));
            }, 3000);
          }
        });
      }

      // Update Vehicle 3D Model position & rotation
      vehicleMeshRefs.group.position.set(
        physicsStateRef.current.x,
        physicsStateRef.current.y,
        physicsStateRef.current.z
      );
      vehicleMeshRefs.group.rotation.set(
        physicsStateRef.current.pitch,
        physicsStateRef.current.yaw,
        physicsStateRef.current.roll
      );

      // Update dynamic subcomponents
      updateVehicleModelVisuals(
        vehicleMeshRefs,
        physicsStateRef.current.speedMs,
        physicsStateRef.current.steerAngle,
        inputs.brake > 0.1,
        inputs.nitro && physicsStateRef.current.nitroRemaining > 0,
        damageRef.current,
        headlightsOnRef.current || timeOfDayRef.current < 6 || timeOfDayRef.current > 19,
        dt
      );

      // Progress Day/Night Cycle slowly
      timeOfDayRef.current = (timeOfDayRef.current + dt * 0.05) % 24;

      // Update 3D World atmosphere, sky, sun, weather
      updateWorldEnvironment(
        worldRefs,
        timeOfDayRef.current,
        'clear',
        physicsStateRef.current.x,
        physicsStateRef.current.z,
        dt
      );

      // Camera Positioning
      if (gameStateRef.current === 'title') {
        // Dramatic Cinematic Orbiting Camera around Car in Title Screen
        titleCamAngle += dt * 0.4;
        const camDistance = 8.5;
        const camHeight = 2.2 + Math.sin(titleCamAngle * 0.5) * 0.8;
        const targetX = physicsStateRef.current.x;
        const targetY = physicsStateRef.current.y + 0.8;
        const targetZ = physicsStateRef.current.z;

        camera.position.set(
          targetX + Math.sin(titleCamAngle) * camDistance,
          targetY + camHeight,
          targetZ + Math.cos(titleCamAngle) * camDistance
        );
        camera.lookAt(targetX, targetY, targetZ);
      } else {
        // Gameplay Follow Camera
        const carX = physicsStateRef.current.x;
        const carY = physicsStateRef.current.y;
        const carZ = physicsStateRef.current.z;
        const carYaw = physicsStateRef.current.yaw;

        if (cameraViewRef.current === 'hood') {
          // Bumper / Hood Cam
          const hoodOffsetForward = 1.6;
          const hoodOffsetY = 1.1;
          camera.position.set(
            carX + Math.sin(carYaw) * hoodOffsetForward,
            carY + hoodOffsetY,
            carZ + Math.cos(carYaw) * hoodOffsetForward
          );
          camera.lookAt(
            carX + Math.sin(carYaw) * 40,
            carY + hoodOffsetY - 0.1,
            carZ + Math.cos(carYaw) * 40
          );
        } else {
          // 3rd-Person Chase Cam
          const followDistance = 7.5;
          const followHeight = 2.4;
          const targetCamX = carX - Math.sin(carYaw) * followDistance;
          const targetCamY = carY + followHeight;
          const targetCamZ = carZ - Math.cos(carYaw) * followDistance;

          // Smooth exponential damping
          camera.position.x += (targetCamX - camera.position.x) * Math.min(1.0, 8.0 * dt);
          camera.position.y += (targetCamY - camera.position.y) * Math.min(1.0, 8.0 * dt);
          camera.position.z += (targetCamZ - camera.position.z) * Math.min(1.0, 8.0 * dt);

          const lookTargetY = carY + 0.9;
          camera.lookAt(carX, lookTargetY, carZ);
        }
      }

      // Render Scene
      renderer.render(scene, camera);

      // Throttle React Telemetry update to 10Hz to preserve 60FPS WebGL performance
      if (now - lastTelemetryUpdateRef.current > 100) {
        lastTelemetryUpdateRef.current = now;
        const speedKmh = Math.abs(physicsStateRef.current.speedMs * 3.6);

        // Determine current district / zone name
        let zoneName = 'Downtown Skyline';
        if (physicsStateRef.current.x > 220) zoneName = 'Interstate 99 Highway';
        else if (physicsStateRef.current.x > 260 && physicsStateRef.current.z < -150) zoneName = 'Airport Flight Deck';
        else if (physicsStateRef.current.x < -180) zoneName = 'Fujimi Mountain Pass';
        else if (physicsStateRef.current.z > 160) zoneName = 'Port Industrial Docks';

        setTelemetry({
          speedKmh,
          speedMph: speedKmh * 0.621371,
          rpm: physicsStateRef.current.rpm,
          maxRpm: 8200,
          gear: physicsStateRef.current.gear,
          isAutomatic: true,
          nitroPercent: physicsStateRef.current.nitroRemaining,
          nitroActive: inputs.nitro && physicsStateRef.current.nitroRemaining > 0,
          driftAngle: physicsStateRef.current.driftSlipAngle,
          driftScore: driftScoreAccumulatorRef.current,
          driftCombo: driftComboRef.current,
          isDrifting: physicsStateRef.current.isDrifting,
          engineHealth: damageRef.current.engineHealth,
          bodyIntegrity: damageRef.current.bodyIntegrity,
          headlightsOn: headlightsOnRef.current,
          timeOfDayHours: timeOfDayRef.current,
          weather: 'clear',
          nearRepairStation: Math.hypot(physicsStateRef.current.x - 180, physicsStateRef.current.z - 30) < 14,
          currentZoneName: zoneName,
          gamepadConnected: inputManagerRef.current?.pollInputs().gamepadConnected || false,
          gamepadName: inputManagerRef.current?.pollInputs().gamepadId || '',
        });
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Start loop
    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      trafficManager.dispose();
      if (inputManagerRef.current) {
        inputManagerRef.current.dispose();
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Container Mount */}
      <div ref={mountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          currentVehicleId={profile.currentVehicleId}
          ownedVehicles={profile.ownedVehicles}
          onSelectVehicle={handleSelectVehicle}
          onStartGame={handleStartGame}
          onOpenGarage={() => setIsDockOpen(true)}
          onOpenSettings={() => setIsDockOpen(true)}
          onOpenGitHubReleases={() => setIsGitHubModalOpen(true)}
          credits={profile.credits}
        />
      )}

      {/* In-Game Active HUD */}
      {gameState === 'playing' && (
        <GameHud
          telemetry={telemetry}
          tutorialStep={tutorialStep}
          tutorialActive={tutorialActive}
          onSkipTutorial={() => setTutorialActive(false)}
          onPause={() => setGameState('paused')}
          onToggleCamera={handleToggleCamera}
          onQuickRepair={handleQuickRepair}
          onTouchSteer={(val) => {
            if (inputManagerRef.current) inputManagerRef.current.touchSteer = val;
          }}
          onTouchThrottle={(val) => {
            if (inputManagerRef.current) inputManagerRef.current.touchThrottle = val;
          }}
          onTouchBrake={(val) => {
            if (inputManagerRef.current) inputManagerRef.current.touchBrake = val;
          }}
          onTouchHandbrake={(val) => {
            if (inputManagerRef.current) inputManagerRef.current.touchHandbrake = val;
          }}
          onTouchNitro={(val) => {
            if (inputManagerRef.current) inputManagerRef.current.touchNitro = val;
          }}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseModal
          telemetry={telemetry}
          onResume={() => setGameState('playing')}
          onResetCar={handleResetCar}
          onOpenGarage={() => {
            setGameState('playing');
            setIsDockOpen(true);
          }}
          onOpenGitHubReleases={() => setIsGitHubModalOpen(true)}
          onReturnToTitle={() => setGameState('title')}
        />
      )}

      {/* Collapsible Bottom Control Dock */}
      <CollapsibleBottomDock
        profile={profile}
        graphics={graphics}
        controls={controls}
        onUpdateProfile={setProfile}
        onUpdateGraphics={setGraphics}
        onUpdateControls={setControls}
        onSelectVehicle={handleSelectVehicle}
        onOpenGitHubReleases={() => setIsGitHubModalOpen(true)}
        isOpen={isDockOpen}
        onToggleOpen={() => setIsDockOpen((prev) => !prev)}
      />

      {/* Interactive GitHub & 1-Click Release Installation Hub Modal */}
      <GitHubReleaseModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />
    </div>
  );
}
