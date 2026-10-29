//! Apex Horizon - AI Traffic Simulation System in Rust
//! Handles autonomous vehicle pathfinding, speed limits, forward obstacle detection, and collision queries.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficWaypoint {
    pub x: f32,
    pub z: f32,
    pub speed_limit_ms: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficRoute {
    pub id: String,
    pub waypoints: Vec<TrafficWaypoint>,
    pub is_loop: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficVehicle {
    pub id: usize,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub yaw: f32,
    pub speed_ms: f32,
    pub route_id: usize,
    pub waypoint_idx: usize,
    pub braking: bool,
}

pub struct TrafficSystem {
    pub routes: Vec<TrafficRoute>,
    pub vehicles: Vec<TrafficVehicle>,
}

impl TrafficSystem {
    pub fn new() -> Self {
        let routes = vec![
            TrafficRoute {
                id: "highway_north".into(),
                is_loop: false,
                waypoints: vec![
                    TrafficWaypoint { x: 286.0, z: -420.0, speed_limit_ms: 28.0 },
                    TrafficWaypoint { x: 286.0, z: -200.0, speed_limit_ms: 32.0 },
                    TrafficWaypoint { x: 286.0, z: 0.0, speed_limit_ms: 34.0 },
                    TrafficWaypoint { x: 286.0, z: 200.0, speed_limit_ms: 32.0 },
                    TrafficWaypoint { x: 286.0, z: 420.0, speed_limit_ms: 28.0 },
                ],
            },
            TrafficRoute {
                id: "highway_south".into(),
                is_loop: false,
                waypoints: vec![
                    TrafficWaypoint { x: 274.0, z: 420.0, speed_limit_ms: 30.0 },
                    TrafficWaypoint { x: 274.0, z: 200.0, speed_limit_ms: 34.0 },
                    TrafficWaypoint { x: 274.0, z: 0.0, speed_limit_ms: 32.0 },
                    TrafficWaypoint { x: 274.0, z: -200.0, speed_limit_ms: 30.0 },
                    TrafficWaypoint { x: 274.0, z: -420.0, speed_limit_ms: 28.0 },
                ],
            },
            TrafficRoute {
                id: "coastal_boulevard".into(),
                is_loop: false,
                waypoints: vec![
                    TrafficWaypoint { x: -264.0, z: -380.0, speed_limit_ms: 22.0 },
                    TrafficWaypoint { x: -264.0, z: -150.0, speed_limit_ms: 24.0 },
                    TrafficWaypoint { x: -264.0, z: 100.0, speed_limit_ms: 22.0 },
                    TrafficWaypoint { x: -264.0, z: 380.0, speed_limit_ms: 20.0 },
                ],
            },
        ];

        let mut vehicles = Vec::new();
        for i in 0..14 {
            let route_idx = i % routes.len();
            let route = &routes[route_idx];
            let wp = &route.waypoints[0];
            let next_wp = &route.waypoints[1];
            let yaw = (next_wp.x - wp.x).atan2(next_wp.z - wp.z);

            vehicles.push(TrafficVehicle {
                id: i,
                x: wp.x,
                y: 0.0,
                z: wp.z + (i as f32 * 50.0) % 600.0 - 300.0,
                yaw,
                speed_ms: 22.0,
                route_id: route_idx,
                waypoint_idx: 1,
                braking: false,
            });
        }

        Self { routes, vehicles }
    }

    pub fn update(&mut self, player_pos: (f32, f32), player_speed: f32, dt: f32) {
        let vehicle_count = self.vehicles.len();
        for i in 0..vehicle_count {
            let route_idx = self.vehicles[i].route_id;
            let route = &self.routes[route_idx];
            let wp_idx = self.vehicles[i].waypoint_idx;
            let target_wp = &route.waypoints[wp_idx];

            let dx = target_wp.x - self.vehicles[i].x;
            let dz = target_wp.z - self.vehicles[i].z;
            let dist = (dx * dx + dz * dz).sqrt();

            if dist < 6.0 {
                if wp_idx < route.waypoints.len() - 1 {
                    self.vehicles[i].waypoint_idx += 1;
                } else if route.is_loop {
                    self.vehicles[i].waypoint_idx = 0;
                } else {
                    // Respawn
                    self.vehicles[i].x = route.waypoints[0].x;
                    self.vehicles[i].z = route.waypoints[0].z;
                    self.vehicles[i].waypoint_idx = 1;
                }
            }

            // Steer toward waypoint
            let target_yaw = dx.atan2(dz);
            let mut delta_yaw = target_yaw - self.vehicles[i].yaw;
            while delta_yaw > std::f32::consts::PI { delta_yaw -= std::f32::consts::PI * 2.0; }
            while delta_yaw < -std::f32::consts::PI { delta_yaw += std::f32::consts::PI * 2.0; }
            self.vehicles[i].yaw += delta_yaw.signum() * delta_yaw.abs().min(2.5 * dt);

            // Obstacle braking (Player check)
            let px = player_pos.0 - self.vehicles[i].x;
            let pz = player_pos.1 - self.vehicles[i].z;
            let forward_dist = self.vehicles[i].yaw.sin() * px + self.vehicles[i].yaw.cos() * pz;
            let lateral_dist = (self.vehicles[i].yaw.cos() * px - self.vehicles[i].yaw.sin() * pz).abs();

            let mut desired_speed = target_wp.speed_limit_ms;
            let mut braking = false;

            if forward_dist > 0.5 && forward_dist < 25.0 && lateral_dist < 3.2 {
                braking = true;
                desired_speed = (player_speed - 2.0).max(0.0);
                if forward_dist < 8.0 {
                    desired_speed = 0.0;
                }
            }

            if self.vehicles[i].speed_ms < desired_speed {
                self.vehicles[i].speed_ms = (self.vehicles[i].speed_ms + 6.0 * dt).min(desired_speed);
            } else if self.vehicles[i].speed_ms > desired_speed {
                self.vehicles[i].speed_ms = (self.vehicles[i].speed_ms - if braking { 18.0 } else { 8.0 } * dt).max(desired_speed);
            }

            self.vehicles[i].braking = braking;
            self.vehicles[i].x += self.vehicles[i].yaw.sin() * self.vehicles[i].speed_ms * dt;
            self.vehicles[i].z += self.vehicles[i].yaw.cos() * self.vehicles[i].speed_ms * dt;
        }
    }

    pub fn check_player_collision(&self, px: f32, pz: f32) -> Option<&TrafficVehicle> {
        for v in &self.vehicles {
            let dist = ((px - v.x).powi(2) + (pz - v.z).powi(2)).sqrt();
            if dist < 3.2 {
                return Some(v);
            }
        }
        None
    }
}
