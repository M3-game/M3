# Claude Code Instructions

## Game Design

For game mechanics, scoring rules, bonus moves behavior, level unlock gates, known bugs, and terminology decisions, see **`docs/DESIGN.md`**. Read it before implementing any gameplay changes.

## Context & Session Tracking

Track both context limit and session limit and report when we've reached 40%, 60%, and 80% of each.

## Before Taking Action

Make suggestions before implementing them. Do not create files or take other actions without explicit approval.

## Research

When doing research, double-check all facts and present the sources. Do not assume any fact is accurate from a single source — sometimes multiple sources are required.

## Agents

**Before spawning multiple agents:** Check first. Multiple concurrent agents can cause context scarcity, which can lead agents to minify code — this has caused bugs requiring entire sessions to resolve.

**Never minify code.** Do not compress, minify, or remove whitespace/formatting from source files, ever.

**If context is running low** or autocompaction may happen before a task completes, stop and suggest writing a handoff doc and continuing next session.

## Versioning Convention

**Never overwrite a file, even for a one-line fix. Always save the old file.**

Every change — no matter how small — requires:

1. **Archive the current file** by copying it to `platforms/<platform>/archive/` before making any edits.
2. **Create a new versioned file** (e.g. `match3-v11.3` → `match3-v11.4`) with the changes applied.
3. **Update all references** — `src/main.jsx`, `src/entry-campaign.jsx`, `index.html` — to point to the new version.
4. **Update the version comment block** at the top of the new file to describe the change.

### Why

- The archive is the only reliable record of what the game looked like before a change.
- Git history is a fallback, but archived files are immediately browsable without git commands.
- "One-line fix" is not a category that earns an exception. Every overwrite destroys the previous state.

### File naming

| Platform | Active file location | Archive location |
|---|---|---|
| Tablet | `platforms/tablet/match3-vX.Y-tablet.jsx` | `platforms/tablet/archive/` |
| Campaign | `platforms/campaign/tablet/match3-vX.Y-campaign-tablet.jsx` | `platforms/campaign/tablet/archive/` |
| Phone 341 | `platforms/phone341/...` | `platforms/phone341/archive/` |
| Desktop | `platforms/desktop/...` | `platforms/desktop/archive/` |

### Version numbering

- Minor feature or bug fix → increment patch (11.3 → 11.4)
- Significant new mechanic or screen → increment minor (11.x → 12.0)
- When in doubt, ask.

### Checklist before every commit

- [ ] Old file copied to archive
- [ ] New versioned file created (not the old one edited in place)
- [ ] `src/main.jsx` / `src/entry-campaign.jsx` updated
- [ ] `index.html` version label updated
- [ ] Version comment block in new file updated
