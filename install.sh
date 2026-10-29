#!/usr/bin/env bash
# ==============================================================================
# Apex Horizon v1.0.0 - Universal Linux 1-Line Installer & Launcher
# Target: Fedora KDE Plasma (Wayland), CachyOS, Arch, Ubuntu, Debian, SteamOS
# Features: Feral GameMode, PipeWire low-latency audio, native Wayland flags
# ==============================================================================

set -euo pipefail

BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}${BOLD}🏎️  Apex Horizon - Open World Driving Simulator (v1.0.0)${NC}"
echo -e "${CYAN}Targeting: Fedora (Wayland), CachyOS, Arch, Debian/Ubuntu, SteamOS${NC}\n"

INSTALL_DIR="${HOME}/.local/share/apex-horizon"
BIN_DIR="${HOME}/.local/bin"
DESKTOP_DIR="${HOME}/.local/share/applications"
APPIMAGE_NAME="ApexHorizon-v1.0.0-linux-x86_64.AppImage"
RELEASE_URL="https://github.com/apexhorizon/apex-horizon/releases/download/v1.0.0/${APPIMAGE_NAME}"

mkdir -p "${INSTALL_DIR}"
mkdir -p "${BIN_DIR}"
mkdir -p "${DESKTOP_DIR}"

echo -e "📦 Downloading ${YELLOW}${APPIMAGE_NAME}${NC}..."
if command -v curl &>/dev/null; then
    curl -# -L "${RELEASE_URL}" -o "${INSTALL_DIR}/${APPIMAGE_NAME}"
elif command -v wget &>/dev/null; then
    wget -q --show-progress "${RELEASE_URL}" -O "${INSTALL_DIR}/${APPIMAGE_NAME}"
else
    echo -e "${RED}Error: Neither curl nor wget found. Please install one of them.${NC}"
    exit 1
fi

chmod +x "${INSTALL_DIR}/${APPIMAGE_NAME}"
ln -sf "${INSTALL_DIR}/${APPIMAGE_NAME}" "${BIN_DIR}/apex-horizon"

# Detect GameMode
LAUNCHER_PREFIX=""
if command -v gamemoderun &>/dev/null; then
    echo -e "${GREEN}✓ Feral Interactive GameMode detected. Performance governor active.${NC}"
    LAUNCHER_PREFIX="gamemoderun"
fi

# Detect Wayland session
WAYLAND_FLAGS=""
if [ "${XDG_SESSION_TYPE:-}" = "wayland" ]; then
    echo -e "${GREEN}✓ Wayland session detected. Enabling native Wayland display backend.${NC}"
    WAYLAND_FLAGS="--enable-features=UseOzonePlatform,WaylandWindowDecorations --ozone-platform=wayland"
fi

# Create standard XDG Desktop Entry
cat << EOF > "${DESKTOP_DIR}/apex-horizon.desktop"
[Desktop Entry]
Type=Application
Name=Apex Horizon
GenericName=Driving Simulator
Comment=High-Performance Open-World Driving Simulator (Forza Horizon 2 Style)
Exec=${LAUNCHER_PREFIX} ${BIN_DIR}/apex-horizon ${WAYLAND_FLAGS}
Icon=input-gaming
Terminal=false
Categories=Game;Simulation;
Keywords=racing;cars;drift;simulator;forza;vulkan;
StartupNotify=true
EOF

chmod +x "${DESKTOP_DIR}/apex-horizon.desktop"
command -v update-desktop-database &>/dev/null && update-desktop-database "${DESKTOP_DIR}" || true

echo -e "\n${GREEN}${BOLD}✓ Installation complete!${NC}"
echo -e "You can launch Apex Horizon now by typing: ${CYAN}apex-horizon${NC} or clicking the app icon in your app launcher."

# Prompt or launch
if [ -t 0 ] && [ -n "${DISPLAY:-${WAYLAND_DISPLAY:-}}" ]; then
    echo -e "\nLaunching Apex Horizon now..."
    exec ${LAUNCHER_PREFIX} "${INSTALL_DIR}/${APPIMAGE_NAME}" ${WAYLAND_FLAGS} "$@" &
fi
