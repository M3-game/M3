import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// =============================================================================
// MATCH-3 GAME v11 - TABLET OPTIMIZED
// Performance-optimized with HTML5 Canvas rendering
// 10x12 grid, R1 Sunflower, Blue Jewel, Green Clover (board v7 designs)
// v10.1-tablet: Special power rebalance
//   Bomb:      3×3 + full row + col, flat 750 pts, chains to row/col specials
//   Supernova: 5×5 + full row + col, flat 2000 pts, chains to row/col specials
//   Hypernova: 5×5 + row + col + random 50% of remaining regular tiles,
//              specials IMMUNE (never removed), flat 5000 pts, min 30 tiles
//   Combos rescaled to match new base power levels
// v10.5-tablet: Bug fixes + features
//   Fix A: Bonus move now deferred past game-end score flush (moves=0 doesn't end game
//           while a bonus move threshold is pending)
//   Fix B: Hypernova/supernova combos left the two swapped specials on the board
//           (all "clear regular tiles" combo branches now explicitly remove swapped tiles)
//   Feature: Bonus move popup replaced with animated burst at the Moves counter in header
// v11-tablet: Input handling fixes
//   Fix 1: dragStart converted from useState to useRef so rapid touchmove events see
//           the cleared value synchronously — prevents double-swap and 2→0 move skip
//   Fix 2: swapFiredRef guards handleCanvasClick against the phantom synthetic click
//           that fires after every touch drag-swap (modern browsers emit detail=1,
//           bypassing the old detail===0 guard)
// =============================================================================

// Game Constants
const ROWS = 12;
const COLS = 10;
const TILE_SIZE = 50;
const TILE_GAP = 4;
const TILE_TYPES = 6;

// Difficulty Constants  
const MIN_MOVES = 18;
const MAX_MOVES = 24;
const BASE_TARGET = 5000;
const TARGET_VARIANCE = 1500;

// Scoring Constants
const WIN_BONUS_PER_MOVE = 100;
const EARLY_END_BONUS_PER_MOVE = 200; // v8.10: Higher bonus for ending early instead of bonus round
const BONUS_ROUND_MULTIPLIER = 1.5;   // v8.10: Points multiplier during bonus round
const DIFFICULTY_INCREMENT_MIN = 200;
const DIFFICULTY_INCREMENT_MAX = 500;

// v10.4: Award one bonus move for every BONUS_MOVE_INTERVAL points scored
const BONUS_MOVE_INTERVAL = 10000;

// Animation Constants
const ANIMATION_SPEED = 0.25; // Higher = faster (0-1)
// v10.2: Removed DROP_SPEED and MATCH_FADE_SPEED — these were declared but never read;
//        actual drop timing is controlled by setTimeout delays in applyGravity/fillEmptySpaces.

// v9.5: Performance Constants
const MAX_DPR = 2; // Cap device pixel ratio to reduce render load on high-DPI tablets

// v9.7.1-tablet: Simple frame skip (more reliable than timestamps on tablet)
const FRAME_SKIP = 2; // Render every Nth frame (2 = 30fps, 3 = 20fps)

// Tile Colors and Drawing Functions
const TILE_COLORS = [
  { name: 'hypocycloid', primary: '#E53935', light: '#FFCDD2', dark: '#B71C1C', accent: '#FF5252' },
  { name: 'diamond', primary: '#304FFE', light: '#90CAF9', dark: '#0D47A1', accent: '#42A5F5' },
  { name: 'clover', primary: '#00C853', light: '#81C784', dark: '#2E7D32', accent: '#66BB6A' },
  { name: 'star', primary: '#FFD700', light: '#FFF9C4', dark: '#FF8F00', accent: '#FFD54F' },
  { name: 'candy', primary: '#AA00FF', light: '#E1BEE7', dark: '#6A1B9A', accent: '#AB47BC' },
  { name: 'sun', primary: '#FF6D00', light: '#FFCC80', dark: '#BF360C', accent: '#FFB74D' }
];

// Canvas Tile Drawing Functions
const drawTile = (ctx, x, y, size, tileType, options = {}) => {
  const { isSelected, isMatched, isSpecial, isPending, opacity = 1, scale = 1 } = options;
  const color = TILE_COLORS[tileType];
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Center and scale
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  
  // Draw shape based on type
  switch (tileType) {
    case 0: drawHypocycloid(ctx, x, y, size, color); break;
    case 1: drawDiamond(ctx, x, y, size, color); break;
    case 2: drawClover(ctx, x, y, size, color); break;
    case 3: drawStar(ctx, x, y, size, color); break;
    case 4: drawCandy(ctx, x, y, size, color); break;
    case 5: drawSun(ctx, x, y, size, color); break;
  }
  
  // Selection/special effects
  if (isSelected) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 15;
  }
  
  if (isPending) {
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }
  
  if (isSpecial) {
    ctx.strokeStyle = 'gold';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }
  
  ctx.restore();
};

// Hypocycloid (Red) - 4-pointed star shape
const drawHypocycloid = (ctx, x, y, size, color) => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.45;
  
  // Create gradient
  const gradient = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  gradient.addColorStop(0, color.light);
  gradient.addColorStop(0.3, color.accent);
  gradient.addColorStop(0.7, color.primary);
  gradient.addColorStop(1, color.dark);
  
  ctx.beginPath();
  // 4-pointed astroid shape
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + r * 0.2, cy - r * 0.2, cx + r, cy);
  ctx.quadraticCurveTo(cx + r * 0.2, cy + r * 0.2, cx, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.2, cy + r * 0.2, cx - r, cy);
  ctx.quadraticCurveTo(cx - r * 0.2, cy - r * 0.2, cx, cy - r);
  ctx.closePath();
  
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = color.dark;
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Highlight
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.25, cy - r * 0.25, r * 0.2, r * 0.15, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
};

// Diamond (Blue) - Bejeweled style gem
// Blue Jewel - Faceted cut gem (from board-preview-v7)
const drawDiamond = (ctx, x, y, size, color) => {
  const scale = size / 40; // Board SVG uses 40x40 viewBox
  
  // Gradient for main body (crown)
  const gradient1 = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient1.addColorStop(0, '#42A5F5');
  gradient1.addColorStop(0.4, '#1E88E5');
  gradient1.addColorStop(1, '#0D47A1');
  
  // Gradient for pavilion (bottom)
  const gradient2 = ctx.createLinearGradient(x, y + size * 0.5, x, y + size);
  gradient2.addColorStop(0, '#64B5F6');
  gradient2.addColorStop(1, '#1565C0');
  
  // Crown (top trapezoid): points="8,12 32,12 38,20 2,20"
  ctx.beginPath();
  ctx.moveTo(x + 8 * scale, y + 12 * scale);
  ctx.lineTo(x + 32 * scale, y + 12 * scale);
  ctx.lineTo(x + 38 * scale, y + 20 * scale);
  ctx.lineTo(x + 2 * scale, y + 20 * scale);
  ctx.closePath();
  ctx.fillStyle = gradient1;
  ctx.fill();
  
  // Table facet (top cap): points="12,12 28,12 26,8 14,8"
  ctx.beginPath();
  ctx.moveTo(x + 12 * scale, y + 12 * scale);
  ctx.lineTo(x + 28 * scale, y + 12 * scale);
  ctx.lineTo(x + 26 * scale, y + 8 * scale);
  ctx.lineTo(x + 14 * scale, y + 8 * scale);
  ctx.closePath();
  ctx.fillStyle = '#90CAF9';
  ctx.fill();
  
  // Pavilion (bottom triangle): points="2,20 38,20 20,38"
  ctx.beginPath();
  ctx.moveTo(x + 2 * scale, y + 20 * scale);
  ctx.lineTo(x + 38 * scale, y + 20 * scale);
  ctx.lineTo(x + 20 * scale, y + 38 * scale);
  ctx.closePath();
  ctx.fillStyle = gradient2;
  ctx.fill();
  
  // Highlight: points="14,10 20,10 18,14 14,14"
  ctx.beginPath();
  ctx.moveTo(x + 14 * scale, y + 10 * scale);
  ctx.lineTo(x + 20 * scale, y + 10 * scale);
  ctx.lineTo(x + 18 * scale, y + 14 * scale);
  ctx.lineTo(x + 14 * scale, y + 14 * scale);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
};

// Green Clover - 3 heart leaves (from board-preview-v7)
const drawClover = (ctx, x, y, size, color) => {
  const scale = size / 40; // Board SVG uses 40x40 viewBox
  
  // Gradient for leaves
  const gradient = ctx.createRadialGradient(
    x + 14 * scale, y + 14 * scale, 0,
    x + 20 * scale, y + 20 * scale, 26 * scale
  );
  gradient.addColorStop(0, '#81C784');
  gradient.addColorStop(0.4, '#4CAF50');
  gradient.addColorStop(1, '#2E7D32');
  
  ctx.fillStyle = gradient;
  
  // Top heart leaf
  ctx.beginPath();
  ctx.moveTo(x + 20 * scale, y + 5 * scale);
  ctx.bezierCurveTo(
    x + 18 * scale, y + 3 * scale,
    x + 15 * scale, y + 3 * scale,
    x + 13 * scale, y + 5 * scale
  );
  ctx.bezierCurveTo(
    x + 11 * scale, y + 7 * scale,
    x + 11 * scale, y + 10 * scale,
    x + 13 * scale, y + 13 * scale
  );
  ctx.lineTo(x + 20 * scale, y + 20 * scale);
  ctx.lineTo(x + 27 * scale, y + 13 * scale);
  ctx.bezierCurveTo(
    x + 29 * scale, y + 10 * scale,
    x + 29 * scale, y + 7 * scale,
    x + 27 * scale, y + 5 * scale
  );
  ctx.bezierCurveTo(
    x + 25 * scale, y + 3 * scale,
    x + 22 * scale, y + 3 * scale,
    x + 20 * scale, y + 5 * scale
  );
  ctx.closePath();
  ctx.fill();
  
  // Left heart leaf
  ctx.beginPath();
  ctx.moveTo(x + 5 * scale, y + 20 * scale);
  ctx.bezierCurveTo(
    x + 3 * scale, y + 18 * scale,
    x + 3 * scale, y + 15 * scale,
    x + 5 * scale, y + 13 * scale
  );
  ctx.bezierCurveTo(
    x + 7 * scale, y + 11 * scale,
    x + 10 * scale, y + 11 * scale,
    x + 13 * scale, y + 13 * scale
  );
  ctx.lineTo(x + 20 * scale, y + 20 * scale);
  ctx.lineTo(x + 13 * scale, y + 27 * scale);
  ctx.bezierCurveTo(
    x + 10 * scale, y + 29 * scale,
    x + 7 * scale, y + 29 * scale,
    x + 5 * scale, y + 27 * scale
  );
  ctx.bezierCurveTo(
    x + 3 * scale, y + 25 * scale,
    x + 3 * scale, y + 22 * scale,
    x + 5 * scale, y + 20 * scale
  );
  ctx.closePath();
  ctx.fill();
  
  // Right heart leaf
  ctx.beginPath();
  ctx.moveTo(x + 35 * scale, y + 20 * scale);
  ctx.bezierCurveTo(
    x + 37 * scale, y + 18 * scale,
    x + 37 * scale, y + 15 * scale,
    x + 35 * scale, y + 13 * scale
  );
  ctx.bezierCurveTo(
    x + 33 * scale, y + 11 * scale,
    x + 30 * scale, y + 11 * scale,
    x + 27 * scale, y + 13 * scale
  );
  ctx.lineTo(x + 20 * scale, y + 20 * scale);
  ctx.lineTo(x + 27 * scale, y + 27 * scale);
  ctx.bezierCurveTo(
    x + 30 * scale, y + 29 * scale,
    x + 33 * scale, y + 29 * scale,
    x + 35 * scale, y + 27 * scale
  );
  ctx.bezierCurveTo(
    x + 37 * scale, y + 25 * scale,
    x + 37 * scale, y + 22 * scale,
    x + 35 * scale, y + 20 * scale
  );
  ctx.closePath();
  ctx.fill();
  
  // Stem
  ctx.beginPath();
  ctx.moveTo(x + 20 * scale, y + 20 * scale);
  ctx.lineTo(x + 20 * scale, y + 32 * scale);
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Highlight on top leaf
  ctx.beginPath();
  ctx.ellipse(x + 17 * scale, y + 9 * scale, 2 * scale, 1.5 * scale, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
};

// Star (Gold) - 5-pointed star
const drawStar = (ctx, x, y, size, color) => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const outerR = size * 0.45;
  const innerR = size * 0.2;
  
  // Gradient
  const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, color.light);
  gradient.addColorStop(0.3, color.accent);
  gradient.addColorStop(0.7, color.primary);
  gradient.addColorStop(1, color.dark);
  
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 72 - 90) * Math.PI / 180;
    const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
    
    if (i === 0) {
      ctx.moveTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
    } else {
      ctx.lineTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
    }
    ctx.lineTo(cx + innerR * Math.cos(innerAngle), cy + innerR * Math.sin(innerAngle));
  }
  ctx.closePath();
  
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Inner highlight star
  ctx.beginPath();
  const highlightR = outerR * 0.5;
  const highlightInnerR = innerR * 0.6;
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 72 - 90) * Math.PI / 180;
    const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
    if (i === 0) {
      ctx.moveTo(cx + highlightR * Math.cos(outerAngle), cy + highlightR * Math.sin(outerAngle));
    } else {
      ctx.lineTo(cx + highlightR * Math.cos(outerAngle), cy + highlightR * Math.sin(outerAngle));
    }
    ctx.lineTo(cx + highlightInnerR * Math.cos(innerAngle), cy + highlightInnerR * Math.sin(innerAngle));
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
};

