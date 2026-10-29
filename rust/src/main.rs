//! Apex Horizon - High-Performance Native Rust Open-World Driving Simulator
//! Targets Linux (Vulkan / Wayland / X11), Windows (DirectX 12 / Vulkan), and macOS (Metal).

use apex_horizon_core::{
    step_vehicle, OpenWorldMap, PhysicsInputs, TrafficSystem, VehicleDamage, VehicleModel,
    VehicleSpec, VehicleState,
};
use std::time::Instant;

fn main() {
    println!("============================================================");
    println!("  APEX HORIZON: OPEN WORLD DRIVING SIMULATOR (RUST ENGINE)  ");
    println!("  Version: 1.0.0 | High-Performance Native Edition           ");
    println!("============================================================");

    let vehicle_spec = VehicleSpec::get(VehicleModel::ScuderiaCavalloF80);
    println!("Loaded Active Vehicle: {}", vehicle_spec.name);
    println!("Power: {} HP | Top Speed: {} km/h | 0-100: {}s",
        vehicle_spec.horsepower, vehicle_spec.top_speed_kmh, vehicle_spec.zero_to_hundred
    );

    let mut state = VehicleState::default();
    let damage = VehicleDamage::default();
    let mut traffic = TrafficSystem::new();

    println!("Initialized AI Traffic System: {} active vehicles", traffic.vehicles.len());
    println!("World Terrain: Mediterranean Riviera Coastline & Interstate 99 Highway");

    let inputs = PhysicsInputs {
        throttle: 1.0,
        brake: 0.0,
        steer: 0.0,
        handbrake: false,
        nitro: true,
        reverse: false,
    };

    println!("\nSimulating 60 FPS Native Physics Tick Loop...");
    let start_time = Instant::now();
    for tick in 0..60 {
        let dt = 0.016667;
        step_vehicle(&mut state, &inputs, &vehicle_spec, &damage, dt);
        traffic.update((state.x, state.z), state.speed_ms, dt);
        state.y = OpenWorldMap::get_elevation(state.x, state.z);

        if tick % 15 == 0 {
            println!(
                "Tick #{:02} | Pos: ({:.1}, {:.1}) | Speed: {:.1} km/h | Gear: {} | RPM: {:.0} | Drift: {}",
                tick,
                state.x,
                state.z,
                state.speed_ms * 3.6,
                state.gear,
                state.rpm,
                state.is_drifting
            );
        }
    }

    let elapsed = start_time.elapsed();
    println!("\nCompleted 60 simulation frames in {:?}", elapsed);
    println!("Average tick time: {:?}", elapsed / 60);
    println!("Native Rust simulation ready for Vulkan / Metal / DirectX rendering.");
}
