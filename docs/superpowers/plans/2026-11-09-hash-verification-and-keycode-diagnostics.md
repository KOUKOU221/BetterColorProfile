# SHA-256 Installer Hash Verification & Keycode Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement in-memory SHA-256 checksum verification against release metadata before executing downloaded installers in both `src/Installer.cs` and `src/BetterColorProfile.cs`, update `build.bat` to compute and print the installer checksum on compile, and add a Keycode Test Diagnostics indicator directly beneath the hotkey picker box in `src/BetterColorProfile.cs`.

**Architecture:** 
1. Auto-updater in both `src/BetterColorProfile.cs` and `src/Installer.cs` extracts the expected 64-char hex SHA-256 hash from GitHub release metadata (`body`), computes the SHA-256 of the downloaded installer in memory via `System.Security.Cryptography.SHA256`, and immediately deletes the binary and aborts if it does not match.
2. `build.bat` compiles the binaries and computes the SHA-256 hash using native .NET `System.Security.Cryptography.SHA256` via a lightweight PowerShell command.
3. `ShortcutChipControl` / `sidebarBottom` in `src/BetterColorProfile.cs` gets a dedicated Keycode Test Diagnostics indicator beneath the hotkey box displaying raw VK, hex VK, scan code, and key name for keyboard and mouse inputs.

**Tech Stack:** C# 7.0 (.NET Framework 4.0/4.8 WinForms), Win32 API (`MapVirtualKey`), Windows Batch, PowerShell.

**Spec:** Direct user specification for SHA-256 checksum installer authenticity verification and hotkey keycode diagnostic display.

## Global Constraints
- Target .NET Framework 4.0+ compatibility using native `csc.exe`.
- Zero external dependencies; use native `System.Security.Cryptography.SHA256`.
- Keep changes self-contained in `src/Installer.cs`, `src/BetterColorProfile.cs`, and `build.bat`.
- Preserve all existing comments and closed-source architecture standards.

## Review Focus
1. **Tampered/corrupted download:** If downloaded file hash does not match expected checksum, the file must be deleted from disk and process launch aborted.
2. **Missing checksum in release metadata:** When release metadata contains no checksum (e.g. legacy releases), updater should log/warn or proceed gracefully without crashing.
3. **Large download memory safety:** SHA-256 should be computed via streaming `FileStream` rather than reading entire multi-megabyte files into contiguous RAM arrays.
4. **Non-standard input diagnostics:** Keycode indicator must handle special keys, numpad keys, and mouse extra buttons (XButton1/2) without throwing unhandled exceptions.
5. **Build script reliability:** `build.bat` must compute and display hash cleanly without breaking batch errorlevel handling.

---

### Task 1: SHA-256 Checksum Computation in `build.bat`

**Files:**
- Modify: `build.bat:32-48`

**Interfaces:**
- Produces: `dist\BetterColorProfileSetup.exe.sha256` and console output of SHA-256 hash.

- [ ] **Step 1: Update `build.bat` to compute SHA-256 on compile**
Update `build.bat` after compiling `dist\BetterColorProfileSetup.exe` to calculate its SHA-256 hash using native .NET `[System.Security.Cryptography.SHA256]::Create()` via PowerShell, store it to `dist\BetterColorProfileSetup.exe.sha256`, and display `SHA-256: <hash>` in the success output.

- [ ] **Step 2: Run `build.bat` and verify hash output**
Run `build.bat` in PowerShell and assert errorlevel is 0 and the 64-char hex hash appears in console output.

---

### Task 2: Installer SHA-256 Hash Verification in `src/Installer.cs`

**Files:**
- Modify: `src/Installer.cs:160-230, 535-610`

**Interfaces:**
- Consumes: Release body string containing SHA-256 hash.
- Produces: `InstallerUpdateInfo.ExpectedSha256`, verified hash check before executing `tempFile`.

- [ ] **Step 1: Add `ExpectedSha256` to `InstallerUpdateInfo` and extract in `InstallerUpdateChecker`**
Add `public string ExpectedSha256;` to `InstallerUpdateInfo`. In `CheckForUpdatesSync`, use regex to parse SHA-256 from release body (e.g., `(?:SHA-?256|checksum)[\s:=]+([a-fA-F0-9]{64})`).