// Candy (Purple) - Jelly bean shape
const drawCandy = (ctx, x, y, size, color) => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const rx = size * 0.4;
  const ry = size * 0.3;
  
  // Gradient
  const gradient = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 0, cx, cy, rx * 1.2);
  gradient.addColorStop(0, color.light);
  gradient.addColorStop(0.4, color.accent);
  gradient.addColorStop(1, color.dark);
  
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = color.dark;
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Highlight
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.35, cy - ry * 0.3, rx * 0.35, ry * 0.3, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
  
  // Shadow
  ctx.beginPath();
  ctx.ellipse(cx + rx * 0.25, cy + ry * 0.25, rx * 0.25, ry * 0.15, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();
};

// Sun (Orange) - R1 Teardrop Warm Orange Sunflower
const drawSun = (ctx, x, y, size, color) => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const coreR = size * 0.22;
  
  // Center gradient (warm orange)
  const centerGradient = ctx.createRadialGradient(cx - coreR * 0.3, cy - coreR * 0.3, 0, cx, cy, coreR * 1.1);
  centerGradient.addColorStop(0, '#FFCC80');
  centerGradient.addColorStop(0.5, '#FF9800');
  centerGradient.addColorStop(1, '#E65100');
  
  // Petal gradient (warm orange)
  const petalGradient = ctx.createLinearGradient(cx, cy - size * 0.45, cx, cy);
  petalGradient.addColorStop(0, '#FFB74D');
  petalGradient.addColorStop(0.5, '#FF9800');
  petalGradient.addColorStop(1, '#BF360C');
  
  // Draw 12 teardrop petals
  ctx.fillStyle = petalGradient;
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * Math.PI / 180;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    // Teardrop shape: pointed at top, rounded at bottom
    ctx.moveTo(0, -size * 0.44); // Top point
    ctx.quadraticCurveTo(size * 0.1, -size * 0.32, size * 0.06, -size * 0.24); // Right curve
    ctx.quadraticCurveTo(0, -size * 0.18, -size * 0.06, -size * 0.24); // Bottom curve
    ctx.quadraticCurveTo(-size * 0.1, -size * 0.32, 0, -size * 0.44); // Left curve back to top
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  
  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fillStyle = centerGradient;
  ctx.fill();
  ctx.strokeStyle = '#BF360C';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  
  // Highlight on center
  ctx.beginPath();
  ctx.ellipse(cx - coreR * 0.3, cy - coreR * 0.25, coreR * 0.35, coreR * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
};

// Draw special tile icon
// v7.3: Line/Cross in corner (21px), Bomb/Supernova/Hypernova centered (14px)
// v9.6-tablet: Canvas-drawn special icons (replaces emoji for tablet compatibility)
const drawSpecialIcon = (ctx, x, y, size, specialType) => {
  ctx.save();
  
  // Position: corner for line/cross, center for others
  const isCorner = specialType === 'line' || specialType === 'cross';
  const iconSize = isCorner ? 16 : 20;
  const cx = isCorner ? x + size - 12 : x + size / 2;
  const cy = isCorner ? y + size - 12 : y + size / 2;
  
  // Draw dark background circle for visibility
  ctx.beginPath();
  ctx.arc(cx, cy, iconSize / 2 + 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fill();
  
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  switch (specialType) {
    case 'line':
      // Lightning bolt - yellow zigzag
      ctx.strokeStyle = '#FFD700';
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 6);
      ctx.lineTo(cx + 1, cy - 1);
      ctx.lineTo(cx - 1, cy - 1);
      ctx.lineTo(cx + 3, cy + 6);
      ctx.lineTo(cx - 1, cy + 1);
      ctx.lineTo(cx + 1, cy + 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
      
    case 'bomb':
      // Bomb - black circle with orange fuse spark
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 6, 0, Math.PI * 2);
      ctx.fill();
      // Fuse
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 3, cy - 3);
      ctx.quadraticCurveTo(cx + 6, cy - 6, cx + 4, cy - 7);
      ctx.stroke();
      // Spark
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.arc(cx + 4, cy - 7, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'cross':
      // 4-pointed sparkle - cyan/white
      ctx.strokeStyle = '#00FFFF';
      ctx.fillStyle = '#00FFFF';
      ctx.lineWidth = 2;
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx, cy + 6);
      ctx.stroke();
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy);
      ctx.lineTo(cx + 6, cy);
      ctx.stroke();
      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'supernova':
      // Spiral starburst - purple/magenta
      ctx.strokeStyle = '#FF00FF';
      ctx.fillStyle = '#FF00FF';
      ctx.lineWidth = 2;
      // Draw 6-pointed star
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
        ctx.stroke();
      }
      // Center glow
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'hypernova':
      // v9.8: Exploding star - radiating lines + particles
      ctx.strokeStyle = '#FFD700';
      ctx.fillStyle = '#FFD700';
      ctx.lineWidth = 2;
      // Radiating lines (8 directions)
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 2, cy + Math.sin(angle) * 2);
        ctx.lineTo(cx + Math.cos(angle) * 7, cy + Math.sin(angle) * 7);
        ctx.stroke();
      }
      // Center bright circle
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      // Outer particles (4 dots)
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(cx + 6, cy - 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - 6, cy + 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 5, cy + 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - 7, cy - 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  ctx.restore();
};

// =============================================================================
// GAME LOGIC (preserved from v5.0)
// =============================================================================

const initializeGrid = () => {
  const grid = [];
  for (let row = 0; row < ROWS; row++) {
    grid[row] = [];
    for (let col = 0; col < COLS; col++) {
      let type;
      let attempts = 0;
      do {
        type = Math.floor(Math.random() * TILE_TYPES);
        attempts++;
        if (attempts > 50) break;
      } while (
        (col >= 2 && grid[row][col - 1]?.type === type && grid[row][col - 2]?.type === type) ||
        (row >= 2 && grid[row - 1]?.[col]?.type === type && grid[row - 2]?.[col]?.type === type)
      );
      
      grid[row][col] = {
        type,
        id: `${row}-${col}-${Date.now()}-${Math.random()}`,
        special: null,
        isNew: false,
        // Animation properties
        animX: col * (TILE_SIZE + TILE_GAP),
        animY: row * (TILE_SIZE + TILE_GAP),
        targetX: col * (TILE_SIZE + TILE_GAP),
        targetY: row * (TILE_SIZE + TILE_GAP),
        opacity: 1,
        scale: 1
      };
    }
  }
  return grid;
};

const hasValidMoves = (grid) => {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (col < COLS - 1) {
        const testGrid = grid.map(r => r.map(t => t ? { ...t } : null));
        [testGrid[row][col], testGrid[row][col + 1]] = [testGrid[row][col + 1], testGrid[row][col]];
        if (findMatchesSimple(testGrid).length > 0) return true;
      }
      if (row < ROWS - 1) {
        const testGrid = grid.map(r => r.map(t => t ? { ...t } : null));
        [testGrid[row][col], testGrid[row + 1][col]] = [testGrid[row + 1][col], testGrid[row][col]];
        if (findMatchesSimple(testGrid).length > 0) return true;
      }
    }
  }
  return false;
};

const findMatchesSimple = (grid) => {
  const matches = [];
  
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS - 2; col++) {
      if (grid[row][col] && grid[row][col + 1] && grid[row][col + 2] &&
          grid[row][col].type === grid[row][col + 1].type &&
          grid[row][col].type === grid[row][col + 2].type) {
        matches.push({ row, col });
      }
    }
  }
  
  for (let row = 0; row < ROWS - 2; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col] && grid[row + 1][col] && grid[row + 2][col] &&
          grid[row][col].type === grid[row + 1][col].type &&
          grid[row][col].type === grid[row + 2][col].type) {
        matches.push({ row, col });
      }
    }
  }
  
  return matches;
};

