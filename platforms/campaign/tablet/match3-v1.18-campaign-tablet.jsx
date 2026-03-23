import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AdminPanel, { defaultStats, STATS_KEY, BANKED_KEY } from '../../../core/AdminPanel.jsx';
import {
  LEVEL_CONFIGS,
  getLevelConfig,
  getLevelTarget,
  calculateStars,
  canAdvanceToLevel,
  CAMPAIGN_BONUS_MOVE_INTERVAL,
  calculateBonusMovesEarned,
  CAMPAIGN_KEYS,
} from '../../../levels/campaignConfig.js';

// =============================================================================
// MATCH-3 GAME — CAMPAIGN MODE v1.13 — TABLET
// Based on match3-v11.2-tablet.jsx
// Campaign differences vs arcade:
//   - Board dimensions, moves, and target score come from LEVEL_CONFIGS
//   - Progress persisted via CAMPAIGN_KEYS (separate from arcade keys)
//   - Star rating shown on level end (calculateStars)
//   - Level select screen between games
//   - Unlock gates for levels 7 and 8 (canAdvanceToLevel)
//   - Bonus moves banked into campaign pool (CAMPAIGN_KEYS.bonusMoves)
//   - No difficulty-increment loop — each level has a fixed config
// v1.1: Banked moves game-flow wiring (matches arcade v11.3)
//   Bonus moves (per 10k) accrue to in-game pool (🎯), not regular moves.
//   At moves=0 with pool>0: "Use extra moves" or "Save moves / End level".
//   Saved/remaining pool carries to campaignBonusMoves for next level.
// v1.2: Campaign flow & UX improvements
//   Flow: win → TransitionScreen → next level directly (no map unless chosen).
//         loss → retry overlay (Retry / View Map). Map only shown on request or loss.
//   TransitionScreen: score, 1-5 stars, bonus moves earned, Next Level / View Map;
//         timed-mode callout when the upcoming level is time attack.
//   LevelSelectScreen: future/unreachable levels shown as minimal locked cards.
//   Time Attack: 'ready' state + "Tap to start" overlay before timer begins.
// v1.3: Bug fix — special tiles swept up by a special+special combination now
//   cascade and activate instead of being silently deleted.
// v1.4: Time Attack time extension mechanics (mirrors arcade time attack)
//   Arcade mechanic (during play): +5s per combo x5+, +5s per special created,
//     +5s per 5k score milestone. Capped at 15s per player action.
//   Spec mechanic (on timer expiry): if timer hits 0 before target is reached
//     and player has banked bonus moves, each move adds +5s automatically
//     (one-time per level, consumes all banked moves).
// v1.5: Fix — cascade popups in activateSpecialCombination
//   Chained specials swept by a special+special combination now each get their
//   own score popup with 1.5x cascade multiplier, instead of all being lumped
//   into the main combo popup message silently.
// v1.6: Banked moves UX — player can use 🏦 campaignBonusMoves during any level
//   When moves hit 0 and bonusPool is empty but campaignBonusMoves > 0:
//   "Use banked moves" prompt appears (instead of gameover).
//   Choosing "Use banked moves" lets the player keep playing; each move consumes
//   1 from the 🏦 counter (moves stays at 0). A persistent header button
//   "End & carry 🏦 moves forward" lets the player stop at any time, carrying
//   all remaining banked moves to the next level.
// v1.7: Fix — cascade scoring in activateSpecialCombination
//   v1.5 introduced a bug: the while-loop pre-added each cascade special's key
//   to processedInCombination before passing that set to activateSpecialTile.
//   activateSpecialTile checks alreadyCleared.has(posKey) at entry and returns
//   empty results immediately, giving 0 cascade score and no further tile clears.
//   Fix: remove the pre-add; activateSpecialTile handles the add internally.
// v1.8: Unified bonus/banked moves — one pool, one counter (🏦)
//   Bonus moves earned during play (per 10k pts) go directly into campaignBonusMoves
//   instead of a separate bonusMovePool. The player sees one 🏦 number that grows
//   during play and carries across levels. When regular moves hit 0 and 🏦 > 0,
//   a prompt offers "Use banked moves" (keep playing, 🏦 ticks down) or
//   "End and carry moves forward" (level ends, 🏦 persists). On level 8 the
//   second button just says "End."
// v1.9: Fix — bonus moves prompt fires on win AND fail
// v1.10: Fix — time attack bonus move conversion: one at a time, stop on target
//   Previous code consumed the entire campaignBonusMoves pool at once when the
//   timer hit 0. New behaviour: convert one move per timer tick (+5s each),
//   stopping as soon as scoreRef.current >= LEVEL_TARGET so remaining moves
//   carry forward to the next level.
//   Previous logic gated the prompt on !hasReachedTarget, so it only appeared on
//   loss. Most players win before running out of regular moves, meaning the prompt
//   never fired. New logic: whenever moves = 0 and campaignBonusMoves > 0, show
//   the prompt regardless of target status. Prompt text is context-aware (win vs
//   fail). endLevelCarryBanked now adds the unused-specials bonus to score before
//   resolving. Button label changed from "Use banked moves" to "Use bonus moves".
// v1.18: Fix — campaign total score resets between runs
//   campaignTotalScore was computed from all-time high scores, so starting a new
//   run via "Play Again" showed stale totals from previous runs. Fix: track
//   runTotalScore in Match3Campaign (starts at 0). handleLevelComplete accumulates
//   it per win. Resets to 0 in handleBackToMap, handleStartOver, handleResetAll.
// v1.17: Text fixes — L1 intro heading, "colour" → "color"
// v1.16: Game over screen — personal best, best stars, Start Over button
//   Game over overlay gains: personal best score for this level, best stars
//   previously earned on this level, formatted score. New "Start Over" link
//   below primary buttons navigates to L1 intro with records intact.
//   CampaignGame receives highScore, bestStars, onStartOver props.
//   Match3Campaign passes these and implements handleStartOver.
// v1.15: Transition screen fields + campaign complete screen
//   Transition screen gains: moves used (non-TA), best combo, specials created,
//   bonus moves earned this level, total bonus moves in pool, campaign running total.
//   "Banked" → "bonus" throughout. Campaign complete screen (after L8): total score,
//   stars/40, per-level star breakdown, "Play Again" (keep records) and
//   "Reset all and start again" (clear all data, start at L1 intro).
// v1.14: Fix — time attack star rating bug
//   Stars were evaluated the moment the timer hit 0 (or the player dismissed the
//   time-up prompt), before pending tile falls and cascade scoring finished.
//   Fix: replace immediate setGameState calls in the timer expiry path and
//   endLevelSaveMoves with a pendingTimeExpiry flag. A new useEffect watches
//   isAnimating and combo; once both are clear it evaluates the final score and
//   calls setGameState. pendingTimeExpiry is also reset in restartGame.
// v1.13: Level intro screens — shown before each level, always on entry
//   New LevelIntroScreen component and LEVEL_INTROS data (one entry per level).
//   New screen state 'levelIntro' in router. handleSelectLevel and handleNextLevel
//   route through intro if one exists for that level index.
// v1.12: Fix — special+special swap now evaluates additional 4+ matches
//   When two specials are swapped, findMatches was skipped entirely (early return),
//   so any 4+ tile match formed by the swap (adjacent regular tiles) was lost.
//   Fix: run findMatches on the swapped grid in the special+special branch, filter
//   connected groups with ≥4 tiles (excluding pure-special groups), and pass them
//   into activateSpecialCombination. After the combination clears tiles, specials
//   are placed at the best position within each group — same logic as removeMatches.
// v1.11: Time attack — pause + prompt on expiry (matches arcade v12 Option C)
//   Previous v1.10 auto-converted bonus moves one-at-a-time on timer expiry.
//   New behaviour: when timer hits 0 and score < target and campaignBonusMoves > 0,
//   timer pauses and a modal prompt appears. Player chooses:
//     "Use bonus move (+5s)" — consume 1 move, add 5s, timer resumes.
//     "End level — save moves" — end now, pool persists.
//   Prompt re-appears at each subsequent expiry until pool empty or target reached.
//   Also fixed: bonus moves are now earned during time attack levels (removed the
//   !IS_TIME_ATTACK guard from the bonus move award effect). Previously, 10k-point
//   thresholds during time attack were silently discarded.
// =============================================================================

// ---------------------------------------------------------------------------
// Tile Drawing Constants (shared with arcade)
// ---------------------------------------------------------------------------
const TILE_SIZE = 50;
const TILE_GAP  = 4;
const TILE_TYPES = 6;

// Animation / rendering
const ANIMATION_SPEED = 0.25;
const MAX_DPR   = 2;
const FRAME_SKIP = 2;

// Scoring constants (same as arcade)
const WIN_BONUS_PER_MOVE       = 100;
const EARLY_END_BONUS_PER_MOVE = 200;
const BONUS_ROUND_MULTIPLIER   = 1.5;

// Time Attack extension constants (v1.4 — mirrors arcade time attack)
const TIME_EXTENSION_AMOUNT        = 5;   // seconds added per trigger
const TIME_EXTENSION_CAP_PER_TURN  = 15;  // max seconds per player action
const TIME_EXTENSION_SCORE_INTERVAL = 5000; // +5s every N points

// Tile Colors
const TILE_COLORS = [
  { name: 'hypocycloid', primary: '#E53935', light: '#FFCDD2', dark: '#B71C1C', accent: '#FF5252' },
  { name: 'diamond',     primary: '#304FFE', light: '#90CAF9', dark: '#0D47A1', accent: '#42A5F5' },
  { name: 'clover',      primary: '#00C853', light: '#81C784', dark: '#2E7D32', accent: '#66BB6A' },
  { name: 'star',        primary: '#FFD700', light: '#FFF9C4', dark: '#FF8F00', accent: '#FFD54F' },
  { name: 'candy',       primary: '#AA00FF', light: '#E1BEE7', dark: '#6A1B9A', accent: '#AB47BC' },
  { name: 'sun',         primary: '#FF6D00', light: '#FFCC80', dark: '#BF360C', accent: '#FFB74D' },
];

// ---------------------------------------------------------------------------
// Canvas drawing helpers (identical to v11.2)
// ---------------------------------------------------------------------------
const drawTile = (ctx, x, y, size, tileType, options = {}) => {
  const { isSelected, isMatched, isSpecial, isPending, opacity = 1, scale = 1 } = options;
  const color = TILE_COLORS[tileType];
  ctx.save();
  ctx.globalAlpha = opacity;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  switch (tileType) {
    case 0: drawHypocycloid(ctx, x, y, size, color); break;
    case 1: drawDiamond(ctx, x, y, size, color); break;
    case 2: drawClover(ctx, x, y, size, color); break;
    case 3: drawStar(ctx, x, y, size, color); break;
    case 4: drawCandy(ctx, x, y, size, color); break;
    case 5: drawSun(ctx, x, y, size, color); break;
  }
  if (isSelected) {
    ctx.strokeStyle = 'white'; ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
    ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 15;
  }
  if (isPending) {
    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }
  if (isSpecial) {
    ctx.strokeStyle = 'gold'; ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }
  ctx.restore();
};

const drawHypocycloid = (ctx, x, y, size, color) => {
  const cx = x + size / 2, cy = y + size / 2, r = size * 0.45;
  const gradient = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  gradient.addColorStop(0, color.light); gradient.addColorStop(0.3, color.accent);
  gradient.addColorStop(0.7, color.primary); gradient.addColorStop(1, color.dark);
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + r * 0.2, cy - r * 0.2, cx + r, cy);
  ctx.quadraticCurveTo(cx + r * 0.2, cy + r * 0.2, cx, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.2, cy + r * 0.2, cx - r, cy);
  ctx.quadraticCurveTo(cx - r * 0.2, cy - r * 0.2, cx, cy - r);
  ctx.closePath();
  ctx.fillStyle = gradient; ctx.fill();
  ctx.strokeStyle = color.dark; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.25, cy - r * 0.25, r * 0.2, r * 0.15, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
};

const drawDiamond = (ctx, x, y, size, color) => {
  const scale = size / 40;
  const gradient1 = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient1.addColorStop(0, '#42A5F5'); gradient1.addColorStop(0.4, '#1E88E5'); gradient1.addColorStop(1, '#0D47A1');
  const gradient2 = ctx.createLinearGradient(x, y + size * 0.5, x, y + size);
  gradient2.addColorStop(0, '#64B5F6'); gradient2.addColorStop(1, '#1565C0');
  ctx.beginPath();
  ctx.moveTo(x + 8*scale, y + 12*scale); ctx.lineTo(x + 32*scale, y + 12*scale);
  ctx.lineTo(x + 38*scale, y + 20*scale); ctx.lineTo(x + 2*scale, y + 20*scale);
  ctx.closePath(); ctx.fillStyle = gradient1; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 12*scale, y + 12*scale); ctx.lineTo(x + 28*scale, y + 12*scale);
  ctx.lineTo(x + 26*scale, y + 8*scale); ctx.lineTo(x + 14*scale, y + 8*scale);
  ctx.closePath(); ctx.fillStyle = '#90CAF9'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 2*scale, y + 20*scale); ctx.lineTo(x + 38*scale, y + 20*scale);
  ctx.lineTo(x + 20*scale, y + 38*scale);
  ctx.closePath(); ctx.fillStyle = gradient2; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 14*scale, y + 10*scale); ctx.lineTo(x + 20*scale, y + 10*scale);
  ctx.lineTo(x + 18*scale, y + 14*scale); ctx.lineTo(x + 14*scale, y + 14*scale);
  ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
};

const drawClover = (ctx, x, y, size, color) => {
  const scale = size / 40;
  const gradient = ctx.createRadialGradient(x + 14*scale, y + 14*scale, 0, x + 20*scale, y + 20*scale, 26*scale);
  gradient.addColorStop(0, '#81C784'); gradient.addColorStop(0.4, '#4CAF50'); gradient.addColorStop(1, '#2E7D32');
  ctx.fillStyle = gradient;
  // Top leaf
  ctx.beginPath();
  ctx.moveTo(x + 20*scale, y + 5*scale);
  ctx.bezierCurveTo(x + 18*scale, y + 3*scale, x + 15*scale, y + 3*scale, x + 13*scale, y + 5*scale);
  ctx.bezierCurveTo(x + 11*scale, y + 7*scale, x + 11*scale, y + 10*scale, x + 13*scale, y + 13*scale);
  ctx.lineTo(x + 20*scale, y + 20*scale); ctx.lineTo(x + 27*scale, y + 13*scale);
  ctx.bezierCurveTo(x + 29*scale, y + 10*scale, x + 29*scale, y + 7*scale, x + 27*scale, y + 5*scale);
  ctx.bezierCurveTo(x + 25*scale, y + 3*scale, x + 22*scale, y + 3*scale, x + 20*scale, y + 5*scale);
  ctx.closePath(); ctx.fill();
  // Left leaf
  ctx.beginPath();
  ctx.moveTo(x + 5*scale, y + 20*scale);
  ctx.bezierCurveTo(x + 3*scale, y + 18*scale, x + 3*scale, y + 15*scale, x + 5*scale, y + 13*scale);
  ctx.bezierCurveTo(x + 7*scale, y + 11*scale, x + 10*scale, y + 11*scale, x + 13*scale, y + 13*scale);
  ctx.lineTo(x + 20*scale, y + 20*scale); ctx.lineTo(x + 13*scale, y + 27*scale);
  ctx.bezierCurveTo(x + 10*scale, y + 29*scale, x + 7*scale, y + 29*scale, x + 5*scale, y + 27*scale);
  ctx.bezierCurveTo(x + 3*scale, y + 25*scale, x + 3*scale, y + 22*scale, x + 5*scale, y + 20*scale);
  ctx.closePath(); ctx.fill();
  // Right leaf
  ctx.beginPath();
  ctx.moveTo(x + 35*scale, y + 20*scale);
  ctx.bezierCurveTo(x + 37*scale, y + 18*scale, x + 37*scale, y + 15*scale, x + 35*scale, y + 13*scale);
  ctx.bezierCurveTo(x + 33*scale, y + 11*scale, x + 30*scale, y + 11*scale, x + 27*scale, y + 13*scale);
  ctx.lineTo(x + 20*scale, y + 20*scale); ctx.lineTo(x + 27*scale, y + 27*scale);
  ctx.bezierCurveTo(x + 30*scale, y + 29*scale, x + 33*scale, y + 29*scale, x + 35*scale, y + 27*scale);
  ctx.bezierCurveTo(x + 37*scale, y + 25*scale, x + 37*scale, y + 22*scale, x + 35*scale, y + 20*scale);
  ctx.closePath(); ctx.fill();
  // Stem
  ctx.beginPath();
  ctx.moveTo(x + 20*scale, y + 20*scale); ctx.lineTo(x + 20*scale, y + 32*scale);
  ctx.strokeStyle = '#2E7D32'; ctx.lineWidth = 3*scale; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + 17*scale, y + 9*scale, 2*scale, 1.5*scale, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
};

