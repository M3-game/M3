// =============================================================================
// core/tileDrawing.js — Shared canvas tile-drawing module
//
// Extracted verbatim from platforms/tablet/match3-v11.17-tablet.jsx (the
// TILE_COLORS palette, drawTile, the six shape helpers, and drawSpecialIcon)
// in Session 1 (2026-06-23) as the first step of the "move shared code into
// core/" architecture work (docs/DEFERRED.md). Pure drawing: depends only on
// the canvas context + arguments — no game state, no other module constants.
//
// Tablet arcade v11.18 is the first consumer (the validation pilot). Other
// platforms still hold their own identical copies and migrate to this module
// incrementally. core/ is edited in place (CLAUDE.md), so no version suffix.
//
// Exports: TILE_COLORS, drawTile, drawSpecialIcon. The six shape helpers
// (drawHypocycloid … drawSun) are internal — only drawTile calls them.
// =============================================================================

export const TILE_COLORS = [
  { name: 'hypocycloid', primary: '#E53935', light: '#FFCDD2', dark: '#B71C1C', accent: '#FF5252' },
  { name: 'diamond', primary: '#304FFE', light: '#90CAF9', dark: '#0D47A1', accent: '#42A5F5' },
  { name: 'clover', primary: '#00C853', light: '#81C784', dark: '#2E7D32', accent: '#66BB6A' },
  { name: 'star', primary: '#FFD700', light: '#FFF9C4', dark: '#FF8F00', accent: '#FFD54F' },
  { name: 'candy', primary: '#AA00FF', light: '#E1BEE7', dark: '#6A1B9A', accent: '#AB47BC' },
  { name: 'sun', primary: '#FF6D00', light: '#FFCC80', dark: '#BF360C', accent: '#FFB74D' }
];

// Canvas Tile Drawing Functions
export const drawTile = (ctx, x, y, size, tileType, options = {}) => {
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
export const drawSpecialIcon = (ctx, x, y, size, specialType) => {
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
