import React, { useState, useEffect } from 'react';

// =============================================================================
// AdminPanel — Developer Stats & Admin Panel
// Shared across all platforms. Reads directly from localStorage.
// No game state dependencies — import and render anywhere.
//
// Access methods (wired up by the host platform file):
//   1. URL param:      ?admin=1
//   2. Secret gesture: long-press score counter for 1.5s
//
// localStorage keys read:
//   match3_stats      — JSON stats object (see schema below)
//   match3_bonusMoves — integer (storage VALUE — see BONUS_MOVES_KEY note)
//   match3_highScore, match3_highCombo, match3_highTurnScore — legacy keys
//
// Session T-2 (2026-05-02): code-coherence rename for the bonus-moves
// terminology migration. Core constant formerly `BANKED_KEY` is now
// `BONUS_MOVES_KEY`. Derived stats field formerly `bonusRoundRate`
// is now `victoryRoundRate`. Display labels "Bonus round uptake" →
// "Victory round uptake" and "Banked moves" → "Bonus moves". State
// var `bankedMoves` → `bonusMoves`.
//
// Session T-3a (2026-05-02): stats-blob field rename (data half, A
// part of T-3 split). Top-level counter formerly `bonusRoundsTaken`
// is now `victoryRoundsTaken` (defaultStats schema, computeDerived
// destructure, AdminPanel display reads). Per-game history entries
// formerly `endType: 'bonusRound'` are now `endType: 'victoryRound'`
// (writers updated in each platform's recordGameResult). Existing
// player data migrated by `migrateStatsBlob()` below — runs once at
// module load, idempotent.
//
// Session T-3b (2026-05-03): storage-string VALUE migrations (data
// half, B part of T-3 split). Eight localStorage keys flip values:
//   1. core              'match3_bankedMoves'                → 'match3_bonusMoves'
//   2. desktop (local)   'match3_desktop_bankedMoves'        → 'match3_desktop_bonusMoves'
//   3. time-attack       'match3_timeattack_bankedMoves'     → 'match3_timeattack_bonusMoves'
//   4. phone (local)     'match3_phone418_currentRun'        → 'match3_phone_currentRun'
//   5. phone (local)     'match3_phone418_longestRun'        → 'match3_phone_longestRun'
//   6. phone arcade ↔
//      phone-verses      'match3_phone418_bankedMoves'       → 'match3_phone_bonusMoves'   [LOCKSTEP]
//   7. phone arcade ↔
//      phone-verses      'm3_arcade_carry_from_verses_phone418'
//                                                            → 'm3_arcade_carry_from_verses_phone'  [LOCKSTEP]
//   8. phone-verses      'm3_phone418_verses_*'              → 'm3_phone_verses_*'  [PREFIX]
// All migrations live in `migrateBonusMovesKeys()` below. Runs at
// module load alongside `migrateStatsBlob()`. Idempotent: stricter
// rule than T-3a — always removes the old key after attempting
// migration (preserves new value if both exist; never leaves orphans).
// Phone arcade, desktop, and time-attack don't otherwise import core,
// so each adds an explicit `import { migrateBonusMovesKeys }` + call
// at module load to ensure the migration runs on those platforms too.
// JSON export key `bankedMoves` flipped to `bonusMoves` (no import
// path exists; harmless to user disk files which stay frozen as-is).
// =============================================================================

const STATS_KEY        = 'match3_stats';
const BONUS_MOVES_KEY  = 'match3_bonusMoves';

// T-3b (2026-05-03): generic single-key migration helper.
// Stricter idempotency than T-3a: always removes the old key after
// attempting migration. If new key is absent, copies old → new then
// deletes old. If new key is present, deletes old without overwriting
// (preserves user's most recent value, no orphans either way). Re-runs
// after the first successful migration are no-ops because old key is
// gone. SSR-safe and try/catch wrapped, same shape as migrateStatsBlob.
function migrateLocalStorageKey(oldKey, newKey) {
  if (typeof localStorage === 'undefined') return;
  try {
    const oldVal = localStorage.getItem(oldKey);
    if (oldVal === null) return;
    if (localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, oldVal);
    }
    localStorage.removeItem(oldKey);
  } catch {}
}

// T-3b (2026-05-03): prefix-walk migration helper for namespaced keys
// (e.g., 'm3_phone418_verses_<gameId>' → 'm3_phone_verses_<gameId>').
// Walks localStorage keys matching the old prefix and re-keys each
// with the new prefix. Same stricter idempotency: removes old after
// migrating; preserves new if both exist.
function migrateLocalStoragePrefix(oldPrefix, newPrefix) {
  if (typeof localStorage === 'undefined') return;
  try {
    const oldKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(oldPrefix)) oldKeys.push(k);
    }
    for (const oldKey of oldKeys) {
      const newKey = newPrefix + oldKey.slice(oldPrefix.length);
      const oldVal = localStorage.getItem(oldKey);
      if (oldVal === null) continue;
      if (localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, oldVal);
      }
      localStorage.removeItem(oldKey);
    }
  } catch {}
}

