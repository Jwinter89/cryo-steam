/**
 * Debug Overlay — Toggle with F2
 *
 * Shows:
 * - Crosshair following mouse with live X/Y coordinates (px and % of window)
 * - Click any element to copy its selector, position, and dimensions to clipboard
 * - Info panel in top-right showing hovered element details
 *
 * Only loaded in dev mode (not packaged builds).
 */
(function() {
  'use strict';

  let active = false;
  let overlay, crosshairH, crosshairV, coordLabel, infoPanel;

  function createOverlay() {
    // Main overlay (transparent, captures mouse but passes clicks through when inactive)
    overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;display:none;';

    // Horizontal crosshair line
    crosshairH = document.createElement('div');
    crosshairH.style.cssText = 'position:fixed;left:0;right:0;height:1px;background:rgba(74,155,217,0.6);pointer-events:none;z-index:99999;';
    overlay.appendChild(crosshairH);

    // Vertical crosshair line
    crosshairV = document.createElement('div');
    crosshairV.style.cssText = 'position:fixed;top:0;bottom:0;width:1px;background:rgba(74,155,217,0.6);pointer-events:none;z-index:99999;';
    overlay.appendChild(crosshairV);

    // Coordinate label near cursor
    coordLabel = document.createElement('div');
    coordLabel.style.cssText = 'position:fixed;background:rgba(0,0,0,0.85);color:#4A9BD9;font-family:Courier New,monospace;font-size:11px;padding:4px 8px;pointer-events:none;z-index:99999;white-space:nowrap;border:1px solid #333;';
    overlay.appendChild(coordLabel);

    // Info panel — top right
    infoPanel = document.createElement('div');
    infoPanel.style.cssText = 'position:fixed;top:8px;right:8px;background:rgba(0,0,0,0.9);color:#ccc;font-family:Courier New,monospace;font-size:10px;padding:10px 14px;pointer-events:none;z-index:99999;border:1px solid #4A9BD9;max-width:400px;line-height:1.5;';
    overlay.appendChild(infoPanel);

    document.body.appendChild(overlay);
  }

  function getSelector(el) {
    if (el.id) return '#' + el.id;
    let sel = el.tagName.toLowerCase();
    if (el.className && typeof el.className === 'string') {
      sel += '.' + el.className.trim().split(/\s+/).join('.');
    }
    return sel;
  }

  function getFullPath(el) {
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body) {
      parts.unshift(getSelector(cur));
      cur = cur.parentElement;
    }
    return parts.slice(-3).join(' > ');
  }

  function onMouseMove(e) {
    if (!active) return;

    const x = e.clientX;
    const y = e.clientY;
    const pctX = ((x / window.innerWidth) * 100).toFixed(1);
    const pctY = ((y / window.innerHeight) * 100).toFixed(1);

    crosshairH.style.top = y + 'px';
    crosshairV.style.left = x + 'px';

    // Position label offset from cursor
    const labelX = x + 14;
    const labelY = y + 14;
    coordLabel.style.left = labelX + 'px';
    coordLabel.style.top = labelY + 'px';
    coordLabel.textContent = x + ', ' + y + 'px  (' + pctX + '%, ' + pctY + '%)';

    // Get element under cursor (temporarily hide overlay to get real element)
    overlay.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    overlay.style.display = 'block';

    if (el) {
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      infoPanel.innerHTML =
        '<span style="color:#4A9BD9">' + getFullPath(el) + '</span>\n' +
        '<br>pos: ' + Math.round(rect.left) + ', ' + Math.round(rect.top) +
        '  size: ' + Math.round(rect.width) + 'x' + Math.round(rect.height) +
        '<br>padding: ' + computed.padding +
        '<br>margin: ' + computed.margin +
        '<br><span style="color:#666">Click to copy to clipboard</span>';
    }
  }

  function onClick(e) {
    if (!active) return;

    // Get element under cursor
    overlay.style.display = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.display = 'block';

    if (!el) return;

    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);
    const pctX = ((e.clientX / window.innerWidth) * 100).toFixed(1);
    const pctY = ((e.clientY / window.innerHeight) * 100).toFixed(1);

    const info = [
      'ELEMENT: ' + getFullPath(el),
      'SELECTOR: ' + getSelector(el),
      'CLICK AT: ' + e.clientX + ', ' + e.clientY + 'px (' + pctX + '%, ' + pctY + '%)',
      'ELEMENT POS: left=' + Math.round(rect.left) + ' top=' + Math.round(rect.top) + ' right=' + Math.round(rect.right) + ' bottom=' + Math.round(rect.bottom),
      'SIZE: ' + Math.round(rect.width) + 'x' + Math.round(rect.height),
      'PADDING: ' + computed.padding,
      'MARGIN: ' + computed.margin,
      'WINDOW: ' + window.innerWidth + 'x' + window.innerHeight,
    ].join('\n');

    navigator.clipboard.writeText(info).then(() => {
      coordLabel.textContent = 'COPIED TO CLIPBOARD';
      coordLabel.style.color = '#4CAF50';
      setTimeout(() => { coordLabel.style.color = '#4A9BD9'; }, 800);
    });

    console.log('%c[Debug Overlay] Element Info:', 'color: #4A9BD9; font-weight: bold');
    console.log(info);
  }

  function toggle() {
    active = !active;
    if (active) {
      if (!overlay) createOverlay();
      overlay.style.display = 'block';
      document.body.style.cursor = 'crosshair';
      console.log('%c[Debug Overlay] ON — move mouse for coordinates, click to copy element info', 'color: #4CAF50');
    } else {
      if (overlay) overlay.style.display = 'none';
      document.body.style.cursor = '';
      console.log('%c[Debug Overlay] OFF', 'color: #E04040');
    }
  }

  document.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('click', function(e) {
    if (active) {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }
  }, true);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'F2') {
      e.preventDefault();
      toggle();
    }
  });

  console.log('%c[Debug Overlay] Ready — Press F2 to toggle', 'color: #4A9BD9; font-weight: bold');
})();
