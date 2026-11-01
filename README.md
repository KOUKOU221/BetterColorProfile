<p align="center">
  <a href="https://bettercolorprofile.vercel.app/">
    <img src="assets/app_logo.png" alt="Better Color Profile Logo" width="168" />
  </a>
</p>

<h1 align="center">Better Color Profile</h1>
<p align="center">
  <em>Change your screen colors in one click • The modern Windows color profile manager</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Windows-11%20%7C%2010-0078D6?logo=windows&logoColor=white" alt="Windows Support" />
  <img src="https://img.shields.io/badge/Anti--Cheat-100%25%20Safe-success" alt="Anti-Cheat Safe" />
  <img src="https://img.shields.io/badge/Release-v2.4.0-EAB308" alt="Version" />
  <a href="https://bettercolorprofile.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-Try%20in%20Browser-00C853?logo=googlechrome&logoColor=white" alt="Live Demo" /></a>
  <a href="https://discord.gg/eeVBnK7Hmg"><img src="https://img.shields.io/badge/Discord-Join%20Community-5865F2?logo=discord&logoColor=white" alt="Discord Community" /></a>
  <img src="https://img.shields.io/badge/License-Freeware-blue.svg" alt="License: Freeware" />
</p>

---

**Better Color Profile** is the modern, lightweight display calibration and color profile manager that Windows always needed. 

Built for **Windows 11 and Windows 10**, it completely replaces the clunky, buried Windows Color Management applet (`colorcpl.exe`) with a sleek interface, global hotkeys, and real-time display tuning — allowing you to effortlessly create, customize, and cycle through color profiles with zero lag.

---

## 🌐 Try It Live: Interactive Web Showcase & Simulator

