/**
 * Apex Horizon - Driving Academy & Onboarding Tutorial System
 */

import { TutorialStep } from '../../types/game';

export interface TutorialLesson {
  id: TutorialStep;
  title: string;
  instruction: string;
  actionHint: string;
  targetGoal: string;
  completionCheck: (telemetry: {
    speedKmh: number;
    driftScore: number;
    nitroActive: boolean;
    engineHealth: number;
    nearRepairStation: boolean;
    timeInStepSec: number;
  }) => boolean;
}

export const TUTORIAL_LESSONS: Record<TutorialStep, TutorialLesson> = {
  welcome: {
    id: 'welcome',
    title: 'Lesson 1: Vehicle Ignition & Basics',
    instruction: 'Welcome to Apex Horizon Academy. Familiarize yourself with the vehicle controls.',
    actionHint: 'Press W or RT to accelerate forward',
    targetGoal: 'Reach 50 km/h',
    completionCheck: (t) => t.speedKmh >= 50,
  },
  throttle_brake: {
    id: 'throttle_brake',
    title: 'Lesson 2: Braking & Deceleration',
    instruction: 'Accelerate past 90 km/h, then engage brakes to bring the car to a full stop.',
    actionHint: 'Press S or LT to bring vehicle to 0 km/h',
    targetGoal: 'Accelerate to 90 km/h then stop completely (< 5 km/h)',
    completionCheck: (t) => t.timeInStepSec > 3 && t.speedKmh < 4,
  },
  steering: {
    id: 'steering',
    title: 'Lesson 3: High-Speed Slalom & Cornering',
    instruction: 'Maintain speed through turns and experience realistic weight transfer.',
    actionHint: 'Use A / D or Left Stick to steer at over 60 km/h',
    targetGoal: 'Drive above 60 km/h for 4 continuous seconds',
    completionCheck: (t) => t.speedKmh > 60 && t.timeInStepSec > 4,
  },
  handbrake_drift: {
    id: 'handbrake_drift',
    title: 'Lesson 4: Handbrake Drift Mechanics',
    instruction: 'Tap handbrake at speed while steering to break rear tire traction and initiate a drift.',
    actionHint: 'Press Space or Gamepad A while turning at speed',
    targetGoal: 'Bank at least 1,000 Drift Points',
    completionCheck: (t) => t.driftScore >= 1000,
  },
  nitro_boost: {
    id: 'nitro_boost',
    title: 'Lesson 5: Nitrous Oxide Boost Injection',
    instruction: 'Inject liquid nitrous oxide into the engine manifold for extreme surge acceleration.',
    actionHint: 'Hold Left Shift or Gamepad B / RB',
    targetGoal: 'Engage Nitro Boost for at least 2.5 seconds',
    completionCheck: (t) => t.nitroActive && t.timeInStepSec > 2.5,
  },
  garage_tuning: {
    id: 'garage_tuning',
    title: 'Lesson 6: Damage Tracking & Pit Stop Repair',
    instruction: 'High impacts cause chassis deformation and engine damage. Park at the Pit Lane or use Quick Repair.',
    actionHint: 'Press R for Quick Repair or drive into the glowing Pit Lane Bay',
    targetGoal: 'Restore vehicle to 100% health',
    completionCheck: (t) => t.engineHealth >= 98 && (t.nearRepairStation || t.timeInStepSec > 2),
  },
  completed: {
    id: 'completed',
    title: 'Apex Driving Academy Graduate',
    instruction: 'All fundamental competencies verified. You are now free to explore the open world map!',
    actionHint: 'Free Roam Active',
    targetGoal: 'Master all 4 Seasonal Challenges',
    completionCheck: () => true,
  },
};

export const TUTORIAL_ORDER: TutorialStep[] = [
  'welcome',
  'throttle_brake',
  'steering',
  'handbrake_drift',
  'nitro_boost',
  'garage_tuning',
  'completed',
];
