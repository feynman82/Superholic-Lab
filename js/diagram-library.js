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

  // ── HELPERS ────────────────────────────────────────────────────────────────
drawRectangleOnGrid(params) {
    const w_cm = parseFloat(params.width_cm) || 10;
    const l_cm = parseFloat(params.length_cm) || 5;
    const unit = parseFloat(params.unit_grid_cm) || 1;

    // Calculate how many grid squares are needed
    const w_units = w_cm / unit;
    const h_units = l_cm / unit;

    const cellSize = 30; // 30 pixels per grid square
    const gridW = (w_units + 2) * cellSize; // Add padding
    const gridH = (h_units + 2) * cellSize; // Add padding

    // Draw grid background
    let gridLines = '';
    for (let x = 0; x <= gridW; x += cellSize) {
      gridLines += `<line x1="${x}" y1="0" x2="${x}" y2="${gridH}" stroke="var(--border-light)" stroke-width="1"/>`;
    }
    for (let y = 0; y <= gridH; y += cellSize) {
      gridLines += `<line x1="0" y1="${y}" x2="${gridW}" y2="${y}" stroke="var(--border-light)" stroke-width="1"/>`;
    }

    // Draw the actual rectangle
    const rectX = cellSize;
    const rectY = cellSize;
    const rectW = w_units * cellSize;
    const rectH = h_units * cellSize;
    const rectSvg = `<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" fill="rgba(183, 110, 121, 0.1)" stroke="var(--brand-sage)" stroke-width="3"/>`;

    // Draw Labels
    const labelTop = `<text x="${rectX + rectW/2}" y="${rectY - 8}" text-anchor="middle" fill="var(--text-main)" font-size="14" font-weight="bold">${params.labels || w_cm + 'cm'}</text>`;
    const labelSide = `<text x="${rectX - 8}" y="${rectY + rectH/2}" text-anchor="end" alignment-baseline="middle" fill="var(--text-main)" font-size="14" font-weight="bold">${l_cm + 'cm'}</text>`;

    const content = `
      <svg width="100%" height="auto" viewBox="0 0 ${gridW} ${gridH}" style="max-width: 500px;">
        ${gridLines}
        ${rectSvg}
        ${labelTop}
        ${labelSide}
      </svg>
    `;
    return content;
  },
  
  /**
   * Returns an SVG wrapper string with standard attributes.
   * @param {string} content - SVG elements to place inside
   * @param {object} opts
   * @returns {string}
   */
  _svg(content, { viewBox = '0 0 400 260', alt = 'Diagram', maxWidth = 400 } = {}) {
    return `<svg role="img" aria-label="${alt}" width="100%" height="auto" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" style="max-width:${maxWidth}px;font-family:'Plus Jakarta Sans',sans-serif;display:block;">${content}</svg>`;
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
      try { params = JSON.parse(params); } catch(e) {}
    }

    // 3. Security & Validation: Check if function exists or is missing
    if (!fnName || typeof fnName !== 'string' || typeof this[fnName] !== 'function' || fnName.startsWith('_') || fnName === 'render') {
      const missingName = fnName || 'UnknownFunction';
      console.warn(`[DiagramLibrary] To-Do: Missing or invalid function ${missingName}`);
      
      // Extract the keys the AI generated so the developer knows what params to code
      const paramKeys = params && Object.keys(params).length > 0 
        ? Object.keys(params).join(', ') 
        : 'no params';

      // Render the Developer Build Loop placeholder
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
  barChart({
    title = '',
    xLabel = '',
    yLabel = '',
    bars = [],
    maxY = null,
    showValues = false,
  } = {}) {
    const esc = this._esc.bind(this);
    if (!bars.length) return this.placeholder({ description: 'Bar chart (no data)' });

    const chartX = 55, chartY = 30, chartW = 310, chartH = 160;
    const autoMax = maxY || Math.ceil(Math.max(...bars.map(b => b.value)) * 1.2) || 10;
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
  lineGraph({
    title = '',
    xLabel = '',
    yLabel = '',
    points = [],
    xTicks = [],
    yTicks = [],
  } = {}) {
    const esc = this._esc.bind(this);
    if (!points.length) return this.placeholder({ description: 'Line graph (no data)' });

    const chartX = 55, chartY = 30, chartW = 310, chartH = 160;
    const xVals = points.map(p => p.x);
    const yVals = points.map(p => p.y);
    const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
    const yMin = 0, yMax = Math.ceil(Math.max(...yVals) * 1.2) || 10;

    const toSX = (v) => chartX + ((v - xMin) / (xMax - xMin || 1)) * chartW;
    const toSY = (v) => chartY + chartH - ((v - yMin) / (yMax - yMin || 1)) * chartH;

    // Grid lines from yTicks or auto
    const yTicksArr = yTicks.length ? yTicks : [0, Math.round(yMax / 2), yMax];
    const gridLines = yTicksArr.map(v => {
      const y = toSY(v);
      return `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="var(--border-light)" stroke-width="1"/>
              <text x="${chartX - 6}" y="${y + 4}" text-anchor="end" fill="var(--text-muted)" font-size="10">${v}</text>`;
    }).join('');

    // X axis labels
    const xTicksArr = xTicks.length ? xTicks : xVals;
    const xLabels = xTicksArr.map(v => {
      const x = toSX(v);
      return `<text x="${x}" y="${chartY + chartH + 16}" text-anchor="middle" fill="var(--text-main)" font-size="10">${v}</text>`;
    }).join('');

    // Line path
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSX(p.x)} ${toSY(p.y)}`).join(' ');
    const dots = points.map(p =>
      `<circle cx="${toSX(p.x)}" cy="${toSY(p.y)}" r="4" fill="var(--brand-rose)" stroke="white" stroke-width="1.5"/>`
    ).join('');

    const axes = `<line x1="${chartX}" y1="${chartY}" x2="${chartX}" y2="${chartY + chartH}" stroke="var(--brand-sage)" stroke-width="2"/>
                  <line x1="${chartX}" y1="${chartY + chartH}" x2="${chartX + chartW}" y2="${chartY + chartH}" stroke="var(--brand-sage)" stroke-width="2"/>`;

    const titleEl = title ? `<text x="200" y="18" text-anchor="middle" fill="var(--text-main)" font-size="13" font-weight="700">${esc(title)}</text>` : '';
    const xLblEl = xLabel ? `<text x="${chartX + chartW / 2}" y="255" text-anchor="middle" fill="var(--text-muted)" font-size="11">${esc(xLabel)}</text>` : '';
    const yLblEl = yLabel ? `<text x="14" y="${chartY + chartH / 2}" text-anchor="middle" fill="var(--text-muted)" font-size="11" transform="rotate(-90,14,${chartY + chartH / 2})">${esc(yLabel)}</text>` : '';

    const content = `${titleEl}${yLblEl}${gridLines}${axes}${xLabels}<path d="${pathD}" fill="none" stroke="var(--brand-rose)" stroke-width="2.5" stroke-linejoin="round"/>${dots}${xLblEl}`;
    return this._svg(content, { alt: `Line graph${title ? ': ' + title : ''}. ${points.length} data points.` });
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
  arrowDiagram({ nodes = [], arrows = [], layout = 'horizontal' } = {}) {
    const esc = this._esc.bind(this);
    if (!nodes.length) return this.placeholder({ description: 'Arrow diagram (no nodes)' });

    // Auto-position nodes if x/y not provided
    const positioned = nodes.map((n, i) => {
      if (n.x !== undefined && n.y !== undefined) return n;
      const total = nodes.length;
      if (layout === 'horizontal') {
        return { ...n, x: 15 + (70 / (total - 1 || 1)) * i, y: 50 };
      }
      return { ...n, x: 50, y: 10 + (80 / (total - 1 || 1)) * i };
    });

    // Convert % to viewBox px
    const toPx = (pct, dim) => (pct / 100) * dim;
    const vbW = 400, vbH = 260;

    const nodeMap = {};
    positioned.forEach(n => { nodeMap[n.id] = n; });

    // Draw nodes as rounded rectangles
    const nodeEls = positioned.map(n => {
      const cx = toPx(n.x, vbW), cy = toPx(n.y, vbH);
      return `<rect x="${cx - 45}" y="${cy - 18}" width="90" height="36" rx="8" fill="var(--bg-elevated)" stroke="var(--brand-sage)" stroke-width="1.5"/>
              <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="var(--text-main)" font-size="12" font-weight="600">${esc(n.label)}</text>`;
    }).join('');

    // Draw arrows
    const arrowEls = arrows.map(a => {
      const from = nodeMap[a.from], to = nodeMap[a.to];
      if (!from || !to) return '';
      const x1 = toPx(from.x, vbW) + 45, y1 = toPx(from.y, vbH);
      const x2 = toPx(to.x, vbW) - 45, y2 = toPx(to.y, vbH);
      const lbl = a.label
        ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${esc(a.label)}</text>`
        : '';
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--brand-sage)" stroke-width="2" marker-end="url(#arrowHead)"/>
              ${lbl}`;
    }).join('');

    const defs = `<defs><marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 L2,4 Z" fill="var(--brand-sage)"/></marker></defs>`;

    const content = `${defs}${arrowEls}${nodeEls}`;
    return this._svg(content, { alt: `Flow diagram with ${nodes.length} node(s): ${nodes.map(n => n.label).join(' → ')}.` });
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
