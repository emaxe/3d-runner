/**
 * StorageService - Manages game persistence via LocalStorage with schema validation and fallback memory store.
 */
export class StorageService {
  constructor() {
    this.key = 'lowpoly_rush_savedata_v2';
    this.data = this.getDefaults();
    this.load();
  }

  getDefaults() {
    return {
      coins: 0,
      bestDistance: 0,
      runsCompleted: 0,
      totalCoins: 0,
      totalGravityFlips: 0,
      bossesDefeated: 0,
      totalNitroUsed: 0,
      maxComboReached: 1,
      selectedSkin: 'cyber',
      unlockedSkins: ['cyber'],
      upgrades: {
        shield_start: 0,
        magnet_boost: 0,
        nitro_eff: 0,
        coin_multiplier: 0
      },
      boosts: {
        head_start: false,
        score_booster: false
      },
      achievementsClaimed: [],
      questDate: '',
      questClaimed: [false, false, false],
      settings: {
        sfxVolume: 80,
        musicVolume: 70,
        quality: 'high', // 'low', 'med', 'high'
        showTouchControls: true,
        hideTouchControls: false
      }
    };
  }

  load() {
    try {
      // Check for v2 or v1 migration
      let raw = localStorage.getItem(this.key);
      if (!raw) {
        // Migration check from v1
        const legacy = localStorage.getItem('lowpoly_rush_savedata_v1');
        if (legacy) {
          raw = legacy;
        }
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        const defaults = this.getDefaults();
        this.data = {
          ...defaults,
          ...parsed,
          upgrades: { ...defaults.upgrades, ...(parsed.upgrades || {}) },
          boosts: { ...defaults.boosts, ...(parsed.boosts || {}) },
          settings: { ...defaults.settings, ...(parsed.settings || {}) }
        };
      }
    } catch (e) {
      console.warn('[StorageService] Failed to load localStorage data, fallback to defaults:', e);
      this.data = this.getDefaults();
    }
  }

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (e) {
      console.warn('[StorageService] Failed to save localStorage data:', e);
    }
  }

  reset() {
    this.data = this.getDefaults();
    this.save();
  }

  addCoins(amount) {
    this.data.coins += amount;
    this.data.totalCoins += amount;
    this.save();
  }

  updateBestDistance(dist) {
    if (dist > this.data.bestDistance) {
      this.data.bestDistance = dist;
      this.save();
      return true;
    }
    return false;
  }
}
