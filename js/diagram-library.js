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

  _esc(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
  circuitDiagram(data) {
    if (!data || !data.components) return '';
    let svg = `<rect width="100%" height="100%" fill="var(--glass-bg, rgba(255,255,255,0.7))" rx="8" stroke="var(--border-light)" />`;

    if (data.title) {
      svg += `<text x="200" y="30" text-anchor="middle" fill="var(--text-main)" font-size="14" font-weight="bold">${this._esc(data.title)}</text>`;
    }

    // Base wire loop for a standard series circuit
    svg += `<path d="M 100 80 L 300 80 L 300 180 L 100 180 Z" fill="none" stroke="var(--brand-sage)" stroke-width="2" />`;

    data.components.forEach(comp => {
      if (comp.type === 'battery') {
        svg += `<line x1="190" y1="80" x2="210" y2="80" stroke="var(--glass-bg, rgba(255,255,255,0.7))" stroke-width="6"/>`; // Breaks the wire
        svg += `<line x1="195" y1="70" x2="195" y2="90" stroke="var(--text-main)" stroke-width="2"/>`; // Short negative
        svg += `<line x1="205" y1="65" x2="205" y2="95" stroke="var(--text-main)" stroke-width="2"/>`; // Long positive
      } else if (comp.type === 'bulb') {
        const cy = comp.position === 'bottom' ? 180 : 130;
        const cx = comp.position === 'right' ? 300 : 200;
        const stroke = comp.fused ? 'var(--brand-rose)' : 'var(--brand-sage)';

        svg += `<circle cx="${cx}" cy="${cy}" r="15" fill="var(--glass-bg, rgba(255,255,255,0.7))" stroke="${stroke}" stroke-width="2"/>`;
        svg += `<path d="M ${cx - 10} ${cy - 10} L ${cx + 10} ${cy + 10} M ${cx - 10} ${cy + 10} L ${cx + 10} ${cy - 10}" stroke="${stroke}" stroke-width="2"/>`; // MOE cross symbol
      } else if (comp.type === 'switch') {
        svg += `<line x1="90" y1="130" x2="110" y2="130" stroke="var(--glass-bg, rgba(255,255,255,0.7))" stroke-width="6"/>`; // Breaks the wire
        svg += `<circle cx="95" cy="130" r="3" fill="var(--text-main)"/>`;
        svg += `<circle cx="105" cy="130" r="3" fill="var(--text-main)"/>`;

        if (comp.isOpen) {
          svg += `<line x1="95" y1="130" x2="105" y2="120" stroke="var(--text-main)" stroke-width="2"/>`;
        } else {
          svg += `<line x1="95" y1="130" x2="105" y2="130" stroke="var(--text-main)" stroke-width="2"/>`;
        }
      }
    });
    return this._svg(svg, { viewBox: '0 0 400 220' });
  },

  // 🚀 Centralized Router (With Backward-Compatible Fallback)
  render(payload) {
    if (payload.unitModel) return this.unitModel(payload.unitModel);
    if (payload.circuitDiagram) return this.circuitDiagram(payload.circuitDiagram);
    if (!payload || !payload.function_name) return '';
    const fn = this[payload.function_name];

    // 1. If the specific engine exists, use it
    if (typeof fn === 'function') {
      return fn.call(this, payload.params || {});
    }

    // 2. Backward Compatibility: If it's a legacy or hallucinated function, 
    // route it safely to the genericExperiment fallback!
    if (typeof this.genericExperiment === 'function') {
      return this.genericExperiment(payload.params || {}, payload.function_name);
    }

    return `<div class="text-amber border border-amber p-4 rounded text-center text-sm">Diagram engine cannot render: "${this._esc(payload.function_name)}"</div>`;
  },

  /**
   * 📈 MOE Line Graph Engine (Hardened & Scaled)
   */
  lineGraph(params) {
    let p = params;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } }

    const title = p.title || '';
    const xLabel = p.xLabel || '';
    const yLabel = p.yLabel || '';
    const yMax = Number(p.yMax) || 100;

    // Deep parse array to prevent stringified traps
    let rawPoints = p.points;
    if (typeof rawPoints === 'string') { try { rawPoints = JSON.parse(rawPoints); } catch (e) { rawPoints = []; } }
    const points = Array.isArray(rawPoints) ? rawPoints : [];

    const width = 420, height = 260;
    const padL = 55, padR = 25, padT = 35, padB = 45;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // max-width prevents flexbox blowout
    let svg = `<svg viewBox="0 0 ${width} ${height}" style="width: 100%; max-width: 420px; height: auto; display: block; margin: 0 auto 1.5rem auto; background: var(--bg-surface); border-radius: 8px; border: 1px solid var(--border-light);" role="img" aria-label="Line Graph">
      <text x="${width / 2}" y="22" text-anchor="middle" font-weight="bold" font-size="14" fill="var(--text-main)" font-family="sans-serif">${this._esc(title)}</text>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${height - padB}" stroke="var(--border-dark)" stroke-width="2"/>
      <text x="${padL - 35}" y="${padT + plotH / 2}" transform="rotate(-90 ${padL - 35} ${padT + plotH / 2})" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--text-main)" font-family="sans-serif">${this._esc(yLabel)}</text>
      <line x1="${padL}" y1="${height - padB}" x2="${width - padR}" y2="${height - padB}" stroke="var(--border-dark)" stroke-width="2"/>
      <text x="${padL + plotW / 2}" y="${height - 12}" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--text-main)" font-family="sans-serif">${this._esc(xLabel)}</text>
    `;

    if (points.length > 0) {
      const stepX = plotW / points.length;
      const coords = points.map((pt, i) => {
        // Absolute fail-safe math: forces Number() and provides default fallbacks
        const cx = Number(padL + (stepX * i) + (stepX / 2)) || padL;
        const safeY = Number(pt.yVal) || 0;
        const cy = Number((height - padB) - ((safeY / yMax) * plotH)) || (height - padB);
        return { cx, cy, label: pt.xText || '', val: safeY };
      });

      const pathD = `M ${coords.map(c => `${c.cx},${c.cy}`).join(' L ')}`;
      svg += `<path d="${pathD}" fill="none" stroke="var(--brand-rose)" stroke-width="3" stroke-linejoin="round"/>`;

      coords.forEach(c => {
        svg += `
          <circle cx="${c.cx}" cy="${c.cy}" r="4" fill="var(--brand-sage)" stroke="#fff" stroke-width="2"/>
          <text x="${c.cx}" y="${height - padB + 18}" text-anchor="middle" font-size="11" fill="var(--text-muted)" font-family="sans-serif">${this._esc(c.label)}</text>
          <text x="${padL - 8}" y="${c.cy + 4}" text-anchor="end" font-size="11" fill="var(--text-muted)" font-family="sans-serif">${c.val}</text>
          <line x1="${padL - 4}" y1="${c.cy}" x2="${padL}" y2="${c.cy}" stroke="var(--border-dark)" stroke-width="1"/>
        `;
      });
    }
    return svg + `</svg>`;
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
    const labelTop = `<text x="${rectX + rectW / 2}" y="${rectY - 8}" text-anchor="middle" fill="var(--text-main)" font-size="14" font-weight="bold">${params.labels || w_cm + 'cm'}</text>`;
    const labelSide = `<text x="${rectX - 8}" y="${rectY + rectH / 2}" text-anchor="end" alignment-baseline="middle" fill="var(--text-main)" font-size="14" font-weight="bold">${l_cm + 'cm'}</text>`;

    const content = `
      <svg width="100%" style="height: auto;" viewBox="0 0 ${gridW} ${gridH}" style="max-width: 500px;">
        ${gridLines}
        ${rectSvg}
        ${labelTop}
        ${labelSide}
      </svg>
    `;
    return content;
  },

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
    return `<svg role="img" aria-label="${alt}" width="100%" style="height: auto;" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" style="max-width:${maxWidth}px;font-family:'Plus Jakarta Sans',sans-serif;display:block;">${content}</svg>`;
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
