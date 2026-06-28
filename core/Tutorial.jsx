// =============================================================================
// core/Tutorial.jsx — Portable, reusable tutorial component (shared across
// every platform). Verses TODO #4 / docs/verses/tutorial-storyboard.md.
//
// ARCHITECTURE (Option A, locked 2026-06-23): this single core component holds
// ALL panel/section definitions. Each platform passes two small things:
//   - `sections`: an ordered list of section ids to show (so arcade can show
//     only the shared match panels, verses can add its own, etc.)
//   - `config`:   a small bundle of that platform's own numbers/copy (unused
//     for the shared match panels so far; reserved for the verses/campaign
//     panels and the real-scoring values pulled in when the multipliers panel
//     is built — see storyboard "Real-scoring core extraction").
// Platform files gain only a button + a few lines; the panel code lives here.
//
// VISUAL FIDELITY (Option A, locked): the demo board paints with the SAME
// `drawTile` / `drawSpecialIcon` canvas code the live game uses
// (core/tileDrawing.js, Session 1), so tutorial tiles are pixel-identical to
// gameplay tiles.
//
// BOARD SIZING (revised from the storyboard's "one consistent board",
// 2026-06-23): tile pixel size is CONSTANT across every panel and the modal
// reserves the largest (8x8) footprint; smaller grids center inside it. So the
// modal never resizes and tiles always render at the same size, while the grid
// grows in tiers as the effects escalate (6x6 basic/line -> 7x7 bomb/cross ->
// 8x8 novas/multipliers/fusion). Each panel's grid size = its hard-coded
// `board` dimensions.
//
// STATUS: Session 2 mock — only the first two SHARED panels are built
// (basic match, line special), on 6x6, for a look-approval checkpoint. Panels
// 3-8 follow the same per-panel structure. Scores here are illustrative and
// consistent with the demo board width; the exact in-game scoring lands with
// the real-scoring extraction when the multipliers panel (7) is built.
//
// CHOREOGRAPHY NOTES (from user feedback 2026-06-26):
//  - Slowed to ~1/3 speed (SPEED below) so a first-timer can follow it.
//  - The hand DRAGS the tile from source to destination (carries it), modeling
//    the real swap gesture, instead of tiles teleporting.
//  - A special is USED the way the real game works: you swap it INTO a line of
//    3+ matching tiles, which consumes it in the match and unleashes its blast
//    (row clear) — never by tapping the special alone.
// =============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { drawTile, drawSpecialIcon } from './tileDrawing.js';

// ---- Demo board metrics --------------------------------------------------
// Constant tile size; the modal reserves the 8x8 footprint so it never resizes.
const DEMO_TILE = 46;
const DEMO_GAP = 4;
const MAX_GRID = 8;
const CELL = DEMO_TILE + DEMO_GAP;
const FOOTPRINT = MAX_GRID * DEMO_TILE + (MAX_GRID - 1) * DEMO_GAP; // 396px

const gridPx = (n) => n * DEMO_TILE + (n - 1) * DEMO_GAP;
const gridOffset = (n) => (FOOTPRINT - gridPx(n)) / 2;

// ---- Animation timing ----------------------------------------------------
// SPEED scales all durations (3 = roughly 1/3 the original pace). EASE / the
// per-frame increments below are tuned to match so motion stays smooth, not
// just longer-held.
const SPEED = 2;
const T = {
  pause: 700 * SPEED,
  hand: 520 * SPEED,
  drag: 700 * SPEED,
  clear: 360 * SPEED,
  gravity: 460 * SPEED,
  form: 520 * SPEED,
  rowclear: 600 * SPEED,
};
const EASE = 0.11;       // per-frame lerp for tile/hand motion (lower = slower)
const CLEAR_RATE = 0.03; // per-frame pop-out progress
const SCORE_RATE = 0.11; // per-frame score count-up

let _uid = 0;
const uid = () => `t${_uid++}`;

// ---- Board construction --------------------------------------------------
// Boards are HARD-CODED per panel (see PANELS below). Every starting tile is
// authored so the ONLY available match is the one the tutorial makes, and that
// match is exactly the size we're teaching (no stray same-color neighbor turns
// a 3-match into a 4). Tile types: 0 red · 1 blue · 2 green · 3 gold star ·
// 4 purple · 5 orange.
const buildTilesFromGrid = (grid) => {
  const n = grid.length;
  const o = gridOffset(n);
  const tiles = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const px = o + c * CELL, py = o + r * CELL;
      tiles.push({
        key: uid(), type: grid[r][c], special: null,
        row: r, col: c, px, py, tx: px, ty: py,
        scale: 1, alpha: 1, clearing: false, clearT: 0, dragging: false, pulse: 0,
      });
    }
  }
  return tiles;
};