const calculateUnusedSpecialsBonus = (grid) => {
  let bonus = 0;
  const specials = { line: 0, bomb: 0, cross: 0, supernova: 0, hypernova: 0 };
  
  grid.forEach(row => {
    row.forEach(tile => {
      if (tile?.special) {
        specials[tile.special]++;
        switch (tile.special) {
          case 'line': bonus += 100; break;
          case 'bomb': bonus += 150; break;
          case 'cross': bonus += 200; break;
          case 'supernova': bonus += 300; break;
          case 'hypernova': bonus += 500; break;
        }
      }
    });
  });
  
  return { bonus, specials };
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Match3Game = () => {
  // Game state
  const [grid, setGrid] = useState(initializeGrid);
  const [selectedTile, setSelectedTile] = useState(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(() => MIN_MOVES + Math.floor(Math.random() * (MAX_MOVES - MIN_MOVES + 1)));
  const [gameState, setGameState] = useState('playing');
  const [isAnimating, setIsAnimating] = useState(false);
  const [levelTarget, setLevelTarget] = useState(() => {
    const rawTarget = BASE_TARGET + Math.floor(Math.random() * TARGET_VARIANCE);
    return Math.round(rawTarget / 100) * 100;
  });
  const [difficultyBonus, setDifficultyBonus] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const stored = localStorage.getItem('match3_highScore');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [combo, setCombo] = useState(0);
  const [lastCombo, setLastCombo] = useState(0);
  const [maxComboReached, setMaxComboReached] = useState(0);
  const [lastMilestoneShown, setLastMilestoneShown] = useState(0); // v8.9: Track combo milestones
  const [scorePopups, setScorePopups] = useState([]);
  const [showNoMoves, setShowNoMoves] = useState(false);
  const [pendingSpecials, setPendingSpecials] = useState([]);
  const [targetReached, setTargetReached] = useState(false);
  const [matchedTiles, setMatchedTiles] = useState([]);
  const dragStart = useRef(null); // v11 Fix 1: useRef so rapid touchmove events see cleared value synchronously
  const [turnComplete, setTurnComplete] = useState(true); // Track when turn scoring is fully settled
  // v10.5: Counter incremented each time a bonus move is awarded; used to key the header burst animation
  const [bonusMoveFlash, setBonusMoveFlash] = useState(0);
  
  // v8.10: Bonus Round state
  const [showBonusPrompt, setShowBonusPrompt] = useState(false);
  const [bonusRoundActive, setBonusRoundActive] = useState(false);
  const [bonusRoundScore, setBonusRoundScore] = useState(0); // Points earned in bonus round (before multiplier)
  const [preBonusScore, setPreBonusScore] = useState(0); // Score when bonus round started
  
  // v8.0: Dark/Light mode toggle (dark is default)
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // v8.3: Visual cascade effects (v8.5: removed screenShake)
  const [flashingTiles, setFlashingTiles] = useState([]); // Tiles with white flash effect
  const [glowingTiles, setGlowingTiles] = useState([]); // Tiles with border glow before activation
  const [chainTexts, setChainTexts] = useState([]); // "CHAIN!" text popups between specials
  
  // v9.6-tablet: Set-based lookups for O(1) tile state checks (instead of Array.some)
  const flashingTileSet = useMemo(() => new Set(flashingTiles.map(t => `${t.row}-${t.col}`)), [flashingTiles]);
  const glowingTileSet = useMemo(() => new Set(glowingTiles.map(t => `${t.row}-${t.col}`)), [glowingTiles]);
  const matchedTileSet = useMemo(() => new Set(matchedTiles.map(t => `${t.row}-${t.col}`)), [matchedTiles]);
  const pendingSpecialSet = useMemo(() => new Set(pendingSpecials.map(t => `${t.row}-${t.col}`)), [pendingSpecials]);
  
  // Persistent stats
  const [allTimeHighCombo, setAllTimeHighCombo] = useState(() => {
    const stored = localStorage.getItem('match3_highCombo');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [allTimeHighTurnScore, setAllTimeHighTurnScore] = useState(() => {
    const stored = localStorage.getItem('match3_highTurnScore');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [currentTurnScore, setCurrentTurnScore] = useState(0);
  const [specialBonusMultiplier, setSpecialBonusMultiplier] = useState(0);
  
  // Canvas ref
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const frameCountRef = useRef(0); // v9.7.1-tablet: Simple frame counter for 30fps
  // v10.2 Fix #3: Separate ref map for animation positions — avoids mutating React state objects
  // directly inside the rAF loop. Keyed by tile id.
  const animStateRef = useRef({});
  
  // v6.8: Ref to track latest score (avoids stale closure in game end check)
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // v10.2 Fix #1: Ref to track live combo value (avoids stale closure in fillEmptySpaces cascade)
  const comboRef = useRef(0);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  // v10.4: Track the highest 10k threshold already awarded so we don't double-award
  const bonusMoveThresholdRef = useRef(0);
  // v10.5.3: Holds burst count awarded while the bonus prompt banner is open,
  // so the animation fires after the banner is dismissed (not hidden behind it)
  const bonusMoveFlashPendingRef = useRef(0);
  const swapFiredRef = useRef(false); // v11 Fix 2: blocks phantom click after drag-swap
  
  // Board dimensions
  const boardWidth = COLS * TILE_SIZE + (COLS - 1) * TILE_GAP;
  const boardHeight = ROWS * TILE_SIZE + (ROWS - 1) * TILE_GAP;
  
  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem('match3_highCombo', allTimeHighCombo.toString());
  }, [allTimeHighCombo]);
  
  useEffect(() => {
    localStorage.setItem('match3_highTurnScore', allTimeHighTurnScore.toString());
  }, [allTimeHighTurnScore]);
  
  useEffect(() => {
    localStorage.setItem('match3_highScore', highScore.toString());
  }, [highScore]);
  
  // Update all-time stats when turn ends
  useEffect(() => {
    if (!isAnimating && gameState === 'playing') {
      if (maxComboReached > allTimeHighCombo) {
        setAllTimeHighCombo(maxComboReached);
      }
      if (currentTurnScore > allTimeHighTurnScore) {
        setAllTimeHighTurnScore(currentTurnScore);
      }
    }
  }, [isAnimating, gameState, maxComboReached, currentTurnScore, allTimeHighCombo, allTimeHighTurnScore]);
  
  // Check win condition
  useEffect(() => {
    if (score >= levelTarget && gameState === 'playing' && !targetReached) {
      setTargetReached(true);
    }
  }, [score, levelTarget, gameState, targetReached]);

  // v10.4/v10.5: Award +1 move for every 10,000 points crossed.
  // v10.5 Fix A: Also guard on turnComplete so the end-of-game specials score flush
  // (which can push past a threshold while moves===0) doesn't fire a spurious award
  // before gameState transitions. The game-end effect also defers when a pending
  // bonus move is detected (see below).
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (!turnComplete) return; // wait for scoring to settle
    const threshold = Math.floor(score / BONUS_MOVE_INTERVAL) * BONUS_MOVE_INTERVAL;
    if (threshold > 0 && threshold > bonusMoveThresholdRef.current) {
      const newMoves = Math.floor((threshold - bonusMoveThresholdRef.current) / BONUS_MOVE_INTERVAL);
      bonusMoveThresholdRef.current = threshold;
      setMoves(prev => prev + newMoves);
      // v10.5: Trigger animated burst at the Moves counter instead of a board popup
      // v10.5.3: If the bonus prompt banner is open, queue the burst for after it closes
      if (showBonusPrompt) {
        bonusMoveFlashPendingRef.current += newMoves;
      } else {
        setBonusMoveFlash(prev => prev + newMoves);
      }
    }
  }, [score, gameState, turnComplete]);
  
  // v8.10: Game end logic - Modified for bonus round
  // v9.8: Fixed to count unused specials toward target before deciding gameover
  useEffect(() => {
    // Don't check until turn is fully complete (all scoring settled)
    if (!turnComplete || isAnimating || combo > 0 || pendingSpecials.length > 0) return;
    if (gameState !== 'playing') return;
    if (showBonusPrompt) return; // Don't check while prompt is showing
    
    const checkTimer = setTimeout(() => {
      const currentScore = scoreRef.current;
      
      // v10.5 Fix A: If the current score has crossed a new bonus-move threshold that
      // hasn't been awarded yet, bail out — the bonus-move effect will fire first (it
      // depends on the same score state), increment moves, and re-trigger this effect.
      const pendingThreshold = Math.floor(currentScore / BONUS_MOVE_INTERVAL) * BONUS_MOVE_INTERVAL;
      if (pendingThreshold > bonusMoveThresholdRef.current) return;

      // v9.8: Calculate specials bonus FIRST, then check if we'd reach target with it
      const { bonus: specialsBonus } = calculateUnusedSpecialsBonus(grid);
      const scoreWithBonus = currentScore + specialsBonus;
      const hasReachedTarget = targetReached || scoreWithBonus >= levelTarget;
      
      console.log('Game end check:', { currentScore, specialsBonus, scoreWithBonus, levelTarget, hasReachedTarget, moves, targetReached, bonusRoundActive });
      
      // v8.10: If target reached with moves remaining and not in bonus round, show prompt
      if (hasReachedTarget && moves > 0 && !bonusRoundActive && !showBonusPrompt) {
        if (!targetReached) setTargetReached(true);
        setShowBonusPrompt(true);
        return;
      }
      
      // v8.10: If in bonus round and no moves left, end game (no move bonus)
      if (bonusRoundActive && moves <= 0) {
        setScore(prev => prev + specialsBonus);
        
        const difficultyIncrease = DIFFICULTY_INCREMENT_MIN + 
          Math.floor(Math.random() * (DIFFICULTY_INCREMENT_MAX - DIFFICULTY_INCREMENT_MIN + 1));
        setDifficultyBonus(prev => prev + difficultyIncrease);
        
        if (scoreWithBonus > highScore) setHighScore(scoreWithBonus);
        setGameState('won');
        return;
      }
      
      // v9.8: Target reached (including with specials bonus) with no moves = WIN
      if (hasReachedTarget && moves <= 0 && !bonusRoundActive) {
        setScore(prev => prev + specialsBonus);
        
        const difficultyIncrease = DIFFICULTY_INCREMENT_MIN + 
          Math.floor(Math.random() * (DIFFICULTY_INCREMENT_MAX - DIFFICULTY_INCREMENT_MIN + 1));
        setDifficultyBonus(prev => prev + difficultyIncrease);
        
        if (scoreWithBonus > highScore) setHighScore(scoreWithBonus);
        if (!targetReached) setTargetReached(true);
        
        setGameState('won');
        return;
      }
      
      // Game over: out of moves and didn't reach target (even with specials bonus)
      if (moves <= 0 && !hasReachedTarget) {
        setScore(prev => prev + specialsBonus);
        if (scoreWithBonus > highScore) setHighScore(scoreWithBonus);
        setDifficultyBonus(0);
        setGameState('gameover');
      }
    }, 150);
    
    return () => clearTimeout(checkTimer);
  }, [moves, gameState, levelTarget, highScore, isAnimating, combo, targetReached, pendingSpecials.length, grid, turnComplete, bonusRoundActive, showBonusPrompt]);
  
  // v8.10: Handle bonus round choice
  const startBonusRound = () => {
    setShowBonusPrompt(false);
    setBonusRoundActive(true);
    setPreBonusScore(score);
    setBonusRoundScore(0);
    // v10.5.3: Flush any burst queued while the banner was open
    if (bonusMoveFlashPendingRef.current > 0) {
      setBonusMoveFlash(prev => prev + bonusMoveFlashPendingRef.current);
      bonusMoveFlashPendingRef.current = 0;
    }
  };
  
  const endLevelEarly = () => {
    setShowBonusPrompt(false);
    // v10.5.3: Discard any queued burst — game is ending, no need to show it
    bonusMoveFlashPendingRef.current = 0;
    const moveBonus = moves * EARLY_END_BONUS_PER_MOVE;
    const { bonus: specialsBonus } = calculateUnusedSpecialsBonus(grid);
    const totalBonus = moveBonus + specialsBonus;
    
    setScore(prev => prev + totalBonus);
    
    const difficultyIncrease = DIFFICULTY_INCREMENT_MIN + 
      Math.floor(Math.random() * (DIFFICULTY_INCREMENT_MAX - DIFFICULTY_INCREMENT_MIN + 1));
    setDifficultyBonus(prev => prev + difficultyIncrease);
    
    // v10 Fix 4: Use scoreRef.current (not stale 'score' closure) for high score check
    if (scoreRef.current + totalBonus > highScore) setHighScore(scoreRef.current + totalBonus);
    setGameState('won');
  };
  
  // v9.6-tablet: Aggressive popup cleanup - check more frequently and limit total count
  useEffect(() => {
    if (scorePopups.length > 0) {
      const timer = setTimeout(() => {
        const now = Date.now();
        setScorePopups(prev => {
          // First filter by lifetime
          let filtered = prev.filter(popup => {
            const totalLifetime = popup.delay + popup.duration;
            const elapsed = now - popup.createdAt;
            return elapsed < totalLifetime;
          });
          // Hard limit: keep only most recent 8 popups to prevent buildup
          if (filtered.length > 8) {
            filtered = filtered.slice(-8);
          }
          return filtered;
        });
      }, 250); // v9.6-tablet: Check every 250ms (was 500ms)
      return () => clearTimeout(timer);
    }
  }, [scorePopups]);
  
  // v8.9: Combo milestone popups at 5, 10, 15
  useEffect(() => {
    const milestones = [5, 10, 15];
    for (const milestone of milestones) {
      if (combo >= milestone && lastMilestoneShown < milestone) {
        const message = milestone === 15 ? '💥 LEGENDARY COMBO!' :
                       milestone === 10 ? '⚡ ULTRA COMBO!' :
                       '🌟 MEGA COMBO!';
        // Show popup at center-top of board
        setScorePopups(prev => [...prev, {
          id: Date.now() + Math.random(),
          row: 1,
          col: 4,
          points: 0,
          text: message,
          delay: 0,
          duration: 3500,
          createdAt: Date.now()
        }]);
        setLastMilestoneShown(milestone);
        break; // Only show one milestone at a time
      }
    }
  }, [combo, lastMilestoneShown]);
  
  // Reset milestone tracking when combo resets
  useEffect(() => {
    if (combo === 0) {
      setLastMilestoneShown(0);
    }
  }, [combo]);
  
  // Animation failsafe
  // v10: Also restores setTurnComplete(true) so game-end check can fire after a stuck animation
  useEffect(() => {
    if (isAnimating) {
      const failsafe = setTimeout(() => {
        setIsAnimating(false);
        setPendingSpecials([]);
        setTurnComplete(true);
      }, 8000);
      return () => clearTimeout(failsafe);
    }
  }, [isAnimating]);
  
  // =============================================================================
  // v9.0: HELPER FUNCTIONS FOR SHUFFLE/NEW BOARD
  // =============================================================================
  
  // Count all special tiles on the board
  const countSpecialsOnBoard = useCallback(() => {
    let count = 0;
    grid.forEach(row => {
      row.forEach(tile => {
        if (tile?.special) count++;
      });
    });
    return count;
  }, [grid]);
  
  // =============================================================================
  // CANVAS RENDERING
  // =============================================================================
  
  const renderCanvas = useCallback(() => {
    // v9.7.1-tablet: Simple frame counter (more reliable than timestamps on tablet)
    frameCountRef.current++;
    if (frameCountRef.current % FRAME_SKIP !== 0) {
      // Skip this frame
      animationFrameRef.current = requestAnimationFrame(renderCanvas);
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR); // v9.5: Cap DPR
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Scale for retina displays
    ctx.save();
    ctx.scale(dpr, dpr);
    
    // v8.0: Draw background - dynamic dark/light mode
    const bgGradient = ctx.createLinearGradient(0, 0, boardWidth, boardHeight);
    if (isDarkMode) {
      bgGradient.addColorStop(0, '#1a1a2e');
      bgGradient.addColorStop(1, '#16213e');
    } else {
      bgGradient.addColorStop(0, '#f5f7fa');
      bgGradient.addColorStop(1, '#c3cfe2');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, boardWidth, boardHeight);
    
    // Draw tiles
    grid.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (!tile) return;
        
        // v9.6-tablet: Use Set-based O(1) lookups instead of Array.some()
        const tileKey = `${rowIndex}-${colIndex}`;
        const isSelected = selectedTile?.row === rowIndex && selectedTile?.col === colIndex;
        const isMatched = matchedTileSet.has(tileKey);
        const isPending = pendingSpecialSet.has(tileKey);
        const isGlowing = glowingTileSet.has(tileKey);
        const isFlashing = flashingTileSet.has(tileKey);
        
        // Calculate animated position
        const targetX = colIndex * (TILE_SIZE + TILE_GAP);
        const targetY = rowIndex * (TILE_SIZE + TILE_GAP);

        // v10.2 Fix #3: Use animStateRef instead of mutating tile objects directly.
        // Seed from tile.animX/animY on first encounter (set during grid construction).
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
        const drawX = anim.x;
        const drawY = anim.y;
        
        // Calculate scale for matched tiles
        let scale = 1;
        let opacity = 1;
        if (isMatched) {
          scale = 1.1;
          opacity = 0.7;
        } else if (isSelected) {
          scale = 1.1;
        } else if (isPending) {
          scale = 1.05;
        }
        
        // Draw the tile
        drawTile(ctx, drawX, drawY, TILE_SIZE, tile.type, {
          isSelected,
          isMatched,
          isSpecial: tile.special !== null,
          isPending,
          opacity,
          scale
        });
        
        // v8.3: Draw glow effect (pulsing border before activation)
        if (isGlowing) {
          ctx.save();
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 15;
          ctx.strokeRect(drawX - 2, drawY - 2, TILE_SIZE + 4, TILE_SIZE + 4);
          ctx.restore();
        }
        
        // v8.3: Draw flash effect (white overlay during activation)
        if (isFlashing) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
          ctx.restore();
        }
        
        // Draw special icon if applicable
        if (tile.special) {
          drawSpecialIcon(ctx, drawX, drawY, TILE_SIZE, tile.special);
        }
      });
    });
    
    ctx.restore();
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
  }, [grid, selectedTile, matchedTileSet, pendingSpecialSet, boardWidth, boardHeight, flashingTileSet, glowingTileSet, isDarkMode]);
  
  // v10.2 Fix #3: Prune animStateRef entries for tiles no longer on the board
  useEffect(() => {
    const liveIds = new Set();
    grid.forEach(row => row.forEach(tile => { if (tile?.id) liveIds.add(tile.id); }));
    Object.keys(animStateRef.current).forEach(id => {
      if (!liveIds.has(id)) delete animStateRef.current[id];
    });
  }, [grid]);

  // Start/stop animation loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderCanvas]);
  
  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR); // v9.5: Cap DPR
    canvas.width = boardWidth * dpr;
    canvas.height = boardHeight * dpr;
    canvas.style.width = `${boardWidth}px`;
    canvas.style.height = `${boardHeight}px`;
  }, [boardWidth, boardHeight]);
  
  // =============================================================================
  // INPUT HANDLING
  // =============================================================================
  
  const handleCanvasClick = (e) => {
    // v10.2 Fix #9: Touch events are handled by handleDragStart/End. The browser also
    // fires a synthetic 'click' after touchend, which would double-process the tap.
    // Bail out here if this click was synthesized from a touch sequence.
    if (swapFiredRef.current || e.detail === 0) return; // v11 Fix 2: block phantom click after drag-swap
    if (isAnimating || gameState !== 'playing') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / (TILE_SIZE + TILE_GAP));
    const row = Math.floor(y / (TILE_SIZE + TILE_GAP));
    
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    
    handleTileClick(row, col);
  };
  
  // Drag/Swipe handlers for touch and mouse
  const getEventCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
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
    const dx = x - dragStart.current.x;
    const dy = y - dragStart.current.y;
    const threshold = TILE_SIZE * 0.4; // 40% of tile size

    let targetRow = dragStart.current.row;
    let targetCol = dragStart.current.col;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) targetCol = dragStart.current.col + 1;
      else if (dx < -threshold) targetCol = dragStart.current.col - 1;
    } else {
      if (dy > threshold) targetRow = dragStart.current.row + 1;
      else if (dy < -threshold) targetRow = dragStart.current.row - 1;
    }

    if ((targetRow !== dragStart.current.row || targetCol !== dragStart.current.col) &&
        targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) {
      // v11 Fix 1: capture values before nulling ref, so subsequent touchmove events
      // see dragStart.current === null immediately and skip re-entering this branch
      const { row: startRow, col: startCol } = dragStart.current;
      dragStart.current = null;
      // v11 Fix 2: flag the pending synthetic click so handleCanvasClick ignores it
      swapFiredRef.current = true;
      setTimeout(() => { swapFiredRef.current = false; }, 300);
      setSelectedTile(null);
      attemptSwap(startRow, startCol, targetRow, targetCol);
    }
  };
  
  const handleDragEnd = () => {
    // v10.3 Fix F: If dragStart is still set here, no swap was triggered (tap without drag).
    // Clear selectedTile so it doesn't linger and cause an unintended swap on the next tap.
    if (dragStart.current) setSelectedTile(null);
    dragStart.current = null;
  };
  
  const handleTileClick = (row, col) => {
    if (isAnimating || gameState !== 'playing') return;
    
    if (!selectedTile) {
      setSelectedTile({ row, col });
      return;
    }
    
    const rowDiff = Math.abs(selectedTile.row - row);
    const colDiff = Math.abs(selectedTile.col - col);
    
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      attemptSwap(selectedTile.row, selectedTile.col, row, col);
    } else {
      setSelectedTile({ row, col });
    }
  };
  
  const attemptSwap = (row1, col1, row2, col2) => {
    setIsAnimating(true);
    setSelectedTile(null);
    setCurrentTurnScore(0);
    setTurnComplete(false); // v6.7: Mark turn as in-progress
    
    const newGrid = grid.map(r => r.map(t => t ? { ...t } : null));
    
    // Check if BOTH tiles are special BEFORE swapping
    const tile1Special = newGrid[row1][col1]?.special;
    const tile2Special = newGrid[row2][col2]?.special;
    
    // Perform the swap
    [newGrid[row1][col1], newGrid[row2][col2]] = [newGrid[row2][col2], newGrid[row1][col1]];
    setGrid(newGrid);
    
    // If BOTH tiles are special, activate special combination!
    if (tile1Special && tile2Special) {
      setMoves(prev => prev - 1); // Costs a move
      setTimeout(() => {
        activateSpecialCombination(row1, col1, row2, col2, tile1Special, tile2Special, newGrid);
      }, 300);
      return;
    }
    
    setTimeout(() => {
      const { matches, matchGroups, lShapeMatches, connectedGroups } = findMatches(newGrid);
      
      if (matches.length > 0) {
        setMoves(prev => prev - 1);
        const comboIncrease = matchGroups.length + (lShapeMatches?.length || 0);
        setCombo(comboIncrease);
        setMaxComboReached(current => Math.max(current, comboIncrease));
        // v8.4: Pass swap positions for special creation
        processMatches(newGrid, matchGroups, lShapeMatches, comboIncrease, 0, connectedGroups, { row: row2, col: col2 });
      } else {
        // Swap back - invalid move, turn is complete
        const revertGrid = newGrid.map(r => r.map(t => t ? { ...t } : null));
        [revertGrid[row1][col1], revertGrid[row2][col2]] = [revertGrid[row2][col2], revertGrid[row1][col1]];
        setGrid(revertGrid);
        setIsAnimating(false);
        setTurnComplete(true); // No valid move, turn complete
      }
    }, 300);
  };
  
  // =============================================================================
  // MATCH FINDING AND PROCESSING
  // =============================================================================
  
  const findMatches = (currentGrid) => {
    const matches = [];
    const matchGroups = [];
    const visited = new Set();
    
    // Find horizontal matches
    for (let row = 0; row < ROWS; row++) {
      let col = 0;
      while (col < COLS) {
        const tile = currentGrid[row][col];
        if (!tile) { col++; continue; }
        
        let matchLength = 1;
        while (col + matchLength < COLS && 
               currentGrid[row][col + matchLength]?.type === tile.type) {
          matchLength++;
        }
        
        if (matchLength >= 3) {
          const tiles = [];
          for (let i = 0; i < matchLength; i++) {
            tiles.push({ row, col: col + i });
            matches.push({ row, col: col + i });
            visited.add(`${row}-${col + i}`);
          }
          matchGroups.push({ tiles, length: matchLength, direction: 'horizontal', tileType: tile.type });
        }
        col += matchLength;
      }
    }
    
    // Find vertical matches
    for (let col = 0; col < COLS; col++) {
      let row = 0;
      while (row < ROWS) {
        const tile = currentGrid[row][col];
        if (!tile) { row++; continue; }
        
        let matchLength = 1;
        while (row + matchLength < ROWS && 
               currentGrid[row + matchLength][col]?.type === tile.type) {
          matchLength++;
        }
        
        if (matchLength >= 3) {
          const tiles = [];
          for (let i = 0; i < matchLength; i++) {
            tiles.push({ row: row + i, col });
            if (!visited.has(`${row + i}-${col}`)) {
              matches.push({ row: row + i, col });
            }
          }
          matchGroups.push({ tiles, length: matchLength, direction: 'vertical', tileType: tile.type });
        }
        row += matchLength;
      }
    }
    
    // Find L-shapes (intersections of horizontal and vertical matches)
    const lShapeMatches = [];
    for (let i = 0; i < matchGroups.length; i++) {
      for (let j = i + 1; j < matchGroups.length; j++) {
        if (matchGroups[i].direction !== matchGroups[j].direction &&
            matchGroups[i].tileType === matchGroups[j].tileType) {
          const intersection = matchGroups[i].tiles.find(t1 => 
            matchGroups[j].tiles.some(t2 => t1.row === t2.row && t1.col === t2.col)
          );
          if (intersection) {
            const tileType = currentGrid[intersection.row][intersection.col]?.type;
            lShapeMatches.push({ ...intersection, tileType });
          }
        }
      }
    }
    
    // OPTION B: Find connected match groups (same tile type, sharing tiles)
    // This determines total unique tiles for supernova/hypernova creation
    const connectedGroups = [];
    const groupUsed = new Array(matchGroups.length).fill(false);
    
    for (let i = 0; i < matchGroups.length; i++) {
      if (groupUsed[i]) continue;
      
      // Start a new connected group
      const connectedTiles = new Set();
      const connectedGroupIndices = [i];
      const tileType = matchGroups[i].tileType;
      
      // Add all tiles from this group
      matchGroups[i].tiles.forEach(t => connectedTiles.add(`${t.row}-${t.col}`));
      groupUsed[i] = true;
      
      // Find all groups that connect to this one (same type, share a tile)
      let foundNew = true;
      while (foundNew) {
        foundNew = false;
        for (let j = 0; j < matchGroups.length; j++) {
          if (groupUsed[j] || matchGroups[j].tileType !== tileType) continue;
          
          // Check if this group shares any tile with our connected group
          const shares = matchGroups[j].tiles.some(t => connectedTiles.has(`${t.row}-${t.col}`));
          if (shares) {
            matchGroups[j].tiles.forEach(t => connectedTiles.add(`${t.row}-${t.col}`));
            connectedGroupIndices.push(j);
            groupUsed[j] = true;
            foundNew = true;
          }
        }
      }
      
      // Convert Set back to array of tile objects
      const tilesArray = Array.from(connectedTiles).map(key => {
        const [row, col] = key.split('-').map(Number);
        return { row, col };
      });
      
      connectedGroups.push({
        tiles: tilesArray,
        totalUniqueTiles: tilesArray.length,
        tileType,
        groupIndices: connectedGroupIndices
      });
    }
    
    return { matches, matchGroups, lShapeMatches, connectedGroups };
  };
  
  // v8.4: Added swapPosition parameter for special creation at swap location
  const processMatches = (currentGrid, matchGroups, lShapeMatches, currentCombo, generation = 0, connectedGroups = [], swapPosition = null) => {
    setMatchedTiles(matchGroups.flatMap(g => g.tiles));
    
    // Calculate score
    let totalPoints = 0;
    const multiplier = getMultiplier(currentCombo);
    
    matchGroups.forEach(group => {
      const basePoints = group.length * 10;
      totalPoints += Math.floor(basePoints * multiplier);
    });
    
    // Bonus for L-shapes
    if (lShapeMatches && lShapeMatches.length > 0) {
      totalPoints += lShapeMatches.length * 50;
    }
    
    // v8.10: Apply bonus round multiplier
    const finalPoints = bonusRoundActive ? Math.floor(totalPoints * BONUS_ROUND_MULTIPLIER) : totalPoints;
    setScore(prev => prev + finalPoints);
    setCurrentTurnScore(prev => prev + finalPoints);
    if (bonusRoundActive) {
      setBonusRoundScore(prev => prev + finalPoints);
    }
    
    // Add popup
    if (matchGroups.length > 0) {
      const firstMatch = matchGroups[0].tiles[0];
      addScorePopup(firstMatch.row, firstMatch.col, finalPoints);
    }
    
    // Remove matches and create specials
    setTimeout(() => {
      removeMatches(currentGrid, matchGroups, lShapeMatches, generation, connectedGroups, swapPosition);
    }, 400);
  };
  
  // Activate a special tile's effect
  const activateSpecialTile = (row, col, currentGrid, alreadyCleared = new Set()) => {
    const tile = currentGrid[row]?.[col];
    if (!tile || !tile.special) return { tilesToClear: [], points: 0, message: '', chainedSpecials: [] };
    
    const tilesToClear = [];
    const chainedSpecials = [];
    let points = 0;
    let message = '';
    const posKey = `${row}-${col}`;
    
    if (alreadyCleared.has(posKey)) return { tilesToClear: [], points: 0, message: '', chainedSpecials: [] };
    alreadyCleared.add(posKey);
    
    if (tile.special === 'line') {
      // Clear entire row
      for (let c = 0; c < COLS; c++) {
        if (currentGrid[row][c]) {
          tilesToClear.push({ row, col: c });
          if (currentGrid[row][c].special && c !== col && !alreadyCleared.has(`${row}-${c}`)) {
            chainedSpecials.push({ row, col: c, type: currentGrid[row][c].special });
          }
        }
      }
      points = tilesToClear.length * 30;
      message = `⚡ LINE CLEAR! +${points}`;
    } else if (tile.special === 'bomb') {
      // v10.1: 3×3 area + full row + full column, flat 750 pts
      // Specials in row/col arms also chain
      const addedKeys = new Set();
      const addTile = (r, c) => {
        const k = `${r}-${c}`;
        if (!addedKeys.has(k) && currentGrid[r]?.[c]) {
          addedKeys.add(k);
          tilesToClear.push({ row: r, col: c });
          if (currentGrid[r][c].special && !(r === row && c === col) && !alreadyCleared.has(k)) {
            chainedSpecials.push({ row: r, col: c, type: currentGrid[r][c].special });
          }
        }
      };
      // 3×3 area
      for (let r = Math.max(0, row - 1); r <= Math.min(ROWS - 1, row + 1); r++)
        for (let c = Math.max(0, col - 1); c <= Math.min(COLS - 1, col + 1); c++)
          addTile(r, c);
      // Full row
      for (let c = 0; c < COLS; c++) addTile(row, c);
      // Full column
      for (let r = 0; r < ROWS; r++) addTile(r, col);
      points = 750;
      message = `💣 BOOM! +${points}`;
    } else if (tile.special === 'cross') {
      // Clear entire row AND column
      for (let c = 0; c < COLS; c++) {
        if (currentGrid[row][c]) {
          tilesToClear.push({ row, col: c });
          if (currentGrid[row][c].special && c !== col && !alreadyCleared.has(`${row}-${c}`)) {
            chainedSpecials.push({ row, col: c, type: currentGrid[row][c].special });
          }
        }
      }
      for (let r = 0; r < ROWS; r++) {
        if (r !== row && currentGrid[r][col]) {
          tilesToClear.push({ row: r, col });
          if (currentGrid[r][col].special && !alreadyCleared.has(`${r}-${col}`)) {
            chainedSpecials.push({ row: r, col, type: currentGrid[r][col].special });
          }
        }
      }
      points = tilesToClear.length * 38;
      message = `✨ CROSS BLAST! +${points}`;
    } else if (tile.special === 'supernova') {
      // v10.1: 5×5 area + full row + full column, flat 2000 pts
      const addedKeys = new Set();
      const addTile = (r, c) => {
        const k = `${r}-${c}`;
        if (!addedKeys.has(k) && currentGrid[r]?.[c]) {
          addedKeys.add(k);
          tilesToClear.push({ row: r, col: c });
          if (currentGrid[r][c].special && !(r === row && c === col) && !alreadyCleared.has(k)) {
            chainedSpecials.push({ row: r, col: c, type: currentGrid[r][c].special });
          }
        }
      };
      // 5×5 area
      for (let r = Math.max(0, row - 2); r <= Math.min(ROWS - 1, row + 2); r++)
        for (let c = Math.max(0, col - 2); c <= Math.min(COLS - 1, col + 2); c++)
          addTile(r, c);
      // Full row
      for (let c = 0; c < COLS; c++) addTile(row, c);
      // Full column
      for (let r = 0; r < ROWS; r++) addTile(r, col);
      points = 2000;
      message = `🌌 SUPERNOVA! +${points}`;
    } else if (tile.special === 'hypernova') {
      // v10.1: 5×5 + row + col (same as supernova footprint), then random 50% of
      // remaining regular tiles. Specials are NEVER removed. Min 30 tiles cleared.
      const addedKeys = new Set();
      // Phase 1: supernova-equivalent footprint (skipping specials)
      const addRegular = (r, c) => {
        const k = `${r}-${c}`;
        if (!addedKeys.has(k) && currentGrid[r]?.[c] && !currentGrid[r][c].special) {
          addedKeys.add(k);
          tilesToClear.push({ row: r, col: c });
        }
      };
      for (let r = Math.max(0, row - 2); r <= Math.min(ROWS - 1, row + 2); r++)
        for (let c = Math.max(0, col - 2); c <= Math.min(COLS - 1, col + 2); c++)
          addRegular(r, c);
      for (let c = 0; c < COLS; c++) addRegular(row, c);
      for (let r = 0; r < ROWS; r++) addRegular(r, col);
      // Phase 2: collect remaining regular tiles (outside footprint, not specials)
      const remaining = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const k = `${r}-${c}`;
          if (!addedKeys.has(k) && currentGrid[r]?.[c] && !currentGrid[r][c].special) {
            remaining.push({ row: r, col: c });
          }
        }
      }
      // Fisher-Yates shuffle then take half
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      const halfCount = Math.ceil(remaining.length / 2);
      remaining.slice(0, halfCount).forEach(t => {
        tilesToClear.push(t);
        addedKeys.add(`${t.row}-${t.col}`);
      });
      // Minimum 30 tiles guarantee — pull more from remaining if needed
      const minTiles = 30;
      if (tilesToClear.length < minTiles) {
        const extra = remaining.slice(halfCount);
        for (let i = 0; i < extra.length && tilesToClear.length < minTiles; i++) {
          tilesToClear.push(extra[i]);
        }
      }
      // No chainedSpecials — hypernova never touches specials
      points = 5000;
      message = `🌠 HYPERNOVA!!! +${points}`;
    }
    
    return { tilesToClear, points, message, chainedSpecials };
  };
  
  // Activate enhanced effects when two special tiles are swapped together
  const activateSpecialCombination = (row1, col1, row2, col2, type1, type2, currentGrid) => {
    setIsAnimating(true);
    
    const tilesToRemove = [];
    let points = 0;
    let message = '';
    
    // Sort types for consistent comparison
    const combo = [type1, type2].sort().join('+');
    
    // v8.4: Use row2, col2 (swap destination) as the center for effects and popup
    // This is where the player dragged TO, which feels like where the "collision" happens
    const effectRow = row2;
    const effectCol = col2;
    
    if (combo === 'line+line') {
      // Clear entire row AND column (cross effect) - centered on swap destination
      for (let c = 0; c < COLS; c++) {
        if (currentGrid[effectRow][c]) tilesToRemove.push({ row: effectRow, col: c });
      }
      for (let r = 0; r < ROWS; r++) {
        if (currentGrid[r][effectCol] && r !== effectRow) tilesToRemove.push({ row: r, col: effectCol });
      }
      points = 700;
      message = '⚡⚡ DOUBLE LINE! +700';
    } else if (combo === 'bomb+bomb') {
      // v10.1: 7×7 area + row + col, 1500 pts
      const seen2 = new Set();
      const add = (r, c) => {
        const k = `${r}-${c}`;
        if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); }
      };
      for (let r = Math.max(0, effectRow - 3); r <= Math.min(ROWS - 1, effectRow + 3); r++)
        for (let c = Math.max(0, effectCol - 3); c <= Math.min(COLS - 1, effectCol + 3); c++)
          add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c);
      for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 1500;
      message = '💣💣 MEGA BLAST! +1500';
    } else if (combo === 'cross+cross') {
      // Clear 3 rows + 3 columns centered on swap
      for (let r = Math.max(0, effectRow - 1); r <= Math.min(ROWS - 1, effectRow + 1); r++) {
        for (let c = 0; c < COLS; c++) {
          if (currentGrid[r][c]) tilesToRemove.push({ row: r, col: c });
        }
      }
      for (let r = 0; r < ROWS; r++) {
        for (let c = Math.max(0, effectCol - 1); c <= Math.min(COLS - 1, effectCol + 1); c++) {
          if (currentGrid[r][c] && !tilesToRemove.some(t => t.row === r && t.col === c)) {
            tilesToRemove.push({ row: r, col: c });
          }
        }
      }
      points = 850;
      message = '✨✨ DOUBLE CROSS! +850';
    } else if (combo === 'bomb+line') {
      // v10.1: 3 rows + 3×3 + row + col, 1200 pts
      const seen2 = new Set();
      const add = (r, c) => {
        const k = `${r}-${c}`;
        if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); }
      };
      for (let r = Math.max(0, effectRow - 1); r <= Math.min(ROWS - 1, effectRow + 1); r++)
        for (let c = 0; c < COLS; c++) add(r, c);
      for (let r = Math.max(0, effectRow - 1); r <= Math.min(ROWS - 1, effectRow + 1); r++)
        for (let c = Math.max(0, effectCol - 1); c <= Math.min(COLS - 1, effectCol + 1); c++)
          add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c);
      for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 1200;
      message = '💣⚡ LINE BOMB! +1200';
    } else if (combo === 'cross+line') {
      // v7.2: Clear 2 rows + 2 columns
      for (let r = Math.max(0, effectRow); r <= Math.min(ROWS - 1, effectRow + 1); r++) {
        for (let c = 0; c < COLS; c++) {
          if (currentGrid[r][c]) tilesToRemove.push({ row: r, col: c });
        }
      }
      for (let r = 0; r < ROWS; r++) {
        for (let c = Math.max(0, effectCol); c <= Math.min(COLS - 1, effectCol + 1); c++) {
          if (currentGrid[r][c] && !tilesToRemove.some(t => t.row === r && t.col === c)) {
            tilesToRemove.push({ row: r, col: c });
          }
        }
      }
      points = 800;
      message = '✨⚡ CROSS LINE! +800';
    } else if (combo === 'bomb+cross') {
      // v10.1: 7×7 + row + col, 1400 pts
      const seen2 = new Set();
      const add = (r, c) => {
        const k = `${r}-${c}`;
        if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); }
      };
      for (let r = Math.max(0, effectRow - 3); r <= Math.min(ROWS - 1, effectRow + 3); r++)
        for (let c = Math.max(0, effectCol - 3); c <= Math.min(COLS - 1, effectCol + 3); c++)
          add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c);
      for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 1400;
      message = '💣✨ CROSS BOMB! +1400';
    } else if (combo === 'supernova+supernova') {
      // v10.1: Clear all regular tiles, specials survive, 6000 pts
      // v10.5 Fix B: Also explicitly remove the two swapped tiles (they are specials,
      // so the !special filter would leave them on the board otherwise)
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (currentGrid[r][c] && !currentGrid[r][c].special) tilesToRemove.push({ row: r, col: c });
      tilesToRemove.push({ row: row1, col: col1 });
      tilesToRemove.push({ row: row2, col: col2 });
      points = 6000;
      message = '🌌🌌 DUAL SUPERNOVA! +6000';
    } else if (combo === 'hypernova+hypernova') {
      // v10.1: Clear all regular tiles, specials survive, 10000 pts
      // v10.5 Fix B: Explicitly remove the two swapped hypernovas
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (currentGrid[r][c] && !currentGrid[r][c].special) tilesToRemove.push({ row: r, col: c });
      tilesToRemove.push({ row: row1, col: col1 });
      tilesToRemove.push({ row: row2, col: col2 });
      points = 10000;
      message = '🌠🌠 DUAL HYPERNOVA!!! +10000';
    } else if (combo === 'hypernova+supernova') {
      // v10.1: Clear all regular tiles, specials survive, 8000 pts
      // v10.5 Fix B: Explicitly remove the two swapped tiles
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (currentGrid[r][c] && !currentGrid[r][c].special) tilesToRemove.push({ row: r, col: c });
      tilesToRemove.push({ row: row1, col: col1 });
      tilesToRemove.push({ row: row2, col: col2 });
      points = 8000;
      message = '🌠🌌 NOVA FUSION! +8000';
    } else if (combo === 'bomb+supernova' || combo === 'cross+supernova' || combo === 'line+supernova') {
      // v10.1: 7×7 + row + col, 3500 pts
      const seen2 = new Set();
      const add = (r, c) => {
        const k = `${r}-${c}`;
        if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); }
      };
      for (let r = Math.max(0, effectRow - 3); r <= Math.min(ROWS - 1, effectRow + 3); r++)
        for (let c = Math.max(0, effectCol - 3); c <= Math.min(COLS - 1, effectCol + 3); c++)
          add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c);
      for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 3500;
      const icon1 = type1 === 'supernova' ? '🌌' : (type1 === 'line' ? '⚡' : type1 === 'bomb' ? '💣' : '✨');
      const icon2 = type2 === 'supernova' ? '🌌' : (type2 === 'line' ? '⚡' : type2 === 'bomb' ? '💣' : '✨');
      message = `${icon1}${icon2} SUPERNOVA COMBO! +3500`;
    } else if (combo === 'bomb+hypernova' || combo === 'cross+hypernova' || combo === 'hypernova+line') {
      // v10.1: Clear all regular tiles, specials survive, 6000 pts
      // v10.5 Fix B: Explicitly remove the two swapped tiles
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (currentGrid[r][c] && !currentGrid[r][c].special) tilesToRemove.push({ row: r, col: c });
      tilesToRemove.push({ row: row1, col: col1 });
      tilesToRemove.push({ row: row2, col: col2 });
      points = 6000;
      const icon1 = type1 === 'hypernova' ? '🌠' : (type1 === 'line' ? '⚡' : type1 === 'bomb' ? '💣' : '✨');
      const icon2 = type2 === 'hypernova' ? '🌠' : (type2 === 'line' ? '⚡' : type2 === 'bomb' ? '💣' : '✨');
      message = `${icon1}${icon2} HYPERNOVA COMBO! +6000`;
    } else {
      // v9.8: Fallback - if combo not recognized, activate both specials individually
      // This ensures no special combination goes unhandled
      console.log('Unrecognized combo:', combo, '- activating both specials individually');
      
      // Activate first special
      const result1 = activateSpecialTile(row1, col1, currentGrid, new Set());
      result1.tilesToClear.forEach(t => tilesToRemove.push(t));
      
      // Activate second special (using same alreadyCleared set to avoid double-counting)
      const cleared = new Set(result1.tilesToClear.map(t => `${t.row}-${t.col}`));
      const result2 = activateSpecialTile(row2, col2, currentGrid, cleared);
      result2.tilesToClear.forEach(t => {
        if (!cleared.has(`${t.row}-${t.col}`)) {
          tilesToRemove.push(t);
        }
      });
      
      points = result1.points + result2.points;
      message = `${result1.message} + ${result2.message}`;
    }
    
    // Remove duplicates
    const uniqueTiles = [];
    const seen = new Set();
    tilesToRemove.forEach(tile => {
      const key = `${tile.row}-${tile.col}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTiles.push(tile);
      }
    });
    
    // v8.5: Check for specials in cleared tiles (cascade detection)
    // v8.12: Fixed - don't add to processedSpecials here, only during actual processing
    const chainedSpecials = [];
    const processedSpecials = new Set();
    const seenChained = new Set(); // v8.12: Prevent duplicate entries
    
    uniqueTiles.forEach(({ row, col }) => {
      const tile = currentGrid[row]?.[col];
      // Exclude the two tiles that were swapped (they triggered the combo)
      const isSwappedTile = (row === row1 && col === col1) || (row === row2 && col === col2);
      const posKey = `${row}-${col}`;
      if (tile?.special && !isSwappedTile && !seenChained.has(posKey)) {
        chainedSpecials.push({ row, col, type: tile.special });
        seenChained.add(posKey);
      }
    });
    
    // v8.5: Cascade multiplier helpers (same as in removeMatches)
    const getCascadeMultiplier = (depth) => {
      if (depth <= 1) return 1.0;
      if (depth === 2) return 1.5;
      if (depth === 3) return 2.0;
      if (depth === 4) return 2.5;
      return 3.0;
    };
    
    const getCascadeDelay = (depth) => {
      if (depth <= 1) return 0;
      return (depth - 1) * 400;
    };
    
    // v8.9: 40% longer popup durations
    const getCascadeDuration = (depth) => {
      if (depth <= 1) return 2800;  // was 2000
      if (depth === 2) return 3500; // was 2500
      return 4200;                  // was 3000
    };
    
    // v8.5: Process chained specials with cascade effects
    let cascadePoints = 0;
    const allClearedTiles = new Set(uniqueTiles.map(t => `${t.row}-${t.col}`));
    
    const processChainedSpecial = (special, depth, sourceRow, sourceCol) => {
      // v8.9: Fixed - always skip already-processed specials (was only checking depth > 2)
      if (processedSpecials.has(`${special.row}-${special.col}`)) return;
      
      // Trigger visual effects
      const effectDelay = getCascadeDelay(depth);
      
      // Glow effect
      setTimeout(() => {
        setGlowingTiles(prev => [...prev, { row: special.row, col: special.col, id: Date.now() }]);
        setTimeout(() => {
          setGlowingTiles(prev => prev.filter(t => !(t.row === special.row && t.col === special.col)));
        }, 200);
      }, Math.max(0, effectDelay - 100));
      
      // Flash effect
      setTimeout(() => {
        setFlashingTiles(prev => [...prev, { row: special.row, col: special.col, id: Date.now() }]);
        setTimeout(() => {
          setFlashingTiles(prev => prev.filter(t => !(t.row === special.row && t.col === special.col)));
        }, 100);
      }, effectDelay);
      
      // Chain text
      const midRow = (sourceRow + special.row) / 2;
      const midCol = (sourceCol + special.col) / 2;
      setTimeout(() => {
        setChainTexts(prev => [...prev, {
          id: Date.now() + Math.random(),
          row: midRow,
          col: midCol,
          depth: depth
        }]);
        setTimeout(() => {
          setChainTexts(prev => prev.slice(1));
        }, 800);
      }, effectDelay - 50);
      
      // Activate the special and get its cleared tiles
      const result = activateSpecialTile(special.row, special.col, currentGrid, processedSpecials);
      const cascadeMultiplier = getCascadeMultiplier(depth);
      const multipliedPoints = Math.floor(result.points * cascadeMultiplier);
      
      cascadePoints += multipliedPoints;
      
      // Add cascade popup - v8.6: Position at top rows based on depth
      if (result.message) {
        const cascadeMessage = `🔥 CASCADE x${cascadeMultiplier.toFixed(1)}! ${result.message.split('!')[0]}! +${multipliedPoints}`;
        // v8.6: Depth 2 → row 0, Depth 3 → row 1, Depth 4+ → row 2
        const popupRow = Math.min(depth - 2, 2);
        addScorePopup(popupRow, special.col, multipliedPoints, cascadeMessage, effectDelay, getCascadeDuration(depth));
      }
      
      // Add tiles to clear and check for more chained specials
      result.tilesToClear.forEach(t => {
        allClearedTiles.add(`${t.row}-${t.col}`);
        if (!uniqueTiles.some(u => u.row === t.row && u.col === t.col)) {
          uniqueTiles.push(t);
        }
      });
      
      // v10.3 Fix E: Mark as processed BEFORE recursing so a looping chain (two specials
      // in each other's blast radius) is caught on first re-entry, not second.
      processedSpecials.add(`${special.row}-${special.col}`);
      
      // Recursively process any chained specials from this activation
      result.chainedSpecials.forEach(chained => {
        if (!processedSpecials.has(`${chained.row}-${chained.col}`)) {
          processChainedSpecial(chained, depth + 1, special.row, special.col);
        }
      });
    };
    
    // Process initial chained specials at depth 2 (combo is depth 1)
    chainedSpecials.forEach((special, index) => {
      processChainedSpecial(special, 2, effectRow, effectCol);
    });
    
    // v8.10: Apply bonus round multiplier
    const totalComboPoints = points + cascadePoints;
    const finalComboPoints = bonusRoundActive ? Math.floor(totalComboPoints * BONUS_ROUND_MULTIPLIER) : totalComboPoints;
    
    // v8.4: Award points and show popup at swap destination
    addScorePopup(effectRow, effectCol, finalComboPoints, message);
    setScore(prev => prev + finalComboPoints);
    setCurrentTurnScore(prev => prev + finalComboPoints);
    if (bonusRoundActive) {
      setBonusRoundScore(prev => prev + finalComboPoints);
    }
    setMatchedTiles(uniqueTiles);
    
    // Remove tiles and apply gravity
    setTimeout(() => {
      const newGrid = currentGrid.map(r => r.map(t => t ? { ...t } : null));
      uniqueTiles.forEach(({ row, col }) => { newGrid[row][col] = null; });
      setGrid(newGrid);
      setMatchedTiles([]);
      
      setTimeout(() => applyGravity(newGrid, 0), 400);
    }, 400);
  };
  
  // v8.4: Added swapPosition parameter for special creation at swap location
  const removeMatches = (currentGrid, matchGroups, lShapeMatches, generation, connectedGroups = [], swapPosition = null) => {
    const newGrid = currentGrid.map(r => r.map(t => t ? { ...t } : null));
    const specialsToCreate = [];
    const claimedPositions = new Set();
    
    // Collect all tiles being cleared and check for specials
    const allTilesToClear = new Set();
    const specialsToActivate = [];
    const matchedSpecials = new Set(); // v8.3.2: Specials that were directly matched
    const processedSpecials = new Set(); // v8.3.2: Specials that have had popups shown
    
    // First pass: identify all matched tiles and any specials in them
    matchGroups.forEach(group => {
      group.tiles.forEach(({ row, col }) => {
        allTilesToClear.add(`${row}-${col}`);
        const tile = currentGrid[row]?.[col];
        if (tile?.special && !matchedSpecials.has(`${row}-${col}`)) {
          specialsToActivate.push({ row, col, type: tile.special });
          matchedSpecials.add(`${row}-${col}`);
        }
      });
    });
    
    // v8.1: Cascade Multiplier helper
    const getCascadeMultiplier = (cascadeDepth) => {
      if (cascadeDepth <= 1) return 1.0;
      if (cascadeDepth === 2) return 1.5;
      if (cascadeDepth === 3) return 2.0;
      if (cascadeDepth === 4) return 2.5;
      return 3.0; // Cap at 3x for depth 5+
    };
    
    // v8.3.2: Increased cascade delays for better visibility
    const getCascadeDelay = (depth) => {
      if (depth <= 1) return 0;        // Immediate for first special
      return (depth - 1) * 400;        // 400ms per cascade level (was 200ms)
    };
    
    // v8.9: 40% longer popup durations
    const getCascadeDuration = (depth) => {
      if (depth <= 1) return 2800;  // was 2000
      if (depth === 2) return 3500; // was 2500
      return 4200;                  // was 3000
    };
    
    // v8.3/v8.3.1: Trigger visual effects for cascade (with stagger support)
    const triggerCascadeEffects = (special, depth, sourceSpecial = null, staggerDelay = 0) => {
      const effectDelay = getCascadeDelay(depth) + staggerDelay;
      
      // E. Border glow before activation (200ms before the popup)
      setTimeout(() => {
        setGlowingTiles(prev => [...prev, { row: special.row, col: special.col, id: Date.now() }]);
        // Remove glow after 200ms
        setTimeout(() => {
          setGlowingTiles(prev => prev.filter(t => !(t.row === special.row && t.col === special.col)));
        }, 200);
      }, Math.max(0, effectDelay - 100));
      
      // A. Flash effect when activating (100ms white pulse)
      setTimeout(() => {
        setFlashingTiles(prev => [...prev, { row: special.row, col: special.col, id: Date.now() }]);
        // Remove flash after 100ms
        setTimeout(() => {
          setFlashingTiles(prev => prev.filter(t => !(t.row === special.row && t.col === special.col)));
        }, 100);
      }, effectDelay);
      
      // v8.5: Removed screen shake effect
      
      // F. "CHAIN!" text between specials (for depth > 1)
      if (depth > 1 && sourceSpecial) {
        const midRow = (sourceSpecial.row + special.row) / 2;
        const midCol = (sourceSpecial.col + special.col) / 2;
        setTimeout(() => {
          setChainTexts(prev => [...prev, {
            id: Date.now() + Math.random(),
            row: midRow,
            col: midCol,
            depth: depth
          }]);
          // Remove chain text after 800ms
          setTimeout(() => {
            setChainTexts(prev => prev.slice(1));
          }, 800);
        }, effectDelay - 50);
      }
    };
    
    // Activate all specials that were matched
    let totalSpecialPoints = 0;
    const allSpecialClears = new Set();
    let cascadeCount = 0; // v8.1: Track cascade depth
    
    // v8.3.2: Rewritten cascade processing with better tracking
    const processSpecialWithCascade = (special, depth, sourceSpecial = null, staggerIndex = 0) => {
      const posKey = `${special.row}-${special.col}`;
      
      // v10 Fix 3: Mark as processed immediately on entry — was only added after
      // result.message check, causing chaining to skip if message was empty
      if (processedSpecials.has(posKey)) return;
      processedSpecials.add(posKey);
      
      // v8.3: Trigger visual effects
      // v8.3.1: Add stagger for multiple depth-1 specials
      const staggerDelay = depth === 1 ? staggerIndex * 150 : 0; // 150ms between each depth-1 special
      triggerCascadeEffects(special, depth, sourceSpecial, staggerDelay);
      
      const result = activateSpecialTile(special.row, special.col, currentGrid, allSpecialClears);
      const cascadeMultiplier = getCascadeMultiplier(depth);
      const multipliedPoints = Math.floor(result.points * cascadeMultiplier);
      
      // v8.2: Get staggered delay and duration
      // v8.3.1: Add stagger for multiple depth-1 specials
      const popupDelay = getCascadeDelay(depth) + staggerDelay;
      const popupDuration = getCascadeDuration(depth);
      
      totalSpecialPoints += multipliedPoints;
      result.tilesToClear.forEach(t => allTilesToClear.add(`${t.row}-${t.col}`));
      
      if (result.message) {
        // v8.1: Show cascade multiplier in popup for chained specials
        // v8.2: Add delay and duration
        // v8.6: Cascade popups at top rows
        if (depth > 1) {
          const cascadeMessage = `🔥 CASCADE x${cascadeMultiplier.toFixed(1)}! ${result.message.split('!')[0]}! +${multipliedPoints}`;
          // v8.6: Depth 2 → row 0, Depth 3 → row 1, Depth 4+ → row 2
          const popupRow = Math.min(depth - 2, 2);
          addScorePopup(popupRow, special.col, multipliedPoints, cascadeMessage, popupDelay, popupDuration);
        } else {
          addScorePopup(special.row, special.col, multipliedPoints, result.message, popupDelay, popupDuration);
        }
        // v8.3.2: Mark as processed (popup shown) — moved to top of function in v10
      }
      
      cascadeCount = Math.max(cascadeCount, depth);
      
      // Process chained specials at next depth level
      // v8.3.2: Check processedSpecials instead of old alreadyActivated
      result.chainedSpecials.forEach((chained, chainIndex) => {
        const chainedKey = `${chained.row}-${chained.col}`;
        if (!processedSpecials.has(chainedKey)) {
          processSpecialWithCascade(chained, depth + 1, special, chainIndex);
        }
      });
    };
    
    // Process initial specials at depth 1
    // v8.3.1: Add stagger between multiple depth-1 specials so popups don't overlap
    specialsToActivate.forEach((special, index) => {
      processSpecialWithCascade(special, 1, null, index);
    });
    
    // Add special points to score - v8.10: Apply bonus round multiplier
    if (totalSpecialPoints > 0) {
      const finalSpecialPoints = bonusRoundActive ? Math.floor(totalSpecialPoints * BONUS_ROUND_MULTIPLIER) : totalSpecialPoints;
      setScore(prev => prev + finalSpecialPoints);
      setCurrentTurnScore(prev => prev + finalSpecialPoints);
      if (bonusRoundActive) {
        setBonusRoundScore(prev => prev + finalSpecialPoints);
      }
    }
    
    // OPTION B: Use connectedGroups for special creation based on TOTAL UNIQUE TILES
    // v10 Fix 2: Removed generation cap — was blocking special creation after deep cascades.
    if (connectedGroups && connectedGroups.length > 0) {
      // Sort by total unique tiles (largest first)
      const sortedConnected = [...connectedGroups].sort((a, b) => b.totalUniqueTiles - a.totalUniqueTiles);
      
      sortedConnected.forEach(group => {
        if (group.totalUniqueTiles >= 4) {
          // v8.4: Prioritize swap position if it's within this match group
          let bestTile = null;
          
          if (swapPosition && generation === 0) {
            // Check if swap position is in this group
            const swapInGroup = group.tiles.some(t => t.row === swapPosition.row && t.col === swapPosition.col);
            if (swapInGroup && !claimedPositions.has(`${swapPosition.row}-${swapPosition.col}`)) {
              bestTile = swapPosition;
            }
          }
          
          // Fallback: Find center tile if swap position not usable
          if (!bestTile) {
            let centerRow = 0, centerCol = 0;
            group.tiles.forEach(t => { centerRow += t.row; centerCol += t.col; });
            centerRow = Math.round(centerRow / group.tiles.length);
            centerCol = Math.round(centerCol / group.tiles.length);
            
            // Find the actual tile closest to center that's in the group AND not claimed
            let bestDist = Infinity;
            group.tiles.forEach(t => {
              const dist = Math.abs(t.row - centerRow) + Math.abs(t.col - centerCol);
              if (dist < bestDist && !claimedPositions.has(`${t.row}-${t.col}`)) {
                bestDist = dist;
                bestTile = t;
              }
            });
            
            // v9.8: If all center tiles are claimed, find ANY unclaimed tile in the group
            if (!bestTile) {
              bestTile = group.tiles.find(t => !claimedPositions.has(`${t.row}-${t.col}`));
            }
          }
          
          // v9.8: Only proceed if we found an unclaimed tile
          // v10 Fix 2b: Also verify the target cell will actually be empty (in allTilesToClear)
          if (bestTile) {
            const posKey = `${bestTile.row}-${bestTile.col}`;
            const willBeEmpty = allTilesToClear.has(posKey);
            if (!claimedPositions.has(posKey) && willBeEmpty) {
              let specialType = 'line';
              // OPTION B: Use totalUniqueTiles for determination
              if (group.totalUniqueTiles >= 7) specialType = 'hypernova';
              else if (group.totalUniqueTiles === 6) specialType = 'supernova';
              else if (group.totalUniqueTiles === 5) {
                // v8.3.1: Fixed L-shape detection - check if group itself spans both directions
                // A straight line has either: all same row (horizontal) or all same column (vertical)
                // An L-shape spans multiple rows AND multiple columns
                const rows = new Set(group.tiles.map(t => t.row));
                const cols = new Set(group.tiles.map(t => t.col));
                const isLShape = rows.size > 1 && cols.size > 1;
                specialType = isLShape ? 'cross' : 'bomb';
              }
              // 4 tiles = line (default) - no special for 4-tile L-shapes
              
              const tileColor = group.tileType ?? 0;
              specialsToCreate.push({ row: bestTile.row, col: bestTile.col, type: specialType, tileColor });
              group.tiles.forEach(t => claimedPositions.add(`${t.row}-${t.col}`));
            }
          }
        }
      });
    } else {
      // Fallback to old logic if no connectedGroups (shouldn't happen)
      const sortedGroups = [...matchGroups].sort((a, b) => b.length - a.length);
      
      sortedGroups.forEach(group => {
        if (group.length >= 4 && generation < 3) {
          const midIndex = Math.floor(group.tiles.length / 2);
          const midTile = group.tiles[midIndex];
          const posKey = `${midTile.row}-${midTile.col}`;
          
          if (!claimedPositions.has(posKey)) {
            let specialType = 'line';
            if (group.length >= 7) specialType = 'hypernova';
            else if (group.length === 6) specialType = 'supernova';
            else if (group.length === 5) specialType = 'bomb';
            
            const tileColor = currentGrid[midTile.row]?.[midTile.col]?.type ?? 0;
            specialsToCreate.push({ row: midTile.row, col: midTile.col, type: specialType, tileColor });
            group.tiles.forEach(t => claimedPositions.add(`${t.row}-${t.col}`));
          }
        }
      });
      
      // v7.2: Removed old L-shape→cross logic (4-tile L-shapes are regular matches now)
    }
    
    // Clear all matched tiles (including special effect tiles)
    allTilesToClear.forEach(posKey => {
      const [row, col] = posKey.split('-').map(Number);
      newGrid[row][col] = null;
    });
    
    // Create special tiles from 4+ tile matches
    // NEW IN v6.6: Always create specials if match qualifies, even if a special was activated
    specialsToCreate.forEach(({ row, col, type, tileColor }) => {
      newGrid[row][col] = {
        type: tileColor,
        id: `special-${row}-${col}-${Date.now()}`,
        special: type,
        isNew: false,
        animX: col * (TILE_SIZE + TILE_GAP),
        animY: row * (TILE_SIZE + TILE_GAP)
      };
    });
    
    setGrid(newGrid);
    setMatchedTiles([]);
    
    setTimeout(() => applyGravity(newGrid, generation), 500);
  };
  
  const applyGravity = (currentGrid, generation) => {
    const newGrid = currentGrid.map(r => r.map(t => t ? { ...t } : null));
    
    for (let col = 0; col < COLS; col++) {
      let emptyRow = ROWS - 1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (newGrid[row][col] !== null) {
          if (row !== emptyRow) {
            newGrid[emptyRow][col] = newGrid[row][col];
            newGrid[emptyRow][col].animY = row * (TILE_SIZE + TILE_GAP); // Animate from old position
            newGrid[row][col] = null;
          }
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
      for (let row = 0; row < ROWS; row++) {
        if (newGrid[row][col] === null) emptyCount++;
      }
      
      for (let row = 0; row < ROWS; row++) {
        if (newGrid[row][col] === null) {
          newGrid[row][col] = {
            type: Math.floor(Math.random() * TILE_TYPES),
            id: `${row}-${col}-${Date.now()}-${Math.random()}`,
            special: null,
            isNew: true,
            animX: col * (TILE_SIZE + TILE_GAP),
            animY: -emptyCount * (TILE_SIZE + TILE_GAP) // Start above board
          };
          emptyCount--;
        }
      }
    }
    
    setGrid(newGrid);
    
    setTimeout(() => {
      const { matches, matchGroups, lShapeMatches, connectedGroups } = findMatches(newGrid);
      if (matches.length > 0) {
        const comboIncrease = matchGroups.length + (lShapeMatches?.length || 0);
        setCombo(prev => {
          const newCombo = prev + comboIncrease;
          setMaxComboReached(current => Math.max(current, newCombo));
          return newCombo;
        });
        // v10.2 Fix #1: Use comboRef.current (not stale combo closure) for accurate cascade multiplier
        processMatches(newGrid, matchGroups, lShapeMatches, comboRef.current + comboIncrease, generation + 1, connectedGroups);
      } else {
        // No more matches - turn is complete
        // v10 Fix 1: setIsAnimating(false) moved inside the setTimeout alongside
        // setTurnComplete(true) — eliminates the 100ms window where isAnimating=false
        // but turnComplete=false, which could trigger a premature game-end check
        // v10.3 Fix A: Use comboRef.current (not stale combo closure) so lastCombo
        // correctly reflects the final accumulated combo value from the cascade.
        setLastCombo(comboRef.current);
        setCombo(0);
        setTimeout(() => {
          setIsAnimating(false);
          setTurnComplete(true);
          checkForValidMoves(newGrid);
        }, 100);
      }
    }, 500);
  };
  
  const checkForValidMoves = (currentGrid) => {
    if (gameState !== 'playing') return;
    // v10 Fix 7: re-check gameState inside the timeout — game could end during the 300ms wait
    setTimeout(() => {
      if (gameState !== 'playing') return;
      if (!hasValidMoves(currentGrid)) {
        setShowNoMoves(true);
      }
    }, 300);
  };
  
  // =============================================================================
  // SHUFFLE FUNCTIONS (free shuffle on no-moves only)
  // =============================================================================
  
  // Free shuffle triggered by no-moves dialog
  const shuffleBoardFree = () => {
    setShowNoMoves(false);
    performShuffle();
  };
  
  // Core shuffle logic
  const performShuffle = () => {
    performShuffleOnGrid(grid);
  };
  
  const performShuffleOnGrid = (currentGrid) => {
    setIsAnimating(true);
    
    const tiles = [];
    currentGrid.forEach(row => {
      row.forEach(tile => {
        if (tile) tiles.push({ ...tile, isNew: false });
      });
    });
    
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    
    const newGrid = [];
    let tileIndex = 0;
    for (let row = 0; row < ROWS; row++) {
      newGrid[row] = [];
      for (let col = 0; col < COLS; col++) {
        if (tileIndex < tiles.length) {
          newGrid[row][col] = { 
            ...tiles[tileIndex], 
            id: `${row}-${col}-${Date.now()}`, 
            isNew: true,
            animX: col * (TILE_SIZE + TILE_GAP),
            animY: row * (TILE_SIZE + TILE_GAP)
          };
          tileIndex++;
        }
      }
    }
    
    setGrid(newGrid);
    setTimeout(() => setIsAnimating(false), 600);
  };
  
  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  // v8.0: Increased combo multiplier (4.0 + 0.2 per level for 6+)
  const getMultiplier = (comboValue) => {
    if (comboValue === 0) return 1.0;
    if (comboValue === 1) return 1.5;
    if (comboValue === 2) return 2.0;
    if (comboValue === 3) return 2.5;
    if (comboValue === 4) return 3.0;
    if (comboValue === 5) return 3.5;
    if (comboValue >= 6) return 4.0 + (comboValue - 6) * 0.2;
    return 1.0;
  };
  
  // v8.9: Default duration increased 40% (2000 → 2800)
  const addScorePopup = (row, col, points, text = null, delay = 0, duration = 2800) => {
    setScorePopups(prev => [...prev, {
      id: Date.now() + Math.random(),
      row, col, points, text,
      combo,
      delay,      // v8.2: ms before popup appears
      duration,   // v8.2: how long popup lingers (ms)
      createdAt: Date.now()  // v8.2: track creation time for cleanup
    }]);
  };
  
  const restartGame = () => {
    setGrid(initializeGrid());
    setScore(0);
    setMoves(MIN_MOVES + Math.floor(Math.random() * (MAX_MOVES - MIN_MOVES + 1)));
    const rawTarget = BASE_TARGET + Math.floor(Math.random() * TARGET_VARIANCE) + difficultyBonus;
    setLevelTarget(Math.round(rawTarget / 100) * 100);
    setGameState('playing');
    setSelectedTile(null);
    setIsAnimating(false);
    setMatchedTiles([]);
    setScorePopups([]);
    setCombo(0);
    setLastCombo(0);
    setShowNoMoves(false);
    setMaxComboReached(0);
    setTargetReached(false);
    setPendingSpecials([]);
    setCurrentTurnScore(0);
    setSpecialBonusMultiplier(0);
    setTurnComplete(true);
    // v8.10: Reset bonus round state
    setShowBonusPrompt(false);
    setBonusRoundActive(false);
    setBonusRoundScore(0);
    setPreBonusScore(0);
    setLastMilestoneShown(0);
    // v10 Fix 6: Clear visual state that was orphaned on restart
    setFlashingTiles([]);
    setGlowingTiles([]);
    setChainTexts([]);
    // v10.3 Fix B: Clear animation position cache so new tiles don't inherit stale positions
    animStateRef.current = {};
    // v10.4: Reset bonus move tracking
    bonusMoveThresholdRef.current = 0;
    bonusMoveFlashPendingRef.current = 0;
    setBonusMoveFlash(0);
  };
  
  // =============================================================================
  // RENDER
  // =============================================================================
  
  // v9.0: Calculate special count for header display
  const specialCount = countSpecialsOnBoard();
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      paddingBottom: '60px',
      touchAction: 'none',
      userSelect: 'none'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '12px 20px',
        marginBottom: '20px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        width: `${boardWidth + 30}px`,
        minHeight: '110px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* v8.0: Dark/Light Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = 1}
          onMouseLeave={(e) => e.target.style.opacity = 0.7}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        
        <h1 style={{ margin: '0', color: '#333', fontSize: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
          🎮 Match-3 <span style={{ fontSize: '12px', color: '#888' }}>v10.5.2</span>
        </h1>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#555'
        }}>
          <div>Score: <span style={{ color: '#667eea' }}>{score}</span></div>
          {/* v10.5: Moves counter with bonus-move burst animation */}
          <div style={{ position: 'relative' }}>
            Moves: <span style={{ color: '#667eea' }}>{moves}</span>
            {bonusMoveFlash > 0 && (
              <span
                key={bonusMoveFlash}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '28px',
                  fontWeight: '900',
                  color: '#00C853',
                  textShadow: '0 0 12px #00C853, 0 0 24px #00C853, 1px 1px 0 #000',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  animation: 'bonusMoveBurst 4s ease-out forwards'
                }}
              >
                +1 move 🎯
              </span>
            )}
          </div>
          <div>Target: <span style={{ color: '#667eea' }}>{levelTarget}</span></div>
        </div>
        
        {/* v9.0: Show special count */}
        <div style={{ fontSize: '12px', color: '#888' }}>
          ✨ Specials on board: {specialCount}
        </div>
        
        {/* v8.10: Bonus Round banner */}
        {bonusRoundActive && (
          <div style={{
            background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
            padding: '8px 16px',
            borderRadius: '8px',
            marginTop: '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#333',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.5)',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            🌟 BONUS ROUND - {BONUS_ROUND_MULTIPLIER}x ALL POINTS! 🌟
          </div>
        )}
        
        {/* Combo display - v8.0: now shows multiplier value */}
        {/* v10.2 Fix #4: Also check gameState so stale lastCombo never flashes on a fresh game */}
        <div style={{ minHeight: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {gameState === 'playing' && (combo > 0 || lastCombo > 0) && (
            <div style={{
              fontSize: '20px',  // v8.9: bigger (was 16px)
              color: (combo > 0 ? combo : lastCombo) >= 10 ? '#FF4500' : 
                     (combo > 0 ? combo : lastCombo) >= 5 ? '#FFD700' : '#FF8C00',
              fontWeight: 'bold',
              textShadow: (combo > 0 ? combo : lastCombo) >= 5 
                ? '0 0 10px currentColor, 2px 2px 4px rgba(0,0,0,0.3)' 
                : '1px 1px 2px rgba(0,0,0,0.2)',
              opacity: combo > 0 ? 1 : 0.7,
              transform: (combo > 0 ? combo : lastCombo) >= 10 ? 'scale(1.1)' : 'scale(1)'
            }}>
              {(combo > 0 ? combo : lastCombo) >= 15 ? '💥 LEGENDARY' :
               (combo > 0 ? combo : lastCombo) >= 10 ? '⚡ ULTRA COMBO' :
               (combo > 0 ? combo : lastCombo) >= 5 ? '🌟 MEGA COMBO' : '🔥 COMBO'} x{(combo > 0 ? combo : lastCombo) + 1}
              <span style={{ marginLeft: '8px', fontSize: '16px', color: '#667eea' }}>
                ({getMultiplier(combo > 0 ? combo : lastCombo).toFixed(1)}x pts)
              </span>
            </div>
          )}
          {!(combo > 0 || lastCombo > 0) && (highScore > 0 || allTimeHighCombo > 0) && (
            <div style={{ fontSize: '12px', color: '#888', display: 'flex', gap: '15px', justifyContent: 'center' }}>
              {highScore > 0 && <span>🏆 {highScore}</span>}
              {allTimeHighCombo > 0 && <span>🔥 Best: x{allTimeHighCombo + 1}</span>}
            </div>
          )}
        </div>
      </div>
      
      {/* Game Board - Canvas */}
      <div 
        style={{
          background: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          padding: '15px',
          boxShadow: isDarkMode ? '0 8px 16px rgba(0,0,0,0.3)' : '0 8px 16px rgba(0,0,0,0.15)',
          position: 'relative'
        }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          style={{
            borderRadius: '10px',
            cursor: isAnimating ? 'default' : 'pointer',
            touchAction: 'none'
          }}
        />
        
        {/* v8.3: Chain text popups ("CHAIN!") */}
        {chainTexts.map(chain => (
          <div
            key={chain.id}
            style={{
              position: 'absolute',
              left: `${15 + chain.col * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2}px`,
              top: `${15 + chain.row * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2}px`,
              transform: 'translate(-50%, -50%)',
              fontSize: '14px',
              fontWeight: '900',
              color: '#FF6B6B',
              textShadow: '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000',
              pointerEvents: 'none',
              animation: 'chainPop 0.8s ease-out forwards',
              zIndex: 1100,
              whiteSpace: 'nowrap'
            }}
          >
            ⛓️ CHAIN x{chain.depth}!
          </div>
        ))}
        
        {/* Score Popups - v8.2: staggered delays and longer linger */}
        {/* v8.13: Supernova/Hypernova get higher z-index and longer duration */}
        {scorePopups.map(popup => {
          const isHypernova = popup.text?.includes('HYPERNOVA') || popup.text?.includes('🌠');
          const isSupernova = popup.text?.includes('SUPERNOVA') || popup.text?.includes('🌌');
          const priorityZIndex = isHypernova ? 2000 : isSupernova ? 1500 : 1000 + (popup.delay || 0);
          const priorityDuration = isHypernova ? 5000 : isSupernova ? 4500 : popup.duration;
          const priorityFontSize = isHypernova ? '22px' : isSupernova ? '20px' : (popup.text ? '18px' : '24px');
          
          return (
          <div
            key={popup.id}
            style={{
              position: 'absolute',
              left: `${15 + popup.col * (TILE_SIZE + TILE_GAP)}px`,
              top: `${15 + popup.row * (TILE_SIZE + TILE_GAP)}px`,
              fontSize: priorityFontSize,
              fontWeight: '900',
              color: isHypernova ? '#FF00FF' : isSupernova ? '#00FFFF' : (popup.delay > 0 ? '#FF6B6B' : '#FFD700'),
              textShadow: isHypernova || isSupernova 
                ? '0 0 20px currentColor, 2px 2px 0px #000, -1px -1px 0px #000' 
                : '2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 0 0 15px rgba(255,215,0,0.9)',
              pointerEvents: 'none',
              animation: `scorePopup ${priorityDuration / 1000}s ease-out forwards`,
              animationDelay: `${popup.delay}ms`,
              opacity: 0,
              zIndex: priorityZIndex,
              whiteSpace: 'nowrap',
              background: popup.text ? 'rgba(0,0,0,0.9)' : 'transparent',
              padding: popup.text ? '10px 14px' : '0',
              borderRadius: popup.text ? '10px' : '0',
              border: popup.text ? `2px solid ${isHypernova ? '#FF00FF' : isSupernova ? '#00FFFF' : (popup.delay > 0 ? '#FF6B6B' : '#FFD700')}` : 'none',
              boxShadow: popup.text ? (isHypernova || isSupernova ? '0 0 30px currentColor' : '0 0 20px rgba(255,215,0,0.7)') : 'none'
            }}
          >
            {popup.text || `+${popup.points}`}
            {!popup.text && popup.combo > 0 && ` x${popup.combo + 1}`}
          </div>
        );})}
      </div>
      
      {/* No Valid Moves Dialog */}
      {showNoMoves && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            textAlign: 'center',
            maxWidth: '350px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ fontSize: '24px', margin: '0 0 15px 0', color: '#FF8C00' }}>
              😓 No Valid Moves!
            </h3>
            <p style={{ fontSize: '16px', color: '#555', marginBottom: '20px' }}>
              Free shuffle to continue
            </p>
            <button
              onClick={shuffleBoardFree}
              style={{
                padding: '12px 30px',
                fontSize: '18px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔀 Shuffle Board
            </button>
          </div>
        </div>
      )}
      
      {/* v8.11: Bonus Round Prompt - Top Banner (board visible for informed decision) */}
      {showBonusPrompt && (() => {
        // v9.8.1: Calculate specials bonus to show accurate "potential score"
        const { bonus: pendingSpecialsBonus } = calculateUnusedSpecialsBonus(grid);
        const potentialScore = score + pendingSpecialsBonus;
        
        return (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          minHeight: '100px',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.98) 0%, rgba(255, 165, 0, 0.98) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '25px',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          padding: '10px 20px',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center', color: '#333', minWidth: '160px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(255,255,255,0.3)', marginBottom: '4px' }}>
              🎉 TARGET REACHED!
            </div>
            <div style={{ fontSize: '14px', color: '#555' }}>
              Enter Bonus Round?
            </div>
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            color: '#333', 
            fontSize: '14px', 
            lineHeight: '1.6',
            background: 'rgba(0,0,0,0.1)',
            padding: '8px 15px',
            borderRadius: '8px',
            minWidth: '150px'
          }}>
            <div>Score: <strong>{score}</strong>{pendingSpecialsBonus > 0 && <span style={{ color: '#228B22' }}> +{pendingSpecialsBonus}</span>} = <strong>{potentialScore}</strong> / {levelTarget}</div>
            <div>Moves left: <strong>{moves}</strong></div>
            <div style={{ color: '#8B4513', fontWeight: 'bold' }}>All points {BONUS_ROUND_MULTIPLIER}x!</div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={startBonusRound}
              style={{
                padding: '10px 20px',
                fontSize: '15px',
                background: '#333',
                color: '#FFD700',
                border: '2px solid #333',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              🌟 BONUS ROUND
            </button>
            <button
              onClick={endLevelEarly}
              style={{
                padding: '10px 20px',
                fontSize: '15px',
                background: 'white',
                color: '#333',
                border: '2px solid #333',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              End (+{moves * EARLY_END_BONUS_PER_MOVE + pendingSpecialsBonus})
            </button>
          </div>
        </div>
      );})()}
      
      {/* Game Over / Won Screen */}
      {(gameState === 'gameover' || gameState === 'won') && (() => {
        // v8.10: Different move bonus depending on whether bonus round was used
        const usedBonusRound = bonusRoundActive || bonusRoundScore > 0;
        const moveBonusAmount = usedBonusRound ? 0 : Math.max(0, moves) * (preBonusScore > 0 ? EARLY_END_BONUS_PER_MOVE : WIN_BONUS_PER_MOVE);
        const { bonus: specialsBonusAmount, specials } = calculateUnusedSpecialsBonus(grid);
        const totalSpecials = specials.line + specials.bomb + specials.cross + specials.supernova + specials.hypernova;
        
        return (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            minHeight: '120px',
            background: gameState === 'won' 
              ? 'linear-gradient(135deg, rgba(68, 255, 68, 0.98) 0%, rgba(40, 180, 40, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(255, 68, 68, 0.98) 0%, rgba(180, 40, 40, 0.98) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '25px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            padding: '10px 20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center', color: 'white', minWidth: '200px' }}>
              <div style={{ fontSize: '26px', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)', marginBottom: '4px' }}>
                {gameState === 'won' ? '🎉 Victory!' : '😓 Game Over'}
              </div>
              <div style={{ fontSize: '22px' }}>
                Final Score: <strong>{score}</strong>
                {highScore > 0 && score >= highScore && (
                  <span style={{ fontSize: '14px', marginLeft: '8px', color: '#FFD700' }}>🏆 High!</span>
                )}
              </div>
            </div>
            
            <div style={{ 
              textAlign: 'left', 
              color: 'white', 
              fontSize: '13px', 
              lineHeight: '1.5',
              background: 'rgba(0,0,0,0.2)',
              padding: '8px 12px',
              borderRadius: '8px',
              minWidth: '180px'
            }}>
              {/* v8.10: Show bonus round score if used */}
              {bonusRoundScore > 0 && (
                <div>🌟 Bonus Round: +{bonusRoundScore}</div>
              )}
              {gameState === 'won' && moveBonusAmount > 0 && (
                <div>⭐ Moves: {moves} × {preBonusScore > 0 ? EARLY_END_BONUS_PER_MOVE : WIN_BONUS_PER_MOVE} = +{moveBonusAmount}</div>
              )}
              {totalSpecials > 0 && (
                <div>✨ Specials: {totalSpecials} = +{specialsBonusAmount}</div>
              )}
              <div>🔥 Best Combo: x{maxComboReached + 1}</div>
            </div>
            
            <button
              onClick={restartGame}
              style={{
                padding: '10px 25px',
                fontSize: '16px',
                background: 'white',
                color: gameState === 'won' ? '#28b428' : '#b42828',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              🔄 Play Again
            </button>
          </div>
        );
      })()}
      
      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '12px 16px',
        borderRadius: '10px',
        maxWidth: `${boardWidth + 30}px`,
        fontSize: '12px',
        color: '#555',
        textAlign: 'center',
        lineHeight: '1.5'
      }}>
        <strong>🎯 Match 3+ tiles!</strong> • 
        <strong>⚡4-match:</strong> Line • 
        <strong>💣5-match:</strong> Bomb • 
        <strong>✨L-shape:</strong> Cross •
        <strong>🎯 Every 10k pts:</strong> +1 Move
      </div>
      
      <style>{`
        @keyframes scorePopup {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          70% { transform: translateY(-50px) scale(1.3); opacity: 1; }
          100% { transform: translateY(-90px) scale(1.5); opacity: 0; }
        }
        
        /* v8.7: Simplified chain text animation - just fade, no scale bounce */
        @keyframes chainPop {
          0% { transform: translate(-50%, -50%); opacity: 0; }
          15% { transform: translate(-50%, -50%); opacity: 1; }
          85% { transform: translate(-50%, -50%); opacity: 1; }
          100% { transform: translate(-50%, -50%); opacity: 0; }
        }
        
        /* v8.10: Pulse animation for bonus round banner */
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(255, 215, 0, 0.5); }
          50% { transform: scale(1.02); box-shadow: 0 0 25px rgba(255, 215, 0, 0.8); }
        }
        
        /* v10.5.2: Bonus move burst — slower float, 4s duration */
        @keyframes bonusMoveBurst {
          0%   { transform: translateX(-50%) translateY(0) scale(0.5); opacity: 0; }
          10%  { transform: translateX(-50%) translateY(-4px) scale(1.6); opacity: 1; }
          35%  { transform: translateX(-50%) translateY(-14px) scale(1.4); opacity: 1; }
          70%  { transform: translateX(-50%) translateY(-26px) scale(1.2); opacity: 1; }
          100% { transform: translateX(-50%) translateY(-38px) scale(1.0); opacity: 0; }
        }
        
        /* v8.5: Removed screen shake animation */
      `}</style>
    </div>
  );
};

export default Match3Game;
