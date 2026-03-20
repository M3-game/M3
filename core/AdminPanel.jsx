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
//   match3_stats       — JSON stats object (see schema below)
//   match3_bankedMoves — integer
//   match3_highScore, match3_highCombo, match3_highTurnScore — legacy keys
// =============================================================================

const STATS_KEY   = 'match3_stats';
const BANKED_KEY  = 'match3_bankedMoves';

function defaultStats() {
  return {
    version: 1,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    bonusRoundsTaken: 0,
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
  const { gamesPlayed, gamesWon, history, bonusRoundsTaken, earlyEnds } = stats;

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

  const bonusRoundRate = wins.length > 0 ? Math.round(bonusRoundsTaken / wins.length * 100) : 0;
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
    bonusRoundRate, earlyEndRate,
    avgTarget10, avgDifficulty10,
    winsCount: wins.length, lossesCount: losses.length,
    flag,
  };
}

// -----------------------------------------------------------------------------

function AdminPanel({ onClose, constants = {} }) {
  const [stats, setStats]             = useState(null);
  const [bankedMoves, setBankedMoves] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setStats(loadStats());
    setBankedMoves(parseInt(localStorage.getItem(BANKED_KEY) || '0', 10));
  }, []);

  const handleExport = () => {
    const data = {
      stats: loadStats(),
      bankedMoves: parseInt(localStorage.getItem(BANKED_KEY) || '0', 10),
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
    label:  { color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px', display: 'block' },
    row:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #222', fontSize: '13px' },
    rowLast:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: '13px' },
    val:    { fontWeight: 'bold', color: '#fff' },
    dim:    { color: '#666' },
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
          <div style={{ fontSize: '11px', color: '#555' }}>
            Access: <span style={{ color: '#777' }}>?admin=1</span> · long-press score (1.5 s)
          </div>
        </div>
        <button onClick={onClose} style={{ ...S.btn, background: '#2a2a2a', color: '#aaa', fontSize: '17px', lineHeight: 1, padding: '4px 11px' }}>×</button>
      </div>

      {/* ── No data ────────────────────────────────────────────────────────── */}
      {!stats && (
        <div style={{ ...S.card, textAlign: 'center', color: '#555', padding: '32px' }}>
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
              <span style={S.dim}>Bonus round uptake (of wins)</span>
              <span style={S.val}>{derived.bonusRoundRate}% <span style={S.dim}>({stats.bonusRoundsTaken})</span></span>
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
              <span style={S.dim}>🏦 Banked moves (current)</span>
              <span style={S.val}>{bankedMoves}</span>
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
                style={{ ...S.btn, background: '#2a2a2a', color: '#888', padding: '4px 12px' }}
              >
                {showHistory ? '▲ hide' : '▼ show'}
              </button>
            </div>
            {showHistory && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '480px' }}>
                  <thead>
                    <tr style={{ color: '#555', textAlign: 'left', borderBottom: '1px solid #333' }}>
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
                          <td style={{ padding: '3px 8px', color: '#444' }}>{stats.history.length - i}</td>
                          <td style={{ padding: '3px 8px' }}>{g.won ? '✓ won' : '✗ lost'}</td>
                          <td style={{ padding: '3px 8px' }}>{g.finalScore?.toLocaleString() ?? '—'}</td>
                          <td style={{ padding: '3px 8px', color: '#aaa' }}>{g.levelTarget?.toLocaleString() ?? '—'}</td>
                          <td style={{ padding: '3px 8px' }}>{pct !== null ? `${pct}%` : '—'}</td>
                          <td style={{ padding: '3px 8px', color: '#888' }}>{g.endType ?? '—'}</td>
                          <td style={{ padding: '3px 8px' }}>x{(g.maxCombo ?? 0) + 1}</td>
                          <td style={{ padding: '3px 8px', color: '#555' }}>{g.ts ? new Date(g.ts).toLocaleDateString() : '—'}</td>
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
          style={{ ...S.btn, background: confirmClear ? '#4a1010' : '#222', color: confirmClear ? '#f87171' : '#666' }}
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

// Export the defaultStats factory so host files can initialise match3_stats safely
export { defaultStats, STATS_KEY, BANKED_KEY };
export default AdminPanel;