// Would type `t` at (r,c) complete a 3-in-a-row with the two cells to its left
// or the two below it? The settle pass runs bottom row up, left to right, so a
// run's top-most / right-most member is always the LAST one processed — checking
// just left-two + below-two there catches every possible run from one side.
const wouldRun = (ft, n, r, c, t) =>
  (c >= 2 && ft[r][c - 1] === t && ft[r][c - 2] === t) ||
  (r + 2 < n && ft[r + 1][c] === t && ft[r + 2][c] === t);

const firstSafeType = (ft, n, r, c) => {
  for (let t = 0; t < 6; t++) if (!wouldRun(ft, n, r, c, t)) return t;
  return 0;
};

const tileAt = (tiles, row, col) => tiles.find(t => t.row === row && t.col === col && !t.clearing);

// =============================================================================
// PANEL DEFINITIONS
// Step vocabulary: pause | hand | drag | clear | form | gravity | rowclear.
//   hand     { to:{row,col} }                 finger slides onto a tile
//   drag     { from:{row,col}, to:{row,col} } finger carries the tile + swaps
//   clear    { cells, score, popup }          matched tiles pop out
//   form     { cell, special }                a special tile forms (pulse)
//   gravity  {}                               survivors fall + refill
//   rowclear { row, extra, score, popup }     a line special clears its row
// Type 2 = green clover, type 3 = gold star (used for the scripted matches).
// =============================================================================
const PANELS = {
  // --- Panel 1: basic match (3) ------------------------------------------
  // Greens (2) at (4,1),(4,2) with a green waiting at (3,3); the only available
  // match is dragging that green DOWN into (4,3) to make exactly 3 across
  // (4,1)-(4,3). No other green sits beside the row, so the match is exactly 3.
  'basic-match': {
    id: 'basic-match',
    title: 'Basic match',
    caption: 'Swap two tiles to line up 3 or more of a kind. Matches clear, and new tiles fall in.',
    board: [
      [0, 1, 2, 3, 4, 5],
      [2, 3, 4, 5, 0, 1],
      [4, 5, 0, 1, 2, 3],
      [0, 1, 3, 2, 4, 5],
      [1, 2, 2, 5, 0, 1],
      [4, 5, 0, 1, 2, 3],
    ],
    steps() {
      return [
        { type: 'pause', dur: T.pause },
        { type: 'hand', to: { row: 3, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 3, col: 3 }, to: { row: 4, col: 3 }, dur: T.drag },
        { type: 'clear', cells: [[4, 1], [4, 2], [4, 3]], score: 60, popup: { text: 'Match! +60' }, dur: T.clear },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
      ];
    },
  },

  // --- Panel 2: line special (4 in a row) --------------------------------
  // MAKE: stars (3) at (2,1),(2,2),(2,4) with a gap at (2,3) and a star waiting
  // at (1,3). Drag it DOWN into (2,3) -> exactly 4-in-a-row -> a LINE special
  // forms at (2,3) (3 clear + 1 special). USE: stars at (4,3),(5,3) sit in the
  // stable column 3. Drag the line special DOWN into (3,3) so it joins them as
  // a vertical 3-match — that consumes it and unleashes its row clear.
  'line-special': {
    id: 'line-special',
    title: 'Line special',
    caption: 'Match 4 in a row to make a line special (⚡). To use it, swap it into a match — it clears that whole row.',
    board: [
      [0, 1, 2, 0, 4, 5],
      [2, 3, 4, 3, 0, 1],
      [4, 3, 3, 1, 3, 2],
      [0, 1, 2, 1, 4, 5],
      [2, 3, 4, 3, 0, 1],
      [4, 5, 0, 3, 2, 3],
    ],
    steps() {
      return [
        { type: 'pause', dur: T.pause },
        // Make the special.
        { type: 'hand', to: { row: 1, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 1, col: 3 }, to: { row: 2, col: 3 }, dur: T.drag },
        { type: 'clear', cells: [[2, 1], [2, 2], [2, 4]], score: 60, popup: { text: 'Match 4! +60' }, dur: T.clear },
        { type: 'form', cell: { row: 2, col: 3 }, special: 'line', dur: T.form },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
        // Use the special by swapping it into a match.
        { type: 'hand', to: { row: 2, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 2, col: 3 }, to: { row: 3, col: 3 }, dur: T.drag },
        { type: 'rowclear', row: 3, extra: [[4, 3], [5, 3]], score: 180, popup: { text: '⚡ LINE CLEAR! +180' }, dur: T.rowclear },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
      ];
    },
  },
};

