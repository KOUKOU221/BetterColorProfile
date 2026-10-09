# Project Rules & Workflow Guidelines

## 1. Closed Source Architecture & Release Policy (STRICT & MANDATORY)
- **License**: **Proprietary Freeware** (Free to use, closed-source, all rights reserved).
- **Repository Architecture**:
  - **Official Public Showcase Repository**: `https://github.com/KOUKOU221/BetterColorProfile` (Public: showcase website `index.html`, visual assets `src/`, documentation, and official pre-built binary releases. STRICTLY NO C# source code files (`src/*.cs`), NO build scripts (`build.bat`), and NO `LICENSE` (MIT)).
  - **Developer Source Repository**: `https://github.com/KOUKOU221/ColorProfileSource` (Developer repository: private repository holding full C# source code, dev assets, commits & tags).
- **Standard Release Workflow (when user requests a release)**:
  1. Push commit to `main` branch of source repository (`ColorProfileSource`).
  2. Publish new GitHub release with version tag (e.g. `v1.66`) on source repository (`ColorProfileSource`) with attached binaries (`BetterColorProfileSetup.exe` and `BetterColorProfile.exe`).
  3. Deploy updated showcase website, assets, and documentation to public repository (`BetterColorProfile` - without source code).
  4. Publish new GitHub release with version tag (e.g. `v1.66`) on public repository (`BetterColorProfile`) with `BetterColorProfileSetup.exe`.
- You must wait for the user to explicitly tell you which version/release to execute before running release commands.


## 2. Security Vulnerability Audit (MANDATORY)
- At the end of every task and after making any code changes, **ALWAYS perform a security vulnerability review** covering:
  - Input & path sanitization (Path Traversal, `..` patterns, illegal file characters)
  - Process execution safety (`Process.Start`, argument escaping, unquoted command lines)
  - Credential & secret exposure (tokens, API keys, `.git/config` leaks)
  - Network & Auto-updater integrity (URL origin validation, HTTPS enforcement, binary tampering)
  - Memory & Win32 P/Invoke safety (buffer bounds, handle cleanup, memory leaks)


## 3. Official Discord Server & Community Architecture
- **Official Community**: Better Color Profile Discord Server
- **Server ID**: `1556406900290097285`
- **Permanent Invite Link**: `https://discord.gg/eeVBnK7Hmg`
- **Channel Hierarchy**:
  - 📢 **INFORMATION**:
    - `#rules`: Read-only, reaction-enabled; server rules & anti-cheat safety info.
    - `#announcements`: Read-only, reaction-enabled; official release announcements & project news.
  - 💬 **COMMUNITY**:
    - `#general-chat`: Community conversations and display discussions.
  - 🛠️ **SUPPORT & FEEDBACK**:
    - `#support`: Troubleshooting and setup assistance.
    - `#feature-requests`: Suggestions and improvements for upcoming versions.
  - 🎨 **COLOR PROFILES & PRESETS** (Positioned at the bottom):
    - `#profile-sharing`: Dedicated Discord Forum channel for uploading/downloading custom `.icm`/`.icc` files and monitor calibration presets.
- **Release Workflow Integration**:
  - When executing a new release, announce the new release in `#announcements` with download links and changelog summary.

