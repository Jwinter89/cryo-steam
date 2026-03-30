# Cold Creek — Gas Plant Simulator

**Free, browser-based gas plant operator training simulator.**
Built by a cryogenic plant operator with 10 years of experience.

**[Play Now — gasplantsim.com](https://gasplantsim.com)**

---

## What Is This?

Cold Creek simulates operating a natural gas processing facility from a DCS (Distributed Control System) console. You manage real-time PID control loops, respond to process alarms, recover from upset conditions, and optimize NGL recovery.

There was no good training tool for gas plant operators. Textbooks teach theory. They don't teach you how to recover a turboexpander after a surge event at 2 AM. So I built one.

## Facilities

| Tier | Facility | Key Systems |
|------|----------|-------------|
| 1 | **Stabilizer** | Reboiler control, RVP management, condensate tanks, pig arrivals |
| 2 | **Refrigeration Plant** | TEG dehydration, Kimray glycol pump, BTEX compliance, propane refrigeration loop, NGL recovery |
| 3 | **Cryogenic Plant** | 110 MMcfd facility — turboexpander/recompressor, mol sieve dehy, amine treating (H2S), cold box, demethanizer, NGL fractionation |

## Game Modes

- **Learn** — Guided P&ID walkthroughs, no failure state. Built for students.
- **Operate** — Full shift simulation with real-time P&L tracking.
- **Crisis** — Timed upset recovery. Compressor trips, mol sieve breakthroughs, turboexpander surge. Gold/silver/bronze medals.
- **Optimize** — Maximize NGL recovery efficiency. Competitive leaderboard scoring.

## Features

- Real DCS-style PID faceplates (auto / manual / cascade)
- Interactive P&ID diagrams for every system
- Realistic upset scenarios based on actual field incidents
- Career progression — unlock facilities, earn achievements
- Per-facility leaderboards (Firebase-backed)
- P&L tracking based on NGL recovery and product spec compliance
- Daily login streaks and challenges
- Color-blind mode and accessibility support
- PWA — installable, works offline
- Mobile-optimized with touch support

## Tech Stack

- Vanilla JavaScript (no framework)
- Single-page application
- Progressive Web App (service worker, manifest)
- Firebase Realtime Database (leaderboards)
- Firebase Anonymous Auth (security)
- Stripe Checkout ($2.99 ad-free option)
- Google AdSense
- Capacitor (iOS native wrapper)
- Deployed on Vercel

## Who Is This For?

- **Power engineering students** studying for their 4th class ticket
- **New plant operators** building their mental model before going on shift
- **Training programs** looking for a free, zero-setup supplement
- **Experienced operators** who want a refresher or just want to see their plant on screen
- **Anyone curious** about what "running the board" actually means

## Run Locally

```bash
git clone https://github.com/Jwinter89/cryo_gas_plant.git
cd cryo_gas_plant
# Open index.html in a browser — that's it
# No build step required for development
```

For Capacitor (iOS):
```bash
npm install
npm run build
npx cap sync ios
npx cap open ios
```

## Support the Project

- [Buy Me a Coffee](https://buymeacoffee.com/GasPlantSim)
- Go ad-free for $2.99 (in-app)
- Share with someone studying for their ticket

## Built By

**[Winter Howlers](https://www.winterhowlers.com)** — A gas plant operator who taught himself to code.

*"The plant tells you something is wrong before it goes wrong. The job is learning to listen."*
