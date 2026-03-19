# M3 Game — Architecture

## Overview
Monorepo for a match-3 game targeting multiple platforms. Each platform
is a standalone React JSX component. Shared core logic extraction is
planned but has not yet happened.

## Repository Structure
```
m3-core/
  .github/
    workflows/
      deploy.yml     # Auto-deploy to GitHub Pages on push to main
  core/              # Shared game logic (future extraction)
                     # Target: match finding, scoring, specials,
                     # cascade chains, gravity
  platforms/
    desktop/
      archive/       # Previous versions (read-only, do not modify)
    tablet/
      archive/
    phone-341/
      archive/
    phone-418/
      archive/
    timeattack/
      archive/
  levels/            # Campaign level definitions (future)
  docs/              # Project documentation
  assets/            # Shared images, icons, audio
    .gitkeep         # Placeholder — folder intentionally empty for now
  vite.config.js     # Vite dev server and build config
  package.json       # Node dependencies
  README.md
```

## Platform Files
Current files are placed as-is with version numbers retained.
Version numbers in filenames are intentional — do not rename.

- `platforms/desktop/` ← match3-desktop-v[x].jsx
- `platforms/tablet/` ← match3-tablet-v10_5_3.jsx
- `platforms/phone-341/` ← match3-phone-341-v[x].jsx
- `platforms/phone-418/` ← match3-phone-418-v[x].jsx
- `platforms/timeattack/` ← match3-timeattack-v[x].jsx

## Version Convention
When updating a platform file:
1. Move the current file to the platform's `archive/` folder
2. Place the new file in the platform folder with an incremented version number. Always increment versions - do not overwrite files, even for fixes.

CC should never modify files inside `archive/` folders — they are
read-only history.

## Dev Server
Vite is used for local development. Node.js is already installed.
- Local development: `http://localhost:5173`
- Device testing: local network URL provided by Vite
- Build output: `dist/` folder (auto-generated, not committed)

## Vite Config
`vite.config.js` must include the correct base path for GitHub Pages:
```js
// vite.config.js
export default {
  base: '/m3-core/'
}
```

This ensures asset paths resolve correctly when deployed to
`m3-game.github.io/m3-core`.

## Deployment
GitHub Pages serves the built app at `m3-game.github.io/m3-core`.
Auto-deploys on every push to `main` via GitHub Actions.
`.github/workflows/deploy.yml` should be set up in session 1.
`dist/` should be added to `.gitignore`.

## Notes
- Single `main` branch for now
- Core extraction is a future step — do not refactor logic during
  initial scaffolding
- Level campaign data will live in `levels/` as JSON or JS config
- All platforms share tile types, special mechanics, and scoring rules