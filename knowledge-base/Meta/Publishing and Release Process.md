# Distribution and Release Strategy

**Decision:** GitHub Releases for MVP, package managers later. See [[Decisions Summary]].

**Last Updated:** 2025-10-26

## Phased Approach

### Phase 1: MVP/Alpha

**Distribution:** GitHub Releases (manual)
**Platforms:** macOS .dmg, Windows .exe, Linux .AppImage
**Versioning:** `0.1.0-alpha.1`, `0.1.0-alpha.2`...
**Testing:** Manual only
**Updates:** Electron auto-updater, weekly checks, optional

### Phase 2: Beta

**Add:** Homebrew (macOS), winget (Windows)
**Add:** Automated builds via GitHub Actions
**Add:** Community beta testing program
**Versioning:** `0.8.0-beta.1`...

### Phase 3: Stable (1.0)

**Add:** Snap/Flatpak (Linux), optional CDN
**Add:** Full test suite, code signing
**Versioning:** `1.0.0` semantic versioning

## GitHub Releases Setup

**Release structure:**
- Tag: `v0.1.0-alpha.1`
- Title: "Quallaa 0.1.0 Alpha 1 - [Feature Name]"
- Assets: .dmg, .exe, .AppImage, checksums.txt

**Electron auto-updater config:**
```json
// applications/electron/package.json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "jefftoffoli",
      "repo": "Quallaa-app"
    }
  }
}
```

## Package Managers (Phase 2+)

**Homebrew:**
```bash
brew install --cask quallaa
```

**winget:**
```bash
winget install Quallaa.Quallaa
```

**Snap (Phase 3):**
```bash
snap install quallaa
```

## Telemetry

**Decision:** Zero telemetry (maintain Theia's privacy-first approach)

**If needed later:** Opt-in only, no PII, open source implementation

## Automation (Phase 2+)

GitHub Actions workflow triggers on git tags (`v*`):
1. Build for all platforms
2. Run tests
3. Create GitHub Release
4. Upload artifacts
5. Generate release notes

---

**Current Status:** Phase 1 approach approved. Manual releases for MVP.
