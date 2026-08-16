/**
 * Daily mission configurations and helper generators.
 */
export const QUESTS_CONFIG = [
  {
    id: 0,
    title: 'Run 600 Meters',
    target: 600,
    unit: 'm',
    reward: 120,
    getValue: (saveData) => Math.floor(saveData.bestDistance)
  },
  {
    id: 1,
    title: 'Collect 80 Gold Coins',
    target: 80,
    unit: '$',
    reward: 150,
    getValue: (saveData) => saveData.totalCoins
  },
  {
    id: 2,
    title: 'Perform 15 Gravity Flips',
    target: 15,
    unit: 'flips',
    reward: 100,
    getValue: (saveData) => saveData.totalGravityFlips
  }
];
