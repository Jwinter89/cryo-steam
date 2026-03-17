/**
 * TrendManager — Draws mini sparkline trends in gauge rows.
 * Rate-of-change is the mechanic; the UI must show it.
 */

class TrendManager {
  constructor(sim) {
    this.sim = sim;
    // Sparklines are drawn on the faceplate trend canvas
    // This manager handles any additional trend displays if needed
  }

  /**
   * Draw a sparkline on a canvas element
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w - Width
   * @param {number} h - Height
   * @param {number[]} data - Array of values
   * @param {number} min - Range min
   * @param {number} max - Range max
   * @param {string} color - Line color
   */
  static drawSparkline(ctx, w, h, data, min, max, color) {
    if (!data || data.length < 2) return;

    ctx.clearRect(0, 0, w, h);

    const range = max - min || 1;
    ctx.strokeStyle = color || '#E8E8E8';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((data[i] - min) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

window.TrendManager = TrendManager;
