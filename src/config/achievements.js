/**
 * Achievements milestones, conditions, and rewards.
 */
export const ACHIEVEMENTS = [
  {
    id: 'first_run',
    name: 'Cadet Launch',
    desc: 'Complete your first run',
    reward: 50,
    target: 1,
    key: 'runsCompleted'
  },
  {
    id: 'dist_500',
    name: 'Distance Runner',
    desc: 'Reach 500 meters in a single run',
    reward: 100,
    target: 500,
    key: 'bestDistance'
  },
  {
    id: 'dist_1500',
    name: 'Hyper Marathon',
    desc: 'Reach 1,500 meters in a single run',
    reward: 300,
    target: 1500,
    key: 'bestDistance'
  },
  {
    id: 'coins_100',
    name: 'Coin Collector',
    desc: 'Collect 100 total gold coins',
    reward: 80,
    target: 100,
    key: 'totalCoins'
  },
  {
    id: 'coins_1000',
    name: 'Treasure Tycoon',
    desc: 'Collect 1,000 total gold coins',
    reward: 400,
    target: 1000,
    key: 'totalCoins'
  },
  {
    id: 'gravity_50',
    name: 'Newton Defier',
    desc: 'Perform 50 gravity flips',
    reward: 120,
    target: 50,
    key: 'totalGravityFlips'
  },
  {
    id: 'boss_1',
    name: 'Boss Slayer',
    desc: 'Defeat your first Mini-Boss',
    reward: 150,
    target: 1,
    key: 'bossesDefeated'
  },
  {
    id: 'boss_5',
    name: 'Drone Nemesis',
    desc: 'Defeat 5 Mini-Bosses',
    reward: 500,
    target: 5,
    key: 'bossesDefeated'
  },
  {
    id: 'nitro_20',
    name: 'Speed Demon',
    desc: 'Activate Nitro Boost 20 times',
    reward: 120,
    target: 20,
    key: 'totalNitroUsed'
  },
  {
    id: 'combo_5',
    name: 'Flow State',
    desc: 'Reach a 5x Combo Multiplier',
    reward: 150,
    target: 5,
    key: 'maxComboReached'
  }
];
