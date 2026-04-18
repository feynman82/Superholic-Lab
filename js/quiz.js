function renderVisualPayload(visual_payload) {
    if (!visual_payload) return '';

    if (visual_payload.engine === 'diagram-library') {
      try {
        if (typeof DiagramLibrary.render === 'function') {
          return `<div class="procedural-diagram mb-2 flex justify-center w-full" style="max-width: 100%; overflow-x: auto;">
                    ${DiagramLibrary.render(visual_payload)}
                  </div>`;
        }
      } catch (err) {
        console.error("[DiagramLibrary] Rendering crashed:", err);
      }
    }
    
    // Future handling for mermaid engine
    if (visual_payload.engine === 'mermaid') {
       return `<div class="mermaid-diagram mb-4 p-4 bg-page border border-light rounded">${esc(visual_payload.params.code || '')}</div>`;
    }

    return '';
  }