👉 **[🚀 Launch Live Web Simulator](https://bettercolorprofile.vercel.app/)** *(Runs instantly in your browser — zero installation required)*

Test Better Color Profile directly in your web browser:

<p align="center">
  <a href="https://bettercolorprofile.vercel.app/">
    <img src="assets/showcase_preview.png" alt="Better Color Profile Live Interactive Showcase" width="100%" />
  </a>
</p>

* **Interactive Interface**: Test the real-time calibration sliders, tuner, and themes.
* **Live Game Preview**: Test tuner sliders in your browser to see hardware gamma and color adjustments on a virtual display.
* **Zero Install Required**: Runs completely inside your web browser.

---

## 📦 Installation & Download

Compatible with **Windows 11 and Windows 10** (64-bit and 32-bit):

1. Download [**BetterColorProfileSetup.exe**](https://github.com/KOUKOU221/BetterColorProfile/releases/latest/download/BetterColorProfileSetup.exe) (Direct download — automatically gets the latest release).
2. Run the setup wizard:
   - Modern installation wizard with custom destination directory selection (automatically creates and installs into a dedicated `BetterColorProfile` folder).
   - Optional Start with Windows and desktop/start-menu shortcuts (enabled by default).
   - Clean uninstallation support via Windows Settings / Installed Apps.

---

## 🛡️ 100% Anti-Cheat Friendly & Gamer Safe

Unlike shader injectors (such as ReShade) or custom overlays that hook into game processes, **Better Color Profile is 100% safe for all competitive online games**:

* **Zero Game Injection**: It never touches, hooks, or inspects game memory, DirectX, Vulkan, or OpenGL pipelines.
* **Official Windows APIs Only**: It interacts exclusively with official Microsoft Windows Color Management (`mscms.dll` / `WcsSetDefaultColorProfile`) and hardware display drivers (`gdi32!SetDeviceGammaRamp`).
* **Approved by Modern Anti-Cheats**: Kernel-level anti-cheat software (including **Riot Vanguard, Easy Anti-Cheat, BattlEye, Ricochet, and VAC**) recognize it as standard Windows display settings.
* **Zero Input Lag & Zero FPS Drop**: Because adjustments are applied at the GPU/monitor hardware LUT level, there is no performance penalty.

---

## 🎮 Why It's a Game-Changer for Gamers & Creators

* **Spot Enemies in Dark Corners**: Boost shadow visibility and contrast in competitive shooters (*CS2, Valorant, Apex Legends, Warzone, Escape from Tarkov*) without washing out bright areas.
* **Custom Digital Vibrance & Color Temperature**: Give your display punchy colors, vibrant highlights, or a warm eye-friendly night tint per game.
* **Customizable Hotkey Switching**: Switch instantly between your high-visibility gaming profile and accurate sRGB desktop profile without Alt-Tabbing or closing your game. Bind any key or combination you prefer.
* **Color Accuracy for Creators**: Switch back to true, calibrated sRGB for Photoshop, Premiere, or web browsing in a single click.

---

## 🚀 Key Features

### 1. ⚡ Instant Profile Application & Sidebar Slots
* **One-Click Apply**: Preview profiles in your sidebar without interrupting your display until you click the prominent **Apply** button.
* **Slot Management**: Organize your favorite profiles into custom slots (Slot 1, Slot 2, Slot 3...).
* **Protected Default Profile**: Your default Windows sRGB color profile is protected in a hidden internal directory (`.internal\`) — impossible to delete or corrupt accidentally.
* **Ghost Profile Cleanup**: Automatically synchronizes with installed Windows profiles and unregisters orphaned or deleted display associations from Windows Color Management.

### 2. 🎛️ 7-Slider Real-Time Display Tuner
* **Fine-Grained Hardware Calibration**:
  - Master Brightness (-100% to +100%)
  - Master Contrast (-100% to +100%)
  - Color Temperature (Warm to Cool)
  - Color Balance: Red, Green, and Blue fine-tuning
  - Gamma Curve adjustment
* **Automatic Sequential Naming**: Creating a new profile? If no name is provided, names are automatically pre-filled sequentially (`Profile 1`, `Profile 2`, etc.).
* **Instant ICC Generation**: Saves calibrated profiles directly into the `list\` directory and auto-associates them with your primary monitor.

### 3. ⌨️ Global & Per-Slot Hotkeys
* **Direct Per-Slot Shortcuts**: Assign an individual shortcut to any profile slot (e.g. `Ctrl + 1`, `F1`, or any custom key combination) to jump directly to that profile without cycling.
* **Cycle Shortcut**: Press your cycle shortcut anywhere to sequentially cycle through all configured profile slots:
  `Slot 1` ➔ `Slot 2` ➔ `Slot 3` ➔ … ➔ `Slot 1`
* **Zero Latency**: Fully customizable hotkey bindings in the Profiles tab (supports single keys and custom combinations with zero latency).
* Subtle balloon toast notifications confirm the active profile name.

### 4. 🎮 In-Game HUD Overlay (Zero Background Overhead)
* **Non-Injection & Anti-Cheat Safe**: External Win32 layered translucent window (`WS_EX_TOPMOST | WS_EX_NOACTIVATE | WS_EX_TRANSPARENT`). Zero DLL injection or game hooks — 100% safe for Vanguard, EAC, BattlEye, and Ricochet.
* **Instant In-Game Profile Switching & Tuning**:
  - `[Ctrl + Shift + V]` Toggle HUD overlay (docked top-right with sleek semi-transparent glass styling).
  - `[↑ / ↓]` Navigate between Profile selector, Gamma, Digital Vibrance, Brightness, and Contrast.
  - `[← / →]` Switch active profile slot instantly on Profile row, or adjust calibration sliders (±5%) with live hardware preview.
  - `[Tab]` or `[PgUp / PgDn]` Quick-switch profiles from anywhere in the overlay without Alt-Tabbing.
  - `[Enter]` or `[Ctrl + S]` Save modified calibrations permanently to the active profile with instant confirmation.
  - `[R]` Reset / revert sliders to profile baseline.
  - `[Esc]` or `[Ctrl + Shift + V]` Close overlay.
* **Strict Zero-Overhead Dormancy**: Consumes 0% CPU and 0% GPU when closed. Keyboard hooks are immediately released (`UnhookWindowsHookEx`) so all keystrokes pass straight to games with zero latency.
* **Customizable Activation Shortcut**: Rebind the overlay toggle hotkey in Options & Settings.

### 5. 🧰 System Tray & Background Daemon
* Minimizing or closing the window sends it directly to the system tray so hotkeys remain active.
* Right-click tray menu provides quick slot switching, status overview, and settings.
* Enable **Start with Windows** to keep your preferred profiles ready on startup.

---

## 🛠️ Building from Source

To compile from source using the built-in Microsoft .NET C# compiler:

```cmd
build.bat
```

This compiles both:
* `dist\BetterColorProfile.exe` (Standalone portable application)
* `dist\BetterColorProfileSetup.exe` (Complete setup wizard installer)
* Copies the standalone executable to the root directory for immediate local testing.

---

<!--
## ☕ Support the Project

If **Better Color Profile** enhances your gaming experience, competitive visibility, or daily workflow, consider supporting ongoing development!

<p align="left">
  <a href="https://buymeacoffee.com/KOUKOU221" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48" />
  </a>
</p>

---

## 💬 Official Community & Support

Join the official **Better Color Profile** Discord community for release announcements, troubleshooting, calibration profiles, and feature requests:

👉 **[🚀 Join Better Color Profile Discord](https://discord.gg/eeVBnK7Hmg)**

* 📢 **#announcements**: Official release updates & changelogs.
* 🛠️ **#support & #feature-requests**: Direct help & suggestions.
* 🎨 **#profile-sharing**: Download & share community monitor calibrations & game presets.

---

## 📄 License & Distribution

**Better Color Profile** is free proprietary software (Freeware) for personal and commercial use.

Copyright © 2026 KOUKOU221. All rights reserved.

