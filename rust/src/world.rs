//! Apex Horizon - Open World Procedural Map in Rust
//! Implements elevation queries, Mediterranean coast landmarks, tunnels, and district queries.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DistrictZone {
    InterstateHighway,
    HorizonFestivalHub,
    MediterraneanRiviera,
    DowntownSkyline,
    FujimiMountainPass,
    AirportFlightDeck,
    PortIndustrialDocks,
    PitLaneRepairBay,
}

pub struct OpenWorldMap;

impl OpenWorldMap {
    pub fn get_elevation(x: f32, z: f32) -> f32 {
        // Mountain Pass region (X: -300 to -150, Z: -300 to -100)
        if x < -140.0 && z < -80.0 {
            let dist_to_center = ((x + 220.0).powi(2) + (z + 200.0).powi(2)).sqrt();
            let mountain_peak = (48.0 - (dist_to_center / 160.0) * 48.0).max(0.0);
            let road_dist = (((z + 180.0) * 0.05).sin() * 35.0 + (x + 220.0)).abs();
            if road_dist < 12.0 {
                return mountain_peak * 0.45;
            }
            return mountain_peak;
        }

        // Airport stunt ramp (X: 340 to 365, Z: -235 to -205)
        if x >= 340.0 && x <= 365.0 && z >= -235.0 && z <= -205.0 {
            let progress = (z - -235.0) / 30.0;
            return (progress * 8.5).max(0.0);
        }

        // Coastal ocean area (X < -320)
        if x < -320.0 {
            return -2.5;
        }

        0.0
    }

    pub fn get_zone(x: f32, z: f32) -> DistrictZone {
        if x > 260.0 && z < -200.0 {
            DistrictZone::HorizonFestivalHub
        } else if x > 220.0 {
            DistrictZone::InterstateHighway
        } else if x < -180.0 && z < -80.0 {
            DistrictZone::FujimiMountainPass
        } else if x < -180.0 {
            DistrictZone::MediterraneanRiviera
        } else if x > 260.0 && z < -150.0 {
            DistrictZone::AirportFlightDeck
        } else if z > 160.0 {
            DistrictZone::PortIndustrialDocks
        } else if ((x - 180.0).powi(2) + (z - 30.0).powi(2)).sqrt() < 16.0 {
            DistrictZone::PitLaneRepairBay
        } else {
            DistrictZone::DowntownSkyline
        }
    }
}
