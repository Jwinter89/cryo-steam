/**
 * FacilityViews — Generates P&ID SVG content for each facility type.
 * Each facility has its own P&ID layout using ISA standard symbols.
 */

const FacilityViews = {

  /**
   * Generate refrigeration plant P&ID SVG content
   */
  refrigerationPID() {
    return `
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#444444" stroke-width="0.3"/>
      </pattern>
      <marker id="flow-arrow" viewBox="0 0 6 4" refX="6" refY="2" markerWidth="6" markerHeight="4" orient="auto">
        <polygon points="0,0 6,2 0,4" fill="#808080"/>
      </marker>
      <marker id="flow-arrow-active" viewBox="0 0 6 4" refX="6" refY="2" markerWidth="6" markerHeight="4" orient="auto">
        <polygon points="0,0 6,2 0,4" fill="#A0A0A0"/>
      </marker>
    </defs>
    <rect width="900" height="600" fill="#3C3C3C"/>
    <rect width="900" height="600" fill="url(#grid)"/>

    <!-- INLET COMPRESSION -->
    <g transform="translate(30,80)">
      <circle cx="25" cy="25" r="22" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="25" y="29" text-anchor="middle" font-size="14" fill="#707070" font-family="Courier New">C</text>
      <text x="25" y="62" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">C-101</text>
      <text x="25" y="72" text-anchor="middle" font-size="7" fill="#606060" font-family="Arial">INLET COMP</text>
      <circle cx="55" cy="10" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="PIC-101"/>
      <text x="55" y="7" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">PIC</text>
      <text x="55" y="15" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">101</text>
    </g>

    <!-- Flow: Inlet comp to contactor -->
    <line class="flow-line active" x1="75" y1="105" x2="160" y2="105" marker-end="url(#flow-arrow-active)"/>

    <!-- TEG CONTACTOR TOWER -->
    <g transform="translate(160,30)">
      <path d="M 0,20 Q 0,0 20,0 Q 40,0 40,20 L 40,190 Q 40,210 20,210 Q 0,210 0,190 Z" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="20" y="225" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">T-201</text>
      <text x="20" y="235" text-anchor="middle" font-size="7" fill="#606060" font-family="Arial">CONTACTOR</text>
      <!-- Tray lines -->
      <line x1="5" y1="45" x2="35" y2="45" stroke="#606060" stroke-width="0.8"/>
      <line x1="5" y1="75" x2="35" y2="75" stroke="#606060" stroke-width="0.8"/>
      <line x1="5" y1="105" x2="35" y2="105" stroke="#606060" stroke-width="0.8"/>
      <line x1="5" y1="135" x2="35" y2="135" stroke="#606060" stroke-width="0.8"/>
      <line x1="5" y1="165" x2="35" y2="165" stroke="#606060" stroke-width="0.8"/>
      <circle cx="52" cy="100" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-202"/>
      <text x="52" y="97" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="52" y="105" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">202</text>
      <circle cx="52" cy="170" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="LIC-201"/>
      <text x="52" y="167" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">LIC</text>
      <text x="52" y="175" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">201</text>
    </g>

    <!-- Dry gas out (top of contactor) to refrigeration -->
    <line class="flow-line active" x1="180" y1="25" x2="180" y2="15" marker-end="url(#flow-arrow-active)"/>
    <line class="flow-line active" x1="180" y1="15" x2="480" y2="15"/>
    <line class="flow-line active" x1="480" y1="15" x2="480" y2="60" marker-end="url(#flow-arrow-active)"/>

    <!-- KIMRAY GLYCOL PUMP (special widget location) -->
    <g id="kimray-pump-area" transform="translate(250,280)">
      <!-- Pump symbol -->
      <circle cx="20" cy="20" r="16" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <polygon points="8,10 32,20 8,30" fill="none" stroke="#707070" stroke-width="1"/>
      <text x="20" y="50" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">K-201</text>
      <text x="20" y="60" text-anchor="middle" font-size="7" fill="#606060" font-family="Arial">KIMRAY</text>
      <!-- Stroke counter -->
      <rect x="42" y="8" width="50" height="24" fill="#404040" stroke="#606060" stroke-width="1"/>
      <text x="67" y="18" text-anchor="middle" font-size="7" fill="#808080" font-family="Courier New">SPM</text>
      <text id="kimray-spm" x="67" y="28" text-anchor="middle" font-size="12" fill="#E8E8E8" font-family="Courier New">6.0</text>
      <circle cx="105" cy="20" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="FI-201"/>
      <text x="105" y="17" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">FI</text>
      <text x="105" y="25" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">201</text>
    </g>

    <!-- Rich glycol line: contactor bottom to flash tank -->
    <line class="flow-line active" x1="180" y1="240" x2="180" y2="350" marker-end="url(#flow-arrow-active)"/>
    <line class="flow-line active" x1="180" y1="350" x2="250" y2="350"/>

    <!-- FLASH TANK -->
    <g transform="translate(250,370)">
      <rect x="0" y="0" width="45" height="35" rx="10" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="22" y="48" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">V-201</text>
      <circle cx="55" cy="18" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="LIC-202"/>
      <text x="55" y="15" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">LIC</text>
      <text x="55" y="23" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">202</text>
    </g>

    <!-- Flash tank to Still Column -->
    <line class="flow-line active" x1="295" y1="387" x2="370" y2="387" marker-end="url(#flow-arrow-active)"/>

    <!-- STILL COLUMN -->
    <g transform="translate(370,300)">
      <path d="M 0,15 Q 0,0 15,0 Q 30,0 30,15 L 30,150 Q 30,165 15,165 Q 0,165 0,150 Z" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="15" y="180" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">T-202</text>
      <text x="15" y="190" text-anchor="middle" font-size="7" fill="#606060" font-family="Arial">STILL</text>
      <circle cx="42" cy="30" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-203"/>
      <text x="42" y="27" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="42" y="35" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">203</text>
    </g>

    <!-- TEG REBOILER -->
    <g transform="translate(370,480)">
      <rect x="0" y="0" width="45" height="40" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <path d="M 8,10 Q 15,7 22,10 Q 30,13 37,10" fill="none" stroke="#707070" stroke-width="1"/>
      <path d="M 8,25 Q 15,22 22,25 Q 30,28 37,25" fill="none" stroke="#707070" stroke-width="1"/>
      <text x="22" y="52" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">H-201</text>
      <circle cx="55" cy="20" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-201"/>
      <text x="55" y="17" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="55" y="25" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">201</text>
    </g>

    <!-- BTEX UNIT -->
    <g transform="translate(440,300)">
      <rect x="0" y="0" width="50" height="35" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="25" y="15" text-anchor="middle" font-size="8" fill="#A0A0A0" font-family="Courier New">BTEX</text>
      <text x="25" y="25" text-anchor="middle" font-size="8" fill="#A0A0A0" font-family="Courier New">UNIT</text>
      <text x="25" y="48" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">B-210</text>
      <!-- Pilot status -->
      <circle id="btex-pilot-status" cx="55" cy="10" r="4" fill="#505050" stroke="#606060" stroke-width="1"/>
      <circle cx="60" cy="28" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="XI-210"/>
      <text x="60" y="25" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">XI</text>
      <text x="60" y="33" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">210</text>
    </g>

    <!-- Lean glycol return: pump to contactor top -->
    <line class="flow-line active" x1="270" y1="280" x2="270" y2="50"/>
    <line class="flow-line active" x1="270" y1="50" x2="200" y2="50" marker-end="url(#flow-arrow-active)"/>

    <!-- REFRIGERATION SECTION -->
    <g transform="translate(460,60)">
      <rect x="0" y="0" width="70" height="50" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <!-- X for heat exchanger -->
      <line x1="10" y1="10" x2="60" y2="40" stroke="#707070" stroke-width="1"/>
      <line x1="60" y1="10" x2="10" y2="40" stroke="#707070" stroke-width="1"/>
      <text x="35" y="65" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">E-301</text>
      <text x="35" y="75" text-anchor="middle" font-size="7" fill="#606060" font-family="Arial">CHILLER</text>
      <circle cx="80" cy="25" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-303"/>
      <text x="80" y="22" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="80" y="30" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">303</text>
    </g>

    <!-- Refrig compressor -->
    <g transform="translate(560,140)">
      <circle cx="20" cy="20" r="18" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="20" y="24" text-anchor="middle" font-size="12" fill="#707070" font-family="Courier New">C</text>
      <text x="20" y="52" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">R-301</text>
      <text x="20" y="62" text-anchor="middle" font-size="7" fill="#606060" font-family="Arial">REFRIG</text>
      <circle cx="50" cy="8" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-301"/>
      <text x="50" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="50" y="13" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">301</text>
    </g>

    <!-- Chiller output to separator/product section -->
    <line class="flow-line active" x1="530" y1="85" x2="650" y2="85" marker-end="url(#flow-arrow-active)"/>

    <!-- Product section -->
    <g transform="translate(650,50)">
      <rect x="0" y="0" width="50" height="70" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="25" y="85" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">V-501</text>
      <text x="25" y="95" text-anchor="middle" font-size="7" fill="#606060" font-family="Arial">SEPARATOR</text>
    </g>

    <!-- RESIDUE COMPRESSION -->
    <g transform="translate(650,200)">
      <circle cx="20" cy="20" r="18" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="20" y="24" text-anchor="middle" font-size="12" fill="#707070" font-family="Courier New">C</text>
      <text x="20" y="52" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">C-102</text>
      <circle cx="50" cy="8" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="PIC-501"/>
      <text x="50" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">PIC</text>
      <text x="50" y="13" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">501</text>
    </g>

    <!-- Product pump and tank -->
    <g transform="translate(750,60)">
      <circle cx="15" cy="15" r="12" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <polygon points="7,8 23,15 7,22" fill="none" stroke="#707070" stroke-width="1"/>
      <text x="15" y="38" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">P-501</text>
    </g>
    <line class="flow-line active" x1="765" y1="75" x2="765" y2="130" marker-end="url(#flow-arrow-active)"/>
    <g transform="translate(740,130)">
      <rect x="0" y="0" width="50" height="50" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="25" y="65" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">TK-501</text>
      <circle cx="60" cy="25" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="LIC-501"/>
      <text x="60" y="22" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">LIC</text>
      <text x="60" y="30" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">501</text>
    </g>

    <!-- FUEL GAS SYSTEM (top right) -->
    <g transform="translate(700,300)">
      <rect x="0" y="0" width="70" height="35" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="35" y="15" text-anchor="middle" font-size="8" fill="#A0A0A0" font-family="Courier New">FUEL GAS</text>
      <text x="35" y="25" text-anchor="middle" font-size="8" fill="#A0A0A0" font-family="Courier New">SYSTEM</text>
      <circle cx="80" cy="18" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-401"/>
      <text x="80" y="15" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="80" y="23" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">401</text>
    </g>

    <!-- Throughput, Recovery, RVP tags -->
    <g transform="translate(30,500)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="FI-501"/>
      <text x="0" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">FI</text>
      <text x="0" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">501</text>
    </g>
    <g transform="translate(70,500)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-501"/>
      <text x="0" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="0" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">501</text>
    </g>
    <g transform="translate(110,500)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-601"/>
      <text x="0" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="0" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">601</text>
    </g>
    `;
  },

  /**
   * Generate cryogenic plant P&ID SVG content
   */
  cryogenicPID() {
    return `
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#444444" stroke-width="0.3"/>
      </pattern>
      <marker id="flow-arrow-active" viewBox="0 0 6 4" refX="6" refY="2" markerWidth="6" markerHeight="4" orient="auto">
        <polygon points="0,0 6,2 0,4" fill="#A0A0A0"/>
      </marker>
    </defs>
    <rect width="1000" height="650" fill="#3C3C3C"/>
    <rect width="1000" height="650" fill="url(#grid)"/>

    <!-- INLET SECTION -->
    <g transform="translate(20,80)">
      <text x="30" y="-5" text-anchor="middle" font-size="8" fill="#606060" font-family="Arial">INLET GAS</text>
      <line class="flow-line active" x1="0" y1="0" x2="60" y2="0" marker-end="url(#flow-arrow-active)"/>
      <circle cx="30" cy="-15" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="FI-100"/>
      <text x="30" y="-18" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">FI</text>
      <text x="30" y="-10" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">100</text>
    </g>

    <!-- MOL SIEVE (3 vessels) -->
    <g transform="translate(80,30)">
      <rect x="0" y="0" width="30" height="60" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="15" y="75" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">MS-A</text>
      <rect x="40" y="0" width="30" height="60" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="55" y="75" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">MS-B</text>
      <rect x="80" y="0" width="30" height="60" rx="3" fill="#383838" stroke="#606060" stroke-width="1"/>
      <text x="95" y="75" text-anchor="middle" font-size="7" fill="#606060" font-family="Courier New">MS-C</text>
      <text x="55" y="88" text-anchor="middle" font-size="7" fill="#606060" font-family="Arial">REGEN</text>
      <circle cx="120" cy="30" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-201"/>
      <text x="120" y="27" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="120" y="35" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">201</text>
    </g>

    <!-- REGEN HEATER -->
    <g transform="translate(100,120)">
      <rect x="0" y="0" width="40" height="30" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <path d="M 5,10 Q 15,5 20,10 Q 25,15 35,10" fill="none" stroke="#707070" stroke-width="1"/>
      <text x="20" y="42" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">H-200</text>
      <circle cx="50" cy="15" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-203"/>
      <text x="50" y="12" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="50" y="20" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">203</text>
    </g>

    <!-- Dry gas to cold box -->
    <line class="flow-line active" x1="200" y1="60" x2="260" y2="60" marker-end="url(#flow-arrow-active)"/>

    <!-- COLD BOX AREA (main cryogenic section) -->
    <g transform="translate(260,20)">
      <!-- Gas/Gas Exchanger -->
      <rect x="0" y="0" width="60" height="45" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <line x1="5" y1="5" x2="55" y2="40" stroke="#707070" stroke-width="1"/>
      <line x1="55" y1="5" x2="5" y2="40" stroke="#707070" stroke-width="1"/>
      <text x="30" y="58" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">E-301</text>
      <text x="30" y="67" text-anchor="middle" font-size="6" fill="#606060" font-family="Arial">GAS/GAS</text>
      <circle cx="70" cy="22" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-301"/>
      <text x="70" y="19" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="70" y="27" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">301</text>

      <!-- Gas/Product Exchanger -->
      <rect x="0" y="80" width="60" height="45" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <line x1="5" y1="85" x2="55" y2="120" stroke="#707070" stroke-width="1"/>
      <line x1="55" y1="85" x2="5" y2="120" stroke="#707070" stroke-width="1"/>
      <text x="30" y="138" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">E-302</text>
      <text x="30" y="147" text-anchor="middle" font-size="6" fill="#606060" font-family="Arial">GAS/PROD</text>
      <circle cx="70" cy="102" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-302"/>
      <text x="70" y="99" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="70" y="107" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">302</text>
    </g>

    <!-- Flow between exchangers -->
    <line class="flow-line active" x1="290" y1="65" x2="290" y2="100" marker-end="url(#flow-arrow-active)"/>

    <!-- COLD SEPARATOR -->
    <g transform="translate(260,200)">
      <rect x="0" y="0" width="55" height="40" rx="15" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="27" y="55" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">V-300</text>
      <text x="27" y="64" text-anchor="middle" font-size="6" fill="#606060" font-family="Arial">COLD SEP</text>
      <circle cx="65" cy="12" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-303"/>
      <text x="65" y="9" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="65" y="17" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">303</text>
      <circle cx="65" cy="35" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="LIC-301"/>
      <text x="65" y="32" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">LIC</text>
      <text x="65" y="40" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">301</text>
    </g>

    <line class="flow-line active" x1="290" y1="145" x2="290" y2="200" marker-end="url(#flow-arrow-active)"/>

    <!-- Cold sep vapor to EXPANDER -->
    <line class="flow-line active" x1="315" y1="210" x2="420" y2="210" marker-end="url(#flow-arrow-active)"/>

    <!-- TURBOEXPANDER / RECOMPRESSOR -->
    <g transform="translate(420,180)">
      <!-- Expander -->
      <circle cx="25" cy="25" r="22" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="25" y="22" text-anchor="middle" font-size="8" fill="#707070" font-family="Courier New">EXP</text>
      <text x="25" y="32" text-anchor="middle" font-size="6" fill="#606060" font-family="Courier New">EX-400</text>
      <!-- Shaft line to booster -->
      <line x1="47" y1="205" x2="80" y2="205" stroke="#707070" stroke-width="2" stroke-dasharray="4,2"/>
      <!-- Booster compressor -->
      <circle cx="105" cy="25" r="18" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="105" y="22" text-anchor="middle" font-size="7" fill="#707070" font-family="Courier New">BC</text>
      <text x="105" y="30" text-anchor="middle" font-size="5" fill="#606060" font-family="Courier New">400</text>

      <circle cx="25" cy="58" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="SI-401"/>
      <text x="25" y="55" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">SI</text>
      <text x="25" y="63" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">401</text>

      <circle cx="60" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-402"/>
      <text x="60" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="60" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">402</text>

      <circle cx="25" cy="-15" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-403"/>
      <text x="25" y="-18" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="25" y="-10" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">403</text>

      <!-- Guide vane -->
      <circle cx="-15" cy="10" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="FIC-401"/>
      <text x="-15" y="7" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">FIC</text>
      <text x="-15" y="15" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">401</text>
    </g>

    <!-- Expander outlet to DEMETHANIZER -->
    <line class="flow-line active" x1="445" y1="225" x2="445" y2="300"/>
    <line class="flow-line active" x1="445" y1="300" x2="550" y2="300" marker-end="url(#flow-arrow-active)"/>

    <!-- DEMETHANIZER TOWER -->
    <g transform="translate(550,180)">
      <path d="M 0,25 Q 0,0 25,0 Q 50,0 50,25 L 50,350 Q 50,375 25,375 Q 0,375 0,350 Z" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <!-- Bubble trays -->
      <line x1="5" y1="60" x2="45" y2="60" stroke="#606060" stroke-width="0.8"/>
      <line x1="5" y1="100" x2="45" y2="100" stroke="#606060" stroke-width="0.8"/>
      <line x1="5" y1="140" x2="45" y2="140" stroke="#606060" stroke-width="0.8"/>
      <line x1="5" y1="180" x2="45" y2="180" stroke="#606060" stroke-width="0.8"/>
      <line x1="5" y1="220" x2="45" y2="220" stroke="#606060" stroke-width="0.8"/>
      <line x1="5" y1="260" x2="45" y2="260" stroke="#606060" stroke-width="0.8"/>
      <line x1="5" y1="300" x2="45" y2="300" stroke="#606060" stroke-width="0.8"/>
      <!-- Mist pads -->
      <rect x="8" y="35" width="34" height="8" fill="none" stroke="#555" stroke-width="0.5" stroke-dasharray="1,1"/>
      <rect x="8" y="315" width="34" height="8" fill="none" stroke="#555" stroke-width="0.5" stroke-dasharray="1,1"/>

      <text x="25" y="390" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">T-500</text>
      <text x="25" y="400" text-anchor="middle" font-size="7" fill="#606060" font-family="Arial">DEMETHANIZER</text>

      <!-- Tags -->
      <circle cx="60" cy="30" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-501"/>
      <text x="60" y="27" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="60" y="35" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">501</text>

      <circle cx="60" cy="120" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-502"/>
      <text x="60" y="117" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="60" y="125" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">502</text>

      <circle cx="60" cy="340" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="LIC-501"/>
      <text x="60" y="337" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">LIC</text>
      <text x="60" y="345" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">501</text>

      <circle cx="60" cy="280" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-503"/>
      <text x="60" y="277" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="60" y="285" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">503</text>

      <circle cx="60" cy="15" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="PIC-501"/>
      <text x="60" y="12" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">PIC</text>
      <text x="60" y="20" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">501</text>
    </g>

    <!-- Side reboiler and bottom reboiler -->
    <g transform="translate(620,360)">
      <rect x="0" y="0" width="40" height="25" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <line x1="5" y1="5" x2="35" y2="20" stroke="#707070" stroke-width="1"/>
      <line x1="35" y1="5" x2="5" y2="20" stroke="#707070" stroke-width="1"/>
      <text x="20" y="38" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">SIDE REB</text>
      <circle cx="50" cy="12" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-504"/>
      <text x="50" y="9" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="50" y="17" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">504</text>
    </g>
    <g transform="translate(620,420)">
      <rect x="0" y="0" width="40" height="25" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <line x1="5" y1="5" x2="35" y2="20" stroke="#707070" stroke-width="1"/>
      <line x1="35" y1="5" x2="5" y2="20" stroke="#707070" stroke-width="1"/>
      <text x="20" y="38" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">BTM REB</text>
      <circle cx="50" cy="12" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-505"/>
      <text x="50" y="9" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="50" y="17" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">505</text>
    </g>

    <!-- Overhead gas from demet to booster/residue comp -->
    <line class="flow-line active" x1="575" y1="178" x2="575" y2="120"/>
    <line class="flow-line active" x1="575" y1="120" x2="720" y2="120" marker-end="url(#flow-arrow-active)"/>

    <!-- RESIDUE COMPRESSION (3 units) -->
    <g transform="translate(720,80)">
      <circle cx="20" cy="20" r="16" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="20" y="24" text-anchor="middle" font-size="10" fill="#707070" font-family="Courier New">C</text>
      <text x="20" y="48" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">C-601</text>

      <circle cx="60" cy="20" r="16" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="60" y="24" text-anchor="middle" font-size="10" fill="#707070" font-family="Courier New">C</text>
      <text x="60" y="48" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">C-602</text>

      <circle cx="100" cy="20" r="16" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="100" y="24" text-anchor="middle" font-size="10" fill="#707070" font-family="Courier New">C</text>
      <text x="100" y="48" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">C-603</text>

      <circle cx="130" cy="5" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="PIC-601"/>
      <text x="130" y="2" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">PIC</text>
      <text x="130" y="10" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">601</text>
    </g>

    <!-- Residue out to pipeline -->
    <line class="flow-line active" x1="840" y1="100" x2="900" y2="100" marker-end="url(#flow-arrow-active)"/>
    <text x="920" y="104" font-size="7" fill="#606060" font-family="Arial">RESIDUE</text>
    <text x="920" y="114" font-size="7" fill="#606060" font-family="Arial">PIPELINE</text>

    <!-- NGL product out bottom of demet -->
    <line class="flow-line active" x1="575" y1="555" x2="575" y2="590"/>
    <line class="flow-line active" x1="575" y1="590" x2="720" y2="590" marker-end="url(#flow-arrow-active)"/>

    <!-- NGL Pumps & Tank -->
    <g transform="translate(720,575)">
      <circle cx="15" cy="15" r="12" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <polygon points="7,8 23,15 7,22" fill="none" stroke="#707070" stroke-width="1"/>
      <text x="15" y="38" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">P-701</text>
    </g>
    <line class="flow-line active" x1="750" y1="590" x2="820" y2="590" marker-end="url(#flow-arrow-active)"/>
    <g transform="translate(820,565)">
      <rect x="0" y="0" width="55" height="50" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="27" y="62" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">TK-701</text>
      <circle cx="65" cy="25" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="LIC-701"/>
      <text x="65" y="22" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">LIC</text>
      <text x="65" y="30" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">701</text>
    </g>

    <!-- HOT OIL SYSTEM -->
    <g transform="translate(20,350)">
      <rect x="0" y="0" width="70" height="35" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="35" y="15" text-anchor="middle" font-size="8" fill="#A0A0A0" font-family="Courier New">HOT OIL</text>
      <text x="35" y="25" text-anchor="middle" font-size="8" fill="#A0A0A0" font-family="Courier New">SYSTEM</text>
      <text x="35" y="48" text-anchor="middle" font-size="7" fill="#A0A0A0" font-family="Courier New">H-800</text>
      <circle cx="80" cy="18" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-801"/>
      <text x="80" y="15" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="80" y="23" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">801</text>
    </g>

    <!-- MODE SWITCH INDICATOR -->
    <g transform="translate(800,20)">
      <rect x="0" y="0" width="100" height="40" rx="3" fill="#404040" stroke="#606060" stroke-width="1"/>
      <text x="50" y="14" text-anchor="middle" font-size="7" fill="#808080" font-family="Courier New">OPERATING MODE</text>
      <text id="mode-switch-label" x="50" y="30" text-anchor="middle" font-size="10" fill="#E8E8E8" font-family="Courier New">ETHANE REC</text>
    </g>

    <!-- Recovery & spec tags at bottom -->
    <g transform="translate(20,610)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-701"/>
      <text x="0" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="0" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">701</text>
      <text x="0" y="18" text-anchor="middle" font-size="5" fill="#606060" font-family="Arial">ETH REC</text>
    </g>
    <g transform="translate(60,610)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-702"/>
      <text x="0" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="0" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">702</text>
      <text x="0" y="18" text-anchor="middle" font-size="5" fill="#606060" font-family="Arial">C3 REC</text>
    </g>
    <g transform="translate(100,610)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-703"/>
      <text x="0" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="0" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">703</text>
      <text x="0" y="18" text-anchor="middle" font-size="5" fill="#606060" font-family="Arial">RES BTU</text>
    </g>
    <g transform="translate(140,610)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-704"/>
      <text x="0" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="0" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">704</text>
      <text x="0" y="18" text-anchor="middle" font-size="5" fill="#606060" font-family="Arial">RVP</text>
    </g>
    `;
  },

  /**
   * Generate amine/H2S treatment P&ID SVG content (DLC overlay)
   */
  aminePID() {
    return `
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#444444" stroke-width="0.3"/>
      </pattern>
      <marker id="flow-arrow" viewBox="0 0 6 4" refX="6" refY="2" markerWidth="6" markerHeight="4" orient="auto">
        <polygon points="0,0 6,2 0,4" fill="#808080"/>
      </marker>
      <marker id="flow-arrow-active" viewBox="0 0 6 4" refX="6" refY="2" markerWidth="6" markerHeight="4" orient="auto">
        <polygon points="0,0 6,2 0,4" fill="#A0A0A0"/>
      </marker>
    </defs>
    <rect width="800" height="550" fill="#3C3C3C"/>
    <rect width="800" height="550" fill="url(#grid)"/>

    <!-- SOUR GAS INLET -->
    <g transform="translate(30,120)">
      <text x="0" y="0" font-size="9" fill="#A0A0A0" font-family="Courier New">SOUR GAS</text>
      <text x="0" y="12" font-size="7" fill="#606060">FROM INLET</text>
    </g>
    <line class="flow-line active" x1="90" y1="125" x2="160" y2="125" marker-end="url(#flow-arrow-active)"/>

    <!-- AMINE ABSORBER TOWER -->
    <g id="equip-absorber" transform="translate(160,30)">
      <path d="M 0,25 Q 0,0 22,0 Q 44,0 44,25 L 44,230 Q 44,255 22,255 Q 0,255 0,230 Z" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <!-- Trays -->
      <line x1="4" y1="50" x2="40" y2="50" stroke="#606060" stroke-width="0.8"/>
      <line x1="4" y1="80" x2="40" y2="80" stroke="#606060" stroke-width="0.8"/>
      <line x1="4" y1="110" x2="40" y2="110" stroke="#606060" stroke-width="0.8"/>
      <line x1="4" y1="140" x2="40" y2="140" stroke="#606060" stroke-width="0.8"/>
      <line x1="4" y1="170" x2="40" y2="170" stroke="#606060" stroke-width="0.8"/>
      <text x="22" y="270" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">T-A01</text>
      <text x="22" y="280" text-anchor="middle" font-size="7" fill="#606060">ABSORBER</text>
      <!-- Inlet tag -->
      <circle cx="55" cy="95" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-A01"/>
      <text x="55" y="92" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="55" y="100" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A01</text>
      <!-- Outlet tag -->
      <circle cx="55" cy="30" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-A02"/>
      <text x="55" y="27" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="55" y="35" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A02</text>
      <!-- Pressure -->
      <circle cx="55" cy="140" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="PIC-A01"/>
      <text x="55" y="137" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">PIC</text>
      <text x="55" y="145" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A01</text>
      <!-- Sump level -->
      <circle cx="55" cy="230" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="LIC-A01"/>
      <text x="55" y="227" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">LIC</text>
      <text x="55" y="235" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A01</text>
    </g>

    <!-- Sweet gas out -->
    <line class="flow-line active" x1="182" y1="25" x2="182" y2="10"/>
    <line class="flow-line active" x1="182" y1="10" x2="350" y2="10" marker-end="url(#flow-arrow-active)"/>
    <text x="280" y="8" text-anchor="middle" font-size="8" fill="#A0A0A0" font-family="Courier New">SWEET GAS</text>

    <!-- Lean amine flow tag and control valve -->
    <g transform="translate(100,40)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="FI-A01"/>
      <text x="0" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">FI</text>
      <text x="0" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A01</text>
    </g>
    <line class="flow-line active" x1="112" y1="40" x2="160" y2="40" marker-end="url(#flow-arrow-active)"/>

    <!-- Rich amine out of absorber sump -->
    <line class="flow-line active" x1="182" y1="285" x2="182" y2="320"/>
    <line class="flow-line active" x1="182" y1="320" x2="300" y2="320" marker-end="url(#flow-arrow-active)"/>

    <!-- FLASH DRUM -->
    <g id="equip-flash" transform="translate(300,300)">
      <rect x="0" y="0" width="60" height="45" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <line id="flash-level" x1="5" y1="25" x2="55" y2="25" stroke="#707070" stroke-width="1" stroke-dasharray="3,2"/>
      <text x="30" y="60" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">V-A01</text>
      <circle cx="70" cy="22" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="LIC-A02"/>
      <text x="70" y="19" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">LIC</text>
      <text x="70" y="27" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A02</text>
    </g>

    <!-- Flash gas vent -->
    <line class="flow-line active" x1="330" y1="300" x2="330" y2="270"/>
    <text x="330" y="265" text-anchor="middle" font-size="7" fill="#606060">FLASH GAS</text>

    <!-- Rich amine to regenerator -->
    <line class="flow-line active" x1="360" y1="322" x2="460" y2="322" marker-end="url(#flow-arrow-active)"/>

    <!-- AMINE REGENERATOR -->
    <g id="equip-regen" transform="translate(460,120)">
      <path d="M 0,25 Q 0,0 22,0 Q 44,0 44,25 L 44,250 Q 44,275 22,275 Q 0,275 0,250 Z" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <!-- Trays -->
      <line x1="4" y1="50" x2="40" y2="50" stroke="#606060" stroke-width="0.8"/>
      <line x1="4" y1="90" x2="40" y2="90" stroke="#606060" stroke-width="0.8"/>
      <line x1="4" y1="130" x2="40" y2="130" stroke="#606060" stroke-width="0.8"/>
      <line x1="4" y1="170" x2="40" y2="170" stroke="#606060" stroke-width="0.8"/>
      <text x="22" y="290" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">T-A02</text>
      <text x="22" y="300" text-anchor="middle" font-size="7" fill="#606060">REGENERATOR</text>
      <!-- Regen overhead temp -->
      <circle cx="55" cy="30" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="TIC-A03"/>
      <text x="55" y="27" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">TIC</text>
      <text x="55" y="35" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A03</text>
      <!-- Regen sump level -->
      <circle cx="55" cy="250" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="LIC-A03"/>
      <text x="55" y="247" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">LIC</text>
      <text x="55" y="255" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A03</text>
    </g>

    <!-- REGEN REBOILER -->
    <g id="equip-regen-reboiler" transform="translate(530,400)">
      <rect x="0" y="0" width="55" height="45" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <path d="M 8,12 Q 18,8 27,12 Q 36,16 45,12" fill="none" stroke="#707070" stroke-width="1"/>
      <path d="M 8,28 Q 18,24 27,28 Q 36,32 45,28" fill="none" stroke="#707070" stroke-width="1"/>
      <text x="27" y="58" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">H-A01</text>
    </g>
    <line class="flow-line active" x1="482" y1="395" x2="482" y2="422"/>
    <line class="flow-line active" x1="482" y1="422" x2="530" y2="422" marker-end="url(#flow-arrow-active)"/>
    <line class="flow-line active" x1="585" y1="422" x2="620" y2="422"/>
    <line class="flow-line active" x1="620" y1="422" x2="620" y2="395" marker-end="url(#flow-arrow-active)"/>

    <!-- H2S MONITORS -->
    <g transform="translate(650,80)">
      <rect x="0" y="0" width="110" height="100" rx="3" fill="#404040" stroke="#606060" stroke-width="1"/>
      <text x="55" y="15" text-anchor="middle" font-size="8" fill="#A0A0A0" font-family="Courier New">H2S MONITORS</text>
      <!-- Area 1 -->
      <circle cx="25" cy="40" r="10" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-A01"/>
      <text x="25" y="37" text-anchor="middle" font-size="5" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="25" y="44" text-anchor="middle" font-size="5" fill="#A0A0A0" font-family="Courier New">A01</text>
      <text x="25" y="57" text-anchor="middle" font-size="6" fill="#606060">OUTLET</text>
      <!-- Area 2 -->
      <circle cx="55" cy="40" r="10" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-A02"/>
      <text x="55" y="37" text-anchor="middle" font-size="5" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="55" y="44" text-anchor="middle" font-size="5" fill="#A0A0A0" font-family="Courier New">A02</text>
      <text x="55" y="57" text-anchor="middle" font-size="6" fill="#606060">AREA</text>
      <!-- Area 3 -->
      <circle cx="85" cy="40" r="10" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-A03"/>
      <text x="85" y="37" text-anchor="middle" font-size="5" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="85" y="44" text-anchor="middle" font-size="5" fill="#A0A0A0" font-family="Courier New">A03</text>
      <text x="85" y="57" text-anchor="middle" font-size="6" fill="#606060">PERIM</text>
      <!-- Wind indicator -->
      <text x="55" y="80" text-anchor="middle" font-size="7" fill="#808080" font-family="Courier New" id="amine-wind">WIND: SW</text>
      <text x="55" y="92" text-anchor="middle" font-size="6" fill="#606060">EVAC ROUTES</text>
    </g>

    <!-- AMINE PUMPS -->
    <g transform="translate(650,240)">
      <rect x="0" y="0" width="100" height="60" rx="3" fill="#404040" stroke="#606060" stroke-width="1"/>
      <text x="50" y="15" text-anchor="middle" font-size="8" fill="#A0A0A0" font-family="Courier New">AMINE PUMPS</text>
      <circle cx="25" cy="38" r="12" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="25" y="42" text-anchor="middle" font-size="10" fill="#707070">P</text>
      <text x="25" y="57" text-anchor="middle" font-size="6" fill="#606060">P-A01</text>
      <circle cx="70" cy="38" r="12" fill="#484848" stroke="#606060" stroke-width="1"/>
      <text x="70" y="42" text-anchor="middle" font-size="10" fill="#585858">P</text>
      <text x="70" y="57" text-anchor="middle" font-size="6" fill="#555555">P-A02 STBY</text>
    </g>

    <!-- Lean amine return line (from regen sump back to absorber top) -->
    <line class="flow-line active" x1="482" y1="120" x2="482" y2="70"/>
    <line class="flow-line active" x1="482" y1="70" x2="650" y2="70"/>
    <line class="flow-line active" x1="700" y1="70" x2="700" y2="240" marker-end="url(#flow-arrow-active)"/>
    <line class="flow-line active" x1="700" y1="300" x2="700" y2="350"/>
    <line class="flow-line active" x1="700" y1="350" x2="100" y2="350"/>
    <line class="flow-line active" x1="100" y1="350" x2="100" y2="40" marker-end="url(#flow-arrow-active)"/>

    <!-- AMINE CHEMISTRY -->
    <g transform="translate(650,360)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-A04"/>
      <text x="0" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="0" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A04</text>
      <text x="0" y="18" text-anchor="middle" font-size="5" fill="#606060">STRENGTH</text>
    </g>
    <g transform="translate(700,360)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="AI-A05"/>
      <text x="0" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">AI</text>
      <text x="0" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A05</text>
      <text x="0" y="18" text-anchor="middle" font-size="5" fill="#606060">pH</text>
    </g>
    <g transform="translate(750,360)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="CI-A01"/>
      <text x="0" y="-3" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">CI</text>
      <text x="0" y="5" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A01</text>
      <text x="0" y="18" text-anchor="middle" font-size="5" fill="#606060">CORR</text>
    </g>

    <!-- AMINE STORAGE -->
    <g transform="translate(650,440)">
      <rect x="0" y="0" width="60" height="50" rx="3" fill="#505050" stroke="#808080" stroke-width="1.5"/>
      <text x="30" y="62" text-anchor="middle" font-size="9" fill="#A0A0A0" font-family="Courier New">TK-A01</text>
      <circle cx="70" cy="25" r="12" fill="none" stroke="#808080" stroke-width="1" class="tag-bubble" data-tag="LIC-A04"/>
      <text x="70" y="22" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">LIC</text>
      <text x="70" y="30" text-anchor="middle" font-size="6" fill="#A0A0A0" font-family="Courier New">A04</text>
    </g>
    `;
  }
};

window.FacilityViews = FacilityViews;
