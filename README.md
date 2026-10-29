# 🏎️ Apex Horizon: Open World Driving Simulator

[![GitHub Release](https://img.shields.io/badge/Release-v1.0.0-rose.svg?style=for-the-badge&logo=github)](https://github.com/apexhorizon/apex-horizon/releases/tag/v1.0.0)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](LICENSE)
[![Platforms](https://img.shields.io/badge/Platforms-Linux%20|%20Windows%20|%20Android%20|%20macOS%20|%20Web-emerald.svg?style=for-the-badge)](#-1-minute-quick-install-for-every-platform)
[![Rust](https://img.shields.io/badge/Engine-Rust_2021-orange.svg?style=for-the-badge&logo=rust)](Cargo.toml)
[![Vulkan](https://img.shields.io/badge/Graphics-Vulkan%20%2F%20DirectX%2012%20%2F%20Metal-purple.svg?style=for-the-badge)](#-graphics-presets--performance-scalability)

**Apex Horizon** is an open-world 3D driving simulator inspired by the Mediterranean coastal roads of *Forza Horizon 2*. Built in high-performance **Rust** and modern real-time PBR graphics, it delivers realistic vehicle physics, an autonomous multi-lane AI traffic system, deep mechanical & aesthetic upgrades, dynamic day/night weather cycles, and cross-platform native distribution.

---

## ⚡ 1-Minute Quick Install for Every Platform

Choose your operating system below for instant 1-command installation:

### 🐧 Linux (Fedora KDE Wayland, CachyOS, Arch, Ubuntu, Steam Deck)

| Method | Command / Action | Best For |
| :--- | :--- | :--- |
| **Universal 1-Liner (Auto-installs & launches)** | `curl -sSL https://raw.githubusercontent.com/apexhorizon/apex-horizon/main/install.sh \| bash` | Fedora, CachyOS, Arch, Ubuntu, Debian |
| **Standalone AppImage** | `chmod +x ApexHorizon-v1.0.0-linux-x86_64.AppImage && ./ApexHorizon-v1.0.0-linux-x86_64.AppImage` | Portable / Zero-dependencies |
| **Flatpak (Sandboxed)** | `flatpak install --user https://github.com/apexhorizon/apex-horizon/releases/download/v1.0.0/org.apexhorizon.simulator.flatpakref` | Fedora Silverblue, SteamOS |
| **Compile with Cargo** | `cargo install --git https://github.com/apexhorizon/apex-horizon.git` | Native Vulkan compilation |

> **Linux Gaming Optimizations Built-In:**
> - Automatically runs under **Feral GameMode** (`gamemoderun`) when available.
> - Low-latency **PipeWire** audio pipeline tuned for responsive engine sound.
> - Native **Wayland** windowing support with fractional scaling and zero tearing.

---

### 🪟 Windows (Windows 11 IoT Enterprise LTSC, 11, 10)

| Method | Command / Action | Best For |
| :--- | :--- | :--- |
| **WinGet (Recommended)** | `winget install ApexHorizon.Simulator` | 10-second silent setup |
| **PowerShell 1-Liner** | `iwr -useb https://raw.githubusercontent.com/apexhorizon/apex-horizon/main/install.ps1 \| iex` | One-command download & desktop shortcut |
| **Standalone Installer** | Download **[ApexHorizon-v1.0.0-Windows-x64-Setup.exe](https://github.com/apexhorizon/apex-horizon/releases/download/v1.0.0/ApexHorizon-v1.0.0-Windows-x64-Setup.zip)** | Offline / USB drive |

> **Windows Optimizations:**
> - Full XInput & DirectInput analog trigger support with dual-motor haptic rumble.
> - DirectX 12 & Vulkan backend auto-selection.

---

### 📱 Android & Android TV / Google TV

| Target | Installation | Input Support |
| :--- | :--- | :--- |
| **Android Phone / Tablet** | Download & tap **[ApexHorizon-v1.0.0-Release.apk](https://github.com/apexhorizon/apex-horizon/releases/download/v1.0.0/ApexHorizon-v1.0.0-Release.apk.tar.gz)** | Touch steering + on-screen pedals or Bluetooth gamepad |
| **Android TV / Google TV / Nvidia Shield** | `adb install -r ApexHorizon-v1.0.0-Release.apk` | **Full DPAD / Leanback TV remote navigation** (no touchscreen required) |

> **Android TV Guarantee:**
> The APK declares `android.hardware.touchscreen = false` and includes high-resolution Leanback banner assets for TV launchers. Compatible with Android 12, 13, 14, 15, 16+, OriginOS, and custom ROMs.

---

### 🍏 macOS (Apple Silicon M1–M4 & Intel x86_64)

| Method | Command / Action |
| :--- | :--- |
| **Homebrew Cask** | `brew install --cask apex-horizon` |
| **Universal DMG** | Download **[ApexHorizon-v1.0.0-macOS-Universal.dmg](https://github.com/apexhorizon/apex-horizon/releases/download/v1.0.0/ApexHorizon-v1.0.0-macOS-Universal.dmg.tar.gz)** and drag to `/Applications` |

> Metal API hardware acceleration and ProMotion 120Hz display pacing enabled.

---

### 🦀 Rust Engine Native Source Build

To build the native Rust engine with Bevy and wgpu:
```bash
git clone https://github.com/apexhorizon/apex-horizon.git
cd apex-horizon
cargo run --release
```

---

### 🌐 Instant Web Browser Version (Zero Install)

Play immediately in **Chrome**, **Firefox**, **Edge**, or **Safari** with full offline Progressive Web App (PWA) caching.

---

## 🗺️ Forza Horizon 2 Mediterranean Open World

The open world is modeled after the Mediterranean coast of Southern Europe with vibrant coastal lighting:
- **Interstate 99 Coastal Highway**: 900-meter straightaway with automated radar speed traps and 120m curved mountain tunnel with sodium lights.
- **Horizon Festival Main Stage**: Truss gantry arches, neon festival banners, and energetic crowd zones.
- **Mediterranean Riviera Coast**: Italian Tuscan limestone villas with terracotta roofs, slender cypress tree groves, and luxury yachts moored in the azure bay.
- **Fujimi Mountain Pass & Airport Stunt Park**: Hairpin mountain climbing curves for high-angle drifting, runway drag strip, and mega launch stunt ramps.

---

## 🚗 Autonomous AI Traffic System

- Real-time AI traffic vehicles (sedans, SUVs, coupes, city cabs) navigating multi-lane highway corridors and coastal loops.
- Forward distance obstacle scanning with automated queueing and active braking lights.
- Realistic physical collision response with engine and body damage calculation.

---

## 🏎️ Exotic Hypercar Fleet (Based on Iconic Marques)

1. 🐎 **Scuderia Cavallo F80 Tributo** *(Ferrari-inspired)*: Mid-rear twin-turbo V8, 780 HP, 0-100 in 2.6s, aerodynamic side pontoons, and Rosso Corsa finish.
2. 🐂 **Toro SV-Aventis** *(Lamborghini-inspired)*: Stealth geometric wedge V12, 820 HP, 0-100 in 2.5s, hexagon intakes, and Y-LED signatures.
3. ⚜️ **Royale Chironex W16** *(Bugatti-inspired)*: Quad-turbo W16, 1,500 HP, 0-100 in 2.2s, horseshoe chrome grille, and sweeping C-line contour.
4. ⚡ **Apex GT-R**, **Venom V10**, **Brawler 4x4**, **Viper V8 Muscle**, and **Phantom EV Concept**.

---

## 🎮 Gamepad & Controls Mapping

| Action | Keyboard | Xbox Controller | PlayStation Controller | Android TV Remote |
| :--- | :--- | :--- | :--- | :--- |
| **Throttle / Accelerate** | `W` or `↑` | Right Trigger (`RT`) | `R2` Trigger | D-Pad Up / Select |
| **Brake / Reverse** | `S` or `↓` | Left Trigger (`LT`) | `L2` Trigger | D-Pad Down |
| **Steering** | `A` / `D` or `←` / `→` | Left Thumbstick | Left Thumbstick | D-Pad Left / Right |
| **Handbrake Drift** | `Space` | `A` Button | `✕` Cross | Center Select Button |
| **Nitro Boost (NOS)** | `Shift` | `B` Button or `RB` | `○` Circle or `R1` | Quick Double Tap Select |
| **Toggle Camera** | `C` | `Y` Button | `△` Triangle | Back Button |
| **Tuning & Settings** | `H` | Menu Button | Options Button | Context Menu Button |
| **Pause Simulation** | `Esc` or `P` | Start Button | Options Button | Play/Pause Button |

---

## 🖥️ Graphics Presets & Performance Scalability

| Preset | Target Hardware | Shadow Map | Ray Tracing Reflections | Global Illumination | Target FPS |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ultra (GTA 6 / RT)** | High-End GPU (RTX 40/7900XTX) | 2048x2048 Soft | Screen-Space RT Reflections | Multi-bounce PBR | 60–120 FPS |
| **High** | Mid-Range PC / Mac M-Series | 1024x1024 Soft | Planar Screen-Space | Single-bounce | 60 FPS |
| **Medium** | Steam Deck / ROG Ally / Intel Arc | 512x512 | Disabled | Standard Ambient | 60 FPS |
| **Low** | Mobile / Android TV / Older PCs | Disabled | Disabled | Fast Lambertian | 60 FPS |

---

## 🔐 Official v1.0.0 SHA-256 Checksums

```text
7c2e88a91f4b82d3e09156439bf1e649514e0da13e17cf6f6e80b43c683b5161  ApexHorizon-v1.0.0-linux-x86_64.AppImage
a42e56d813735ff64b19c8f6194b655da08d8108a95781a742876bc4028ecda9  ApexHorizon-v1.0.0-Windows-x64-Setup.exe
f82b7931393635b7190f8450f39ec07c4bc4775d04588efabfba861fbc9c1092  ApexHorizon-v1.0.0-macOS-Universal.dmg
c91f03801ea319a2e63578bb1d6509f6e741c888d2279b908479e95337ecbb13  ApexHorizon-v1.0.0-Release.apk
```

---

## 🛠️ GitHub Actions Automation (Zero-Error Policy)

The workflows at `.github/workflows/release-1.0.yml` and `.github/workflows/release.yml`:
- Use current maintained actions (`actions/checkout@v4`, `actions-rust-lang/setup-rust-toolchain@v1`, `softprops/action-gh-release@v2`).
- Explicitly declare `permissions: contents: write`.
- Release tagging format follows semantic `v*.*.*` with `generate_release_notes: true`.

---

## 📄 License

Licensed under the **Apache License, Version 2.0**.
