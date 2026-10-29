# ==============================================================================
# Apex Horizon v1.0.0 - Windows 1-Line Silent Installer & Launcher
# Target: Windows 11 IoT Enterprise LTSC, Windows 11, Windows 10
# Features: DirectX 12 / Vulkan runtime, Start Menu shortcut, portable execution
# ==============================================================================

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = "Stop"

Write-Host "`n🏎️  Apex Horizon - Open World Driving Simulator (v1.0.0)" -ForegroundColor Red
Write-Host "Targeting Windows 11 IoT Enterprise LTSC & Gaming Systems`n" -ForegroundColor Cyan

$InstallPath = "$env:LOCALAPPDATA\ApexHorizon"
$ExeName = "ApexHorizon-v1.0.0-Windows-x64-Setup.exe"
$ReleaseUrl = "https://github.com/apexhorizon/apex-horizon/releases/download/v1.0.0/$ExeName"
$DestExe = Join-Path $InstallPath $ExeName

if (!(Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
}

Write-Host "📦 Downloading $ExeName from GitHub Releases..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $ReleaseUrl -OutFile $DestExe

# Create Desktop Shortcut
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut(Join-Path $DesktopPath "Apex Horizon.lnk")
$Shortcut.TargetPath = $DestExe
$Shortcut.Description = "Apex Horizon - Open World 3D Driving Simulator"
$Shortcut.Save()

Write-Host "`n✓ Installation complete! Desktop shortcut created." -ForegroundColor Green
Write-Host "Launching Apex Horizon..." -ForegroundColor Cyan

Start-Process $DestExe
