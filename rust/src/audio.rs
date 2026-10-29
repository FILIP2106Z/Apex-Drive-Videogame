//! Apex Horizon - Low-Latency Audio Engine in Rust
//! Synthesizes multi-harmonic vehicle engine tones, turbo whistle, tire screech, and crash impacts.

pub struct ProceduralAudioEngine {
    pub is_muted: bool,
    pub master_volume: f32,
}

impl ProceduralAudioEngine {
    pub fn new() -> Self {
        Self {
            is_muted: false,
            master_volume: 0.8,
        }
    }

    pub fn calculate_engine_frequency(&self, rpm: f32, is_electric: bool) -> (f32, f32) {
        if is_electric {
            let freq = 180.0 + (rpm / 8500.0) * 1200.0;
            (freq, freq * 1.5)
        } else {
            let fundamental = (rpm / 60.0) * 2.0;
            (fundamental, fundamental * 2.0)
        }
    }

    pub fn calculate_tire_squeal_gain(&self, slip_amount: f32, speed_ms: f32) -> f32 {
        if self.is_muted || slip_amount < 0.15 || speed_ms.abs() < 3.0 {
            0.0
        } else {
            ((slip_amount - 0.15) * 0.4).min(0.28)
        }
    }
}