// T-3b (2026-05-03): one-time storage-string VALUE migrations. Runs
// at module load alongside migrateStatsBlob. Covers all 8 keys (7
// single-key + 1 prefix). Phone arcade ↔ phone-verses lockstep keys
// (#6, #7) are migrated unconditionally here; both platform files
// also flip their constant VALUES in the same commit, so post-T-3b
// reads/writes use the new key names and the migration is a no-op
// on subsequent loads (old key gone after first run).
function migrateBonusMovesKeys() {
  migrateLocalStorageKey('match3_bankedMoves',                  'match3_bonusMoves');
  migrateLocalStorageKey('match3_desktop_bankedMoves',          'match3_desktop_bonusMoves');
  migrateLocalStorageKey('match3_timeattack_bankedMoves',       'match3_timeattack_bonusMoves');
  migrateLocalStorageKey('match3_phone418_currentRun',          'match3_phone_currentRun');
  migrateLocalStorageKey('match3_phone418_longestRun',          'match3_phone_longestRun');
  migrateLocalStorageKey('match3_phone418_bankedMoves',         'match3_phone_bonusMoves');
  migrateLocalStorageKey('m3_arcade_carry_from_verses_phone418','m3_arcade_carry_from_verses_phone');
  migrateLocalStoragePrefix('m3_phone418_verses_',              'm3_phone_verses_');
}

// T-3a (2026-05-02): one-time stats-blob field migration. Runs at
// module load — every platform's entry imports core, so this fires
// once per browser session per platform visit. Idempotent: checks
// presence of new field before migrating, so re-runs are no-ops.
function migrateStatsBlob() {
  if (typeof localStorage === 'undefined') return;
  let raw;
  try { raw = localStorage.getItem(STATS_KEY); } catch { return; }
  if (!raw) return;
  let stats;
  try { stats = JSON.parse(raw); } catch { return; }
  if (!stats || typeof stats !== 'object') return;

  let changed = false;
  // Top-level field rename: bonusRoundsTaken → victoryRoundsTaken
  if ('bonusRoundsTaken' in stats && !('victoryRoundsTaken' in stats)) {
    stats.victoryRoundsTaken = stats.bonusRoundsTaken;
    delete stats.bonusRoundsTaken;
    changed = true;
  }
  // History entries: endType 'bonusRound' → 'victoryRound'
  if (Array.isArray(stats.history)) {
    for (const entry of stats.history) {
      if (entry && entry.endType === 'bonusRound') {
        entry.endType = 'victoryRound';
        changed = true;
      }
    }
  }
  if (changed) {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
  }
}
migrateStatsBlob();
migrateBonusMovesKeys();

function defaultStats() {
  return {
    version: 1,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    victoryRoundsTaken: 0,
    earlyEnds: 0,
    movesSaved: 0,
    history: [],   // ring buffer, max 50 entries
  };
}

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...defaultStats(), ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function computeDerived(stats) {
  const { gamesPlayed, gamesWon, history, victoryRoundsTaken, earlyEnds } = stats;

  const recent20    = history.slice(-20);
  const recentWins20 = recent20.filter(g => g.won).length;
  const winRateAll   = gamesPlayed > 0 ? Math.round(gamesWon / gamesPlayed * 100) : 0;
  const winRateRecent = recent20.length > 0 ? Math.round(recentWins20 / recent20.length * 100) : 0;

  const wins   = history.filter(g => g.won);
  const losses = history.filter(g => !g.won);

  const avgPctWin  = wins.length > 0
    ? Math.round(wins.reduce((s, g) => s + g.finalScore / g.levelTarget, 0) / wins.length * 100)
    : null;
  const avgPctLoss = losses.length > 0
    ? Math.round(losses.reduce((s, g) => s + g.finalScore / g.levelTarget, 0) / losses.length * 100)
    : null;

  const victoryRoundRate = wins.length > 0 ? Math.round(victoryRoundsTaken / wins.length * 100) : 0;
  const earlyEndRate   = wins.length > 0 ? Math.round(earlyEnds / wins.length * 100) : 0;

  const recent10 = history.slice(-10);
  const avgTarget10    = recent10.length > 0
    ? Math.round(recent10.reduce((s, g) => s + g.levelTarget, 0) / recent10.length)
    : null;
  const avgDifficulty10 = recent10.length > 0
    ? Math.round(recent10.reduce((s, g) => s + (g.difficultyBonus || 0), 0) / recent10.length)
    : null;

  // Balance health flag
  let flag = null;
  if (gamesPlayed >= 10) {
    if (winRateRecent > 80)
      flag = { color: '#ff9800', text: '⚠ Win rate high — consider raising BASE_TARGET or TARGET_VARIANCE' };
    else if (winRateRecent < 35)
      flag = { color: '#f44336', text: '⚠ Win rate low — consider lowering BASE_TARGET or adding moves' };
    else
      flag = { color: '#4caf50', text: '✓ Win rate in healthy range (35–80%)' };
  }

  return {
    winRateAll, winRateRecent, avgPctWin, avgPctLoss,
    victoryRoundRate, earlyEndRate,
    avgTarget10, avgDifficulty10,
    winsCount: wins.length, lossesCount: losses.length,
    flag,
  };
}

