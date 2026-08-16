/**
 * Upgrades and consumables list for the shop.
 */
export const UPGRADES = [
  {
    id: 'shield_start',
    name: 'Guardian Shield',
    desc: 'Start each run with an energy shield',
    maxLevel: 3,
    costs: [100, 250, 600],
    icon: '🛡️'
  },
  {
    id: 'magnet_boost',
    name: 'Coin Magnetizer',
    desc: 'Increase magnet radius and duration',
    maxLevel: 4,
    costs: [75, 180, 400, 900],
    icon: '🧲'
  },
  {
    id: 'nitro_eff',
    name: 'Hyper Nitro Tank',
    desc: 'Nitro fills faster & boosts longer',
    maxLevel: 4,
    costs: [90, 220, 500, 1000],
    icon: '⚡'
  },
  {
    id: 'coin_multiplier',
    name: 'Gold Alchemy',
    desc: 'Increase value of gathered coins',
    maxLevel: 3,
    costs: [150, 400, 1000],
    icon: '💰'
  }
];

export const BOOSTS = [
  {
    id: 'head_start',
    name: 'Rocket Head Start',
    desc: 'Launch 250m ahead on next run',
    cost: 100,
    icon: '🚀'
  },
  {
    id: 'score_booster',
    name: 'Score Multiplier x2',
    desc: 'Permanent 2x score multiplier for next run',
    cost: 150,
    icon: '⭐'
  }
];