// =============================================================================
// TutorialCanvas — plays one panel's timeline on a canvas.
// =============================================================================
function TutorialCanvas({ panel, replayKey, onScore, onPopup, onFinish }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = FOOTPRINT * dpr;
    canvas.height = FOOTPRINT * dpr;
    canvas.style.width = `${FOOTPRINT}px`;
    canvas.style.height = `${FOOTPRINT}px`;
    const ctx = canvas.getContext('2d');

    const n = panel.board.length;
    const o = gridOffset(n);
    const center = (row, col) => ({ x: o + col * CELL + DEMO_TILE / 2, y: o + row * CELL + DEMO_TILE / 2 });
    const HAND_PARK = { x: FOOTPRINT / 2, y: FOOTPRINT + 40 };

    const S = {
      tiles: buildTilesFromGrid(panel.board),
      steps: panel.steps(),
      stepIndex: -1,
      stepStart: 0,
      hand: { x: HAND_PARK.x, y: HAND_PARK.y, tx: HAND_PARK.x, ty: HAND_PARK.y, visible: false },
      dragTile: null,
      scoreTarget: 0,
      scoreShown: 0,
      raf: 0,
      done: false,
    };
    onScore(0);

    const parkHand = () => {
      S.hand.visible = false;
      S.hand.x = S.hand.tx = HAND_PARK.x;
      S.hand.y = S.hand.ty = HAND_PARK.y;
    };

    const applyGravity = () => {
      // 1) Settle survivors to the bottom of each column; record the final type
      //    grid (new cells left null). EXISTING tiles keep their color, always —
      //    a tile already on the board never changes type (that's not how the
      //    game works). Each panel's board is authored so survivors can't fall
      //    into a run; only brand-new tiles are color-checked below.
      const finalType = Array.from({ length: n }, () => Array(n).fill(null));
      const newCells = []; // { r, c, depth }
      for (let c = 0; c < n; c++) {
        const col = S.tiles.filter(t => t.col === c && !t.clearing).sort((a, b) => a.row - b.row);
        const newCount = n - col.length;
        col.forEach((t, i) => {
          const newRow = newCount + i;
          t.row = newRow; t.tx = o + c * CELL; t.ty = o + newRow * CELL;
          finalType[newRow][c] = t.type;
        });
        for (let r = 0; r < newCount; r++) newCells.push({ r, c, depth: newCount - r });
      }
      // 2) Fill ONLY the empty (new) cells, bottom-up / left-right, choosing a
      //    type that completes no run with its settled neighbors — so nothing
      //    falls in as a phantom match.
      for (let r = n - 1; r >= 0; r--) {
        for (let c = 0; c < n; c++) {
          if (finalType[r][c] === null) finalType[r][c] = firstSafeType(finalType, n, r, c);
        }
      }
      // 3) Spawn the new tiles above the board so they drop in.
      newCells.forEach(({ r, c, depth }) => {
        const px = o + c * CELL;
        S.tiles.push({
          key: uid(), type: finalType[r][c], special: null,
          row: r, col: c, px, py: o + (r - depth) * CELL,
          tx: px, ty: o + r * CELL, scale: 1, alpha: 1, clearing: false, clearT: 0, dragging: false, pulse: 0,
        });
      });
    };

    const enterStep = (i) => {
      // Release any in-progress drag onto its committed target.
      if (S.dragTile) { S.dragTile.dragging = false; S.dragTile = null; }
      S.stepIndex = i;
      S.stepStart = performance.now();
      if (i >= S.steps.length) { S.done = true; onFinish(); return; }
      const step = S.steps[i];
      switch (step.type) {
        case 'hand': {
          const cc = center(step.to.row, step.to.col);
          S.hand.visible = true; S.hand.tx = cc.x; S.hand.ty = cc.y;
          break;
        }
        case 'drag': {
          const a = tileAt(S.tiles, step.from.row, step.from.col);
          const b = tileAt(S.tiles, step.to.row, step.to.col);
          const cc = center(step.to.row, step.to.col);
          S.hand.visible = true; S.hand.tx = cc.x; S.hand.ty = cc.y;
          if (a) {
            a.row = step.to.row; a.col = step.to.col;
            a.tx = o + step.to.col * CELL; a.ty = o + step.to.row * CELL;
            a.dragging = true; S.dragTile = a;
          }
          if (b) {
            b.row = step.from.row; b.col = step.from.col;
            b.tx = o + step.from.col * CELL; b.ty = o + step.from.row * CELL;
          }
          break;
        }
        case 'clear': {
          parkHand();
          step.cells.forEach(([r, c]) => { const t = tileAt(S.tiles, r, c); if (t) t.clearing = true; });
          if (step.score) S.scoreTarget += step.score;
          if (step.popup) onPopup(step.popup);
          break;
        }
        case 'form': {
          const t = tileAt(S.tiles, step.cell.row, step.cell.col);
          if (t) { t.special = step.special; t.pulse = performance.now(); }
          break;
        }
        case 'rowclear': {
          parkHand();
          S.tiles.forEach(t => { if (t.row === step.row && !t.clearing) t.clearing = true; });
          (step.extra || []).forEach(([r, c]) => { const t = tileAt(S.tiles, r, c); if (t) t.clearing = true; });
          if (step.score) S.scoreTarget += step.score;
          if (step.popup) onPopup(step.popup);
          break;
        }
        case 'gravity': { applyGravity(); break; }
        default: break;
      }
    };

    const drawHand = () => {
      if (!S.hand.visible) return;
      ctx.save();
      ctx.font = '34px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 6;
      ctx.fillText('👆', S.hand.x, S.hand.y + 6);
      ctx.restore();
    };

    const paintTile = (t, now) => {
      let scale = t.scale;
      if (t.pulse) {
        const p = Math.min(1, (now - t.pulse) / T.form);
        scale = 1 + Math.sin(p * Math.PI) * 0.18;
        if (p >= 1) t.pulse = 0;
      }
      drawTile(ctx, t.px, t.py, DEMO_TILE, t.type, { opacity: t.alpha, scale, isSpecial: !!t.special });
      if (t.special && t.alpha > 0.5) drawSpecialIcon(ctx, t.px, t.py, DEMO_TILE, t.special);
    };

    const frame = (now) => {
      if (S.stepIndex === -1) enterStep(0);
      else if (!S.done) {
        const step = S.steps[S.stepIndex];
        if (now - S.stepStart >= step.dur) { enterStep(S.stepIndex + 1); }
      }

      // Motion + clear + score easing.
      S.hand.x += (S.hand.tx - S.hand.x) * EASE;
      S.hand.y += (S.hand.ty - S.hand.y) * EASE;
      S.tiles.forEach(t => {
        if (t.dragging) {
          // Pin the carried tile under the finger.
          t.px = S.hand.x - DEMO_TILE / 2;
          t.py = S.hand.y - DEMO_TILE / 2;
        } else {
          t.px += (t.tx - t.px) * EASE;
          t.py += (t.ty - t.py) * EASE;
        }
        if (t.clearing) { t.clearT = Math.min(1, t.clearT + CLEAR_RATE); t.scale = 1 - t.clearT; t.alpha = 1 - t.clearT; }
      });
      S.tiles = S.tiles.filter(t => !(t.clearing && t.clearT >= 1));
      if (S.scoreShown !== S.scoreTarget) {
        S.scoreShown += Math.ceil((S.scoreTarget - S.scoreShown) * SCORE_RATE);
        if (Math.abs(S.scoreTarget - S.scoreShown) <= 1) S.scoreShown = S.scoreTarget;
        onScore(S.scoreShown);
      }

      // Render.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, FOOTPRINT, FOOTPRINT);
      const bg = ctx.createLinearGradient(0, 0, FOOTPRINT, FOOTPRINT);
      bg.addColorStop(0, '#2b2b3a');
      bg.addColorStop(1, '#1f1f2b');
      ctx.fillStyle = bg;
      const bx = gridOffset(n) - DEMO_GAP, bw = gridPx(n) + DEMO_GAP * 2;
      ctx.fillRect(bx, bx, bw, bw);

      // Draw stationary tiles first, the carried tile on top.
      S.tiles.forEach(t => { if (!t.dragging) paintTile(t, now); });
      S.tiles.forEach(t => { if (t.dragging) paintTile(t, now); });
      drawHand();

      if (!S.done) S.raf = requestAnimationFrame(frame);
    };

    S.raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(S.raf);
  }, [panel, replayKey, onScore, onPopup, onFinish]);

  return <canvas ref={canvasRef} style={{ borderRadius: '10px', display: 'block' }} />;
}