const drawStar = (ctx, x, y, size, color) => {
  const cx = x + size / 2, cy = y + size / 2;
  const outerR = size * 0.45, innerR = size * 0.2;
  const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, color.light); gradient.addColorStop(0.3, color.accent);
  gradient.addColorStop(0.7, color.primary); gradient.addColorStop(1, color.dark);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 72 - 90) * Math.PI / 180;
    const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
    if (i === 0) ctx.moveTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
    else ctx.lineTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
    ctx.lineTo(cx + innerR * Math.cos(innerAngle), cy + innerR * Math.sin(innerAngle));
  }
  ctx.closePath();
  ctx.fillStyle = gradient; ctx.fill();
  ctx.strokeStyle = '#E65100'; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath();
  const hR = outerR * 0.5, hIR = innerR * 0.6;
  for (let i = 0; i < 5; i++) {
    const oa = (i * 72 - 90) * Math.PI / 180;
    const ia = ((i * 72) + 36 - 90) * Math.PI / 180;
    if (i === 0) ctx.moveTo(cx + hR * Math.cos(oa), cy + hR * Math.sin(oa));
    else ctx.lineTo(cx + hR * Math.cos(oa), cy + hR * Math.sin(oa));
    ctx.lineTo(cx + hIR * Math.cos(ia), cy + hIR * Math.sin(ia));
  }
  ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
};

const drawCandy = (ctx, x, y, size, color) => {
  const cx = x + size / 2, cy = y + size / 2;
  const rx = size * 0.4, ry = size * 0.3;
  const gradient = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 0, cx, cy, rx * 1.2);
  gradient.addColorStop(0, color.light); gradient.addColorStop(0.4, color.accent); gradient.addColorStop(1, color.dark);
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = gradient; ctx.fill();
  ctx.strokeStyle = color.dark; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx - rx * 0.35, cy - ry * 0.3, rx * 0.35, ry * 0.3, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + rx * 0.25, cy + ry * 0.25, rx * 0.25, ry * 0.15, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fill();
};

const drawSun = (ctx, x, y, size, color) => {
  const cx = x + size / 2, cy = y + size / 2, coreR = size * 0.22;
  const centerGradient = ctx.createRadialGradient(cx - coreR * 0.3, cy - coreR * 0.3, 0, cx, cy, coreR * 1.1);
  centerGradient.addColorStop(0, '#FFCC80'); centerGradient.addColorStop(0.5, '#FF9800'); centerGradient.addColorStop(1, '#E65100');
  const petalGradient = ctx.createLinearGradient(cx, cy - size * 0.45, cx, cy);
  petalGradient.addColorStop(0, '#FFB74D'); petalGradient.addColorStop(0.5, '#FF9800'); petalGradient.addColorStop(1, '#BF360C');
  ctx.fillStyle = petalGradient;
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * Math.PI / 180;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.44);
    ctx.quadraticCurveTo(size * 0.1, -size * 0.32, size * 0.06, -size * 0.24);
    ctx.quadraticCurveTo(0, -size * 0.18, -size * 0.06, -size * 0.24);
    ctx.quadraticCurveTo(-size * 0.1, -size * 0.32, 0, -size * 0.44);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fillStyle = centerGradient; ctx.fill();
  ctx.strokeStyle = '#BF360C'; ctx.lineWidth = 0.5; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx - coreR * 0.3, cy - coreR * 0.25, coreR * 0.35, coreR * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
};

const drawSpecialIcon = (ctx, x, y, size, specialType) => {
  ctx.save();
  const isCorner = specialType === 'line' || specialType === 'cross';
  const iconSize = isCorner ? 16 : 20;
  const cx = isCorner ? x + size - 12 : x + size / 2;
  const cy = isCorner ? y + size - 12 : y + size / 2;
  ctx.beginPath(); ctx.arc(cx, cy, iconSize / 2 + 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fill();
  ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (specialType) {
    case 'line':
      ctx.strokeStyle = '#FFD700'; ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 6); ctx.lineTo(cx + 1, cy - 1); ctx.lineTo(cx - 1, cy - 1);
      ctx.lineTo(cx + 3, cy + 6); ctx.lineTo(cx - 1, cy + 1); ctx.lineTo(cx + 1, cy + 1);
      ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'bomb':
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(cx, cy + 2, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + 3, cy - 3); ctx.quadraticCurveTo(cx + 6, cy - 6, cx + 4, cy - 7); ctx.stroke();
      ctx.fillStyle = '#FF6600'; ctx.beginPath(); ctx.arc(cx + 4, cy - 7, 2, 0, Math.PI * 2); ctx.fill(); break;
    case 'cross':
      ctx.strokeStyle = '#00FFFF'; ctx.fillStyle = '#00FFFF'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill(); break;
    case 'supernova':
      ctx.strokeStyle = '#FF00FF'; ctx.fillStyle = '#FF00FF'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill(); break;
    case 'hypernova':
      ctx.strokeStyle = '#FFD700'; ctx.fillStyle = '#FFD700'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 2, cy + Math.sin(angle) * 2);
        ctx.lineTo(cx + Math.cos(angle) * 7, cy + Math.sin(angle) * 7); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill();
      ctx.fillStyle = '#FFD700';
      [[cx + 6, cy - 6],[cx - 6, cy + 5],[cx + 5, cy + 6],[cx - 7, cy - 4]].forEach(([bx, by]) => {
        ctx.beginPath(); ctx.arc(bx, by, 1.5, 0, Math.PI * 2); ctx.fill();
      }); break;
  }
  ctx.restore();
};

// ---------------------------------------------------------------------------
// Game logic helpers — parameterised on ROWS/COLS
// ---------------------------------------------------------------------------
const initializeGrid = (ROWS, COLS) => {
  const grid = [];
  for (let row = 0; row < ROWS; row++) {
    grid[row] = [];
    for (let col = 0; col < COLS; col++) {
      let type, attempts = 0;
      do {
        type = Math.floor(Math.random() * TILE_TYPES);
        attempts++;
        if (attempts > 50) break;
      } while (
        (col >= 2 && grid[row][col-1]?.type === type && grid[row][col-2]?.type === type) ||
        (row >= 2 && grid[row-1]?.[col]?.type === type && grid[row-2]?.[col]?.type === type)
      );
      grid[row][col] = {
        type, id: `${row}-${col}-${Date.now()}-${Math.random()}`, special: null, isNew: false,
        animX: col * (TILE_SIZE + TILE_GAP), animY: row * (TILE_SIZE + TILE_GAP),
        targetX: col * (TILE_SIZE + TILE_GAP), targetY: row * (TILE_SIZE + TILE_GAP),
        opacity: 1, scale: 1,
      };
    }
  }
  return grid;
};

const hasValidMoves = (grid, ROWS, COLS) => {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (col < COLS - 1) {
        const tg = grid.map(r => r.map(t => t ? { ...t } : null));
        [tg[row][col], tg[row][col+1]] = [tg[row][col+1], tg[row][col]];
        if (findMatchesSimple(tg, ROWS, COLS).length > 0) return true;
      }
      if (row < ROWS - 1) {
        const tg = grid.map(r => r.map(t => t ? { ...t } : null));
        [tg[row][col], tg[row+1][col]] = [tg[row+1][col], tg[row][col]];
        if (findMatchesSimple(tg, ROWS, COLS).length > 0) return true;
      }
    }
  }
  return false;
};

const findMatchesSimple = (grid, ROWS, COLS) => {
  const matches = [];
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS - 2; col++)
      if (grid[row][col] && grid[row][col+1] && grid[row][col+2] &&
          grid[row][col].type === grid[row][col+1].type && grid[row][col].type === grid[row][col+2].type)
        matches.push({ row, col });
  for (let row = 0; row < ROWS - 2; row++)
    for (let col = 0; col < COLS; col++)
      if (grid[row][col] && grid[row+1][col] && grid[row+2][col] &&
          grid[row][col].type === grid[row+1][col].type && grid[row][col].type === grid[row+2][col].type)
        matches.push({ row, col });
  return matches;
};

const calculateUnusedSpecialsBonus = (grid) => {
  let bonus = 0;
  const specials = { line: 0, bomb: 0, cross: 0, supernova: 0, hypernova: 0 };
  grid.forEach(row => row.forEach(tile => {
    if (tile?.special) {
      specials[tile.special]++;
      switch (tile.special) {
        case 'line': bonus += 100; break; case 'bomb': bonus += 150; break;
        case 'cross': bonus += 200; break; case 'supernova': bonus += 300; break;
        case 'hypernova': bonus += 500; break;
      }
    }
  }));
  return { bonus, specials };
};

// ---------------------------------------------------------------------------
// Campaign localStorage helpers
// ---------------------------------------------------------------------------
const loadCampaignHighScores = () => {
  try { return JSON.parse(localStorage.getItem(CAMPAIGN_KEYS.highScores) || '[]'); } catch { return []; }
};
const loadCampaignStars = () => {
  try { return JSON.parse(localStorage.getItem(CAMPAIGN_KEYS.stars) || '[]'); } catch { return []; }
};
const saveCampaignProgress = ({ levelIndex, score, stars, levelStars, levelHighScores }) => {
  try {
    const newHighScores = [...levelHighScores];
    if (!newHighScores[levelIndex] || score > newHighScores[levelIndex]) newHighScores[levelIndex] = score;
    const newStars = [...levelStars];
    if (!newStars[levelIndex] || stars > newStars[levelIndex]) newStars[levelIndex] = stars;
    localStorage.setItem(CAMPAIGN_KEYS.highScores, JSON.stringify(newHighScores));
    localStorage.setItem(CAMPAIGN_KEYS.stars, JSON.stringify(newStars));
    const totalScore = newHighScores.reduce((a, b) => a + (b || 0), 0);
    localStorage.setItem(CAMPAIGN_KEYS.totalScore, totalScore.toString());
    // Advance highest level reached
    const currentLevel = parseInt(localStorage.getItem(CAMPAIGN_KEYS.level) || '1', 10);
    const thisLevel = levelIndex + 1;
    if (stars > 0 && thisLevel >= currentLevel) {
      localStorage.setItem(CAMPAIGN_KEYS.level, Math.min(thisLevel + 1, LEVEL_CONFIGS.length).toString());
    }
    return { newHighScores, newStars };
  } catch { return { newHighScores: levelHighScores, newStars: levelStars }; }
};

// ---------------------------------------------------------------------------
// Star display helper
// ---------------------------------------------------------------------------
const StarRating = ({ stars, max = 5 }) => (
  <span style={{ fontSize: '20px', letterSpacing: '2px' }}>
    {Array.from({ length: max }, (_, i) => (
      <span key={i} style={{ color: i < stars ? '#FFD700' : '#ccc' }}>★</span>
    ))}
  </span>
);

