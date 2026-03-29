/**
 * Glossary — Smart tooltips and in-game glossary for industry jargon.
 * Hover/tap any tagged term to see a plain-English explanation.
 */

class Glossary {
  constructor() {
    this._tooltip = null;
    this._init();
  }

  static get TERMS() {
    return {
      'RVP': { term: 'Reid Vapor Pressure', desc: 'Measures how easily liquid evaporates. Too high = vapors escape in storage. Too low = poor combustion. Target: 9-11.5 psi. Directly tied to your product revenue.', category: 'Product Spec' },
      'BTEX': { term: 'Benzene, Toluene, Ethylbenzene, Xylene', desc: 'Toxic aromatic compounds from glycol dehydration. EPA regulates emissions strictly. Keep the BTEX burner pilot lit or face massive fines.', category: 'Environmental' },
      'NGL': { term: 'Natural Gas Liquids', desc: 'The valuable heavy hydrocarbons (ethane, propane, butane) extracted from natural gas. Higher recovery = more money. The whole point of a cryo plant.', category: 'Product' },
      'TEG': { term: 'Triethylene Glycol', desc: 'Used to absorb moisture from natural gas. The glycol contactor strips water out so gas meets pipeline spec. Watch your contactor level and circulation rate.', category: 'Equipment' },
      'P&ID': { term: 'Piping and Instrumentation Diagram', desc: 'Engineering drawing showing all pipes, valves, instruments, and equipment. This is your board — learn to read it like a map.', category: 'Operations' },
      'DCS': { term: 'Distributed Control System', desc: 'The computer system that monitors and controls the entire plant. In real plants, this runs 24/7 and operators interact through stations like this one.', category: 'Operations' },
      'PSV': { term: 'Pressure Safety Valve', desc: 'Relief valve that opens if pressure exceeds safe limits. If this lifts, you\'ve already failed — it means upstream controls didn\'t catch the problem.', category: 'Safety' },
      'ESD': { term: 'Emergency Shutdown', desc: 'Automatic safety system that trips equipment when dangerous conditions are detected. Prevents catastrophic failures but costs you downtime and money.', category: 'Safety' },
      'MMcfd': { term: 'Million Cubic Feet per Day', desc: 'Standard unit for gas flow rate. A 110 MMcfd cryo plant processes 110 million cubic feet of raw gas per day. Big plant = big money = big responsibility.', category: 'Operations' },
      'mol sieve': { term: 'Molecular Sieve', desc: 'Desiccant beds that remove moisture to parts-per-million level. Required before cryogenic processing — any moisture freezes in the cold box and destroys equipment.', category: 'Equipment' },
      'turboexpander': { term: 'Turboexpander', desc: 'Rapidly expands gas to drop temperature to -150\u00B0F or colder. The heart of a cryo plant. Generates power while making the cold needed for NGL extraction.', category: 'Equipment' },
      'demethanizer': { term: 'Demethanizer Tower', desc: 'Fractionation column that separates methane (pipeline gas) from heavier NGL components. Controls determine your ethane and propane recovery rates.', category: 'Equipment' },
      'Kimray': { term: 'Kimray Glycol Pump', desc: 'Energy exchange pump that uses high-pressure gas to circulate glycol. No electricity needed. Common in field dehydration units. Simple but finicky.', category: 'Equipment' },
      'reboiler': { term: 'Reboiler', desc: 'Heat exchanger at the bottom of a tower that provides upward heat to drive separation. Temperature directly controls product quality (RVP). Your paycheck controller.', category: 'Equipment' },
      'cold box': { term: 'Cold Box / Brazed Aluminum Exchanger', desc: 'Ultra-efficient heat exchanger at cryogenic temps. Extremely sensitive to moisture — ice formation can crack the aluminum plates and cause a plant shutdown.', category: 'Equipment' },
      'pig': { term: 'Pipeline Pig', desc: 'Device pushed through pipelines for cleaning or inspection. When it arrives at your plant, a slug of liquid follows. Manage the surge or risk separator overflow.', category: 'Operations' },
      'separator': { term: 'Inlet Separator', desc: 'First vessel in the plant. Separates incoming gas from liquids and solids. Level control is critical — too high and liquid carries over to the compressor.', category: 'Equipment' },
      'cascade': { term: 'Cascade Control', desc: 'Control strategy where one controller\'s output drives another\'s setpoint. Common in temperature-to-fuel or level-to-flow loops. Understanding cascades is key to plant control.', category: 'Controls' },
      'ISA-101': { term: 'ISA-101 HMI Standard', desc: 'Industry standard for control system displays. Gray = normal, color = alarm state only. "If everything is colored, nothing stands out." That\'s why this sim uses a gray palette.', category: 'Operations' },
      'BTU': { term: 'British Thermal Unit', desc: 'Energy content of gas. Pipeline spec requires a specific BTU range (typically 1005-1015). Too lean = not enough heating value. Too rich = liquid dropout downstream.', category: 'Product Spec' },
      'H2S': { term: 'Hydrogen Sulfide', desc: 'Toxic, corrosive gas found in sour natural gas. Amine systems remove it. Even 4 ppm in the outlet is a pipeline violation. Lethal at 100+ ppm — this is serious business.', category: 'Safety' },
      'amine': { term: 'Amine Treating', desc: 'Chemical process using amine solutions (MEA, DEA, MDEA) to remove H2S and CO2 from natural gas. The amine absorbs acid gases and is regenerated in a stripper column.', category: 'Equipment' }
    };
  }