// =============================================================================
// Tutorial — the modal shell (title, score, board, caption, controls).
// =============================================================================
export default function Tutorial({ sections, config = {}, onClose }) {
  const panels = sections.map(id => PANELS[id]).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [score, setScore] = useState(0);
  const [popup, setPopup] = useState(null);
  const [finished, setFinished] = useState(false);

  const panel = panels[index];

  const handleScore = useCallback((v) => setScore(v), []);
  const handlePopup = useCallback((p) => setPopup({ ...p, key: Date.now() }), []);
  const handleFinish = useCallback(() => setFinished(true), []);

  const goTo = (i) => { setIndex(i); setScore(0); setPopup(null); setFinished(false); setReplayKey(k => k + 1); };
  const replay = () => { setScore(0); setPopup(null); setFinished(false); setReplayKey(k => k + 1); };

  if (!panel) return null;

  const dot = (active) => ({
    width: '9px', height: '9px', borderRadius: '50%',
    background: active ? '#667eea' : '#cfcfe0', display: 'inline-block', margin: '0 4px',
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 4000, fontFamily: 'Arial, sans-serif', padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '18px', padding: '18px 22px 16px',
          width: `${FOOTPRINT + 56}px`, maxWidth: '95vw',
          boxShadow: '0 18px 50px rgba(0,0,0,0.4)', position: 'relative',
        }}
      >
        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#333' }}>
            How to Play <span style={{ color: '#888', fontWeight: 'normal', fontSize: '14px' }}>· {panel.title}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close tutorial"
            style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#888', lineHeight: 1, padding: '2px 6px' }}
          >✕</button>
        </div>

        {/* Live score */}
        <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
          Score: <span style={{ color: '#667eea' }}>{score}</span>
        </div>

        {/* Demo board + popup overlay */}
        <div style={{ position: 'relative', width: `${FOOTPRINT}px`, maxWidth: '100%', margin: '0 auto' }}>
          <TutorialCanvas
            panel={panel}
            replayKey={replayKey}
            onScore={handleScore}
            onPopup={handlePopup}
            onFinish={handleFinish}
          />
          {popup && (
            <div
              key={popup.key}
              style={{
                position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)',
                color: popup.color || '#FFD700', fontWeight: 900, fontSize: '20px', whiteSpace: 'nowrap',
                background: 'rgba(0,0,0,0.9)', padding: '8px 14px', borderRadius: '10px',
                border: `2px solid ${popup.color || '#FFD700'}`, boxShadow: '0 0 20px rgba(255,215,0,0.6)',
                pointerEvents: 'none', animation: 'tutPopup 1.8s ease-out forwards', zIndex: 5,
              }}
            >{popup.text}</div>
          )}
        </div>

        {/* Caption */}
        <div style={{ textAlign: 'center', color: '#444', fontSize: '15px', lineHeight: 1.45, margin: '12px 6px 10px', minHeight: '44px' }}>
          {panel.caption}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => goTo(Math.max(0, index - 1))}
            disabled={index === 0}
            style={{
              border: 'none', background: 'transparent', fontSize: '15px',
              color: index === 0 ? '#ccc' : '#667eea', cursor: index === 0 ? 'default' : 'pointer', fontWeight: 'bold',
            }}
          >‹ Back</button>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {panels.map((p, i) => <span key={p.id} style={dot(i === index)} />)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={replay}
              style={{
                border: `1px solid ${finished ? '#667eea' : '#ddd'}`, background: finished ? '#667eea' : '#fff',
                color: finished ? '#fff' : '#667eea', borderRadius: '999px', padding: '5px 14px',
                fontSize: '14px', cursor: 'pointer', fontWeight: 'bold',
              }}
            >↻ Replay</button>
            <button
              onClick={() => goTo(Math.min(panels.length - 1, index + 1))}
              disabled={index === panels.length - 1}
              style={{
                border: 'none', background: 'transparent', fontSize: '15px',
                color: index === panels.length - 1 ? '#ccc' : '#667eea',
                cursor: index === panels.length - 1 ? 'default' : 'pointer', fontWeight: 'bold',
              }}
            >Next ›</button>
          </div>
        </div>

        <style>{`@keyframes tutPopup {
          0%   { opacity: 0; transform: translate(-50%,-40%) scale(0.85); }
          14%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          82%  { opacity: 1; transform: translate(-50%,-58%) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-72%) scale(1); }
        }`}</style>
      </div>
    </div>
  );
}
