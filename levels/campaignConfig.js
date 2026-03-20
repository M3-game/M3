// =============================================================================
// CAMPAIGN MODE — Level Configuration
// Shared by all campaign platform variants (tablet, desktop, phone).
// =============================================================================

// ---------------------------------------------------------------------------
// Level definitions
// targetScore: null = TBD pending gameplay testing. Game uses PLACEHOLDER_TARGET
// when null. Set empirically after real play sessions.
// ---------------------------------------------------------------------------
export const LEVEL_CONFIGS = [
  { level: 1, type: 'standard',   rows: 10, cols: 8,  moves: 12,  targetScore: null },
  { level: 2, type: 'standard',   rows: 12, cols: 10, moves: 20,  targetScore: null },
  { level: 3, type: 'timeattack', rows: 12, cols: 10, moves: null, duration: 60,  targetScore: null },
  { level: 4, type: 'standard',   rows: 12, cols: 10, moves: 20,  targetScore: null },
  { level: 5, type: 'standard',   rows: 14, cols: 12, moves: 25,  targetScore: null },
  { level: 6, type: 'timeattack', rows: 14, cols: 12, moves: null, duration: 120, targetScore: null },
  { level: 7, type: 'standard',   rows: 14, cols: 12, moves: 25,  targetScore: null },
  { level: 8, type: 'standard',   rows: 14, cols: 12, moves: 25,  targetScore: null },
];

// Temporary placeholder used when targetScore is null (dev/testing only).
// Replace per-level once real gameplay data is available.
export const PLACEHOLDER_TARGETS = {
  1: 2000,
  2: 4500,
  3: 3000,  // time attack — lower expectation
  4: 5500,
  5: 7500,
  6: 6000,  // time attack 2min
  7: 9000,
  8: 11000,
};

export const getLevelConfig = (level) => LEVEL_CONFIGS[level - 1] ?? null;

export const getLevelTarget = (levelConfig) =>
  levelConfig.targetScore ?? PLACEHOLDER_TARGETS[levelConfig.level] ?? 5000;

// ---------------------------------------------------------------------------
// Star calculation — standard and bonus levels
// Time attack star thresholds are TBD; use same formula as placeholder.
// ---------------------------------------------------------------------------
export const calculateStars = (score, target) => {
  if (!target || target <= 0) return 0;
  const ratio = score / target;
  if (ratio >= 1.75) return 5;
  if (ratio >= 1.50) return 4;
  if (ratio >= 1.30) return 3;
  if (ratio >= 1.15) return 2;
  if (ratio >= 1.00) return 1;
  return 0;
};

// ---------------------------------------------------------------------------
// Campaign bonus moves — earned at 1 per 10,000 points scored in any level
// ---------------------------------------------------------------------------
export const CAMPAIGN_BONUS_MOVE_INTERVAL = 10000;

export const calculateBonusMovesEarned = (score) =>
  Math.floor(score / CAMPAIGN_BONUS_MOVE_INTERVAL);

// ---------------------------------------------------------------------------
// Unlock gates
// ---------------------------------------------------------------------------

// Level 7: 3+ stars on Level 5 OR Level 6, OR ~18-20 total stars (threshold TBD)
const LEVEL_7_STAR_TOTAL_THRESHOLD = 18; // TBD — adjust after testing

export const isLevel7Unlocked = (levelStars) => {
  const totalStars = levelStars.slice(0, 6).reduce((a, b) => a + b, 0);
  const level5Stars = levelStars[4] ?? 0;
  const level6Stars = levelStars[5] ?? 0;
  return (level5Stars >= 3 || level6Stars >= 3) || totalStars >= LEVEL_7_STAR_TOTAL_THRESHOLD;
};

// Level 8: 25+ stars across Levels 1-7
// TBD: || level7Score >= HIGH_SCORE_THRESHOLD || campaignTotalScore >= CUMULATIVE_THRESHOLD
export const isLevel8Unlocked = (levelStars) => {
  const totalStars = levelStars.slice(0, 7).reduce((a, b) => a + b, 0);
  return totalStars >= 25;
};

// Check if the next level is accessible given current progress
export const canAdvanceToLevel = (nextLevel, levelStars) => {
  if (nextLevel <= 6) return true;           // Levels 1-6: sequential, no gate
  if (nextLevel === 7) return isLevel7Unlocked(levelStars);
  if (nextLevel === 8) return isLevel8Unlocked(levelStars);
  return false;
};

// ---------------------------------------------------------------------------
// localStorage keys — campaign-specific (separate from arcade match3_* keys)
// ---------------------------------------------------------------------------
export const CAMPAIGN_KEYS = {
  level:      'match3_campaign_level',       // integer: highest level reached
  highScores: 'match3_campaign_highScores',  // JSON array: best score per level (index 0 = level 1)
  stars:      'match3_campaign_stars',       // JSON array: best stars per level
  totalScore: 'match3_campaign_totalScore',  // integer: cumulative campaign score
  bonusMoves: 'match3_campaign_bonusMoves',  // integer: banked campaign bonus moves
};
