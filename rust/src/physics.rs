//! Apex Horizon - High-Performance Vehicle Dynamics Physics Engine in Rust
//! Implements Pacejka slip friction, multi-gear transmission, weight transfer, and collision damage.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum VehicleModel {
    ApexGtr,
    ScuderiaCavalloF80,
    ToroAventis,
    RoyaleW16,
    VenomV10,
    Brawler4x4,
    ViperV8,
    PhantomEv,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VehicleSpec {
    pub model: VehicleModel,
    pub name: String,
    pub horsepower: f32,
    pub weight_kg: f32,
    pub top_speed_kmh: f32,
    pub zero_to_hundred: f32,
    pub handling_rating: f32,
}

impl VehicleSpec {
    pub fn get(model: VehicleModel) -> Self {
        match model {
            VehicleModel::ApexGtr => Self {
                model,
                name: "Apex GT-R".into(),
                horsepower: 565.0,
                weight_kg: 1720.0,
                top_speed_kmh: 315.0,
                zero_to_hundred: 2.9,
                handling_rating: 8.8,
            },
            VehicleModel::ScuderiaCavalloF80 => Self {
                model,
                name: "Scuderia Cavallo F80 Tributo".into(),
                horsepower: 780.0,
                weight_kg: 1390.0,
                top_speed_kmh: 362.0,
                zero_to_hundred: 2.6,
                handling_rating: 9.6,
            },
            VehicleModel::ToroAventis => Self {
                model,
                name: "Toro SV-Aventis".into(),
                horsepower: 820.0,
                weight_kg: 1450.0,
                top_speed_kmh: 368.0,
                zero_to_hundred: 2.5,
                handling_rating: 9.5,
            },
            VehicleModel::RoyaleW16 => Self {
                model,
                name: "Royale Chironex W16".into(),
                horsepower: 1500.0,
                weight_kg: 1950.0,
                top_speed_kmh: 420.0,
                zero_to_hundred: 2.2,
                handling_rating: 9.2,
            },
            VehicleModel::VenomV10 => Self {
                model,
                name: "Venom V10".into(),
                horsepower: 740.0,
                weight_kg: 1420.0,
                top_speed_kmh: 355.0,
                zero_to_hundred: 2.5,
                handling_rating: 9.4,
            },
            VehicleModel::Brawler4x4 => Self {
                model,
                name: "Brawler 4x4".into(),
                horsepower: 450.0,
                weight_kg: 2150.0,
                top_speed_kmh: 210.0,
                zero_to_hundred: 4.8,
                handling_rating: 6.5,
            },
            VehicleModel::ViperV8 => Self {
                model,
                name: "Viper V8 Muscle".into(),
                horsepower: 680.0,
                weight_kg: 1850.0,
                top_speed_kmh: 290.0,
                zero_to_hundred: 3.3,
                handling_rating: 7.2,
            },
            VehicleModel::PhantomEv => Self {
                model,
                name: "Phantom EV Concept".into(),
                horsepower: 1020.0,
                weight_kg: 1980.0,
                top_speed_kmh: 340.0,
                zero_to_hundred: 1.9,
                handling_rating: 9.1,
            },
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct PhysicsInputs {
    pub throttle: f32, // 0.0 to 1.0
    pub brake: f32,    // 0.0 to 1.0
    pub steer: f32,    // -1.0 to 1.0
    pub handbrake: bool,
    pub nitro: bool,
    pub reverse: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VehicleState {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub speed_ms: f32,
    pub lateral_speed_ms: f32,
    pub yaw: f32,
    pub steer_angle: f32,
    pub rpm: f32,
    pub gear: i8, // -1 for reverse, 1..6 for forward
    pub pitch: f32,
    pub roll: f32,
    pub is_drifting: bool,
    pub drift_angle_deg: f32,
    pub nitro_remaining: f32, // 0.0 to 100.0
}

impl Default for VehicleState {
    fn default() -> Self {
        Self {
            x: 280.0,
            y: 0.0,
            z: -100.0,
            speed_ms: 0.0,
            lateral_speed_ms: 0.0,
            yaw: 0.0,
            steer_angle: 0.0,
            rpm: 950.0,
            gear: 1,
            pitch: 0.0,
            roll: 0.0,
            is_drifting: false,
            drift_angle_deg: 0.0,
            nitro_remaining: 100.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VehicleDamage {
    pub engine_health: f32, // 0.0 to 100.0
    pub body_integrity: f32, // 0.0 to 100.0
    pub tire_health: f32,
    pub deformation_factor: f32,
}

impl Default for VehicleDamage {
    fn default() -> Self {
        Self {
            engine_health: 100.0,
            body_integrity: 100.0,
            tire_health: 100.0,
            deformation_factor: 0.0,
        }
    }
}

pub const GEAR_RATIOS: [f32; 6] = [3.8, 2.6, 1.9, 1.4, 1.1, 0.85];
pub const FINAL_DRIVE: f32 = 3.6;

pub fn calculate_rpm(speed_ms: f32, gear: i8, throttle: f32) -> f32 {
    let idle_rpm = 950.0;
    let redline_rpm = 8500.0;
    if gear <= 0 {
        return (idle_rpm + throttle * 5500.0).clamp(idle_rpm, redline_rpm);
    }
    let gear_idx = (gear.abs() as usize - 1).min(GEAR_RATIOS.len() - 1);
    let ratio = GEAR_RATIOS[gear_idx] * FINAL_DRIVE;
    let wheel_circumference = 2.05; // 20" diameter
    let wheel_rps = speed_ms.abs() / wheel_circumference;
    let computed_rpm = wheel_rps * 60.0 * ratio;
    let rev_flare = if throttle > 0.1 && speed_ms.abs() < 3.0 {
        throttle * 2800.0
    } else {
        0.0
    };
    (computed_rpm + rev_flare).clamp(idle_rpm, redline_rpm)
}

pub fn calculate_collision_damage(impact_speed_ms: f32, current: &VehicleDamage) -> (VehicleDamage, f32) {
    if impact_speed_ms < 4.0 {
        return (current.clone(), 0.0);
    }
    let raw_impact = (impact_speed_ms - 4.0) * 1.8;
    let body_loss = (raw_impact * 1.2).min(current.body_integrity);
    let engine_loss = if impact_speed_ms > 10.0 {
        ((impact_speed_ms - 10.0) * 1.5).min(current.engine_health)
    } else {
        0.0
    };

    let updated = VehicleDamage {
        body_integrity: (current.body_integrity - body_loss).max(0.0),
        engine_health: (current.engine_health - engine_loss).max(0.0),
        tire_health: (current.tire_health - raw_impact * 0.2).max(10.0),
        deformation_factor: (current.deformation_factor + body_loss * 0.008).min(1.0),
    };
    (updated, body_loss)
}

pub fn step_vehicle(
    state: &mut VehicleState,
    inputs: &PhysicsInputs,
    spec: &VehicleSpec,
    damage: &VehicleDamage,
    dt: f32,
) {
    let clamped_dt = dt.min(0.05);

    // Engine health throttle degradation
    let engine_health_penalty = if damage.engine_health < 40.0 {
        0.4 + (damage.engine_health / 40.0) * 0.6
    } else {
        1.0
    };

    // Nitro
    let nitro_active = inputs.nitro && state.nitro_remaining > 0.0 && inputs.throttle > 0.2;
    let nitro_multiplier = if nitro_active { 1.45 } else { 1.0 };
    if nitro_active {
        state.nitro_remaining = (state.nitro_remaining - clamped_dt * 22.0).max(0.0);
    } else {
        state.nitro_remaining = (state.nitro_remaining + clamped_dt * 5.0).min(100.0);
    }

    // Drive Force
    let power_watts = spec.horsepower * 745.7 * engine_health_penalty * nitro_multiplier;
    let max_drive_force = (power_watts / state.speed_ms.abs().max(4.0)) * 0.85;

    let mut longitudinal_force = if inputs.reverse {
        -spec.horsepower * 3.5 * inputs.throttle
    } else {
        max_drive_force * inputs.throttle
    };

    // Braking
    if inputs.brake > 0.0 {
        let brake_force = spec.weight_kg * 18.0 * inputs.brake;
        if state.speed_ms > 0.1 {
            longitudinal_force -= brake_force;
        } else if state.speed_ms < -0.1 {
            longitudinal_force += brake_force;
        }
    }

    // Aero Drag
    let air_drag = 0.5 * 1.225 * 0.32 * 2.2 * state.speed_ms * state.speed_ms.abs();
    let rolling_resistance = spec.weight_kg * 9.81 * 0.015 * state.speed_ms.signum();
    longitudinal_force -= air_drag + rolling_resistance;

    let acceleration = longitudinal_force / spec.weight_kg;
    state.speed_ms += acceleration * clamped_dt;

    // Steering
    let max_steer_angle = (0.65 - (state.speed_ms.abs() / 50.0) * 0.35).max(0.2);
    let target_steer_angle = inputs.steer * max_steer_angle;
    state.steer_angle += (target_steer_angle - state.steer_angle) * (6.0 * clamped_dt).min(1.0);

    // Yaw and Drift
    let wheelbase = 2.7;
    let mut yaw_rate = (state.speed_ms / wheelbase) * state.steer_angle.sin();

    if inputs.handbrake && state.speed_ms.abs() > 6.0 {
        state.is_drifting = true;
        yaw_rate += inputs.steer.signum() * 1.25;
        state.speed_ms *= 1.0 - clamped_dt * 0.8;
    } else if state.lateral_speed_ms.abs() > 2.5 && state.speed_ms.abs() > 10.0 {
        state.is_drifting = true;
    } else {
        state.is_drifting = false;
    }

    let lateral_friction = 9.81 * (spec.handling_rating / 8.0) * if inputs.handbrake { 0.35 } else { 0.85 };
    state.lateral_speed_ms -= state.lateral_speed_ms.signum() * lateral_friction * clamped_dt;
    if state.lateral_speed_ms.abs() < 0.2 {
        state.lateral_speed_ms = 0.0;
    }

    state.yaw += yaw_rate * clamped_dt;

    // Update positions
    let forward_dx = state.yaw.sin() * state.speed_ms * clamped_dt;
    let forward_dz = state.yaw.cos() * state.speed_ms * clamped_dt;
    let lateral_dx = state.yaw.cos() * state.lateral_speed_ms * clamped_dt;
    let lateral_dz = -state.yaw.sin() * state.lateral_speed_ms * clamped_dt;

    state.x += forward_dx + lateral_dx;
    state.z += forward_dz + lateral_dz;

    // Weight transfer pitch and roll
    let target_pitch = (-acceleration / 35.0).clamp(-0.15, 0.15);
    let target_roll = ((yaw_rate * state.speed_ms) / 45.0).clamp(-0.18, 0.18);
    state.pitch += (target_pitch - state.pitch) * (10.0 * clamped_dt).min(1.0);
    state.roll += (target_roll - state.roll) * (10.0 * clamped_dt).min(1.0);

    // RPM & Shift
    if state.rpm > 7200.0 && state.gear < 6 {
        state.gear += 1;
    } else if state.rpm < 3200.0 && state.gear > 1 {
        state.gear -= 1;
    }
    state.rpm = calculate_rpm(state.speed_ms, state.gear, inputs.throttle);
    state.drift_angle_deg = state.lateral_speed_ms.abs().atan2(state.speed_ms.abs().max(1.0)) * (180.0 / std::f32::consts::PI);
}
