/**
 * diagram-library.js
 * Pure SVG/HTML diagram generator for exam questions.
 * All functions are pure — they take params and return strings. No DOM access.
 *
 * CSS variable usage (from style.css — NEVER hardcode hex values):
 *   Borders/axes/text:  var(--brand-sage)   #51615E
 *   Highlights/shaded:  var(--brand-rose)   #B76E79
 *   Light backgrounds:  var(--bg-elevated)  #F0F4F3
 *   Accent/warning:     var(--brand-amber)  #D97706
 *   Text on light bg:   var(--text-main)    #2C3E3A
 *   Muted text:         var(--text-muted)   #6B7A77
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
        : { top: 'var(--bg-elevated)',     left: 'rgba(81,97,94,0.16)',    right: 'rgba(81,97,94,0.08)' };
      const stroke = hl ? 'var(--brand-rose)' : 'var(--brand-sage)';
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
      ? `<text x="${svgW/2}" y="16" text-anchor="middle" fill="var(--text-main)" font-size="12" font-weight="600">${esc(label)}</text>`
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
    svg += `<text x="${x}" y="${hY}" text-anchor="middle" fill="var(--brand-sage)" font-size="10" font-weight="700">${t}</text>`;
  });

  // ── TOP VIEW ───────────────────────────────────────────────────────────────
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const h    = Number((grid[r] || [])[c]) || 0;
      const fill = h > 0 ? 'rgba(81,97,94,0.22)' : 'none';
      svg += `<rect x="${tx0+c*cs}" y="${topY0+r*cs}" width="${cs}" height="${cs}" fill="${fill}" stroke="var(--brand-sage)" stroke-width="1"/>`;
      if (h > 1) svg += `<text x="${tx0+c*cs+cs/2}" y="${topY0+r*cs+cs/2+4}" text-anchor="middle" fill="var(--brand-sage)" font-size="8" font-weight="700">${h}</text>`;
    }
  }

  // ── FRONT VIEW (looking from row=0 side) ──────────────────────────────────
  for (let c = 0; c < cols; c++) {
    for (let z = 0; z < mFront; z++) {
      const fill = z < frontH[c] ? 'rgba(81,97,94,0.22)' : 'none';
      svg += `<rect x="${fx0+c*cs}" y="${frontY0+(mFront-1-z)*cs}" width="${cs}" height="${cs}" fill="${fill}" stroke="var(--brand-sage)" stroke-width="1"/>`;
    }
  }

  // ── SIDE VIEW (looking from col=cols−1 side, row=0 appears on RIGHT) ──────
  for (let r = 0; r < rows; r++) {
    const panelCol = rows - 1 - r;   // front row → rightmost column in panel
    for (let z = 0; z < mSide; z++) {
      const fill = z < sideH[r] ? 'rgba(81,97,94,0.22)' : 'none';
      svg += `<rect x="${sx0+panelCol*cs}" y="${sideY0+(mSide-1-z)*cs}" width="${cs}" height="${cs}" fill="${fill}" stroke="var(--brand-sage)" stroke-width="1"/>`;
    }
  }

  // Optional diagram caption
  const capEl = label
    ? `<text x="${svgW/2}" y="${svgH-3}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${esc(label)}</text>`
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
  unitModel(data) {
    if (!data || !data.models) return '';
    // Uses the Sage-Rose glassmorphism design tokens
    let svg = `<rect width="100%" height="100%" fill="var(--glass-bg, rgba(255,255,255,0.7))" rx="8"/>`;
    let y = 40;

    data.models.forEach(model => {
      svg += `<text x="20" y="${y + 15}" fill="var(--text-main)" font-size="14" font-weight="bold">${this._esc(model.label)}</text>`;
      let x = 100;
      model.parts.forEach(part => {
        const width = part.width || 40;
        const fill = part.shaded ? 'var(--brand-rose)' : 'var(--glass-bg, rgba(255,255,255,0.7))';
        const opacity = part.shaded ? '0.3' : '1';
        const strokeDash = part.dashed ? 'stroke-dasharray="4,4"' : '';

        svg += `<rect x="${x}" y="${y}" width="${width}" height="24" fill="${fill}" fill-opacity="${opacity}" stroke="var(--brand-sage)" stroke-width="2" ${strokeDash}/>`;

        if (part.label) {
          svg += `<text x="${x + width / 2}" y="${y + 16}" text-anchor="middle" fill="var(--text-main)" font-size="12">${this._esc(part.label)}</text>`;
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
 
    let svg = `<rect width="100%" height="100%" fill="var(--glass-bg, rgba(255,255,255,0.7))" rx="8" stroke="var(--border-light)" />`;
 
    // Title
    if (data.title) {
      svg += `<text x="${VB_W / 2}" y="22" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="700">${esc(data.title)}</text>`;
    }
 
    // ── Component drawing primitives ───────────────────────────────────────
    const drawBattery = (cx, cy) => {
      // Wire-break + two vertical lines (short = −, long = +)
      let s = `<line x1="${cx - 10}" y1="${cy}" x2="${cx + 10}" y2="${cy}" stroke="var(--glass-bg, rgba(255,255,255,0.7))" stroke-width="6"/>`;
      s    += `<line x1="${cx - 5}" y1="${cy - 10}" x2="${cx - 5}" y2="${cy + 10}" stroke="var(--text-main)" stroke-width="2"/>`;
      s    += `<line x1="${cx + 5}" y1="${cy - 14}" x2="${cx + 5}" y2="${cy + 14}" stroke="var(--text-main)" stroke-width="2"/>`;
      return s;
    };
 
    const drawBulb = (cx, cy, comp) => {
      const stroke = comp.fused ? 'var(--brand-rose)' : 'var(--brand-sage)';
      const r = 13;
      let s = `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="var(--glass-bg, rgba(255,255,255,0.7))" stroke-width="6"/>`;
      s    += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--glass-bg, rgba(255,255,255,0.7))" stroke="${stroke}" stroke-width="2"/>`;
      // MOE filament cross
      s    += `<path d="M ${cx - 9} ${cy - 9} L ${cx + 9} ${cy + 9} M ${cx - 9} ${cy + 9} L ${cx + 9} ${cy - 9}" stroke="${stroke}" stroke-width="1.8"/>`;
      // Label below the bulb
      if (comp.label) {
        s += `<text x="${cx}" y="${cy + r + 14}" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="600">${esc(comp.label)}</text>`;
      }
      return s;
    };
 
    const drawSwitch = (cx, cy, comp) => {
      let s = `<line x1="${cx - 10}" y1="${cy}" x2="${cx + 10}" y2="${cy}" stroke="var(--glass-bg, rgba(255,255,255,0.7))" stroke-width="6"/>`;
      s    += `<circle cx="${cx - 7}" cy="${cy}" r="2.5" fill="var(--text-main)"/>`;
      s    += `<circle cx="${cx + 7}" cy="${cy}" r="2.5" fill="var(--text-main)"/>`;
      if (comp.isOpen) {
        s += `<line x1="${cx - 7}" y1="${cy}" x2="${cx + 6}" y2="${cy - 9}" stroke="var(--text-main)" stroke-width="2"/>`;
      } else {
        s += `<line x1="${cx - 7}" y1="${cy}" x2="${cx + 7}" y2="${cy}" stroke="var(--text-main)" stroke-width="2"/>`;
      }
      // Label above the switch
      if (comp.label) {
        s += `<text x="${cx}" y="${cy - 12}" text-anchor="middle" fill="var(--text-main)" font-size="10" font-weight="600">${esc(comp.label)}</text>`;
      }
      return s;
    };
 
    const drawGap = (cx, cy, comp) => {
      let s = `<line x1="${cx - 10}" y1="${cy}" x2="${cx + 10}" y2="${cy}" stroke="var(--glass-bg, rgba(255,255,255,0.7))" stroke-width="6"/>`;
      s    += `<circle cx="${cx - 7}" cy="${cy}" r="3" fill="var(--brand-rose)"/>`;
      s    += `<circle cx="${cx + 7}" cy="${cy}" r="3" fill="var(--brand-rose)"/>`;
      if (comp.label) {
        s += `<text x="${cx}" y="${cy - 12}" text-anchor="middle" fill="var(--brand-rose)" font-size="10" font-weight="700">${esc(comp.label)}</text>`;
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
      svg += `<path d="M ${X1} ${Y1} L ${X2} ${Y1} L ${X2} ${Y2} L ${X1} ${Y2} Z" fill="none" stroke="var(--brand-sage)" stroke-width="2"/>`;
 
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
      svg += `<line x1="${X1}" y1="${yMin}" x2="${X1}" y2="${yMax}" stroke="var(--brand-sage)" stroke-width="2"/>`;
      // Right vertical bus
      svg += `<line x1="${X2}" y1="${yMin}" x2="${X2}" y2="${yMax}" stroke="var(--brand-sage)" stroke-width="2"/>`;
 
      // Battery wire: from middle of left bus down/up to battery position
      // Battery is drawn on a short branch to the left of the left bus
      const BAT_X = X1 - 25;
      svg += `<line x1="${BAT_X}" y1="${Y_BAT}" x2="${X1}" y2="${Y_BAT}" stroke="var(--brand-sage)" stroke-width="2"/>`;
      // If battery position isn't on the bus span, extend the bus
      if (Y_BAT < yMin) svg += `<line x1="${X1}" y1="${Y_BAT}" x2="${X1}" y2="${yMin}" stroke="var(--brand-sage)" stroke-width="2"/>`;
      if (Y_BAT > yMax) svg += `<line x1="${X1}" y1="${yMax}" x2="${X1}" y2="${Y_BAT}" stroke="var(--brand-sage)" stroke-width="2"/>`;
 
      // Left side wire: battery → top of left bus
      svg += `<line x1="${BAT_X}" y1="${Y_BAT}" x2="${BAT_X}" y2="35" stroke="var(--brand-sage)" stroke-width="2"/>`;
      svg += `<line x1="${BAT_X}" y1="35" x2="${X2 + 25}" y2="35" stroke="var(--brand-sage)" stroke-width="2"/>`;
      svg += `<line x1="${X2 + 25}" y1="35" x2="${X2 + 25}" y2="${Y_BAT}" stroke="var(--brand-sage)" stroke-width="2"/>`;
      svg += `<line x1="${X2 + 25}" y1="${Y_BAT}" x2="${X2}" y2="${Y_BAT}" stroke="var(--brand-sage)" stroke-width="2"/>`;
      if (Y_BAT < yMin || Y_BAT > yMax) {
        // wire from outer right bus into the rails
      }
 
      svg += drawBattery(BAT_X, Y_BAT);
 
      // Draw each rail with its components
      usedRails.forEach(rail => {
        const y = railY[rail];
        svg += `<line x1="${X1}" y1="${y}" x2="${X2}" y2="${y}" stroke="var(--brand-sage)" stroke-width="2"/>`;
 
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
      svg += `<path d="M ${X1} ${Y1} L ${X2} ${Y1} L ${X2} ${Y2_TOP} L ${X1} ${Y2_TOP} Z" fill="none" stroke="var(--brand-sage)" stroke-width="2"/>`;
 
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
        svg += `<line x1="${subX1}" y1="${Y2_TOP}" x2="${subX1}" y2="${Y_SUB}" stroke="var(--brand-sage)" stroke-width="2"/>`;
        svg += `<line x1="${subX2}" y1="${Y2_TOP}" x2="${subX2}" y2="${Y_SUB}" stroke="var(--brand-sage)" stroke-width="2"/>`;
        svg += `<line x1="${subX1}" y1="${Y_SUB}" x2="${subX2}" y2="${Y_SUB}" stroke="var(--brand-sage)" stroke-width="2"/>`;
 
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
      svg += `<path d="M ${X1} ${Y1} L ${X2} ${Y1} L ${X2} ${Y2} L ${X1} ${Y2} Z" fill="none" stroke="var(--brand-sage)" stroke-width="2"/>`;
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

    let svg = `<svg viewBox="0 0 ${width} ${height}" style="width: 100%; max-width: 420px; height: auto; display: block; margin: 0 auto 1.5rem auto; background: var(--bg-surface); border-radius: 8px; border: 1px solid var(--border-light);" role="img" aria-label="Concept Map">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="24" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--brand-sage)" />
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
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--brand-sage)" stroke-width="2" marker-end="url(#arrowhead)"/>`;
      }
    });

    nodes.forEach(node => {
      const nx = Number((Number(node.x) / 100) * width) || 0;
      const ny = Number((Number(node.y) / 100) * height) || 0;
      svg += `
        <rect x="${nx - 40}" y="${ny - 12}" width="80" height="24" rx="12" fill="var(--bg-elevated)" stroke="var(--border-dark)" stroke-width="2"/>
        <text x="${nx}" y="${ny + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--text-main)" font-family="sans-serif">${this._esc(node.label)}</text>
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
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">${esc(cleanKey)}</div>
            <div style="font-size: 15px; color: var(--text-main); line-height: 1.5;">${esc(cleanVal)}</div>
          </div>`;
      }
    } else {
      rowsHtml = `<div style="color: var(--text-main); font-size: 15px; line-height: 1.5;">${esc(params)}</div>`;
    }

    const htmlContent = `
      <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; padding: 20px; box-sizing: border-box; background: var(--bg-elevated); border: 2px dashed var(--border-light); border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif;">
        <div style="font-weight: 800; font-size: 18px; margin-bottom: 16px; color: var(--brand-sage); display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
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
      shapesHtml += `<polygon points="${points}" fill="rgba(81, 97, 94, 0.05)" stroke="var(--brand-sage)" stroke-width="2"/>`;

      // Draw tick marks on all 3 sides to visually denote 'equilateral'
      const tickL = 6;
      // Left side tick
      shapesHtml += `<line x1="${(topX + blX) / 2 - tickL}" y1="${(topY + blY) / 2 + tickL / 2}" x2="${(topX + blX) / 2 + tickL}" y2="${(topY + blY) / 2 - tickL / 2}" stroke="var(--brand-rose)" stroke-width="2"/>`;
      // Right side tick
      shapesHtml += `<line x1="${(topX + brX) / 2 - tickL}" y1="${(topY + brY) / 2 - tickL / 2}" x2="${(topX + brX) / 2 + tickL}" y2="${(topY + brY) / 2 + tickL / 2}" stroke="var(--brand-rose)" stroke-width="2"/>`;
      // Bottom base tick
      shapesHtml += `<line x1="${cx}" y1="${brY - tickL}" x2="${cx}" y2="${brY + tickL}" stroke="var(--brand-rose)" stroke-width="2"/>`;

      // Base dimension label
      shapesHtml += `<text x="${cx}" y="${brY + 24}" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--text-main)">${esc(sideLength)}${esc(unit)}</text>`;
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
    if (total === 0) return this._svg(`<text x="200" y="130" text-anchor="middle" fill="var(--text-muted)">No data provided</text>`, { alt: "Empty Pie Chart" });

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
        <text x="${legX + 22}" y="${legY}" font-size="12" fill="var(--text-main)" font-weight="500">${esc(item.label)}</text>
      `;
    });

    const titleEl = title ? `<text x="200" y="30" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--text-main)">${esc(title)}</text>` : '';

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

      labelsHtml += `<text x="${lx}" y="${ly}" font-size="16" font-weight="bold" fill="var(--text-muted)" text-anchor="${anchor}" dominant-baseline="${baseline}">${vertices[i]}</text>`;
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

        angleArcsHtml += `<text x="${tx}" y="${ty + 6}" font-size="18" font-weight="bold" fill="var(--brand-rose)" text-anchor="middle">?</text>`;
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
    if (lLabel) svg += `<text x="${fx + fw / 2}" y="${fy + fh + 20}" font-size="14" font-weight="bold" text-anchor="middle" fill="var(--text-main)">${esc(lLabel)}</text>`;
    if (hLabel) svg += `<text x="${fx - 10}" y="${fy + fh / 2}" font-size="14" font-weight="bold" text-anchor="end" fill="var(--text-main)">${esc(hLabel)}</text>`;
    if (bLabel) svg += `<text x="${fx + fw + depthX / 2 + 10}" y="${fy + fh + depthY / 2 + 10}" font-size="14" font-weight="bold" fill="var(--text-main)">${esc(bLabel)}</text>`;

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

    let svg = `<polygon points="${tlX},${tlY} ${trX},${trY} ${brX},${brY} ${blX},${blY}" fill="rgba(81, 97, 94, 0.05)" stroke="var(--brand-sage)" stroke-width="3"/>`;

    if (params.show_diagonals) {
      svg += `<line x1="${tlX}" y1="${tlY}" x2="${brX}" y2="${brY}" stroke="var(--border-dark, #ccc)" stroke-width="1.5" stroke-dasharray="4"/>`;
      svg += `<line x1="${trX}" y1="${trY}" x2="${blX}" y2="${blY}" stroke="var(--border-dark, #ccc)" stroke-width="1.5" stroke-dasharray="4"/>`;
    }

    // Vertex Labels
    svg += `<text x="${tlX - 10}" y="${tlY - 5}" font-size="16" font-weight="bold" text-anchor="end" fill="var(--text-muted)">${esc(v[0])}</text>`;
    svg += `<text x="${trX + 10}" y="${trY - 5}" font-size="16" font-weight="bold" fill="var(--text-muted)">${esc(v[1])}</text>`;
    svg += `<text x="${brX + 10}" y="${brY + 20}" font-size="16" font-weight="bold" fill="var(--text-muted)">${esc(v[2])}</text>`;
    svg += `<text x="${blX - 10}" y="${brY + 20}" font-size="16" font-weight="bold" text-anchor="end" fill="var(--text-muted)">${esc(v[3])}</text>`;

    // Internal Angle Markers
    if (params.angle_arcs) {
      params.angle_arcs.forEach(arc => {
        const pt = arc.vertex === v[0] ? { x: tlX + 25, y: tlY + 22 } :
          arc.vertex === v[1] ? { x: trX - 25, y: trY + 22 } :
            arc.vertex === v[2] ? { x: brX - 28, y: brY - 15 } :
              { x: blX + 30, y: blY - 15 };
        svg += `<text x="${pt.x}" y="${pt.y}" font-size="14" font-weight="bold" text-anchor="middle" fill="var(--brand-rose)">${esc(arc.label)}</text>`;
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
      <text x="${cx + r + 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted)">${rightVertex}</text>
      <text x="${cx - r - 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted)">${leftVertex}</text>
      <text x="${cx}" y="${cy + 25}" font-size="16" font-weight="bold" text-anchor="middle" fill="var(--text-muted)">${center}</text>
    `;

    // Draw the rays (e.g., D, E, C at 30, 60, 90 degrees)
    rayEnds.forEach((endVertex, index) => {
      const totalRays = rayEnds.length;
      const angleDeg = (index + 1) * (90 / totalRays);
      const rad = angleDeg * Math.PI / 180;

      const rayX = cx + r * Math.cos(rad);
      const rayY = cy - r * Math.sin(rad);

      svg += `<line x1="${cx}" y1="${cy}" x2="${rayX}" y2="${rayY}" stroke="var(--text-main, #333)" stroke-width="2"/>`;
      labelsHtml += `<text x="${rayX + 10}" y="${rayY - 10}" font-size="16" font-weight="bold" fill="var(--text-muted)">${endVertex}</text>`;
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

      labelsHtml += `<text x="${textX}" y="${textY}" font-size="14" font-weight="bold" text-anchor="middle" fill="var(--brand-sage)">${label}</text>`;
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
      <text x="${cx + r + 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted)">${rightVertex}</text>
      <text x="${cx - r - 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted)">${leftVertex}</text>
      <text x="${cx}" y="${cy + 25}" font-size="16" font-weight="bold" text-anchor="middle" fill="var(--text-muted)">${center}</text>
    `;

    // Draw the rays dynamically spaced across 180 degrees
    const totalAngles = rayEnds.length + 1;
    rayEnds.forEach((endVertex, index) => {
      const angleDeg = (index + 1) * (180 / totalAngles);
      const rad = angleDeg * Math.PI / 180;

      const rayX = cx + r * Math.cos(rad);
      const rayY = cy - r * Math.sin(rad);

      svg += `<line x1="${cx}" y1="${cy}" x2="${rayX}" y2="${rayY}" stroke="var(--text-main, #333)" stroke-width="2"/>`;
      labelsHtml += `<text x="${rayX + 10}" y="${rayY - 10}" font-size="16" font-weight="bold" fill="var(--text-muted)">${endVertex}</text>`;
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

      labelsHtml += `<text x="${textX}" y="${textY}" font-size="14" font-weight="bold" text-anchor="middle" fill="var(--brand-sage)">${label}</text>`;
    });

    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">
        ${svg}
        ${labelsHtml}
      </svg>
    `;
  },

  rectangleDividedRightAngle(params) {
    // Canvas sizing
    const w = 400, h = 260;

    // Rectangle vertices (Q is Bottom Left, P is Top Left, R is Bottom Right, S is Top Right)
    const qx = 50, qy = 210;
    const px = 50, py = 50;
    const rx = 350, ry = 210;
    const sx = 350, sy = 50;

    const v = params.vertices || ['P', 'Q', 'R', 'S'];
    const pName = v[0] || 'P';
    const qName = v[1] || 'Q';
    const rName = v[2] || 'R';
    const sName = v[3] || 'S';

    let svg = `<rect x="${px}" y="${py}" width="${rx - px}" height="${qy - py}" fill="none" stroke="var(--border-dark, #ccc)" stroke-width="3"/>`;
    svg += `<rect x="${qx}" y="${qy - 15}" width="15" height="15" fill="none" stroke="var(--brand-sage, #51615E)" stroke-width="1.5"/>`;

    // 🚀 SMART PARSER: Analyze the angles the AI actually asked for (e.g. PQT, SQT)
    const angles = params.angles || [];
    const endPoints = new Set();

    angles.forEach(a => {
      let label = (a.label || '').toUpperCase().replace('ANGLE', '').trim();
      // Split the angle string by the center vertex (Q) to find the two endpoints
      if (label.includes(qName)) {
        const parts = label.split(qName);
        if (parts[0]) endPoints.add(parts[0].trim());
        if (parts[1]) endPoints.add(parts[1].trim());
      } else if (label.length === 3) {
        endPoints.add(label[0]);
        endPoints.add(label[2]);
      }
    });

    // Remove the standard corners from our to-draw list
    endPoints.delete(pName);
    endPoints.delete(qName);
    endPoints.delete(rName);

    const extraRays = Array.from(endPoints);
    let labelsHtml = '';

    // 1. If S is mentioned in the angles, draw the rectangle's diagonal
    if (extraRays.includes(sName)) {
      svg += `<line x1="${qx}" y1="${qy}" x2="${sx}" y2="${sy}" stroke="var(--border-dark, #ccc)" stroke-width="2"/>`;
      extraRays.splice(extraRays.indexOf(sName), 1); // Remove S from the queue
    }

    // 2. Draw any remaining extra lines (like T) that were explicitly mentioned in the text
    extraRays.forEach((ptName, index) => {
      const rad = (60 - (index * 20)) * Math.PI / 180;
      const lineLen = 200;
      const tx = qx + lineLen * Math.cos(rad);
      const ty = qy - lineLen * Math.sin(rad);
      svg += `<line x1="${qx}" y1="${qy}" x2="${tx}" y2="${ty}" stroke="var(--text-main, #333)" stroke-width="2"/>`;
      labelsHtml += `<text x="${tx + 10}" y="${ty + 10}" font-size="14" font-weight="bold" fill="var(--text-muted)">${ptName}</text>`;
    });

    // 3. Label the 4 standard corners
    labelsHtml += `
      <text x="${px - 15}" y="${py - 10}" font-size="16" font-weight="bold" fill="var(--text-muted)">${pName}</text>
      <text x="${qx - 15}" y="${qy + 20}" font-size="16" font-weight="bold" fill="var(--text-main)">${qName}</text>
      <text x="${rx + 15}" y="${ry + 20}" font-size="16" font-weight="bold" fill="var(--text-muted)">${rName}</text>
      <text x="${sx + 15}" y="${sy - 10}" font-size="16" font-weight="bold" fill="var(--text-muted)">${sName}</text>
    `;

    return `
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="height: auto; max-width: 500px; display: block; margin: 0 auto;">
        ${svg}
        ${labelsHtml}
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
      <text x="${cx + 50}" y="${cy - 20}" font-size="16" font-weight="bold" fill="var(--brand-sage)">${a1}</text>
      <text x="${cx - 60}" y="${cy - 20}" font-size="16" font-weight="bold" fill="var(--text-main)">${a2}</text>
      
      <text x="${cx}" y="${cy + 25}" font-size="16" font-weight="bold" text-anchor="middle" fill="var(--text-muted)">${vertices[1] || 'O'}</text>
      <text x="${cx + r + 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted)">${vertices[2] || 'B'}</text>
      <text x="${cx - r - 15}" y="${cy + 5}" font-size="16" font-weight="bold" fill="var(--text-muted)">${vertices[0] || 'A'}</text>
      <text x="${rayX + 10}" y="${rayY - 10}" font-size="16" font-weight="bold" fill="var(--text-muted)">${vertices[3] || 'C'}</text>
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
    for (let x = 0; x <= gridW; x += cellSize) gridLines += `<line x1="${x}" y1="0" x2="${x}" y2="${gridH}" stroke="var(--border-light)" stroke-width="1"/>`;
    for (let y = 0; y <= gridH; y += cellSize) gridLines += `<line x1="0" y1="${y}" x2="${gridW}" y2="${y}" stroke="var(--border-light)" stroke-width="1"/>`;

    const rectX = cellSize;
    const rectY = cellSize;
    const rectW = w_units * cellSize;
    const rectH = h_units * cellSize;
    const rectSvg = `<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" fill="rgba(183, 110, 121, 0.1)" stroke="var(--brand-sage)" stroke-width="3"/>`;

    const padding = 12;
    const txt = (chars, x, y, anchor, baseline) => `<text x="${x}" y="${y}" text-anchor="${anchor}" alignment-baseline="${baseline}" fill="var(--text-main)" font-size="16" font-weight="bold">${chars}</text>`;

    // 🚀 THE CORNER FIX: Pin each letter to the exact vertex
    const cornerLabels = `
      ${txt(TL, rectX - padding, rectY - padding, 'end', 'baseline')}
      ${txt(TR, rectX + rectW + padding, rectY - padding, 'start', 'baseline')}
      ${txt(BR, rectX + rectW + padding, rectY + rectH + padding, 'start', 'hanging')}
      ${txt(BL, rectX - padding, rectY + rectH + padding, 'end', 'hanging')}
      
      <text x="${rectX + rectW / 2}" y="${rectY - 6}" text-anchor="middle" fill="var(--text-main)" font-size="14">${w_cm}cm</text>
      <text x="${rectX - 6}" y="${rectY + rectH / 2}" text-anchor="end" alignment-baseline="middle" fill="var(--text-main)" font-size="14">${l_cm}cm</text>
    `;

    return `
      <svg width="100%" style="height: auto;" viewBox="0 0 ${gridW} ${gridH}" style="max-width: 500px;">
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
    fillColor = 'var(--bg-elevated)',
    title = '',
    showNotToScale = true,
  } = {}) {
    const esc = this._esc.bind(this);
    const wLbl = esc(widthLabel);
    const hLbl = esc(heightLabel);
    const notToScale = showNotToScale
      ? `<text x="200" y="255" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-style="italic">Figure not drawn to scale.</text>`
      : '';
    const titleEl = title
      ? `<text x="200" y="20" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="600">${esc(title)}</text>`
      : '';
    const content = `
      ${titleEl}
      <rect x="80" y="50" width="240" height="150" fill="${fillColor}" stroke="var(--brand-sage)" stroke-width="2"/>
      <!-- Width dimension arrow below -->
      <line x1="80" y1="220" x2="320" y2="220" stroke="var(--brand-sage)" stroke-width="1.5" marker-start="url(#arr)" marker-end="url(#arr)"/>
      <text x="200" y="238" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="600">${wLbl}</text>
      <!-- Height dimension arrow left -->
      <line x1="55" y1="50" x2="55" y2="200" stroke="var(--brand-sage)" stroke-width="1.5" marker-start="url(#arr)" marker-end="url(#arr)"/>
      <text x="30" y="130" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="600" transform="rotate(-90,30,130)">${hLbl}</text>
      ${notToScale}
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill="var(--brand-sage)"/>
        </marker>
      </defs>`;
    return this._svg(content, { alt: `Rectangle with width ${widthLabel} and height ${heightLabel}.` });
  },

  /**
   * Labelled square (calls rectangle with equal labels).
   * @param {object} opts
   * @returns {string} SVG string
   */
  square({ sideLabel = '?', unit = 'cm', fillColor = 'var(--bg-elevated)' } = {}) {
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
    fillColor = 'var(--bg-elevated)',
  } = {}) {
    const esc = this._esc.bind(this);
    const rightAngle = showRightAngle
      ? `<polyline points="80,200 100,200 100,180" fill="none" stroke="var(--brand-sage)" stroke-width="1.5"/>`
      : '';
    const hypLabel = hypotenuse
      ? `<text x="230" y="118" text-anchor="middle" fill="var(--text-main)" font-size="12" font-weight="600" transform="rotate(-50,230,118)">${esc(hypotenuse)}</text>`
      : '';
    const content = `
      <polygon points="80,200 320,200 80,50" fill="${fillColor}" stroke="var(--brand-sage)" stroke-width="2"/>
      ${rightAngle}
      <!-- Base label -->
      <text x="200" y="230" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="600">${esc(base)}</text>
      <!-- Height label -->
      <text x="42" y="130" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="600" transform="rotate(-90,42,130)">${esc(height)}</text>
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
      const fill = p.shaded ? 'var(--bg-elevated)' : 'none';
      const label = p.label
        ? `<text x="${p.x + p.w / 2}" y="${p.y + p.h / 2 + 5}" text-anchor="middle" fill="var(--text-main)" font-size="11">${this._esc(p.label)}</text>`
        : '';
      return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${fill}" stroke="var(--brand-sage)" stroke-width="2"/>${label}`;
    }).join('');
    const totalW = totalWidthLabel
      ? `<text x="200" y="248" text-anchor="middle" fill="var(--text-main)" font-size="12" font-weight="600">${this._esc(totalWidthLabel)}</text>`
      : '';
    const totalH = totalHeightLabel
      ? `<text x="20" y="130" text-anchor="middle" fill="var(--text-main)" font-size="12" font-weight="600" transform="rotate(-90,20,130)">${this._esc(totalHeightLabel)}</text>`
      : '';
    const nts = showNotToScale
      ? `<text x="200" y="258" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-style="italic">Figure not drawn to scale.</text>`
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
    fillColor = 'var(--bg-elevated)',
  } = {}) {
    const esc = this._esc.bind(this);
    const radiusLine = radiusLabel
      ? `<line x1="200" y1="130" x2="310" y2="130" stroke="var(--brand-sage)" stroke-width="1.5"/>
         <text x="258" y="120" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="600">${esc(radiusLabel)}</text>`
      : '';
    const diamLine = diameterLabel
      ? `<line x1="90" y1="130" x2="310" y2="130" stroke="var(--brand-sage)" stroke-width="1.5"/>
         <text x="200" y="118" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="600">${esc(diameterLabel)}</text>`
      : '';
    const content = `
      <circle cx="200" cy="130" r="110" fill="${fillColor}" stroke="var(--brand-sage)" stroke-width="2"/>
      <circle cx="200" cy="130" r="3" fill="var(--brand-sage)"/>
      ${radiusLine}${diamLine}`;
    return this._svg(content, { alt: `Circle${radiusLabel ? ' with radius ' + radiusLabel : ''}${diameterLabel ? ' with diameter ' + diameterLabel : ''}.` });
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
      ticks.push(`<line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}" stroke="var(--brand-sage)" stroke-width="1.5"/>`);
      ticks.push(`<text x="${x}" y="${y + 24}" text-anchor="middle" fill="var(--text-main)" font-size="12">${esc(customLabel ? customLabel.text : String(v))}</text>`);
    }

    // Highlight arcs
    const highlights = highlight.map(h => {
      const x1 = toX(h.from), x2 = toX(h.to);
      const mid = (x1 + x2) / 2;
      return `<path d="M ${x1} ${y - 12} Q ${mid} ${y - 35} ${x2} ${y - 12}" fill="none" stroke="var(--brand-rose)" stroke-width="2"/>`;
    }).join('');

    // Marked dots
    const dots = marked.map(v => {
      const x = toX(v);
      return `<circle cx="${x}" cy="${y}" r="5" fill="var(--brand-sage)"/>`;
    }).join('');

    // Main axis
    const arrowL = showArrows ? `<polygon points="${xLeft - 12},${y} ${xLeft},${y - 5} ${xLeft},${y + 5}" fill="var(--brand-sage)"/>` : '';
    const arrowR = showArrows ? `<polygon points="${xRight + 12},${y} ${xRight},${y - 5} ${xRight},${y + 5}" fill="var(--brand-sage)"/>` : '';

    const content = `
      <line x1="${xLeft}" y1="${y}" x2="${xRight}" y2="${y}" stroke="var(--brand-sage)" stroke-width="2"/>
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
    fillColor = 'var(--brand-rose)',
  } = {}) {
    const barX = 60, barY = 80, barW = 280, barH = 60;
    const partW = barW / denominator;
    const parts = [];
    for (let i = 0; i < denominator; i++) {
      const x = barX + i * partW;
      const fill = i < numerator ? fillColor : 'var(--bg-elevated)';
      parts.push(`<rect x="${x}" y="${barY}" width="${partW}" height="${barH}" fill="${fill}" stroke="var(--brand-sage)" stroke-width="1.5"/>`);
    }
    const label = showLabel
      ? `<text x="200" y="175" text-anchor="middle" fill="var(--text-main)" font-size="16" font-weight="700">${numerator}/${denominator}</text>`
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
        const fill = j < (f.numerator || 0) ? (f.color || 'var(--brand-rose)') : 'var(--bg-elevated)';
        parts.push(`<rect x="${x}" y="${y}" width="${partW}" height="${barH}" fill="${fill}" stroke="var(--brand-sage)" stroke-width="1"/>`);
      }
      const lbl = labels[i] || `${f.numerator}/${f.denominator}`;
      return `${parts.join('')}<text x="${barX - 10}" y="${y + barH / 2 + 5}" text-anchor="end" fill="var(--text-main)" font-size="12" font-weight="600">${this._esc(lbl)}</text>`;
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
      yTicks.push(`<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="var(--border-light)" stroke-width="1"/>`);
      yTicks.push(`<text x="${chartX - 6}" y="${y + 4}" text-anchor="end" fill="var(--text-muted)" font-size="10">${v}</text>`);
    }

    // Bars
    const barEls = bars.map((b, i) => {
      const bH = (b.value / autoMax) * chartH;
      const x = chartX + gap + i * (barW + gap);
      const y = chartY + chartH - bH;
      const fill = b.color || 'var(--brand-sage)';
      const valLabel = showValues
        ? `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" fill="var(--text-main)" font-size="10">${b.value}</text>`
        : '';
      return `<rect x="${x}" y="${y}" width="${barW}" height="${bH}" fill="${fill}" rx="2"/>
              <text x="${x + barW / 2}" y="${chartY + chartH + 16}" text-anchor="middle" fill="var(--text-main)" font-size="11">${esc(b.label)}</text>
              ${valLabel}`;
    }).join('');

    // Axes
    const axes = `<line x1="${chartX}" y1="${chartY}" x2="${chartX}" y2="${chartY + chartH}" stroke="var(--brand-sage)" stroke-width="2"/>
                  <line x1="${chartX}" y1="${chartY + chartH}" x2="${chartX + chartW}" y2="${chartY + chartH}" stroke="var(--brand-sage)" stroke-width="2"/>`;

    const titleEl = title ? `<text x="200" y="18" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="700">${esc(title)}</text>` : '';
    const xLblEl = xLabel ? `<text x="${chartX + chartW / 2}" y="255" text-anchor="middle" fill="var(--text-muted)" font-size="11">${esc(xLabel)}</text>` : '';
    const yLblEl = yLabel ? `<text x="14" y="${chartY + chartH / 2}" text-anchor="middle" fill="var(--text-muted)" font-size="11" transform="rotate(-90,14,${chartY + chartH / 2})">${esc(yLabel)}</text>` : '';

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
      return `<rect x="${chartX}" y="${y}" width="${bW}" height="${barH}" fill="var(--brand-sage)" rx="2"/>
              <text x="${chartX - 8}" y="${y + barH / 2 + 4}" text-anchor="end" fill="var(--text-main)" font-size="11">${esc(b.label)}</text>
              <text x="${chartX + bW + 6}" y="${y + barH / 2 + 4}" fill="var(--text-main)" font-size="11">${b.value}</text>`;
    }).join('');

    const axis = `<line x1="${chartX}" y1="${chartY}" x2="${chartX}" y2="${chartY + n * (barH + gap) - gap}" stroke="var(--brand-sage)" stroke-width="2"/>`;
    const titleEl = title ? `<text x="${chartX + chartW / 2}" y="20" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="700">${esc(title)}</text>` : '';

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
        `<text x="${symX + j * (symSize + gap)}" y="${y + 14}" fill="var(--brand-rose)" font-size="${symSize}">${keySymbol}</text>`
      ).join('');
      return `<text x="${labelX - 8}" y="${y + 14}" text-anchor="end" fill="var(--text-main)" font-size="12">${esc(item.label)}</text>${syms}`;
    }).join('');

    const keyY = 45 + n * 40;
    const keyEl = `<text x="${symX}" y="${keyY + 14}" fill="var(--brand-rose)" font-size="${symSize}">${keySymbol}</text>
      <text x="${symX + symSize + 6}" y="${keyY + 14}" fill="var(--text-muted)" font-size="11">= ${keyValue} ${esc(keyLabel)}</text>`;
    const titleEl = title ? `<text x="200" y="22" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="700">${esc(title)}</text>` : '';
    const axiX = `<line x1="${labelX}" y1="32" x2="${labelX}" y2="${keyY - 6}" stroke="var(--border-dark)" stroke-width="1"/>`;

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
      gridlines += `<line x1="${PAD_L}" y1="${yPx.toFixed(1)}" x2="${(PAD_L + plotW).toFixed(1)}" y2="${yPx.toFixed(1)}" stroke="var(--border-light)" stroke-width="1" stroke-dasharray="2,3"/>`;
      const lblTxt = Number.isInteger(yVal) ? String(yVal) : Number(yVal).toFixed(1);
      yTickLabels += `<text x="${(PAD_L - 8).toFixed(1)}" y="${(yPx + 4).toFixed(1)}" text-anchor="end" fill="var(--text-muted)" font-size="10">${lblTxt}</text>`;
    });

    // ── X tick labels ────────────────────────────────────────────────────────
    let xTickLabels = '';
    norm.forEach((p, i) => {
      const xPx = xAt(p.xRaw, i);
      xTickLabels += `<text x="${xPx.toFixed(1)}" y="${(PAD_T + plotH + 16).toFixed(1)}" text-anchor="middle" fill="var(--text-main)" font-size="10">${esc(p.displayX)}</text>`;
    });

    // ── Axes ─────────────────────────────────────────────────────────────────
    const axes = `<line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${(PAD_T + plotH).toFixed(1)}" stroke="var(--text-main)" stroke-width="1.5"/>` +
                 `<line x1="${PAD_L}" y1="${(PAD_T + plotH).toFixed(1)}" x2="${(PAD_L + plotW).toFixed(1)}" y2="${(PAD_T + plotH).toFixed(1)}" stroke="var(--text-main)" stroke-width="1.5"/>`;

    // ── Polyline + dots ──────────────────────────────────────────────────────
    const pathD = norm.map((p, i) => {
      const x = xAt(p.xRaw, i).toFixed(1);
      const y = yAt(p.yNum).toFixed(1);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
    const polyline = `<path d="${pathD}" fill="none" stroke="var(--brand-sage)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;

    // Value labels above each dot, but only if not too crowded
    const showValueLabels = norm.length <= 8;
    const dots = norm.map((p, i) => {
      const x = xAt(p.xRaw, i);
      const y = yAt(p.yNum);
      const valueLabel = showValueLabels
        ? `<text x="${x.toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" fill="var(--text-main)" font-size="10" font-weight="600" paint-order="stroke" stroke="var(--bg-surface)" stroke-width="3">${esc(String(p.yNum))}</text>`
        : '';
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--brand-sage)" stroke="var(--bg-surface)" stroke-width="1.5"/>${valueLabel}`;
    }).join('');

    // ── Titles & axis labels ─────────────────────────────────────────────────
    const titleEl = title
      ? `<text x="${(VB_W / 2).toFixed(1)}" y="20" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="700">${esc(title)}</text>`
      : '';
    const xLabelEl = xLabel
      ? `<text x="${(PAD_L + plotW / 2).toFixed(1)}" y="${(VB_H - 8).toFixed(1)}" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="600">${esc(xLabel)}</text>`
      : '';
    const yLabelEl = yLabel
      ? `<text x="14" y="${(PAD_T + plotH / 2).toFixed(1)}" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="600" transform="rotate(-90, 14, ${(PAD_T + plotH / 2).toFixed(1)})">${esc(yLabel)}</text>`
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

    const thStyle = `style="background:var(--bg-elevated);color:var(--text-main);font-weight:700;font-size:0.875rem;padding:8px 12px;border:1px solid var(--border-dark);text-align:center;"`;
    const tdStyleBase = `padding:8px 12px;border:1px solid var(--border-light);text-align:center;font-size:0.875rem;color:var(--text-main);`;

    const thead = headers.length
      ? `<thead><tr>${headers.map((h, i) => `<th ${thStyle}${i === highlightCol ? ' style="background:var(--brand-rose);color:white;font-weight:700;padding:8px 12px;border:1px solid var(--border-dark);text-align:center;"' : ''}>${esc(h)}</th>`).join('')}</tr></thead>`
      : '';

    const tbody = `<tbody>${rows.map(row =>
      `<tr>${row.map((cell, i) => {
        const hlStyle = i === highlightCol ? `background:rgba(183,110,121,0.08);font-weight:600;` : '';
        return `<td style="${tdStyleBase}${hlStyle}">${esc(cell)}</td>`;
      }).join('')}</tr>`
    ).join('')}</tbody>`;

    const cap = caption ? `<caption style="caption-side:bottom;font-size:0.75rem;color:var(--text-muted);padding-top:6px;">${esc(caption)}</caption>` : '';

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
      ticks.push(`<line x1="${thermX + 10}" y1="${y}" x2="${thermX + 22}" y2="${y}" stroke="var(--brand-sage)" stroke-width="1.5"/>`);
      ticks.push(`<text x="${thermX + 26}" y="${y + 4}" fill="var(--text-main)" font-size="11">${Math.round(v)}${esc(unit)}</text>`);
    }

    const content = `
      <!-- Thermometer tube -->
      <rect x="${thermX - 8}" y="${topY}" width="16" height="${thermH}" rx="8" fill="white" stroke="var(--brand-sage)" stroke-width="2"/>
      <!-- Mercury fill -->
      <rect x="${thermX - 6}" y="${fillY}" width="12" height="${filledH}" fill="var(--brand-rose)" rx="2"/>
      <!-- Bulb -->
      <circle cx="${thermX}" cy="${bulbY + bulbR - 5}" r="${bulbR}" fill="var(--brand-rose)" stroke="var(--brand-sage)" stroke-width="2"/>
      ${ticks.join('')}
      <!-- Current temp label -->
      <text x="${thermX}" y="${topY - 10}" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="700">${currentTemp}${esc(unit)}</text>
      ${label ? `<text x="${thermX}" y="248" text-anchor="middle" fill="var(--text-muted)" font-size="11">${esc(label)}</text>` : ''}`;
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
        <polygon points="0 0, 9 3.5, 0 7" fill="var(--brand-sage)"/>
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
        pathEl = `<path d="M ${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q ${outX.toFixed(1)},${outY.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}" fill="none" stroke="var(--brand-sage)" stroke-width="2" marker-end="url(#${MID})"/>`;
        labelX = outX; labelY = outY - 6;
      } else if (offset !== 0) {
        // Bidirectional / parallel pair → quadratic Bezier curve to one side
        const midX = (p1.x + p2.x) / 2 + perpX * offset;
        const midY = (p1.y + p2.y) / 2 + perpY * offset;
        pathEl = `<path d="M ${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q ${midX.toFixed(1)},${midY.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}" fill="none" stroke="var(--brand-sage)" stroke-width="2" marker-end="url(#${MID})"/>`;
        // Label at the curve apex, pushed further out so it doesn't sit on the line
        const labelPush = offset > 0 ? 10 : -10;
        labelX = midX + perpX * labelPush;
        labelY = midY + perpY * labelPush + 3;
      } else {
        // Single arrow between this pair → straight line
        pathEl = `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="var(--brand-sage)" stroke-width="2" marker-end="url(#${MID})"/>`;
        labelX = (p1.x + p2.x) / 2;
        labelY = (p1.y + p2.y) / 2 - 8;
      }

      // paint-order halo: label stays readable when it crosses an arrow line
      const lbl = a.label
        ? `<text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" fill="var(--text-muted)" font-size="10" paint-order="stroke" stroke="var(--bg-surface)" stroke-width="3">${esc(a.label)}</text>`
        : '';
      return pathEl + lbl;
    }).join('');
 
    // ── 5. Draw nodes (rendered on top of arrows) ─────────────────────────────
    const nodeEls = positions.map(p => `
      <rect x="${(p.cx - p.w / 2).toFixed(1)}" y="${(p.cy - NODE_H / 2).toFixed(1)}"
            width="${p.w}" height="${NODE_H}" rx="8"
            fill="var(--bg-elevated)" stroke="var(--brand-sage)" stroke-width="1.5"/>
      <text x="${p.cx.toFixed(1)}" y="${(p.cy + 5).toFixed(1)}"
            text-anchor="middle" fill="var(--text-main)" font-size="12" font-weight="600">${esc(p.label)}</text>
    `).join('');
 
    const titleEl = title
      ? `<text x="${(vbW / 2).toFixed(1)}" y="16" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="700">${esc(title)}</text>`
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
      svg += `<text x="${SVG_W / 2}" y="${curY}" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="700">${esc(title)}</text>`;
    }
 
    // ── Changed variable banner ────────────────────────────
    if (variable) {
      curY += 22;
      svg += `<rect x="${PAD}" y="${curY - 4}" width="${SVG_W - PAD * 2}" height="19" rx="4" fill="rgba(183,110,121,0.12)"/>`;
      svg += `<text x="${SVG_W / 2}" y="${curY + 10}" text-anchor="middle" fill="var(--brand-rose)" font-size="11" font-weight="700">Changed variable: ${esc(variable)}</text>`;
    }
    curY += 12;
 
    const panelTopY = curY; // Y where panel content starts
 
    // ── Vertical dividers between panels ──────────────────
    for (let i = 1; i < nSetups; i++) {
      const dx = PAD + i * (panelW + PANEL_GAP) - PANEL_GAP / 2;
      svg += `<line x1="${dx.toFixed(1)}" y1="${panelTopY}" x2="${dx.toFixed(1)}" y2="${SVG_H - 14 - commonH}" stroke="var(--border-light)" stroke-width="1" stroke-dasharray="4,3"/>`;
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
      svg += `<text x="${panelCX.toFixed(1)}" y="${py}" text-anchor="middle" fill="var(--brand-sage)" font-size="12" font-weight="700">${esc(lbl)}</text>`;
 
      // Container silhouette
      py += 10;
      const contBaseY = py + CONT_H;
      svg += this._containerSilhouette(panelCX, contBaseY, containerType);
      py = contBaseY + 12;
 
      // Conditions list
      (s.conditions || []).forEach((cond, ci) => {
        svg += `<text x="${(panelX + 6).toFixed(1)}" y="${(py + ci * LINE_H + 12).toFixed(1)}" fill="var(--text-main)" font-size="11">• ${esc(cond)}</text>`;
      });
 
      // Result label + underline (answer space)
      if (s.result_label) {
        const ry = py + maxConds * LINE_H + 12;
        svg += `<text x="${panelCX.toFixed(1)}" y="${ry}" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-style="italic">${esc(s.result_label)}</text>`;
        svg += `<line x1="${(panelX + 8).toFixed(1)}" y1="${(ry + 5).toFixed(1)}" x2="${(panelX + panelW - 8).toFixed(1)}" y2="${(ry + 5).toFixed(1)}" stroke="var(--border-dark)" stroke-width="1"/>`;
      }
    }
 
    // ── Common conditions footer ───────────────────────────
    if (commonConditions.length) {
      const footerY = SVG_H - 14 - commonH + 14;
      svg += `<line x1="${PAD}" y1="${footerY - 10}" x2="${SVG_W - PAD}" y2="${footerY - 10}" stroke="var(--border-light)" stroke-width="1"/>`;
      svg += `<text x="${SVG_W / 2}" y="${footerY}" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-weight="600">Same conditions in all setups:</text>`;
      commonConditions.forEach((c, i) => {
        svg += `<text x="${SVG_W / 2}" y="${footerY + 14 + i * LINE_H}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${esc(c)}</text>`;
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
        return `<path d="M ${cx - w / 2},${baseY - h} L ${cx - w / 2},${baseY - r} A ${r},${r} 0 0 0 ${cx + w / 2},${baseY - r} L ${cx + w / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage)" stroke-width="2"/>
                <line x1="${cx - w / 2 - 5}" y1="${baseY - h}" x2="${cx + w / 2 + 5}" y2="${baseY - h}" stroke="var(--brand-sage)" stroke-width="2.5"/>`;
      }
      case 'flask': {
        const nw = 20, bw = 66, h = 70, neck = 24;
        return `<path d="M ${cx - nw / 2},${baseY - h} L ${cx - nw / 2},${baseY - neck} L ${cx - bw / 2},${baseY} L ${cx + bw / 2},${baseY} L ${cx + nw / 2},${baseY - neck} L ${cx + nw / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage)" stroke-width="2" stroke-linejoin="round"/>
                <line x1="${cx - nw / 2 - 4}" y1="${baseY - h}" x2="${cx + nw / 2 + 4}" y2="${baseY - h}" stroke="var(--brand-sage)" stroke-width="2.5"/>`;
      }
      case 'box': {
        const w = 74, h = 52;
        return `<rect x="${cx - w / 2}" y="${baseY - h}" width="${w}" height="${h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage)" stroke-width="2" rx="3"/>`;
      }
      default: { // beaker
        const bw = 52, tw = 66, h = 68;
        return `<path d="M ${cx - tw / 2},${baseY - h} L ${cx - bw / 2},${baseY} L ${cx + bw / 2},${baseY} L ${cx + tw / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage)" stroke-width="2" stroke-linejoin="round"/>
                <line x1="${cx - tw / 2 - 5}" y1="${baseY - h}" x2="${cx + tw / 2 + 5}" y2="${baseY - h}" stroke="var(--brand-sage)" stroke-width="2.5"/>`;
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
        svg += `<text x="${SVG_W / 2}" y="${curY}" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="700">${esc(title)}</text>`;
      }
  
      // ── Changed variable banner ────────────────────────────
      if (variable) {
        curY += 22;
        svg += `<rect x="${PAD}" y="${curY - 4}" width="${SVG_W - PAD * 2}" height="19" rx="4" fill="rgba(183,110,121,0.12)"/>`;
        svg += `<text x="${SVG_W / 2}" y="${curY + 10}" text-anchor="middle" fill="var(--brand-rose)" font-size="11" font-weight="700">Changed variable: ${esc(variable)}</text>`;
      }
      curY += 12;
  
      const panelTopY = curY; // Y where panel content starts
  
      // ── Vertical dividers between panels ──────────────────
      for (let i = 1; i < nSetups; i++) {
        const dx = PAD + i * (panelW + PANEL_GAP) - PANEL_GAP / 2;
        svg += `<line x1="${dx.toFixed(1)}" y1="${panelTopY}" x2="${dx.toFixed(1)}" y2="${SVG_H - 14 - commonH}" stroke="var(--border-light)" stroke-width="1" stroke-dasharray="4,3"/>`;
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
        svg += `<text x="${panelCX.toFixed(1)}" y="${py}" text-anchor="middle" fill="var(--brand-sage)" font-size="12" font-weight="700">${esc(lbl)}</text>`;
  
        // Container silhouette
        py += 10;
        const contBaseY = py + CONT_H;
        svg += this._containerSilhouette(panelCX, contBaseY, containerType);
        py = contBaseY + 12;
  
        // Conditions list
        (s.conditions || []).forEach((cond, ci) => {
          svg += `<text x="${(panelX + 6).toFixed(1)}" y="${(py + ci * LINE_H + 12).toFixed(1)}" fill="var(--text-main)" font-size="11">• ${esc(cond)}</text>`;
        });
  
        // Result label + underline (answer space)
        if (s.result_label) {
          const ry = py + maxConds * LINE_H + 12;
          svg += `<text x="${panelCX.toFixed(1)}" y="${ry}" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-style="italic">${esc(s.result_label)}</text>`;
          svg += `<line x1="${(panelX + 8).toFixed(1)}" y1="${(ry + 5).toFixed(1)}" x2="${(panelX + panelW - 8).toFixed(1)}" y2="${(ry + 5).toFixed(1)}" stroke="var(--border-dark)" stroke-width="1"/>`;
        }
      }
  
      // ── Common conditions footer ───────────────────────────
      if (commonConditions.length) {
        const footerY = SVG_H - 14 - commonH + 14;
        svg += `<line x1="${PAD}" y1="${footerY - 10}" x2="${SVG_W - PAD}" y2="${footerY - 10}" stroke="var(--border-light)" stroke-width="1"/>`;
        svg += `<text x="${SVG_W / 2}" y="${footerY}" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-weight="600">Same conditions in all setups:</text>`;
        commonConditions.forEach((c, i) => {
          svg += `<text x="${SVG_W / 2}" y="${footerY + 14 + i * LINE_H}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${esc(c)}</text>`;
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
                    : coreMaterial === 'plastic' ? 'var(--text-muted)'
                    : 'var(--brand-sage)';
      svg += `<rect x="${rodX}" y="${rodY}" width="${rodW}" height="${rodH}" rx="4" fill="${rodFill}" stroke="var(--text-main)" stroke-width="1.5"/>`;
      svg += `<text x="${rodX + rodW / 2}" y="${rodY + rodH + 16}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${esc(coreMaterial)} core</text>`;
 
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
      svg += `<path d="${topPath}" fill="none" stroke="var(--text-main)" stroke-width="2"/>`;
      svg += `<path d="${botPath}" fill="none" stroke="var(--text-main)" stroke-width="2"/>`;
 
      // Battery (left side): long line = +, short line = −
      const batCX = 38, batCY = rodY + rodH / 2;
      const cellSpacing = 14;
      for (let i = 0; i < Math.min(batteryCount, 3); i++) {
        const bx = batCX - (batteryCount - 1) * cellSpacing / 2 + i * cellSpacing;
        svg += `<line x1="${bx}" y1="${batCY - 16}" x2="${bx}" y2="${batCY + 16}" stroke="var(--text-main)" stroke-width="3"/>`;
        if (i < batteryCount - 1) {
          svg += `<line x1="${bx + cellSpacing / 2}" y1="${batCY - 9}" x2="${bx + cellSpacing / 2}" y2="${batCY + 9}" stroke="var(--text-main)" stroke-width="2"/>`;
        }
      }
      svg += `<text x="${batCX - 6}" y="${batCY - 22}" fill="var(--text-main)" font-size="11" font-weight="700" text-anchor="middle">+</text>`;
 
      // Wires connecting battery to coil (top and bottom)
      svg += `<polyline points="${batCX},${batCY - 16} ${batCX},${rodY - arcH - 6} ${coilX1},${rodY}" fill="none" stroke="var(--text-main)" stroke-width="1.5"/>`;
      svg += `<polyline points="${batCX},${batCY + 16} ${batCX},${rodY + rodH + arcH + 6} ${coilX1},${rodY + rodH}" fill="none" stroke="var(--text-main)" stroke-width="1.5"/>`;
 
      // Closing wire on right side
      svg += `<polyline points="${coilX2},${rodY} ${coilX2 + 20},${rodY - arcH - 6} ${coilX2 + 20},${rodY + rodH + arcH + 6} ${coilX2},${rodY + rodH}" fill="none" stroke="var(--text-main)" stroke-width="1.5"/>`;
 
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
      svg += `<path d="${bodyPath}" fill="var(--brand-sage)" stroke="var(--text-main)" stroke-width="2" stroke-linejoin="round"/>`;
 
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
        const iClr  = interaction === 'repulsion' ? 'var(--brand-rose)' : 'var(--brand-sage)';
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
      svg += `<text x="${vbW / 2}" y="${vbH - 5}" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-style="italic">${esc(label)}</text>`;
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
      <rect x="${x}"      y="${y}" width="${hw}" height="${h}" fill="${pClr(p0)}" rx="6" stroke="var(--text-main)" stroke-width="1.5"/>
      <rect x="${x + hw}" y="${y}" width="${hw}" height="${h}" fill="${pClr(p1)}" rx="6" stroke="var(--text-main)" stroke-width="1.5"/>
      <line x1="${x + hw}" y1="${y}" x2="${x + hw}" y2="${y + h}" stroke="var(--text-main)" stroke-width="1.5"/>
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
        return `<path d="M ${cx - w / 2},${baseY - h} L ${cx - w / 2},${baseY - r} A ${r},${r} 0 0 0 ${cx + w / 2},${baseY - r} L ${cx + w / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage)" stroke-width="2"/>
                <line x1="${cx - w / 2 - 5}" y1="${baseY - h}" x2="${cx + w / 2 + 5}" y2="${baseY - h}" stroke="var(--brand-sage)" stroke-width="2.5"/>`;
      }
      case 'flask': {
        const nw = 20, bw = 66, h = 70, neck = 24;
        return `<path d="M ${cx - nw / 2},${baseY - h} L ${cx - nw / 2},${baseY - neck} L ${cx - bw / 2},${baseY} L ${cx + bw / 2},${baseY} L ${cx + nw / 2},${baseY - neck} L ${cx + nw / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage)" stroke-width="2" stroke-linejoin="round"/>
                <line x1="${cx - nw / 2 - 4}" y1="${baseY - h}" x2="${cx + nw / 2 + 4}" y2="${baseY - h}" stroke="var(--brand-sage)" stroke-width="2.5"/>`;
      }
      case 'box': {
        const w = 74, h = 52;
        return `<rect x="${cx - w / 2}" y="${baseY - h}" width="${w}" height="${h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage)" stroke-width="2" rx="3"/>`;
      }
      default: { // beaker
        const bw = 52, tw = 66, h = 68;
        return `<path d="M ${cx - tw / 2},${baseY - h} L ${cx - bw / 2},${baseY} L ${cx + bw / 2},${baseY} L ${cx + tw / 2},${baseY - h}" fill="rgba(240,244,243,0.8)" stroke="var(--brand-sage)" stroke-width="2" stroke-linejoin="round"/>
                <line x1="${cx - tw / 2 - 5}" y1="${baseY - h}" x2="${cx + tw / 2 + 5}" y2="${baseY - h}" stroke="var(--brand-sage)" stroke-width="2.5"/>`;
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
    svg += `<polygon points="${bx},${baseY} ${apex.x.toFixed(1)},${apex.y.toFixed(1)} ${apex.x.toFixed(1)},${baseY}" fill="var(--bg-elevated)" stroke="var(--brand-sage)" stroke-width="2.5"/>`;
 
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
      svg += `<polyline points="${pts.trim()}" fill="none" stroke="var(--brand-sage)" stroke-width="1.5" opacity="0.65"/>`;
 
    } else if (surfaceTexture === 'sandpaper') {
      // Dense short tick marks perpendicular to the slope
      for (let i = 1; i < steps; i++) {
        const t  = i / steps;
        const px = bx + t * rampBase;
        const py = baseY - t * rampH;
        svg += `<line x1="${(px + nx * 2).toFixed(1)}" y1="${(py + ny * 2).toFixed(1)}" x2="${(px + nx * 9).toFixed(1)}" y2="${(py + ny * 9).toFixed(1)}" stroke="var(--text-muted)" stroke-width="1.5" opacity="0.55"/>`;
      }
 
    } else if (surfaceTexture === 'glass') {
      // Bright dashed line along slope edge + two sparkle dots
      svg += `<line x1="${bx}" y1="${baseY}" x2="${apex.x.toFixed(1)}" y2="${apex.y.toFixed(1)}" stroke="white" stroke-width="3" stroke-dasharray="10,6" opacity="0.8"/>`;
      const gx = bx + rampBase * 0.35, gy = baseY - rampH * 0.35;
      svg += `<circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="3" fill="white" opacity="0.9"/>`;
    }
    // smooth: no extra texture — just the outline
 
    // ── Ground line + hatching ────────────────────────────
    svg += `<line x1="${bx - 22}" y1="${baseY}" x2="${apex.x + 28}" y2="${baseY}" stroke="var(--brand-sage)" stroke-width="2"/>`;
    for (let i = 0; i < 14; i++) {
      const gx = bx - 22 + i * 16;
      svg += `<line x1="${gx}" y1="${baseY}" x2="${gx - 7}" y2="${baseY + 9}" stroke="var(--brand-sage)" stroke-width="1" opacity="0.45"/>`;
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
            fill="var(--brand-rose)" fill-opacity="0.72" stroke="var(--brand-rose)" stroke-width="1.5"/>`;
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
      svg += `<path d="M ${bx + arcR},${baseY} A ${arcR},${arcR} 0 0,0 ${arcEnd.x.toFixed(1)},${arcEnd.y.toFixed(1)}" fill="none" stroke="var(--brand-sage)" stroke-width="1.5"/>`;
      const midAngle = θ / 2;
      const lblR = arcR + 15;
      svg += `<text x="${(bx + lblR * Math.cos(midAngle)).toFixed(1)}" y="${(baseY - lblR * Math.sin(midAngle)).toFixed(1)}" text-anchor="middle" fill="var(--brand-sage)" font-size="11" font-weight="600">${rampAngle}°</text>`;
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
      svg += `<path d="${spPath}" fill="none" stroke="var(--brand-sage)" stroke-width="2"/>`;
    }
 
    // ── Caption ───────────────────────────────────────────
    if (label) {
      svg += `<text x="${vbW / 2}" y="${vbH - 5}" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-style="italic">${esc(label)}</text>`;
    }
 
    return this._svg(svg, {
      viewBox: `0 0 ${vbW} ${vbH}`,
      alt: `Inclined plane experiment: ${rampAngle}° angle, ${surfaceTexture} surface${blockLabel ? ', ' + blockLabel + ' block' : ''}.`,
      maxWidth: 500,
    });
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
      `<text x="200" y="${midY + (i - (lines.length - 1) / 2) * 18}" text-anchor="middle" fill="var(--text-muted)" font-size="12">${esc(l)}</text>`
    ).join('');

    const strokeDash = borderStyle === 'dashed' ? 'stroke-dasharray="8,4"' : '';
    const content = `
      <rect x="20" y="20" width="360" height="220" rx="8" fill="var(--bg-elevated)" stroke="var(--border-dark)" stroke-width="2" ${strokeDash}/>
      <text x="200" y="60" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-style="italic">[Diagram]</text>
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
      fill="rgba(240,244,243,0.55)" stroke="var(--brand-sage)" stroke-width="2"/>`;

    // ── Flat baseline (the diameter) ──────────────────────────────────────────
    const flatBase = `<line x1="${arcEnd.x}" y1="${cy}" x2="${arcStart.x}" y2="${cy}" stroke="var(--brand-sage)" stroke-width="2.5"/>`;

    // ── Tick marks + scale labels ──────────────────────────────────────────────
    let ticks = '', outerLbls = '', innerLbls = '';
    for (let deg = 0; deg <= 180; deg += 10) {
      const isMajor  = deg % 30 === 0;
      const isHalf   = deg % 10 === 0 && !isMajor;
      const outerPt  = toXY(deg, R);
      const innerPt  = toXY(deg, R - (isMajor ? 20 : isHalf ? 12 : 8));
      ticks += `<line x1="${outerPt.x.toFixed(1)}" y1="${outerPt.y.toFixed(1)}"
                      x2="${innerPt.x.toFixed(1)}" y2="${innerPt.y.toFixed(1)}"
                      stroke="var(--text-main)" stroke-width="${isMajor ? 2 : 1}"/>`;

      if (isMajor) {
        if (show_outer_scale) {
          const lPt   = toXY(deg, R + 17);
          const anchor = deg < 75 ? 'start' : deg > 105 ? 'end' : 'middle';
          outerLbls  += `<text x="${lPt.x.toFixed(1)}" y="${(lPt.y + 4).toFixed(1)}"
            text-anchor="${anchor}" fill="var(--text-main)" font-size="11" font-weight="600">${deg}</text>`;
        }
        if (show_inner_scale) {
          const inner_deg = 180 - deg;
          const ilPt  = toXY(deg, R - 27);
          const anchor = deg < 75 ? 'start' : deg > 105 ? 'end' : 'middle';
          innerLbls  += `<text x="${ilPt.x.toFixed(1)}" y="${(ilPt.y + 4).toFixed(1)}"
            text-anchor="${anchor}" fill="var(--text-muted)" font-size="9">${inner_deg}</text>`;
        }
      }
    }

    // ── Baseline arm (where the measurement starts; visible when offset ≠ 0) ──
    const baseArmPt   = toXY(baseline_offset, R - 4);
    const baseArm     = baseline_offset !== 0
      ? `<line x1="${cx}" y1="${cy}" x2="${baseArmPt.x.toFixed(1)}" y2="${baseArmPt.y.toFixed(1)}"
          stroke="var(--brand-sage)" stroke-width="2.5" stroke-dasharray="6,3"/>`
      : '';

    // ── Pointer arm (at the measured angle) ───────────────────────────────────
    const pointerDeg  = baseline_offset + angle_to_measure;
    const pointerPt   = toXY(pointerDeg, R - 4);
    const pointer     = `<line x1="${cx}" y1="${cy}" x2="${pointerPt.x.toFixed(1)}" y2="${pointerPt.y.toFixed(1)}"
      stroke="var(--brand-rose)" stroke-width="2.5"/>`;

    // ── Arc indicator (shows the angle sector) ────────────────────────────────
    const arcR        = 48;
    const arcS        = toXY(baseline_offset, arcR);
    const arcE        = toXY(pointerDeg, arcR);
    const largeFlag   = angle_to_measure > 180 ? 1 : 0;
    // sweep-flag=0: counterclockwise in SVG = increasing protractor degrees (upward)
    const angArc      = `<path d="M ${arcS.x.toFixed(1)},${arcS.y.toFixed(1)} A ${arcR},${arcR} 0 ${largeFlag},0 ${arcE.x.toFixed(1)},${arcE.y.toFixed(1)}"
      fill="none" stroke="var(--brand-rose)" stroke-width="2"/>`;

    // ── Angle label in the arc sector ─────────────────────────────────────────
    const midDeg      = baseline_offset + angle_to_measure / 2;
    const midPt       = toXY(midDeg, 68);
    const pLabel      = `<text x="${midPt.x.toFixed(1)}" y="${(midPt.y + 5).toFixed(1)}"
      text-anchor="middle" fill="var(--brand-rose)" font-size="14" font-weight="700">${esc(pointer_label)}</text>`;

    // ── Centre dot ────────────────────────────────────────────────────────────
    const dot         = `<circle cx="${cx}" cy="${cy}" r="4" fill="var(--brand-sage)"/>`;

    // ── Optional diagram title ─────────────────────────────────────────────────
    const titleEl     = label
      ? `<text x="${cx}" y="18" text-anchor="middle" fill="var(--text-main)" font-size="12" font-weight="600">${esc(label)}</text>`
      : '';

    // ── Non-zero baseline note ─────────────────────────────────────────────────
    const noteEl      = baseline_offset !== 0
      ? `<text x="${cx}" y="256" text-anchor="middle" fill="var(--text-muted)" font-size="9" font-style="italic">Baseline does not start at 0°</text>`
      : '';

    const content = `${titleEl}${arc}${flatBase}${ticks}${outerLbls}${innerLbls}${baseArm}${pointer}${angArc}${pLabel}${dot}${noteEl}`;

    return this._svg(content, {
      viewBox: '0 0 400 265',
      alt: `Protractor showing ${angle_to_measure}° angle${baseline_offset ? ', baseline at ' + baseline_offset + '°' : ''}.`,
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