/**
 * diagram-library.js
 * Pure SVG/HTML diagram generator for exam questions.
 * All functions are pure — they take params and return strings. No DOM access.
 *
 * CSS variable usage (from style.css — NEVER hardcode hex values):
 *   Borders/axes/text:  var(--brand-sage, #51615E)   #51615E
 *   Highlights/shaded:  var(--brand-rose, #B76E79)   #B76E79
 *   Light backgrounds:  var(--bg-elevated, #f0f5f2)  #F0F4F3
 *   Accent/warning:     var(--brand-amber, #D4A24C)  #D97706
 *   Text on light bg:   var(--text-main, #1a2e2a)    #2C3E3A
 *   Muted text:         var(--text-muted, #5d706b)   #6B7A77
 *
 * SVG conventions:
 *   - width="100%" height="auto" (responsive)
 *   - role="img" + aria-label on every SVG
 *   - font-family: 'Plus Jakarta Sans', sans-serif
 *   - Default viewBox: 0 0 400 260
 *
 * TEST: Load file and call each function — each must return a non-empty string > 50 chars.
 */

'use strict';

const DiagramLibrary = {
  /**
 * 🧊 Isometric Grid / Orthographic Projection — P5/P6 Geometry > Solid Figures
 *
 * Masterclass solution: one function, two render modes, same data model.
 * The AI specifies cubes_arrangement once; mode controls the visual output.
 *
 * @param {string}   params.mode                - 'isometric' (default) | 'orthographic'
 * @param {number[][]} params.cubes_arrangement - 2D array: each cell = cubes stacked at [row][col]
 *                                               row 0 = front of the grid
 * @param {string}   params.label               - Optional diagram caption
 * @param {Array}    params.highlight_cubes     - [{row, col, layer}] cubes to tint rose
 *
 * MODE: 'isometric'
 *   Renders a 3D perspective view of the cube stack.
 *   Use for: "How many cubes are in this arrangement?"
 *   { "function_name": "isometricGrid",
 *     "params": { "mode": "isometric",
 *                 "cubes_arrangement": [[2,1],[1,3]] } }
 *
 * MODE: 'orthographic'
 *   Renders Top View, Front View, and Side View panels side-by-side.
 *   Use for: "Draw/identify the Top/Front/Side view of this arrangement."
 *   Hidden-cubes variant: AI sets values higher, mode='orthographic' shows what
 *   can be deduced from the 2D views only.
 *   { "function_name": "isometricGrid",
 *     "params": { "mode": "orthographic",
 *                 "cubes_arrangement": [[2,0,1],[1,2,0],[0,1,1]] } }
 */
  isometricGrid({
    mode              = 'isometric',
    cubes_arrangement = [[1]],
    label             = '',
    highlight_cubes   = [],
  } = {}) {
    // Normalise: ensure valid 2D array
    let grid = Array.isArray(cubes_arrangement) ? cubes_arrangement : [[1]];
    if (!Array.isArray(grid[0])) grid = [grid];

    const rows  = grid.length;
    const cols  = Math.max(...grid.map(r => (Array.isArray(r) ? r.length : 0)), 1);
    const maxH  = Math.max(...grid.flat().map(v => Number(v) || 0), 1);

    if (mode === 'orthographic') return this._isoOrthographic(grid, rows, cols, maxH, label);
    return this._isoIsometric(grid, rows, cols, maxH, label, highlight_cubes);
  },

  /**
   * @private — Renders the 3D isometric perspective view.
   */
  _isoIsometric(grid, rows, cols, maxH, label, hlCubes) {
    const esc = this._esc.bind(this);
    const cW = 36, cH = 18, vH = 24;  // cube face dimensions (pixels)

    // Dynamic viewBox sized to fit the grid
    const svgW = Math.max(280, (cols + rows) * cW / 2 + 100);
    const svgH = Math.max(180, maxH * vH + (cols + rows) * cH / 2 + 60);
    // Origin = front-left (col=0, row=0) anchor point (bottom of ground cube's top face)
    const ox = Math.round(rows * cW / 2 + 50);
    const oy = Math.round(svgH - 30);

    // Convert (col, row, z) → SVG position of the FRONT vertex of the TOP face
    const toS = (col, row, z) => ({
      x: ox + (col - row) * cW / 2,
      y: oy - (col + row) * cH / 2 - z * vH,
    });

    // Draw one face of a cube; `which` = 'top' | 'left' | 'right'
    const drawFace = (col, row, z, which, hl) => {
      const { x: fx, y: fy } = toS(col, row, z);
      const lx = fx - cW/2, ly = fy - cH/2;
      const rx = fx + cW/2, ry = fy - cH/2;
      const tx = fx,         ty = fy - cH;
      const bx = fx,         by = fy + vH;
      const pts = {
        top:   `${fx},${fy} ${lx},${ly} ${tx},${ty} ${rx},${ry}`,
        left:  `${lx},${ly} ${fx},${fy} ${bx},${by} ${lx},${ly + vH}`,
        right: `${fx},${fy} ${rx},${ry} ${rx},${ry + vH} ${bx},${by}`,
      };
      const fill = hl
        ? { top: 'rgba(183,110,121,0.45)', left: 'rgba(183,110,121,0.30)', right: 'rgba(183,110,121,0.18)' }
        : { top: 'var(--bg-elevated, #f0f5f2)',     left: 'rgba(81,97,94,0.16)',    right: 'rgba(81,97,94,0.08)' };
      const stroke = hl ? 'var(--brand-rose, #B76E79)' : 'var(--brand-sage, #51615E)';
      return `<polygon points="${pts[which]}" fill="${fill[which]}" stroke="${stroke}" stroke-width="1.5"/>`;
    };

    // Painter's algorithm: draw from back-right to front-left, bottom layer first
    let shapes = '';
    for (let r = rows - 1; r >= 0; r--) {
      for (let c = 0; c < cols; c++) {
        const h = Number((grid[r] || [])[c]) || 0;
        for (let z = 0; z < h; z++) {
          const hl = Array.isArray(hlCubes) && hlCubes.some(q => q.row === r && q.col === c && q.layer === z);
          shapes += drawFace(c, r, z, 'left', hl);
          shapes += drawFace(c, r, z, 'right', hl);
          shapes += drawFace(c, r, z, 'top', hl);
        }
      }
    }

    const lblEl = label
      ? `<text x="${svgW/2}" y="16" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="12" font-weight="600">${esc(label)}</text>`
      : '';

    return this._svg(`${lblEl}${shapes}`, {
      viewBox: `0 0 ${svgW} ${svgH}`,
      alt: `Isometric view of cube arrangement: ${rows} row(s), ${cols} column(s), max height ${maxH}.`,
      maxWidth: svgW,
    });
  },

/**
 * @private — Renders 3 orthographic projection panels (Top, Front, Side).
 */
_isoOrthographic(grid, rows, cols, maxH, label) {
  const esc      = this._esc.bind(this);
  const cs       = 22;   // cell size (pixels)
  const lblH     = 16;
  const pad      = 12;
  const gap      = 22;

  // Derive views from cubes_arrangement
  // Front view: for each COLUMN, max height across all rows
  const frontH   = Array.from({ length: cols }, (_, c) =>
    Math.max(...grid.map(row => Number((row || [])[c]) || 0))
  );
  // Side view: for each ROW, max height across all columns
  const sideH    = grid.map(row =>
    Math.max(...Array.from({ length: cols }, (_, c) => Number((row || [])[c]) || 0))
  );

  const mFront   = Math.max(...frontH, 1);
  const mSide    = Math.max(...sideH, 1);
  const mPanel   = Math.max(rows * cs, mFront * cs, mSide * cs);

  const svgW     = pad + cols*cs + gap + cols*cs + gap + rows*cs + pad;
  const svgH     = pad + lblH + mPanel + pad + (label ? 16 : 0);

  const tx0      = pad;                             // top view x-origin
  const fx0      = pad + cols*cs + gap;             // front view x-origin
  const sx0      = fx0 + cols*cs + gap;             // side view x-origin
  const cy0      = pad + lblH;                      // content y-origin (top of tallest panel)

  // Bottom-align all panels
  const topY0    = cy0 + (mPanel - rows*cs);
  const frontY0  = cy0 + (mPanel - mFront*cs);
  const sideY0   = cy0 + (mPanel - mSide*cs);

  let svg = '';

  // Panel headers
  const hY = pad + lblH - 3;
  [[tx0 + cols*cs/2, 'Top View'], [fx0 + cols*cs/2, 'Front View'], [sx0 + rows*cs/2, 'Side View']].forEach(([x, t]) => {
    svg += `<text x="${x}" y="${hY}" text-anchor="middle" fill="var(--brand-sage, #51615E)" font-size="10" font-weight="700">${t}</text>`;
  });

  // ── TOP VIEW ───────────────────────────────────────────────────────────────
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const h    = Number((grid[r] || [])[c]) || 0;
      const fill = h > 0 ? 'rgba(81,97,94,0.22)' : 'none';
      svg += `<rect x="${tx0+c*cs}" y="${topY0+r*cs}" width="${cs}" height="${cs}" fill="${fill}" stroke="var(--brand-sage, #51615E)" stroke-width="1"/>`;
      if (h > 1) svg += `<text x="${tx0+c*cs+cs/2}" y="${topY0+r*cs+cs/2+4}" text-anchor="middle" fill="var(--brand-sage, #51615E)" font-size="8" font-weight="700">${h}</text>`;
    }
  }

  // ── FRONT VIEW (looking from row=0 side) ──────────────────────────────────
  for (let c = 0; c < cols; c++) {
    for (let z = 0; z < mFront; z++) {
      const fill = z < frontH[c] ? 'rgba(81,97,94,0.22)' : 'none';
      svg += `<rect x="${fx0+c*cs}" y="${frontY0+(mFront-1-z)*cs}" width="${cs}" height="${cs}" fill="${fill}" stroke="var(--brand-sage, #51615E)" stroke-width="1"/>`;
    }
  }

  // ── SIDE VIEW (looking from col=cols−1 side, row=0 appears on RIGHT) ──────
  for (let r = 0; r < rows; r++) {
    const panelCol = rows - 1 - r;   // front row → rightmost column in panel
    for (let z = 0; z < mSide; z++) {
      const fill = z < sideH[r] ? 'rgba(81,97,94,0.22)' : 'none';
      svg += `<rect x="${sx0+panelCol*cs}" y="${sideY0+(mSide-1-z)*cs}" width="${cs}" height="${cs}" fill="${fill}" stroke="var(--brand-sage, #51615E)" stroke-width="1"/>`;
    }
  }

  // Optional diagram caption
  const capEl = label
    ? `<text x="${svgW/2}" y="${svgH-3}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10">${esc(label)}</text>`
    : '';

  return this._svg(`${svg}${capEl}`, {
    viewBox: `0 0 ${svgW} ${svgH}`,
    alt: `Orthographic projection: Top, Front, and Side views of the cube arrangement.`,
    maxWidth: Math.max(300, svgW),
  });
},
  // ==========================================
  // P5/P6 MATH HEURISTIC ENGINE
  // ==========================================
  unitModel(params) {
    // Backwards-compatible unwrap: master template documents the WRAPPED format
    // `{unitModel: {models: [...]}}` but legacy callers pass `{models: [...]}` directly.
    // Same convention as circuitDiagram (see line ~278).
    const data = (params && params.unitModel) ? params.unitModel : (params || {});
    if (!data || !data.models) return '';
    // Uses the Sage-Rose glassmorphism design tokens
    let svg = `<rect width="100%" height="100%" fill="var(--glass-bg, rgba(255,255,255,0.7))" rx="8"/>`;
    let y = 40;

    data.models.forEach(model => {
      svg += `<text x="20" y="${y + 15}" fill="var(--text-main, #1a2e2a)" font-size="14" font-weight="bold">${this._esc(model.label)}</text>`;
      let x = 100;
      model.parts.forEach(part => {
        const width = part.width || 40;
        const fill = part.shaded ? 'var(--brand-rose, #B76E79)' : 'var(--glass-bg, rgba(255,255,255,0.7))';
        const opacity = part.shaded ? '0.3' : '1';
        const strokeDash = part.dashed ? 'stroke-dasharray="4,4"' : '';

        svg += `<rect x="${x}" y="${y}" width="${width}" height="24" fill="${fill}" fill-opacity="${opacity}" stroke="var(--brand-sage, #51615E)" stroke-width="2" ${strokeDash}/>`;

        if (part.label) {
          svg += `<text x="${x + width / 2}" y="${y + 16}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="12">${this._esc(part.label)}</text>`;
        }
        x += width;
      });
      y += 40;
    });
    return this._svg(svg, { viewBox: '0 0 500 ' + (y + 20) });
  },

  // ==========================================
  // P5/P6 SCIENCE SCHEMATIC ENGINE
  // ==========================================
  /**
   * Electrical circuit diagram — supports series, parallel, and mixed arrangements.
   *
   * Schema:
   *   {
   *     "title":       "...",                       // optional
   *     "arrangement": "series" | "parallel" | "mixed",   // required
   *     "components":  [
   *       {"type": "battery"},
   *       {"type": "switch", "label": "S1", "isOpen": true,  "branch": "top"},
   *       {"type": "bulb",   "label": "B1", "fused":  false, "branch": "top"},
   *       ...
   *     ]
   *   }
   *
   * branch values:
   *   - series mode: ignored (all components on one loop)
   *   - parallel mode: 'top' | 'middle' | 'bottom' — assigns to one of 3 rails
   *   - mixed mode:   'series' = on the main path; 'top'/'bottom' = on a parallel sub-branch
   *
   * Backwards-compatible: if `arrangement` is missing, falls back to series rendering.
   * Backwards-compatible: if `data.circuitDiagram` is present (old nested format),
   *                        unwraps it automatically.
   */
  circuitDiagram(params) {
    // ── Unwrap legacy nested format ────────────────────────────────────────
    const data = (params && params.circuitDiagram) ? params.circuitDiagram : (params || {});
    if (!data || !Array.isArray(data.components) || !data.components.length) return '';
 
    const arrangement = (data.arrangement || data.circuitArrangement || 'series').toLowerCase();
    const VB_W = 400, VB_H = 240;
    const esc  = this._esc.bind(this);
 
    let svg = `<rect width="100%" height="100%" fill="var(--glass-bg, rgba(255,255,255,0.7))" rx="8" stroke="var(--border-light, #d6e3dc)" />`;
 
    // Title
    if (data.title) {
      svg += `<text x="${VB_W / 2}" y="22" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="700">${esc(data.title)}</text>`;
    }
 
    // ── Component drawing primitives ───────────────────────────────────────
    const drawBattery = (cx, cy) => {
      // Wire-break + two vertical lines (short = −, long = +)
      let s = `<line x1="${cx - 10}" y1="${cy}" x2="${cx + 10}" y2="${cy}" stroke="var(--glass-bg, rgba(255,255,255,0.7))" stroke-width="6"/>`;
      s    += `<line x1="${cx - 5}" y1="${cy - 10}" x2="${cx - 5}" y2="${cy + 10}" stroke="var(--text-main, #1a2e2a)" stroke-width="2"/>`;
      s    += `<line x1="${cx + 5}" y1="${cy - 14}" x2="${cx + 5}" y2="${cy + 14}" stroke="var(--text-main, #1a2e2a)" stroke-width="2"/>`;
      return s;
    };
 
    const drawBulb = (cx, cy, comp) => {
      const stroke = comp.fused ? 'var(--brand-rose, #B76E79)' : 'var(--brand-sage, #51615E)';
      const r = 13;
      let s = `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="var(--glass-bg, rgba(255,255,255,0.7))" stroke-width="6"/>`;
      s    += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--glass-bg, rgba(255,255,255,0.7))" stroke="${stroke}" stroke-width="2"/>`;
      // MOE filament cross
      s    += `<path d="M ${cx - 9} ${cy - 9} L ${cx + 9} ${cy + 9} M ${cx - 9} ${cy + 9} L ${cx + 9} ${cy - 9}" stroke="${stroke}" stroke-width="1.8"/>`;
      // Label below the bulb
      if (comp.label) {
        s += `<text x="${cx}" y="${cy + r + 14}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="11" font-weight="600">${esc(comp.label)}</text>`;
      }
      return s;
    };
 
    const drawSwitch = (cx, cy, comp) => {
      let s = `<line x1="${cx - 10}" y1="${cy}" x2="${cx + 10}" y2="${cy}" stroke="var(--glass-bg, rgba(255,255,255,0.7))" stroke-width="6"/>`;
      s    += `<circle cx="${cx - 7}" cy="${cy}" r="2.5" fill="var(--text-main, #1a2e2a)"/>`;
      s    += `<circle cx="${cx + 7}" cy="${cy}" r="2.5" fill="var(--text-main, #1a2e2a)"/>`;
      if (comp.isOpen) {
        s += `<line x1="${cx - 7}" y1="${cy}" x2="${cx + 6}" y2="${cy - 9}" stroke="var(--text-main, #1a2e2a)" stroke-width="2"/>`;
      } else {
        s += `<line x1="${cx - 7}" y1="${cy}" x2="${cx + 7}" y2="${cy}" stroke="var(--text-main, #1a2e2a)" stroke-width="2"/>`;
      }
      // Label above the switch
      if (comp.label) {
        s += `<text x="${cx}" y="${cy - 12}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="10" font-weight="600">${esc(comp.label)}</text>`;
      }
      return s;
    };
 
    const drawGap = (cx, cy, comp) => {
      let s = `<line x1="${cx - 10}" y1="${cy}" x2="${cx + 10}" y2="${cy}" stroke="var(--glass-bg, rgba(255,255,255,0.7))" stroke-width="6"/>`;
      s    += `<circle cx="${cx - 7}" cy="${cy}" r="3" fill="var(--brand-rose, #B76E79)"/>`;
      s    += `<circle cx="${cx + 7}" cy="${cy}" r="3" fill="var(--brand-rose, #B76E79)"/>`;
      if (comp.label) {
        s += `<text x="${cx}" y="${cy - 12}" text-anchor="middle" fill="var(--brand-rose, #B76E79)" font-size="10" font-weight="700">${esc(comp.label)}</text>`;
      }
      return s;
    };
 
    const drawComponent = (cx, cy, comp) => {
      switch (comp.type) {
        case 'battery': return drawBattery(cx, cy);
        case 'bulb':    return drawBulb(cx, cy, comp);
        case 'switch':  return drawSwitch(cx, cy, comp);
        case 'gap':     return drawGap(cx, cy, comp);
        default:        return '';
      }
    };
 
    // ── ARRANGEMENT: SERIES ────────────────────────────────────────────────
    // Single rectangular wire loop. Battery on top edge centre. Other components
    // distributed evenly along the loop (top → right → bottom in reading order).
    if (arrangement === 'series') {
      const X1 = 60, X2 = VB_W - 60, Y1 = 75, Y2 = VB_H - 50;
 
      // Wire loop
      svg += `<path d="M ${X1} ${Y1} L ${X2} ${Y1} L ${X2} ${Y2} L ${X1} ${Y2} Z" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
 
      // Position battery first (always on top edge)
      const battery = data.components.find(c => c.type === 'battery');
      const others  = data.components.filter(c => c !== battery);
 
      if (battery) svg += drawBattery((X1 + X2) / 2, Y1);
 
      // Distribute other components — 1 on top split, then right edge, then bottom edge,
      // then left edge — to look like real series circuit
      const n = others.length;
      // 4 perimeter "slots": top-left of battery, right edge, bottom (reversed), left edge
      const positions = [];
      // For up to 3 components, place them: right, bottom-centre, left
      if (n === 1) {
        positions.push({ x: X2,            y: (Y1 + Y2) / 2 });            // right
      } else if (n === 2) {
        positions.push({ x: X2,            y: (Y1 + Y2) / 2 });            // right
        positions.push({ x: (X1 + X2) / 2, y: Y2 });                       // bottom
      } else if (n === 3) {
        positions.push({ x: X2,            y: (Y1 + Y2) / 2 });            // right
        positions.push({ x: (X1 + X2) / 2, y: Y2 });                       // bottom
        positions.push({ x: X1,            y: (Y1 + Y2) / 2 });            // left
      } else {
        // 4+ components: distribute evenly along bottom edge + corners
        positions.push({ x: X2, y: Y1 + (Y2 - Y1) / 3 });
        positions.push({ x: X2, y: Y1 + 2 * (Y2 - Y1) / 3 });
        const bottomN = n - 2;
        for (let i = 0; i < bottomN; i++) {
          const t = (i + 1) / (bottomN + 1);
          positions.push({ x: X2 - t * (X2 - X1), y: Y2 });
        }
      }
 
      others.forEach((comp, i) => {
        const pos = positions[i] || { x: (X1 + X2) / 2, y: Y2 };
        svg += drawComponent(pos.x, pos.y, comp);
      });
    }
 
    // ── ARRANGEMENT: PARALLEL ──────────────────────────────────────────────
    // Battery on left edge; horizontal rails (top/middle/bottom) connect to
    // a vertical bus on the right. Each component on a rail = one parallel branch.
    else if (arrangement === 'parallel') {
      const X1 = 80, X2 = VB_W - 50;
      const Y_BAT = VB_H / 2;
      const battery = data.components.find(c => c.type === 'battery');
      const others  = data.components.filter(c => c !== battery);
 
      // Group components by branch (top/middle/bottom). Default: distribute evenly.
      const branches = { top: [], middle: [], bottom: [] };
      const explicit = others.some(c => c.branch);
      if (explicit) {
        others.forEach(c => {
          const b = (c.branch || 'middle').toLowerCase();
          (branches[b] || branches.middle).push(c);
        });
      } else {
        // No explicit branch: 1 per rail, top→middle→bottom
        const rails = ['top', 'middle', 'bottom'];
        others.forEach((c, i) => branches[rails[i % 3]].push(c));
      }
 
      // Determine which rails are used
      const usedRails = ['top', 'middle', 'bottom'].filter(r => branches[r].length > 0);
      if (!usedRails.length) usedRails.push('middle');
      const railY = { top: 80, middle: 130, bottom: 180 };
 
      // Left vertical bus (from battery to rails)
      const yMin = Math.min(...usedRails.map(r => railY[r]));
      const yMax = Math.max(...usedRails.map(r => railY[r]));
      svg += `<line x1="${X1}" y1="${yMin}" x2="${X1}" y2="${yMax}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
      // Right vertical bus
      svg += `<line x1="${X2}" y1="${yMin}" x2="${X2}" y2="${yMax}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
 
      // Battery wire: from middle of left bus down/up to battery position
      // Battery is drawn on a short branch to the left of the left bus
      const BAT_X = X1 - 25;
      svg += `<line x1="${BAT_X}" y1="${Y_BAT}" x2="${X1}" y2="${Y_BAT}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
      // If battery position isn't on the bus span, extend the bus
      if (Y_BAT < yMin) svg += `<line x1="${X1}" y1="${Y_BAT}" x2="${X1}" y2="${yMin}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
      if (Y_BAT > yMax) svg += `<line x1="${X1}" y1="${yMax}" x2="${X1}" y2="${Y_BAT}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
 
      // Left side wire: battery → top of left bus
      svg += `<line x1="${BAT_X}" y1="${Y_BAT}" x2="${BAT_X}" y2="35" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
      svg += `<line x1="${BAT_X}" y1="35" x2="${X2 + 25}" y2="35" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
      svg += `<line x1="${X2 + 25}" y1="35" x2="${X2 + 25}" y2="${Y_BAT}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
      svg += `<line x1="${X2 + 25}" y1="${Y_BAT}" x2="${X2}" y2="${Y_BAT}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
      if (Y_BAT < yMin || Y_BAT > yMax) {
        // wire from outer right bus into the rails
      }
 
      svg += drawBattery(BAT_X, Y_BAT);
 
      // Draw each rail with its components
      usedRails.forEach(rail => {
        const y = railY[rail];
        svg += `<line x1="${X1}" y1="${y}" x2="${X2}" y2="${y}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
 
        const comps = branches[rail];
        const railLen = X2 - X1;
        comps.forEach((comp, i) => {
          const cx = X1 + railLen * (i + 1) / (comps.length + 1);
          svg += drawComponent(cx, y, comp);
        });
      });
    }
 
    // ── ARRANGEMENT: MIXED ─────────────────────────────────────────────────
    // Components with branch='series' (or no branch) sit on the main loop.
    // Components with branch='top' or 'bottom' sit on a parallel sub-branch
    // attached at the centre-bottom of the main loop.
    else if (arrangement === 'mixed') {
      const X1 = 60, X2 = VB_W - 60, Y1 = 70, Y2_TOP = 140;  // upper loop
      const Y_SUB = 195;                                       // lower parallel branch
 
      const battery = data.components.find(c => c.type === 'battery');
      const series  = data.components.filter(c => c !== battery && (c.branch === 'series' || !c.branch));
      const top     = data.components.filter(c => c.branch === 'top');
      const bottom  = data.components.filter(c => c.branch === 'parallel' || c.branch === 'bottom');
 
      // Main upper loop
      svg += `<path d="M ${X1} ${Y1} L ${X2} ${Y1} L ${X2} ${Y2_TOP} L ${X1} ${Y2_TOP} Z" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
 
      // Battery on top edge
      if (battery) svg += drawBattery((X1 + X2) / 2, Y1);
 
      // Series components distributed along right edge → bottom of upper loop → left edge
      const seriesPositions = [];
      const n = series.length;
      if (n === 1) {
        seriesPositions.push({ x: (X1 + X2) / 2, y: Y2_TOP });
      } else if (n === 2) {
        seriesPositions.push({ x: X1 + (X2 - X1) * 0.33, y: Y2_TOP });
        seriesPositions.push({ x: X1 + (X2 - X1) * 0.67, y: Y2_TOP });
      } else {
        for (let i = 0; i < n; i++) {
          const t = (i + 1) / (n + 1);
          seriesPositions.push({ x: X1 + (X2 - X1) * t, y: Y2_TOP });
        }
      }
      series.forEach((comp, i) => {
        svg += drawComponent(seriesPositions[i].x, seriesPositions[i].y, comp);
      });
 
      // Parallel sub-branch: vertical drops from upper loop to sub-branch wire
      if (top.length || bottom.length) {
        const subList = bottom.length ? bottom : top;
        // Drops at left and right of sub-branch
        const subX1 = X1 + 40, subX2 = X2 - 40;
        svg += `<line x1="${subX1}" y1="${Y2_TOP}" x2="${subX1}" y2="${Y_SUB}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
        svg += `<line x1="${subX2}" y1="${Y2_TOP}" x2="${subX2}" y2="${Y_SUB}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
        svg += `<line x1="${subX1}" y1="${Y_SUB}" x2="${subX2}" y2="${Y_SUB}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
 
        // Distribute parallel components on the sub-branch
        subList.forEach((comp, i) => {
          const cx = subX1 + (subX2 - subX1) * (i + 1) / (subList.length + 1);
          svg += drawComponent(cx, Y_SUB, comp);
        });
      }
    }
 
    // ── FALLBACK: unknown arrangement → render as series ───────────────────
    else {
      // Fall back to series rendering with a console warning
      if (typeof console !== 'undefined') {
        console.warn(`[circuitDiagram] Unknown arrangement "${arrangement}", rendering as series.`);
      }
      const X1 = 60, X2 = VB_W - 60, Y1 = 75, Y2 = VB_H - 50;
      svg += `<path d="M ${X1} ${Y1} L ${X2} ${Y1} L ${X2} ${Y2} L ${X1} ${Y2} Z" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
      const battery = data.components.find(c => c.type === 'battery');
      const others  = data.components.filter(c => c !== battery);
      if (battery) svg += drawBattery((X1 + X2) / 2, Y1);
      others.forEach((comp, i) => {
        const t = (i + 1) / (others.length + 1);
        svg += drawComponent(X1 + (X2 - X1) * t, Y2, comp);
      });
    }
 
    return this._svg(svg, {
      viewBox: `0 0 ${VB_W} ${VB_H}`,
      alt: `Electrical circuit diagram (${arrangement}). ${data.components.length} components.`,
      maxWidth: VB_W,
    });
  },
  
  /**
   * 🕸️ MOE Concept Map Engine (Hardened & Scaled)
   */
  conceptMap(params) {
    let p = params;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } }

    let rawNodes = p.nodes;
    if (typeof rawNodes === 'string') { try { rawNodes = JSON.parse(rawNodes); } catch (e) { rawNodes = []; } }
    const nodes = Array.isArray(rawNodes) ? rawNodes : [];

    let rawEdges = p.edges;
    if (typeof rawEdges === 'string') { try { rawEdges = JSON.parse(rawEdges); } catch (e) { rawEdges = []; } }
    const edges = Array.isArray(rawEdges) ? rawEdges : [];

    const width = 420, height = 260;

    let svg = `<svg viewBox="0 0 ${width} ${height}" style="width: 100%; max-width: 420px; height: auto; display: block; margin: 0 auto 1.5rem auto; background: var(--bg-surface, #ffffff); border-radius: 8px; border: 1px solid var(--border-light, #d6e3dc);" role="img" aria-label="Concept Map">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="24" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--brand-sage, #51615E)" />
        </marker>
      </defs>`;

    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (fromNode && toNode) {
        const x1 = Number((Number(fromNode.x) / 100) * width) || 0;
        const y1 = Number((Number(fromNode.y) / 100) * height) || 0;
        const x2 = Number((Number(toNode.x) / 100) * width) || 0;
        const y2 = Number((Number(toNode.y) / 100) * height) || 0;
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--brand-sage, #51615E)" stroke-width="2" marker-end="url(#arrowhead)"/>`;
      }
    });

    nodes.forEach(node => {
      const nx = Number((Number(node.x) / 100) * width) || 0;
      const ny = Number((Number(node.y) / 100) * height) || 0;
      svg += `
        <rect x="${nx - 40}" y="${ny - 12}" width="80" height="24" rx="12" fill="var(--bg-elevated, #f0f5f2)" stroke="var(--border-dark, #8da89e)" stroke-width="2"/>
        <text x="${nx}" y="${ny + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--text-main, #1a2e2a)" font-family="sans-serif">${this._esc(node.label)}</text>
      `;
    });

    return svg + `</svg>`;
  },
  /**
       

* 🚀 SMART FALLBACK: Universal Experiment Renderer

   * Catches hallucinated AI experiment functions and renders a clean UI card.
   */
  genericExperiment(params, functionName = '') {
    const esc = this._esc ? this._esc.bind(this) : (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // Parse nested object into beautifully formatted rows
    let rowsHtml = '';
    if (typeof params === 'object' && params !== null) {
      for (const [key, value] of Object.entries(params)) {
        const cleanKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        const cleanVal = typeof value === 'object' ? JSON.stringify(value) : value;
        rowsHtml += `
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted, #5d706b); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">${esc(cleanKey)}</div>
            <div style="font-size: 15px; color: var(--text-main, #1a2e2a); line-height: 1.5;">${esc(cleanVal)}</div>
          </div>`;
      }
    } else {
      rowsHtml = `<div style="color: var(--text-main, #1a2e2a); font-size: 15px; line-height: 1.5;">${esc(params)}</div>`;
    }

    const htmlContent = `
      <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; padding: 20px; box-sizing: border-box; background: var(--bg-elevated, #f0f5f2); border: 2px dashed var(--border-light, #d6e3dc); border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif;">
        <div style="font-weight: 800; font-size: 18px; margin-bottom: 16px; color: var(--brand-sage, #51615E); display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-light, #d6e3dc); padding-bottom: 12px;">
          <span>🔬</span> Experiment Setup
        </div>
        ${rowsHtml}
      </div>
    `;

    return `<svg viewBox="0 0 500 240" width="100%" style="height: auto; max-width: 450px; display: block; margin: 0 auto;" role="img" aria-label="Experiment setup">
      <foreignObject width="100%" height="100%">
        ${htmlContent}
      </foreignObject>
    </svg>`;
  },

  /**
     * 🚀 AI FUNCTION: Equilateral Triangle(s)
     * Draws a specified count of equilateral triangles with labelled base and tick marks.
     */
  equilateralTriangle(params) {
    const esc = this._esc ? this._esc.bind(this) : (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const unit = params.unit || 'cm';
    const sideLength = params.side_length || 10;

    // Fallback to 1, limit to 5 so we don't break the viewBox if the AI goes crazy
    const count = Math.max(1, Math.min(params.count || 1, 5));

    const vbW = 400, vbH = 260;
    const gap = 20;

    // Calculate max available width and height per triangle to maintain aspect ratio
    const maxW = (vbW - (count + 1) * gap) / count;
    const maxH = vbH - 60; // Leave 60px for bottom labels

    // Formula: height = width * (sqrt(3)/2)
    const drawW = Math.min(maxW, maxH / (Math.sqrt(3) / 2));
    const drawH = drawW * (Math.sqrt(3) / 2);

    let shapesHtml = '';

    for (let i = 0; i < count; i++) {
      // Calculate center point for each triangle in the sequence
      const cx = gap + (drawW / 2) + i * (drawW + gap);
      const cy = vbH / 2;

      const topX = cx, topY = cy - drawH / 2;
      const brX = cx + drawW / 2, brY = cy + drawH / 2;
      const blX = cx - drawW / 2, blY = cy + drawH / 2;

      const points = `${topX},${topY} ${brX},${brY} ${blX},${blY}`;
      shapesHtml += `<polygon points="${points}" fill="rgba(81, 97, 94, 0.05)" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;

      // Draw tick marks on all 3 sides to visually denote 'equilateral'
      const tickL = 6;
      // Left side tick
      shapesHtml += `<line x1="${(topX + blX) / 2 - tickL}" y1="${(topY + blY) / 2 + tickL / 2}" x2="${(topX + blX) / 2 + tickL}" y2="${(topY + blY) / 2 - tickL / 2}" stroke="var(--brand-rose, #B76E79)" stroke-width="2"/>`;
      // Right side tick
      shapesHtml += `<line x1="${(topX + brX) / 2 - tickL}" y1="${(topY + brY) / 2 - tickL / 2}" x2="${(topX + brX) / 2 + tickL}" y2="${(topY + brY) / 2 + tickL / 2}" stroke="var(--brand-rose, #B76E79)" stroke-width="2"/>`;
      // Bottom base tick
      shapesHtml += `<line x1="${cx}" y1="${brY - tickL}" x2="${cx}" y2="${brY + tickL}" stroke="var(--brand-rose, #B76E79)" stroke-width="2"/>`;

      // Base dimension label
      shapesHtml += `<text x="${cx}" y="${brY + 24}" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--text-main, #1a2e2a)">${esc(sideLength)}${esc(unit)}</text>`;
    }

    return this._svg(shapesHtml, { alt: `${count} equilateral triangle(s) with side length ${sideLength}${unit}` });
  },

  rulerMeasurement(params) {
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const item = params.item || 'Object';
    const unit = params.unit || 'cm';
    const minVal = params.min_value !== undefined ? params.min_value : 0;
    const maxVal = params.max_value !== undefined ? params.max_value : 15;
    const startRead = params.start_reading !== undefined ? params.start_reading : 0;
    const endRead = params.end_reading !== undefined ? params.end_reading : 10;

    const majorInt = params.major_interval || 1;
    const minorInt = params.minor_interval || 0.1;

    const svgW = 800;
    const svgH = 300;
    const margin = { top: 120, right: 60, bottom: 60, left: 60 };
    const drawW = svgW - margin.left - margin.right;
    const range = Math.max(1, maxVal - minVal);

    // Helper to map ruler values to SVG X coordinates
    const xMap = (val) => margin.left + ((val - minVal) / range) * drawW;

    let html = `<div style="font-family: 'Inter', system-ui, sans-serif; width: 100%; max-width: ${svgW}px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">`;
    html += `<svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%">`;

    // 1. Draw the Ruler Body
    html += `<rect x="${margin.left - 20}" y="${margin.top}" width="${drawW + 40}" height="70" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" rx="6"/>`;

    // 2. Draw Ruler Ticks and Numbers
    const eps = minorInt / 100; // Epsilon to handle JS floating point math
    for (let v = minVal; v <= maxVal + eps; v += minorInt) {
      const x = xMap(v);

      // Determine if it's a major, half, or minor tick
      const remainder = Math.abs((v - minVal) % majorInt);
      const isMajor = remainder < eps || remainder > majorInt - eps;
      const halfRemainder = Math.abs((v - minVal) % (majorInt / 2));
      const isHalf = !isMajor && (halfRemainder < eps || halfRemainder > (majorInt / 2) - eps);

      let tickH = 8, strokeW = 1.5;
      if (isMajor) { tickH = 20; strokeW = 2; }
      else if (isHalf) { tickH = 14; strokeW = 1.5; }

      html += `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + tickH}" stroke="#334155" stroke-width="${strokeW}"/>`;

      if (isMajor) {
        const labelVal = Math.round(v * 100) / 100; // Clean decimal output
        html += `<text x="${x}" y="${margin.top + 45}" text-anchor="middle" font-size="15" font-weight="600" fill="#334155">${labelVal}</text>`;
      }
    }

    // Unit Label on the right edge of the ruler
    html += `<text x="${svgW - margin.right + 5}" y="${margin.top + 45}" text-anchor="end" font-size="14" font-weight="700" fill="#64748b">${esc(unit)}</text>`;

    // 3. Draw the Object (e.g., Pencil or Box)
    const objStartX = xMap(Math.min(startRead, endRead));
    const objEndX = xMap(Math.max(startRead, endRead));
    const objW = objEndX - objStartX;
    const objY = margin.top - 45;
    const objH = 30;

    if (item.toLowerCase().includes('pencil')) {
      // Draw a pencil shape
      const bodyW = objW * 0.8;
      html += `<rect x="${objStartX}" y="${objY}" width="${bodyW}" height="${objH}" fill="#FBBF24" stroke="#B45309" stroke-width="2"/>`;
      // Pencil Tip
      html += `<polygon points="${objStartX + bodyW},${objY} ${objEndX},${objY + objH / 2} ${objStartX + bodyW},${objY + objH}" fill="#FDE68A" stroke="#B45309" stroke-width="2"/>`;
      // Pencil Lead
      html += `<polygon points="${objEndX - objW * 0.05},${objY + objH / 2 - 3} ${objEndX},${objY + objH / 2} ${objEndX - objW * 0.05},${objY + objH / 2 + 3}" fill="#334155"/>`;
      // Eraser End
      html += `<rect x="${objStartX - 10}" y="${objY}" width="10" height="${objH}" fill="#FCA5A5" stroke="#B45309" stroke-width="2" rx="2"/>`;
    } else {
      // Generic rectangular block for anything else
      html += `<rect x="${objStartX}" y="${objY}" width="${objW}" height="${objH}" fill="var(--brand-mint, #10B981)" stroke="#059669" stroke-width="2" rx="4"/>`;
      html += `<text x="${objStartX + objW / 2}" y="${objY + 20}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${esc(item.toUpperCase())}</text>`;
    }

    // 4. Draw Dotted Guide Lines
    html += `<line x1="${objStartX}" y1="${objY - 10}" x2="${objStartX}" y2="${margin.top}" stroke="#EF4444" stroke-width="2" stroke-dasharray="6 4"/>`;
    html += `<line x1="${objEndX}" y1="${objY - 10}" x2="${objEndX}" y2="${margin.top}" stroke="#EF4444" stroke-width="2" stroke-dasharray="6 4"/>`;

    // 5. Title
    if (params.title) {
      html += `<text x="${svgW / 2}" y="35" text-anchor="middle" font-size="18" font-weight="700" fill="#1e293b">${esc(params.title)}</text>`;
    }

    html += `</svg>`;
    if (params.notes) {
      html += `<div style="margin-top: 12px; text-align: center; font-size: 13px; color: #64748b;"><em>${esc(params.notes)}</em></div>`;
    }
    html += `</div>`;

    return html;
  },

  verticalBarChart(params) {
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const title = params.title || '';
    const xAxisLabel = params.xAxisLabel || '';
    const yAxisLabel = params.yAxisLabel || '';
    const data = params.data || [];
    const yMin = params.yAxisMin !== undefined ? params.yAxisMin : 0;

    // Calculate max if not provided
    let calcMax = 10;
    data.forEach(d => { if (typeof d.value === 'number' && d.value > calcMax) calcMax = d.value; });
    const yMax = params.yAxisMax !== undefined ? params.yAxisMax : calcMax;
    const yStep = params.yAxisStep || Math.max(1, Math.ceil((yMax - yMin) / 5));

    const svgW = 600;
    const svgH = 400;
    const margin = { top: 50, right: 40, bottom: 60, left: 70 };
    const chartW = svgW - margin.left - margin.right;
    const chartH = svgH - margin.top - margin.bottom;

    let html = `<div style="font-family: 'Inter', system-ui, sans-serif; width: 100%; max-width: ${svgW}px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">`;
    html += `<svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%">`;

    // Title
    if (title) {
      html += `<text x="${svgW / 2}" y="25" text-anchor="middle" font-size="18" font-weight="700" fill="#1e293b">${esc(title)}</text>`;
    }

    // Y-Axis Label
    if (yAxisLabel) {
      html += `<text x="-${margin.top + chartH / 2}" y="20" transform="rotate(-90)" text-anchor="middle" font-size="14" font-weight="600" fill="#64748b">${esc(yAxisLabel)}</text>`;
    }

    // X-Axis Label
    if (xAxisLabel) {
      html += `<text x="${margin.left + chartW / 2}" y="${svgH - 10}" text-anchor="middle" font-size="14" font-weight="600" fill="#64748b">${esc(xAxisLabel)}</text>`;
    }

    // Grid & Y-Axis values
    const yRange = Math.max(1, yMax - yMin);
    for (let yVal = yMin; yVal <= yMax; yVal += yStep) {
      const yPos = margin.top + chartH - ((yVal - yMin) / yRange) * chartH;
      // Grid line
      html += `<line x1="${margin.left}" y1="${yPos}" x2="${svgW - margin.right}" y2="${yPos}" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4 4"/>`;
      // Label
      html += `<text x="${margin.left - 15}" y="${yPos + 5}" text-anchor="end" font-size="13" font-weight="500" fill="#475569">${yVal}</text>`;
    }

    // Base X-Axis line
    html += `<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${svgW - margin.right}" y2="${margin.top + chartH}" stroke="#64748b" stroke-width="2"/>`;

    // Bars
    const n = data.length;
    if (n > 0) {
      const barSpacing = chartW / n;
      const barW = Math.min(barSpacing * 0.6, 60);

      data.forEach((d, i) => {
        const xCenter = margin.left + (i + 0.5) * barSpacing;
        const xPos = xCenter - barW / 2;

        // X-Axis label
        html += `<text x="${xCenter}" y="${margin.top + chartH + 24}" text-anchor="middle" font-size="13" font-weight="600" fill="#334155">${esc(d.label)}</text>`;

        // "COVERED" DATA LOGIC
        if (d.value === 'covered') {
          const coverY = margin.top + chartH * 0.2;
          const coverH = chartH * 0.8;

          // Draw a literal "Ink Splatter" blob to hide the bar!
          html += `<path d="M ${xPos - 10} ${coverY + 20} Q ${xCenter} ${coverY - 20} ${xPos + barW + 10} ${coverY + 10} L ${xPos + barW + 15} ${coverY + coverH} L ${xPos - 15} ${coverY + coverH} Z" fill="#94a3b8" opacity="0.9"/>`;
          html += `<text x="${xCenter}" y="${coverY + coverH / 2}" text-anchor="middle" font-size="32" font-weight="bold" fill="#ffffff">?</text>`;
          html += `<text x="${xCenter}" y="${coverY + coverH / 2 + 25}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff" letter-spacing="1">INK SPILL</text>`;
        }
        // NORMAL DATA LOGIC
        else {
          const val = parseFloat(d.value) || 0;
          const barH = ((val - yMin) / yRange) * chartH;
          const yPos = margin.top + chartH - barH;

          html += `<rect x="${xPos}" y="${yPos}" width="${barW}" height="${barH}" fill="var(--brand-mint, #10B981)" rx="3" ry="3" stroke="#059669" stroke-width="2"/>`;
        }
      });
    }

    html += `</svg>`;
    if (params.notes) {
      html += `<div style="margin-top: 12px; text-align: center; font-size: 13px; color: #64748b;"><em>${esc(params.notes)}</em></div>`;
    }
    html += `</div>`;

    return html;
  },

  // 🚀 AI FUNCTION: Pie Chart Generator
  pieChart(params) {
    // ADD THIS LINE RIGHT HERE:
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const { data = [], title = "" } = params;
    const w = 400, h = 260;

    // Position the pie slightly to the left to leave room for the legend
    const cx = 130, cy = 140, r = 90;

    // Calculate total to determine the angles
    const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    if (total === 0) return this._svg(`<text x="200" y="130" text-anchor="middle" fill="var(--text-muted, #5d706b)">No data provided</text>`, { alt: "Empty Pie Chart" });

    // Superholic-themed palette (Rose, Sage, Amber, Muted Blue, Gold, Slate)
    const colors = ['#B76E79', '#51615E', '#D97706', '#728984', '#E6B885', '#A5B5B1'];

    let currentAngle = -Math.PI / 2; // Start drawing at 12 o'clock
    let slices = '';
    let legend = '';

    data.forEach((item, i) => {
      const val = Number(item.value) || 0;
      const sliceAngle = (val / total) * (2 * Math.PI);
      const color = colors[i % colors.length];

      // Safe-catch for 100% full circle
      if (sliceAngle >= 2 * Math.PI - 0.001) {
        slices += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
      } else if (sliceAngle > 0) {
        // Calculate SVG path points using Trigonometry
        const startX = cx + r * Math.cos(currentAngle);
        const startY = cy + r * Math.sin(currentAngle);
        const endAngle = currentAngle + sliceAngle;
        const endX = cx + r * Math.cos(endAngle);
        const endY = cy + r * Math.sin(endAngle);

        // If the slice is more than half the circle, we need the large-arc-flag
        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

        // SVG Path Command: M(ove to center) L(ine to edge) A(rc to next point) Z(close to center)
        const pathData = [
          `M ${cx} ${cy}`,
          `L ${startX} ${startY}`,
          `A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          `Z`
        ].join(' ');

        slices += `<path d="${pathData}" fill="${color}" stroke="#fff" stroke-width="1.5" />`;

        // Add percentage label inside the slice (if it's wide enough to fit text)
        if (sliceAngle > 0.3) {
          const midAngle = currentAngle + sliceAngle / 2;
          const labelR = r * 0.65; // Position text 65% of the way to the edge
          const lx = cx + labelR * Math.cos(midAngle);
          const ly = cy + labelR * Math.sin(midAngle) + 4; // +4 to vertically center text
          const pct = Math.round((val / total) * 100) + '%';
          slices += `<text x="${lx}" y="${ly}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="bold">${pct}</text>`;
        }

        currentAngle = endAngle;
      }

      // Build the Legend on the right side
      const legX = 250;
      const legY = 80 + (i * 24); // Space each item 24px apart vertically

      legend += `
        <rect x="${legX}" y="${legY - 11}" width="14" height="14" fill="${color}" rx="3"/>
        <text x="${legX + 22}" y="${legY}" font-size="12" fill="var(--text-main, #1a2e2a)" font-weight="500">${esc(item.label)}</text>
      `;
    });

    const titleEl = title ? `<text x="200" y="30" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--text-main, #1a2e2a)">${esc(title)}</text>` : '';

    return this._svg(`
      ${titleEl}
      ${slices}
      ${legend}
    `, { alt: title || 'Pie Chart' });
  },

  // 🚀 AI FUNCTION: Dynamic Polygon Generator (Draws any N-sided shape)
  polygon(params) {
    const w = 400, h = 260;
    const cx = 200, cy = 130;
    const r = 90; // Radius for the polygon

    // 1. Extract and normalize vertices
    const rawVertices = params.vertices || [];
    // The AI sometimes passes strings ['A','B'] or objects [{label: 'A'}, {label: 'B'}]
    const vertices = rawVertices.map(v => typeof v === 'string' ? v : (v.label || ''));

    // Fallback to a triangle if something goes wrong
    const n = vertices.length > 2 ? vertices.length : 3;

    let points = [];
    let labelsHtml = '';
    let angleArcsHtml = '';

    // Start drawing from the top center
    const startAngle = -Math.PI / 2;

    // 2. Calculate coordinates for each vertex
    for (let i = 0; i < n; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / n;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      points.push(`${px},${py}`);

      // Push labels slightly outside the shape
      const labelR = r + 20;
      const lx = cx + labelR * Math.cos(angle);
      const ly = cy + labelR * Math.sin(angle);

      // Smart text alignment based on position
      const baseline = ly > cy + 10 ? 'hanging' : (ly < cy - 10 ? 'auto' : 'middle');
      const anchor = lx > cx + 10 ? 'start' : (lx < cx - 10 ? 'end' : 'middle');

      labelsHtml += `<text x="${lx}" y="${ly}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)" text-anchor="${anchor}" dominant-baseline="${baseline}">${vertices[i]}</text>`;
    }

    // 3. Draw the main shape
    const polygonHtml = `<polygon points="${points.join(' ')}" fill="rgba(81, 97, 94, 0.05)" stroke="var(--border-dark, #ccc)" stroke-width="3"/>`;

    // 4. Mark the specific angle to measure (e.g., 'HIJ')
    const angleToMeasure = params.angle_to_measure;
    if (angleToMeasure && angleToMeasure.length === 3) {
      // Find the middle letter (the actual corner we are measuring)
      const targetVertex = angleToMeasure[1];
      const targetIdx = vertices.indexOf(targetVertex);

      if (targetIdx !== -1) {
        // Place a question mark "?" slightly inward from that specific corner
        const targetAngle = startAngle + (targetIdx * 2 * Math.PI) / n;
        const textR = r - 25;
        const tx = cx + textR * Math.cos(targetAngle);
        const ty = cy + textR * Math.sin(targetAngle);

        angleArcsHtml += `<text x="${tx}" y="${ty + 6}" font-size="18" font-weight="bold" fill="var(--brand-rose, #B76E79)" text-anchor="middle">?</text>`;
      }
    }

    // 5. Render final SVG
    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">
        ${polygonHtml}
        ${angleArcsHtml}
        ${labelsHtml}
      </svg>
    `;
  },

  // 🚀 AI FUNCTION: Isometric Cuboid / Water Tank
  cuboid(params) {
    const esc = this._esc ? this._esc.bind(this) : (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lLabel = params.length_label || '';
    const bLabel = params.breadth_label || '';
    const hLabel = params.height_label || '';
    const waterLevel = params.water_level || null;

    const w = 400, h = 260;
    const fx = 100, fy = 80, fw = 150, fh = 120;
    const depthX = 60, depthY = -40;

    let svg = '';
    // Back edges (dashed to show depth)
    svg += `<line x1="${fx + depthX}" y1="${fy + depthY}" x2="${fx + fw + depthX}" y2="${fy + depthY}" stroke="var(--border-dark, #ccc)" stroke-width="1.5" stroke-dasharray="4"/>`;
    svg += `<line x1="${fx + depthX}" y1="${fy + depthY}" x2="${fx + depthX}" y2="${fy + fh + depthY}" stroke="var(--border-dark, #ccc)" stroke-width="1.5" stroke-dasharray="4"/>`;
    svg += `<line x1="${fx + depthX}" y1="${fy + fh + depthY}" x2="${fx}" y2="${fy + fh}" stroke="var(--border-dark, #ccc)" stroke-width="1.5" stroke-dasharray="4"/>`;

    // Render Water Level inside the tank
    if (waterLevel) {
      const wl = Math.max(0, Math.min(1, parseFloat(waterLevel)));
      const wH = fh * wl;
      const wY = fy + fh - wH;
      // Top water surface
      svg += `<polygon points="${fx},${wY} ${fx + depthX},${wY + depthY} ${fx + fw + depthX},${wY + depthY} ${fx + fw},${wY}" fill="rgba(16, 185, 129, 0.2)" stroke="var(--brand-mint, #10B981)" stroke-width="1"/>`;
      // Front water face
      svg += `<rect x="${fx}" y="${wY}" width="${fw}" height="${wH}" fill="rgba(16, 185, 129, 0.15)" stroke="none"/>`;
      // Right water face
      svg += `<polygon points="${fx + fw},${wY} ${fx + fw + depthX},${wY + depthY} ${fx + fw + depthX},${fy + fh + depthY} ${fx + fw},${fy + fh}" fill="rgba(16, 185, 129, 0.25)" stroke="none"/>`;
    }

    // Visible Outer Edges
    svg += `<polygon points="${fx},${fy} ${fx + depthX},${fy + depthY} ${fx + fw + depthX},${fy + depthY} ${fx + fw},${fy}" fill="rgba(240, 244, 243, 0.3)" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
    svg += `<polygon points="${fx + fw},${fy} ${fx + fw + depthX},${fy + depthY} ${fx + fw + depthX},${fy + fh + depthY} ${fx + fw},${fy + fh}" fill="rgba(240, 244, 243, 0.5)" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
    svg += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;

    // Dimension Labels
    if (lLabel) svg += `<text x="${fx + fw / 2}" y="${fy + fh + 20}" font-size="14" font-weight="bold" text-anchor="middle" fill="var(--text-main, #1a2e2a)">${esc(lLabel)}</text>`;
    if (hLabel) svg += `<text x="${fx - 10}" y="${fy + fh / 2}" font-size="14" font-weight="bold" text-anchor="end" fill="var(--text-main, #1a2e2a)">${esc(hLabel)}</text>`;
    if (bLabel) svg += `<text x="${fx + fw + depthX / 2 + 10}" y="${fy + fh + depthY / 2 + 10}" font-size="14" font-weight="bold" fill="var(--text-main, #1a2e2a)">${esc(bLabel)}</text>`;

    return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">${svg}</svg>`;
  },

  // 🚀 AI FUNCTION: Parallelogram / Rhombus Generator
  parallelogram(params) {
    const esc = this._esc ? this._esc.bind(this) : (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const w = 400, h = 260;
    const v = params.vertices || ['A', 'B', 'C', 'D'];
    const px = 100, py = 70;
    const width = 160, height = 110, skew = 60;

    const tlX = px + skew, tlY = py;
    const trX = px + width + skew, trY = py;
    const brX = px + width, brY = py + height;
    const blX = px, blY = py + height;

    let svg = `<polygon points="${tlX},${tlY} ${trX},${trY} ${brX},${brY} ${blX},${blY}" fill="rgba(81, 97, 94, 0.05)" stroke="var(--brand-sage, #51615E)" stroke-width="3"/>`;

    if (params.show_diagonals) {
      svg += `<line x1="${tlX}" y1="${tlY}" x2="${brX}" y2="${brY}" stroke="var(--border-dark, #ccc)" stroke-width="1.5" stroke-dasharray="4"/>`;
      svg += `<line x1="${trX}" y1="${trY}" x2="${blX}" y2="${blY}" stroke="var(--border-dark, #ccc)" stroke-width="1.5" stroke-dasharray="4"/>`;
    }

    // Vertex Labels
    svg += `<text x="${tlX - 10}" y="${tlY - 5}" font-size="16" font-weight="bold" text-anchor="end" fill="var(--text-muted, #5d706b)">${esc(v[0])}</text>`;
    svg += `<text x="${trX + 10}" y="${trY - 5}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)">${esc(v[1])}</text>`;
    svg += `<text x="${brX + 10}" y="${brY + 20}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)">${esc(v[2])}</text>`;
    svg += `<text x="${blX - 10}" y="${brY + 20}" font-size="16" font-weight="bold" text-anchor="end" fill="var(--text-muted, #5d706b)">${esc(v[3])}</text>`;

    // Internal Angle Markers
    if (params.angle_arcs) {
      params.angle_arcs.forEach(arc => {
        const pt = arc.vertex === v[0] ? { x: tlX + 25, y: tlY + 22 } :
          arc.vertex === v[1] ? { x: trX - 25, y: trY + 22 } :
            arc.vertex === v[2] ? { x: brX - 28, y: brY - 15 } :
              { x: blX + 30, y: blY - 15 };
        svg += `<text x="${pt.x}" y="${pt.y}" font-size="14" font-weight="bold" text-anchor="middle" fill="var(--brand-rose, #B76E79)">${esc(arc.label)}</text>`;
      });
    }

    return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">${svg}</svg>`;
  },

  // 🚀 AI FUNCTION 1: Right Angle Divided
  rightAngleDivided(params) {
    const w = 400, h = 260;
    const cx = 200, cy = 200;
    const r = 160;

    const lines = params.lines || [];
    const angles = params.angles || [];
    const vertices = params.vertices || [];

    // Find the center vertex
    const center = lines.length > 0 ? lines[0].start : 'O';

    // Identify endpoints that form the straight line and right angle
    const rayEnds = lines.map(l => l.end);
    let baseEnds = vertices.filter(v => v !== center && !rayEnds.includes(v));

    let rightVertex = baseEnds[0] || 'A';
    let leftVertex = baseEnds[1] || 'B';

    let svg = `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="var(--border-dark, #ccc)" stroke-width="3"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="var(--brand-sage, #51615E)"/>`;

    // Right angle square indicator at the 90-degree mark
    svg += `<rect x="${cx}" y="${cy - 15}" width="15" height="15" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="1.5"/>`;

    let labelsHtml = `
      <text x="${cx + r + 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)">${rightVertex}</text>
      <text x="${cx - r - 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)">${leftVertex}</text>
      <text x="${cx}" y="${cy + 25}" font-size="16" font-weight="bold" text-anchor="middle" fill="var(--text-muted, #5d706b)">${center}</text>
    `;

    // Draw the rays (e.g., D, E, C at 30, 60, 90 degrees)
    rayEnds.forEach((endVertex, index) => {
      const totalRays = rayEnds.length;
      const angleDeg = (index + 1) * (90 / totalRays);
      const rad = angleDeg * Math.PI / 180;

      const rayX = cx + r * Math.cos(rad);
      const rayY = cy - r * Math.sin(rad);

      svg += `<line x1="${cx}" y1="${cy}" x2="${rayX}" y2="${rayY}" stroke="var(--text-main, #333)" stroke-width="2"/>`;
      labelsHtml += `<text x="${rayX + 10}" y="${rayY - 10}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)">${endVertex}</text>`;
    });

    // Angle labels (e.g., AOD, DOE, EOC)
    angles.forEach((ang, index) => {
      const label = typeof ang === 'string' ? ang : (ang.label || '?');
      const startAngle = index * (90 / rayEnds.length);
      const endAngle = (index + 1) * (90 / rayEnds.length);
      const midAngle = (startAngle + endAngle) / 2;
      const midRad = midAngle * Math.PI / 180;

      const textRadius = r * 0.4;
      const textX = cx + textRadius * Math.cos(midRad);
      const textY = cy - textRadius * Math.sin(midRad);

      labelsHtml += `<text x="${textX}" y="${textY}" font-size="14" font-weight="bold" text-anchor="middle" fill="var(--brand-sage, #51615E)">${label}</text>`;
    });

    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">
        ${svg}
        ${labelsHtml}
      </svg>
    `;
  },

  // 🚀 AI FUNCTION 2: Straight Line Divided
  straightLineDividedAngles(params) {
    const w = 400, h = 260;
    const cx = 200, cy = 200;
    const r = 160;

    const lines = params.lines || [];
    const angles = params.angles || [];
    const vertices = params.vertices || [];

    // Find the center vertex
    const center = lines.length > 0 ? lines[0].start : 'O';

    // Identify endpoints that form the straight line
    const rayEnds = lines.map(l => l.end);
    let baseEnds = vertices.filter(v => v !== center && !rayEnds.includes(v));

    let rightVertex = baseEnds[0] || 'P'; // placed at 0 degrees
    let leftVertex = baseEnds[1] || 'R';  // placed at 180 degrees

    let svg = `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="var(--border-dark, #ccc)" stroke-width="3"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="var(--brand-sage, #51615E)"/>`;

    let labelsHtml = `
      <text x="${cx + r + 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)">${rightVertex}</text>
      <text x="${cx - r - 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)">${leftVertex}</text>
      <text x="${cx}" y="${cy + 25}" font-size="16" font-weight="bold" text-anchor="middle" fill="var(--text-muted, #5d706b)">${center}</text>
    `;

    // Draw the rays dynamically spaced across 180 degrees
    const totalAngles = rayEnds.length + 1;
    rayEnds.forEach((endVertex, index) => {
      const angleDeg = (index + 1) * (180 / totalAngles);
      const rad = angleDeg * Math.PI / 180;

      const rayX = cx + r * Math.cos(rad);
      const rayY = cy - r * Math.sin(rad);

      svg += `<line x1="${cx}" y1="${cy}" x2="${rayX}" y2="${rayY}" stroke="var(--text-main, #333)" stroke-width="2"/>`;
      labelsHtml += `<text x="${rayX + 10}" y="${rayY - 10}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)">${endVertex}</text>`;
    });

    // Angle labels
    angles.forEach((ang, index) => {
      const label = typeof ang === 'string' ? ang : (ang.label || '?');
      const startAngle = index * (180 / totalAngles);
      const endAngle = (index + 1) * (180 / totalAngles);
      const midAngle = (startAngle + endAngle) / 2;
      const midRad = midAngle * Math.PI / 180;

      const textRadius = r * 0.45;
      const textX = cx + textRadius * Math.cos(midRad);
      const textY = cy - textRadius * Math.sin(midRad);

      labelsHtml += `<text x="${textX}" y="${textY}" font-size="14" font-weight="bold" text-anchor="middle" fill="var(--brand-sage, #51615E)">${label}</text>`;
    });

    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">
        ${svg}
        ${labelsHtml}
      </svg>
    `;
  },

  rectangleDividedRightAngle(params) {
    // ── v3 RENDERER ────────────────────────────────────────────────────────
    // Rectangle PQRS with two or more rays drawn from corner Q dividing the
    // 90° corner angle into smaller named angles.
    //
    // PREFERRED API (geometrically faithful — use this for new content):
    //   {
    //     "vertices": ["P","Q","R","S"],
    //     "rays": [
    //       { "name": "T", "at_deg": 68 },              // explicit position from +x axis
    //       { "name": "U", "from_side": "QR", "rotate_deg": 35 }  // OR rotate from a side
    //     ],
    //     "arcs": [
    //       { "between": ["P","T"], "label": "22°" },   // arc spans QP→QT, labelled inside
    //       { "between": ["T","U"], "label": "?" },
    //       { "between": ["U","R"], "label": "35°" }
    //     ]
    //   }
    //
    // LEGACY API (kept working for older question_bank rows):
    //   { "angles": [{ "name": "PQT", "value": "22°" }, ...] }
    //   Ray positions fall back to historical 60°/40° fallback positions.
    //
    // Coordinate system: SVG y is screen-flipped, but `at_deg` in the input
    // uses standard math convention — 0° = right (toward R), 90° = up (toward
    // P). The renderer converts internally.
    const w = 400, h = 260;
    const Q = { x: 50, y: 210 };
    const P = { x: 50, y: 50 };
    const R = { x: 350, y: 210 };
    const S = { x: 350, y: 50 };

    const v = params.vertices || ['P', 'Q', 'R', 'S'];
    const pName = v[0] || 'P';
    const qName = v[1] || 'Q';
    const rName = v[2] || 'R';
    const sName = v[3] || 'S';

    // Diagonal QS angle from +x axis (math degrees). S is up-right of Q so
    // the angle is between 0° and 90°.
    const sDiagDeg = Math.atan2(Q.y - S.y, S.x - Q.x) * 180 / Math.PI;

    // rayDeg: ray name → angle from +x axis at Q (math degrees, 0..90)
    const rayDeg = {
      [pName]: 90,
      [rName]: 0,
      [sName]: sDiagDeg,
    };

    // ── Resolve explicit rays ──────────────────────────────────────────────
    const explicitRays = Array.isArray(params.rays) ? params.rays : null;
    if (explicitRays) {
      explicitRays.forEach(r => {
        if (!r || !r.name) return;
        if (typeof r.at_deg === 'number') {
          rayDeg[r.name] = r.at_deg;
          return;
        }
        if (r.from_side && typeof r.rotate_deg === 'number') {
          const side = r.from_side.toString().toUpperCase();
          const baseDeg = side === `${qName}${pName}` ? 90
                        : side === `${qName}${rName}` ? 0
                        : side === `${qName}${sName}` ? sDiagDeg
                        : null;
          if (baseDeg === null) return;
          // Rotate toward the corner's interior (toward 45°)
          const sign = baseDeg >= 45 ? -1 : +1;
          rayDeg[r.name] = baseDeg + sign * r.rotate_deg;
        }
      });
    }

    // ── Resolve arcs (or derive from legacy angles list) ───────────────────
    let arcs = Array.isArray(params.arcs) ? params.arcs.slice() : null;

    if (!explicitRays && Array.isArray(params.angles)) {
      // Legacy {name, value} path: extract endpoints by character split,
      // assign hard-coded fallback positions, derive arcs from values.
      const extras = new Set();
      params.angles.forEach(a => {
        if (!a) return;
        const nm = (a.name || a.label || '').toString().toUpperCase().replace('ANGLE', '').trim();
        if (nm.length === 3 && nm.includes(qName)) {
          const parts = nm.split(qName);
          if (parts[0]) extras.add(parts[0]);
          if (parts[1]) extras.add(parts[1]);
        }
      });
      [pName, qName, rName, sName].forEach(n => extras.delete(n));
      Array.from(extras).forEach((nm, i) => {
        rayDeg[nm] = 60 - (i * 20);
      });
      if (!arcs) {
        arcs = [];
        params.angles.forEach(a => {
          if (!a || a.value == null) return;
          const nm = (a.name || a.label || '').toString().toUpperCase().replace('ANGLE', '').trim();
          if (nm.length === 3 && nm.includes(qName)) {
            const parts = nm.split(qName);
            if (parts[0] && parts[1]) {
              arcs.push({ between: [parts[0], parts[1]], label: String(a.value) });
            }
          }
        });
      }
    }

    // ── BUILD SVG ──────────────────────────────────────────────────────────
    const STROKE_RECT = 'var(--border-dark, #ccc)';
    const STROKE_RAY  = 'var(--text-main, #333)';
    const STROKE_ARC  = 'var(--brand-rose, #B76E79)';
    const FILL_PT     = 'var(--text-main, #333)';
    const FILL_VAL    = 'var(--brand-sage, #51615E)';
    const FILL_CORNER = 'var(--text-muted, #666)';

    let svg = '';

    // Rectangle outline + corner right-angle marker
    svg += `<rect x="${P.x}" y="${P.y}" width="${R.x - P.x}" height="${Q.y - P.y}" fill="none" stroke="${STROKE_RECT}" stroke-width="3"/>`;
    svg += `<rect x="${Q.x}" y="${Q.y - 15}" width="15" height="15" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="1.5"/>`;

    // Diagonal QS only when S is referenced as an arc/ray endpoint
    const sReferenced =
      (explicitRays && explicitRays.some(r => r && r.name === sName)) ||
      (Array.isArray(arcs) && arcs.some(a => a && Array.isArray(a.between) && a.between.includes(sName)));
    if (sReferenced) {
      svg += `<line x1="${Q.x}" y1="${Q.y}" x2="${S.x}" y2="${S.y}" stroke="${STROKE_RECT}" stroke-width="2"/>`;
    }

    // Helper: convert math degrees → screen-coord polar point at distance d from Q
    const polar = (deg, d) => {
      const rad = deg * Math.PI / 180;
      return { x: Q.x + d * Math.cos(rad), y: Q.y - d * Math.sin(rad) };
    };

    // Draw rays for each non-corner endpoint that has a position
    const lineLen = 200;
    Object.keys(rayDeg).forEach(name => {
      if ([pName, qName, rName, sName].includes(name)) return;
      const tip = polar(rayDeg[name], lineLen);
      svg += `<line x1="${Q.x}" y1="${Q.y}" x2="${tip.x.toFixed(2)}" y2="${tip.y.toFixed(2)}" stroke="${STROKE_RAY}" stroke-width="2"/>`;
      // Endpoint label sits just outside the ray tip
      svg += `<text x="${(tip.x + 8).toFixed(2)}" y="${(tip.y - 4).toFixed(2)}" font-size="14" font-weight="bold" fill="${FILL_PT}">${name}</text>`;
    });

    // Draw arcs + value labels at each arc's angle bisector
    if (Array.isArray(arcs)) {
      arcs.forEach((arc, idx) => {
        if (!arc || !Array.isArray(arc.between) || arc.between.length !== 2) return;
        const [a, b] = arc.between;
        const aDeg = rayDeg[a];
        const bDeg = rayDeg[b];
        if (aDeg === undefined || bDeg === undefined) return;
        const startDeg = Math.min(aDeg, bDeg);
        const endDeg = Math.max(aDeg, bDeg);
        if (endDeg - startDeg < 1) return; // skip degenerate arcs
        // Stagger arc radii so adjacent arcs don't overlap
        const arcRadius = 24 + (idx * 8);
        // Build arc as a 16-segment polyline (avoids SVG arc-direction ambiguity)
        const steps = 16;
        const pts = [];
        for (let i = 0; i <= steps; i++) {
          const t = startDeg + (endDeg - startDeg) * (i / steps);
          const p = polar(t, arcRadius);
          pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
        }
        svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${STROKE_ARC}" stroke-width="1.6"/>`;
        // Value label at bisector, just outside the arc
        if (arc.label != null) {
          const midDeg = (startDeg + endDeg) / 2;
          const labelP = polar(midDeg, arcRadius + 16);
          svg += `<text x="${labelP.x.toFixed(2)}" y="${labelP.y.toFixed(2)}" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${FILL_VAL}">${arc.label}</text>`;
        }
      });
    }

    // Corner labels
    svg += `<text x="${P.x - 15}" y="${P.y - 10}" font-size="16" font-weight="bold" fill="${FILL_CORNER}">${pName}</text>`;
    svg += `<text x="${Q.x - 15}" y="${Q.y + 20}" font-size="16" font-weight="bold" fill="${FILL_PT}">${qName}</text>`;
    svg += `<text x="${R.x + 15}" y="${R.y + 20}" font-size="16" font-weight="bold" fill="${FILL_CORNER}">${rName}</text>`;
    svg += `<text x="${S.x + 15}" y="${S.y - 10}" font-size="16" font-weight="bold" fill="${FILL_CORNER}">${sName}</text>`;

    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">
        ${svg}
      </svg>
    `;
  },

  /**
   * Rectangle ABCD (or any 4-letter naming) with a single line drawn from one
   * corner to a labelled point on a non-adjacent side. Designed for PSLE-style
   * geometry questions like:
   *   "ABCD is a rectangle. E is on BC. AE is drawn. ∠BAE = 25°. Find ∠AEC."
   *
   * params:
   *   vertices: ["A","B","C","D"]      clockwise from top-left (default)
   *   from_vertex: "A"                 corner where the line starts
   *   end_label: "E"                   label for the inserted point
   *   end_side: "BC"                   which side carries the inserted point
   *                                     (two-letter, vertices in cw order)
   *   end_position: 0.6                fractional position along that side
   *                                     (0 = first letter of end_side, 1 = second)
   *   angles: [                        labels at the angle vertices
   *     { at: "A", value: "25°" },     ← angle at corner A (between adjacent
   *                                       cw-side and the inserted line)
   *     { at: "E", value: "?" }        ← angle at E on the far side of the line
   *   ]
   */
  rectangleWithLine(params = {}) {
    const w = 400, h = 220;
    const v = params.vertices || ['A', 'B', 'C', 'D'];
    // Corner positions, clockwise from top-left
    const TL = { x: 60,  y: 40  };
    const TR = { x: 340, y: 40  };
    const BR = { x: 340, y: 180 };
    const BL = { x: 60,  y: 180 };
    const corners = { [v[0]]: TL, [v[1]]: TR, [v[2]]: BR, [v[3]]: BL };

    const fromName = params.from_vertex || v[0];
    const fromPt   = corners[fromName];
    const endName  = params.end_label || 'E';
    const endSide  = params.end_side || `${v[1]}${v[2]}`;
    const tFrac    = (typeof params.end_position === 'number') ? params.end_position : 0.6;

    const sStart = corners[endSide[0]];
    const sEnd   = corners[endSide[1]];
    if (!fromPt || !sStart || !sEnd) {
      return `<svg width="100%" viewBox="0 0 ${w} ${h}"><text x="200" y="110" text-anchor="middle" fill="#a55">Invalid rectangleWithLine params</text></svg>`;
    }

    const E = {
      x: sStart.x + tFrac * (sEnd.x - sStart.x),
      y: sStart.y + tFrac * (sEnd.y - sStart.y),
    };

    const STROKE_RECT  = 'var(--border-dark, #ccc)';
    const STROKE_LINE  = 'var(--text-main, #333)';
    const FILL_VAL     = 'var(--brand-sage, #51615E)';
    const FILL_VTX     = 'var(--text-muted, #666)';
    const FILL_E       = 'var(--text-main, #333)';

    let svg = '';
    // Rectangle outline
    svg += `<rect x="${TL.x}" y="${TL.y}" width="${TR.x - TL.x}" height="${BR.y - TR.y}" fill="none" stroke="${STROKE_RECT}" stroke-width="2.5"/>`;
    // Inserted line from `from` corner to E
    svg += `<line x1="${fromPt.x}" y1="${fromPt.y}" x2="${E.x.toFixed(2)}" y2="${E.y.toFixed(2)}" stroke="${STROKE_LINE}" stroke-width="2"/>`;
    // E marker dot
    svg += `<circle cx="${E.x.toFixed(2)}" cy="${E.y.toFixed(2)}" r="3" fill="${STROKE_LINE}"/>`;

    // Corner labels — placed outside the rectangle in each diagonal direction
    svg += `<text x="${TL.x - 14}" y="${TL.y - 6}"  font-size="15" font-weight="bold" fill="${FILL_VTX}">${v[0]}</text>`;
    svg += `<text x="${TR.x + 6}"  y="${TR.y - 6}"  font-size="15" font-weight="bold" fill="${FILL_VTX}">${v[1]}</text>`;
    svg += `<text x="${BR.x + 6}"  y="${BR.y + 16}" font-size="15" font-weight="bold" fill="${FILL_VTX}">${v[2]}</text>`;
    svg += `<text x="${BL.x - 14}" y="${BL.y + 16}" font-size="15" font-weight="bold" fill="${FILL_VTX}">${v[3]}</text>`;

    // E label — placed just outside the side it sits on
    const cx = (TL.x + BR.x) / 2;
    const cy = (TL.y + BR.y) / 2;
    let eDx = 0, eDy = 0;
    if      (E.x > cx + 1) eDx =  10;
    else if (E.x < cx - 1) eDx = -14;
    if      (E.y > cy + 1) eDy =  16;
    else if (E.y < cy - 1) eDy = -6;
    if (eDx === 0 && eDy === 0) eDy = -6;
    svg += `<text x="${(E.x + eDx).toFixed(1)}" y="${(E.y + eDy).toFixed(1)}" font-size="15" font-weight="bold" fill="${FILL_E}">${endName}</text>`;

    // Angle labels (at corners or at E)
    const norm = (vec) => {
      const len = Math.hypot(vec.x, vec.y) || 1;
      return { x: vec.x / len, y: vec.y / len };
    };
    (params.angles || []).forEach(angle => {
      if (!angle || angle.value == null || !angle.at) return;
      const at = angle.at;
      const atPt = (at === endName) ? E : corners[at];
      if (!atPt) return;

      let d1, d2;
      if (at === endName) {
        // Angle at E: between EA (toward `from` corner) and the side
        // toward the second letter of end_side (e.g. ∠AEC where C = endSide[1])
        d1 = norm({ x: fromPt.x - E.x, y: fromPt.y - E.y });
        d2 = norm({ x: sEnd.x - E.x,   y: sEnd.y - E.y });
      } else {
        // Angle at a corner: between the side cw-from-this-corner and the
        // inserted line to E (this captures e.g. ∠BAE at A, assuming the
        // line goes toward the cw-next side of the corner).
        const idx = v.indexOf(at);
        const cwNext = v[(idx + 1) % 4];
        const cwPt = corners[cwNext];
        d1 = norm({ x: cwPt.x - atPt.x, y: cwPt.y - atPt.y });
        d2 = norm({ x: E.x - atPt.x,    y: E.y - atPt.y });
      }
      const bis = norm({ x: d1.x + d2.x, y: d1.y + d2.y });
      const labelDist = 30;
      const lx = atPt.x + labelDist * bis.x;
      const ly = atPt.y + labelDist * bis.y;
      svg += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${FILL_VAL}">${angle.value}</text>`;
    });

    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">
        ${svg}
      </svg>
    `;
  },

  /**
   * Two parallel lines cut by a transversal. PSLE Angles questions like
   * "lines PQ and RS are parallel; ∠QAB = 110°; find ∠SBA".
   *
   * params:
   *   line1_label: "PQ"   line2_label: "RS"
   *   point1_label: "A"   point2_label: "B"
   *   angles: [
   *     { at: "A", position: "top-right", label: "p" | "65°" },
   *     { at: "B", position: "top-right", label: "q" }
   *   ]
   *   position ∈ {"top-left","top-right","bottom-left","bottom-right"}
   */
  parallelLinesTransversal(params = {}) {
    const w = 400, h = 220;
    const line1Y = 70, line2Y = 170;
    const xLeft = 30, xRight = 370;
    const trans = { x1: 110, y1: 25, x2: 290, y2: 215 };
    // Intersection of transversal with each parallel line
    const t1 = (line1Y - trans.y1) / (trans.y2 - trans.y1);
    const ix1 = trans.x1 + t1 * (trans.x2 - trans.x1);
    const t2 = (line2Y - trans.y1) / (trans.y2 - trans.y1);
    const ix2 = trans.x1 + t2 * (trans.x2 - trans.x1);

    const STROKE_LINE = 'var(--text-main, #333)';
    const FILL_LINE_LBL = 'var(--text-muted, #666)';
    const FILL_PT = 'var(--text-main, #333)';
    const FILL_VAL = 'var(--brand-sage, #51615E)';

    const line1Lbl = params.line1_label || 'PQ';
    const line2Lbl = params.line2_label || 'RS';
    const pt1Lbl = params.point1_label || 'A';
    const pt2Lbl = params.point2_label || 'B';

    let svg = '';
    // Two parallel arrows-on-both-ends to suggest "extends infinitely"
    svg += `<line x1="${xLeft}" y1="${line1Y}" x2="${xRight}" y2="${line1Y}" stroke="${STROKE_LINE}" stroke-width="2.5"/>`;
    svg += `<line x1="${xLeft}" y1="${line2Y}" x2="${xRight}" y2="${line2Y}" stroke="${STROKE_LINE}" stroke-width="2.5"/>`;
    // Transversal
    svg += `<line x1="${trans.x1}" y1="${trans.y1}" x2="${trans.x2}" y2="${trans.y2}" stroke="${STROKE_LINE}" stroke-width="2"/>`;
    // Parallel-marks (small ticks) to indicate parallelism
    svg += `<line x1="${xRight - 30}" y1="${line1Y - 5}" x2="${xRight - 25}" y2="${line1Y + 5}" stroke="${STROKE_LINE}" stroke-width="1.5"/>`;
    svg += `<line x1="${xRight - 30}" y1="${line2Y - 5}" x2="${xRight - 25}" y2="${line2Y + 5}" stroke="${STROKE_LINE}" stroke-width="1.5"/>`;
    // Line labels at right end
    svg += `<text x="${xRight + 4}" y="${line1Y + 4}" font-size="14" font-weight="bold" fill="${FILL_LINE_LBL}">${line1Lbl}</text>`;
    svg += `<text x="${xRight + 4}" y="${line2Y + 4}" font-size="14" font-weight="bold" fill="${FILL_LINE_LBL}">${line2Lbl}</text>`;
    // Intersection point dots + labels
    svg += `<circle cx="${ix1.toFixed(1)}" cy="${line1Y}" r="3" fill="${FILL_PT}"/>`;
    svg += `<circle cx="${ix2.toFixed(1)}" cy="${line2Y}" r="3" fill="${FILL_PT}"/>`;
    svg += `<text x="${(ix1 - 14).toFixed(1)}" y="${line1Y - 8}" font-size="14" font-weight="bold" fill="${FILL_PT}">${pt1Lbl}</text>`;
    svg += `<text x="${(ix2 + 8).toFixed(1)}" y="${line2Y + 16}" font-size="14" font-weight="bold" fill="${FILL_PT}">${pt2Lbl}</text>`;

    // Angle labels at intersections
    (params.angles || []).forEach(a => {
      if (!a || !a.label || !a.at || !a.position) return;
      const at1 = (a.at === pt1Lbl) || (a.at === 'A' && pt1Lbl === 'A');
      const ix = at1 ? ix1 : ix2;
      const iy = at1 ? line1Y : line2Y;
      let dx = 0, dy = 0;
      if (a.position.includes('right')) dx = 18;
      else if (a.position.includes('left')) dx = -22;
      if (a.position.includes('top')) dy = -10;
      else if (a.position.includes('bottom')) dy = 22;
      svg += `<text x="${(ix + dx).toFixed(1)}" y="${(iy + dy).toFixed(1)}" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${FILL_VAL}">${a.label}</text>`;
    });

    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">
        ${svg}
      </svg>
    `;
  },

  /**
   * Square with quarter-circle(s) inscribed at corner(s). Handles classic PSLE
   * composite-area-with-circles questions:
   *   - 1 quarter circle from a corner
   *   - 2 quarter circles from opposite corners
   *   - 4 quarter circles from each corner
   *   - 1 full circle (configuration: "circle")
   *
   * params:
   *   side_label: "14 cm"
   *   configuration: "1corner" | "2opposite" | "4corners" | "circle"
   *   shaded: "outside" | "inside"   (which region to highlight)
   *   radius_label: "14 cm"          (optional radius dimension)
   */
  quarterCirclesInSquare(params = {}) {
    const w = 320, h = 320;
    const M = 30; // margin
    const S = w - 2 * M; // square side in pixels (260)
    const x0 = M, y0 = M, x1 = M + S, y1 = M + S;

    const STROKE = 'var(--text-main, #333)';
    const SHADE = 'rgba(183,110,121,0.18)';
    const FILL_LBL = 'var(--text-main, #333)';

    const cfg = params.configuration || '1corner';
    const sideLabel = params.side_label || '';

    let svg = '';
    // Optional shading: simplest approach — fill square first then white-out the disc shapes.
    // We'll draw shaded region differently per configuration, using clip-path-like layering.

    // For shading "outside" we fill the square then overlay white discs.
    if (params.shaded === 'outside') {
      svg += `<rect x="${x0}" y="${y0}" width="${S}" height="${S}" fill="${SHADE}" stroke="none"/>`;
      if (cfg === 'circle') {
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        svg += `<circle cx="${cx}" cy="${cy}" r="${S / 2}" fill="white" stroke="none"/>`;
      } else {
        const corners = [];
        if (cfg === '1corner') corners.push([x0, y0]);
        else if (cfg === '2opposite') corners.push([x0, y0], [x1, y1]);
        else if (cfg === '4corners') corners.push([x0, y0], [x1, y0], [x0, y1], [x1, y1]);
        corners.forEach(([cx, cy]) => {
          svg += `<circle cx="${cx}" cy="${cy}" r="${S}" fill="white" stroke="none" clip-path="inset(0 0 ${cy === y0 ? 0 : '100%'} ${cx === x0 ? 0 : '100%'})"/>`;
        });
      }
    }

    // Square outline
    svg += `<rect x="${x0}" y="${y0}" width="${S}" height="${S}" fill="none" stroke="${STROKE}" stroke-width="2.5"/>`;

    // Draw arcs (centred at corners, radius = S, sweeping 90° into the square)
    const drawQuarter = (cx, cy, startDeg, endDeg) => {
      const steps = 24;
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = startDeg + (endDeg - startDeg) * (i / steps);
        const a = t * Math.PI / 180;
        pts.push(`${(cx + S * Math.cos(a)).toFixed(1)},${(cy - S * Math.sin(a)).toFixed(1)}`);
      }
      return `<polyline points="${pts.join(' ')}" fill="none" stroke="${STROKE}" stroke-width="2"/>`;
    };

    if (cfg === 'circle') {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      svg += `<circle cx="${cx}" cy="${cy}" r="${S / 2}" fill="none" stroke="${STROKE}" stroke-width="2"/>`;
      // optional radius line
      if (params.radius_label) {
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + S / 2}" y2="${cy}" stroke="var(--brand-sage, #51615E)" stroke-width="1.2" stroke-dasharray="3 2"/>`;
        svg += `<text x="${cx + S / 4}" y="${cy - 4}" font-size="12" font-weight="bold" text-anchor="middle" fill="var(--brand-sage, #51615E)">${params.radius_label}</text>`;
      }
    } else {
      // top-left corner: arc from 0° (right) to -90° (down) — but in SVG y-down, that's start 0°, end +90° (math)? Use math angles where 0° = right, 90° = up.
      // For top-left at (x0, y0): the quarter arc inside the square goes from (x0+S, y0) [right] to (x0, y0+S) [down]. Math: start at 0° going to -90°.
      // top-right corner (x1, y0): from (x1-S, y0) [left, 180°] to (x1, y0+S) [down, -90°/270°].
      // bottom-left corner (x0, y1): from (x0+S, y1) [right, 0°] to (x0, y1-S) [up, 90°].
      // bottom-right corner (x1, y1): from (x1-S, y1) [left, 180°] to (x1, y1-S) [up, 90°].
      const corners = [];
      if (cfg === '1corner') corners.push({ cx: x0, cy: y0, start: 0, end: -90 });
      else if (cfg === '2opposite') {
        corners.push({ cx: x0, cy: y0, start: 0, end: -90 });
        corners.push({ cx: x1, cy: y1, start: 180, end: 90 });
      } else if (cfg === '4corners') {
        corners.push({ cx: x0, cy: y0, start: 0, end: -90 });
        corners.push({ cx: x1, cy: y0, start: 180, end: 270 });
        corners.push({ cx: x0, cy: y1, start: 0, end: 90 });
        corners.push({ cx: x1, cy: y1, start: 180, end: 90 });
      }
      corners.forEach(c => { svg += drawQuarter(c.cx, c.cy, c.start, c.end); });
    }

    // Side label centred on bottom edge
    if (sideLabel) {
      svg += `<text x="${(x0 + x1) / 2}" y="${y1 + 22}" font-size="13" font-weight="bold" text-anchor="middle" fill="${FILL_LBL}">${sideLabel}</text>`;
    }

    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 360px; display: block; margin: 0 auto;">
        ${svg}
      </svg>
    `;
  },

  /**
   * Two equal circles overlapping, with centres separated by some distance.
   * Default: vesica-piscis configuration where each centre lies on the other's
   * circumference (separation = radius).
   *
   * params:
   *   radius_label: "7 cm"
   *   separation: 1.0   (factor of radius — 1.0 = vesica piscis, 0.5 = heavy overlap)
   */
  overlappingCircles(params = {}) {
    const w = 320, h = 200;
    const r = 70;
    const sep = (typeof params.separation === 'number' ? params.separation : 1.0) * r;
    const cy = h / 2;
    const cx1 = w / 2 - sep / 2;
    const cx2 = w / 2 + sep / 2;

    const STROKE = 'var(--text-main, #333)';
    const FILL_LBL = 'var(--brand-sage, #51615E)';

    let svg = '';
    svg += `<circle cx="${cx1}" cy="${cy}" r="${r}" fill="none" stroke="${STROKE}" stroke-width="2"/>`;
    svg += `<circle cx="${cx2}" cy="${cy}" r="${r}" fill="none" stroke="${STROKE}" stroke-width="2"/>`;
    // Centre dots
    svg += `<circle cx="${cx1}" cy="${cy}" r="2.5" fill="${STROKE}"/>`;
    svg += `<circle cx="${cx2}" cy="${cy}" r="2.5" fill="${STROKE}"/>`;
    // Optional radius label (drawn as a dashed segment from centre to right edge of left circle)
    if (params.radius_label) {
      svg += `<line x1="${cx1}" y1="${cy}" x2="${cx1 + r}" y2="${cy}" stroke="${FILL_LBL}" stroke-width="1.2" stroke-dasharray="3 2"/>`;
      svg += `<text x="${cx1 + r / 2}" y="${cy - 6}" font-size="12" font-weight="bold" text-anchor="middle" fill="${FILL_LBL}">${params.radius_label}</text>`;
    }
    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 360px; display: block; margin: 0 auto;">
        ${svg}
      </svg>
    `;
  },

  /**
   * Rectangle with a uniform path either INSIDE or OUTSIDE the perimeter.
   * Used for PSLE "field with path" / "pool with tile path" questions.
   *
   * params:
   *   length_label: "60 m"
   *   breadth_label: "45 m"
   *   path_width_label: "3 m"
   *   path_position: "inside" | "outside"
   */
  rectangleWithPath(params = {}) {
    const w = 380, h = 240;
    const M = 24;     // outermost margin
    const PW = 18;    // path width in px (visual only)
    const x0 = M, y0 = M, x1 = w - M, y1 = h - M;

    const STROKE = 'var(--text-main, #333)';
    const SHADE = 'rgba(183,110,121,0.18)';
    const FILL_LBL = 'var(--text-main, #333)';

    let svg = '';
    if ((params.path_position || 'outside') === 'outside') {
      // Outer = full rectangle (with path), Inner = the pool itself.
      svg += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${SHADE}" stroke="${STROKE}" stroke-width="2"/>`;
      svg += `<rect x="${x0 + PW}" y="${y0 + PW}" width="${x1 - x0 - 2 * PW}" height="${y1 - y0 - 2 * PW}" fill="white" stroke="${STROKE}" stroke-width="2"/>`;
      // Length label on bottom of outer
      if (params.length_label) {
        svg += `<text x="${(x0 + x1) / 2}" y="${y1 + 18}" font-size="13" font-weight="bold" text-anchor="middle" fill="${FILL_LBL}">${params.length_label}</text>`;
      }
      // Breadth label on left of outer
      if (params.breadth_label) {
        svg += `<text x="${x0 - 8}" y="${(y0 + y1) / 2}" font-size="13" font-weight="bold" text-anchor="end" dominant-baseline="middle" fill="${FILL_LBL}">${params.breadth_label}</text>`;
      }
      // Path width label
      if (params.path_width_label) {
        svg += `<text x="${(x0 + x0 + PW) / 2}" y="${y0 - 6}" font-size="11" font-weight="bold" text-anchor="middle" fill="var(--brand-sage, #51615E)">${params.path_width_label}</text>`;
      }
    } else {
      // INSIDE: outer = field; inner = grass region; the ring between is the path.
      svg += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="white" stroke="${STROKE}" stroke-width="2"/>`;
      svg += `<rect x="${x0 + PW}" y="${y0 + PW}" width="${x1 - x0 - 2 * PW}" height="${y1 - y0 - 2 * PW}" fill="white" stroke="${STROKE}" stroke-width="2"/>`;
      // Shade the path ring (using two overlapping rects with inner cut via fill)
      svg += `<path d="M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z M ${x0 + PW} ${y0 + PW} L ${x0 + PW} ${y1 - PW} L ${x1 - PW} ${y1 - PW} L ${x1 - PW} ${y0 + PW} Z" fill="${SHADE}" fill-rule="evenodd"/>`;
      // Labels
      if (params.length_label) {
        svg += `<text x="${(x0 + x1) / 2}" y="${y1 + 18}" font-size="13" font-weight="bold" text-anchor="middle" fill="${FILL_LBL}">${params.length_label}</text>`;
      }
      if (params.breadth_label) {
        svg += `<text x="${x0 - 8}" y="${(y0 + y1) / 2}" font-size="13" font-weight="bold" text-anchor="end" dominant-baseline="middle" fill="${FILL_LBL}">${params.breadth_label}</text>`;
      }
      if (params.path_width_label) {
        svg += `<text x="${(x0 + x0 + PW) / 2}" y="${y0 + PW / 2 + 4}" font-size="11" font-weight="bold" text-anchor="middle" fill="var(--brand-sage, #51615E)">${params.path_width_label}</text>`;
      }
    }
    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 460px; display: block; margin: 0 auto;">
        ${svg}
      </svg>
    `;
  },

  /**
   * Triangular dot pattern for triangular-number sequences. Used for PSLE
   * pattern questions where Figure n has n × (n + 1) / 2 dots.
   *
   * params:
   *   show_figures: 4         number of figures to render side-by-side
   */
  dotTriangle(params = {}) {
    const w = 400, h = 180;
    const figures = params.show_figures || 4;
    const dotR = 4;
    const gap = 14;
    const figGap = 16;

    const STROKE = 'var(--brand-sage, #51615E)';
    const FILL = 'var(--brand-rose, #B76E79)';
    const LBL = 'var(--text-main, #333)';

    // First compute total width to centre
    const figWidths = [];
    for (let n = 1; n <= figures; n++) {
      figWidths.push((n - 1) * gap + 2 * dotR);
    }
    const totalW = figWidths.reduce((s, v) => s + v, 0) + (figures - 1) * figGap;
    let cursorX = (w - totalW) / 2;

    let svg = '';
    for (let n = 1; n <= figures; n++) {
      const figW = figWidths[n - 1];
      const figCx = cursorX + figW / 2;
      // n rows, row k (1..n) has k dots, centred horizontally
      for (let k = 1; k <= n; k++) {
        const rowY = 30 + (k - 1) * (gap - 2);
        const rowOffset = ((n - k) / 2) * gap;
        for (let i = 0; i < k; i++) {
          const dx = cursorX + rowOffset + i * gap + dotR;
          svg += `<circle cx="${dx.toFixed(1)}" cy="${rowY}" r="${dotR}" fill="${FILL}" stroke="${STROKE}" stroke-width="0.8"/>`;
        }
      }
      // Figure label
      svg += `<text x="${figCx.toFixed(1)}" y="${h - 16}" font-size="12" font-weight="bold" text-anchor="middle" fill="${LBL}">Figure ${n}</text>`;
      cursorX += figW + figGap;
    }
    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 480px; display: block; margin: 0 auto;">
        ${svg}
      </svg>
    `;
  },

  /**
   * Renders the first 3–4 figures of an n × n square-grid growth pattern.
   * Used for "Figure n is an n × n grid of unit squares" PSLE questions.
   *
   * params:
   *   show_figures: 3
   *   black_fn / white_fn: optional formulas captioned at each figure
   */
  gridGrowth(params = {}) {
    const w = 420, h = 200;
    const figures = params.show_figures || 3;
    const cell = 14;
    const figGap = 24;

    const STROKE = 'var(--text-main, #333)';
    const FILL_BLACK = '#2a2a2a';
    const FILL_WHITE = 'white';
    const LBL = 'var(--text-main, #333)';

    // Figure n = n × n grid, take black squares from the diagonal (1 black + (n-1)² white in the simplest variant)
    // For pure n×n filled: every cell is shown; for mixed black/white: simple checkerboard.
    let cursorX = 30;
    let svg = '';
    for (let n = 1; n <= figures; n++) {
      const figSize = n * cell;
      // Centre vertically within h
      const figY = (h - figSize) / 2 - 12;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const isDiagonal = r === c;
          const fill = isDiagonal && params.diagonal_black !== false ? FILL_BLACK : FILL_WHITE;
          svg += `<rect x="${cursorX + c * cell}" y="${figY + r * cell}" width="${cell}" height="${cell}" fill="${fill}" stroke="${STROKE}" stroke-width="1"/>`;
        }
      }
      // Figure label
      svg += `<text x="${cursorX + figSize / 2}" y="${h - 16}" font-size="12" font-weight="bold" text-anchor="middle" fill="${LBL}">Figure ${n}</text>`;
      cursorX += figSize + figGap;
    }
    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">
        ${svg}
      </svg>
    `;
  },

  /**
   * 3 × 3 magic-square grid with optional pre-filled values and corner highlight.
   *
   * params:
   *   values: [[null,1,null],[null,5,null],[null,null,null]]   3×3 grid; null = blank
   *   highlight: "centre" | "corners" | null
   */
  magicSquare(params = {}) {
    const w = 240, h = 240;
    const cell = 60;
    const M = (w - 3 * cell) / 2;

    const STROKE = 'var(--text-main, #333)';
    const HILITE_FILL = 'rgba(57,255,179,0.18)';
    const LBL = 'var(--text-main, #333)';

    const values = params.values || [[null, null, null], [null, null, null], [null, null, null]];
    const hi = params.highlight || null;

    let svg = '';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const x = M + c * cell;
        const y = M + r * cell;
        const isCorner = (r === 0 || r === 2) && (c === 0 || c === 2);
        const isCentre = (r === 1 && c === 1);
        const fill = (hi === 'corners' && isCorner) || (hi === 'centre' && isCentre)
          ? HILITE_FILL : 'white';
        svg += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fill}" stroke="${STROKE}" stroke-width="1.5"/>`;
        const v = values[r] && values[r][c] != null ? values[r][c] : '';
        if (v !== '') {
          svg += `<text x="${x + cell / 2}" y="${y + cell / 2 + 6}" font-size="20" font-weight="bold" text-anchor="middle" fill="${LBL}">${v}</text>`;
        }
      }
    }
    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 280px; display: block; margin: 0 auto;">
        ${svg}
      </svg>
    `;
  },

  dividedStraightLineAngle(params) {
    const cx = 200, cy = 200;
    const r = 160;

    // 1. Draw the straight horizontal base line
    let linesHtml = `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="var(--border-dark, #ccc)" stroke-width="3"/>`;

    // 2. Draw an intersecting ray to divide the angle
    const rad = (60 * Math.PI) / 180;
    const rayX = cx + r * Math.cos(-rad);
    const rayY = cy + r * Math.sin(-rad);
    linesHtml += `<line x1="${cx}" y1="${cy}" x2="${rayX}" y2="${rayY}" stroke="var(--text-main, #333)" stroke-width="3"/>`;

    // 3. Draw the center vertex point
    linesHtml += `<circle cx="${cx}" cy="${cy}" r="4" fill="var(--brand-sage, #51615E)"/>`;

    // 4. Extract AI parameters (Angles and Vertices)
    const vertices = params.vertices || ['A', 'O', 'B', 'C'];

    // 🚀 THE FIX: Handle both simple strings AND complex AI objects
    const angles = params.angles || [];
    const a1 = angles[0]?.label || (typeof angles[0] === 'string' ? angles[0] : '?');
    const a2 = angles[1]?.label || (typeof angles[1] === 'string' ? angles[1] : '?');

    // 5. Inject the labels
    linesHtml += `
      <text x="${cx + 50}" y="${cy - 20}" font-size="16" font-weight="bold" fill="var(--brand-sage, #51615E)">${a1}</text>
      <text x="${cx - 60}" y="${cy - 20}" font-size="16" font-weight="bold" fill="var(--text-main, #1a2e2a)">${a2}</text>
      
      <text x="${cx}" y="${cy + 25}" font-size="16" font-weight="bold" text-anchor="middle" fill="var(--text-muted, #5d706b)">${vertices[1] || 'O'}</text>
      <text x="${cx + r + 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)">${vertices[2] || 'B'}</text>
      <text x="${cx - r - 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)">${vertices[0] || 'A'}</text>
      <text x="${rayX + 10}" y="${rayY - 10}" font-size="16" font-weight="bold" fill="var(--text-muted, #5d706b)">${vertices[3] || 'C'}</text>
    `;

    return `
      <svg width="100%" viewBox="0 0 400 260" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">
        ${linesHtml}
      </svg>
    `;
  },

  // ── HELPERS ────────────────────────────────────────────────────────────────

  table(params) {
    // 🚀 FIX: Strictly enforce arrays to prevent .map() and .forEach() crashes
    const headers = Array.isArray(params.headers) ? params.headers : [];
    const rows = Array.isArray(params.rows) ? params.rows : [];

    let thead = headers.length > 0 ? `
      <thead class="bg-elevated border-b border-light">
        <tr>${headers.map(h => `<th class="p-3 text-left font-bold text-main border-r border-light last:border-r-0">${h}</th>`).join('')}</tr>
      </thead>
    ` : '';

    let tbody = `<tbody>`;
    rows.forEach((row) => {
      // Handle both array-based rows and object-based rows dynamically
      let rData = Array.isArray(row) ? row : Object.values(row);
      tbody += `<tr class="border-b border-light last:border-b-0 hover:bg-page transition-colors">
          ${rData.map(cell => `<td class="p-3 text-main border-r border-light last:border-r-0">${cell}</td>`).join('')}
       </tr>`;
    });
    tbody += `</tbody>`;

    return `
      <div class="w-full overflow-x-auto rounded border border-light my-4 bg-white shadow-sm">
        <table class="w-full border-collapse text-left">
          ${thead}
          ${tbody}
        </table>
      </div>
    `;
  },

  drawRectangleOnGrid(params) {
    const w_cm = parseFloat(params.width_cm) || 10;
    const l_cm = parseFloat(params.length_cm) || 5;
    const unit = parseFloat(params.unit_grid_cm) || 1;

    const w_units = w_cm / unit;
    const h_units = l_cm / unit;
    const cellSize = 30;
    const gridW = (w_units + 2) * cellSize;
    const gridH = (h_units + 2) * cellSize;

    // Extract exactly 4 corner labels (Default ABCD if missing)
    const lbl = (params.labels || "ABCD").padEnd(4, ' ');
    const TL = lbl[0], TR = lbl[1], BR = lbl[2], BL = lbl[3];

    let gridLines = '';
    for (let x = 0; x <= gridW; x += cellSize) gridLines += `<line x1="${x}" y1="0" x2="${x}" y2="${gridH}" stroke="var(--border-light, #d6e3dc)" stroke-width="1"/>`;
    for (let y = 0; y <= gridH; y += cellSize) gridLines += `<line x1="0" y1="${y}" x2="${gridW}" y2="${y}" stroke="var(--border-light, #d6e3dc)" stroke-width="1"/>`;

    const rectX = cellSize;
    const rectY = cellSize;
    const rectW = w_units * cellSize;
    const rectH = h_units * cellSize;
    const rectSvg = `<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" fill="rgba(183, 110, 121, 0.1)" stroke="var(--brand-sage, #51615E)" stroke-width="3"/>`;

    const padding = 12;
    const txt = (chars, x, y, anchor, baseline) => `<text x="${x}" y="${y}" text-anchor="${anchor}" alignment-baseline="${baseline}" fill="var(--text-main, #1a2e2a)" font-size="16" font-weight="bold">${chars}</text>`;

    // 🚀 THE CORNER FIX: Pin each letter to the exact vertex
    const cornerLabels = `
      ${txt(TL, rectX - padding, rectY - padding, 'end', 'baseline')}
      ${txt(TR, rectX + rectW + padding, rectY - padding, 'start', 'baseline')}
      ${txt(BR, rectX + rectW + padding, rectY + rectH + padding, 'start', 'hanging')}
      ${txt(BL, rectX - padding, rectY + rectH + padding, 'end', 'hanging')}
      
      <text x="${rectX + rectW / 2}" y="${rectY - 6}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="14">${w_cm}cm</text>
      <text x="${rectX - 6}" y="${rectY + rectH / 2}" text-anchor="end" alignment-baseline="middle" fill="var(--text-main, #1a2e2a)" font-size="14">${l_cm}cm</text>
    `;

    return `
      <svg width="100%" viewBox="0 0 ${gridW} ${gridH}" style="height:auto;max-width:500px;display:block;margin:0 auto;font-family:'Plus Jakarta Sans',sans-serif;" role="img" aria-label="${l_cm}cm by ${w_cm}cm rectangle on grid">
        ${gridLines}
        ${rectSvg}
        ${cornerLabels}
      </svg>
    `;
  },

  /**
   * Returns an SVG wrapper string with standard attributes.
   * @param {string} content - SVG elements to place inside
   * @param {object} opts
   * @returns {string}
   */
  _svg(content, { viewBox = '0 0 400 260', alt = 'Diagram', maxWidth = 400 } = {}) {
    // Single style attribute — browsers silently drop a second `style=` on the same element
    return `<svg role="img" aria-label="${alt}" width="100%" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" style="height:auto;max-width:${maxWidth}px;font-family:'Plus Jakarta Sans',sans-serif;display:block;margin:0 auto;">${content}</svg>`;
  },

  /**
   * Escapes text for safe SVG insertion.
   * @param {string} str
   * @returns {string}
   */
  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // ── MASTER ROUTER ──────────────────────────────────────────────────────────

  /**
   * Master rendering function. Parses a database visual_payload and routes it
   * to the correct drawing function safely.
   * @param {object|string} payload - e.g., { engine: 'diagram-library', function_name: 'circle', params: {...} }
   * @returns {string} SVG/HTML string or a safe placeholder
   */
  render(payload) {
    // 1. Safety check: Handle empty or unparsed string payloads
    if (!payload) return '';
    let parsedPayload = payload;
    if (typeof payload === 'string') {
      try {
        parsedPayload = JSON.parse(payload);
      } catch (e) {
        console.warn('[DiagramLibrary] Failed to parse payload string:', payload);
        return this.placeholder({ description: 'Invalid diagram data' });
      }
    }

    // 2. Engine Check
    if (parsedPayload.engine !== 'diagram-library') {
      return ''; // Silently ignore payloads meant for other future engines (like interactive widgets)
    }

    const fnName = parsedPayload.function_name;

    // Safety check: Parse params if they were double-stringified by the database
    let params = parsedPayload.params || {};
    if (typeof params === 'string') {
      try { params = JSON.parse(params); } catch (e) { }
    }

    // 3. Security & Validation: Check if function exists or is missing
    if (!fnName || typeof fnName !== 'string' || typeof this[fnName] !== 'function' || fnName.startsWith('_') || fnName === 'render') {
      const missingName = fnName || 'UnknownFunction';

      // 🚀 MASTERCLASS ROUTER: Intercept known AI hallucinations

      // A. Did it try to draw a flow diagram using nodes/edges? Map it to our arrowDiagram.
      if (missingName.toLowerCase().includes('flow') && params.nodes && (params.edges || params.arrows)) {
        console.info(`[DiagramLibrary] Auto-routed ${missingName} to arrowDiagram`);
        return this.arrowDiagram({ nodes: params.nodes, arrows: params.edges || params.arrows });
      }

      // B. Did it try to create a science experiment? Route to generic UI.
      if (params.setups || params.commonConditions || params.experimentSetup || missingName.toLowerCase().includes('experiment')) {
        console.info(`[DiagramLibrary] Auto-routed ${missingName} to genericExperiment`);
        return this.genericExperiment(params, missingName);
      }

      // C. Ultimate Fallback (Developer Warning)
      console.warn(`[DiagramLibrary] To-Do: Missing or invalid function ${missingName}`);
      const paramKeys = params && Object.keys(params).length > 0 ? Object.keys(params).join(', ') : 'no params';
      return this.placeholder({
        description: `[Requires DiagramLibrary.${missingName}({ ${paramKeys} })]`,
        borderStyle: 'dashed'
      });
    }

    // 4. Execution & Fallback
    try {
      return this[fnName](params);
    } catch (err) {
      console.error(`[DiagramLibrary] Crash while rendering ${fnName}:`, err);
      return this.placeholder({ description: `Error drawing ${fnName} diagram.`, borderStyle: 'solid' });
    }
  },

  // ── GEOMETRY ───────────────────────────────────────────────────────────────

  /**
   * Labelled rectangle with dimension arrows on each side.
   * @param {object} opts
   * @returns {string} SVG string
   */
  rectangle({
    widthLabel = '?',
    heightLabel = '?',
    unit = 'cm',
    fillColor = 'var(--bg-elevated, #f0f5f2)',
    title = '',
    showNotToScale = true,
  } = {}) {
    const esc = this._esc.bind(this);
    const wLbl = esc(widthLabel);
    const hLbl = esc(heightLabel);
    const notToScale = showNotToScale
      ? `<text x="200" y="255" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10" font-style="italic">Figure not drawn to scale.</text>`
      : '';
    const titleEl = title
      ? `<text x="200" y="20" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="600">${esc(title)}</text>`
      : '';
    const content = `
      ${titleEl}
      <rect x="80" y="50" width="240" height="150" fill="${fillColor}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>
      <!-- Width dimension arrow below -->
      <line x1="80" y1="220" x2="320" y2="220" stroke="var(--brand-sage, #51615E)" stroke-width="1.5" marker-start="url(#arr)" marker-end="url(#arr)"/>
      <text x="200" y="238" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="600">${wLbl}</text>
      <!-- Height dimension arrow left -->
      <line x1="55" y1="50" x2="55" y2="200" stroke="var(--brand-sage, #51615E)" stroke-width="1.5" marker-start="url(#arr)" marker-end="url(#arr)"/>
      <text x="30" y="130" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="600" transform="rotate(-90,30,130)">${hLbl}</text>
      ${notToScale}
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill="var(--brand-sage, #51615E)"/>
        </marker>
      </defs>`;
    return this._svg(content, { alt: `Rectangle with width ${widthLabel} and height ${heightLabel}.` });
  },

  /**
   * Labelled square (calls rectangle with equal labels).
   * @param {object} opts
   * @returns {string} SVG string
   */
  square({ sideLabel = '?', unit = 'cm', fillColor = 'var(--bg-elevated, #f0f5f2)' } = {}) {
    return this.rectangle({ widthLabel: sideLabel, heightLabel: sideLabel, unit, fillColor, showNotToScale: true });
  },

  /**
   * Right-angled triangle with labelled sides.
   * @param {object} opts
   * @returns {string} SVG string
   */
  rightTriangle({
    base = '?',
    height = '?',
    hypotenuse = '',
    unit = 'cm',
    showRightAngle = true,
    fillColor = 'var(--bg-elevated, #f0f5f2)',
  } = {}) {
    const esc = this._esc.bind(this);
    const rightAngle = showRightAngle
      ? `<polyline points="80,200 100,200 100,180" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="1.5"/>`
      : '';
    const hypLabel = hypotenuse
      ? `<text x="230" y="118" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="12" font-weight="600" transform="rotate(-50,230,118)">${esc(hypotenuse)}</text>`
      : '';
    const content = `
      <polygon points="80,200 320,200 80,50" fill="${fillColor}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>
      ${rightAngle}
      <!-- Base label -->
      <text x="200" y="230" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="600">${esc(base)}</text>
      <!-- Height label -->
      <text x="42" y="130" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="600" transform="rotate(-90,42,130)">${esc(height)}</text>
      ${hypLabel}`;
    return this._svg(content, { alt: `Right-angled triangle with base ${base}, height ${height}${hypotenuse ? ', hypotenuse ' + hypotenuse : ''}.` });
  },

  /**
   * Composite shape from rectangles (L-shapes, T-shapes).
   * @param {object} opts
   * @returns {string} SVG string
   */
  compositeShape({
    parts = [],
    totalWidthLabel = '',
    totalHeightLabel = '',
    unit = 'cm',
    showNotToScale = true,
  } = {}) {
    const partRects = parts.map(p => {
      const fill = p.shaded ? 'var(--bg-elevated, #f0f5f2)' : 'none';
      const label = p.label
        ? `<text x="${p.x + p.w / 2}" y="${p.y + p.h / 2 + 5}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="11">${this._esc(p.label)}</text>`
        : '';
      return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${fill}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>${label}`;
    }).join('');
    const totalW = totalWidthLabel
      ? `<text x="200" y="248" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="12" font-weight="600">${this._esc(totalWidthLabel)}</text>`
      : '';
    const totalH = totalHeightLabel
      ? `<text x="20" y="130" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="12" font-weight="600" transform="rotate(-90,20,130)">${this._esc(totalHeightLabel)}</text>`
      : '';
    const nts = showNotToScale
      ? `<text x="200" y="258" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10" font-style="italic">Figure not drawn to scale.</text>`
      : '';
    const content = `${partRects}${totalW}${totalH}${nts}`;
    return this._svg(content, { alt: `Composite shape made up of ${parts.length} rectangle(s).` });
  },

  /**
   * Circle with optional radius and/or diameter lines and labels.
   * @param {object} opts
   * @returns {string} SVG string
   */
  circle({
    radiusLabel = '',
    diameterLabel = '',
    unit = 'cm',
    fillColor = 'var(--bg-elevated, #f0f5f2)',
  } = {}) {
    const esc = this._esc.bind(this);
    const radiusLine = radiusLabel
      ? `<line x1="200" y1="130" x2="310" y2="130" stroke="var(--brand-sage, #51615E)" stroke-width="1.5"/>
         <text x="258" y="120" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="600">${esc(radiusLabel)}</text>`
      : '';
    const diamLine = diameterLabel
      ? `<line x1="90" y1="130" x2="310" y2="130" stroke="var(--brand-sage, #51615E)" stroke-width="1.5"/>
         <text x="200" y="118" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="600">${esc(diameterLabel)}</text>`
      : '';
    const content = `
      <circle cx="200" cy="130" r="110" fill="${fillColor}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>
      <circle cx="200" cy="130" r="3" fill="var(--brand-sage, #51615E)"/>
      ${radiusLine}${diamLine}`;
    return this._svg(content, { alt: `Circle${radiusLabel ? ' with radius ' + radiusLabel : ''}${diameterLabel ? ' with diameter ' + diameterLabel : ''}.` });
  },

  /**
   * Stadium / running-track shape: two horizontal straights joined by two
   * semicircular ends. Common in PSLE Circles questions (perimeter / area
   * of composite figures with circles).
   *
   * params:
   *   straight_length_label  (e.g. "80 m")  — labels the top straight side
   *   diameter_label         (e.g. "70 m")  — labels the diameter of one
   *                                            semicircular end (vertical)
   *   straight_label_position             — 'top' (default) or 'inside'
   */
  runningTrack(params = {}) {
    const w = 400, h = 220;
    const cy = 110;          // vertical centre of the track
    const r  = 55;           // semicircle radius (px) — enough to clearly read the labels
    const straightW = 200;   // straight-section length (px)
    const leftCx  = 80;      // left semicircle centre
    const rightCx = leftCx + straightW;  // = 280
    const topY    = cy - r;  // = 55
    const botY    = cy + r;  // = 165

    const STROKE = 'var(--text-main, #333)';
    const LABEL  = 'var(--text-main, #333)';
    const HINT   = 'var(--brand-sage, #51615E)';

    let svg = '';

    // Top + bottom straight edges
    svg += `<line x1="${leftCx}" y1="${topY}" x2="${rightCx}" y2="${topY}" stroke="${STROKE}" stroke-width="2.5"/>`;
    svg += `<line x1="${leftCx}" y1="${botY}" x2="${rightCx}" y2="${botY}" stroke="${STROKE}" stroke-width="2.5"/>`;

    // Helper: build a 24-segment polyline arc going from start_deg to end_deg
    // around centre (cx, cy), radius r. Math degrees: 0=right, 90=up.
    const arcPolyline = (cx, cyc, rad, startDeg, endDeg, steps = 24) => {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = startDeg + (endDeg - startDeg) * (i / steps);
        const a = t * Math.PI / 180;
        pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cyc - rad * Math.sin(a)).toFixed(1)}`);
      }
      return pts.join(' ');
    };

    // Left semicircle: from top (90°) round-the-left (180°) to bottom (270°)
    svg += `<polyline points="${arcPolyline(leftCx, cy, r, 90, 270)}" fill="none" stroke="${STROKE}" stroke-width="2.5"/>`;
    // Right semicircle: from top (90°) round-the-right (0°) to bottom (-90°)
    svg += `<polyline points="${arcPolyline(rightCx, cy, r, 90, -90)}" fill="none" stroke="${STROKE}" stroke-width="2.5"/>`;

    // Straight-length label
    if (params.straight_length_label) {
      const lx = leftCx + straightW / 2;
      const ly = (params.straight_label_position === 'inside') ? cy + 4 : topY - 8;
      svg += `<text x="${lx}" y="${ly}" font-size="13" font-weight="bold" text-anchor="middle" fill="${LABEL}">${params.straight_length_label}</text>`;
    }

    // Diameter label on the right semicircle (vertical dashed line + side text)
    if (params.diameter_label) {
      const dx = rightCx + r + 18;
      svg += `<line x1="${dx}" y1="${topY}" x2="${dx}" y2="${botY}" stroke="${HINT}" stroke-width="1" stroke-dasharray="3 2"/>`;
      // Tick marks at the two endpoints
      svg += `<line x1="${dx - 4}" y1="${topY}" x2="${dx + 4}" y2="${topY}" stroke="${HINT}" stroke-width="1.2"/>`;
      svg += `<line x1="${dx - 4}" y1="${botY}" x2="${dx + 4}" y2="${botY}" stroke="${HINT}" stroke-width="1.2"/>`;
      svg += `<text x="${dx + 10}" y="${cy + 4}" font-size="13" font-weight="bold" fill="${HINT}">${params.diameter_label}</text>`;
    }

    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">
        ${svg}
      </svg>
    `;
  },

  // ── NUMBER AND FRACTION VISUALS ─────────────────────────────────────────────

  /**
   * Horizontal number line with optional marked points and highlights.
   * @param {object} opts
   * @returns {string} SVG string
   */
  numberLine({
    start = 0,
    end = 10,
    marked = [],
    labels = [],
    showArrows = true,
    highlight = [],
  } = {}) {
    const esc = this._esc.bind(this);
    const range = end - start;
    const xLeft = 40, xRight = 360, y = 130;
    const toX = (v) => xLeft + ((v - start) / range) * (xRight - xLeft);

    // Tick marks and default labels
    const ticks = [];
    for (let v = start; v <= end; v++) {
      const x = toX(v);
      const customLabel = labels.find(l => l.value === v);
      ticks.push(`<line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}" stroke="var(--brand-sage, #51615E)" stroke-width="1.5"/>`);
      ticks.push(`<text x="${x}" y="${y + 24}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="12">${esc(customLabel ? customLabel.text : String(v))}</text>`);
    }

    // Highlight arcs
    const highlights = highlight.map(h => {
      const x1 = toX(h.from), x2 = toX(h.to);
      const mid = (x1 + x2) / 2;
      return `<path d="M ${x1} ${y - 12} Q ${mid} ${y - 35} ${x2} ${y - 12}" fill="none" stroke="var(--brand-rose, #B76E79)" stroke-width="2"/>`;
    }).join('');

    // Marked dots
    const dots = marked.map(v => {
      const x = toX(v);
      return `<circle cx="${x}" cy="${y}" r="5" fill="var(--brand-sage, #51615E)"/>`;
    }).join('');

    // Main axis
    const arrowL = showArrows ? `<polygon points="${xLeft - 12},${y} ${xLeft},${y - 5} ${xLeft},${y + 5}" fill="var(--brand-sage, #51615E)"/>` : '';
    const arrowR = showArrows ? `<polygon points="${xRight + 12},${y} ${xRight},${y - 5} ${xRight},${y + 5}" fill="var(--brand-sage, #51615E)"/>` : '';

    const content = `
      <line x1="${xLeft}" y1="${y}" x2="${xRight}" y2="${y}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>
      ${arrowL}${arrowR}
      ${highlights}
      ${ticks.join('')}
      ${dots}`;
    return this._svg(content, { alt: `Number line from ${start} to ${end}.` });
  },

  /**
   * Fraction bar divided into equal parts with shaded numerator section.
   * @param {object} opts
   * @returns {string} SVG string
   */
  fractionBar({
    numerator = 1,
    denominator = 4,
    showLabel = true,
    fillColor = 'var(--brand-rose, #B76E79)',
  } = {}) {
    const barX = 60, barY = 80, barW = 280, barH = 60;
    const partW = barW / denominator;
    const parts = [];
    for (let i = 0; i < denominator; i++) {
      const x = barX + i * partW;
      const fill = i < numerator ? fillColor : 'var(--bg-elevated, #f0f5f2)';
      parts.push(`<rect x="${x}" y="${barY}" width="${partW}" height="${barH}" fill="${fill}" stroke="var(--brand-sage, #51615E)" stroke-width="1.5"/>`);
    }
    const label = showLabel
      ? `<text x="200" y="175" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="16" font-weight="700">${numerator}/${denominator}</text>`
      : '';
    const content = `${parts.join('')}${label}`;
    return this._svg(content, { alt: `Fraction bar showing ${numerator}/${denominator}: ${numerator} out of ${denominator} parts shaded.` });
  },

  /**
   * Multiple fraction bars stacked vertically for comparison.
   * @param {object} opts
   * @returns {string} SVG string
   */
  fractionBars({ fractions = [], labels = [] } = {}) {
    const n = fractions.length || 1;
    const vbH = 50 + n * 60;
    const barX = 80, barW = 260, barH = 35;
    const rows = fractions.map((f, i) => {
      const y = 30 + i * 55;
      const partW = barW / (f.denominator || 4);
      const parts = [];
      for (let j = 0; j < (f.denominator || 4); j++) {
        const x = barX + j * partW;
        const fill = j < (f.numerator || 0) ? (f.color || 'var(--brand-rose, #B76E79)') : 'var(--bg-elevated, #f0f5f2)';
        parts.push(`<rect x="${x}" y="${y}" width="${partW}" height="${barH}" fill="${fill}" stroke="var(--brand-sage, #51615E)" stroke-width="1"/>`);
      }
      const lbl = labels[i] || `${f.numerator}/${f.denominator}`;
      return `${parts.join('')}<text x="${barX - 10}" y="${y + barH / 2 + 5}" text-anchor="end" fill="var(--text-main, #1a2e2a)" font-size="12" font-weight="600">${this._esc(lbl)}</text>`;
    }).join('');
    const content = rows;
    return this._svg(content, { viewBox: `0 0 400 ${vbH}`, alt: `${n} fraction bar(s) for comparison.` });
  },

  // ── DATA AND STATISTICS ─────────────────────────────────────────────────────

  /**
   * Vertical bar chart.
   * @param {object} opts
   * @returns {string} SVG string
   */
  barChart(opts = {}) {
    const title = opts.title || '';
    const xLabel = opts.xLabel || opts.xAxisLabel || '';
    const yLabel = opts.yLabel || opts.yAxisLabel || '';
    // 🌟 FIX: Automatically accept 'data', 'items', or 'bars' payloads
    const bars = opts.bars && opts.bars.length > 0 ? opts.bars : (opts.data || opts.items || []);
    const maxY = opts.maxY || opts.yAxisMax || null;
    const showValues = opts.showValues || false;

    const esc = this._esc.bind(this);
    if (!bars.length) return this.placeholder({ description: 'Bar chart (no data)' });

    const chartX = 55, chartY = 30, chartW = 310, chartH = 160;
    const autoMax = maxY || Math.ceil(Math.max(...bars.map(b => b.value)) * 1.2) || 10;
    // ... (leave the rest of the function untouched)
    const barW = Math.min(40, (chartW / bars.length) - 8);
    const gap = (chartW - barW * bars.length) / (bars.length + 1);

    // Y-axis gridlines and labels (5 ticks)
    const yTicks = [];
    for (let i = 0; i <= 4; i++) {
      const v = Math.round((autoMax / 4) * i);
      const y = chartY + chartH - (v / autoMax) * chartH;
      yTicks.push(`<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="var(--border-light, #d6e3dc)" stroke-width="1"/>`);
      yTicks.push(`<text x="${chartX - 6}" y="${y + 4}" text-anchor="end" fill="var(--text-muted, #5d706b)" font-size="10">${v}</text>`);
    }

    // Bars
    const barEls = bars.map((b, i) => {
      const bH = (b.value / autoMax) * chartH;
      const x = chartX + gap + i * (barW + gap);
      const y = chartY + chartH - bH;
      const fill = b.color || 'var(--brand-sage, #51615E)';
      const valLabel = showValues
        ? `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="10">${b.value}</text>`
        : '';
      return `<rect x="${x}" y="${y}" width="${barW}" height="${bH}" fill="${fill}" rx="2"/>
              <text x="${x + barW / 2}" y="${chartY + chartH + 16}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="11">${esc(b.label)}</text>
              ${valLabel}`;
    }).join('');

    // Axes
    const axes = `<line x1="${chartX}" y1="${chartY}" x2="${chartX}" y2="${chartY + chartH}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>
                  <line x1="${chartX}" y1="${chartY + chartH}" x2="${chartX + chartW}" y2="${chartY + chartH}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;

    const titleEl = title ? `<text x="200" y="18" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="700">${esc(title)}</text>` : '';
    const xLblEl = xLabel ? `<text x="${chartX + chartW / 2}" y="255" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="11">${esc(xLabel)}</text>` : '';
    const yLblEl = yLabel ? `<text x="14" y="${chartY + chartH / 2}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="11" transform="rotate(-90,14,${chartY + chartH / 2})">${esc(yLabel)}</text>` : '';

    const content = `${titleEl}${yLblEl}${yTicks.join('')}${axes}${barEls}${xLblEl}`;
    return this._svg(content, { alt: `Bar chart${title ? ': ' + title : ''}. Bars: ${bars.map(b => b.label + '=' + b.value).join(', ')}.` });
  },

  /**
   * Horizontal bar chart variant — used for P3-P4 picture graph / data questions.
   * @param {object} opts
   * @returns {string} SVG string
   */
  horizontalBarChart({ title = '', bars = [], maxX = null } = {}) {
    const esc = this._esc.bind(this);
    if (!bars.length) return this.placeholder({ description: 'Horizontal bar chart (no data)' });

    const n = bars.length;
    const vbH = 50 + n * 45;
    const chartX = 100, chartY = 30, chartW = 240;
    const autoMax = maxX || Math.ceil(Math.max(...bars.map(b => b.value)) * 1.2) || 10;
    const barH = 28;
    const gap = 10;

    const barEls = bars.map((b, i) => {
      const bW = (b.value / autoMax) * chartW;
      const y = chartY + i * (barH + gap);
      return `<rect x="${chartX}" y="${y}" width="${bW}" height="${barH}" fill="var(--brand-sage, #51615E)" rx="2"/>
              <text x="${chartX - 8}" y="${y + barH / 2 + 4}" text-anchor="end" fill="var(--text-main, #1a2e2a)" font-size="11">${esc(b.label)}</text>
              <text x="${chartX + bW + 6}" y="${y + barH / 2 + 4}" fill="var(--text-main, #1a2e2a)" font-size="11">${b.value}</text>`;
    }).join('');

    const axis = `<line x1="${chartX}" y1="${chartY}" x2="${chartX}" y2="${chartY + n * (barH + gap) - gap}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
    const titleEl = title ? `<text x="${chartX + chartW / 2}" y="20" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="700">${esc(title)}</text>` : '';

    const content = `${titleEl}${axis}${barEls}`;
    return this._svg(content, { viewBox: `0 0 400 ${vbH}`, alt: `Horizontal bar chart${title ? ': ' + title : ''}.` });
  },

  /**
   * Pictogram / picture graph.
   * @param {object} opts
   * @returns {string} SVG string
   */
  pictogram({
    title = '',
    items = [],
    keyValue = 1,
    keySymbol = '★',
    keyLabel = '',
  } = {}) {
    const esc = this._esc.bind(this);
    if (!items.length) return this.placeholder({ description: 'Pictogram (no data)' });

    const n = items.length;
    const vbH = 60 + n * 40 + 40;
    const labelX = 100, symX = 110, symSize = 18, gap = 4;

    const rows = items.map((item, i) => {
      const y = 40 + i * 40;
      const symCount = Math.ceil(item.count / keyValue);
      const syms = Array.from({ length: symCount }, (_, j) =>
        `<text x="${symX + j * (symSize + gap)}" y="${y + 14}" fill="var(--brand-rose, #B76E79)" font-size="${symSize}">${keySymbol}</text>`
      ).join('');
      return `<text x="${labelX - 8}" y="${y + 14}" text-anchor="end" fill="var(--text-main, #1a2e2a)" font-size="12">${esc(item.label)}</text>${syms}`;
    }).join('');

    const keyY = 45 + n * 40;
    const keyEl = `<text x="${symX}" y="${keyY + 14}" fill="var(--brand-rose, #B76E79)" font-size="${symSize}">${keySymbol}</text>
      <text x="${symX + symSize + 6}" y="${keyY + 14}" fill="var(--text-muted, #5d706b)" font-size="11">= ${keyValue} ${esc(keyLabel)}</text>`;
    const titleEl = title ? `<text x="200" y="22" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="700">${esc(title)}</text>` : '';
    const axiX = `<line x1="${labelX}" y1="32" x2="${labelX}" y2="${keyY - 6}" stroke="var(--border-dark, #8da89e)" stroke-width="1"/>`;

    const content = `${titleEl}${axiX}${rows}${keyEl}`;
    return this._svg(content, { viewBox: `0 0 400 ${vbH}`, alt: `Pictogram chart${title ? ': ' + title : ''}.` });
  },

  /**
   * Line graph with connected data points.
   * @param {object} opts
   * @returns {string} SVG string
   */
  /**
   * lineGraph — Time-series / data trend line chart.
   *
   * @param {object}   params
   * @param {string}   [params.title]      Chart title
   * @param {string}   [params.xLabel]     X-axis label
   * @param {string}   [params.yLabel]     Y-axis label
   * @param {number}   [params.yMax]       Optional Y max (auto-scaled with 10% headroom if omitted)
   * @param {number}   [params.yMin=0]     Y min (default 0)
   * @param {number[]} [params.yTicks]     Optional explicit Y tick values (overrides auto 5 ticks)
   * @param {Array}    params.points       Array of {x, y} or legacy {xText, yVal}
   *                                        x can be numeric OR string (categorical)
   *
   * Examples:
   *   {points: [{x: 0, y: 28}, {x: 1, y: 32}]}                   // numeric
   *   {points: [{x: "8 am", y: 28}, {x: "9 am", y: 32}]}          // categorical
   *   {points: [{xText: "8 am", yVal: 28}]}                       // legacy
   */
  lineGraph({
    title = '',
    xLabel = '',
    yLabel = '',
    points = [],
    yTicks = [],
    yMax: yMaxIn = null,
    yMin: yMinIn = 0,
  } = {}) {
    const esc = this._esc.bind(this);

    // ── Safety: empty / invalid input ────────────────────────────────────────
    if (!Array.isArray(points) || points.length === 0) {
      return this.placeholder({ description: 'Line graph (no data)' });
    }

    // ── Normalise: accept {x, y} OR legacy {xText, yVal} ─────────────────────
    const norm = points.map((p, i) => {
      const xRaw = p.x !== undefined ? p.x : p.xText;
      const yNum = Number(p.y !== undefined ? p.y : p.yVal);
      return {
        xRaw,
        yNum,
        displayX: p.label ?? p.xText ?? (p.x !== undefined ? String(p.x) : String(i)),
      };
    }).filter(p => p.xRaw !== undefined && Number.isFinite(p.yNum));

    if (norm.length === 0) {
      return this.placeholder({ description: 'Line graph (invalid points)' });
    }

    // Numeric axis only when EVERY x is finite numeric
    const isNumeric = norm.every(p => typeof p.xRaw === 'number' && Number.isFinite(p.xRaw));

    // ── Layout (400x260 viewBox) ─────────────────────────────────────────────
    const VB_W = 400, VB_H = 260;
    const PAD_L = 50, PAD_R = 20, PAD_T = title ? 36 : 20, PAD_B = 50;
    const plotW = VB_W - PAD_L - PAD_R;
    const plotH = VB_H - PAD_T - PAD_B;

    // ── Y range (auto-scale with 10% headroom unless yMax given) ─────────────
    const dataMax = Math.max(...norm.map(p => p.yNum));
    const dataMin = Math.min(...norm.map(p => p.yNum));
    let yHi = yMaxIn !== null ? Number(yMaxIn) : dataMax * 1.1;
    let yLo = yMinIn !== null ? Number(yMinIn) : Math.min(0, dataMin);
    if (yHi <= yLo) yHi = yLo + 1; // safety against flat data

    // ── X mapping ────────────────────────────────────────────────────────────
    let xAt;
    if (isNumeric) {
      const xMin = Math.min(...norm.map(p => p.xRaw));
      const xMax = Math.max(...norm.map(p => p.xRaw));
      const xRange = xMax - xMin || 1;
      xAt = (xRaw) => PAD_L + ((xRaw - xMin) / xRange) * plotW;
    } else {
      xAt = (_xRaw, i) => norm.length === 1
        ? PAD_L + plotW / 2
        : PAD_L + (i / (norm.length - 1)) * plotW;
    }
    const yAt = (y) => PAD_T + plotH - ((y - yLo) / (yHi - yLo)) * plotH;

    // ── Gridlines + Y tick labels (5 evenly-spaced unless yTicks provided) ───
    const ticksArr = yTicks.length ? yTicks : (() => {
      const N = 5, arr = [];
      for (let i = 0; i <= N; i++) arr.push(yLo + (i / N) * (yHi - yLo));
      return arr;
    })();
    let gridlines = '', yTickLabels = '';
    ticksArr.forEach(yVal => {
      const yPx = yAt(yVal);
      gridlines += `<line x1="${PAD_L}" y1="${yPx.toFixed(1)}" x2="${(PAD_L + plotW).toFixed(1)}" y2="${yPx.toFixed(1)}" stroke="var(--border-light, #d6e3dc)" stroke-width="1" stroke-dasharray="2,3"/>`;
      const lblTxt = Number.isInteger(yVal) ? String(yVal) : Number(yVal).toFixed(1);
      yTickLabels += `<text x="${(PAD_L - 8).toFixed(1)}" y="${(yPx + 4).toFixed(1)}" text-anchor="end" fill="var(--text-muted, #5d706b)" font-size="10">${lblTxt}</text>`;
    });

    // ── X tick labels ────────────────────────────────────────────────────────
    let xTickLabels = '';
    norm.forEach((p, i) => {
      const xPx = xAt(p.xRaw, i);
      xTickLabels += `<text x="${xPx.toFixed(1)}" y="${(PAD_T + plotH + 16).toFixed(1)}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="10">${esc(p.displayX)}</text>`;
    });

    // ── Axes ─────────────────────────────────────────────────────────────────
    const axes = `<line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${(PAD_T + plotH).toFixed(1)}" stroke="var(--text-main, #1a2e2a)" stroke-width="1.5"/>` +
                 `<line x1="${PAD_L}" y1="${(PAD_T + plotH).toFixed(1)}" x2="${(PAD_L + plotW).toFixed(1)}" y2="${(PAD_T + plotH).toFixed(1)}" stroke="var(--text-main, #1a2e2a)" stroke-width="1.5"/>`;

    // ── Polyline + dots ──────────────────────────────────────────────────────
    const pathD = norm.map((p, i) => {
      const x = xAt(p.xRaw, i).toFixed(1);
      const y = yAt(p.yNum).toFixed(1);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
    const polyline = `<path d="${pathD}" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;

    // Value labels above each dot, but only if not too crowded
    const showValueLabels = norm.length <= 8;
    const dots = norm.map((p, i) => {
      const x = xAt(p.xRaw, i);
      const y = yAt(p.yNum);
      const valueLabel = showValueLabels
        ? `<text x="${x.toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="10" font-weight="600" paint-order="stroke" stroke="var(--bg-surface, #ffffff)" stroke-width="3">${esc(String(p.yNum))}</text>`
        : '';
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--brand-sage, #51615E)" stroke="var(--bg-surface, #ffffff)" stroke-width="1.5"/>${valueLabel}`;
    }).join('');

    // ── Titles & axis labels ─────────────────────────────────────────────────
    const titleEl = title
      ? `<text x="${(VB_W / 2).toFixed(1)}" y="20" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="700">${esc(title)}</text>`
      : '';
    const xLabelEl = xLabel
      ? `<text x="${(PAD_L + plotW / 2).toFixed(1)}" y="${(VB_H - 8).toFixed(1)}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="11" font-weight="600">${esc(xLabel)}</text>`
      : '';
    const yLabelEl = yLabel
      ? `<text x="14" y="${(PAD_T + plotH / 2).toFixed(1)}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="11" font-weight="600" transform="rotate(-90, 14, ${(PAD_T + plotH / 2).toFixed(1)})">${esc(yLabel)}</text>`
      : '';

    return this._svg(
      `${titleEl}${gridlines}${axes}${yTickLabels}${xTickLabels}${polyline}${dots}${xLabelEl}${yLabelEl}`,
      { viewBox: `0 0 ${VB_W} ${VB_H}`, alt: `Line graph${title ? ': ' + title : ''}. ${norm.length} data points.`, maxWidth: 460 }
    );
  },

  // ── TABLES (HTML) ────────────────────────────────────────────────────────────

  /**
   * Returns an HTML table string for data questions.
   * Uses CSS variables — no hardcoded colors.
   * @param {object} opts
   * @returns {string} HTML string
   */
  dataTable({ headers = [], rows = [], caption = '', highlightCol = -1 } = {}) {
    const esc = this._esc.bind(this);

    const thStyle = `style="background:var(--bg-elevated, #f0f5f2);color:var(--text-main, #1a2e2a);font-weight:700;font-size:0.875rem;padding:8px 12px;border:1px solid var(--border-dark, #8da89e);text-align:center;"`;
    const tdStyleBase = `padding:8px 12px;border:1px solid var(--border-light, #d6e3dc);text-align:center;font-size:0.875rem;color:var(--text-main, #1a2e2a);`;

    const thead = headers.length
      ? `<thead><tr>${headers.map((h, i) => `<th ${thStyle}${i === highlightCol ? ' style="background:var(--brand-rose, #B76E79);color:white;font-weight:700;padding:8px 12px;border:1px solid var(--border-dark, #8da89e);text-align:center;"' : ''}>${esc(h)}</th>`).join('')}</tr></thead>`
      : '';

    const tbody = `<tbody>${rows.map(row =>
      `<tr>${row.map((cell, i) => {
        const hlStyle = i === highlightCol ? `background:rgba(183,110,121,0.08);font-weight:600;` : '';
        return `<td style="${tdStyleBase}${hlStyle}">${esc(cell)}</td>`;
      }).join('')}</tr>`
    ).join('')}</tbody>`;

    const cap = caption ? `<caption style="caption-side:bottom;font-size:0.75rem;color:var(--text-muted, #5d706b);padding-top:6px;">${esc(caption)}</caption>` : '';

    return `<div style="overflow-x:auto;margin:8px 0;"><table style="border-collapse:collapse;width:100%;font-family:'Plus Jakarta Sans',sans-serif;">${cap}${thead}${tbody}</table></div>`;
  },

  // ── SCIENCE DIAGRAMS ─────────────────────────────────────────────────────────

  /**
   * Vertical thermometer with mercury column and graduated scale.
   * @param {object} opts
   * @returns {string} SVG string
   */
  thermometer({
    minTemp = 0,
    maxTemp = 100,
    currentTemp = 37,
    unit = '°C',
    label = '',
  } = {}) {
    const esc = this._esc.bind(this);
    const thermX = 160, bulbY = 210, topY = 50, bulbR = 18;
    const thermH = bulbY - topY;
    const filledH = ((currentTemp - minTemp) / (maxTemp - minTemp)) * thermH;
    const fillY = bulbY - filledH;

    // Tick marks (5 ticks)
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      const v = minTemp + ((maxTemp - minTemp) / 4) * i;
      const y = bulbY - (i / 4) * thermH;
      ticks.push(`<line x1="${thermX + 10}" y1="${y}" x2="${thermX + 22}" y2="${y}" stroke="var(--brand-sage, #51615E)" stroke-width="1.5"/>`);
      ticks.push(`<text x="${thermX + 26}" y="${y + 4}" fill="var(--text-main, #1a2e2a)" font-size="11">${Math.round(v)}${esc(unit)}</text>`);
    }

    const content = `
      <!-- Thermometer tube -->
      <rect x="${thermX - 8}" y="${topY}" width="16" height="${thermH}" rx="8" fill="white" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>
      <!-- Mercury fill -->
      <rect x="${thermX - 6}" y="${fillY}" width="12" height="${filledH}" fill="var(--brand-rose, #B76E79)" rx="2"/>
      <!-- Bulb -->
      <circle cx="${thermX}" cy="${bulbY + bulbR - 5}" r="${bulbR}" fill="var(--brand-rose, #B76E79)" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>
      ${ticks.join('')}
      <!-- Current temp label -->
      <text x="${thermX}" y="${topY - 10}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="700">${currentTemp}${esc(unit)}</text>
      ${label ? `<text x="${thermX}" y="248" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="11">${esc(label)}</text>` : ''}`;
    return this._svg(content, { alt: `Thermometer showing ${currentTemp}${unit} on a scale of ${minTemp}${unit} to ${maxTemp}${unit}.` });
  },

  /**
   * Flow diagram with labelled nodes and directional arrows.
   * Used for food chains, life cycles, water cycle diagrams.
   * @param {object} opts
   * @returns {string} SVG string
   */

  /**
   * Flow diagram: food chains, life cycles, classification trees, food webs.
   *
   * layout: 'auto' (default) | 'horizontal' | 'circular' | 'layered'
   *   auto       — detects from arrow structure (recommended)
   *   horizontal — single row; food chains up to 6 nodes
   *   circular   — nodes on a circle; life cycles 3–5 stages
   *   layered    — trophic/classification levels; food webs, trees
   *
   * Each node: { id, label }
   * Each arrow: { from, to, label? }
   *
   * Examples:
   *   Food chain (auto→horizontal):
   *     nodes:[{id:"g",label:"Grass"},{id:"r",label:"Rabbit"},{id:"e",label:"Eagle"}]
   *     arrows:[{from:"g",to:"r"},{from:"r",to:"e"}]
   *
   *   Life cycle (auto→circular):
   *     nodes:[{id:"1",label:"Egg"},{id:"2",label:"Larva"},{id:"3",label:"Pupa"},{id:"4",label:"Adult"}]
   *     arrows:[{from:"1",to:"2"},{from:"2",to:"3"},{from:"3",to:"4"},{from:"4",to:"1"}]
   *
   *   Classification tree (auto→layered):
   *     nodes:[{id:"a",label:"Animals"},{id:"v",label:"Vertebrates"},{id:"i",label:"Invertebrates"}]
   *     arrows:[{from:"a",to:"v"},{from:"a",to:"i"}]
   */
  arrowDiagram({ nodes = [], arrows = [], layout = 'auto', title = '' } = {}) {
    const esc = this._esc.bind(this);
    if (!nodes.length) return this.placeholder({ description: 'Arrow diagram (no nodes)' });
 
    const NODE_H = 36;
    // Dynamic node width: min 84px, grows with label length
    const nw = (label) => Math.max(84, String(label || '').length * 9 + 24);
 
    // ── 1. Determine layout ───────────────────────────────────────────────────
    const mode = layout === 'auto' ? this._adDetectLayout(nodes, arrows) : layout;
 
    // ── 2. Position nodes ────────────────────────────────────────────────────
    let positions, vbW, vbH;
    if (mode === 'circular') {
      ({ positions, vbW, vbH } = this._adCircular(nodes, nw, NODE_H));
    } else if (mode === 'layered' || mode === 'tree') {
      ({ positions, vbW, vbH } = this._adLayered(nodes, arrows, nw, NODE_H));
    } else {
      ({ positions, vbW, vbH } = this._adHorizontal(nodes, nw, NODE_H));
    }
 
    const posMap = Object.fromEntries(positions.map(p => [p.id, p]));
 
    // ── 3. Arrowhead marker ───────────────────────────────────────────────────
    // Marker ID scoped to this SVG — dlab prefix prevents page-level ID conflicts
    const MID = 'dlab_ah';
    const defs = `<defs>
      <marker id="${MID}" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
        <polygon points="0 0, 9 3.5, 0 7" fill="var(--brand-sage, #51615E)"/>
      </marker>
    </defs>`;
 
    // ── 4. Draw arrows ────────────────────────────────────────────────────────
    // Pre-compute perpendicular offsets so bidirectional / parallel arrows curve
    // around each other instead of overlapping on a single straight line.
    const arrowOffsets = this._adArrowOffsets(arrows);

    const arrowEls = arrows.map((a, idx) => {
      const src = posMap[a.from], tgt = posMap[a.to];
      if (!src || !tgt) return '';

      // Arrow's own direction (used for endpoint clipping at rectangle edges)
      const angle = Math.atan2(tgt.cy - src.cy, tgt.cx - src.cx);
      const p1 = this._adRectEdge(src.cx, src.cy, src.w, src.h, angle);
      const p2 = this._adRectEdge(tgt.cx, tgt.cy, tgt.w, tgt.h, angle + Math.PI);

      const offset = arrowOffsets.get(idx) || 0;

      // CANONICAL perpendicular: direction is computed from the sorted node-pair,
      // not from src→tgt. This way, two arrows between the same pair share one
      // reference frame, so opposite-signed offsets curve to opposite sides.
      let perpX = 0, perpY = 0;
      if (offset !== 0) {
        const [loId] = [a.from, a.to].sort();
        const loPos = posMap[loId];
        const hiPos = loPos === src ? tgt : src;
        const canonAngle = Math.atan2(hiPos.cy - loPos.cy, hiPos.cx - loPos.cx);
        perpX = -Math.sin(canonAngle);
        perpY = Math.cos(canonAngle);
      }

      let pathEl, labelX, labelY;
      if (mode === 'circular' && nodes.length >= 3) {
        // Existing circular outward curve — kept as-is, ignores `offset`
        const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
        const outX = midX + (midX - vbW / 2) * 0.2;
        const outY = midY + (midY - vbH / 2) * 0.2;
        pathEl = `<path d="M ${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q ${outX.toFixed(1)},${outY.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="2" marker-end="url(#${MID})"/>`;
        labelX = outX; labelY = outY - 6;
      } else if (offset !== 0) {
        // Bidirectional / parallel pair → quadratic Bezier curve to one side
        const midX = (p1.x + p2.x) / 2 + perpX * offset;
        const midY = (p1.y + p2.y) / 2 + perpY * offset;
        pathEl = `<path d="M ${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q ${midX.toFixed(1)},${midY.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="2" marker-end="url(#${MID})"/>`;
        // Label at the curve apex, pushed further out so it doesn't sit on the line
        const labelPush = offset > 0 ? 10 : -10;
        labelX = midX + perpX * labelPush;
        labelY = midY + perpY * labelPush + 3;
      } else {
        // Single arrow between this pair → straight line
        pathEl = `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="var(--brand-sage, #51615E)" stroke-width="2" marker-end="url(#${MID})"/>`;
        labelX = (p1.x + p2.x) / 2;
        labelY = (p1.y + p2.y) / 2 - 8;
      }

      // paint-order halo: label stays readable when it crosses an arrow line
      const lbl = a.label
        ? `<text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10" paint-order="stroke" stroke="var(--bg-surface, #ffffff)" stroke-width="3">${esc(a.label)}</text>`
        : '';
      return pathEl + lbl;
    }).join('');
 
    // ── 5. Draw nodes (rendered on top of arrows) ─────────────────────────────
    const nodeEls = positions.map(p => `
      <rect x="${(p.cx - p.w / 2).toFixed(1)}" y="${(p.cy - NODE_H / 2).toFixed(1)}"
            width="${p.w}" height="${NODE_H}" rx="8"
            fill="var(--bg-elevated, #f0f5f2)" stroke="var(--brand-sage, #51615E)" stroke-width="1.5"/>
      <text x="${p.cx.toFixed(1)}" y="${(p.cy + 5).toFixed(1)}"
            text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="12" font-weight="600">${esc(p.label)}</text>
    `).join('');
 
    const titleEl = title
      ? `<text x="${(vbW / 2).toFixed(1)}" y="16" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="700">${esc(title)}</text>`
      : '';
 
    return this._svg(`${defs}${titleEl}${arrowEls}${nodeEls}`, {
      viewBox: `0 0 ${Math.ceil(vbW)} ${Math.ceil(vbH)}`,
      alt: `Flow diagram (${mode}): ${nodes.map(n => n.label).join(', ')}.`,
      maxWidth: Math.min(Math.ceil(vbW), 640),
    });
  },
 
  // ── Private: detect layout from arrow structure ─────────────────────────────
  _adDetectLayout(nodes, arrows) {
    const ids = nodes.map(n => n.id);
    // Any back-edge (arrow pointing to an earlier node) = cycle = circular
    const hasCycle = arrows.some(a => {
      const fi = ids.indexOf(a.from), ti = ids.indexOf(a.to);
      return fi >= 0 && ti >= 0 && ti <= fi;
    });
    if (hasCycle) return 'circular';
    // Any node has 2+ outgoing OR 2+ incoming = branching = layered
    const out = {}, inc = {};
    arrows.forEach(a => {
      out[a.from] = (out[a.from] || 0) + 1;
      inc[a.to]   = (inc[a.to] || 0) + 1;
    });
    if (Object.values(out).some(c => c > 1) || Object.values(inc).some(c => c > 1)) return 'layered';
    return 'horizontal';
  },
 
  // ── Private: rectangle edge intersection point ──────────────────────────────
  _adRectEdge(cx, cy, w, h, angle) {
    const hw = w / 2 + 5, hh = h / 2 + 5; // +5px clearance so arrow doesn't touch box
    const dx = Math.cos(angle), dy = Math.sin(angle);
    if (Math.abs(dx) < 1e-9) return { x: cx, y: cy + hh * Math.sign(dy || 1) };
    if (Math.abs(dy) < 1e-9) return { x: cx + hw * Math.sign(dx), y: cy };
    const t = Math.min(hw / Math.abs(dx), hh / Math.abs(dy));
    return { x: cx + dx * t, y: cy + dy * t };
  },
 
  // ── Private: assign perpendicular offsets to bidirectional / parallel arrows ──
  // Returns Map: arrowIndex → curve offset in px (0 = straight line).
  // Offsets are in CANONICAL space (perpendicular to the sorted-pair direction),
  // so opposing arrows naturally curve to opposite sides.
  _adArrowOffsets(arrows) {
    const offsets = new Map();
    const groups = new Map();
    arrows.forEach((a, i) => {
      const key = [a.from, a.to].sort().join('::');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(i);
    });
    groups.forEach(idxs => {
      if (idxs.length === 1) {
        offsets.set(idxs[0], 0);
        return;
      }
      const CURVE_STEP = 22;                   // px separation between curves
      const n = idxs.length;
      idxs.forEach((arrIdx, k) => {
        const slot = k - (n - 1) / 2;          // -0.5,+0.5 for n=2; -1,0,+1 for n=3
        offsets.set(arrIdx, slot * CURVE_STEP);
      });
    });
    return offsets;
  },
 
  // ── Private: horizontal layout ──────────────────────────────────────────────
  _adHorizontal(nodes, nw, nh) {
    const GAP = 44, PAD = 24;
    let x = PAD;
    const positions = nodes.map(n => {
      const w = nw(n.label);
      const pos = { ...n, cx: x + w / 2, cy: 80, w, h: nh };
      x += w + GAP;
      return pos;
    });
    return { positions, vbW: x + PAD, vbH: 160 };
  },
 
  // ── Private: circular layout ────────────────────────────────────────────────
  _adCircular(nodes, nw, nh) {
    const n = nodes.length;
    if (n === 1) return this._adHorizontal(nodes, nw, nh);
    const maxW = Math.max(...nodes.map(nd => nw(nd.label)));
    // Radius ensures adjacent nodes don't overlap: circumference ≥ n × (maxNodeWidth + minGap)
    const R = Math.max(95, (maxW + 64) * n / (2 * Math.PI));
    const PAD = maxW / 2 + 40;
    const cx = R + PAD, cy = R + PAD;
    const positions = nodes.map((nd, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI / n) * i; // start from top
      return { ...nd, cx: cx + R * Math.cos(angle), cy: cy + R * Math.sin(angle), w: nw(nd.label), h: nh };
    });
    const dim = (R + PAD) * 2;
    return { positions, vbW: dim, vbH: dim };
  },
 
  // ── Private: layered layout (topological BFS levels) ───────────────────────
  _adLayered(nodes, arrows, nw, nh) {
    // BFS from root nodes (no incoming arrows)
    const inbound = Object.fromEntries(nodes.map(n => [n.id, 0]));
    arrows.forEach(a => { inbound[a.to] = (inbound[a.to] || 0) + 1; });
 
    const levels = [], visited = new Set();
    let queue = nodes.filter(n => !inbound[n.id]).map(n => n.id);
    if (!queue.length) queue = [nodes[0].id]; // full-cycle fallback: start anywhere
 
    while (queue.length) {
      levels.push([...queue]);
      queue.forEach(id => visited.add(id));
      const next = [];
      queue.forEach(fid =>
        arrows.filter(a => a.from === fid && !visited.has(a.to))
              .forEach(a => { if (!next.includes(a.to)) next.push(a.to); })
      );
      queue = next;
    }
    // Any node not reachable by BFS goes into the last level (handles disconnected nodes)
    nodes.filter(n => !visited.has(n.id)).forEach(n => (levels[levels.length - 1] || []).push(n.id));
 
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    const ROW_GAP = 70, COL_GAP = 44, PAD = 28;
 
    // ViewBox width = widest row + padding
    let maxRowW = 0;
    levels.forEach(level => {
      const rw = level.reduce((s, id) => s + nw(nodeMap[id]?.label || ''), 0)
               + COL_GAP * Math.max(0, level.length - 1);
      maxRowW = Math.max(maxRowW, rw);
    });
    const vbW = maxRowW + PAD * 2;
 
    const positions = [];
    levels.forEach((level, rowI) => {
      const rowW = level.reduce((s, id) => s + nw(nodeMap[id]?.label || ''), 0)
                 + COL_GAP * Math.max(0, level.length - 1);
      let x = (vbW - rowW) / 2; // centre each row horizontally
      level.forEach(id => {
        const nd = nodeMap[id];
        if (!nd) return;
        const w = nw(nd.label);
        positions.push({ ...nd, cx: x + w / 2, cy: PAD + rowI * (nh + ROW_GAP) + nh / 2, w, h: nh });
        x += w + COL_GAP;
      });
    });
 
    return { positions, vbW: Math.max(vbW, 200), vbH: PAD + levels.length * (nh + ROW_GAP) + PAD };
  },
  
  /**
   * Side-by-side experiment comparison panel.
   * Used for: Heat (black vs white cloth), Light (shadow), Matter (states),
   *           P5 Cycles (condensation), P6 Forces (friction comparison).
   *
   * setups: array of up to 3 setup objects, each:
   *   { label, conditions: [string], result_label? }
   *
   * containerType: 'beaker' | 'test_tube' | 'flask' | 'box'
   *
   * Example:
   *   { "function_name": "comparativeSetup",
   *     "params": {
   *       "title": "Heat Absorption Experiment",
   *       "variable": "Colour of cloth",
   *       "containerType": "beaker",
   *       "setups": [
   *         { "label": "Setup A", "conditions": ["Black cloth","30 ml water","Sunny spot"], "result_label": "Temperature after 1 hour:" },
   *         { "label": "Setup B", "conditions": ["White cloth","30 ml water","Sunny spot"], "result_label": "Temperature after 1 hour:" }
   *       ],
   *       "commonConditions": ["Same beaker size", "Same starting temperature"]
   *     }
   *   }
   */
  comparativeSetup({
    title            = '',
    variable         = '',
    setups           = [],
    containerType    = 'beaker',
    commonConditions = [],
  } = {}) {
    const esc = this._esc.bind(this);
    if (!setups.length) return this.placeholder({ description: 'Comparative setup (no setups provided)' });
 
    const nSetups  = Math.min(setups.length, 3);
    const SVG_W    = 500;
    const PAD      = 18, PANEL_GAP = 14;
    const panelW   = (SVG_W - PAD * 2 - PANEL_GAP * (nSetups - 1)) / nSetups;
    const LINE_H   = 17;
    const CONT_H   = 82;   // container silhouette total height
 
    const maxConds = Math.max(...setups.map(s => (s.conditions || []).length), 0);
    const hasResult = setups.some(s => s.result_label);
    const commonH  = commonConditions.length ? (18 + commonConditions.length * LINE_H) : 0;
 
    // Build vertical layout heights
    const TITLE_H  = title    ? 26 : 0;
    const VAR_H    = variable ? 24 : 0;
    const SVG_H    = TITLE_H + VAR_H + 8           // header
                   + 18 + CONT_H + 10              // setup label + container
                   + maxConds * LINE_H             // conditions
                   + (hasResult ? 30 : 0)          // result underline
                   + commonH + 14;                 // common conditions + bottom pad
 
    let svg = '';
    let curY = 0;
 
    // ── Title ──────────────────────────────────────────────
    if (title) {
      curY += 18;
      svg += `<text x="${SVG_W / 2}" y="${curY}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="700">${esc(title)}</text>`;
    }
 
    // ── Changed variable banner ────────────────────────────
    if (variable) {
      curY += 22;
      svg += `<rect x="${PAD}" y="${curY - 4}" width="${SVG_W - PAD * 2}" height="19" rx="4" fill="rgba(183,110,121,0.12)"/>`;
      svg += `<text x="${SVG_W / 2}" y="${curY + 10}" text-anchor="middle" fill="var(--brand-rose, #B76E79)" font-size="11" font-weight="700">Changed variable: ${esc(variable)}</text>`;
    }
    curY += 12;
 
    const panelTopY = curY; // Y where panel content starts
 
    // ── Vertical dividers between panels ──────────────────
    for (let i = 1; i < nSetups; i++) {
      const dx = PAD + i * (panelW + PANEL_GAP) - PANEL_GAP / 2;
      svg += `<line x1="${dx.toFixed(1)}" y1="${panelTopY}" x2="${dx.toFixed(1)}" y2="${SVG_H - 14 - commonH}" stroke="var(--border-light, #d6e3dc)" stroke-width="1" stroke-dasharray="4,3"/>`;
    }
 
    // ── Render each panel ──────────────────────────────────
    for (let pi = 0; pi < nSetups; pi++) {
      const s       = setups[pi];
      const panelX  = PAD + pi * (panelW + PANEL_GAP);
      const panelCX = panelX + panelW / 2;
      const lbl     = s.label || `Setup ${String.fromCharCode(65 + pi)}`;
 
      let py = panelTopY;
 
      // Panel label
      py += 14;
      svg += `<text x="${panelCX.toFixed(1)}" y="${py}" text-anchor="middle" fill="var(--brand-sage, #51615E)" font-size="12" font-weight="700">${esc(lbl)}</text>`;
 
      // Container silhouette
      py += 10;
      const contBaseY = py + CONT_H;
      svg += this._containerSilhouette(panelCX, contBaseY, containerType);
      py = contBaseY + 12;
 
      // Conditions list
      (s.conditions || []).forEach((cond, ci) => {
        svg += `<text x="${(panelX + 6).toFixed(1)}" y="${(py + ci * LINE_H + 12).toFixed(1)}" fill="var(--text-main, #1a2e2a)" font-size="11">• ${esc(cond)}</text>`;
      });
 
      // Result label + underline (answer space)
      if (s.result_label) {
        const ry = py + maxConds * LINE_H + 12;
        svg += `<text x="${panelCX.toFixed(1)}" y="${ry}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10" font-style="italic">${esc(s.result_label)}</text>`;
        svg += `<line x1="${(panelX + 8).toFixed(1)}" y1="${(ry + 5).toFixed(1)}" x2="${(panelX + panelW - 8).toFixed(1)}" y2="${(ry + 5).toFixed(1)}" stroke="var(--border-dark, #8da89e)" stroke-width="1"/>`;
      }
    }
 
    // ── Common conditions footer ───────────────────────────
    if (commonConditions.length) {
      const footerY = SVG_H - 14 - commonH + 14;
      svg += `<line x1="${PAD}" y1="${footerY - 10}" x2="${SVG_W - PAD}" y2="${footerY - 10}" stroke="var(--border-light, #d6e3dc)" stroke-width="1"/>`;
      svg += `<text x="${SVG_W / 2}" y="${footerY}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10" font-weight="600">Same conditions in all setups:</text>`;
      commonConditions.forEach((c, i) => {
        svg += `<text x="${SVG_W / 2}" y="${footerY + 14 + i * LINE_H}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10">${esc(c)}</text>`;
      });
    }
 
    return this._svg(svg, {
      viewBox: `0 0 ${SVG_W} ${Math.ceil(SVG_H)}`,
      alt: `Comparative experiment: ${setups.map(s => s.label || '').filter(Boolean).join(' vs ')}.`,
      maxWidth: 500,
    });
  },
 
  /**
   * @private — container silhouette SVG for comparativeSetup panels.
   * cx = horizontal centre, baseY = bottom of container.
   */
  _containerSilhouette(cx, baseY, type) {
    switch (type) {
      case 'test_tube': {
        const w = 28, h = 70, r = 14;
        return `<path d="M ${cx - w / 2},${baseY - h} L ${cx - w / 2},${baseY - r} A ${r},${r} 0 0 0 ${cx + w / 2},${baseY - r} L ${cx + w / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>
                <line x1="${cx - w / 2 - 5}" y1="${baseY - h}" x2="${cx + w / 2 + 5}" y2="${baseY - h}" stroke="var(--brand-sage, #51615E)" stroke-width="2.5"/>`;
      }
      case 'flask': {
        const nw = 20, bw = 66, h = 70, neck = 24;
        return `<path d="M ${cx - nw / 2},${baseY - h} L ${cx - nw / 2},${baseY - neck} L ${cx - bw / 2},${baseY} L ${cx + bw / 2},${baseY} L ${cx + nw / 2},${baseY - neck} L ${cx + nw / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage, #51615E)" stroke-width="2" stroke-linejoin="round"/>
                <line x1="${cx - nw / 2 - 4}" y1="${baseY - h}" x2="${cx + nw / 2 + 4}" y2="${baseY - h}" stroke="var(--brand-sage, #51615E)" stroke-width="2.5"/>`;
      }
      case 'box': {
        const w = 74, h = 52;
        return `<rect x="${cx - w / 2}" y="${baseY - h}" width="${w}" height="${h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage, #51615E)" stroke-width="2" rx="3"/>`;
      }
      default: { // beaker
        const bw = 52, tw = 66, h = 68;
        return `<path d="M ${cx - tw / 2},${baseY - h} L ${cx - bw / 2},${baseY} L ${cx + bw / 2},${baseY} L ${cx + tw / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage, #51615E)" stroke-width="2" stroke-linejoin="round"/>
                <line x1="${cx - tw / 2 - 5}" y1="${baseY - h}" x2="${cx + tw / 2 + 5}" y2="${baseY - h}" stroke="var(--brand-sage, #51615E)" stroke-width="2.5"/>`;
      }
    }
  },

  /**
   * Side-by-side experiment comparison panel.
   * Used for: Heat (black vs white cloth), Light (shadow), Matter (states),
   *           P5 Cycles (condensation), P6 Forces (friction comparison).
   *
   * setups: array of up to 3 setup objects, each:
   *   { label, conditions: [string], result_label? }
   *
   * containerType: 'beaker' | 'test_tube' | 'flask' | 'box'
   *
   * Example:
   *   { "function_name": "comparativeSetup",
   *     "params": {
   *       "title": "Heat Absorption Experiment",
   *       "variable": "Colour of cloth",
   *       "containerType": "beaker",
   *       "setups": [
   *         { "label": "Setup A", "conditions": ["Black cloth","30 ml water","Sunny spot"], "result_label": "Temperature after 1 hour:" },
   *         { "label": "Setup B", "conditions": ["White cloth","30 ml water","Sunny spot"], "result_label": "Temperature after 1 hour:" }
   *       ],
   *       "commonConditions": ["Same beaker size", "Same starting temperature"]
   *     }
   *   }
   */
  comparativeSetup({
      title            = '',
      variable         = '',
      setups           = [],
      containerType    = 'beaker',
      commonConditions = [],
    } = {}) {
      const esc = this._esc.bind(this);
      if (!setups.length) return this.placeholder({ description: 'Comparative setup (no setups provided)' });
  
      const nSetups  = Math.min(setups.length, 3);
      const SVG_W    = 500;
      const PAD      = 18, PANEL_GAP = 14;
      const panelW   = (SVG_W - PAD * 2 - PANEL_GAP * (nSetups - 1)) / nSetups;
      const LINE_H   = 17;
      const CONT_H   = 82;   // container silhouette total height
  
      const maxConds = Math.max(...setups.map(s => (s.conditions || []).length), 0);
      const hasResult = setups.some(s => s.result_label);
      const commonH  = commonConditions.length ? (18 + commonConditions.length * LINE_H) : 0;
  
      // Build vertical layout heights
      const TITLE_H  = title    ? 26 : 0;
      const VAR_H    = variable ? 24 : 0;
      const SVG_H    = TITLE_H + VAR_H + 8           // header
                    + 18 + CONT_H + 10              // setup label + container
                    + maxConds * LINE_H             // conditions
                    + (hasResult ? 30 : 0)          // result underline
                    + commonH + 14;                 // common conditions + bottom pad
  
      let svg = '';
      let curY = 0;
  
      // ── Title ──────────────────────────────────────────────
      if (title) {
        curY += 18;
        svg += `<text x="${SVG_W / 2}" y="${curY}" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="13" font-weight="700">${esc(title)}</text>`;
      }
  
      // ── Changed variable banner ────────────────────────────
      if (variable) {
        curY += 22;
        svg += `<rect x="${PAD}" y="${curY - 4}" width="${SVG_W - PAD * 2}" height="19" rx="4" fill="rgba(183,110,121,0.12)"/>`;
        svg += `<text x="${SVG_W / 2}" y="${curY + 10}" text-anchor="middle" fill="var(--brand-rose, #B76E79)" font-size="11" font-weight="700">Changed variable: ${esc(variable)}</text>`;
      }
      curY += 12;
  
      const panelTopY = curY; // Y where panel content starts
  
      // ── Vertical dividers between panels ──────────────────
      for (let i = 1; i < nSetups; i++) {
        const dx = PAD + i * (panelW + PANEL_GAP) - PANEL_GAP / 2;
        svg += `<line x1="${dx.toFixed(1)}" y1="${panelTopY}" x2="${dx.toFixed(1)}" y2="${SVG_H - 14 - commonH}" stroke="var(--border-light, #d6e3dc)" stroke-width="1" stroke-dasharray="4,3"/>`;
      }
  
      // ── Render each panel ──────────────────────────────────
      for (let pi = 0; pi < nSetups; pi++) {
        const s       = setups[pi];
        const panelX  = PAD + pi * (panelW + PANEL_GAP);
        const panelCX = panelX + panelW / 2;
        const lbl     = s.label || `Setup ${String.fromCharCode(65 + pi)}`;
  
        let py = panelTopY;
  
        // Panel label
        py += 14;
        svg += `<text x="${panelCX.toFixed(1)}" y="${py}" text-anchor="middle" fill="var(--brand-sage, #51615E)" font-size="12" font-weight="700">${esc(lbl)}</text>`;
  
        // Container silhouette
        py += 10;
        const contBaseY = py + CONT_H;
        svg += this._containerSilhouette(panelCX, contBaseY, containerType);
        py = contBaseY + 12;
  
        // Conditions list
        (s.conditions || []).forEach((cond, ci) => {
          svg += `<text x="${(panelX + 6).toFixed(1)}" y="${(py + ci * LINE_H + 12).toFixed(1)}" fill="var(--text-main, #1a2e2a)" font-size="11">• ${esc(cond)}</text>`;
        });
  
        // Result label + underline (answer space)
        if (s.result_label) {
          const ry = py + maxConds * LINE_H + 12;
          svg += `<text x="${panelCX.toFixed(1)}" y="${ry}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10" font-style="italic">${esc(s.result_label)}</text>`;
          svg += `<line x1="${(panelX + 8).toFixed(1)}" y1="${(ry + 5).toFixed(1)}" x2="${(panelX + panelW - 8).toFixed(1)}" y2="${(ry + 5).toFixed(1)}" stroke="var(--border-dark, #8da89e)" stroke-width="1"/>`;
        }
      }
  
      // ── Common conditions footer ───────────────────────────
      if (commonConditions.length) {
        const footerY = SVG_H - 14 - commonH + 14;
        svg += `<line x1="${PAD}" y1="${footerY - 10}" x2="${SVG_W - PAD}" y2="${footerY - 10}" stroke="var(--border-light, #d6e3dc)" stroke-width="1"/>`;
        svg += `<text x="${SVG_W / 2}" y="${footerY}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10" font-weight="600">Same conditions in all setups:</text>`;
        commonConditions.forEach((c, i) => {
          svg += `<text x="${SVG_W / 2}" y="${footerY + 14 + i * LINE_H}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10">${esc(c)}</text>`;
        });
      }
  
      return this._svg(svg, {
        viewBox: `0 0 ${SVG_W} ${Math.ceil(SVG_H)}`,
        alt: `Comparative experiment: ${setups.map(s => s.label || '').filter(Boolean).join(' vs ')}.`,
        maxWidth: 500,
      });
    },
  
  /**
   * MOE-schematic magnet diagram for P4 Magnets topic.
   *
   * magnetType: 'bar' | 'horseshoe' | 'electromagnet'
   *
   * For bar magnets:
   *   magnets: [{ poles: ['N','S'] }]   — 1 or 2 magnets
   *   interaction: 'none' | 'attraction' | 'repulsion'
   *
   *   Two-magnet repulsion (N facing N):
   *     magnets: [{ poles: ['S','N'] }, { poles: ['N','S'] }], interaction: 'repulsion'
   *
   *   Two-magnet attraction (N facing S):
   *     magnets: [{ poles: ['S','N'] }, { poles: ['S','N'] }], interaction: 'attraction'
   *
   * For electromagnet:
   *   coreMaterial: 'iron' | 'copper' | 'plastic'
   *   coilsCount: number of coil turns shown (default 5)
   *   batteryCount: number of battery cells shown (default 1)
   *
   * NOTE: CSS variables --color-magnet-N and --color-magnet-S should be added
   * to style.css for proper MOE red/blue convention:
   *   --color-magnet-N: #C0392B;  (red)
   *   --color-magnet-S: #2471A3;  (blue)
   * The fallback values (#C0392B, #2471A3) are used until those vars are defined.
   */
  
  magnetDiagram({
    magnetType   = 'bar',
    magnets      = [{ poles: ['N', 'S'] }],
    interaction  = 'none',
    coreMaterial = 'iron',
    coilsCount   = 5,
    batteryCount = 1,
    label        = '',
  } = {}) {
    const esc = this._esc.bind(this);
    // N = red, S = blue — using CSS var with hardcoded fallback
    const N_CLR = 'var(--color-magnet-N, #C0392B)';
    const S_CLR = 'var(--color-magnet-S, #2471A3)';
    const pClr  = (p) => (String(p).toUpperCase() === 'N') ? N_CLR : S_CLR;
 
    let svg = '', vbW = 400, vbH = 200;
 
    // ── Electromagnet ──────────────────────────────────────
    if (magnetType === 'electromagnet') {
      vbW = 500; vbH = 230;
      const rodX = 90, rodY = 100, rodW = 290, rodH = 24;
      const coilX1 = rodX + 20, coilX2 = rodX + rodW - 20;
 
      // Rod
      const rodFill = coreMaterial === 'copper' ? '#C27A35'
                    : coreMaterial === 'plastic' ? 'var(--text-muted, #5d706b)'
                    : 'var(--brand-sage, #51615E)';
      svg += `<rect x="${rodX}" y="${rodY}" width="${rodW}" height="${rodH}" rx="4" fill="${rodFill}" stroke="var(--text-main, #1a2e2a)" stroke-width="1.5"/>`;
      svg += `<text x="${rodX + rodW / 2}" y="${rodY + rodH + 16}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10">${esc(coreMaterial)} core</text>`;
 
      // Coil windings: quadratic bezier arcs above and below the rod
      const step = (coilX2 - coilX1) / coilsCount;
      const arcH = 14;
      let topPath = `M ${coilX1},${rodY}`;
      let botPath = `M ${coilX1},${rodY + rodH}`;
      for (let i = 0; i < coilsCount; i++) {
        const mx = coilX1 + (i + 0.5) * step;
        const ex = coilX1 + (i + 1) * step;
        topPath += ` Q ${mx.toFixed(1)},${rodY - arcH} ${ex.toFixed(1)},${rodY}`;
        botPath += ` Q ${mx.toFixed(1)},${rodY + rodH + arcH} ${ex.toFixed(1)},${rodY + rodH}`;
      }
      svg += `<path d="${topPath}" fill="none" stroke="var(--text-main, #1a2e2a)" stroke-width="2"/>`;
      svg += `<path d="${botPath}" fill="none" stroke="var(--text-main, #1a2e2a)" stroke-width="2"/>`;
 
      // Battery (left side): long line = +, short line = −
      const batCX = 38, batCY = rodY + rodH / 2;
      const cellSpacing = 14;
      for (let i = 0; i < Math.min(batteryCount, 3); i++) {
        const bx = batCX - (batteryCount - 1) * cellSpacing / 2 + i * cellSpacing;
        svg += `<line x1="${bx}" y1="${batCY - 16}" x2="${bx}" y2="${batCY + 16}" stroke="var(--text-main, #1a2e2a)" stroke-width="3"/>`;
        if (i < batteryCount - 1) {
          svg += `<line x1="${bx + cellSpacing / 2}" y1="${batCY - 9}" x2="${bx + cellSpacing / 2}" y2="${batCY + 9}" stroke="var(--text-main, #1a2e2a)" stroke-width="2"/>`;
        }
      }
      svg += `<text x="${batCX - 6}" y="${batCY - 22}" fill="var(--text-main, #1a2e2a)" font-size="11" font-weight="700" text-anchor="middle">+</text>`;
 
      // Wires connecting battery to coil (top and bottom)
      svg += `<polyline points="${batCX},${batCY - 16} ${batCX},${rodY - arcH - 6} ${coilX1},${rodY}" fill="none" stroke="var(--text-main, #1a2e2a)" stroke-width="1.5"/>`;
      svg += `<polyline points="${batCX},${batCY + 16} ${batCX},${rodY + rodH + arcH + 6} ${coilX1},${rodY + rodH}" fill="none" stroke="var(--text-main, #1a2e2a)" stroke-width="1.5"/>`;
 
      // Closing wire on right side
      svg += `<polyline points="${coilX2},${rodY} ${coilX2 + 20},${rodY - arcH - 6} ${coilX2 + 20},${rodY + rodH + arcH + 6} ${coilX2},${rodY + rodH}" fill="none" stroke="var(--text-main, #1a2e2a)" stroke-width="1.5"/>`;
 
      // Pole labels at rod ends
      svg += `<text x="${rodX + 10}" y="${rodY - 8}" fill="${N_CLR}" font-size="15" font-weight="800">N</text>`;
      svg += `<text x="${rodX + rodW - 12}" y="${rodY - 8}" fill="${S_CLR}" font-size="15" font-weight="800">S</text>`;
 
    // ── Horseshoe magnet ───────────────────────────────────
    } else if (magnetType === 'horseshoe') {
      vbW = 300; vbH = 250;
      const armW = 30, armH = 115, gap = 90;
      const lx = 85, rx = lx + gap, topY = 65;
 
      // Body (two arms + curved bottom)
      const bodyPath = `M ${lx},${topY + armH}
        Q ${lx},${topY + armH + 45} ${lx + gap / 2 + armW / 2},${topY + armH + 45}
        Q ${rx + armW},${topY + armH + 45} ${rx + armW},${topY + armH}
        L ${rx + armW},${topY} L ${rx},${topY} L ${rx},${topY + armH}
        Q ${rx},${topY + armH + 30} ${lx + gap / 2 + armW / 2},${topY + armH + 30}
        Q ${lx},${topY + armH + 30} ${lx},${topY + armH}
        L ${lx},${topY} Z`;
      svg += `<path d="${bodyPath}" fill="var(--brand-sage, #51615E)" stroke="var(--text-main, #1a2e2a)" stroke-width="2" stroke-linejoin="round"/>`;
 
      // Pole caps (coloured top portions)
      const m0 = (magnets[0] || { poles: ['N', 'S'] });
      svg += `<rect x="${lx}" y="${topY}" width="${armW}" height="26" rx="4" fill="${pClr(m0.poles[0])}"/>`;
      svg += `<rect x="${rx}" y="${topY}" width="${armW}" height="26" rx="4" fill="${pClr(m0.poles[1])}"/>`;
 
      // Pole labels above each arm
      svg += `<text x="${lx + armW / 2}" y="${topY - 8}" text-anchor="middle" fill="${pClr(m0.poles[0])}" font-size="17" font-weight="800">${esc(m0.poles[0])}</text>`;
      svg += `<text x="${rx + armW / 2}" y="${topY - 8}" text-anchor="middle" fill="${pClr(m0.poles[1])}" font-size="17" font-weight="800">${esc(m0.poles[1])}</text>`;
 
    // ── Bar magnet(s) ──────────────────────────────────────
    } else {
      const nMagnets = Math.min(magnets.length || 1, 2);
      const MAG_W = 178, MAG_H = 48, GAP_BTW = 56;
 
      if (nMagnets === 1) {
        vbW = 300; vbH = 160;
        svg += this._drawBarMagnet(61, 56, MAG_W, MAG_H, (magnets[0] || {}).poles || ['N','S'], pClr, esc);
      } else {
        vbW = 480; vbH = 160;
        const m1x = 16, m2x = 16 + MAG_W + GAP_BTW, my = 56;
        svg += this._drawBarMagnet(m1x, my, MAG_W, MAG_H, (magnets[0] || {}).poles || ['N','S'], pClr, esc);
        svg += this._drawBarMagnet(m2x, my, MAG_W, MAG_H, (magnets[1] || {}).poles || ['N','S'], pClr, esc);
 
        // Interaction arrows and label
        const midX  = m1x + MAG_W + GAP_BTW / 2;
        const midY  = my + MAG_H / 2;
        const IID   = interaction === 'repulsion' ? 'dlab_rep' : 'dlab_att';
        const iClr  = interaction === 'repulsion' ? 'var(--brand-rose, #B76E79)' : 'var(--brand-sage, #51615E)';
        svg += `<defs><marker id="${IID}" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto"><polygon points="0 0,8 3.5,0 7" fill="${iClr}"/></marker></defs>`;
 
        if (interaction === 'repulsion') {
          // Arrows pointing AWAY from centre: ← →
          svg += `<line x1="${midX - 4}" y1="${midY}" x2="${m1x + MAG_W + 4}" y2="${midY}" stroke="${iClr}" stroke-width="2" marker-end="url(#${IID})"/>`;
          svg += `<line x1="${midX + 4}" y1="${midY}" x2="${m2x - 4}" y2="${midY}" stroke="${iClr}" stroke-width="2" marker-end="url(#${IID})"/>`;
          svg += `<text x="${midX}" y="${midY + 20}" text-anchor="middle" fill="${iClr}" font-size="10" font-weight="600">repel</text>`;
        } else if (interaction === 'attraction') {
          // Arrows pointing TOWARD centre: → ←
          svg += `<line x1="${m1x + MAG_W + 4}" y1="${midY}" x2="${midX - 4}" y2="${midY}" stroke="${iClr}" stroke-width="2" marker-end="url(#${IID})"/>`;
          svg += `<line x1="${m2x - 4}" y1="${midY}" x2="${midX + 4}" y2="${midY}" stroke="${iClr}" stroke-width="2" marker-end="url(#${IID})"/>`;
          svg += `<text x="${midX}" y="${midY + 20}" text-anchor="middle" fill="${iClr}" font-size="10" font-weight="600">attract</text>`;
        }
      }
    }
 
    if (label) {
      svg += `<text x="${vbW / 2}" y="${vbH - 5}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10" font-style="italic">${esc(label)}</text>`;
    }
 
    return this._svg(svg, {
      viewBox: `0 0 ${vbW} ${vbH}`,
      alt: `${magnetType} magnet diagram${interaction !== 'none' ? ': ' + interaction : ''}.`,
      maxWidth: vbW,
    });
  },
 
  /** @private — draws one bar magnet rectangle with coloured pole halves */
  _drawBarMagnet(x, y, w, h, poles, pClr, esc) {
    const hw = w / 2;
    const p0 = String((poles || [])[0] || 'N').toUpperCase();
    const p1 = String((poles || [])[1] || 'S').toUpperCase();
    return `
      <rect x="${x}"      y="${y}" width="${hw}" height="${h}" fill="${pClr(p0)}" rx="6" stroke="var(--text-main, #1a2e2a)" stroke-width="1.5"/>
      <rect x="${x + hw}" y="${y}" width="${hw}" height="${h}" fill="${pClr(p1)}" rx="6" stroke="var(--text-main, #1a2e2a)" stroke-width="1.5"/>
      <line x1="${x + hw}" y1="${y}" x2="${x + hw}" y2="${y + h}" stroke="var(--text-main, #1a2e2a)" stroke-width="1.5"/>
      <text x="${x + hw / 2}"      y="${y + h / 2 + 6}" text-anchor="middle" fill="white" font-size="16" font-weight="800">${esc(p0)}</text>
      <text x="${x + hw + hw / 2}" y="${y + h / 2 + 6}" text-anchor="middle" fill="white" font-size="16" font-weight="800">${esc(p1)}</text>
    `;
  },

  /**
   * @private — container silhouette SVG for comparativeSetup panels.
   * cx = horizontal centre, baseY = bottom of container.
   */
  _containerSilhouette(cx, baseY, type) {
    switch (type) {
      case 'test_tube': {
        const w = 28, h = 70, r = 14;
        return `<path d="M ${cx - w / 2},${baseY - h} L ${cx - w / 2},${baseY - r} A ${r},${r} 0 0 0 ${cx + w / 2},${baseY - r} L ${cx + w / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>
                <line x1="${cx - w / 2 - 5}" y1="${baseY - h}" x2="${cx + w / 2 + 5}" y2="${baseY - h}" stroke="var(--brand-sage, #51615E)" stroke-width="2.5"/>`;
      }
      case 'flask': {
        const nw = 20, bw = 66, h = 70, neck = 24;
        return `<path d="M ${cx - nw / 2},${baseY - h} L ${cx - nw / 2},${baseY - neck} L ${cx - bw / 2},${baseY} L ${cx + bw / 2},${baseY} L ${cx + nw / 2},${baseY - neck} L ${cx + nw / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage, #51615E)" stroke-width="2" stroke-linejoin="round"/>
                <line x1="${cx - nw / 2 - 4}" y1="${baseY - h}" x2="${cx + nw / 2 + 4}" y2="${baseY - h}" stroke="var(--brand-sage, #51615E)" stroke-width="2.5"/>`;
      }
      case 'box': {
        const w = 74, h = 52;
        return `<rect x="${cx - w / 2}" y="${baseY - h}" width="${w}" height="${h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage, #51615E)" stroke-width="2" rx="3"/>`;
      }
      default: { // beaker
        const bw = 52, tw = 66, h = 68;
        return `<path d="M ${cx - tw / 2},${baseY - h} L ${cx - bw / 2},${baseY} L ${cx + bw / 2},${baseY} L ${cx + tw / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage, #51615E)" stroke-width="2" stroke-linejoin="round"/>
                <line x1="${cx - tw / 2 - 5}" y1="${baseY - h}" x2="${cx + tw / 2 + 5}" y2="${baseY - h}" stroke="var(--brand-sage, #51615E)" stroke-width="2.5"/>`;
      }
    }
  },

  /**
   * Inclined plane experiment for P6 Forces topic.
   *
   * rampAngle: degrees from horizontal (10–70)
   * surfaceTexture: 'smooth' | 'rough' | 'sandpaper' | 'glass'
   * blockLabel: text shown on the block (e.g. '1 kg')
   * forceArrows: [{ direction, label }]
   *   direction values: 'down' | 'up_slope' | 'down_slope' | 'normal' | 'left' | 'right'
   * springState: 'none' | 'compressed' | 'extended'
   * showAngleLabel: true/false
   *
   * Direction conventions (ramp rises from LEFT to RIGHT):
   *   'up_slope'  = friction opposing downward motion
   *   'down_slope'= component of gravity along slope
   *   'normal'    = normal force perpendicular away from slope surface
   *   'down'      = weight / gravity
   *
   * Example (block on rough ramp with weight and friction arrows):
   *   { "function_name": "rampExperiment",
   *     "params": {
   *       "rampAngle": 30,
   *       "surfaceTexture": "rough",
   *       "blockLabel": "Block",
   *       "showAngleLabel": true,
   *       "forceArrows": [
   *         { "direction": "down",     "label": "Weight" },
   *         { "direction": "up_slope", "label": "Friction" },
   *         { "direction": "normal",   "label": "Normal force" }
   *       ]
   *     }
   *   }
   */

  rampExperiment({
    rampAngle      = 30,
    surfaceTexture = 'smooth',
    blockLabel     = '',
    forceArrows    = [],
    springState    = 'none',
    showAngleLabel = true,
    label          = '',
  } = {}) {
    const esc = this._esc.bind(this);
    const vbW = 500, vbH = 290;
    const θ = Math.min(Math.max(rampAngle, 10), 70) * Math.PI / 180;
 
    // ── Ramp geometry ─────────────────────────────────────
    // Ramp rises from lower-LEFT (bx, baseY) to upper-RIGHT (apex)
    const bx = 55, baseY = 248;
    const SLOPE_LEN = 210;
    const rampH    = SLOPE_LEN * Math.sin(θ);
    const rampBase = SLOPE_LEN * Math.cos(θ);
    const apex     = { x: bx + rampBase, y: baseY - rampH };
 
    // ── Force arrow marker ────────────────────────────────
    let svg = `<defs>
      <marker id="dlab_fa" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
        <polygon points="0 0, 9 3.5, 0 7" fill="var(--brand-amber, #D97706)"/>
      </marker>
    </defs>`;
 
    // ── Ramp triangle fill ────────────────────────────────
    svg += `<polygon points="${bx},${baseY} ${apex.x.toFixed(1)},${apex.y.toFixed(1)} ${apex.x.toFixed(1)},${baseY}" fill="var(--bg-elevated, #f0f5f2)" stroke="var(--brand-sage, #51615E)" stroke-width="2.5"/>`;
 
    // ── Surface texture ───────────────────────────────────
    const steps  = 22;
    const nx = Math.sin(θ), ny = Math.cos(θ); // inward normal (into slope face)
 
    if (surfaceTexture === 'rough') {
      // Zigzag line 3px inside the slope edge
      let pts = '';
      for (let i = 0; i <= steps; i++) {
        const t  = i / steps;
        const px = bx + t * rampBase;
        const py = baseY - t * rampH;
        const amp = (i % 2 === 0 ? 1 : -1) * 4;
        pts += `${(px + nx * amp).toFixed(1)},${(py + ny * amp).toFixed(1)} `;
      }
      svg += `<polyline points="${pts.trim()}" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="1.5" opacity="0.65"/>`;
 
    } else if (surfaceTexture === 'sandpaper') {
      // Dense short tick marks perpendicular to the slope
      for (let i = 1; i < steps; i++) {
        const t  = i / steps;
        const px = bx + t * rampBase;
        const py = baseY - t * rampH;
        svg += `<line x1="${(px + nx * 2).toFixed(1)}" y1="${(py + ny * 2).toFixed(1)}" x2="${(px + nx * 9).toFixed(1)}" y2="${(py + ny * 9).toFixed(1)}" stroke="var(--text-muted, #5d706b)" stroke-width="1.5" opacity="0.55"/>`;
      }
 
    } else if (surfaceTexture === 'glass') {
      // Bright dashed line along slope edge + two sparkle dots
      svg += `<line x1="${bx}" y1="${baseY}" x2="${apex.x.toFixed(1)}" y2="${apex.y.toFixed(1)}" stroke="white" stroke-width="3" stroke-dasharray="10,6" opacity="0.8"/>`;
      const gx = bx + rampBase * 0.35, gy = baseY - rampH * 0.35;
      svg += `<circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="3" fill="white" opacity="0.9"/>`;
    }
    // smooth: no extra texture — just the outline
 
    // ── Ground line + hatching ────────────────────────────
    svg += `<line x1="${bx - 22}" y1="${baseY}" x2="${apex.x + 28}" y2="${baseY}" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
    for (let i = 0; i < 14; i++) {
      const gx = bx - 22 + i * 16;
      svg += `<line x1="${gx}" y1="${baseY}" x2="${gx - 7}" y2="${baseY + 9}" stroke="var(--brand-sage, #51615E)" stroke-width="1" opacity="0.45"/>`;
    }
 
    // ── Block on slope ────────────────────────────────────
    const fBlock = 0.52;
    const blockCX = bx + fBlock * rampBase;
    const blockCY = baseY - fBlock * rampH;
    const bw = 44, bh = 32;
    // Rotate CLOCKWISE by rampAngle so the block's base aligns with the slope surface
    svg += `<g transform="rotate(${rampAngle}, ${blockCX.toFixed(1)}, ${blockCY.toFixed(1)})">
      <rect x="${(blockCX - bw / 2).toFixed(1)}" y="${(blockCY - bh).toFixed(1)}"
            width="${bw}" height="${bh}" rx="3"
            fill="var(--brand-rose, #B76E79)" fill-opacity="0.72" stroke="var(--brand-rose, #B76E79)" stroke-width="1.5"/>`;
    if (blockLabel) {
      svg += `<text x="${blockCX.toFixed(1)}" y="${(blockCY - bh / 2 + 5).toFixed(1)}"
                    text-anchor="middle" fill="white" font-size="10" font-weight="700">${esc(blockLabel)}</text>`;
    }
    svg += `</g>`;
 
    // ── Force arrows ──────────────────────────────────────
    // Direction vectors (SVG coords: x right, y down)
    const cosT = Math.cos(θ), sinT = Math.sin(θ);
    const dirVec = {
      down:       [0, 1],
      up:         [0, -1],
      up_slope:   [cosT, -sinT],           // up the slope
      down_slope: [-cosT, sinT],           // down the slope
      normal:     [-sinT, -cosT],          // perpendicular, away from surface
      left:       [-1, 0],
      right:      [1, 0],
    };
 
    const ARROW_LEN = 54;
    // Arrow origin: slightly above block centre to avoid the block itself
    const arrowOriginX = blockCX;
    const arrowOriginY = blockCY - bh * 0.55;
 
    forceArrows.forEach((fa, idx) => {
      const dir = dirVec[fa.direction] || dirVec.down;
      // Small lateral offset so multiple arrows don't stack on the same line
      const perpX = -dir[1] * 7 * (idx % 2 === 0 ? idx / 2 : -(idx + 1) / 2);
      const perpY =  dir[0] * 7 * (idx % 2 === 0 ? idx / 2 : -(idx + 1) / 2);
      const ax1 = arrowOriginX + perpX, ay1 = arrowOriginY + perpY;
      const ax2 = ax1 + dir[0] * ARROW_LEN;
      const ay2 = ay1 + dir[1] * ARROW_LEN;
 
      svg += `<line x1="${ax1.toFixed(1)}" y1="${ay1.toFixed(1)}" x2="${ax2.toFixed(1)}" y2="${ay2.toFixed(1)}" stroke="var(--brand-amber, #D97706)" stroke-width="2.5" marker-end="url(#dlab_fa)"/>`;
 
      if (fa.label) {
        const anchor = dir[0] > 0.3 ? 'start' : dir[0] < -0.3 ? 'end' : 'middle';
        svg += `<text x="${(ax2 + dir[0] * 7).toFixed(1)}" y="${(ay2 + dir[1] * 7 + 4).toFixed(1)}" text-anchor="${anchor}" fill="var(--brand-amber, #D97706)" font-size="11" font-weight="600">${esc(fa.label)}</text>`;
      }
    });
 
    // ── Angle label arc ───────────────────────────────────
    if (showAngleLabel) {
      const arcR   = 38;
      const arcEnd = { x: bx + arcR * Math.cos(θ), y: baseY - arcR * Math.sin(θ) };
      // sweep-flag=0 → counterclockwise arc from (bx+arcR, baseY) to arcEnd — short arc inside the angle
      svg += `<path d="M ${bx + arcR},${baseY} A ${arcR},${arcR} 0 0,0 ${arcEnd.x.toFixed(1)},${arcEnd.y.toFixed(1)}" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="1.5"/>`;
      const midAngle = θ / 2;
      const lblR = arcR + 15;
      svg += `<text x="${(bx + lblR * Math.cos(midAngle)).toFixed(1)}" y="${(baseY - lblR * Math.sin(midAngle)).toFixed(1)}" text-anchor="middle" fill="var(--brand-sage, #51615E)" font-size="11" font-weight="600">${rampAngle}°</text>`;
    }
 
    // ── Spring ────────────────────────────────────────────
    if (springState !== 'none') {
      // Spring runs DOWN the slope from the block's lower face
      const spLen   = springState === 'compressed' ? 28 : 52;
      const spCoils = springState === 'compressed' ? 7 : 5;
      // Start of spring: centre of block's lower face (approximated)
      const spSX = blockCX - cosT * (bw * 0.4);
      const spSY = blockCY + sinT * (bw * 0.4);
      const step = spLen / spCoils;
 
      let spPath = `M ${spSX.toFixed(1)},${spSY.toFixed(1)}`;
      for (let i = 0; i < spCoils; i++) {
        const t   = (i + 0.5) / spCoils;
        const te  = (i + 1) / spCoils;
        // Perpendicular offset alternates sides
        const amp = (i % 2 === 0 ? 8 : -8);
        const mpx = spSX - cosT * t * spLen + (-sinT) * amp;
        const mpy = spSY + sinT * t * spLen + (-cosT) * amp;
        const epx = spSX - cosT * te * spLen;
        const epy = spSY + sinT * te * spLen;
        spPath += ` Q ${mpx.toFixed(1)},${mpy.toFixed(1)} ${epx.toFixed(1)},${epy.toFixed(1)}`;
      }
      svg += `<path d="${spPath}" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;
    }
 
    // ── Caption ───────────────────────────────────────────
    if (label) {
      svg += `<text x="${vbW / 2}" y="${vbH - 5}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="10" font-style="italic">${esc(label)}</text>`;
    }
 
    return this._svg(svg, {
      viewBox: `0 0 ${vbW} ${vbH}`,
      alt: `Inclined plane experiment: ${rampAngle}° angle, ${surfaceTexture} surface${blockLabel ? ', ' + blockLabel + ' block' : ''}.`,
      maxWidth: 500,
    });
  },

  // ── NEW: Phase 4 functions for v5 taxonomy alignment ───────────────────────

  /**
   * netDiagram — Unfolded 2D net of a 3D solid (P4 Geometry).
   *
   * Used for "Identifying Nets Of Three-Dimensional Solids" sub_topic.
   *
   * params:
   *   solid:           "cube" | "cuboid" | "triangular_prism" | "square_pyramid" | "cylinder"
   *   labels:          optional array of face labels (A, B, C, …) drawn at face centres
   *   highlight_face:  optional label string — that face is rose-tinted
   *   show_dimensions: optional bool — adds dimension labels (cuboid only)
   *   length_label / breadth_label / height_label: cuboid dimensions
   *
   * Layout (cuboid example, length=3 breadth=2 height=2 unit cells):
   *
   *           ┌───┐
   *           │ T │           ← top
   *       ┌───┼───┼───┬───┐
   *       │ L │ F │ R │ B │   ← left-front-right-back
   *       └───┼───┼───┴───┘
   *           │ U │           ← under
   *           └───┘
   */
  netDiagram(params = {}) {
    const esc = this._esc.bind(this);
    const {
      solid = 'cube',
      labels = [],
      highlight_face = null,
      show_dimensions = false,
      length_label = '',
      breadth_label = '',
      height_label = '',
    } = params;

    const VB_W = 400, VB_H = 260;
    const STROKE = 'var(--brand-sage, #51615E)';
    const FILL = 'var(--bg-surface, #ffffff)';
    const HIGHLIGHT = 'var(--brand-rose, #B76E79)';
    const TEXT = 'var(--text-main, #1a2e2a)';
    const DIM = 'var(--text-muted, #5d706b)';

    // Helper: rect with optional label & highlight
    const cell = (x, y, w, h, label) => {
      const isHi = label && highlight_face === label;
      const fillColour = isHi ? HIGHLIGHT : FILL;
      const opacity = isHi ? 0.35 : 1;
      const labelEl = label
        ? `<text x="${(x + w / 2).toFixed(1)}" y="${(y + h / 2 + 4).toFixed(1)}" text-anchor="middle" fill="${TEXT}" font-size="13" font-weight="600">${esc(label)}</text>`
        : '';
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fillColour}" fill-opacity="${opacity}" stroke="${STROKE}" stroke-width="2"/>${labelEl}`;
    };

    // Helper: filled triangle with optional label
    const tri = (points, label) => {
      const isHi = label && highlight_face === label;
      const fillColour = isHi ? HIGHLIGHT : FILL;
      const opacity = isHi ? 0.35 : 1;
      const ptsStr = points.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
      // centroid
      const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
      const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
      const labelEl = label
        ? `<text x="${cx.toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="middle" fill="${TEXT}" font-size="12" font-weight="600">${esc(label)}</text>`
        : '';
      return `<polygon points="${ptsStr}" fill="${fillColour}" fill-opacity="${opacity}" stroke="${STROKE}" stroke-width="2" stroke-linejoin="round"/>${labelEl}`;
    };

    let body = '';
    let title = '';

    if (solid === 'cube') {
      // Cross net: 4 faces in a row + top above 2nd + bottom below 2nd
      const s = 50;                                          // face size (px)
      const cx0 = (VB_W - 4 * s) / 2;                        // start x of horizontal strip
      const cy0 = (VB_H - 3 * s) / 2 + 8;                    // top row y
      const lab = (i) => labels[i] || '';
      body = [
        cell(cx0 + s,     cy0,         s, s, lab(0)),        // top
        cell(cx0,         cy0 + s,     s, s, lab(1)),        // left
        cell(cx0 + s,     cy0 + s,     s, s, lab(2)),        // front
        cell(cx0 + 2 * s, cy0 + s,     s, s, lab(3)),        // right
        cell(cx0 + 3 * s, cy0 + s,     s, s, lab(4)),        // back
        cell(cx0 + s,     cy0 + 2 * s, s, s, lab(5)),        // bottom
      ].join('');
      title = 'Net of a cube';
    }
    else if (solid === 'cuboid') {
      // Same cross layout but with 3 distinct dimensions: length (L), breadth (B), height (H).
      // Top/bottom faces: L × B. Front/back: L × H. Left/right: B × H.
      // Pick px sizes that fit and look proportional.
      const L = 70, B = 45, H = 45;
      const cx0 = (VB_W - (B + L + B + L)) / 2;              // horizontal strip = left+front+right+back
      const cy0 = (VB_H - (B + H + B)) / 2 + 6;              // 3 vertical bands
      const lab = (i) => labels[i] || '';
      body = [
        cell(cx0 + B,       cy0,             L, B, lab(0)),  // top:    L × B
        cell(cx0,           cy0 + B,         B, H, lab(1)),  // left:   B × H
        cell(cx0 + B,       cy0 + B,         L, H, lab(2)),  // front:  L × H
        cell(cx0 + B + L,   cy0 + B,         B, H, lab(3)),  // right:  B × H
        cell(cx0 + B + L + B, cy0 + B,       L, H, lab(4)),  // back:   L × H
        cell(cx0 + B,       cy0 + B + H,     L, B, lab(5)),  // bottom: L × B
      ].join('');
      if (show_dimensions) {
        // Dim arrows along bottom of front face (length) + left of front face (height)
        const fx = cx0 + B, fy = cy0 + B;
        body += `<text x="${(fx + L / 2).toFixed(1)}" y="${(fy + H + B + 16).toFixed(1)}" text-anchor="middle" fill="${DIM}" font-size="11">${esc(length_label || 'L')}</text>`;
        body += `<text x="${(fx - 8).toFixed(1)}" y="${(fy + H / 2 + 4).toFixed(1)}" text-anchor="end" fill="${DIM}" font-size="11">${esc(height_label || 'H')}</text>`;
        body += `<text x="${(cx0 + B / 2).toFixed(1)}" y="${(fy + H + B - 6).toFixed(1)}" text-anchor="middle" fill="${DIM}" font-size="11">${esc(breadth_label || 'B')}</text>`;
      }
      title = 'Net of a cuboid';
    }
    else if (solid === 'triangular_prism') {
      // 3 rectangles stacked vertically (the 3 lateral faces) with 2 triangles flanking the middle rect.
      const recW = 90, recH = 50;                            // rectangle face sizes
      const triH = 50;                                       // equilateral triangle height
      const triBase = recW;                                  // shared edge with rect
      const cx0 = (VB_W - recW) / 2;
      const cy0 = (VB_H - (3 * recH)) / 2 + 4;
      const lab = (i) => labels[i] || '';
      body = [
        cell(cx0, cy0,             recW, recH, lab(0)),       // top rect
        cell(cx0, cy0 + recH,      recW, recH, lab(1)),       // middle rect (lateral face with triangles)
        cell(cx0, cy0 + 2 * recH,  recW, recH, lab(2)),       // bottom rect
        // Left triangle: apex pointing left from middle rect's left edge
        tri([[cx0, cy0 + recH], [cx0, cy0 + 2 * recH], [cx0 - triH, cy0 + recH + triBase / 2]], lab(3)),
        // Right triangle: apex pointing right
        tri([[cx0 + recW, cy0 + recH], [cx0 + recW, cy0 + 2 * recH], [cx0 + recW + triH, cy0 + recH + triBase / 2]], lab(4)),
      ].join('');
      title = 'Net of a triangular prism';
    }
    else if (solid === 'square_pyramid') {
      // Central square + 4 triangles (one on each side, apex pointing outward)
      const s = 70;                                          // base square side
      const triH = 60;                                       // triangle height (slant)
      const cx0 = (VB_W - s) / 2;
      const cy0 = (VB_H - s) / 2;
      const lab = (i) => labels[i] || '';
      body = [
        cell(cx0, cy0, s, s, lab(0)),                                                       // base square
        // Top triangle
        tri([[cx0, cy0], [cx0 + s, cy0], [cx0 + s / 2, cy0 - triH]], lab(1)),
        // Right triangle
        tri([[cx0 + s, cy0], [cx0 + s, cy0 + s], [cx0 + s + triH, cy0 + s / 2]], lab(2)),
        // Bottom triangle
        tri([[cx0, cy0 + s], [cx0 + s, cy0 + s], [cx0 + s / 2, cy0 + s + triH]], lab(3)),
        // Left triangle
        tri([[cx0, cy0], [cx0, cy0 + s], [cx0 - triH, cy0 + s / 2]], lab(4)),
      ].join('');
      title = 'Net of a square pyramid';
    }
    else if (solid === 'cylinder') {
      // 2 circles (top + bottom) + 1 rectangle (curved surface unrolled).
      // Layout: rect in centre with circles at top-left and top-right of rect, "attached" via shared tangent.
      const r = 28;                                          // circle radius
      const recW = 180, recH = 60;                           // rectangle (2πr × h ideally)
      const cx0 = (VB_W - recW) / 2;
      const cy0 = (VB_H - recH) / 2 + 4;
      const lab = (i) => labels[i] || '';
      body = [
        // Top circle (sits above rect's top edge, attached at tangent point)
        `<circle cx="${(cx0 + r + 10).toFixed(1)}" cy="${(cy0 - r).toFixed(1)}" r="${r}" fill="${highlight_face === lab(0) ? HIGHLIGHT : FILL}" fill-opacity="${highlight_face === lab(0) ? 0.35 : 1}" stroke="${STROKE}" stroke-width="2"/>`,
        lab(0) ? `<text x="${(cx0 + r + 10).toFixed(1)}" y="${(cy0 - r + 4).toFixed(1)}" text-anchor="middle" fill="${TEXT}" font-size="12" font-weight="600">${esc(lab(0))}</text>` : '',
        // Rectangle
        cell(cx0, cy0, recW, recH, lab(1)),
        // Bottom circle (below rect)
        `<circle cx="${(cx0 + recW - r - 10).toFixed(1)}" cy="${(cy0 + recH + r).toFixed(1)}" r="${r}" fill="${highlight_face === lab(2) ? HIGHLIGHT : FILL}" fill-opacity="${highlight_face === lab(2) ? 0.35 : 1}" stroke="${STROKE}" stroke-width="2"/>`,
        lab(2) ? `<text x="${(cx0 + recW - r - 10).toFixed(1)}" y="${(cy0 + recH + r + 4).toFixed(1)}" text-anchor="middle" fill="${TEXT}" font-size="12" font-weight="600">${esc(lab(2))}</text>` : '',
      ].join('');
      title = 'Net of a cylinder';
    }
    else {
      return this.placeholder({ description: `Unknown solid type: ${solid}` });
    }

    return this._svg(body, { viewBox: `0 0 ${VB_W} ${VB_H}`, alt: title, maxWidth: 480 });
  },

  /**
   * symmetryFigure — Shape with optional dashed line of symmetry, or a partial
   * figure to be completed across an axis (P4 Symmetry).
   *
   * params:
   *   mode:         "show_axis" (default) | "complete"
   *   shape:        "L" | "T" | "cross" | "arrow" | "letter_E" | "letter_H" |
   *                 "diamond" | "trapezium" | "irregular"
   *   axis:         "vertical" | "horizontal" | "diagonal_tlbr" | "diagonal_trbl" | "none"
   *   show_correct: bool — for mode="complete", draw the mirrored half faintly
   *   grid:         bool — render an underlying cm grid
   *
   * Notes:
   *   - In "show_axis" mode, the full shape is drawn with a dashed mirror line.
   *   - In "complete" mode, only the half on the source side of the axis is filled;
   *     the other half is shown as a dashed outline if `show_correct` is true.
   */
  symmetryFigure(params = {}) {
    const esc = this._esc.bind(this);
    const {
      mode = 'show_axis',
      shape = 'L',
      axis = 'vertical',
      show_correct = false,
      grid = true,
    } = params;

    const VB_W = 400, VB_H = 260;
    const STROKE = 'var(--brand-sage, #51615E)';
    const FILL = 'var(--brand-rose, #B76E79)';
    const FILL_OPACITY = 0.4;
    const AXIS = 'var(--text-muted, #5d706b)';
    const GRID = 'var(--border-light, #d6e3dc)';
    const GHOST = 'var(--border-dark, #8da89e)';

    const cx = VB_W / 2, cy = VB_H / 2;

    // ── Shape definitions: each returns an array of [x, y] vertex polygons,
    //    centred at origin (pre-translation to cx,cy).
    //    Sized so each fits comfortably within ~160 × 160 px.
    const SHAPES = {
      L: [[[-40,-60],[20,-60],[20,0],[60,0],[60,60],[-40,60]]],
      T: [[[-60,-60],[60,-60],[60,-20],[20,-20],[20,60],[-20,60],[-20,-20],[-60,-20]]],
      cross: [[[-20,-60],[20,-60],[20,-20],[60,-20],[60,20],[20,20],[20,60],[-20,60],[-20,20],[-60,20],[-60,-20],[-20,-20]]],
      arrow: [[[-60,-15],[20,-15],[20,-40],[60,0],[20,40],[20,15],[-60,15]]],
      letter_E: [[[-50,-60],[50,-60],[50,-40],[-30,-40],[-30,-10],[30,-10],[30,10],[-30,10],[-30,40],[50,40],[50,60],[-50,60]]],
      letter_H: [[[-50,-60],[-30,-60],[-30,-10],[30,-10],[30,-60],[50,-60],[50,60],[30,60],[30,10],[-30,10],[-30,60],[-50,60]]],
      diamond: [[[0,-60],[55,0],[0,60],[-55,0]]],
      trapezium: [[[-60,40],[-30,-40],[30,-40],[60,40]]],
      irregular: [[[-50,-50],[40,-50],[40,-10],[60,-10],[60,30],[20,30],[20,60],[-50,60]]],
    };

    const polys = SHAPES[shape] || SHAPES.L;

    // ── Translate vertices into world coords
    const worldPolys = polys.map(poly => poly.map(([x, y]) => [x + cx, y + cy]));

    // ── Mode "complete": clip the polygon to the SOURCE side of the axis.
    //    Source side = left of vertical axis, top of horizontal axis,
    //    above tlbr diagonal, below trbl diagonal. (Arbitrary convention.)
    function isOnSourceSide([x, y]) {
      switch (axis) {
        case 'vertical':       return x <= cx;
        case 'horizontal':     return y <= cy;
        case 'diagonal_tlbr':  return (x - cx) - (y - cy) <= 0;     // above the line y=x
        case 'diagonal_trbl':  return (x - cx) + (y - cy) <= 0;     // above the line y=-x
        default:               return true;
      }
    }

    // Sutherland–Hodgman polygon clipping against the axis line.
    function clipPolygon(poly, keepSourceSide) {
      const result = [];
      for (let i = 0; i < poly.length; i++) {
        const cur = poly[i];
        const prev = poly[(i - 1 + poly.length) % poly.length];
        const curIn = keepSourceSide(cur);
        const prevIn = keepSourceSide(prev);
        if (curIn) {
          if (!prevIn) {
            // Entering: compute intersection
            result.push(intersect(prev, cur));
          }
          result.push(cur);
        } else if (prevIn) {
          // Leaving: compute intersection
          result.push(intersect(prev, cur));
        }
      }
      return result;
    }

    // Line-line intersection between segment (p1→p2) and the axis line.
    function intersect(p1, p2) {
      const [x1, y1] = p1, [x2, y2] = p2;
      let t;
      switch (axis) {
        case 'vertical':       t = (cx - x1) / (x2 - x1); break;
        case 'horizontal':     t = (cy - y1) / (y2 - y1); break;
        case 'diagonal_tlbr': {
          // Axis: (x - cx) - (y - cy) = 0
          const dx = x2 - x1, dy = y2 - y1;
          t = ((cx - x1) - (cy - y1)) / (dx - dy);
          break;
        }
        case 'diagonal_trbl': {
          const dx = x2 - x1, dy = y2 - y1;
          t = -((x1 - cx) + (y1 - cy)) / (dx + dy);
          break;
        }
        default: t = 0;
      }
      return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
    }

    // ── Mirror a point across the axis to get the OTHER half (for "complete" + show_correct).
    function mirror([x, y]) {
      switch (axis) {
        case 'vertical':       return [2 * cx - x, y];
        case 'horizontal':     return [x, 2 * cy - y];
        case 'diagonal_tlbr':  return [(y - cy) + cx, (x - cx) + cy];   // reflect across y=x line through (cx,cy)
        case 'diagonal_trbl':  return [-(y - cy) + cx, -(x - cx) + cy]; // reflect across y=-x line
        default:               return [x, y];
      }
    }

    // ── Grid backdrop
    let gridSvg = '';
    if (grid) {
      const step = 20;
      for (let x = step; x < VB_W; x += step) {
        gridSvg += `<line x1="${x}" y1="0" x2="${x}" y2="${VB_H}" stroke="${GRID}" stroke-width="0.5"/>`;
      }
      for (let y = step; y < VB_H; y += step) {
        gridSvg += `<line x1="0" y1="${y}" x2="${VB_W}" y2="${y}" stroke="${GRID}" stroke-width="0.5"/>`;
      }
    }

    // ── Build the polygon(s) to render
    const polyToPath = (poly) => 'M ' + poly.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ') + ' Z';

    let shapeSvg = '';
    if (mode === 'complete') {
      // Source half: filled
      worldPolys.forEach(poly => {
        const clipped = clipPolygon(poly, isOnSourceSide);
        if (clipped.length >= 3) {
          shapeSvg += `<path d="${polyToPath(clipped)}" fill="${FILL}" fill-opacity="${FILL_OPACITY}" stroke="${STROKE}" stroke-width="2" stroke-linejoin="round"/>`;
        }
      });
      // Other half (mirrored): dashed ghost outline if show_correct
      if (show_correct) {
        worldPolys.forEach(poly => {
          const mirrored = poly.map(mirror);
          const clipped = clipPolygon(mirrored, p => !isOnSourceSide(p) || onAxis(p));
          if (clipped.length >= 3) {
            shapeSvg += `<path d="${polyToPath(clipped)}" fill="none" stroke="${GHOST}" stroke-width="1.5" stroke-dasharray="4,3" stroke-linejoin="round"/>`;
          }
        });
      }
    } else {
      // show_axis: full shape filled
      worldPolys.forEach(poly => {
        shapeSvg += `<path d="${polyToPath(poly)}" fill="${FILL}" fill-opacity="${FILL_OPACITY}" stroke="${STROKE}" stroke-width="2" stroke-linejoin="round"/>`;
      });
    }

    function onAxis([x, y]) {
      const eps = 0.5;
      switch (axis) {
        case 'vertical':       return Math.abs(x - cx) < eps;
        case 'horizontal':     return Math.abs(y - cy) < eps;
        case 'diagonal_tlbr':  return Math.abs((x - cx) - (y - cy)) < eps;
        case 'diagonal_trbl':  return Math.abs((x - cx) + (y - cy)) < eps;
        default:               return false;
      }
    }

    // ── Axis line
    let axisSvg = '';
    if (axis !== 'none') {
      let x1, y1, x2, y2;
      switch (axis) {
        case 'vertical':       x1 = cx; y1 = 20; x2 = cx; y2 = VB_H - 20; break;
        case 'horizontal':     x1 = 20; y1 = cy; x2 = VB_W - 20; y2 = cy; break;
        case 'diagonal_tlbr':  x1 = cx - 110; y1 = cy - 110; x2 = cx + 110; y2 = cy + 110; break;
        case 'diagonal_trbl':  x1 = cx - 110; y1 = cy + 110; x2 = cx + 110; y2 = cy - 110; break;
      }
      axisSvg = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${AXIS}" stroke-width="2" stroke-dasharray="6,4"/>`;
    }

    return this._svg(`${gridSvg}${shapeSvg}${axisSvg}`, {
      viewBox: `0 0 ${VB_W} ${VB_H}`,
      alt: `Symmetry figure: ${shape}, axis: ${axis}, mode: ${mode}.`,
      maxWidth: 460,
    });
  },

  /**
   * circleSegment — Standalone semicircle or quarter circle (P6 Circles).
   *
   * For "Area And Perimeter Of Semicircle And Quarter Circle" sub_topic.
   * NOT to be confused with `quarterCirclesInSquare` (which is inscribed in a square).
   *
   * params:
   *   shape:               "semicircle" | "quarter_circle"
   *   orientation:         "up" | "down" | "left" | "right"   — semicircle only (which half is shown)
   *   corner:              "tl" | "tr" | "bl" | "br"          — quarter only (which corner the right angle sits at)
   *   radius_label:        e.g. "7 cm" — drawn along a radius line
   *   diameter_label:      e.g. "14 cm" — drawn along the diameter (semicircle only)
   *   show_arc_label:      bool — labels the curved edge as "arc"
   *   show_perimeter_dots: bool — marks endpoints with small dots
   */
  circleSegment(params = {}) {
    const esc = this._esc.bind(this);
    const {
      shape = 'semicircle',
      orientation = 'up',
      corner = 'tl',
      radius_label = '',
      diameter_label = '',
      show_arc_label = false,
      show_perimeter_dots = false,
    } = params;

    const VB_W = 400, VB_H = 260;
    const STROKE = 'var(--brand-sage, #51615E)';
    const FILL = 'var(--brand-rose, #B76E79)';
    const FILL_OPACITY = 0.25;
    const TEXT = 'var(--text-main, #1a2e2a)';
    const DIM = 'var(--text-muted, #5d706b)';

    const R = 90;                                            // visual radius in px
    const cx = VB_W / 2, cy = VB_H / 2 + 10;                 // pivot point

    let pathD = '';
    let radiusLine = '';
    let diameterLine = '';
    let endpointDots = '';
    let radiusLabelEl = '';
    let diameterLabelEl = '';
    let arcLabelEl = '';
    let alt = '';

    if (shape === 'semicircle') {
      // Diameter sits along one edge; arc on the opposite side
      let p1, p2, sweepLargeArc = 0;                         // half-arc only
      switch (orientation) {
        case 'up':    p1 = [cx - R, cy];     p2 = [cx + R, cy];     break;
        case 'down':  p1 = [cx + R, cy];     p2 = [cx - R, cy];     break;
        case 'left':  p1 = [cx, cy - R];     p2 = [cx, cy + R];     break;
        case 'right': p1 = [cx, cy + R];     p2 = [cx, cy - R];     break;
      }
      // sweep-flag: 0 = counter-clockwise (visually correct for these directions)
      pathD = `M ${p1[0]},${p1[1]} A ${R},${R} 0 0 1 ${p2[0]},${p2[1]} L ${p1[0]},${p1[1]} Z`;
      diameterLine = `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${STROKE}" stroke-width="2"/>`;

      // Radius line from centre to top of arc
      const arcMid = orientation === 'up'    ? [cx, cy - R] :
                     orientation === 'down'  ? [cx, cy + R] :
                     orientation === 'left'  ? [cx - R, cy] :
                                               [cx + R, cy];
      radiusLine = `<line x1="${cx}" y1="${cy}" x2="${arcMid[0]}" y2="${arcMid[1]}" stroke="${STROKE}" stroke-width="1.5" stroke-dasharray="4,3"/>`;

      if (radius_label) {
        const rmx = (cx + arcMid[0]) / 2, rmy = (cy + arcMid[1]) / 2;
        const offX = orientation === 'up' || orientation === 'down' ? 10 : 0;
        const offY = orientation === 'left' || orientation === 'right' ? -8 : 0;
        radiusLabelEl = `<text x="${(rmx + offX).toFixed(1)}" y="${(rmy + offY + 4).toFixed(1)}" text-anchor="start" fill="${DIM}" font-size="12">${esc(radius_label)}</text>`;
      }
      if (diameter_label) {
        const dmx = (p1[0] + p2[0]) / 2, dmy = (p1[1] + p2[1]) / 2;
        const offY = orientation === 'up' ? 18 : (orientation === 'down' ? -8 : 0);
        const offX = orientation === 'left' ? 12 : (orientation === 'right' ? -12 : 0);
        const anchor = orientation === 'left' ? 'start' : (orientation === 'right' ? 'end' : 'middle');
        diameterLabelEl = `<text x="${(dmx + offX).toFixed(1)}" y="${(dmy + offY).toFixed(1)}" text-anchor="${anchor}" fill="${DIM}" font-size="12">${esc(diameter_label)}</text>`;
      }
      if (show_perimeter_dots) {
        endpointDots = `<circle cx="${p1[0]}" cy="${p1[1]}" r="3" fill="${STROKE}"/><circle cx="${p2[0]}" cy="${p2[1]}" r="3" fill="${STROKE}"/>`;
      }
      if (show_arc_label) {
        const ax = arcMid[0], ay = arcMid[1];
        const dx = orientation === 'up' ? 0 : (orientation === 'down' ? 0 : (orientation === 'left' ? -16 : 16));
        const dy = orientation === 'up' ? -8 : (orientation === 'down' ? 18 : 4);
        arcLabelEl = `<text x="${(ax + dx).toFixed(1)}" y="${(ay + dy).toFixed(1)}" text-anchor="middle" fill="${DIM}" font-size="11" font-style="italic">arc</text>`;
      }
      alt = `Semicircle, opening ${orientation}.`;
    }
    else if (shape === 'quarter_circle') {
      // Right-angle vertex at the chosen corner; two radii along the axes; arc connecting the radius endpoints.
      let v;                                                  // right-angle vertex
      let p1, p2;                                             // radius endpoints (where each radius meets the arc)
      switch (corner) {
        case 'tl': v = [cx - R / 2, cy - R / 2]; p1 = [v[0] + R, v[1]]; p2 = [v[0], v[1] + R]; break;
        case 'tr': v = [cx + R / 2, cy - R / 2]; p1 = [v[0], v[1] + R]; p2 = [v[0] - R, v[1]]; break;
        case 'bl': v = [cx - R / 2, cy + R / 2]; p1 = [v[0], v[1] - R]; p2 = [v[0] + R, v[1]]; break;
        case 'br': v = [cx + R / 2, cy + R / 2]; p1 = [v[0] - R, v[1]]; p2 = [v[0], v[1] - R]; break;
      }
      // sweep direction so the arc bulges OUTWARD (away from the right-angle vertex)
      pathD = `M ${v[0]},${v[1]} L ${p1[0]},${p1[1]} A ${R},${R} 0 0 1 ${p2[0]},${p2[1]} Z`;

      // Right-angle marker (small square at vertex)
      const ms = 8;
      const mx = corner.includes('l') ? v[0] : v[0] - ms;
      const my = corner.includes('t') ? v[1] : v[1] - ms;
      const cornerMarker = `<rect x="${mx.toFixed(1)}" y="${my.toFixed(1)}" width="${ms}" height="${ms}" fill="none" stroke="${STROKE}" stroke-width="1.5"/>`;

      if (radius_label) {
        // Place along the first radius (v → p1)
        const rmx = (v[0] + p1[0]) / 2, rmy = (v[1] + p1[1]) / 2;
        const offY = corner.includes('t') ? -6 : 16;
        radiusLabelEl = `<text x="${rmx.toFixed(1)}" y="${(rmy + offY).toFixed(1)}" text-anchor="middle" fill="${DIM}" font-size="12">${esc(radius_label)}</text>`;
      }
      if (show_perimeter_dots) {
        endpointDots = `<circle cx="${p1[0]}" cy="${p1[1]}" r="3" fill="${STROKE}"/><circle cx="${p2[0]}" cy="${p2[1]}" r="3" fill="${STROKE}"/>`;
      }
      if (show_arc_label) {
        // Arc midpoint, OUTWARD from vertex
        const arcMidX = (p1[0] + p2[0]) / 2;
        const arcMidY = (p1[1] + p2[1]) / 2;
        // Offset further outward away from vertex
        const ox = arcMidX + (arcMidX - v[0]) * 0.15;
        const oy = arcMidY + (arcMidY - v[1]) * 0.15;
        arcLabelEl = `<text x="${ox.toFixed(1)}" y="${oy.toFixed(1)}" text-anchor="middle" fill="${DIM}" font-size="11" font-style="italic">arc</text>`;
      }
      // Build composite SVG (corner marker rendered AFTER fill so it stays visible)
      return this._svg(
        `<path d="${pathD}" fill="${FILL}" fill-opacity="${FILL_OPACITY}" stroke="${STROKE}" stroke-width="2" stroke-linejoin="round"/>${cornerMarker}${endpointDots}${radiusLabelEl}${arcLabelEl}`,
        { viewBox: `0 0 ${VB_W} ${VB_H}`, alt: `Quarter circle at ${corner} corner.`, maxWidth: 360 }
      );
    }
    else {
      return this.placeholder({ description: `Unknown circle segment shape: ${shape}` });
    }

    return this._svg(
      `<path d="${pathD}" fill="${FILL}" fill-opacity="${FILL_OPACITY}" stroke="${STROKE}" stroke-width="2" stroke-linejoin="round"/>${diameterLine}${radiusLine}${endpointDots}${radiusLabelEl}${diameterLabelEl}${arcLabelEl}`,
      { viewBox: `0 0 ${VB_W} ${VB_H}`, alt, maxWidth: 420 }
    );
  },

  // ── FALLBACK ─────────────────────────────────────────────────────────────────

  /**
   * Grey dashed-border placeholder box for complex diagrams.
   * @param {object} opts
   * @returns {string} SVG string
   */
  placeholder({
    width = 300,
    height = 200,
    description = 'Diagram',
    borderStyle = 'dashed',
  } = {}) {
    const esc = this._esc.bind(this);
    // Word-wrap description at ~40 chars per line
    const words = description.split(' ');
    const lines = [];
    let current = '';
    words.forEach(w => {
      if ((current + ' ' + w).length > 38 && current) { lines.push(current); current = w; }
      else { current = current ? current + ' ' + w : w; }
    });
    if (current) lines.push(current);

    const midY = 130;
    const lineEls = lines.map((l, i) =>
      `<text x="200" y="${midY + (i - (lines.length - 1) / 2) * 18}" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="12">${esc(l)}</text>`
    ).join('');

    const strokeDash = borderStyle === 'dashed' ? 'stroke-dasharray="8,4"' : '';
    const content = `
      <rect x="20" y="20" width="360" height="220" rx="8" fill="var(--bg-elevated, #f0f5f2)" stroke="var(--border-dark, #8da89e)" stroke-width="2" ${strokeDash}/>
      <text x="200" y="60" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="11" font-style="italic">[Diagram]</text>
      ${lineEls}`;
    return this._svg(content, { alt: esc(description) });
  },

  /**
 * 🔺 MOE Protractor — P3/P4 Angles
 * Draws a semicircular protractor with inner + outer scales and a pointer arm.
 *
 * @param {object} params
 * @param {number} params.angle_to_measure   - The angle being shown (degrees, 0–180)
 * @param {number} params.baseline_offset    - Where the angle arm starts (0 = right edge).
 *                                             Set > 0 for "non-zero baseline" exam variants.
 * @param {boolean} params.show_inner_scale  - Show the inner (reverse) scale
 * @param {boolean} params.show_outer_scale  - Show the outer (standard) scale
 * @param {string}  params.pointer_label     - Label on the angle arc (e.g. "?", "∠ABC")
 * @param {string}  params.label             - Optional diagram title
 *
 * Usage:
 *   { "function_name": "protractorMeasurement",
 *     "params": { "angle_to_measure": 65, "baseline_offset": 0, "pointer_label": "?" } }
 *
 * Non-zero baseline (object not starting at 0°):
 *   { "function_name": "protractorMeasurement",
 *     "params": { "angle_to_measure": 50, "baseline_offset": 30, "pointer_label": "?" } }
 */
  protractorMeasurement({
    angle_to_measure = 60,
    baseline_offset  = 0,
    show_inner_scale = true,
    show_outer_scale = true,
    pointer_label    = '?',
    label            = '',
  } = {}) {
    const esc = this._esc.bind(this);
    const cx = 200, cy = 224, R = 142;  // protractor centre and radius

    // Convert protractor degrees → SVG coords
    // 0° = right, 90° = top, 180° = left (counterclockwise, going upward)
    const toXY = (deg, r) => {
      const rad = deg * Math.PI / 180;
      return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
    };

    // ── Semicircle arc (upper half) ────────────────────────────────────────────
    const arcStart = toXY(0, R), arcEnd = toXY(180, R);
    const arc = `<path d="M ${arcStart.x},${arcStart.y} A ${R},${R} 0 0,0 ${arcEnd.x},${arcEnd.y}"
      fill="rgba(240,244,243,0.55)" stroke="var(--brand-sage, #51615E)" stroke-width="2"/>`;

    // ── Flat baseline (the diameter) ──────────────────────────────────────────
    const flatBase = `<line x1="${arcEnd.x}" y1="${cy}" x2="${arcStart.x}" y2="${cy}" stroke="var(--brand-sage, #51615E)" stroke-width="2.5"/>`;

    // ── Tick marks + scale labels ──────────────────────────────────────────────
    let ticks = '', outerLbls = '', innerLbls = '';
    for (let deg = 0; deg <= 180; deg += 10) {
      const isMajor  = deg % 30 === 0;
      const isHalf   = deg % 10 === 0 && !isMajor;
      const outerPt  = toXY(deg, R);
      const innerPt  = toXY(deg, R - (isMajor ? 20 : isHalf ? 12 : 8));
      ticks += `<line x1="${outerPt.x.toFixed(1)}" y1="${outerPt.y.toFixed(1)}"
                      x2="${innerPt.x.toFixed(1)}" y2="${innerPt.y.toFixed(1)}"
                      stroke="var(--text-main, #1a2e2a)" stroke-width="${isMajor ? 2 : 1}"/>`;

      if (isMajor) {
        if (show_outer_scale) {
          const lPt   = toXY(deg, R + 17);
          const anchor = deg < 75 ? 'start' : deg > 105 ? 'end' : 'middle';
          outerLbls  += `<text x="${lPt.x.toFixed(1)}" y="${(lPt.y + 4).toFixed(1)}"
            text-anchor="${anchor}" fill="var(--text-main, #1a2e2a)" font-size="11" font-weight="600">${deg}</text>`;
        }
        if (show_inner_scale) {
          const inner_deg = 180 - deg;
          const ilPt  = toXY(deg, R - 27);
          const anchor = deg < 75 ? 'start' : deg > 105 ? 'end' : 'middle';
          innerLbls  += `<text x="${ilPt.x.toFixed(1)}" y="${(ilPt.y + 4).toFixed(1)}"
            text-anchor="${anchor}" fill="var(--text-muted, #5d706b)" font-size="9">${inner_deg}</text>`;
        }
      }
    }

    // ── Baseline arm (where the measurement starts; visible when offset ≠ 0) ──
    const baseArmPt   = toXY(baseline_offset, R - 4);
    const baseArm     = baseline_offset !== 0
      ? `<line x1="${cx}" y1="${cy}" x2="${baseArmPt.x.toFixed(1)}" y2="${baseArmPt.y.toFixed(1)}"
          stroke="var(--brand-sage, #51615E)" stroke-width="2.5" stroke-dasharray="6,3"/>`
      : '';

    // ── Pointer arm (at the measured angle) ───────────────────────────────────
    const pointerDeg  = baseline_offset + angle_to_measure;
    const pointerPt   = toXY(pointerDeg, R - 4);
    const pointer     = `<line x1="${cx}" y1="${cy}" x2="${pointerPt.x.toFixed(1)}" y2="${pointerPt.y.toFixed(1)}"
      stroke="var(--brand-rose, #B76E79)" stroke-width="2.5"/>`;

    // ── Arc indicator (shows the angle sector) ────────────────────────────────
    const arcR        = 48;
    const arcS        = toXY(baseline_offset, arcR);
    const arcE        = toXY(pointerDeg, arcR);
    const largeFlag   = angle_to_measure > 180 ? 1 : 0;
    // sweep-flag=0: counterclockwise in SVG = increasing protractor degrees (upward)
    const angArc      = `<path d="M ${arcS.x.toFixed(1)},${arcS.y.toFixed(1)} A ${arcR},${arcR} 0 ${largeFlag},0 ${arcE.x.toFixed(1)},${arcE.y.toFixed(1)}"
      fill="none" stroke="var(--brand-rose, #B76E79)" stroke-width="2"/>`;

    // ── Angle label in the arc sector ─────────────────────────────────────────
    const midDeg      = baseline_offset + angle_to_measure / 2;
    const midPt       = toXY(midDeg, 68);
    const pLabel      = `<text x="${midPt.x.toFixed(1)}" y="${(midPt.y + 5).toFixed(1)}"
      text-anchor="middle" fill="var(--brand-rose, #B76E79)" font-size="14" font-weight="700">${esc(pointer_label)}</text>`;

    // ── Centre dot ────────────────────────────────────────────────────────────
    const dot         = `<circle cx="${cx}" cy="${cy}" r="4" fill="var(--brand-sage, #51615E)"/>`;

    // ── Optional diagram title ─────────────────────────────────────────────────
    const titleEl     = label
      ? `<text x="${cx}" y="18" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="12" font-weight="600">${esc(label)}</text>`
      : '';

    // ── Non-zero baseline note ─────────────────────────────────────────────────
    const noteEl      = baseline_offset !== 0
      ? `<text x="${cx}" y="256" text-anchor="middle" fill="var(--text-muted, #5d706b)" font-size="9" font-style="italic">Baseline does not start at 0°</text>`
      : '';

    const content = `${titleEl}${arc}${flatBase}${ticks}${outerLbls}${innerLbls}${baseArm}${pointer}${angArc}${pLabel}${dot}${noteEl}`;

    return this._svg(content, {
      viewBox: '0 0 400 265',
      alt: `Protractor showing ${angle_to_measure}° angle${baseline_offset ? ', baseline at ' + baseline_offset + '°' : ''}.`,
    });
  },

  /**
   * 🕒 clockFace — Analog clock face with positioned hour and minute hands.
   * Use for P1/P2 "Telling Time" questions.
   *
   * @param {number}  params.hour            1–12 (12 = top). Will be normalised modulo 12.
   * @param {number}  params.minute          0–59.
   * @param {number}  params.size            Display max-width in px (default 240).
   * @param {boolean} params.showSecondHand  Default false.
   * @param {number}  params.second          0–59 (only if showSecondHand: true).
   * @param {string}  params.label           Optional caption above the clock.
   *
   * Hour-hand position is computed from `hour + minute/60` so it sits between
   * numerals when minute > 0 (e.g. hour=7, minute=20 → hand at angle 7.333 × 30°).
   * Minute-hand from `minute × 6°`. 12 o'clock = angle 0° (straight up).
   */
  clockFace({
    hour            = 12,
    minute          = 0,
    size            = 240,
    showSecondHand  = false,
    second          = 0,
    label           = '',
  } = {}) {
    const esc = this._esc.bind(this);
    // viewBox is square; centre = 100,100; outer radius 90.
    const cx = 100, cy = 100, R = 90;
    const STROKE   = 'var(--brand-sage, #51615E)';
    const FACE_BG  = 'var(--bg-elevated, #f0f5f2)';
    const HAND_HR  = 'var(--text-main, #1a2e2a)';
    const HAND_MN  = 'var(--brand-sage, #51615E)';
    const HAND_SC  = 'var(--brand-rose, #B76E79)';
    const NUM_FILL = 'var(--text-main, #1a2e2a)';

    // Normalise inputs defensively.
    const h = ((Number(hour) % 12) + 12) % 12;        // 0..11 (0 means "12")
    const m = Math.max(0, Math.min(59, Number(minute) || 0));
    const s = Math.max(0, Math.min(59, Number(second) || 0));

    // SVG angle convention: 0° = 3 o'clock, sweeping CCW. We use the clock
    // convention internally: 0° = 12 o'clock, sweeping CW. Conversion below.
    // Returns {x, y} of the tip at clock-angle deg, distance r from centre.
    const tip = (clockDeg, r) => {
      // clock 0° = up; rotate −90° to get math 0°=right, then reflect y for CW
      const rad = (clockDeg - 90) * Math.PI / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    // ── Face & rim ─────────────────────────────────────────────────────────
    let svg = '';
    svg += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${FACE_BG}" stroke="${STROKE}" stroke-width="3"/>`;

    // ── Tick marks ─────────────────────────────────────────────────────────
    // 60 minute ticks; emphasise every 5th
    for (let i = 0; i < 60; i++) {
      const deg = i * 6;
      const isHour = (i % 5 === 0);
      const t1 = tip(deg, R - (isHour ? 8 : 4));
      const t2 = tip(deg, R - 1);
      svg += `<line x1="${t1.x.toFixed(2)}" y1="${t1.y.toFixed(2)}" x2="${t2.x.toFixed(2)}" y2="${t2.y.toFixed(2)}" stroke="${STROKE}" stroke-width="${isHour ? 2 : 1}" stroke-linecap="round"/>`;
    }

    // ── Numerals 1..12 ─────────────────────────────────────────────────────
    for (let n = 1; n <= 12; n++) {
      const p = tip(n * 30, R - 18);
      svg += `<text x="${p.x.toFixed(2)}" y="${(p.y + 5).toFixed(2)}" text-anchor="middle" font-size="14" font-weight="700" fill="${NUM_FILL}">${n}</text>`;
    }

    // ── Hands ──────────────────────────────────────────────────────────────
    // Hour hand: 30° per hour + 0.5° per minute. Use h (already 0..11; "12" treated as 0).
    const hourDeg   = (h + m / 60) * 30;
    const minuteDeg = m * 6;
    const hourTip   = tip(hourDeg, R * 0.55);
    const minuteTip = tip(minuteDeg, R * 0.82);
    svg += `<line x1="${cx}" y1="${cy}" x2="${hourTip.x.toFixed(2)}" y2="${hourTip.y.toFixed(2)}" stroke="${HAND_HR}" stroke-width="5" stroke-linecap="round"/>`;
    svg += `<line x1="${cx}" y1="${cy}" x2="${minuteTip.x.toFixed(2)}" y2="${minuteTip.y.toFixed(2)}" stroke="${HAND_MN}" stroke-width="3" stroke-linecap="round"/>`;
    if (showSecondHand) {
      const secTip = tip(s * 6, R * 0.88);
      svg += `<line x1="${cx}" y1="${cy}" x2="${secTip.x.toFixed(2)}" y2="${secTip.y.toFixed(2)}" stroke="${HAND_SC}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    // Centre cap
    svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="${HAND_HR}"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="1.5" fill="${FACE_BG}"/>`;

    // ── Optional caption ──────────────────────────────────────────────────
    const captionEl = label
      ? `<text x="${cx}" y="14" text-anchor="middle" fill="var(--text-main, #1a2e2a)" font-size="12" font-weight="600">${esc(label)}</text>`
      : '';

    // Pretty time text for alt
    const displayHour = (h === 0) ? 12 : h;
    const altText = `Analog clock showing ${displayHour}:${String(m).padStart(2, '0')}.`;

    return this._svg(`${captionEl}${svg}`, {
      viewBox: '0 0 200 200',
      alt: altText,
      maxWidth: Math.max(160, Number(size) || 240),
    });
  },

  /**
   * ✕ crossingLines — Two straight lines crossing at a point, with up to 4
   * angle labels in the four sectors formed.
   * Use for P5/P6 "Vertically Opposite Angles" / "Angles At A Point" problems.
   *
   * @param {object} params.line1        e.g. {label: "AB", endpoints: ["A","B"]}
   * @param {object} params.line2        e.g. {label: "CD", endpoints: ["C","D"]}
   * @param {Array}  params.angles       Up to 4 entries, each:
   *                                     {at: "AOC", label: "144°"}.
   *                                     Middle letter = crossing point letter
   *                                     (default "O"); outer two are matched
   *                                     by SET, so "AOC" === "COA".
   * @param {string} params.crossing     Letter for crossing point (default "O").
   * @param {number} params.line2_angle  Degrees between line1 and line2 (default 60).
   *                                     line1 is horizontal (0°); line2 sweeps CCW
   *                                     from line1 by this angle.
   *
   * Sectors are positioned by the bisector between adjacent ray endpoints.
   * Missing angle entries leave their sector unlabelled.
   */
  crossingLines({
    line1        = { label: 'AB', endpoints: ['A', 'B'] },
    line2        = { label: 'CD', endpoints: ['C', 'D'] },
    angles       = [],
    crossing     = 'O',
    line2_angle  = 60,
  } = {}) {
    const esc = this._esc.bind(this);
    const w = 400, h = 260;
    const cx = w / 2, cy = h / 2;
    const r = 110;

    const STROKE   = 'var(--text-main, #1a2e2a)';
    const LBL      = 'var(--text-muted, #5d706b)';
    const ANG_LBL  = 'var(--brand-rose, #B76E79)';
    const DOT      = 'var(--brand-sage, #51615E)';

    // Defensive defaults
    const ep1 = (line1 && Array.isArray(line1.endpoints) && line1.endpoints.length === 2) ? line1.endpoints : ['A', 'B'];
    const ep2 = (line2 && Array.isArray(line2.endpoints) && line2.endpoints.length === 2) ? line2.endpoints : ['C', 'D'];
    const O   = (typeof crossing === 'string' && crossing.length > 0) ? crossing[0] : 'O';

    // Normalise line2_angle into (10°, 170°) so the crossing is always visible.
    let theta = Number(line2_angle);
    if (!Number.isFinite(theta)) theta = 60;
    theta = ((theta % 180) + 180) % 180;
    if (theta < 10)  theta = 10;
    if (theta > 170) theta = 170;

    // Math helpers: 0° = right (+x), CCW positive. SVG y is inverted so we
    // negate the sin component when rendering.
    const polar = (deg, dist) => {
      const rad = deg * Math.PI / 180;
      return { x: cx + dist * Math.cos(rad), y: cy - dist * Math.sin(rad) };
    };

    // Line 1 endpoints: A at 180° (left), B at 0° (right).
    const A = polar(180, r);
    const B = polar(0, r);
    // Line 2 endpoints: C "above" along +theta, D opposite (theta + 180°).
    // Choose so that ep2[0] sits in the upper half (y < cy), ep2[1] in the lower.
    const C = polar(theta, r);
    const D = polar(theta + 180, r);

    let svg = '';
    // Lines
    svg += `<line x1="${A.x.toFixed(1)}" y1="${A.y.toFixed(1)}" x2="${B.x.toFixed(1)}" y2="${B.y.toFixed(1)}" stroke="${STROKE}" stroke-width="2.5"/>`;
    svg += `<line x1="${C.x.toFixed(1)}" y1="${C.y.toFixed(1)}" x2="${D.x.toFixed(1)}" y2="${D.y.toFixed(1)}" stroke="${STROKE}" stroke-width="2.5"/>`;
    // Crossing dot
    svg += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${DOT}"/>`;

    // Endpoint labels — push slightly outside the line ends.
    const offsetLabel = (pt, ang) => {
      const padded = polar(ang, r + 14);
      return { x: padded.x, y: padded.y };
    };
    const aL = offsetLabel(A, 180);
    const bL = offsetLabel(B, 0);
    const cL = offsetLabel(C, theta);
    const dL = offsetLabel(D, theta + 180);
    svg += `<text x="${aL.x.toFixed(1)}" y="${(aL.y + 5).toFixed(1)}" text-anchor="middle" font-size="15" font-weight="700" fill="${LBL}">${esc(ep1[0])}</text>`;
    svg += `<text x="${bL.x.toFixed(1)}" y="${(bL.y + 5).toFixed(1)}" text-anchor="middle" font-size="15" font-weight="700" fill="${LBL}">${esc(ep1[1])}</text>`;
    svg += `<text x="${cL.x.toFixed(1)}" y="${(cL.y + 5).toFixed(1)}" text-anchor="middle" font-size="15" font-weight="700" fill="${LBL}">${esc(ep2[0])}</text>`;
    svg += `<text x="${dL.x.toFixed(1)}" y="${(dL.y + 5).toFixed(1)}" text-anchor="middle" font-size="15" font-weight="700" fill="${LBL}">${esc(ep2[1])}</text>`;

    // Crossing-point label (offset SE so it doesn't overlap the lines)
    svg += `<text x="${(cx + 10).toFixed(1)}" y="${(cy + 18).toFixed(1)}" font-size="14" font-weight="700" fill="${LBL}">${esc(O)}</text>`;

    // ── Sectors and angle labels ──────────────────────────────────────────
    // Map each ray endpoint letter → its outgoing angle (degrees, CCW).
    const rayAngle = {
      [ep1[0]]: 180,
      [ep1[1]]: 0,
      [ep2[0]]: theta,
      [ep2[1]]: theta + 180,
    };

    // Build the 4 ordered sectors by sorting rays by angle (mod 360).
    const rayList = Object.entries(rayAngle).map(([letter, deg]) => ({
      letter,
      deg: ((deg % 360) + 360) % 360,
    })).sort((a, b) => a.deg - b.deg);

    // Each sector is between rayList[i] and rayList[(i+1)%4].
    const sectors = rayList.map((ray, i) => {
      const next = rayList[(i + 1) % 4];
      let span = next.deg - ray.deg;
      if (span <= 0) span += 360;
      const mid = (ray.deg + span / 2) % 360;
      return {
        outerLetters: new Set([ray.letter, next.letter]),
        midDeg: mid,
        spanDeg: span,
      };
    });

    // Match angle entries by SET of outer letters (middle char = crossing).
    (Array.isArray(angles) ? angles : []).forEach((entry) => {
      if (!entry || typeof entry.at !== 'string' || entry.at.length < 3) return;
      const at = entry.at.toUpperCase();
      const outerSet = new Set([at[0], at[at.length - 1]]);
      const sector = sectors.find(s =>
        s.outerLetters.size === 2 &&
        outerSet.size === 2 &&
        [...outerSet].every(L => s.outerLetters.has(L))
      );
      if (!sector) return;
      // Place label at ~0.32 × r along the bisector
      const labelDist = Math.max(28, Math.min(48, r * 0.32));
      const lp = polar(sector.midDeg, labelDist);
      svg += `<text x="${lp.x.toFixed(1)}" y="${(lp.y + 4).toFixed(1)}" text-anchor="middle" font-size="14" font-weight="700" fill="${ANG_LBL}">${esc(entry.label || '?')}</text>`;
    });

    return this._svg(svg, {
      viewBox: `0 0 ${w} ${h}`,
      alt: `Two crossing lines ${ep1.join('')} and ${ep2.join('')} meeting at ${O}.`,
      maxWidth: 460,
    });
  },

  /**
   * ⬛◯ compositeCircleFigure — Composite figure built from a base
   * rectangle/square plus arc/disc operations (full circles, semicircles,
   * quarter circles) added/subtracted/shaded.
   * Use for P6 Circles "Area And Perimeter Of Composite Figures With Circles".
   *
   * @param {object} params.base
   *   {shape: "rectangle"|"square", width, height, label?, vertices: ["A","B","C","D"],
   *    show_outline?: boolean}
   *   Vertices are CLOCKWISE from top-left: A=TL, B=TR, C=BR, D=BL. Square
   *   defaults height to width. width/height in display units (px-equivalent;
   *   the renderer scales to fit).
   *   `show_outline` (default `true`) controls whether the base rectangle's
   *   stroke is drawn at all. Set to `false` for stand-alone arc figures
   *   (e.g. a quarter circle on its own with a cut-out) where the rectangle
   *   is purely conceptual scaffolding for vertex naming and arc placement.
   *   Vertex labels (A, B, C, D) still render when `show_outline: false`.
   *
   *   Edge auto-suppression: even with `show_outline: true`, base edges that
   *   coincide with an `add`-mode arc's chord (e.g. the diameter of a
   *   semicircle that bulges outward, or the full radii of a corner quarter
   *   circle) are suppressed automatically to avoid double-stroking. Triggers:
   *   (a) `semicircle` op with `mode: "add"` whose `diameter_endpoints` are
   *   two adjacent base vertices → suppress that base edge;
   *   (b) `quarterCircle` op with `mode: "add"` at a base corner whose
   *   radius equals the adjacent base side length → suppress the two coinciding
   *   base edges.
   *
   * @param {Array} params.operations  Ordered array. Each entry is one of:
   *   - {type: "fullCircle",    center?: {x,y}, corner?: "A"|.., midSide?: "AB"|..,
   *      radius, mode: "add"|"subtract"|"shade", label?}
   *   - {type: "semicircle",    diameter_endpoints: ["A","B"]|"AB",
   *      direction: "into"|"away", mode, label?}
   *   - {type: "quarterCircle", center_corner: "A"|..,
   *      radii_along: ["AB","AD"], radius?, mode, label?}
   *
   * @param {Array<number>} params.shaded  Indices of operations whose region
   *                                       should be filled (rose tint). Other
   *                                       ops still draw outlines.
   *
   * @param {boolean} params.show_vertex_labels  Default true.
   * @param {string}  params.dimension_label     Optional secondary caption.
   *
   * Geometry: all coordinates are computed in the base rectangle's world units;
   * the renderer scales to a 400-wide viewBox. Each operation contributes its
   * own SVG path (using M/L/A commands) so any add/subtract/shade combination
   * works out of the box.
   */
  compositeCircleFigure({
    base                = { shape: 'rectangle', width: 28, height: 14, vertices: ['A', 'B', 'C', 'D'] },
    operations          = [],
    shaded              = [],
    show_vertex_labels  = true,
    dimension_label     = '',
  } = {}) {
    const esc = this._esc.bind(this);

    // ── Resolve base ──────────────────────────────────────────────────────
    const shape = (base && base.shape) || 'rectangle';
    let bw = Number(base && base.width)  || 14;
    let bh = Number(base && (shape === 'square' ? base.width : base.height)) || (shape === 'square' ? bw : 14);
    if (shape === 'square') bh = bw;
    const verts = (base && Array.isArray(base.vertices) && base.vertices.length === 4)
      ? base.vertices : ['A', 'B', 'C', 'D'];
    // Optional flag: when false, suppress the entire base rectangle outline.
    // Vertex labels still render. Default true (backward compatible).
    const showOutline = !(base && base.show_outline === false);

    // World units: y grows DOWNWARD to match SVG. Vertex letters
    // A=TL, B=TR, C=BR, D=BL (clockwise from top-left).
    const corners = {
      [verts[0]]: { x: 0,  y: 0  },   // A
      [verts[1]]: { x: bw, y: 0  },   // B
      [verts[2]]: { x: bw, y: bh },   // C
      [verts[3]]: { x: 0,  y: bh },   // D
    };

    // Mid-side helper
    const midSide = (sideStr) => {
      if (typeof sideStr !== 'string' || sideStr.length !== 2) return null;
      const a = corners[sideStr[0]], b = corners[sideStr[1]];
      if (!a || !b) return null;
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };

    // ── Compute fitted viewBox with margin for labels & arcs ──────────────
    // We pad by ~enough for any arc that bulges OUTSIDE the base.
    const padBase = 30;       // base label / vertex label padding
    let padN = padBase, padS = padBase, padE = padBase, padW = padBase;

    // First pass: scan operations to expand padding for "away"/"add" arcs.
    (operations || []).forEach((op) => {
      if (!op) return;
      if (op.type === 'semicircle' && op.direction === 'away') {
        const ep = op.diameter_endpoints;
        const sideStr = Array.isArray(ep) ? ep.join('') : ep;
        const r = Math.hypot(
          (corners[sideStr?.[0]]?.x ?? 0) - (corners[sideStr?.[1]]?.x ?? 0),
          (corners[sideStr?.[0]]?.y ?? 0) - (corners[sideStr?.[1]]?.y ?? 0)
        ) / 2;
        // Expand the side that bulges outward
        if (sideStr === 'AB' || sideStr === 'BA') padN += r;
        if (sideStr === 'CD' || sideStr === 'DC') padS += r;
        if (sideStr === 'BC' || sideStr === 'CB') padE += r;
        if (sideStr === 'AD' || sideStr === 'DA') padW += r;
      }
      if (op.type === 'fullCircle' && op.mode === 'add') {
        const r = Number(op.radius) || 0;
        padN = Math.max(padN, padBase + r);
        padS = Math.max(padS, padBase + r);
        padE = Math.max(padE, padBase + r);
        padW = Math.max(padW, padBase + r);
      }
    });

    // Decide world-to-view scale so the (padded) world fits a 400-wide canvas.
    const targetW = 400;
    const worldW = bw + padW + padE;
    const worldH = bh + padN + padS;
    const scale = Math.min(targetW / worldW, 280 / worldH);
    const vbW = Math.max(targetW, worldW * scale);
    const vbH = Math.max(180, worldH * scale);

    // World→view transform: shift world (0,0) → (padW * scale, padN * scale)
    const tx = (x) => (x + padW) * scale;
    const ty = (y) => (y + padN) * scale;
    const ts = (d) => d * scale;

    // ── Style tokens ──────────────────────────────────────────────────────
    const STROKE   = 'var(--text-main, #1a2e2a)';
    const FACE_BG  = 'var(--bg-elevated, #f0f5f2)';
    const SHADE    = 'rgba(183,110,121,0.22)';            // rose
    const CUTOUT   = '#FFFFFF';                            // white "subtract" fill
    const LBL      = 'var(--text-muted, #5d706b)';

    // ── Build paths for each operation ────────────────────────────────────
    // Each op produces an SVG `d` attribute representing its CLOSED region.
    // We do this in WORLD coords first, then map through (tx, ty, ts).
    const pathParts = [];

    const addSemicirclePath = (sideStr, direction) => {
      // Diameter from corner 1 → corner 2; the arc bulges either INTO the
      // rectangle interior or AWAY from it. Returns the closed-region
      // path data (in world units).
      const c1 = corners[sideStr[0]], c2 = corners[sideStr[1]];
      if (!c1 || !c2) return '';
      const r = Math.hypot(c2.x - c1.x, c2.y - c1.y) / 2;
      // Determine which sweep flag draws the arc on the requested side.
      // Use rectangle centre as the "inside" reference.
      const cx = bw / 2, cy = bh / 2;
      const mx = (c1.x + c2.x) / 2, my = (c1.y + c2.y) / 2;
      // Try sweep 0 first; if its arc midpoint is on the wanted side, keep it.
      // Compute arc midpoint at sweep 0 by rotating (c1→c2) by 90° CCW.
      const ux = (c2.x - c1.x) / (2 * r), uy = (c2.y - c1.y) / (2 * r);
      // Perpendicular (rotate 90° CW in SVG coords gives interior of rectangle
      // for an outer side traversed clockwise — but we don't rely on it; we
      // test both candidates).
      const candA = { x: mx - uy * r, y: my + ux * r }; // sweep flag 0
      const candB = { x: mx + uy * r, y: my - ux * r }; // sweep flag 1
      const insideA = (candA.x > 0 && candA.x < bw && candA.y > 0 && candA.y < bh);
      const insideB = (candB.x > 0 && candB.x < bw && candB.y > 0 && candB.y < bh);
      let sweep = 0;
      if (direction === 'into') {
        sweep = insideA ? 0 : (insideB ? 1 : 0);
      } else { // 'away'
        sweep = insideA ? 1 : (insideB ? 0 : 1);
      }
      // Closed region: M c1 → A r,r 0 0 sweep c2 → L c1 (back along diameter)
      return `M ${c1.x},${c1.y} A ${r},${r} 0 0 ${sweep} ${c2.x},${c2.y} Z`;
    };

    const addQuarterPath = (centerCorner, radiiAlong, radiusOverride) => {
      const c = corners[centerCorner];
      if (!c) return '';
      const sides = Array.isArray(radiiAlong) ? radiiAlong : [];
      // Each side string starts with the centerCorner letter; the "other"
      // letter tells us the radius direction.
      const dirs = sides.slice(0, 2).map(s => {
        const other = (s[0] === centerCorner) ? s[1] : s[0];
        const oc = corners[other];
        if (!oc) return null;
        const dx = oc.x - c.x, dy = oc.y - c.y;
        const len = Math.hypot(dx, dy);
        return { ux: dx / len, uy: dy / len, len };
      }).filter(Boolean);
      if (dirs.length < 2) return '';
      const r = Number(radiusOverride) || Math.min(dirs[0].len, dirs[1].len);
      const p1 = { x: c.x + dirs[0].ux * r, y: c.y + dirs[0].uy * r };
      const p2 = { x: c.x + dirs[1].ux * r, y: c.y + dirs[1].uy * r };
      // Sweep direction: pick the flag that gives a 90° arc (not 270°). We
      // test sweep=0 by computing whether arc midpoint lands in the
      // "interior between the two radii". Take the cross product sign.
      const cross = dirs[0].ux * dirs[1].uy - dirs[0].uy * dirs[1].ux;
      const sweep = (cross > 0) ? 0 : 1;
      return `M ${c.x},${c.y} L ${p1.x},${p1.y} A ${r},${r} 0 0 ${sweep} ${p2.x},${p2.y} Z`;
    };

    const addFullCirclePath = (op) => {
      let cx = 0, cy = 0;
      if (op.center && typeof op.center.x === 'number') {
        cx = op.center.x; cy = op.center.y;
      } else if (op.corner && corners[op.corner]) {
        cx = corners[op.corner].x; cy = corners[op.corner].y;
      } else if (op.midSide) {
        const m = midSide(op.midSide);
        if (m) { cx = m.x; cy = m.y; }
      } else {
        cx = bw / 2; cy = bh / 2;
      }
      const r = Number(op.radius) || Math.min(bw, bh) / 4;
      // Use two arcs to form a full circle as a closed path.
      return `M ${cx - r},${cy} A ${r},${r} 0 1 0 ${cx + r},${cy} A ${r},${r} 0 1 0 ${cx - r},${cy} Z`;
    };

    (operations || []).forEach((op, idx) => {
      if (!op || !op.type) return;
      let d = '';
      if (op.type === 'semicircle') {
        const ep = op.diameter_endpoints;
        const sideStr = Array.isArray(ep) ? ep.join('') : (typeof ep === 'string' ? ep : '');
        if (sideStr.length === 2) d = addSemicirclePath(sideStr, op.direction || 'into');
      } else if (op.type === 'quarterCircle') {
        d = addQuarterPath(op.center_corner, op.radii_along || [], op.radius);
      } else if (op.type === 'fullCircle') {
        d = addFullCirclePath(op);
      }
      pathParts.push({ d, op, idx });
    });

    // ── Render order: (1) base fill, (2) shaded ops, (3) cut-outs from
    //    "subtract" ops, (4) outlines for everything, (5) base outline,
    //    (6) labels. We use sequential overpainting since fill rules differ
    //    between ops.
    let svg = '';

    // 1. Base shape — fill with FACE_BG, no outline yet.
    svg += `<rect x="${tx(0).toFixed(2)}" y="${ty(0).toFixed(2)}" width="${ts(bw).toFixed(2)}" height="${ts(bh).toFixed(2)}" fill="${FACE_BG}" stroke="none"/>`;

    // 2. Shaded regions (rose tint), in input order.
    const shadedSet = new Set((shaded || []).map(Number));
    pathParts.forEach(({ d, idx }) => {
      if (!d) return;
      if (shadedSet.has(idx)) {
        // Transform path into view space.
        const dView = transformPath(d, tx, ty);
        svg += `<path d="${dView}" fill="${SHADE}" stroke="none"/>`;
      }
    });

    // 3. Subtract regions (mode === "subtract") — paint white over base.
    pathParts.forEach(({ d, op }) => {
      if (!d) return;
      if (op.mode === 'subtract') {
        const dView = transformPath(d, tx, ty);
        svg += `<path d="${dView}" fill="${CUTOUT}" stroke="none"/>`;
      }
    });

    // 4. Outlines for all operations (so cuts/adds show as crisp arcs).
    pathParts.forEach(({ d }) => {
      if (!d) return;
      const dView = transformPath(d, tx, ty);
      svg += `<path d="${dView}" fill="none" stroke="${STROKE}" stroke-width="2"/>`;
    });

    // 5. Base outline last (so it sits on top of overlapping arc outlines).
    //    Drawn as 4 individual edges so we can auto-suppress edges that
    //    coincide with an `add`-mode arc's chord (avoids double-stroking).
    //    `showOutline === false` suppresses ALL four edges; vertex labels
    //    still render below.
    if (showOutline) {
      // Identify which adjacent-vertex edges the user's "add" ops have
      // already implicitly stroked (as part of the closed arc path).
      // Edge keys are normalised by sorting the two vertex letters.
      const edgeKey = (a, b) => [a, b].sort().join('-');
      const suppressed = new Set();
      // Adjacency map: which two vertices form each base edge.
      const baseEdges = [
        { from: verts[0], to: verts[1], side: 'top'    }, // A→B
        { from: verts[1], to: verts[2], side: 'right'  }, // B→C
        { from: verts[2], to: verts[3], side: 'bottom' }, // C→D
        { from: verts[3], to: verts[0], side: 'left'   }, // D→A
      ];
      const adjacencySet = new Set(baseEdges.map(e => edgeKey(e.from, e.to)));

      (operations || []).forEach((op) => {
        if (!op || op.mode !== 'add') return;
        if (op.type === 'semicircle') {
          const ep = op.diameter_endpoints;
          const sideStr = Array.isArray(ep) ? ep.join('') : (typeof ep === 'string' ? ep : '');
          if (sideStr.length === 2) {
            const k = edgeKey(sideStr[0], sideStr[1]);
            if (adjacencySet.has(k)) suppressed.add(k);
          }
        } else if (op.type === 'quarterCircle') {
          const cc = op.center_corner;
          const along = Array.isArray(op.radii_along) ? op.radii_along : [];
          const opR = Number(op.radius) || 0;
          along.forEach((s) => {
            if (typeof s !== 'string' || s.length !== 2) return;
            const other = (s[0] === cc) ? s[1] : (s[1] === cc ? s[0] : null);
            if (!other) return;
            const k = edgeKey(cc, other);
            if (!adjacencySet.has(k)) return;
            // Only suppress when the radius covers the full side length;
            // otherwise the un-arced portion of the edge still needs drawing.
            const a = corners[cc], b = corners[other];
            if (!a || !b) return;
            const sideLen = Math.hypot(b.x - a.x, b.y - a.y);
            if (Math.abs(opR - sideLen) < 1e-6) suppressed.add(k);
          });
        }
      });

      baseEdges.forEach(({ from, to }) => {
        if (suppressed.has(edgeKey(from, to))) return;
        const a = corners[from], b = corners[to];
        if (!a || !b) return;
        svg += `<line x1="${tx(a.x).toFixed(2)}" y1="${ty(a.y).toFixed(2)}" x2="${tx(b.x).toFixed(2)}" y2="${ty(b.y).toFixed(2)}" stroke="${STROKE}" stroke-width="2" stroke-linecap="square"/>`;
      });
    }

    // 6. Vertex labels
    if (show_vertex_labels) {
      const placeVertex = (vx, vy, key, dx, dy) => {
        const vp = { x: tx(vx) + dx, y: ty(vy) + dy };
        svg += `<text x="${vp.x.toFixed(1)}" y="${vp.y.toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="${LBL}">${esc(key)}</text>`;
      };
      placeVertex(0,  0,  verts[0], -10, -6);   // A — TL
      placeVertex(bw, 0,  verts[1],  10, -6);   // B — TR
      placeVertex(bw, bh, verts[2],  10, 16);   // C — BR
      placeVertex(0,  bh, verts[3], -10, 16);   // D — BL
    }

    // 7. Operation labels (e.g. "r = 14 cm") placed near the arc midpoint.
    pathParts.forEach(({ op }) => {
      if (!op || !op.label) return;
      // Use a coarse anchor: middle of the bounding box of the operation.
      let ax = bw / 2, ay = bh / 2;
      if (op.type === 'fullCircle' && op.corner && corners[op.corner]) {
        ax = corners[op.corner].x; ay = corners[op.corner].y;
      } else if (op.type === 'quarterCircle' && corners[op.center_corner]) {
        ax = corners[op.center_corner].x; ay = corners[op.center_corner].y;
      } else if (op.type === 'semicircle') {
        const ep = op.diameter_endpoints;
        const sideStr = Array.isArray(ep) ? ep.join('') : ep;
        const m = midSide(sideStr); if (m) { ax = m.x; ay = m.y; }
      }
      svg += `<text x="${tx(ax).toFixed(1)}" y="${ty(ay).toFixed(1)}" text-anchor="middle" font-size="11" font-style="italic" fill="${LBL}">${esc(op.label)}</text>`;
    });

    // 8. Optional dimension caption beneath the figure.
    if (dimension_label) {
      svg += `<text x="${(vbW / 2).toFixed(1)}" y="${(vbH - 6).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="${LBL}">${esc(dimension_label)}</text>`;
    }

    return this._svg(svg, {
      viewBox: `0 0 ${vbW.toFixed(1)} ${vbH.toFixed(1)}`,
      alt: `Composite figure built from a ${shape} (${bw}×${bh}) with ${(operations || []).length} arc operation(s).`,
      maxWidth: 460,
    });

    // ── Local helper: transform a path "d" string from world to view coords.
    function transformPath(d, tx, ty) {
      // Tokenise on commands; only M, L, A commands are emitted by us above.
      // We rewrite numeric coords, leaving radii (rx, ry) and flags untouched
      // for A; the renderer scales radii separately via `ts` since x and y
      // share the same scale factor.
      const out = [];
      const tokens = d.match(/[MLA]\s*[^MLAZ]+|Z/g) || [];
      tokens.forEach((tok) => {
        const cmd = tok[0];
        if (cmd === 'Z') { out.push('Z'); return; }
        const tail = tok.slice(1).trim().replace(/,/g, ' ').split(/\s+/).map(Number);
        if (cmd === 'M' || cmd === 'L') {
          // pairs of (x, y)
          const parts = [];
          for (let i = 0; i < tail.length; i += 2) {
            parts.push(`${tx(tail[i]).toFixed(2)},${ty(tail[i + 1]).toFixed(2)}`);
          }
          out.push(`${cmd} ${parts.join(' ')}`);
        } else if (cmd === 'A') {
          // rx ry x-axis-rotation large-arc-flag sweep-flag x y
          const rx = tail[0], ry = tail[1], rot = tail[2], laf = tail[3], sf = tail[4];
          const x  = tail[5], y  = tail[6];
          // Scale radii uniformly (same as ts())
          const rxV = (rx * scale).toFixed(2);
          const ryV = (ry * scale).toFixed(2);
          out.push(`A ${rxV},${ryV} ${rot} ${laf} ${sf} ${tx(x).toFixed(2)},${ty(y).toFixed(2)}`);
        }
      });
      return out.join(' ');
    }
  },

  /**
   * 🔆 raysAtPoint — Three-or-more rays radiating from a single point, each
   * pair of adjacent rays forming a labelled sector. Total of all sectors = 360°.
   *
   * Use for P5/P6 "Angles At A Point" — questions like "Three rays from O divide
   * the full angle at O into three parts: ∠AOB = 2n°, ∠BOC = (3n+10)°, ∠COA = (n+50)°"
   *
   * @param {string}   params.center  Center-point label (default "O").
   * @param {Array}    params.rays    [{ name: "A", at_deg: 90 }, ...]
   *                                  at_deg uses standard math convention:
   *                                  0° = right (+x), 90° = up (+y), CCW positive.
   * @param {Array}    params.arcs    [{ between: ["A","B"], label: "2n°" }, ...]
   *                                  Order in `between` doesn't matter — sectors
   *                                  are matched by SET of ray names.
   * @param {number}   params.ray_length  px from center (default 110).
   *
   * Example:
   *   { "function_name": "raysAtPoint",
   *     "params": {
   *       "center": "O",
   *       "rays": [
   *         { "name": "A", "at_deg": 90 },
   *         { "name": "B", "at_deg": 210 },
   *         { "name": "C", "at_deg": 330 }
   *       ],
   *       "arcs": [
   *         { "between": ["A","B"], "label": "2n°" },
   *         { "between": ["B","C"], "label": "(3n+10)°" },
   *         { "between": ["C","A"], "label": "(n+50)°" }
   *       ]
   *     } }
   */
  raysAtPoint({
    center      = 'O',
    rays        = [],
    arcs        = [],
    ray_length  = 110,
  } = {}) {
    const esc = this._esc.bind(this);
    const w = 400, h = 260;
    const cx = w / 2, cy = h / 2;
    const r  = Math.max(60, Math.min(120, Number(ray_length) || 110));

    const STROKE  = 'var(--text-main, #1a2e2a)';
    const LBL     = 'var(--text-muted, #5d706b)';
    const ANG_LBL = 'var(--brand-rose, #B76E79)';
    const DOT     = 'var(--brand-sage, #51615E)';
    const ARC_STK = 'var(--brand-rose, #B76E79)';

    // Defensive defaults
    const rayList = Array.isArray(rays) ? rays.filter(r => r && typeof r.name === 'string') : [];
    if (rayList.length < 2) {
      return this._svg(
        `<text x="${cx}" y="${cy}" text-anchor="middle" font-size="14" fill="${LBL}">raysAtPoint requires at least 2 rays</text>`,
        { viewBox: `0 0 ${w} ${h}`, alt: 'Invalid rays diagram' }
      );
    }
    const O = (typeof center === 'string' && center.length) ? center[0] : 'O';

    // Math: 0° = right, 90° = up. SVG y-axis is inverted so we negate sin.
    const polar = (deg, dist) => {
      const rad = deg * Math.PI / 180;
      return { x: cx + dist * Math.cos(rad), y: cy - dist * Math.sin(rad) };
    };
    const norm360 = (d) => ((Number(d) % 360) + 360) % 360;

    // Normalise + sort rays by CCW angle for sector matching
    const sortedRays = rayList
      .map(rr => ({ name: rr.name, deg: norm360(rr.at_deg) }))
      .sort((a, b) => a.deg - b.deg);

    let svg = '';

    // 1. Draw each ray as a line from center to its outer endpoint
    sortedRays.forEach(rr => {
      const end = polar(rr.deg, r);
      svg += `<line x1="${cx}" y1="${cy}" x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}" stroke="${STROKE}" stroke-width="2.5" stroke-linecap="round"/>`;
    });

    // 2. Center dot + center label (offset slightly south-east)
    svg += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${DOT}"/>`;
    svg += `<text x="${(cx + 10).toFixed(1)}" y="${(cy + 16).toFixed(1)}" font-size="14" font-weight="700" fill="${LBL}">${esc(O)}</text>`;

    // 3. Ray-end labels (push outside the ray)
    sortedRays.forEach(rr => {
      const lp = polar(rr.deg, r + 18);
      // Vertical baseline depends on quadrant so labels don't overlap rays
      const baseline = lp.y > cy + 6 ? 'hanging' : (lp.y < cy - 6 ? 'auto' : 'middle');
      const anchor   = lp.x > cx + 6 ? 'start'   : (lp.x < cx - 6 ? 'end'  : 'middle');
      svg += `<text x="${lp.x.toFixed(1)}" y="${lp.y.toFixed(1)}" font-size="16" font-weight="700" fill="${LBL}" text-anchor="${anchor}" dominant-baseline="${baseline}">${esc(rr.name)}</text>`;
    });

    // 4. Build sectors between adjacent rays (in CCW order) and label by SET match
    const arcRadius = Math.min(34, r * 0.32);
    (Array.isArray(arcs) ? arcs : []).forEach(entry => {
      if (!entry || !Array.isArray(entry.between) || entry.between.length !== 2) return;
      const [n1, n2] = entry.between;
      // Find the sector whose two rays are exactly {n1, n2}
      let chosen = null;
      for (let i = 0; i < sortedRays.length; i++) {
        const a = sortedRays[i];
        const b = sortedRays[(i + 1) % sortedRays.length];
        const set = new Set([a.name, b.name]);
        if (set.has(n1) && set.has(n2) && set.size === 2) {
          chosen = { from: a, to: b };
          break;
        }
      }
      if (!chosen) return;
      let span = chosen.to.deg - chosen.from.deg;
      if (span <= 0) span += 360;
      const midDeg = norm360(chosen.from.deg + span / 2);

      // 4a. Draw arc inside the sector
      const arcStart = polar(chosen.from.deg, arcRadius);
      const arcEnd   = polar(chosen.to.deg,   arcRadius);
      const largeArc = span > 180 ? 1 : 0;
      // SVG arcs go CW with sweep=1; our angles are CCW — so use sweep=0 to draw CCW
      svg += `<path d="M ${arcStart.x.toFixed(1)} ${arcStart.y.toFixed(1)} A ${arcRadius} ${arcRadius} 0 ${largeArc} 0 ${arcEnd.x.toFixed(1)} ${arcEnd.y.toFixed(1)}" fill="none" stroke="${ARC_STK}" stroke-width="1.6" opacity="0.8"/>`;

      // 4b. Place label at the bisector, just past the arc
      const labelDist = arcRadius + 18;
      const lp = polar(midDeg, labelDist);
      svg += `<text x="${lp.x.toFixed(1)}" y="${(lp.y + 4).toFixed(1)}" text-anchor="middle" font-size="14" font-weight="700" fill="${ANG_LBL}">${esc(entry.label || '?')}</text>`;
    });

    return this._svg(svg, {
      viewBox: `0 0 ${w} ${h}`,
      alt: `${sortedRays.length} rays radiating from point ${O}, dividing the full angle into ${sortedRays.length} sectors.`,
      maxWidth: 460,
    });
  },

  /**
   * 🔺 polygonWithInteriorPoints — A polygon with named vertices on its perimeter,
   * named division points on sides (at fractional positions or midpoints), and
   * optional cevians (line segments from a vertex to an interior side-point).
   *
   * Use for P5/P6 "Area of Triangle" composite figures, ratio-on-side, and
   * cevian-based area problems.
   *
   * @param {Array<string>}  params.vertices  Polygon corners, in order. e.g. ["A","B","C"].
   * @param {Array}          params.side_points
   *   [{ side: "BC", name: "D", position: 0.375 }, { side: "AC", name: "E", position: "midpoint" }]
   *   - `side` is a 2-letter string formed by two consecutive vertex names.
   *   - `position` is the fractional distance from the FIRST letter of `side`
   *     toward the SECOND letter (0..1). Use the literal "midpoint" for 0.5.
   *   - `name` labels the point on the side.
   * @param {Array<string>}  params.cevians
   *   ["AD", "BE", ...] — each pair connects a polygon vertex to a named side-point.
   * @param {Array}          params.side_labels
   *   [{ side: "BC", label: "24 cm" }] — optional captions placed outside the side.
   * @param {string}         params.shape  "triangle" (default) | "quadrilateral"
   *
   * Example for the cevian + midpoint pattern:
   *   { "function_name": "polygonWithInteriorPoints",
   *     "params": {
   *       "vertices": ["A","B","C"],
   *       "side_points": [
   *         { "side": "CB", "name": "D", "position": 0.375 },
   *         { "side": "AC", "name": "E", "position": "midpoint" }
   *       ],
   *       "cevians": ["AD", "BE"],
   *       "side_labels": [{ "side": "CB", "label": "24 cm" }]
   *     } }
   */
  polygonWithInteriorPoints({
    vertices    = ['A', 'B', 'C'],
    side_points = [],
    cevians     = [],
    side_labels = [],
    shape       = 'triangle',
  } = {}) {
    const esc = this._esc.bind(this);
    const w = 400, h = 280;
    const cx = w / 2, cy = h / 2 + 4;
    const r  = 100;

    const STROKE     = 'var(--text-main, #1a2e2a)';
    const FILL       = 'rgba(81, 97, 94, 0.05)';
    const LBL        = 'var(--text-muted, #5d706b)';
    const POINT_DOT  = 'var(--brand-sage, #51615E)';
    const POINT_LBL  = 'var(--brand-rose, #B76E79)';
    const CEVIAN     = 'var(--brand-rose, #B76E79)';
    const SIDE_LBL   = 'var(--text-muted, #5d706b)';

    // Defensive: at least 3 vertices
    const verts = Array.isArray(vertices) && vertices.length >= 3
      ? vertices.map(v => typeof v === 'string' ? v : (v && v.label) || '')
      : ['A', 'B', 'C'];
    const n = verts.length;

    // Compute vertex positions in a regular n-gon, top-aligned
    const startAngle = -Math.PI / 2;
    const vPos = {};
    verts.forEach((name, i) => {
      const ang = startAngle + (i * 2 * Math.PI) / n;
      vPos[name] = { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
    });

    // Resolve a side string ("BC") → { from: {x,y}, to: {x,y} }
    const resolveSide = (sideStr) => {
      if (typeof sideStr !== 'string' || sideStr.length !== 2) return null;
      const a = vPos[sideStr[0]], b = vPos[sideStr[1]];
      if (!a || !b) return null;
      return { from: a, to: b };
    };

    // Compute a side-point's position from {side, position}
    const resolveSidePoint = (sp) => {
      if (!sp || typeof sp.side !== 'string') return null;
      const seg = resolveSide(sp.side);
      if (!seg) return null;
      let t = sp.position;
      if (t === 'midpoint' || t === undefined || t === null) t = 0.5;
      t = Number(t);
      if (!Number.isFinite(t)) t = 0.5;
      t = Math.max(0, Math.min(1, t));
      return {
        x: seg.from.x + (seg.to.x - seg.from.x) * t,
        y: seg.from.y + (seg.to.y - seg.from.y) * t,
      };
    };

    // Build a quick lookup of named side-points
    const sidePtPos = {};
    (Array.isArray(side_points) ? side_points : []).forEach(sp => {
      if (!sp || typeof sp.name !== 'string') return;
      const pos = resolveSidePoint(sp);
      if (pos) sidePtPos[sp.name] = pos;
    });

    let svg = '';

    // 1. Polygon body
    const pointsAttr = verts.map(v => `${vPos[v].x.toFixed(1)},${vPos[v].y.toFixed(1)}`).join(' ');
    svg += `<polygon points="${pointsAttr}" fill="${FILL}" stroke="${STROKE}" stroke-width="2.5"/>`;

    // 2. Cevians (drawn before points so dots render on top)
    (Array.isArray(cevians) ? cevians : []).forEach(c => {
      if (typeof c !== 'string' || c.length !== 2) return;
      const [vName, pName] = [c[0], c[1]];
      const v = vPos[vName];
      const p = sidePtPos[pName];
      if (!v || !p) return;
      svg += `<line x1="${v.x.toFixed(1)}" y1="${v.y.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="${CEVIAN}" stroke-width="2" stroke-dasharray="0" opacity="0.85"/>`;
    });

    // 3. Vertex labels (push outside)
    verts.forEach((name, i) => {
      const ang = startAngle + (i * 2 * Math.PI) / n;
      const lp = { x: cx + (r + 20) * Math.cos(ang), y: cy + (r + 20) * Math.sin(ang) };
      const baseline = lp.y > cy + 10 ? 'hanging' : (lp.y < cy - 10 ? 'auto' : 'middle');
      const anchor   = lp.x > cx + 10 ? 'start'   : (lp.x < cx - 10 ? 'end'  : 'middle');
      svg += `<text x="${lp.x.toFixed(1)}" y="${lp.y.toFixed(1)}" font-size="16" font-weight="700" fill="${LBL}" text-anchor="${anchor}" dominant-baseline="${baseline}">${esc(name)}</text>`;
    });

    // 4. Side-point dots and labels
    (Array.isArray(side_points) ? side_points : []).forEach(sp => {
      if (!sp || typeof sp.name !== 'string') return;
      const p = sidePtPos[sp.name];
      if (!p) return;
      // Dot
      svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${POINT_DOT}"/>`;
      // Label — push slightly outward (away from polygon centroid)
      const dx = p.x - cx, dy = p.y - cy;
      const mag = Math.max(1, Math.hypot(dx, dy));
      const lx = p.x + (dx / mag) * 16;
      const ly = p.y + (dy / mag) * 16;
      const baseline = ly > cy + 6 ? 'hanging' : (ly < cy - 6 ? 'auto' : 'middle');
      const anchor   = lx > cx + 6 ? 'start'   : (lx < cx - 6 ? 'end'  : 'middle');
      svg += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="14" font-weight="700" fill="${POINT_LBL}" text-anchor="${anchor}" dominant-baseline="${baseline}">${esc(sp.name)}</text>`;
    });

    // 5. Side labels (caption near the midpoint of a side, pushed outward)
    (Array.isArray(side_labels) ? side_labels : []).forEach(sl => {
      if (!sl || typeof sl.side !== 'string' || sl.side.length !== 2) return;
      const seg = resolveSide(sl.side);
      if (!seg) return;
      const mx = (seg.from.x + seg.to.x) / 2;
      const my = (seg.from.y + seg.to.y) / 2;
      const dx = mx - cx, dy = my - cy;
      const mag = Math.max(1, Math.hypot(dx, dy));
      const lx = mx + (dx / mag) * 16;
      const ly = my + (dy / mag) * 16;
      svg += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" font-size="13" font-weight="600" fill="${SIDE_LBL}" text-anchor="middle">${esc(sl.label || '')}</text>`;
    });

    return this._svg(svg, {
      viewBox: `0 0 ${w} ${h}`,
      alt: `${shape} ${verts.join('')} with interior side-points and cevians.`,
      maxWidth: 480,
    });
  },

};

// Assign to globalThis for cross-environment access (browser + Node.js ESM)
if (typeof globalThis !== 'undefined') {
  globalThis.DiagramLibrary = DiagramLibrary;
}

// TEST: Each function must return a non-empty string with length > 50.
// TEST: rectangle({ widthLabel: '8 cm', heightLabel: '5 cm' }) → SVG string with role="img"
// TEST: barChart({ bars: [{label:'A',value:5},{label:'B',value:8}] }) → SVG string
// TEST: dataTable({ headers:['Name','Score'], rows:[['Ali','85']] }) → HTML table string
// TEST: arrowDiagram({ nodes:[{id:'a',label:'Grass'},{id:'b',label:'Rabbit'}], arrows:[{from:'a',to:'b'}] }) → SVG string