- [ ] **Step 2: Implement streaming SHA-256 hash verification in `DownloadAndRunLatest`**
In `DownloadAndRunLatest`, after file download completes and before `Process.Start`:
Compute the SHA-256 of `tempFile` using `System.Security.Cryptography.SHA256.Create()` streaming through `FileStream`. If `info.ExpectedSha256` is non-empty and does not match (case-insensitive), delete `tempFile`, show an authenticity error message, and abort execution.

- [ ] **Step 3: Verify compilation and hash validation logic**
Compile with `build.bat` and ensure clean build.

---

### Task 3: SHA-256 Hash Verification in `src/BetterColorProfile.cs`

**Files:**
- Modify: `src/BetterColorProfile.cs:5830-6080`

**Interfaces:**
- Consumes: Release JSON `body` string.
- Produces: `UpdateInfo.ExpectedSha256`, streaming hash check before `targetUpdateExe` execution.

- [ ] **Step 1: Add `ExpectedSha256` to `UpdateInfo` and extract in `UpdateChecker.CheckForUpdatesAsync`**
Add `public string ExpectedSha256;` to `UpdateInfo`. Extract the SHA-256 hash from release `notes` / body using regex.

- [ ] **Step 2: Implement streaming SHA-256 check in `UpdateChecker.DownloadAndApplyUpdate`**
Before calling `Process.Start(psi)` for `targetUpdateExe` or replacing `currentExe`:
Compute the SHA-256 hash using `System.Security.Cryptography.SHA256`. If `info.ExpectedSha256` is provided and does not match:
Delete `targetUpdateExe` via `File.Delete` and throw `Exception("Security verification failed: Installer SHA-256 checksum mismatch.")`.

- [ ] **Step 3: Compile and verify**
Run `build.bat` to verify zero compile errors.

---

### Task 4: Keycode Test Diagnostics Indicator in `src/BetterColorProfile.cs`

**Files:**
- Modify: `src/BetterColorProfile.cs` (`ShortcutChipControl`, `sidebarBottom`, `PreFilterMessage`)

**Interfaces:**
- Produces: `lblKeycodeDiag` under `shortcutChip` showing `VK: <dec> (0x<hex>) • Scan: 0x<hex> • Key: <name>`.

- [ ] **Step 1: Add Win32 `MapVirtualKey` P/Invoke to `MainForm`**
Add:
```csharp
[DllImport("user32.dll")]
public static extern uint MapVirtualKey(uint uCode, uint uMapType);
```

- [ ] **Step 2: Add `lblKeycodeDiag` indicator directly beneath `shortcutChip` in `sidebarBottom`**
Adjust `sidebarBottom` layout to host `lblKeycodeDiag` directly beneath `shortcutChip`. Style it cleanly with `ThemeManager.FontRegular85`, subtle text color (`ThemeManager.TextDim` / `ThemeManager.TextMuted`), and center alignment.

- [ ] **Step 3: Update `lblKeycodeDiag` during shortcut capture on key and mouse events**
In `PreFilterMessage` and `ShortcutChipControl`:
When a key is pressed during capture mode, extract `vk = (uint)keyCode`, `scanCode = MapVirtualKey(vk, 0)`, and update `lblKeycodeDiag.Text = string.Format("VK: {0} (0x{0:X2}) • Scan: 0x{1:X2} • Key: {2}", vk, scanCode, keyCode);`.
Also support mouse button clicks (Left, Right, Middle, XButton1, XButton2) in `ShortcutChipControl` during capture mode, displaying the virtual key code (e.g. VK 0x05 for Mouse 4 / XButton1, VK 0x06 for Mouse 5 / XButton2).

- [ ] **Step 4: Compile and test with `build.bat`**
Run `build.bat` and verify both executables compile cleanly.

---

### Task 5: Final Security Audit & Verification

- [ ] **Step 1: Execute verification script**
Verify file hashes, check update download routines, and test keycode formatting logic.

- [ ] **Step 2: Perform Security Vulnerability Audit**
Verify: Input & path sanitization, Process execution safety, Credential & secret exposure, Network & Auto-updater integrity (URL origin validation, HTTPS enforcement, binary tampering), Memory & Win32 P/Invoke safety.