// =============================================================================
// LEVEL SELECT SCREEN
// =============================================================================
const LevelSelectScreen = ({ levelStars, levelHighScores, onSelectLevel }) => {
  const storedLevel = parseInt(localStorage.getItem(CAMPAIGN_KEYS.level) || '1', 10);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif', padding: '30px 20px',
    }}>
      <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
        Campaign Mode
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '24px', fontSize: '14px' }}>
        Total stars: {levelStars.reduce((a, b) => a + (b || 0), 0)} / {LEVEL_CONFIGS.length * 5}
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px', width: '100%', maxWidth: '860px',
      }}>
        {LEVEL_CONFIGS.map((cfg, idx) => {
          const levelNum = cfg.level;
          const reached = levelNum <= storedLevel;
          const gated = levelNum === 7 || levelNum === 8;
          const gateUnlocked = canAdvanceToLevel(levelNum, levelStars);
          // A level is playable if it has been reached, OR if it's next in sequence (storedLevel+1), OR gate is met
          const isNext = levelNum === storedLevel + 1 && (!gated || gateUnlocked);
          const unlocked = reached || isNext || (gated && gateUnlocked);
          // Future = not yet reached and not immediately next (unreachable right now)
          const isFuture = !reached && !isNext && !gateUnlocked;
          const stars = levelStars[idx] || 0;
          const highScore = levelHighScores[idx] || 0;

          if (isFuture) {
            // Minimal locked card — don't reveal details of unreachable levels
            return (
              <div key={levelNum} style={{
                background: 'rgba(255,255,255,0.12)', border: '2px dashed rgba(255,255,255,0.25)',
                borderRadius: '14px', padding: '18px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>🔒</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'rgba(255,255,255,0.35)' }}>Level {levelNum}</div>
              </div>
            );
          }

          return (
            <button
              key={levelNum}
              disabled={!unlocked}
              onClick={() => unlocked && onSelectLevel(idx)}
              style={{
                background: unlocked ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                border: 'none', borderRadius: '14px', padding: '18px 14px',
                cursor: unlocked ? 'pointer' : 'not-allowed',
                boxShadow: unlocked ? '0 4px 14px rgba(0,0,0,0.2)' : 'none',
                transition: 'transform 0.1s', textAlign: 'center',
              }}
              onMouseEnter={e => { if (unlocked) e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: unlocked ? '#333' : '#999', marginBottom: '6px' }}>
                {unlocked ? '' : '🔒 '}Level {levelNum}
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                {cfg.type === 'timeattack' ? `⏱ ${cfg.duration}s` : `${cfg.rows}×${cfg.cols} · ${cfg.moves} moves`}
              </div>
              {unlocked && <StarRating stars={stars} />}
              {unlocked && highScore > 0 && (
                <div style={{ fontSize: '11px', color: '#667eea', marginTop: '6px' }}>Best: {highScore}</div>
              )}
              {!unlocked && (
                <div style={{ fontSize: '11px', color: '#bbb', marginTop: '6px' }}>
                  {levelNum === 7 ? 'Need 3★ on L5 or L6' : 'Need 25★ total'}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// TRANSITION SCREEN — shown after winning a level (v1.2)
// =============================================================================
// =============================================================================
// LEVEL INTRO DATA — shown before each level, every time (v1.13)
// =============================================================================
const LEVEL_INTROS = [
  // Level 1
  {
    icon: '🎮',
    heading: 'Welcome!',
    bullets: [
      'Swap adjacent tiles to match 3 or more of the same color',
      'Reach the target score before your moves run out',
      'Bigger matches clear more tiles and score more points',
    ],
  },
  // Level 2
  {
    icon: '⚡',
    heading: 'Special Tiles',
    bullets: [
      '4 in a row → ⚡ Line clears the entire row',
      '5 in a row → 💣 Bomb clears a wide area plus row and column',
      'L-shape match → ✨ Cross clears full row and full column',
      '6-match → 🌌 Supernova  ·  7+ → 🌠 Hypernova',
      'Swap two specials together for a powerful combination blast',
    ],
  },
  // Level 3 — Time Attack
  {
    icon: '⏱️',
    heading: 'Time Attack!',
    bullets: [
      'No move limit — race against a 60 second timer instead',
      'Reach the target score before time runs out',
      'Create a special tile → +5s',
      'Combo ×5 or better → +5s',
      'Every 5,000 points scored → +5s',
    ],
  },
  // Level 4
  {
    icon: '🔥',
    heading: 'Combos & Cascades',
    bullets: [
      'When cleared tiles cause new matches to fall into place, that\'s a cascade',
      'Each cascade multiplies your score — chain them for massive points',
      'Swapping two specials triggers a powerful combination effect',
    ],
  },
  // Level 5
  {
    icon: '🏦',
    heading: 'Bonus Moves',
    bullets: [
      'Every 10,000 points earns you 1 bonus move — shown as 🏦 in the header',
      'Bonus moves carry forward between levels',
      'When regular moves run out you\'ll be asked: spend bonus moves to keep playing, or save them for harder levels ahead',
      'In time attack levels each bonus move adds +5 seconds',
    ],
  },
  // Level 6 — Time Attack round 2
  {
    icon: '⏱️',
    heading: 'Time Attack — Round 2',
    bullets: [
      'Two minutes this time — but a harder target score',
      'Same time extensions: +5s for specials, combos ×5+, every 5,000 pts',
      'When time runs out you\'ll be prompted to spend saved bonus moves — each adds 5 seconds',
      'Or save them and carry them to the next level',
    ],
  },
  // Level 7
  {
    icon: '🌟',
    heading: 'Almost There!',
    bullets: [
      'Score well — you\'ll need 25 stars across all 7 levels to unlock the final level',
      'All your bonus moves and best combos count',
    ],
  },
  // Level 8
  {
    icon: '🏆',
    heading: 'Final Level!',
    bullets: [
      'You\'ve made it to the end of the campaign',
      'Use everything you\'ve learned — and your saved bonus moves',
      'Good luck!',
    ],
  },
];

// =============================================================================
// LEVEL INTRO SCREEN (v1.13)
// =============================================================================
const LevelIntroScreen = ({ levelIndex, onContinue }) => {
  const intro = LEVEL_INTROS[levelIndex];
  const cfg = getLevelConfig(levelIndex + 1);
  if (!intro) { onContinue(); return null; }
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif', padding: '30px 20px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.97)', borderRadius: '20px', padding: '32px 36px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)', maxWidth: '400px', width: '100%',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
          Level {cfg.level}
        </div>
        <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '8px' }}>{intro.icon}</div>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333', textAlign: 'center' }}>
          {intro.heading}
        </h2>
        <ul style={{ margin: '0 0 24px 0', padding: '0 0 0 18px', listStyle: 'disc' }}>
          {intro.bullets.map((b, i) => (
            <li key={i} style={{ fontSize: '14px', color: '#444', lineHeight: '1.6', marginBottom: '6px' }}>
              {b}
            </li>
          ))}
        </ul>
        <button
          onClick={onContinue}
          style={{
            width: '100%', padding: '12px', fontSize: '15px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', border: 'none', borderRadius: '10px',
            cursor: 'pointer', fontWeight: 'bold',
          }}
        >
          Let's go! →
        </button>
      </div>
    </div>
  );
};

const TransitionScreen = ({ data, onNextLevel, onViewMap }) => {
  const { levelIndex, score, stars, bonusMovesEarned, bonusMovePoolTotal, movesUsed, bestCombo, specialsCreated, campaignTotalScore } = data;
  const cfg = getLevelConfig(levelIndex + 1);
  const nextCfg = getLevelConfig(levelIndex + 2);
  const isLastLevel = !nextCfg;
  const nextIsTimeAttack = nextCfg?.type === 'timeattack';
  const isTimeAttack = cfg.type === 'timeattack';

  const statRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f0f0f0' };
  const statLabelStyle = { fontSize: '13px', color: '#666' };
  const statValueStyle = { fontSize: '13px', fontWeight: 'bold', color: '#333' };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif', padding: '30px 20px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.97)', borderRadius: '20px', padding: '32px 36px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)', textAlign: 'center', maxWidth: '420px', width: '100%',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '4px' }}>🎉</div>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#333' }}>Level {cfg.level} Complete!</h2>
        <div style={{ fontSize: '14px', color: '#888', marginBottom: '14px' }}>
          {isTimeAttack ? `⏱ Time Attack — ${cfg.duration}s` : `${cfg.rows}×${cfg.cols} board`}
        </div>

        <StarRating stars={stars} size={28} />

        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '12px 0 2px 0' }}>
          {score.toLocaleString()}
        </div>
        <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>Level score</div>

        {/* Stats breakdown */}
        <div style={{ textAlign: 'left', margin: '0 0 16px 0', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
          {!isTimeAttack && movesUsed != null && (
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Moves used</span>
              <span style={statValueStyle}>{movesUsed} of {cfg.moves}</span>
            </div>
          )}
          {bestCombo > 0 && (
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Best combo</span>
              <span style={statValueStyle}>×{bestCombo}</span>
            </div>
          )}
          {specialsCreated > 0 && (
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Specials created</span>
              <span style={statValueStyle}>{specialsCreated}</span>
            </div>
          )}
          {bonusMovesEarned > 0 && (
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Bonus moves earned</span>
              <span style={statValueStyle}>+{bonusMovesEarned}</span>
            </div>
          )}
          {bonusMovePoolTotal > 0 && (
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Bonus moves in pool</span>
              <span style={statValueStyle}>{bonusMovePoolTotal}</span>
            </div>
          )}
        </div>

        {/* Campaign running total */}
        <div style={{
          background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '10px',
          padding: '8px 16px', marginBottom: '14px',
        }}>
          <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>Campaign total</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4c1d95' }}>{campaignTotalScore.toLocaleString()}</div>
        </div>

        {nextIsTimeAttack && (
          <div style={{
            background: '#fefce8', border: '1px solid #fde047', borderRadius: '10px',
            padding: '8px 16px', fontSize: '14px', color: '#854d0e', marginBottom: '14px',
            fontWeight: 'bold',
          }}>
            ⏱️ Next: Timed Mode — {nextCfg.duration}s
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
          <button
            onClick={onViewMap}
            style={{
              padding: '10px 20px', fontSize: '14px', background: 'transparent',
              color: '#667eea', border: '2px solid #667eea', borderRadius: '10px',
              cursor: 'pointer', fontWeight: 'bold',
            }}
          >
            🗺️ View Map
          </button>
          <button
            onClick={onNextLevel}
            style={{
              padding: '10px 20px', fontSize: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontWeight: 'bold',
            }}
          >
            {isLastLevel ? '🏆 See Results' : 'Next Level →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// CAMPAIGN COMPLETE SCREEN
// =============================================================================
const CampaignCompleteScreen = ({ levelStars, levelHighScores, onPlayAgain, onResetAll }) => {
  const totalStars = levelStars.reduce((a, b) => a + (b || 0), 0);
  const maxStars = LEVEL_CONFIGS.length * 5;
  const totalScore = levelHighScores.reduce((a, b) => a + (b || 0), 0);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif', padding: '30px 20px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.97)', borderRadius: '20px', padding: '32px 36px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)', textAlign: 'center', maxWidth: '420px', width: '100%',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', color: '#333' }}>Campaign Complete!</h2>
        <div style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>You finished all 8 levels</div>

        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
          {totalScore.toLocaleString()}
        </div>
        <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>Total campaign score</div>

        <div style={{ fontSize: '20px', marginBottom: '20px' }}>
          <span style={{ color: '#FFD700', letterSpacing: '2px' }}>{'★'.repeat(totalStars)}</span>
          <span style={{ color: '#ddd', letterSpacing: '2px' }}>{'★'.repeat(maxStars - totalStars)}</span>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{totalStars} / {maxStars} stars</div>
        </div>

        {/* Per-level breakdown */}
        <div style={{ textAlign: 'left', borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginBottom: '20px' }}>
          {LEVEL_CONFIGS.map((cfg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ fontSize: '13px', color: '#555' }}>Level {i + 1}</span>
              <span style={{ fontSize: '13px', color: '#888' }}>{(levelHighScores[i] || 0).toLocaleString()}</span>
              <span style={{ fontSize: '14px', letterSpacing: '1px' }}>
                {'★'.repeat(levelStars[i] || 0).split('').map((s, j) => (
                  <span key={j} style={{ color: '#FFD700' }}>★</span>
                ))}
                {'★'.repeat(5 - (levelStars[i] || 0)).split('').map((s, j) => (
                  <span key={j} style={{ color: '#ddd' }}>★</span>
                ))}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onPlayAgain}
            style={{
              padding: '12px', fontSize: '15px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontWeight: 'bold',
            }}
          >
            🗺️ Play Again
          </button>
          <button
            onClick={onResetAll}
            style={{
              padding: '12px', fontSize: '14px', background: 'transparent',
              color: '#e53935', border: '2px solid #e53935', borderRadius: '10px',
              cursor: 'pointer', fontWeight: 'bold',
            }}
          >
            🔄 Reset all and start again
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN CAMPAIGN GAME COMPONENT
// =============================================================================
const CampaignGame = ({ levelIndex, onLevelComplete, onBackToMap, highScore, bestStars, onStartOver }) => {
  const cfg = getLevelConfig(levelIndex + 1);
  const ROWS = cfg.rows;
  const COLS = cfg.cols;
  const INITIAL_MOVES = cfg.moves ?? 0; // null for time attack
  const IS_TIME_ATTACK = cfg.type === 'timeattack';
  const LEVEL_TARGET = getLevelTarget(cfg);

  // Game state
  const [grid, setGrid] = useState(() => initializeGrid(ROWS, COLS));
  const [selectedTile, setSelectedTile] = useState(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(INITIAL_MOVES);
  const [timeLeft, setTimeLeft] = useState(IS_TIME_ATTACK ? cfg.duration : null);
  const [gameState, setGameState] = useState(IS_TIME_ATTACK ? 'ready' : 'playing'); // ready | playing | won | gameover
  const [isAnimating, setIsAnimating] = useState(false);
  const [combo, setCombo] = useState(0);
  const [lastCombo, setLastCombo] = useState(0);
  const [maxComboReached, setMaxComboReached] = useState(0);
  const [lastMilestoneShown, setLastMilestoneShown] = useState(0);
  const [scorePopups, setScorePopups] = useState([]);
  const [showNoMoves, setShowNoMoves] = useState(false);
  const [pendingSpecials, setPendingSpecials] = useState([]);
  const [targetReached, setTargetReached] = useState(false);
  const [matchedTiles, setMatchedTiles] = useState([]);
  const [turnComplete, setTurnComplete] = useState(true);
  const [bonusMoveFlash, setBonusMoveFlash] = useState(0);
  const [showBonusPrompt, setShowBonusPrompt] = useState(false);
  const [bonusRoundActive, setBonusRoundActive] = useState(false);
  const [bonusRoundScore, setBonusRoundScore] = useState(0);
  const [preBonusScore, setPreBonusScore] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [flashingTiles, setFlashingTiles] = useState([]);
  const [glowingTiles, setGlowingTiles] = useState([]);
  const [chainTexts, setChainTexts] = useState([]);
  const [currentTurnScore, setCurrentTurnScore] = useState(0);
  const [showAdmin, setShowAdmin] = useState(() => new URLSearchParams(window.location.search).get('admin') === '1');

  // v1.4: Time attack extension state
  const [timeExtensions, setTimeExtensions] = useState([]); // floating popup notifications
  const [lastScoreMilestone, setLastScoreMilestone] = useState(0);

  // Campaign bonus moves — persistent across levels
  const [campaignBonusMoves, setCampaignBonusMoves] = useState(
    () => parseInt(localStorage.getItem(CAMPAIGN_KEYS.bonusMoves) || '0', 10)
  );
  // No separate bonusMovePool — bonus moves earned during play go directly into campaignBonusMoves (v1.8)
  // True after player chooses "Use banked moves" — each swap consumes 1 from campaignBonusMoves
  const [usingBankedMoves, setUsingBankedMoves] = useState(false);
  // True when regular moves=0, pool=0, and campaignBonusMoves>0, shows banked moves decision prompt
  const [showBankedMovesPrompt, setShowBankedMovesPrompt] = useState(false);
  // v1.11: True when timer hits 0, score < target, and campaignBonusMoves > 0 — pauses timer
  const [showTimeUpPrompt, setShowTimeUpPrompt] = useState(false);
  // v1.14: set to true when time expires; resolved only after animations finish
  const [pendingTimeExpiry, setPendingTimeExpiry] = useState(false);

  // Refs
  const dragStart = useRef(null);
  const swapFiredRef = useRef(false);
  const animationFrameRef = useRef(null);
  const frameCountRef = useRef(0);
  const animStateRef = useRef({});
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bonusMoveThresholdRef = useRef(0);
  const bonusMoveFlashPendingRef = useRef(0);
  const specialsCreatedRef = useRef(0);
  const adminPressTimerRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const timeExtendedThisTurnRef = useRef(0);    // v1.4: seconds extended this player action
  const campaignBonusMovesRef = useRef(0);      // v1.4: ref mirror for timer callback access
  const usingBankedMovesRef = useRef(false);    // v1.6: ref mirror for use inside setTimeout callbacks

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  // Persist campaign bonus moves + keep ref in sync for timer callback access
  useEffect(() => {
    localStorage.setItem(CAMPAIGN_KEYS.bonusMoves, campaignBonusMoves.toString());
    campaignBonusMovesRef.current = campaignBonusMoves;
  }, [campaignBonusMoves]);

  // Set lookups
  const flashingTileSet = useMemo(() => new Set(flashingTiles.map(t => `${t.row}-${t.col}`)), [flashingTiles]);
  const glowingTileSet  = useMemo(() => new Set(glowingTiles.map(t => `${t.row}-${t.col}`)), [glowingTiles]);
  const matchedTileSet  = useMemo(() => new Set(matchedTiles.map(t => `${t.row}-${t.col}`)), [matchedTiles]);
  const pendingSpecialSet = useMemo(() => new Set(pendingSpecials.map(t => `${t.row}-${t.col}`)), [pendingSpecials]);

  // Board pixel dimensions
  const boardWidth  = COLS * TILE_SIZE + (COLS - 1) * TILE_GAP;
  const boardHeight = ROWS * TILE_SIZE + (ROWS - 1) * TILE_GAP;

  // ---------------------------------------------------------------------------
  // v1.4: Time extension helpers (mirrors arcade time attack)
  // ---------------------------------------------------------------------------
  const addTimeExtension = (reason) => {
    if (!IS_TIME_ATTACK) return;
    if (timeExtendedThisTurnRef.current >= TIME_EXTENSION_CAP_PER_TURN) return;
    const remaining = TIME_EXTENSION_CAP_PER_TURN - timeExtendedThisTurnRef.current;
    const amount = Math.min(TIME_EXTENSION_AMOUNT, remaining);
    timeExtendedThisTurnRef.current += amount;
    setTimeLeft(prev => prev + amount);
    setTimeExtensions(prev => [...prev, { id: Date.now() + Math.random(), reason, createdAt: Date.now() }]);
  };

  const addTimeExtensionPopup = (text) => {
    if (!IS_TIME_ATTACK) return;
    setTimeExtensions(prev => [...prev, { id: Date.now() + Math.random(), reason: text, createdAt: Date.now(), noTime: true }]);
  };

  // Clean up expired time extension popups
  useEffect(() => {
    if (timeExtensions.length === 0) return;
    const timeout = setTimeout(() => {
      setTimeExtensions(prev => prev.filter(e => Date.now() - e.createdAt < 1500));
    }, 1500);
    return () => clearTimeout(timeout);
  }, [timeExtensions]);

  // v1.4: Score milestone time extensions (every 5k pts → +5s)
  useEffect(() => {
    if (!IS_TIME_ATTACK || gameState !== 'playing') return;
    const milestone = Math.floor(score / TIME_EXTENSION_SCORE_INTERVAL) * TIME_EXTENSION_SCORE_INTERVAL;
    if (milestone > lastScoreMilestone && milestone > 0) {
      setLastScoreMilestone(milestone);
      addTimeExtension(`${milestone / 1000}k pts!`);
    }
  }, [score, lastScoreMilestone, gameState]);

  // ---------------------------------------------------------------------------
  // Time Attack timer
  // ---------------------------------------------------------------------------
  // v1.11: Timer pauses while showTimeUpPrompt is displayed (no interval created).
  //        When prompt is dismissed (choice made), this effect re-runs and resumes.
  useEffect(() => {
    if (!IS_TIME_ATTACK || gameState !== 'playing') return;
    if (showTimeUpPrompt) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // v1.11: pause + prompt instead of auto-converting.
          if (scoreRef.current < LEVEL_TARGET && campaignBonusMovesRef.current > 0) {
            setShowTimeUpPrompt(true);
            return 0;
          }
          // v1.14: defer resolution until animations finish
          setPendingTimeExpiry(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [IS_TIME_ATTACK, gameState, showTimeUpPrompt]);

  // ---------------------------------------------------------------------------
  // Win condition check
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (score >= LEVEL_TARGET && gameState === 'playing' && !targetReached) setTargetReached(true);
  }, [score, LEVEL_TARGET, gameState, targetReached]);

  // Campaign bonus move award (same logic as arcade)
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (!turnComplete) return;
    const threshold = Math.floor(score / CAMPAIGN_BONUS_MOVE_INTERVAL) * CAMPAIGN_BONUS_MOVE_INTERVAL;
    if (threshold > 0 && threshold > bonusMoveThresholdRef.current) {
      const newMoves = Math.floor((threshold - bonusMoveThresholdRef.current) / CAMPAIGN_BONUS_MOVE_INTERVAL);
      bonusMoveThresholdRef.current = threshold;
      // v1.11: all level types earn bonus moves (removed !IS_TIME_ATTACK guard)
      setCampaignBonusMoves(prev => prev + newMoves);
      campaignBonusMovesRef.current += newMoves;
      if (showBonusPrompt) bonusMoveFlashPendingRef.current += newMoves;
      else setBonusMoveFlash(prev => prev + newMoves);
    }
  }, [score, gameState, turnComplete]);

  // v1.14: Resolve time attack level end after animations settle
  useEffect(() => {
    if (!pendingTimeExpiry || isAnimating || combo > 0) return;
    setPendingTimeExpiry(false);
    const { bonus } = calculateUnusedSpecialsBonus(grid);
    const total = scoreRef.current + bonus;
    setGameState(total >= LEVEL_TARGET ? 'won' : 'gameover');
  }, [pendingTimeExpiry, isAnimating, combo, grid, LEVEL_TARGET]);

  // Game end logic (move-based levels)
  useEffect(() => {
    if (IS_TIME_ATTACK) return;
    if (!turnComplete || isAnimating || combo > 0 || pendingSpecials.length > 0) return;
    if (gameState !== 'playing') return;
    if (showBonusPrompt) return;
    if (showBankedMovesPrompt) return;

    const checkTimer = setTimeout(() => {
      const currentScore = scoreRef.current;
      const pendingThreshold = Math.floor(currentScore / CAMPAIGN_BONUS_MOVE_INTERVAL) * CAMPAIGN_BONUS_MOVE_INTERVAL;
      if (pendingThreshold > bonusMoveThresholdRef.current) return;

      const { bonus: specialsBonus } = calculateUnusedSpecialsBonus(grid);
      const scoreWithBonus = currentScore + specialsBonus;
      const hasReachedTarget = targetReached || scoreWithBonus >= LEVEL_TARGET;

      if (hasReachedTarget && moves > 0 && !bonusRoundActive && !showBonusPrompt) {
        if (!targetReached) setTargetReached(true);
        setShowBonusPrompt(true);
        return;
      }
      if (bonusRoundActive && moves <= 0) {
        setScore(prev => prev + specialsBonus);
        setGameState('won');
        return;
      }

      // moves = 0, not in bonus round: offer bonus moves prompt if pool > 0.
      // Prompt fires regardless of whether target was reached — the player should
      // always get the option to keep playing with bonus moves (win or fail).
      if (moves <= 0 && !bonusRoundActive && !usingBankedMoves) {
        if (campaignBonusMoves > 0) {
          setShowBankedMovesPrompt(true);
          return;
        }
        // No bonus moves — resolve immediately.
        setScore(prev => prev + specialsBonus);
        if (hasReachedTarget && !targetReached) setTargetReached(true);
        setGameState(hasReachedTarget ? 'won' : 'gameover');
        return;
      }

      // Player is actively using bonus moves (one per swap from campaignBonusMoves).
      if (moves <= 0 && !bonusRoundActive && usingBankedMoves) {
        if (campaignBonusMoves > 0) return; // still have bonus moves — game continues
        // Pool exhausted — resolve.
        setScore(prev => prev + specialsBonus);
        if (hasReachedTarget && !targetReached) setTargetReached(true);
        setGameState(hasReachedTarget ? 'won' : 'gameover');
      }
    }, 150);
    return () => clearTimeout(checkTimer);
  }, [moves, gameState, LEVEL_TARGET, isAnimating, combo, targetReached, pendingSpecials.length, grid, turnComplete, bonusRoundActive, showBonusPrompt, IS_TIME_ATTACK, usingBankedMoves, showBankedMovesPrompt, campaignBonusMoves]);

  // Bonus round handlers
  const startBonusRound = () => {
    setShowBonusPrompt(false);
    setBonusRoundActive(true);
    setPreBonusScore(score);
    setBonusRoundScore(0);
    if (bonusMoveFlashPendingRef.current > 0) {
      setBonusMoveFlash(prev => prev + bonusMoveFlashPendingRef.current);
      bonusMoveFlashPendingRef.current = 0;
    }
  };

  const endLevelEarly = () => {
    setShowBonusPrompt(false);
    bonusMoveFlashPendingRef.current = 0;
    const moveBonus = moves * EARLY_END_BONUS_PER_MOVE;
    const { bonus: specialsBonus } = calculateUnusedSpecialsBonus(grid);
    setScore(prev => prev + moveBonus + specialsBonus);
    setGameState('won');
  };


  // Player chose "Use bonus moves" — remaining campaignBonusMoves consumed one per swap
  const startUsingBankedMoves = () => {
    usingBankedMovesRef.current = true;
    setUsingBankedMoves(true);
    setShowBankedMovesPrompt(false);
  };

  // Player chose "End and carry moves forward" — end level, add unused-specials bonus,
  // remaining campaignBonusMoves persist naturally (not reset here).
  const endLevelCarryBanked = () => {
    const { bonus: specialsBonus } = calculateUnusedSpecialsBonus(grid);
    const wonLevel = targetReached || scoreRef.current + specialsBonus >= LEVEL_TARGET;
    usingBankedMovesRef.current = false;
    setUsingBankedMoves(false);
    setShowBankedMovesPrompt(false);
    setScore(prev => prev + specialsBonus);
    if (wonLevel && !targetReached) setTargetReached(true);
    setGameState(wonLevel ? 'won' : 'gameover');
  };

  // v1.11: Player chose "Use bonus move (+5s)" from the time-up prompt.
  // Consumes one bonus move, restores time, dismisses prompt — timer resumes automatically
  // because showTimeUpPrompt → false re-triggers the timer useEffect.
  const useTimeUpBonusMove = () => {
    campaignBonusMovesRef.current -= 1;
    setCampaignBonusMoves(prev => Math.max(0, prev - 1));
    setTimeLeft(TIME_EXTENSION_AMOUNT);
    setShowTimeUpPrompt(false);
  };

  // v1.11: Player chose "End level — save moves" from the time-up prompt.
  // Ends the level immediately; campaignBonusMoves persist naturally.
  // v1.14: defer resolution until animations finish via pendingTimeExpiry.
  const endLevelSaveMoves = () => {
    setShowTimeUpPrompt(false);
    setPendingTimeExpiry(true);
  };

  // Popup cleanup
  useEffect(() => {
    if (scorePopups.length > 0) {
      const timer = setTimeout(() => {
        const now = Date.now();
        setScorePopups(prev => {
          let filtered = prev.filter(p => {
            const elapsed = now - p.createdAt;
            return elapsed < p.delay + p.duration;
          });
          if (filtered.length > 8) filtered = filtered.slice(-8);
          return filtered;
        });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [scorePopups]);

  // Combo milestone popups
  useEffect(() => {
    const milestones = [5, 10, 15];
    for (const milestone of milestones) {
      if (combo >= milestone && lastMilestoneShown < milestone) {
        const message = milestone === 15 ? '💥 LEGENDARY COMBO!' : milestone === 10 ? '⚡ ULTRA COMBO!' : '🌟 MEGA COMBO!';
        setScorePopups(prev => [...prev, {
          id: Date.now() + Math.random(), row: 1, col: Math.floor(COLS / 2), points: 0,
          text: message, delay: 0, duration: 3500, createdAt: Date.now(),
        }]);
        setLastMilestoneShown(milestone);
        break;
      }
    }
  }, [combo, lastMilestoneShown, COLS]);

  useEffect(() => { if (combo === 0) setLastMilestoneShown(0); }, [combo]);

  // Animation failsafe
  useEffect(() => {
    if (isAnimating) {
      const failsafe = setTimeout(() => {
        setIsAnimating(false); setPendingSpecials([]); setTurnComplete(true);
      }, 8000);
      return () => clearTimeout(failsafe);
    }
  }, [isAnimating]);

  // ---------------------------------------------------------------------------
  // Canvas rendering
  // ---------------------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    frameCountRef.current++;
    if (frameCountRef.current % FRAME_SKIP !== 0) {
      animationFrameRef.current = requestAnimationFrame(renderCanvas);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    const bgGradient = ctx.createLinearGradient(0, 0, boardWidth, boardHeight);
    if (isDarkMode) {
      bgGradient.addColorStop(0, '#1a1a2e'); bgGradient.addColorStop(1, '#16213e');
    } else {
      bgGradient.addColorStop(0, '#f5f7fa'); bgGradient.addColorStop(1, '#c3cfe2');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, boardWidth, boardHeight);

    grid.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (!tile) return;
        const tileKey = `${rowIndex}-${colIndex}`;
        const isSelected = selectedTile?.row === rowIndex && selectedTile?.col === colIndex;
        const isMatched = matchedTileSet.has(tileKey);
        const isPending = pendingSpecialSet.has(tileKey);
        const isGlowing = glowingTileSet.has(tileKey);
        const isFlashing = flashingTileSet.has(tileKey);
        const targetX = colIndex * (TILE_SIZE + TILE_GAP);
        const targetY = rowIndex * (TILE_SIZE + TILE_GAP);
        const tileId = tile.id;
        if (!animStateRef.current[tileId]) {
          animStateRef.current[tileId] = {
            x: tile.animX !== undefined ? tile.animX : targetX,
            y: tile.animY !== undefined ? tile.animY : targetY,
          };
        }
        const anim = animStateRef.current[tileId];
        anim.x += (targetX - anim.x) * ANIMATION_SPEED;
        anim.y += (targetY - anim.y) * ANIMATION_SPEED;
        let scale = 1, opacity = 1;
        if (isMatched) { scale = 1.1; opacity = 0.7; }
        else if (isSelected) { scale = 1.1; }
        else if (isPending) { scale = 1.05; }
        drawTile(ctx, anim.x, anim.y, TILE_SIZE, tile.type, {
          isSelected, isMatched, isSpecial: tile.special !== null, isPending, opacity, scale,
        });
        if (isGlowing) {
          ctx.save();
          ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4;
          ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 15;
          ctx.strokeRect(anim.x - 2, anim.y - 2, TILE_SIZE + 4, TILE_SIZE + 4);
          ctx.restore();
        }
        if (isFlashing) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(anim.x, anim.y, TILE_SIZE, TILE_SIZE);
          ctx.restore();
        }
        if (tile.special) drawSpecialIcon(ctx, anim.x, anim.y, TILE_SIZE, tile.special);
      });
    });
    ctx.restore();
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
  }, [grid, selectedTile, matchedTileSet, pendingSpecialSet, boardWidth, boardHeight, flashingTileSet, glowingTileSet, isDarkMode]);

  useEffect(() => {
    const liveIds = new Set();
    grid.forEach(row => row.forEach(tile => { if (tile?.id) liveIds.add(tile.id); }));
    Object.keys(animStateRef.current).forEach(id => { if (!liveIds.has(id)) delete animStateRef.current[id]; });
  }, [grid]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [renderCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width  = boardWidth  * dpr;
    canvas.height = boardHeight * dpr;
    canvas.style.width  = `${boardWidth}px`;
    canvas.style.height = `${boardHeight}px`;
  }, [boardWidth, boardHeight]);

  // ---------------------------------------------------------------------------
  // Input handling
  // ---------------------------------------------------------------------------
  const handleCanvasClick = (e) => {
    if (swapFiredRef.current || e.detail === 0) return;
    if (isAnimating || gameState !== 'playing') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / (TILE_SIZE + TILE_GAP));
    const row = Math.floor((e.clientY - rect.top) / (TILE_SIZE + TILE_GAP));
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    handleTileClick(row, col);
  };

  const getEventCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleDragStart = (e) => {
    if (isAnimating || gameState !== 'playing') return;
    e.preventDefault();
    const { x, y } = getEventCoords(e);
    const col = Math.floor(x / (TILE_SIZE + TILE_GAP));
    const row = Math.floor(y / (TILE_SIZE + TILE_GAP));
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      dragStart.current = { row, col, x, y };
      setSelectedTile({ row, col });
    }
  };

  const handleDragMove = (e) => {
    if (!dragStart.current || isAnimating || gameState !== 'playing') return;
    e.preventDefault();
    const { x, y } = getEventCoords(e);
    const dx = x - dragStart.current.x, dy = y - dragStart.current.y;
    const threshold = TILE_SIZE * 0.4;
    let targetRow = dragStart.current.row, targetCol = dragStart.current.col;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) targetCol = dragStart.current.col + 1;
      else if (dx < -threshold) targetCol = dragStart.current.col - 1;
    } else {
      if (dy > threshold) targetRow = dragStart.current.row + 1;
      else if (dy < -threshold) targetRow = dragStart.current.row - 1;
    }
    if ((targetRow !== dragStart.current.row || targetCol !== dragStart.current.col) &&
        targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) {
      const { row: startRow, col: startCol } = dragStart.current;
      dragStart.current = null;
      swapFiredRef.current = true;
      setTimeout(() => { swapFiredRef.current = false; }, 300);
      setSelectedTile(null);
      attemptSwap(startRow, startCol, targetRow, targetCol);
    }
  };

  const handleDragEnd = () => {
    if (dragStart.current) setSelectedTile(null);
    dragStart.current = null;
  };

  const handleTileClick = (row, col) => {
    if (isAnimating || gameState !== 'playing') return;
    if (!selectedTile) { setSelectedTile({ row, col }); return; }
    const rowDiff = Math.abs(selectedTile.row - row), colDiff = Math.abs(selectedTile.col - col);
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      attemptSwap(selectedTile.row, selectedTile.col, row, col);
    } else {
      setSelectedTile({ row, col });
    }
  };

  const attemptSwap = (row1, col1, row2, col2) => {
    setIsAnimating(true); setSelectedTile(null); setCurrentTurnScore(0); setTurnComplete(false);
    const newGrid = grid.map(r => r.map(t => t ? { ...t } : null));
    const tile1Special = newGrid[row1][col1]?.special;
    const tile2Special = newGrid[row2][col2]?.special;
    [newGrid[row1][col1], newGrid[row2][col2]] = [newGrid[row2][col2], newGrid[row1][col1]];
    setGrid(newGrid);
    if (tile1Special && tile2Special) {
      if (usingBankedMovesRef.current) setCampaignBonusMoves(prev => Math.max(0, prev - 1));
      else setMoves(prev => prev - 1);
      // v1.12: detect any 4+ matches created by the swap, beyond the two specials themselves.
      // These are passed to activateSpecialCombination so specials can form from them.
      const { connectedGroups: swapGroups } = findMatches(newGrid);
      const specialPositions = new Set([`${row1}-${col1}`, `${row2}-${col2}`]);
      const additionalGroups = swapGroups.filter(g =>
        g.totalUniqueTiles >= 4 &&
        !g.tiles.every(t => specialPositions.has(`${t.row}-${t.col}`))
      );
      setTimeout(() => activateSpecialCombination(row1, col1, row2, col2, tile1Special, tile2Special, newGrid, additionalGroups, { row: row2, col: col2 }), 300);
      return;
    }
    setTimeout(() => {
      const { matches, matchGroups, lShapeMatches, connectedGroups } = findMatches(newGrid);
      if (matches.length > 0) {
        if (!IS_TIME_ATTACK) {
          if (usingBankedMovesRef.current) setCampaignBonusMoves(prev => Math.max(0, prev - 1));
          else setMoves(prev => prev - 1);
        }
        const comboIncrease = matchGroups.length + (lShapeMatches?.length || 0);
        setCombo(comboIncrease);
        setMaxComboReached(current => Math.max(current, comboIncrease));
        processMatches(newGrid, matchGroups, lShapeMatches, comboIncrease, 0, connectedGroups, { row: row2, col: col2 });
      } else {
        const revertGrid = newGrid.map(r => r.map(t => t ? { ...t } : null));
        [revertGrid[row1][col1], revertGrid[row2][col2]] = [revertGrid[row2][col2], revertGrid[row1][col1]];
        setGrid(revertGrid); setIsAnimating(false); setTurnComplete(true);
      }
    }, 300);
  };

  // ---------------------------------------------------------------------------
  // Match finding
  // ---------------------------------------------------------------------------
  const findMatches = (currentGrid) => {
    const matches = [], matchGroups = [], visited = new Set();
    for (let row = 0; row < ROWS; row++) {
      let col = 0;
      while (col < COLS) {
        const tile = currentGrid[row][col];
        if (!tile) { col++; continue; }
        let matchLength = 1;
        while (col + matchLength < COLS && currentGrid[row][col + matchLength]?.type === tile.type) matchLength++;
        if (matchLength >= 3) {
          const tiles = [];
          for (let i = 0; i < matchLength; i++) { tiles.push({ row, col: col + i }); matches.push({ row, col: col + i }); visited.add(`${row}-${col + i}`); }
          matchGroups.push({ tiles, length: matchLength, direction: 'horizontal', tileType: tile.type });
        }
        col += matchLength;
      }
    }
    for (let col = 0; col < COLS; col++) {
      let row = 0;
      while (row < ROWS) {
        const tile = currentGrid[row][col];
        if (!tile) { row++; continue; }
        let matchLength = 1;
        while (row + matchLength < ROWS && currentGrid[row + matchLength][col]?.type === tile.type) matchLength++;
        if (matchLength >= 3) {
          const tiles = [];
          for (let i = 0; i < matchLength; i++) { tiles.push({ row: row + i, col }); if (!visited.has(`${row + i}-${col}`)) matches.push({ row: row + i, col }); }
          matchGroups.push({ tiles, length: matchLength, direction: 'vertical', tileType: tile.type });
        }
        row += matchLength;
      }
    }
    const lShapeMatches = [];
    for (let i = 0; i < matchGroups.length; i++) {
      for (let j = i + 1; j < matchGroups.length; j++) {
        if (matchGroups[i].direction !== matchGroups[j].direction && matchGroups[i].tileType === matchGroups[j].tileType) {
          const intersection = matchGroups[i].tiles.find(t1 => matchGroups[j].tiles.some(t2 => t1.row === t2.row && t1.col === t2.col));
          if (intersection) lShapeMatches.push({ ...intersection, tileType: currentGrid[intersection.row][intersection.col]?.type });
        }
      }
    }
    const connectedGroups = [];
    const groupUsed = new Array(matchGroups.length).fill(false);
    for (let i = 0; i < matchGroups.length; i++) {
      if (groupUsed[i]) continue;
      const connectedTiles = new Set();
      const tileType = matchGroups[i].tileType;
      matchGroups[i].tiles.forEach(t => connectedTiles.add(`${t.row}-${t.col}`));
      groupUsed[i] = true;
      let foundNew = true;
      while (foundNew) {
        foundNew = false;
        for (let j = 0; j < matchGroups.length; j++) {
          if (groupUsed[j] || matchGroups[j].tileType !== tileType) continue;
          if (matchGroups[j].tiles.some(t => connectedTiles.has(`${t.row}-${t.col}`))) {
            matchGroups[j].tiles.forEach(t => connectedTiles.add(`${t.row}-${t.col}`));
            groupUsed[j] = true; foundNew = true;
          }
        }
      }
      const tilesArray = Array.from(connectedTiles).map(key => { const [r, c] = key.split('-').map(Number); return { row: r, col: c }; });
      connectedGroups.push({ tiles: tilesArray, totalUniqueTiles: tilesArray.length, tileType });
    }
    return { matches, matchGroups, lShapeMatches, connectedGroups };
  };

  // ---------------------------------------------------------------------------
  // Match processing
  // ---------------------------------------------------------------------------
  const getMultiplier = (comboValue) => {
    if (comboValue === 0) return 1.0; if (comboValue === 1) return 1.5; if (comboValue === 2) return 2.0;
    if (comboValue === 3) return 2.5; if (comboValue === 4) return 3.0; if (comboValue === 5) return 3.5;
    if (comboValue >= 6) return 4.0 + (comboValue - 6) * 0.2; return 1.0;
  };

  const addScorePopup = (row, col, points, text = null, delay = 0, duration = 2800) => {
    setScorePopups(prev => [...prev, { id: Date.now() + Math.random(), row, col, points, text, combo, delay, duration, createdAt: Date.now() }]);
  };

  const processMatches = (currentGrid, matchGroups, lShapeMatches, currentCombo, generation = 0, connectedGroups = [], swapPosition = null) => {
    setMatchedTiles(matchGroups.flatMap(g => g.tiles));
    let totalPoints = 0;
    const multiplier = getMultiplier(currentCombo);
    matchGroups.forEach(group => { totalPoints += Math.floor(group.length * 10 * multiplier); });
    if (lShapeMatches && lShapeMatches.length > 0) totalPoints += lShapeMatches.length * 50;
    const finalPoints = bonusRoundActive ? Math.floor(totalPoints * BONUS_ROUND_MULTIPLIER) : totalPoints;
    setScore(prev => prev + finalPoints);
    setCurrentTurnScore(prev => prev + finalPoints);
    if (bonusRoundActive) setBonusRoundScore(prev => prev + finalPoints);
    if (matchGroups.length > 0) addScorePopup(matchGroups[0].tiles[0].row, matchGroups[0].tiles[0].col, finalPoints);
    // v1.4: time extension for combo x5+ (mirrors arcade time attack)
    if (IS_TIME_ATTACK && currentCombo >= 5) addTimeExtension(`Combo x${currentCombo + 1}!`);
    setTimeout(() => removeMatches(currentGrid, matchGroups, lShapeMatches, generation, connectedGroups, swapPosition), 400);
  };

  const activateSpecialTile = (row, col, currentGrid, alreadyCleared = new Set()) => {
    const tile = currentGrid[row]?.[col];
    if (!tile || !tile.special) return { tilesToClear: [], points: 0, message: '', chainedSpecials: [] };
    const tilesToClear = [], chainedSpecials = [];
    let points = 0, message = '';
    const posKey = `${row}-${col}`;
    if (alreadyCleared.has(posKey)) return { tilesToClear: [], points: 0, message: '', chainedSpecials: [] };
    alreadyCleared.add(posKey);

    if (tile.special === 'line') {
      for (let c = 0; c < COLS; c++) {
        if (currentGrid[row][c]) {
          tilesToClear.push({ row, col: c });
          if (currentGrid[row][c].special && c !== col && !alreadyCleared.has(`${row}-${c}`)) chainedSpecials.push({ row, col: c, type: currentGrid[row][c].special });
        }
      }
      points = tilesToClear.length * 30; message = `⚡ LINE CLEAR! +${points}`;
    } else if (tile.special === 'bomb') {
      const addedKeys = new Set();
      const addTile = (r, c) => {
        const k = `${r}-${c}`;
        if (!addedKeys.has(k) && currentGrid[r]?.[c]) {
          addedKeys.add(k); tilesToClear.push({ row: r, col: c });
          if (currentGrid[r][c].special && !(r === row && c === col) && !alreadyCleared.has(k)) chainedSpecials.push({ row: r, col: c, type: currentGrid[r][c].special });
        }
      };
      for (let r = Math.max(0, row-1); r <= Math.min(ROWS-1, row+1); r++) for (let c = Math.max(0, col-1); c <= Math.min(COLS-1, col+1); c++) addTile(r, c);
      for (let c = 0; c < COLS; c++) addTile(row, c);
      for (let r = 0; r < ROWS; r++) addTile(r, col);
      points = 750; message = `💣 BOOM! +${points}`;
    } else if (tile.special === 'cross') {
      for (let c = 0; c < COLS; c++) {
        if (currentGrid[row][c]) { tilesToClear.push({ row, col: c }); if (currentGrid[row][c].special && c !== col && !alreadyCleared.has(`${row}-${c}`)) chainedSpecials.push({ row, col: c, type: currentGrid[row][c].special }); }
      }
      for (let r = 0; r < ROWS; r++) {
        if (r !== row && currentGrid[r][col]) { tilesToClear.push({ row: r, col }); if (currentGrid[r][col].special && !alreadyCleared.has(`${r}-${col}`)) chainedSpecials.push({ row: r, col, type: currentGrid[r][col].special }); }
      }
      points = tilesToClear.length * 38; message = `✨ CROSS BLAST! +${points}`;
    } else if (tile.special === 'supernova') {
      const addedKeys = new Set();
      const addTile = (r, c) => {
        const k = `${r}-${c}`;
        if (!addedKeys.has(k) && currentGrid[r]?.[c]) {
          addedKeys.add(k); tilesToClear.push({ row: r, col: c });
          if (currentGrid[r][c].special && !(r === row && c === col) && !alreadyCleared.has(k)) chainedSpecials.push({ row: r, col: c, type: currentGrid[r][c].special });
        }
      };
      for (let r = Math.max(0, row-2); r <= Math.min(ROWS-1, row+2); r++) for (let c = Math.max(0, col-2); c <= Math.min(COLS-1, col+2); c++) addTile(r, c);
      for (let c = 0; c < COLS; c++) addTile(row, c);
      for (let r = 0; r < ROWS; r++) addTile(r, col);
      points = 2000; message = `🌌 SUPERNOVA! +${points}`;
    } else if (tile.special === 'hypernova') {
      const addedKeys = new Set();
      const addRegular = (r, c) => { const k = `${r}-${c}`; if (!addedKeys.has(k) && currentGrid[r]?.[c] && !currentGrid[r][c].special) { addedKeys.add(k); tilesToClear.push({ row: r, col: c }); } };
      for (let r = Math.max(0, row-2); r <= Math.min(ROWS-1, row+2); r++) for (let c = Math.max(0, col-2); c <= Math.min(COLS-1, col+2); c++) addRegular(r, c);
      for (let c = 0; c < COLS; c++) addRegular(row, c);
      for (let r = 0; r < ROWS; r++) addRegular(r, col);
      const remaining = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const k = `${r}-${c}`; if (!addedKeys.has(k) && currentGrid[r]?.[c] && !currentGrid[r][c].special) remaining.push({ row: r, col: c }); }
      for (let i = remaining.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [remaining[i], remaining[j]] = [remaining[j], remaining[i]]; }
      remaining.slice(0, Math.ceil(remaining.length / 2)).forEach(t => { tilesToClear.push(t); addedKeys.add(`${t.row}-${t.col}`); });
      const minTiles = 30;
      if (tilesToClear.length < minTiles) { const extra = remaining.slice(Math.ceil(remaining.length / 2)); for (let i = 0; i < extra.length && tilesToClear.length < minTiles; i++) tilesToClear.push(extra[i]); }
      points = 5000; message = `🌠 HYPERNOVA!!! +${points}`;
    }
    return { tilesToClear, points, message, chainedSpecials };
  };

  const activateSpecialCombination = (row1, col1, row2, col2, type1, type2, currentGrid, additionalGroups = [], swapPosition = null) => {
    setIsAnimating(true);
    const tilesToRemove = [];
    let points = 0, message = '';
    const combo = [type1, type2].sort().join('+');
    const effectRow = row2, effectCol = col2;

    if (combo === 'line+line') {
      for (let c = 0; c < COLS; c++) { if (currentGrid[effectRow][c]) tilesToRemove.push({ row: effectRow, col: c }); }
      for (let r = 0; r < ROWS; r++) { if (currentGrid[r][effectCol] && r !== effectRow) tilesToRemove.push({ row: r, col: effectCol }); }
      points = 700; message = '⚡⚡ DOUBLE LINE! +700';
    } else if (combo === 'bomb+bomb') {
      const seen2 = new Set(); const add = (r, c) => { const k = `${r}-${c}`; if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); } };
      for (let r = Math.max(0, effectRow-3); r <= Math.min(ROWS-1, effectRow+3); r++) for (let c = Math.max(0, effectCol-3); c <= Math.min(COLS-1, effectCol+3); c++) add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c); for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 1500; message = '💣💣 MEGA BLAST! +1500';
    } else if (combo === 'cross+cross') {
      for (let r = Math.max(0, effectRow-1); r <= Math.min(ROWS-1, effectRow+1); r++) for (let c = 0; c < COLS; c++) { if (currentGrid[r][c]) tilesToRemove.push({ row: r, col: c }); }
      for (let r = 0; r < ROWS; r++) for (let c = Math.max(0, effectCol-1); c <= Math.min(COLS-1, effectCol+1); c++) { if (currentGrid[r][c] && !tilesToRemove.some(t => t.row === r && t.col === c)) tilesToRemove.push({ row: r, col: c }); }
      points = 850; message = '✨✨ DOUBLE CROSS! +850';
    } else if (combo === 'bomb+line') {
      const seen2 = new Set(); const add = (r, c) => { const k = `${r}-${c}`; if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); } };
      for (let r = Math.max(0, effectRow-1); r <= Math.min(ROWS-1, effectRow+1); r++) for (let c = 0; c < COLS; c++) add(r, c);
      for (let r = Math.max(0, effectRow-1); r <= Math.min(ROWS-1, effectRow+1); r++) for (let c = Math.max(0, effectCol-1); c <= Math.min(COLS-1, effectCol+1); c++) add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c); for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 1200; message = '💣⚡ LINE BOMB! +1200';
    } else if (combo === 'cross+line') {
      for (let r = Math.max(0, effectRow); r <= Math.min(ROWS-1, effectRow+1); r++) for (let c = 0; c < COLS; c++) { if (currentGrid[r][c]) tilesToRemove.push({ row: r, col: c }); }
      for (let r = 0; r < ROWS; r++) for (let c = Math.max(0, effectCol); c <= Math.min(COLS-1, effectCol+1); c++) { if (currentGrid[r][c] && !tilesToRemove.some(t => t.row === r && t.col === c)) tilesToRemove.push({ row: r, col: c }); }
      points = 800; message = '✨⚡ CROSS LINE! +800';
    } else if (combo === 'bomb+cross') {
      const seen2 = new Set(); const add = (r, c) => { const k = `${r}-${c}`; if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); } };
      for (let r = Math.max(0, effectRow-3); r <= Math.min(ROWS-1, effectRow+3); r++) for (let c = Math.max(0, effectCol-3); c <= Math.min(COLS-1, effectCol+3); c++) add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c); for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 1400; message = '💣✨ CROSS BOMB! +1400';
    } else if (combo === 'supernova+supernova') {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (currentGrid[r][c] && !currentGrid[r][c].special) tilesToRemove.push({ row: r, col: c });
      tilesToRemove.push({ row: row1, col: col1 }); tilesToRemove.push({ row: row2, col: col2 });
      points = 6000; message = '🌌🌌 DUAL SUPERNOVA! +6000';
    } else if (combo === 'hypernova+hypernova') {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (currentGrid[r][c] && !currentGrid[r][c].special) tilesToRemove.push({ row: r, col: c });
      tilesToRemove.push({ row: row1, col: col1 }); tilesToRemove.push({ row: row2, col: col2 });
      points = 10000; message = '🌠🌠 DUAL HYPERNOVA!!! +10000';
    } else if (combo === 'hypernova+supernova') {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (currentGrid[r][c] && !currentGrid[r][c].special) tilesToRemove.push({ row: r, col: c });
      tilesToRemove.push({ row: row1, col: col1 }); tilesToRemove.push({ row: row2, col: col2 });
      points = 8000; message = '🌠🌌 NOVA FUSION! +8000';
    } else if (combo === 'bomb+supernova' || combo === 'cross+supernova' || combo === 'line+supernova') {
      const seen2 = new Set(); const add = (r, c) => { const k = `${r}-${c}`; if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); } };
      for (let r = Math.max(0, effectRow-3); r <= Math.min(ROWS-1, effectRow+3); r++) for (let c = Math.max(0, effectCol-3); c <= Math.min(COLS-1, effectCol+3); c++) add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c); for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 3500; message = `SUPERNOVA COMBO! +3500`;
    } else if (combo === 'bomb+hypernova' || combo === 'cross+hypernova' || combo === 'hypernova+line') {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (currentGrid[r][c] && !currentGrid[r][c].special) tilesToRemove.push({ row: r, col: c });
      tilesToRemove.push({ row: row1, col: col1 }); tilesToRemove.push({ row: row2, col: col2 });
      points = 6000; message = `HYPERNOVA COMBO! +6000`;
    } else {
      const result1 = activateSpecialTile(row1, col1, currentGrid, new Set());
      result1.tilesToClear.forEach(t => tilesToRemove.push(t));
      const cleared = new Set(result1.tilesToClear.map(t => `${t.row}-${t.col}`));
      const result2 = activateSpecialTile(row2, col2, currentGrid, cleared);
      result2.tilesToClear.forEach(t => { if (!cleared.has(`${t.row}-${t.col}`)) tilesToRemove.push(t); });
      points = result1.points + result2.points; message = `${result1.message} + ${result2.message}`;
    }

    // v1.5: Cascade — specials swept by the combination each activate, get their own
    // popup, and award 1.5x cascade multiplier points (same as removeMatches depth-2).
    const processedInCombination = new Set([`${row1}-${col1}`, `${row2}-${col2}`]);
    const cascadeClears = new Set(tilesToRemove.map(t => `${t.row}-${t.col}`));
    const CASCADE_COMBO_MULTIPLIER = 1.5;
    let cascadePoints = 0;
    let cascadeIndex = 0;
    let ci = 0;
    while (ci < tilesToRemove.length) {
      const { row: cr, col: cc } = tilesToRemove[ci];
      const ck = `${cr}-${cc}`;
      const ct = currentGrid[cr]?.[cc];
      if (ct?.special && !processedInCombination.has(ck)) {
        // Do NOT pre-add ck here — activateSpecialTile adds it via alreadyCleared internally.
        // Pre-adding caused activateSpecialTile to bail early with empty results (the v1.5 bug).
        const result = activateSpecialTile(cr, cc, currentGrid, processedInCombination);
        const cascadePts = Math.floor(result.points * CASCADE_COMBO_MULTIPLIER);
        cascadePoints += cascadePts;
        if (result.message) {
          addScorePopup(cr, cc, cascadePts,
            `🔥 CASCADE x1.5! ${result.message.split('!')[0]}! +${cascadePts}`,
            cascadeIndex * 300, 3500);
        }
        result.tilesToClear.forEach(t => {
          const k = `${t.row}-${t.col}`;
          if (!cascadeClears.has(k)) { cascadeClears.add(k); tilesToRemove.push(t); }
        });
        cascadeIndex++;
      }
      ci++;
    }

    const seen = new Set();
    const uniqueTiles = tilesToRemove.filter(tile => { const k = `${tile.row}-${tile.col}`; if (seen.has(k)) return false; seen.add(k); return true; });
    const finalComboPoints = bonusRoundActive ? Math.floor(points * BONUS_ROUND_MULTIPLIER) : points;
    const finalCascadePoints = bonusRoundActive ? Math.floor(cascadePoints * BONUS_ROUND_MULTIPLIER) : cascadePoints;
    addScorePopup(effectRow, effectCol, finalComboPoints, message);
    setScore(prev => prev + finalComboPoints + finalCascadePoints);
    setCurrentTurnScore(prev => prev + finalComboPoints + finalCascadePoints);
    if (bonusRoundActive) setBonusRoundScore(prev => prev + finalComboPoints + finalCascadePoints);
    setMatchedTiles(uniqueTiles);
    setTimeout(() => {
      const newGrid = currentGrid.map(r => r.map(t => t ? { ...t } : null));
      uniqueTiles.forEach(({ row, col }) => { newGrid[row][col] = null; });
      // v1.12: place specials from any additional 4+ matches the swap created.
      // Same logic as removeMatches: special forms at a cleared tile position.
      if (additionalGroups.length > 0) {
        const clearedSet = new Set(uniqueTiles.map(t => `${t.row}-${t.col}`));
        const claimedPositions = new Set();
        [...additionalGroups].sort((a, b) => b.totalUniqueTiles - a.totalUniqueTiles).forEach(group => {
          let bestTile = null;
          if (swapPosition) {
            const inGroup = group.tiles.some(t => t.row === swapPosition.row && t.col === swapPosition.col);
            if (inGroup && !claimedPositions.has(`${swapPosition.row}-${swapPosition.col}`)) bestTile = swapPosition;
          }
          if (!bestTile) {
            let cRow = 0, cCol = 0;
            group.tiles.forEach(t => { cRow += t.row; cCol += t.col; });
            cRow = Math.round(cRow / group.tiles.length); cCol = Math.round(cCol / group.tiles.length);
            let bestDist = Infinity;
            group.tiles.forEach(t => { const dist = Math.abs(t.row - cRow) + Math.abs(t.col - cCol); if (dist < bestDist && !claimedPositions.has(`${t.row}-${t.col}`)) { bestDist = dist; bestTile = t; } });
            if (!bestTile) bestTile = group.tiles.find(t => !claimedPositions.has(`${t.row}-${t.col}`));
          }
          if (bestTile) {
            const posKey = `${bestTile.row}-${bestTile.col}`;
            if (!claimedPositions.has(posKey) && clearedSet.has(posKey)) {
              let specialType = 'line';
              if (group.totalUniqueTiles >= 7) specialType = 'hypernova';
              else if (group.totalUniqueTiles === 6) specialType = 'supernova';
              else if (group.totalUniqueTiles === 5) { const rows = new Set(group.tiles.map(t => t.row)), cols = new Set(group.tiles.map(t => t.col)); specialType = (rows.size > 1 && cols.size > 1) ? 'cross' : 'bomb'; }
              newGrid[bestTile.row][bestTile.col] = { type: group.tileType ?? 0, id: `special-${bestTile.row}-${bestTile.col}-${Date.now()}`, special: specialType, isNew: false, animX: bestTile.col * (TILE_SIZE + TILE_GAP), animY: bestTile.row * (TILE_SIZE + TILE_GAP) };
              specialsCreatedRef.current += 1;
              addTimeExtension(specialType === 'hypernova' ? '🌠 Hypernova!' : specialType === 'supernova' ? '🌌 Supernova!' : specialType === 'cross' ? '✨ Cross!' : specialType === 'bomb' ? '💣 Bomb!' : '⚡ Line!');
              group.tiles.forEach(t => claimedPositions.add(`${t.row}-${t.col}`));
            }
          }
        });
      }
      setGrid(newGrid); setMatchedTiles([]);
      setTimeout(() => applyGravity(newGrid, 0), 400);
    }, 400);
  };

  const removeMatches = (currentGrid, matchGroups, lShapeMatches, generation, connectedGroups = [], swapPosition = null) => {
    const newGrid = currentGrid.map(r => r.map(t => t ? { ...t } : null));
    const specialsToCreate = [], claimedPositions = new Set();
    const allTilesToClear = new Set();
    const specialsToActivate = [], matchedSpecials = new Set(), processedSpecials = new Set();

    matchGroups.forEach(group => {
      group.tiles.forEach(({ row, col }) => {
        allTilesToClear.add(`${row}-${col}`);
        const tile = currentGrid[row]?.[col];
        if (tile?.special && !matchedSpecials.has(`${row}-${col}`)) { specialsToActivate.push({ row, col, type: tile.special }); matchedSpecials.add(`${row}-${col}`); }
      });
    });

    const getCascadeMultiplier = (d) => d <= 1 ? 1.0 : d === 2 ? 1.5 : d === 3 ? 2.0 : d === 4 ? 2.5 : 3.0;
    const getCascadeDelay    = (d) => d <= 1 ? 0 : (d - 1) * 400;
    const getCascadeDuration = (d) => d <= 1 ? 2800 : d === 2 ? 3500 : 4200;

    const triggerCascadeEffects = (special, depth, sourceSpecial = null, staggerDelay = 0) => {
      const effectDelay = getCascadeDelay(depth) + staggerDelay;
      setTimeout(() => {
        setGlowingTiles(prev => [...prev, { row: special.row, col: special.col, id: Date.now() }]);
        setTimeout(() => setGlowingTiles(prev => prev.filter(t => !(t.row === special.row && t.col === special.col))), 200);
      }, Math.max(0, effectDelay - 100));
      setTimeout(() => {
        setFlashingTiles(prev => [...prev, { row: special.row, col: special.col, id: Date.now() }]);
        setTimeout(() => setFlashingTiles(prev => prev.filter(t => !(t.row === special.row && t.col === special.col))), 100);
      }, effectDelay);
      if (depth > 1 && sourceSpecial) {
        const midRow = (sourceSpecial.row + special.row) / 2, midCol = (sourceSpecial.col + special.col) / 2;
        setTimeout(() => {
          setChainTexts(prev => [...prev, { id: Date.now() + Math.random(), row: midRow, col: midCol, depth }]);
          setTimeout(() => setChainTexts(prev => prev.slice(1)), 800);
        }, effectDelay - 50);
      }
    };

    let totalSpecialPoints = 0;
    const allSpecialClears = new Set();
    const processSpecialWithCascade = (special, depth, sourceSpecial = null, staggerIndex = 0) => {
      const posKey = `${special.row}-${special.col}`;
      if (processedSpecials.has(posKey)) return;
      processedSpecials.add(posKey);
      const staggerDelay = depth === 1 ? staggerIndex * 150 : 0;
      triggerCascadeEffects(special, depth, sourceSpecial, staggerDelay);
      const result = activateSpecialTile(special.row, special.col, currentGrid, allSpecialClears);
      const multipliedPoints = Math.floor(result.points * getCascadeMultiplier(depth));
      const popupDelay = getCascadeDelay(depth) + staggerDelay;
      totalSpecialPoints += multipliedPoints;
      result.tilesToClear.forEach(t => allTilesToClear.add(`${t.row}-${t.col}`));
      if (result.message) {
        if (depth > 1) addScorePopup(Math.min(depth - 2, 2), special.col, multipliedPoints, `🔥 CASCADE x${getCascadeMultiplier(depth).toFixed(1)}! ${result.message.split('!')[0]}! +${multipliedPoints}`, popupDelay, getCascadeDuration(depth));
        else addScorePopup(special.row, special.col, multipliedPoints, result.message, popupDelay, getCascadeDuration(depth));
      }
      result.chainedSpecials.forEach((chained, chainIndex) => { if (!processedSpecials.has(`${chained.row}-${chained.col}`)) processSpecialWithCascade(chained, depth + 1, special, chainIndex); });
    };
    specialsToActivate.forEach((special, index) => processSpecialWithCascade(special, 1, null, index));

    if (totalSpecialPoints > 0) {
      const finalSpecialPoints = bonusRoundActive ? Math.floor(totalSpecialPoints * BONUS_ROUND_MULTIPLIER) : totalSpecialPoints;
      setScore(prev => prev + finalSpecialPoints); setCurrentTurnScore(prev => prev + finalSpecialPoints);
      if (bonusRoundActive) setBonusRoundScore(prev => prev + finalSpecialPoints);
    }

    if (connectedGroups && connectedGroups.length > 0) {
      const sortedConnected = [...connectedGroups].sort((a, b) => b.totalUniqueTiles - a.totalUniqueTiles);
      sortedConnected.forEach(group => {
        if (group.totalUniqueTiles >= 4) {
          let bestTile = null;
          if (swapPosition && generation === 0) { const swapInGroup = group.tiles.some(t => t.row === swapPosition.row && t.col === swapPosition.col); if (swapInGroup && !claimedPositions.has(`${swapPosition.row}-${swapPosition.col}`)) bestTile = swapPosition; }
          if (!bestTile) {
            let cRow = 0, cCol = 0;
            group.tiles.forEach(t => { cRow += t.row; cCol += t.col; });
            cRow = Math.round(cRow / group.tiles.length); cCol = Math.round(cCol / group.tiles.length);
            let bestDist = Infinity;
            group.tiles.forEach(t => { const dist = Math.abs(t.row - cRow) + Math.abs(t.col - cCol); if (dist < bestDist && !claimedPositions.has(`${t.row}-${t.col}`)) { bestDist = dist; bestTile = t; } });
            if (!bestTile) bestTile = group.tiles.find(t => !claimedPositions.has(`${t.row}-${t.col}`));
          }
          if (bestTile) {
            const posKey = `${bestTile.row}-${bestTile.col}`;
            if (!claimedPositions.has(posKey) && allTilesToClear.has(posKey)) {
              let specialType = 'line';
              if (group.totalUniqueTiles >= 7) specialType = 'hypernova';
              else if (group.totalUniqueTiles === 6) specialType = 'supernova';
              else if (group.totalUniqueTiles === 5) { const rows = new Set(group.tiles.map(t => t.row)), cols = new Set(group.tiles.map(t => t.col)); specialType = (rows.size > 1 && cols.size > 1) ? 'cross' : 'bomb'; }
              specialsToCreate.push({ row: bestTile.row, col: bestTile.col, type: specialType, tileColor: group.tileType ?? 0 });
              group.tiles.forEach(t => claimedPositions.add(`${t.row}-${t.col}`));
            }
          }
        }
      });
    }

    allTilesToClear.forEach(posKey => { const [r, c] = posKey.split('-').map(Number); newGrid[r][c] = null; });
    specialsToCreate.forEach(({ row, col, type, tileColor }) => {
      newGrid[row][col] = { type: tileColor, id: `special-${row}-${col}-${Date.now()}`, special: type, isNew: false, animX: col * (TILE_SIZE + TILE_GAP), animY: (row - 1) * (TILE_SIZE + TILE_GAP) };
      specialsCreatedRef.current += 1;
      // v1.4: time extension for each special created (mirrors arcade time attack)
      addTimeExtension(type === 'hypernova' ? '🌠 Hypernova!' : type === 'supernova' ? '🌌 Supernova!' : type === 'cross' ? '✨ Cross!' : type === 'bomb' ? '💣 Bomb!' : '⚡ Line!');
    });
    setGrid(newGrid); setMatchedTiles([]);
    setTimeout(() => applyGravity(newGrid, generation), 500);
  };

  const applyGravity = (currentGrid, generation) => {
    const newGrid = currentGrid.map(r => r.map(t => t ? { ...t } : null));
    for (let col = 0; col < COLS; col++) {
      let emptyRow = ROWS - 1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (newGrid[row][col] !== null) {
          if (row !== emptyRow) { newGrid[emptyRow][col] = newGrid[row][col]; newGrid[emptyRow][col].animY = row * (TILE_SIZE + TILE_GAP); newGrid[row][col] = null; }
          emptyRow--;
        }
      }
    }
    setGrid(newGrid);
    setTimeout(() => fillEmptySpaces(newGrid, generation), 400);
  };

  const fillEmptySpaces = (currentGrid, generation) => {
    const newGrid = currentGrid.map(r => r.map(t => t ? { ...t, isNew: false } : null));
    for (let col = 0; col < COLS; col++) {
      let emptyCount = 0;
      for (let row = 0; row < ROWS; row++) if (newGrid[row][col] === null) emptyCount++;
      for (let row = 0; row < ROWS; row++) {
        if (newGrid[row][col] === null) {
          newGrid[row][col] = { type: Math.floor(Math.random() * TILE_TYPES), id: `${row}-${col}-${Date.now()}-${Math.random()}`, special: null, isNew: true, animX: col * (TILE_SIZE + TILE_GAP), animY: -emptyCount * (TILE_SIZE + TILE_GAP) };
          emptyCount--;
        }
      }
    }
    setGrid(newGrid);
    setTimeout(() => {
      const { matches, matchGroups, lShapeMatches, connectedGroups } = findMatches(newGrid);
      if (matches.length > 0) {
        const comboIncrease = matchGroups.length + (lShapeMatches?.length || 0);
        setCombo(prev => { const newCombo = prev + comboIncrease; setMaxComboReached(current => Math.max(current, newCombo)); return newCombo; });
        processMatches(newGrid, matchGroups, lShapeMatches, comboRef.current + comboIncrease, generation + 1, connectedGroups);
      } else {
        setLastCombo(comboRef.current); setCombo(0);
        timeExtendedThisTurnRef.current = 0; // v1.4: reset cap for next player action
        setTimeout(() => { setIsAnimating(false); setTurnComplete(true); checkForValidMoves(newGrid); }, 100);
      }
    }, 500);
  };

  const checkForValidMoves = (currentGrid) => {
    if (gameState !== 'playing') return;
    setTimeout(() => { if (gameState !== 'playing') return; if (!hasValidMoves(currentGrid, ROWS, COLS)) setShowNoMoves(true); }, 300);
  };

  const shuffleBoardFree = () => { setShowNoMoves(false); performShuffleOnGrid(grid); };
  const performShuffleOnGrid = (currentGrid) => {
    setIsAnimating(true);
    const tiles = [];
    currentGrid.forEach(row => row.forEach(tile => { if (tile) tiles.push({ ...tile, isNew: false }); }));
    for (let i = tiles.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; }
    const newGrid = [];
    let tileIndex = 0;
    for (let row = 0; row < ROWS; row++) {
      newGrid[row] = [];
      for (let col = 0; col < COLS; col++) {
        if (tileIndex < tiles.length) { newGrid[row][col] = { ...tiles[tileIndex], id: `${row}-${col}-${Date.now()}`, isNew: true, animX: col * (TILE_SIZE + TILE_GAP), animY: row * (TILE_SIZE + TILE_GAP) }; tileIndex++; }
      }
    }
    setGrid(newGrid);
    setTimeout(() => setIsAnimating(false), 600);
  };

  // ---------------------------------------------------------------------------
  // Level end handler
  // ---------------------------------------------------------------------------
  const handleLevelEnd = (won) => {
    const finalScore = scoreRef.current;
    const stars = won ? calculateStars(finalScore, LEVEL_TARGET) : 0;
    // Bonus moves earned this level = total threshold crossings during play
    const bonusMovesEarned = Math.floor(bonusMoveThresholdRef.current / CAMPAIGN_BONUS_MOVE_INTERVAL);
    const movesUsed = IS_TIME_ATTACK ? null : INITIAL_MOVES - moves;
    onLevelComplete({
      levelIndex,
      score: finalScore,
      stars,
      won,
      bonusMovesEarned,
      bonusMovePoolTotal: campaignBonusMovesRef.current,
      movesUsed,
      bestCombo: maxComboReached,
      specialsCreated: specialsCreatedRef.current,
    });
  };

  // Trigger handleLevelEnd when gameState transitions
  const levelEndFiredRef = useRef(false);
  useEffect(() => {
    if ((gameState === 'won' || gameState === 'gameover') && !levelEndFiredRef.current) {
      levelEndFiredRef.current = true;
      handleLevelEnd(gameState === 'won');
    }
  }, [gameState]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const countSpecialsOnBoard = () => { let count = 0; grid.forEach(row => row.forEach(tile => { if (tile?.special) count++; })); return count; };
  const specialCount = countSpecialsOnBoard();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif', padding: '20px', paddingBottom: '60px',
      touchAction: 'none', userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.95)', borderRadius: '15px', padding: '12px 20px',
        marginBottom: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        width: `${boardWidth + 30}px`, minHeight: '110px', textAlign: 'center',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative',
      }}>
        {/* Back button */}
        <button onClick={onBackToMap} style={{
          position: 'absolute', top: '8px', left: '8px', background: 'transparent',
          border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px',
          borderRadius: '4px', opacity: 0.7,
        }} title="Back to Level Map">◀</button>

        {/* Dark mode toggle */}
        <button onClick={() => setIsDarkMode(!isDarkMode)} style={{
          position: 'absolute', top: '8px', right: '8px', background: 'transparent',
          border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px', borderRadius: '4px', opacity: 0.7,
        }} title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        <h1 style={{ margin: '0', color: '#333', fontSize: '18px' }}>
          Campaign — Level {cfg.level}
          {IS_TIME_ATTACK && ' (Time Attack)'}
          <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px' }}>v1.12</span>
        </h1>

        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '15px', fontWeight: 'bold', color: '#555' }}>
          <div onPointerDown={() => { adminPressTimerRef.current = setTimeout(() => setShowAdmin(true), 1500); }}
               onPointerUp={() => clearTimeout(adminPressTimerRef.current)}
               onPointerLeave={() => clearTimeout(adminPressTimerRef.current)}
               style={{ cursor: 'default', userSelect: 'none' }}>
            Score: <span style={{ color: '#667eea' }}>{score}</span>
          </div>

          {IS_TIME_ATTACK ? (
            <div>Time: <span style={{ color: timeLeft <= 10 ? '#e53935' : '#667eea', fontWeight: 'bold' }}>{timeLeft}s</span></div>
          ) : (
            <div style={{ position: 'relative' }}>
              Moves: <span style={{ color: '#667eea' }}>{moves}</span>
              {bonusMoveFlash > 0 && (
                <span key={bonusMoveFlash} style={{
                  position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
                  fontSize: '24px', fontWeight: '900', color: '#00C853',
                  textShadow: '0 0 12px #00C853, 1px 1px 0 #000', pointerEvents: 'none',
                  whiteSpace: 'nowrap', animation: 'bonusMoveBurst 4s ease-out forwards',
                }}>+1 🏦</span>
              )}
            </div>
          )}


          <div title="Bonus moves — carry forward to future levels">
            🏦 <span style={{ color: usingBankedMoves ? '#e65100' : '#667eea', fontWeight: 'bold' }}>{campaignBonusMoves}</span>
          </div>

          {usingBankedMoves && (
            <button
              onClick={endLevelCarryBanked}
              style={{
                padding: '4px 12px', fontSize: '13px', background: '#667eea',
                color: 'white', border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontWeight: 'bold',
              }}
            >
              {levelIndex === LEVEL_CONFIGS.length - 1 ? 'End' : 'End and carry moves forward'}
            </button>
          )}

          <div>Target: <span style={{ color: '#667eea' }}>{LEVEL_TARGET}</span></div>

        </div>

        <div style={{ fontSize: '12px', color: '#888' }}>✨ Specials: {specialCount}</div>

        {bonusRoundActive && (
          <div style={{
            background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)',
            padding: '6px 14px', borderRadius: '8px', marginTop: '6px',
            fontWeight: 'bold', fontSize: '14px', color: '#333',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>🌟 BONUS ROUND — {BONUS_ROUND_MULTIPLIER}x ALL POINTS! 🌟</div>
        )}

        <div style={{ minHeight: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {gameState === 'playing' && (combo > 0 || lastCombo > 0) && (
            <div style={{
              fontSize: '18px', fontWeight: 'bold',
              color: (combo > 0 ? combo : lastCombo) >= 10 ? '#FF4500' : (combo > 0 ? combo : lastCombo) >= 5 ? '#FFD700' : '#FF8C00',
              opacity: combo > 0 ? 1 : 0.7,
            }}>
              {(combo > 0 ? combo : lastCombo) >= 15 ? '💥 LEGENDARY' : (combo > 0 ? combo : lastCombo) >= 10 ? '⚡ ULTRA COMBO' : (combo > 0 ? combo : lastCombo) >= 5 ? '🌟 MEGA COMBO' : '🔥 COMBO'} x{(combo > 0 ? combo : lastCombo) + 1}
              <span style={{ marginLeft: '6px', fontSize: '13px', color: '#667eea' }}>({getMultiplier(combo > 0 ? combo : lastCombo).toFixed(1)}x)</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Board */}
      <div style={{
        background: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.95)',
        borderRadius: '15px', padding: '15px',
        boxShadow: isDarkMode ? '0 8px 16px rgba(0,0,0,0.3)' : '0 8px 16px rgba(0,0,0,0.15)',
        position: 'relative',
      }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleDragStart} onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}
          style={{ borderRadius: '10px', cursor: isAnimating ? 'default' : 'pointer', touchAction: 'none' }}
        />

        {/* Chain texts */}
        {chainTexts.map(chain => (
          <div key={chain.id} style={{
            position: 'absolute',
            left: `${15 + chain.col * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2}px`,
            top: `${15 + chain.row * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2}px`,
            transform: 'translate(-50%, -50%)', fontSize: '14px', fontWeight: '900', color: '#FF6B6B',
            textShadow: '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000',
            pointerEvents: 'none', animation: 'chainPop 0.8s ease-out forwards', zIndex: 1100, whiteSpace: 'nowrap',
          }}>⛓️ CHAIN x{chain.depth}!</div>
        ))}

        {/* Score popups */}
        {scorePopups.map(popup => {
          const isHypernova = popup.text?.includes('HYPERNOVA') || popup.text?.includes('🌠');
          const isSupernova = popup.text?.includes('SUPERNOVA') || popup.text?.includes('🌌');
          const pz = isHypernova ? 2000 : isSupernova ? 1500 : 1000 + (popup.delay || 0);
          const pd = isHypernova ? 5000 : isSupernova ? 4500 : popup.duration;
          const pf = isHypernova ? '22px' : isSupernova ? '20px' : (popup.text ? '18px' : '24px');
          return (
            <div key={popup.id} style={{
              position: 'absolute',
              left: `${15 + popup.col * (TILE_SIZE + TILE_GAP)}px`,
              top: `${15 + popup.row * (TILE_SIZE + TILE_GAP)}px`,
              fontSize: pf, fontWeight: '900',
              color: isHypernova ? '#FF00FF' : isSupernova ? '#00FFFF' : (popup.delay > 0 ? '#FF6B6B' : '#FFD700'),
              textShadow: '2px 2px 0px #000, -1px -1px 0px #000, 0 0 15px rgba(255,215,0,0.9)',
              pointerEvents: 'none', animation: `scorePopup ${pd / 1000}s ease-out forwards`,
              animationDelay: `${popup.delay}ms`, opacity: 0, zIndex: pz, whiteSpace: 'nowrap',
              background: popup.text ? 'rgba(0,0,0,0.9)' : 'transparent',
              padding: popup.text ? '8px 12px' : '0', borderRadius: popup.text ? '8px' : '0',
              border: popup.text ? `2px solid ${isHypernova ? '#FF00FF' : isSupernova ? '#00FFFF' : '#FFD700'}` : 'none',
            }}>
              {popup.text || `+${popup.points}`}
              {!popup.text && popup.combo > 0 && ` x${popup.combo + 1}`}
            </div>
          );
        })}
      </div>

      {/* v1.4: Time extension popups — floating notifications above board */}
      {IS_TIME_ATTACK && timeExtensions.map((ext, index) => (
        <div key={ext.id} style={{
          position: 'fixed',
          top: `${60 + index * 32}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          background: ext.noTime ? 'rgba(80,80,80,0.92)' : 'rgba(0,180,0,0.92)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
          padding: '5px 14px',
          borderRadius: '20px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          animation: 'timeExtensionPop 1.5s ease-out forwards',
          zIndex: 3000,
        }}>
          {ext.noTime ? ext.reason : `+${TIME_EXTENSION_AMOUNT}s ${ext.reason}`}
        </div>
      ))}

      {/* Time Attack — Tap to Start overlay (v1.2) */}
      {IS_TIME_ATTACK && gameState === 'ready' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '20px', padding: '36px 44px', textAlign: 'center', maxWidth: '360px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', color: 'white' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>⏱️</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '6px' }}>Timed Mode</div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', marginBottom: '6px' }}>
              Level {cfg.level} — {cfg.duration} seconds
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '24px' }}>
              Target: {LEVEL_TARGET.toLocaleString()} pts
            </div>
            <button
              onClick={() => setGameState('playing')}
              style={{ padding: '14px 36px', fontSize: '18px', background: 'white', color: '#667eea', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
            >
              Tap to Start
            </button>
          </div>
        </div>
      )}

      {/* No Valid Moves Dialog */}
      {showNoMoves && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '30px', textAlign: 'center', maxWidth: '350px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '22px', margin: '0 0 12px 0', color: '#FF8C00' }}>😓 No Valid Moves!</h3>
            <p style={{ fontSize: '15px', color: '#555', marginBottom: '18px' }}>Free shuffle to continue</p>
            <button onClick={shuffleBoardFree} style={{ padding: '12px 28px', fontSize: '17px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>🔀 Shuffle Board</button>
          </div>
        </div>
      )}

      {/* Bonus Moves Prompt — shown when regular moves hit 0 and campaignBonusMoves > 0.
          Fires on win AND fail — player always gets the option to keep playing. */}
      {showBankedMovesPrompt && (() => {
        const { bonus: promptSpecialsBonus } = calculateUnusedSpecialsBonus(grid);
        const promptWonAlready = targetReached || score + promptSpecialsBonus >= LEVEL_TARGET;
        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, minHeight: '100px',
            background: 'linear-gradient(135deg, rgba(102,126,234,0.98) 0%, rgba(118,75,162,0.98) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px',
            zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', padding: '10px 20px', flexWrap: 'wrap',
          }}>
            <div style={{ textAlign: 'center', color: 'white', minWidth: '160px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>
                {promptWonAlready ? '🎯 Target reached!' : '⚠️ Out of moves!'}
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
                {promptWonAlready
                  ? `Keep playing with ${campaignBonusMoves} bonus move${campaignBonusMoves !== 1 ? 's' : ''}?`
                  : `You have ${campaignBonusMoves} bonus move${campaignBonusMoves !== 1 ? 's' : ''}`
                }
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={startUsingBankedMoves}
                style={{
                  padding: '10px 20px', fontSize: '15px', background: '#00C853',
                  color: 'white', border: '2px solid #00C853', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 'bold',
                }}
              >
                Use bonus moves
              </button>
              <button
                onClick={endLevelCarryBanked}
                style={{
                  padding: '10px 20px', fontSize: '15px', background: 'white',
                  color: '#333', border: '2px solid white', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 'bold',
                }}
              >
                {levelIndex === LEVEL_CONFIGS.length - 1 ? 'End' : 'End and carry moves forward'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* v1.11: Time-Up Bonus Moves Prompt — shown when timer hits 0, score < target, pool > 0.
          Timer is paused while this is visible. Player chooses per-move. */}
      {showTimeUpPrompt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px', padding: '28px 32px', maxWidth: '340px', width: '90%',
            textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
              ⏱️ Time's up!
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginBottom: '24px' }}>
              You have <strong>{campaignBonusMoves}</strong> bonus move{campaignBonusMoves !== 1 ? 's' : ''}.
              Each adds {TIME_EXTENSION_AMOUNT} seconds.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={useTimeUpBonusMove}
                style={{
                  padding: '12px 24px', fontSize: '15px', background: '#00C853',
                  color: 'white', border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 'bold',
                }}
              >
                Use bonus move (+{TIME_EXTENSION_AMOUNT}s)
              </button>
              <button
                onClick={endLevelSaveMoves}
                style={{
                  padding: '12px 24px', fontSize: '15px', background: 'white',
                  color: '#333', border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 'bold',
                }}
              >
                End level — save {campaignBonusMoves} move{campaignBonusMoves !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bonus Round Prompt */}
      {showBonusPrompt && (() => {
        const { bonus: pendingSpecialsBonus } = calculateUnusedSpecialsBonus(grid);
        const potentialScore = score + pendingSpecialsBonus;
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, minHeight: '100px', background: 'linear-gradient(135deg, rgba(255,215,0,0.98), rgba(255,165,0,0.98))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', padding: '10px 20px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', color: '#333' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>🎉 TARGET REACHED!</div>
              <div style={{ fontSize: '13px', color: '#555' }}>Enter Bonus Round?</div>
            </div>
            <div style={{ textAlign: 'center', color: '#333', fontSize: '13px', lineHeight: '1.6', background: 'rgba(0,0,0,0.1)', padding: '8px 14px', borderRadius: '8px' }}>
              <div>Score: <strong>{score}</strong>{pendingSpecialsBonus > 0 && <span style={{ color: '#228B22' }}> +{pendingSpecialsBonus}</span>} = <strong>{potentialScore}</strong> / {LEVEL_TARGET}</div>
              <div>Moves left: <strong>{moves}</strong></div>
              <div style={{ color: '#8B4513', fontWeight: 'bold' }}>All points {BONUS_ROUND_MULTIPLIER}x!</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={startBonusRound} style={{ padding: '10px 18px', fontSize: '14px', background: '#333', color: '#FFD700', border: '2px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🌟 BONUS ROUND</button>
              <button onClick={endLevelEarly} style={{ padding: '10px 18px', fontSize: '14px', background: 'white', color: '#333', border: '2px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>End (+{moves * EARLY_END_BONUS_PER_MOVE + pendingSpecialsBonus})</button>
            </div>
          </div>
        );
      })()}

      {/* Game Over overlay — win is handled by TransitionScreen in parent; only loss shown here */}
      {gameState === 'gameover' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'linear-gradient(135deg, #c0392b, #e74c3c)', borderRadius: '20px', padding: '32px 36px', textAlign: 'center', maxWidth: '360px', width: '90%', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', color: 'white' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>😓</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '14px' }}>Level Failed</div>

            {/* Score vs target */}
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '2px' }}>{score.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '14px' }}>
              Target: {LEVEL_TARGET.toLocaleString()}
            </div>

            {/* Personal best */}
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Personal best</div>
              {highScore > 0 ? (
                <>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{highScore.toLocaleString()}</div>
                  <div style={{ fontSize: '16px', letterSpacing: '2px' }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} style={{ color: i < (bestStars || 0) ? '#FFD700' : 'rgba(255,255,255,0.3)' }}>★</span>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>No previous best</div>
              )}
            </div>

            {/* Primary buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '12px' }}>
              <button onClick={onBackToMap} style={{ padding: '10px 20px', fontSize: '14px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                🗺️ View Map
              </button>
              <button
                onClick={() => {
                  levelEndFiredRef.current = false;
                  setGrid(initializeGrid(ROWS, COLS)); setScore(0); setMoves(INITIAL_MOVES);
                  if (IS_TIME_ATTACK) setTimeLeft(cfg.duration);
                  setGameState(IS_TIME_ATTACK ? 'ready' : 'playing');
                  setSelectedTile(null); setIsAnimating(false); setMatchedTiles([]); setScorePopups([]);
                  setCombo(0); setLastCombo(0); setShowNoMoves(false); setMaxComboReached(0);
                  setTargetReached(false); setPendingSpecials([]); setCurrentTurnScore(0); setTurnComplete(true);
                  setShowBonusPrompt(false); setBonusRoundActive(false); setBonusRoundScore(0); setPreBonusScore(0);
                  setLastMilestoneShown(0); setFlashingTiles([]); setGlowingTiles([]); setChainTexts([]);
                  animStateRef.current = {}; bonusMoveThresholdRef.current = 0; bonusMoveFlashPendingRef.current = 0; specialsCreatedRef.current = 0;
                  setBonusMoveFlash(0);
                  setUsingBankedMoves(false); usingBankedMovesRef.current = false; setShowBankedMovesPrompt(false); setShowTimeUpPrompt(false); setPendingTimeExpiry(false);
                }}
                style={{ padding: '10px 20px', fontSize: '14px', background: 'white', color: '#c0392b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🔄 Retry
              </button>
            </div>

            {/* Start Over — subtle link-style button */}
            {onStartOver && (
              <button
                onClick={onStartOver}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', padding: '4px' }}
              >
                Start over from Level 1 (keeps records)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Admin panel */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} constants={{ CAMPAIGN_BONUS_MOVE_INTERVAL, LEVEL_TARGET, ROWS, COLS, INITIAL_MOVES }} />}

      {/* Instructions */}
      <div style={{ marginTop: '18px', background: 'rgba(255,255,255,0.9)', padding: '10px 14px', borderRadius: '10px', maxWidth: `${boardWidth + 30}px`, fontSize: '11px', color: '#555', textAlign: 'center', lineHeight: '1.5' }}>
        <strong>🎯 Match 3+ tiles!</strong> • <strong>⚡4-match:</strong> Line • <strong>💣5-match:</strong> Bomb • <strong>✨L-shape:</strong> Cross • <strong>🎯 Every 10k pts:</strong> +1 Move
      </div>

      <style>{`
        @keyframes scorePopup { 0% { transform: translateY(0) scale(1); opacity: 1; } 70% { transform: translateY(-50px) scale(1.3); opacity: 1; } 100% { transform: translateY(-90px) scale(1.5); opacity: 0; } }
        @keyframes chainPop { 0% { transform: translate(-50%, -50%); opacity: 0; } 15% { transform: translate(-50%, -50%); opacity: 1; } 85% { transform: translate(-50%, -50%); opacity: 1; } 100% { transform: translate(-50%, -50%); opacity: 0; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes bonusMoveBurst { 0% { transform: translateX(-50%) translateY(0) scale(0.5); opacity: 0; } 10% { transform: translateX(-50%) translateY(-4px) scale(1.6); opacity: 1; } 35% { transform: translateX(-50%) translateY(-14px) scale(1.4); opacity: 1; } 70% { transform: translateX(-50%) translateY(-26px) scale(1.2); opacity: 1; } 100% { transform: translateX(-50%) translateY(-38px) scale(1.0); opacity: 0; } }
        @keyframes timeExtensionPop { 0% { transform: translateX(-50%) scale(0.8); opacity: 0; } 15% { transform: translateX(-50%) scale(1.1); opacity: 1; } 70% { transform: translateX(-50%) scale(1.0); opacity: 1; } 100% { transform: translateX(-50%) translateY(-20px) scale(0.9); opacity: 0; } }
      `}</style>
    </div>
  );
};

// =============================================================================
// ROOT COMPONENT — manages screen routing (v1.2: levelSelect | game | transition; v1.13: + levelIntro)
// =============================================================================
const Match3Campaign = () => {
  const [screen, setScreen] = useState('levelSelect'); // 'levelSelect' | 'levelIntro' | 'game' | 'transition'
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [levelStars, setLevelStars] = useState(loadCampaignStars);
  const [levelHighScores, setLevelHighScores] = useState(loadCampaignHighScores);
  const [transitionData, setTransitionData] = useState(null);
  const [runTotalScore, setRunTotalScore] = useState(0);

  const handleSelectLevel = (levelIndex) => {
    setActiveLevelIndex(levelIndex);
    setScreen('levelIntro');
  };

  const handleLevelIntroComplete = () => setScreen('game');

  const handleLevelComplete = ({ levelIndex, score, stars, won, bonusMovesEarned, bonusMovePoolTotal, movesUsed, bestCombo, specialsCreated }) => {
    const { newHighScores, newStars } = saveCampaignProgress({ levelIndex, score, stars, levelStars, levelHighScores });
    setLevelStars(newStars);
    setLevelHighScores(newHighScores);
    if (won) {
      const newRunTotal = runTotalScore + score;
      setRunTotalScore(newRunTotal);
      setTransitionData({ levelIndex, score, stars, bonusMovesEarned, bonusMovePoolTotal, movesUsed, bestCombo, specialsCreated, campaignTotalScore: newRunTotal });
      setScreen('transition');
    }
    // On loss: CampaignGame stays mounted and shows the gameover overlay (Retry / View Map)
  };

  const handleNextLevel = () => {
    const nextIndex = transitionData.levelIndex + 1;
    if (nextIndex < LEVEL_CONFIGS.length) {
      setActiveLevelIndex(nextIndex);
      setScreen('levelIntro');
    } else {
      setScreen('campaignComplete');
    }
  };

  const handleBackToMap = () => { setRunTotalScore(0); setScreen('levelSelect'); };

  const handleStartOver = () => {
    setRunTotalScore(0);
    setActiveLevelIndex(0);
    setScreen('levelIntro');
  };

  const handleResetAll = () => {
    try {
      Object.values(CAMPAIGN_KEYS).forEach(key => localStorage.removeItem(key));
    } catch {}
    setLevelStars([]);
    setLevelHighScores([]);
    setRunTotalScore(0);
    setActiveLevelIndex(0);
    setScreen('levelIntro');
  };

  if (screen === 'levelSelect') {
    return <LevelSelectScreen levelStars={levelStars} levelHighScores={levelHighScores} onSelectLevel={handleSelectLevel} />;
  }

  if (screen === 'levelIntro') {
    return <LevelIntroScreen levelIndex={activeLevelIndex} onContinue={handleLevelIntroComplete} />;
  }

  if (screen === 'transition' && transitionData) {
    return <TransitionScreen data={transitionData} onNextLevel={handleNextLevel} onViewMap={handleBackToMap} />;
  }

  if (screen === 'campaignComplete') {
    return (
      <CampaignCompleteScreen
        levelStars={levelStars}
        levelHighScores={levelHighScores}
        onPlayAgain={handleBackToMap}
        onResetAll={handleResetAll}
      />
    );
  }

  return (
    <CampaignGame
      key={activeLevelIndex}
      levelIndex={activeLevelIndex}
      onLevelComplete={handleLevelComplete}
      onBackToMap={handleBackToMap}
      highScore={levelHighScores[activeLevelIndex] || 0}
      bestStars={levelStars[activeLevelIndex] || 0}
      onStartOver={handleStartOver}
    />
  );
};

export default Match3Campaign;
