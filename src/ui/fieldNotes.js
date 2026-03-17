/**
 * FieldNotes — Unlockable operator wisdom content.
 * Written in the voice of an experienced operator, not a manual.
 * Unlocked through gameplay as prestige content.
 */

const FieldNotes = {
  notes: [
    // ---- STABILIZER NOTES ----
    {
      id: 'fn-001',
      category: 'STABILIZER',
      title: 'The Quiet Pig',
      text: 'A pig that comes in quiet is more dangerous than one that hammers your separator. Quiet means it\'s dissolving slowly and you won\'t see the level move until it\'s already too late.',
      unlockCondition: 'survive-pig-no-alarm',
      unlocked: false
    },
    {
      id: 'fn-002',
      category: 'STABILIZER',
      title: 'Reboiler Lag',
      text: 'There\'s always a 3-5 minute lag between your reboiler adjustment and the RVP response. If you\'re chasing RVP in real-time, you\'re already behind. Adjust, wait, watch the trend. Don\'t touch it again until the trend shows you the result.',
      unlockCondition: 'hold-rvp-30min',
      unlocked: false
    },
    {
      id: 'fn-003',
      category: 'STABILIZER',
      title: 'The Pinch',
      text: 'Every operator thinks the pinch valve is about protecting the separator. It is. But the real skill is knowing exactly how much to pinch. One percent too much and you\'re losing $500/hr in gas flow. One percent too little and you\'re looking at a 10-hour recovery.',
      unlockCondition: 'optimal-pinch-pig',
      unlocked: false
    },
    {
      id: 'fn-004',
      category: 'STABILIZER',
      title: 'Hot Oil First',
      text: 'If the TEG reboiler temp is dropping and you haven\'t touched anything, check fuel gas pressure before you do anything else. Fuel gas feeds the hot oil heater. Hot oil feeds the reboiler. You\'re looking at a symptom. The disease is upstream.',
      unlockCondition: 'diagnose-hotoil-fault',
      unlocked: false
    },

    // ---- TEG / DEHYDRATION NOTES ----
    {
      id: 'fn-010',
      category: 'DEHYDRATION',
      title: 'Kimray Silence',
      text: 'The Kimray pump doesn\'t have an alarm for stroke rate drift. It just drifts. When your inlet pressure swings — pig, compressor start, whatever — the differential pressure changes and the pump slows down or speeds up. Nobody tells you. Check it.',
      unlockCondition: 'notice-kimray-drift',
      unlocked: false
    },
    {
      id: 'fn-011',
      category: 'DEHYDRATION',
      title: 'Over-Circulation',
      text: 'Running the Kimray too fast feels safe. More glycol, more water removal, right? Wrong. Over-circulation causes TEG carryover into the gas stream. You lose glycol inventory, contaminate downstream, and the efficiency drop shows up two hours later when you can\'t figure out why your numbers are off.',
      unlockCondition: 'detect-teg-carryover',
      unlocked: false
    },
    {
      id: 'fn-012',
      category: 'DEHYDRATION',
      title: 'BTEX Clock',
      text: 'The BTEX unit must be running whenever the still is venting. That\'s not a guideline. That\'s EPA. The clock starts the moment that pilot goes out. You have maybe 15 minutes before it becomes a compliance event that follows you forever. Check your pilot every round.',
      unlockCondition: 'relight-btex-fast',
      unlocked: false
    },

    // ---- CRYOGENIC NOTES ----
    {
      id: 'fn-020',
      category: 'CRYOGENIC',
      title: 'Rate, Not Value',
      text: 'The cold box doesn\'t care what temperature you\'re at. It cares how fast you\'re getting there. Brazed aluminum plate-fin exchangers crack from thermal shock, not from temperature. Your rate-of-change is your most important number during any transition.',
      unlockCondition: 'mode-switch-no-damage',
      unlocked: false
    },
    {
      id: 'fn-021',
      category: 'CRYOGENIC',
      title: 'The 15-Minute Ghost',
      text: 'When the hot oil system goes down, nothing happens for 15-30 minutes. Everything looks fine. The gas is still dry, the cold box is still cold, the expander is still spinning. Then it all starts to unravel at once. That 15 minutes is either your window to fix it or your runway to disaster.',
      unlockCondition: 'catch-hotoil-early',
      unlocked: false
    },
    {
      id: 'fn-022',
      category: 'CRYOGENIC',
      title: 'Pre-Position',
      text: 'Before you start or stop a residue compressor, pre-position the expander. If you don\'t, the suction swing will trip the expander and now you have two problems instead of one. Sequence matters. Always.',
      unlockCondition: 'comp-start-no-trip',
      unlocked: false
    },
    {
      id: 'fn-023',
      category: 'CRYOGENIC',
      title: 'Mystery Efficiency',
      text: 'If your recovery is dropping and nothing on the board explains it, check the cold box damage history. You might have cracked a fin during a mode switch three shifts ago and nobody noticed. The brazed aluminum remembers everything.',
      unlockCondition: 'discover-hidden-damage',
      unlocked: false
    },
    {
      id: 'fn-024',
      category: 'CRYOGENIC',
      title: 'Weather Watch',
      text: 'Your weather widget isn\'t decoration. A 20-degree ambient drop with rain will swing your refrigeration condenser load in 15 minutes. Your cryo temps follow. If you see a storm coming and don\'t pre-adjust, you\'ll be chasing boards for the next hour.',
      unlockCondition: 'preempt-weather',
      unlocked: false
    },
    {
      id: 'fn-025',
      category: 'CRYOGENIC',
      title: 'Three-Plant Zen',
      text: 'Running three plants simultaneously isn\'t about speed. It\'s about triage. Every minute, you\'re deciding which plant needs you most. The one that\'s quiet is the one about to go wrong. The one that\'s alarming might be fine if you leave it in auto. Trust the cascade. Watch the trends.',
      unlockCondition: 'three-plant-shift',
      unlocked: false
    },

    // ---- INSTRUMENT NOTES ----
    {
      id: 'fn-030',
      category: 'INSTRUMENTS',
      title: 'The Dead Thermocouple',
      text: 'A thermocouple that reads flat is the most dangerous instrument in the plant. It\'s not alarming. It\'s not moving. It just stopped. The real temperature is doing something and nobody knows what. Cross-check your redundant instruments. Every round.',
      unlockCondition: 'detect-frozen-instrument',
      unlocked: false
    },
    {
      id: 'fn-031',
      category: 'INSTRUMENTS',
      title: 'Instrument Air',
      text: 'Your instrument air system is the most important thing nobody thinks about until it\'s gone. Every pneumatic valve in the plant draws from that mainline. When it goes, valves start failing to their last position — some open, some closed. The plant unravels asymmetrically. Know your fail-safe positions before you need them.',
      unlockCondition: 'survive-air-loss',
      unlocked: false
    },

    // ---- H2S / AMINE NOTES ----
    {
      id: 'fn-040',
      category: 'H2S / AMINE',
      title: 'Wind Sock',
      text: 'Before you walk toward an H2S alarm, check the wind sock. Every single time. If the wind is blowing the gas toward you, you go around. This is not optional. This is not a suggestion. People have died walking the wrong direction.',
      unlockCondition: 'check-wind-h2s',
      unlocked: false
    },
    {
      id: 'fn-041',
      category: 'H2S / AMINE',
      title: 'Corrosion Memory',
      text: 'Amine chemistry is a slow game. Run your reboiler too hot for a week and you won\'t see the corrosion for a month. Run your pH out of range and the piping starts to thin. By the time you find it, you\'re looking at a $50,000 repair and a shutdown. Monitor your chemistry like it\'s the long game — because it is.',
      unlockCondition: 'maintain-amine-chemistry',
      unlocked: false
    },

    // ---- GENERAL OPERATIONS ----
    {
      id: 'fn-050',
      category: 'OPERATIONS',
      title: 'The Plant Talks',
      text: 'The plant tells you something is wrong before it goes wrong. A trend arrow changing direction. A noise that wasn\'t there last round. A value that\'s technically in spec but drifting. The job isn\'t reacting to alarms. The job is hearing what the plant is telling you before the alarm fires.',
      unlockCondition: 'preempt-3-events',
      unlocked: false
    },
    {
      id: 'fn-051',
      category: 'OPERATIONS',
      title: 'False Alarm Fatigue',
      text: 'After the third false LEL alarm this shift, you start to slow down. You stop rushing. You assume it\'s another false. That\'s when the real one hits. False alarm fatigue has killed more operators than any single equipment failure. Treat every alarm like it\'s real until proven otherwise.',
      unlockCondition: 'respond-real-after-false',
      unlocked: false
    }
  ],

  /**
   * Check if a note should be unlocked based on game state
   */
  checkUnlocks(gameState) {
    // Simple unlock logic — production version would track specific achievements
    const unlocked = [];
    for (const note of this.notes) {
      if (!note.unlocked) {
        // For MVP, unlock based on progression milestones
        if (gameState.stabilizerComplete && note.category === 'STABILIZER') {
          note.unlocked = true;
          unlocked.push(note);
        }
        if (gameState.refrigerationComplete && (note.category === 'DEHYDRATION' || note.category === 'INSTRUMENTS')) {
          note.unlocked = true;
          unlocked.push(note);
        }
        if (gameState.cryogenicComplete && note.category === 'CRYOGENIC') {
          note.unlocked = true;
          unlocked.push(note);
        }
        if (gameState.amineComplete && note.category === 'H2S / AMINE') {
          note.unlocked = true;
          unlocked.push(note);
        }
      }
    }
    return unlocked;
  },

  /**
   * Get all unlocked notes
   */
  getUnlocked() {
    return this.notes.filter(n => n.unlocked);
  },

  /**
   * Get notes by category
   */
  getByCategory(category) {
    return this.notes.filter(n => n.category === category && n.unlocked);
  },

  /**
   * Force-unlock a note by ID
   */
  unlock(id) {
    const note = this.notes.find(n => n.id === id);
    if (note) {
      note.unlocked = true;
      return note;
    }
    return null;
  },

  /**
   * Save unlock state
   */
  toJSON() {
    return this.notes.filter(n => n.unlocked).map(n => n.id);
  },

  /**
   * Load unlock state
   */
  loadJSON(unlockedIds) {
    if (!unlockedIds) return;
    for (const id of unlockedIds) {
      const note = this.notes.find(n => n.id === id);
      if (note) note.unlocked = true;
    }
  }
};

window.FieldNotes = FieldNotes;
