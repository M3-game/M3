# Claude Code Instructions

## Game Design

For game mechanics, scoring rules, bonus moves behavior, level unlock gates, known bugs, and terminology decisions, see **`docs/DESIGN.md`**. Read it before implementing any gameplay changes.

## Session lifecycle

### At session start

Before taking any action on a coding or design session, read these two docs:

1. The latest `docs/PROGRESS-YYYY-MM-DD.md` — highest-dated file matching that glob. Contains the current session roster, platform status, rolling priority, and any starting-brief for the session about to run.
2. `docs/DEFERRED.md` — full roster of planned and deferred work with scope details.

These are load-bearing. Don't skip them; a fresh session without them will duplicate work, miss context, or ship code inconsistent with prior decisions.

### Before committing any session

Update both docs as part of the same commit that ships the code:

- **`docs/PROGRESS-<today>.md`** — mark the session's row shipped (move from 🚧/📋 to ✅, add the commit hash), update the platform-status table if a platform's active version changed, and add a brief addendum narrative if anything non-obvious was decided during the session that doesn't belong in DESIGN.md or DEFERRED.md.
- **`docs/DEFERRED.md`** — move the just-shipped item out of its section (delete, or move to the "Done" section with date + session ref). Add any new deferred items surfaced during the session.

Without these updates, the docs go stale and future sessions lose their map.

### Rotating the PROGRESS doc

Rotate the PROGRESS doc when something ships on a date later than the current doc's date, or when there's another reason to start a fresh doc. Don't rotate just because the date has changed — a quiet day with no ship continues to use the existing doc.

When rotating (as part of the same commit that ships the code):

1. Move the existing `docs/PROGRESS-YYYY-MM-DD.md` into `docs/archive/`.
2. Create a new `docs/PROGRESS-<today>.md`.
3. Carry forward the session-roster table (updated to reflect what's shipped), the current platform-status table, and still-load-bearing narrative entries. Drop narrative fully captured elsewhere (DESIGN.md / DEFERRED.md / prior handoff).

Multiple sessions on the same day share one PROGRESS doc.

## Context & Session Tracking

Track both context limit and session limit and report when we've reached 40%, 60%, and 80% of each.

## Before Taking Action

Ask for my okay before starting work, including any change to code, docs, config, or memory. Make suggestions before implementing them. Do not create files or take other actions without explicit approval.

"Go ahead" from me is sufficient approval to proceed. For coding sessions specifically, briefly confirm once more before editing code: ask "Ready for me to start coding now?" This isn't a second approval gate — it's a final check, because coding sessions cost more tokens than doc or memory edits and are harder to change direction partway through.

## Audience

Don't assume I'm a developer. Training biases you toward assuming a developer audience when the task involves code, the terminal, repositories, or code-related platforms. My roles are fluid — currently a mix of leader, manager, and contributor. I'm familiar with code in some contexts and completely unfamiliar in others. Don't assume I know a concept or term, especially in technical or coding domains. If I need something explained, I'll tell you — the general rule here is enough.

## Clarity

Be precise when describing what you did, what you see, or what I should do. Don't use vague phrases like "I've been looser about X" or "things are a bit messy" — name specific files, specific behaviors, specific patterns. Avoid jargon shorthand when plain language is clearer.

Prioritize clarity over conversational glibness. Don't try to sound like or match the argot and tone of any type of person (developer, manager, etc.) — being clear matters more than sounding fluent in a register.

## Response format

When a response covers multiple topics or asks more than one question, send each as its own message rather than bundling them together. End each non-final message with a brief check-in like "Once you respond, I'll cover [next topic]." Wait before continuing.

**Operational test.** Before sending any response, check: does your draft contain more than one `##` header, or more than one question awaiting an answer? If yes, ship only the first section and stop. This is stricter than "topics" because a single overarching topic (e.g., "Session H scoping") often contains many independent decisions that each need separate scrutiny.

**Scoping, planning, and design discussions are decision-dense by definition.** Treat them as multi-message from the outset, never as a single "scope document" even when the plan is one coherent thing. Start with a brief roadmap — a short bulleted list of decisions to work through — then take them one at a time, one decision per message.

Trigger phrases that should auto-activate scoping discipline: "scope", "plan", "design", "walk me through", "let's think about".

For genuinely single-topic responses (simple questions, status updates, single-decision confirmations), reply directly in one message — no chunking needed.

Reason: multi-topic responses are hard for me to read carefully when I may need to respond inside the 5-minute prompt-cache window. One-topic-per-message lets me focus on each without rushing.

## Research

When doing research, double-check all facts and present the sources. Do not assume any fact is accurate from a single source — sometimes multiple sources are required.

## Explaining reasoning

If you don't know the reason for something, say so. Likewise if you're unsure. When you have more than one plausible cause — or more than one idea in general — propose them as hypotheses with confidence levels rather than presenting one as fact. A single guess framed as certainty is worse than two alternatives with honest confidence in each. Example: "70% confident the bug is X because A, B; 30% it's Y because C."

## Agents

**Before spawning multiple agents:** check with me first. Multiple concurrent agents cause context scarcity, which leads agents to minify code so their work fits into tight context windows. Minified code then has to be debugged — and debugging minified logic in this codebase once cost >200,000 tokens across multiple sessions to track down an open-parenthesis bug that was invisible in the minified form. The chain is: agents → context scarcity → minification → multi-session debug spiral. Don't start it.

**Never minify code.** Never compress, minify, or remove whitespace or formatting from source files, ever.

**If context is running low** or autocompaction may happen before a task completes, stop and suggest writing a handoff doc, then continue next session. Don't race autocompaction.

## Versioning Convention

**Never overwrite a file, even for a one-line fix. Always save the old file.**

**Exception: shared `core/` files are edited in place.** Files in
`core/` (e.g., `core/AdminPanel.jsx`, `core/gameLogic.js`) are imported
by multiple platform files. Versioning them would force cascading
renames across every importer for any small edit. Edit in place; no
archive, no rename. Platform files that import a changed `core/` file
inherit the update without needing a version bump of their own.
Platform files (`platforms/<platform>/match3-*.jsx`) still follow the
full versioning rule below.

Every change to a platform file — no matter how small — requires:

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
| Phone (arcade) | `platforms/phone/match3-vX.Y-phone.jsx` | `platforms/phone/archive/` |
| Phone Verses | `platforms/phone-verses/match3-vX.Y-phone-verses.jsx` | `platforms/phone-verses/archive/` |
| Phone Verses Sandbox | `platforms/phone-verses-sandbox/match3-vX.Y-phone-verses-sandbox.jsx` | `platforms/phone-verses-sandbox/archive/` |
| Desktop | `platforms/desktop/...` | `platforms/desktop/archive/` |

Phone-341 was retired in Session P-2 (2026-05-02). Its files remain in `platforms/phone-341/archive/` for historical reference but no longer build.

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
- [ ] **In-game header label inside the new file updated to match the new version** (the small `vX.Y` rendered in the running app's header — this is the "version-label drift" trap that hit phone-418 v13.1→v13.3 and phone-418-verses v1.0→v1.4 silently; see DEFERRED.md "In-game version-label drift" if unsure)
- [ ] `docs/PROGRESS-<today>.md` updated (session row shipped, platform status, addendum if needed)
- [ ] `docs/DEFERRED.md` updated (shipped item moved out, new deferred items added)
