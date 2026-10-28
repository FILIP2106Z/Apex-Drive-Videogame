/**
 * Apex Horizon - Input Management System
 * Handles Keyboard, HTML5 Gamepad API with analog triggers and haptics, and Mobile Touch.
 */

import { ControlBindings } from '../../types/game';

export interface InputState {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 to 1
  handbrake: boolean;
  nitro: boolean;
  reverse: boolean;
  resetCarJustPressed: boolean;
  cameraJustPressed: boolean;
  headlightsJustPressed: boolean;
  pauseJustPressed: boolean;
  hornHeld: boolean;
  gamepadConnected: boolean;
  gamepadId: string;
}

export class InputManager {
  private bindings: ControlBindings;
  private heldKeys: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();

  // Mobile Touch Inputs
  public touchThrottle: number = 0;
  public touchBrake: number = 0;
  public touchSteer: number = 0;
  public touchHandbrake: boolean = false;
  public touchNitro: boolean = false;

  private onKeyDownBound = (e: KeyboardEvent) => this.handleKeyDown(e);
  private onKeyUpBound = (e: KeyboardEvent) => this.handleKeyUp(e);
  private onBlurBound = () => this.handleBlur();

  constructor(bindings: ControlBindings) {
    this.bindings = bindings;
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('blur', this.onBlurBound);
    document.addEventListener('visibilitychange', this.onBlurBound);
  }

  public updateBindings(newBindings: ControlBindings) {
    this.bindings = newBindings;
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Prevent default scrolling for game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    if (!this.heldKeys.has(e.code)) {
      this.justPressedKeys.add(e.code);
    }
    this.heldKeys.add(e.code);
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.heldKeys.delete(e.code);
  }

  private handleBlur() {
    this.heldKeys.clear();
    this.justPressedKeys.clear();
    this.touchThrottle = 0;
    this.touchBrake = 0;
    this.touchSteer = 0;
    this.touchHandbrake = false;
    this.touchNitro = false;
  }

  public pollInputs(): InputState {
    let throttle = 0;
    let brake = 0;
    let steer = 0;
    let handbrake = false;
    let nitro = false;
    let reverse = false;

    let resetCar = this.justPressedKeys.has(this.bindings.resetCar);
    let changeCamera = this.justPressedKeys.has(this.bindings.changeCamera);
    let headlights = this.justPressedKeys.has(this.bindings.headlights);
    let pause = this.justPressedKeys.has('Escape') || this.justPressedKeys.has('KeyP');
    const horn = this.heldKeys.has(this.bindings.horn);

    // Keyboard bindings
    if (this.heldKeys.has(this.bindings.throttle) || this.heldKeys.has('ArrowUp')) throttle = 1.0;
    if (this.heldKeys.has(this.bindings.brake) || this.heldKeys.has('ArrowDown')) {
      brake = 1.0;
      reverse = true;
    }
    if (this.heldKeys.has(this.bindings.steerLeft) || this.heldKeys.has('ArrowLeft')) steer -= 1.0;
    if (this.heldKeys.has(this.bindings.steerRight) || this.heldKeys.has('ArrowRight')) steer += 1.0;
    if (this.heldKeys.has(this.bindings.handbrake)) handbrake = true;
    if (this.heldKeys.has(this.bindings.nitro)) nitro = true;

    // Mobile touch overlay blending
    if (this.touchThrottle > 0) throttle = Math.max(throttle, this.touchThrottle);
    if (this.touchBrake > 0) {
      brake = Math.max(brake, this.touchBrake);
      reverse = true;
    }
    if (Math.abs(this.touchSteer) > 0.05) steer = this.touchSteer;
    if (this.touchHandbrake) handbrake = true;
    if (this.touchNitro) nitro = true;

    // Gamepad API polling
    let gamepadConnected = false;
    let gamepadId = '';

    const gamepads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp) continue;
      gamepadConnected = true;
      gamepadId = gp.id;

      const deadzone = this.bindings.gamepadDeadzone || 0.12;

      // Left analog stick X-axis steering
      const stickX = gp.axes[0] || 0;
      if (Math.abs(stickX) > deadzone) {
        steer = (stickX - Math.sign(stickX) * deadzone) / (1.0 - deadzone);
      }

      // Analog Triggers (RT = Accelerate, LT = Brake)
      const triggerThrottle = gp.buttons[7] ? gp.buttons[7].value : 0;
      const triggerBrake = gp.buttons[6] ? gp.buttons[6].value : 0;

      if (triggerThrottle > 0.05) throttle = Math.max(throttle, triggerThrottle);
      if (triggerBrake > 0.05) {
        brake = Math.max(brake, triggerBrake);
        if (triggerBrake > 0.3) reverse = true;
      }

      // Gamepad Buttons
      // A (0): Handbrake
      if (gp.buttons[0]?.pressed) handbrake = true;
      // B (1) or RB (5): Nitro
      if (gp.buttons[1]?.pressed || gp.buttons[5]?.pressed) nitro = true;
      // X (2): Reverse/Brake
      if (gp.buttons[2]?.pressed) {
        brake = 1.0;
        reverse = true;
      }
      // Y (3): Camera toggle
      if (gp.buttons[3]?.pressed) changeCamera = true;
      // Select (8): Reset car
      if (gp.buttons[8]?.pressed) resetCar = true;
      // Start (9): Pause
      if (gp.buttons[9]?.pressed) pause = true;

      // D-Pad
      if (gp.buttons[14]?.pressed) steer = -1.0; // D-pad left
      if (gp.buttons[15]?.pressed) steer = 1.0; // D-pad right
      if (gp.buttons[12]?.pressed) throttle = 1.0; // D-pad up
      if (gp.buttons[13]?.pressed) {
        brake = 1.0;
        reverse = true;
      } // D-pad down

      break; // prioritize first active gamepad
    }

    // Clear single-frame just-pressed buffer
    this.justPressedKeys.clear();

    return {
      throttle: Math.max(0, Math.min(1.0, throttle)),
      brake: Math.max(0, Math.min(1.0, brake)),
      steer: Math.max(-1.0, Math.min(1.0, steer * this.bindings.steeringSensitivity)),
      handbrake,
      nitro,
      reverse,
      resetCarJustPressed: resetCar,
      cameraJustPressed: changeCamera,
      headlightsJustPressed: headlights,
      pauseJustPressed: pause,
      hornHeld: horn,
      gamepadConnected,
      gamepadId,
    };
  }

  /**
   * Triggers dual-motor rumble haptics on supported gamepads
   */
  public triggerGamepadHaptics(durationMs = 150, weakMagnitude = 0.5, strongMagnitude = 0.8) {
    const gamepads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp || !gp.vibrationActuator) continue;
      try {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude,
          strongMagnitude,
        });
      } catch {}
    }
  }

  public dispose() {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('blur', this.onBlurBound);
    document.removeEventListener('visibilitychange', this.onBlurBound);
  }
}