  /** Initialize tooltip system and tag all jargon in the page */
  _init() {
    // Create tooltip element
    this._tooltip = document.createElement('div');
    this._tooltip.id = 'glossary-tooltip';
    this._tooltip.className = 'glossary-tooltip';
    this._tooltip.style.display = 'none';
    document.body.appendChild(this._tooltip);

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.glossary-term') && !e.target.closest('#glossary-tooltip')) {
        this._tooltip.style.display = 'none';
      }
    });

    // Tag terms in static elements
    this._tagStaticElements();
  }

  /** Scan and tag jargon in static page elements */
  _tagStaticElements() {
    const targets = document.querySelectorAll('.mode-card p, .title-credit, .cta-text, .title-tagline, .obj-item, .learn-text');
    targets.forEach(el => this._tagElement(el));
  }

  /** Tag jargon terms within an element's text content */
  _tagElement(el) {
    if (!el || el.dataset.glossaryTagged) return;
    el.dataset.glossaryTagged = '1';

    const terms = Glossary.TERMS;
    let html = el.innerHTML;

    // Sort terms by length (longest first) to avoid partial matches
    const sorted = Object.keys(terms).sort((a, b) => b.length - a.length);

    for (const key of sorted) {
      const regex = new RegExp(`\\b(${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
      html = html.replace(regex, (match) => {
        return `<span class="glossary-term" data-term="${key}">${match}</span>`;
      });
    }

    el.innerHTML = html;

    // Bind events
    el.querySelectorAll('.glossary-term').forEach(term => {
      term.addEventListener('click', (e) => {
        e.stopPropagation();
        this._showTooltip(term.dataset.term, term);
      });
      term.addEventListener('mouseenter', () => {
        this._showTooltip(term.dataset.term, term);
      });
      term.addEventListener('mouseleave', () => {
        // Delay hide so user can hover over tooltip
        setTimeout(() => {
          if (!this._tooltip.matches(':hover')) {
            this._tooltip.style.display = 'none';
          }
        }, 300);
      });
    });
  }

  /** Show tooltip for a term near the target element */
  _showTooltip(termKey, target) {
    const entry = Glossary.TERMS[termKey];
    if (!entry) return;

    this._tooltip.innerHTML = `
      <div class="gt-category">${entry.category}</div>
      <div class="gt-term">${entry.term}</div>
      <div class="gt-desc">${entry.desc}</div>
    `;
    this._tooltip.style.display = 'block';

    // Position near target
    const rect = target.getBoundingClientRect();
    const ttRect = this._tooltip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - ttRect.width / 2;
    let top = rect.bottom + 8;

    // Keep on screen
    if (left < 8) left = 8;
    if (left + ttRect.width > window.innerWidth - 8) left = window.innerWidth - ttRect.width - 8;
    if (top + ttRect.height > window.innerHeight - 8) top = rect.top - ttRect.height - 8;

    this._tooltip.style.left = left + 'px';
    this._tooltip.style.top = top + 'px';
  }

  tagDynamic(selector) {
    // Tag dynamically generated elements
    document.querySelectorAll(selector).forEach(el => {
      if (!el.dataset.glossaryTagged) {
        this._tagElement(el);
        el.dataset.glossaryTagged = 'true';
      }
    });
  }

  /** Render the full glossary popup HTML */
  renderFullGlossary() {
    const terms = Glossary.TERMS;
    const categories = {};

    for (const [key, entry] of Object.entries(terms)) {
      if (!categories[entry.category]) categories[entry.category] = [];
      categories[entry.category].push({ key, ...entry });
    }

    let html = '<div class="glossary-full">';
    for (const [cat, entries] of Object.entries(categories)) {
      html += `<div class="glossary-cat-header">${cat}</div>`;
      for (const e of entries) {
        html += `<div class="glossary-entry">`;
        html += `<div class="glossary-entry-term">${e.key} — ${e.term}</div>`;
        html += `<div class="glossary-entry-desc">${e.desc}</div>`;
        html += `</div>`;
      }
    }
    html += '</div>';
    return html;
  }
}

window.Glossary = Glossary;
