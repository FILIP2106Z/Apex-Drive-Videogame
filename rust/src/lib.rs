//! Apex Horizon - Core Rust Engine Library
//! Exposes physics, traffic, world generation, and audio modules.

pub mod physics;
pub mod traffic;
pub mod world;
pub mod audio;

pub use physics::{step_vehicle, calculate_collision_damage, VehicleModel, VehicleSpec, VehicleState, VehicleDamage, PhysicsInputs};
pub use traffic::TrafficSystem;
pub use world::{OpenWorldMap, DistrictZone};
pub use audio::ProceduralAudioEngine;