// -----------------------------------------------------------------------------

function AdminPanel({ onClose, constants = {} }) {
  const [stats, setStats]             = useState(null);
  const [bonusMoves, setBonusMoves] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setStats(loadStats());
    setBonusMoves(parseInt(localStorage.getItem(BONUS_MOVES_KEY) || '0', 10));
  }, []);

  const handleExport = () => {
    const data = {
      stats: loadStats(),
      bonusMoves: parseInt(localStorage.getItem(BONUS_MOVES_KEY) || '0', 10),
      highScore: localStorage.getItem('match3_highScore'),
      highCombo: localStorage.getItem('match3_highCombo'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `match3-stats-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    localStorage.removeItem(STATS_KEY);
    setStats(null);
    setConfirmClear(false);
  };

  const derived = stats ? computeDerived(stats) : null;

  // ── Styles ─────────────────────────────────────────────────────────────────
  const S = {
    panel:  { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10,10,10,0.93)', zIndex: 9999, overflowY: 'auto', fontFamily: 'monospace', color: '#e0e0e0', padding: '20px', boxSizing: 'border-box' },
    card:   { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '8px', padding: '14px 16px', marginBottom: '12px' },
    label:  { color: '#ccc', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px', display: 'block' },
    row:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #222', fontSize: '13px' },
    rowLast:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: '13px' },
    val:    { fontWeight: 'bold', color: '#fff' },
    dim:    { color: '#ccc' },
    btn:    { padding: '7px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' },
  };

  return (
    <div style={S.panel}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>
            🔧 ADMIN — Match-3 Stats
          </div>
          <div style={{ fontSize: '12px', color: '#ccc' }}>
            Access: <span style={{ color: '#ccc' }}>?admin=1</span> · long-press score (1.5 s)
          </div>
        </div>
        <button onClick={onClose} style={{ ...S.btn, background: '#2a2a2a', color: '#ccc', fontSize: '17px', lineHeight: 1, padding: '4px 11px' }}>×</button>
      </div>

      {/* ── No data ────────────────────────────────────────────────────────── */}
      {!stats && (
        <div style={{ ...S.card, textAlign: 'center', color: '#ccc', padding: '32px' }}>
          No stats recorded yet — play some games first.
        </div>
      )}

      {stats && derived && (
        <>
          {/* ── Balance Health ─────────────────────────────────────────────── */}
          <div style={S.card}>
            <span style={S.label}>Balance Health</span>
            <div style={S.row}>
              <span style={S.dim}>Win rate — all time</span>
              <span style={S.val}>{derived.winRateAll}% <span style={S.dim}>({stats.gamesWon} / {stats.gamesPlayed})</span></span>
            </div>
            <div style={S.row}>
              <span style={S.dim}>Win rate — last {Math.min(stats.history.length, 20)} games</span>
              <span style={S.val}>{derived.winRateRecent}%</span>
            </div>
            <div style={S.row}>
              <span style={S.dim}>Avg score vs target — wins</span>
              <span style={S.val}>{derived.avgPctWin !== null ? `${derived.avgPctWin}%` : '—'} <span style={S.dim}>({derived.winsCount} games)</span></span>
            </div>
            <div style={S.row}>
              <span style={S.dim}>Avg score vs target — losses</span>
              <span style={S.val}>{derived.avgPctLoss !== null ? `${derived.avgPctLoss}%` : '—'} <span style={S.dim}>({derived.lossesCount} games)</span></span>
            </div>
            <div style={S.row}>
              <span style={S.dim}>Victory round uptake (of wins)</span>
              <span style={S.val}>{derived.victoryRoundRate}% <span style={S.dim}>({stats.victoryRoundsTaken})</span></span>
            </div>
            <div style={S.rowLast}>
              <span style={S.dim}>Early end rate (of wins)</span>
              <span style={S.val}>{derived.earlyEndRate}% <span style={S.dim}>({stats.earlyEnds})</span></span>
            </div>
            {derived.flag && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: '#222', borderRadius: '6px', color: derived.flag.color, fontSize: '12px', lineHeight: 1.5 }}>
                {derived.flag.text}
              </div>
            )}
          </div>

          {/* ── Difficulty Ramp ─────────────────────────────────────────────── */}
          <div style={S.card}>
            <span style={S.label}>Difficulty Ramp (last 10 games)</span>
            <div style={S.row}>
              <span style={S.dim}>Avg level target</span>
              <span style={S.val}>{derived.avgTarget10?.toLocaleString() ?? '—'}</span>
            </div>
            <div style={S.row}>
              <span style={S.dim}>Avg difficulty bonus</span>
              <span style={S.val}>{derived.avgDifficulty10?.toLocaleString() ?? '—'}</span>
            </div>
            <div style={S.rowLast}>
              <span style={S.dim}>🏦 Bonus moves (current)</span>
              <span style={S.val}>{bonusMoves}</span>
            </div>
          </div>

          {/* ── Constants Reference ─────────────────────────────────────────── */}
          {Object.keys(constants).length > 0 && (
            <div style={S.card}>
              <span style={S.label}>Constants (read-only reference)</span>
              {Object.entries(constants).map(([k, v], i, arr) => (
                <div key={k} style={i < arr.length - 1 ? S.row : S.rowLast}>
                  <span style={S.dim}>{k}</span>
                  <span style={{ color: '#7ec8e3', fontWeight: 'bold' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Game History ─────────────────────────────────────────────────── */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showHistory ? '12px' : 0 }}>
              <span style={{ ...S.label, marginBottom: 0 }}>Game History — {stats.history.length} recorded</span>
              <button
                onClick={() => setShowHistory(h => !h)}
                style={{ ...S.btn, background: '#2a2a2a', color: '#ccc', padding: '4px 12px' }}
              >
                {showHistory ? '▲ hide' : '▼ show'}
              </button>
            </div>
            {showHistory && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '480px' }}>
                  <thead>
                    <tr style={{ color: '#ccc', textAlign: 'left', borderBottom: '1px solid #333' }}>
                      {['#', 'Result', 'Score', 'Target', '%', 'Type', 'Combo', 'Date'].map(h => (
                        <th key={h} style={{ padding: '4px 8px', fontWeight: 'normal' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats.history].reverse().map((g, i) => {
                      const pct = g.levelTarget ? Math.round(g.finalScore / g.levelTarget * 100) : null;
                      return (
                        <tr key={g.ts ?? i} style={{ borderTop: '1px solid #1e1e1e', color: g.won ? '#81c784' : '#e57373' }}>
                          <td style={{ padding: '3px 8px', color: '#ccc' }}>{stats.history.length - i}</td>
                          <td style={{ padding: '3px 8px' }}>{g.won ? '✓ won' : '✗ lost'}</td>
                          <td style={{ padding: '3px 8px' }}>{g.finalScore?.toLocaleString() ?? '—'}</td>
                          <td style={{ padding: '3px 8px', color: '#ccc' }}>{g.levelTarget?.toLocaleString() ?? '—'}</td>
                          <td style={{ padding: '3px 8px' }}>{pct !== null ? `${pct}%` : '—'}</td>
                          <td style={{ padding: '3px 8px', color: '#ccc' }}>{g.endType ?? '—'}</td>
                          <td style={{ padding: '3px 8px' }}>x{(g.maxCombo ?? 0) + 1}</td>
                          <td style={{ padding: '3px 8px', color: '#ccc' }}>{g.ts ? new Date(g.ts).toLocaleDateString() : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '4px' }}>
        <button onClick={handleExport} style={{ ...S.btn, background: '#1b3a1a', color: '#81c784' }}>
          📥 Export JSON
        </button>
        <button
          onClick={handleClear}
          style={{ ...S.btn, background: confirmClear ? '#4a1010' : '#222', color: confirmClear ? '#f87171' : '#ccc' }}
        >
          {confirmClear ? '⚠ Confirm clear?' : '🗑 Clear stats'}
        </button>
        <button onClick={onClose} style={{ ...S.btn, background: '#0d1b3e', color: '#90caf9', marginLeft: 'auto' }}>
          Close ×
        </button>
      </div>

    </div>
  );
}

// Export the defaultStats factory so host files can initialise match3_stats safely.
// migrateBonusMovesKeys is exported so platforms that don't otherwise import core
// (phone arcade, desktop, time-attack) can call it explicitly at module load.
export { defaultStats, STATS_KEY, BONUS_MOVES_KEY, migrateBonusMovesKeys };
export default AdminPanel;
