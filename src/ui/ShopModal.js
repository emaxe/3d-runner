import { UPGRADES, BOOSTS } from '../config/upgrades.js';
import { SKINS } from '../config/skins.js';

/**
 * ShopModal - Handles rendering and transactions for upgrades, skins, and single-run boosts.
 */
export class ShopModal {
  constructor(game) {
    this.game = game;
    this.modalEl = document.getElementById('shop-modal');
    this.container = document.getElementById('shop-items-container');
    this.currentTab = 'upgrades';

    this.initTabs();
  }

  initTabs() {
    const tabUpgrades = document.getElementById('tab-btn-upgrades');
    const tabSkins = document.getElementById('tab-btn-skins');
    const tabBoosts = document.getElementById('tab-btn-boosts');

    if (tabUpgrades) {
      tabUpgrades.addEventListener('click', () => {
        this.switchTab('upgrades', tabUpgrades);
      });
    }
    if (tabSkins) {
      tabSkins.addEventListener('click', () => {
        this.switchTab('skins', tabSkins);
      });
    }
    if (tabBoosts) {
      tabBoosts.addEventListener('click', () => {
        this.switchTab('boosts', tabBoosts);
      });
    }
  }

  switchTab(tab, tabEl) {
    this.currentTab = tab;
    const tabIds = ['tab-btn-upgrades', 'tab-btn-skins', 'tab-btn-boosts'];
    tabIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.className =
          'px-4 py-1.5 rounded-xl font-gaming text-lg font-bold text-slate-400 hover:text-slate-200 transition';
      }
    });

    if (tabEl) {
      tabEl.className =
        'px-4 py-1.5 rounded-xl font-gaming text-lg font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 transition';
    }
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';
    const coins = this.game.storage.data.coins;

    const coinsCounter = document.getElementById('shop-coins-counter');
    if (coinsCounter) coinsCounter.textContent = coins;

    if (this.currentTab === 'upgrades') {
      this.renderUpgrades(coins);
    } else if (this.currentTab === 'skins') {
      this.renderSkins(coins);
    } else if (this.currentTab === 'boosts') {
      this.renderBoosts(coins);
    }
  }

  renderUpgrades(coins) {
    for (const up of UPGRADES) {
      const currentLevel = this.game.storage.data.upgrades[up.id] || 0;
      const isMax = currentLevel >= up.maxLevel;
      const cost = isMax ? 0 : up.costs[currentLevel];
      const canAfford = coins >= cost;

      const itemEl = document.createElement('div');
      itemEl.className =
        'p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex justify-between items-center';
      itemEl.innerHTML = `
        <div class="flex items-center space-x-3">
          <span class="text-3xl">${up.icon}</span>
          <div>
            <div class="font-bold text-white font-gaming text-lg">
              ${up.name} <span class="text-cyan-400 text-sm">Lv.${currentLevel}/${up.maxLevel}</span>
            </div>
            <div class="text-xs text-slate-400">${up.desc}</div>
          </div>
        </div>
        <div>
          ${
            isMax
              ? `<span class="px-3 py-1.5 rounded-xl bg-slate-800 text-emerald-400 font-bold text-xs">MAXED</span>`
              : `<button class="btn-buy-upgrade px-4 py-2 rounded-xl font-gaming text-base font-bold transition ${
                  canAfford
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }" data-id="${up.id}" ${canAfford ? '' : 'disabled'}>
                  ${cost} $
                </button>`
          }
        </div>
      `;
      this.container.appendChild(itemEl);
    }

    this.container.querySelectorAll('.btn-buy-upgrade').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const upId = e.currentTarget.getAttribute('data-id');
        const up = UPGRADES.find((u) => u.id === upId);
        const currentLevel = this.game.storage.data.upgrades[upId] || 0;
        const cost = up.costs[currentLevel];

        if (this.game.storage.data.coins >= cost) {
          this.game.storage.data.coins -= cost;
          this.game.storage.data.upgrades[upId] = currentLevel + 1;
          this.game.storage.save();
          this.game.audio.playSound('powerup');
          this.game.ui.updateMenuStats();
          this.render();
        }
      });
    });
  }

  renderSkins(coins) {
    for (const skin of SKINS) {
      const isUnlocked = this.game.storage.data.unlockedSkins.includes(skin.id);
      const isSelected = this.game.storage.data.selectedSkin === skin.id;
      const canAfford = coins >= skin.price;

      const itemEl = document.createElement('div');
      itemEl.className =
        'p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex justify-between items-center';
      itemEl.innerHTML = `
        <div>
          <div class="font-bold text-white font-gaming text-lg">${skin.name}</div>
          <div class="text-xs text-slate-400">${isUnlocked ? 'Unlocked' : `Requires ${skin.price} $`}</div>
        </div>
        <div>
          ${
            isSelected
              ? `<span class="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-xs">EQUIPPED</span>`
              : isUnlocked
              ? `<button class="btn-equip-skin px-4 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-gaming text-sm font-bold active:scale-95" data-id="${skin.id}">EQUIP</button>`
              : `<button class="btn-buy-skin px-4 py-2 rounded-xl font-gaming text-base font-bold transition ${
                  canAfford
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }" data-id="${skin.id}" ${canAfford ? '' : 'disabled'}>
                  BUY ${skin.price} $
                </button>`
          }
        </div>
      `;
      this.container.appendChild(itemEl);
    }

    this.container.querySelectorAll('.btn-buy-skin').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const skinId = e.currentTarget.getAttribute('data-id');
        const skin = SKINS.find((s) => s.id === skinId);
        if (this.game.storage.data.coins >= skin.price) {
          this.game.storage.data.coins -= skin.price;
          this.game.storage.data.unlockedSkins.push(skinId);
          this.game.storage.data.selectedSkin = skinId;
          this.game.storage.save();
          this.game.player.model.applySkin(skin);
          this.game.audio.playSound('powerup');
          this.game.ui.updateMenuStats();
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.btn-equip-skin').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const skinId = e.currentTarget.getAttribute('data-id');
        const skin = SKINS.find((s) => s.id === skinId);
        this.game.storage.data.selectedSkin = skinId;
        this.game.storage.save();
        this.game.player.model.applySkin(skin);
        this.render();
      });
    });
  }

  renderBoosts(coins) {
    for (const b of BOOSTS) {
      const hasBoost = this.game.storage.data.boosts[b.id];
      const canAfford = coins >= b.cost;

      const itemEl = document.createElement('div');
      itemEl.className =
        'p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex justify-between items-center';
      itemEl.innerHTML = `
        <div class="flex items-center space-x-3">
          <span class="text-3xl">${b.icon}</span>
          <div>
            <div class="font-bold text-white font-gaming text-lg">${b.name}</div>
            <div class="text-xs text-slate-400">${b.desc}</div>
          </div>
        </div>
        <div>
          ${
            hasBoost
              ? `<span class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs">ACTIVE FOR NEXT RUN</span>`
              : `<button class="btn-buy-boost px-4 py-2 rounded-xl font-gaming text-base font-bold transition ${
                  canAfford
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }" data-id="${b.id}" ${canAfford ? '' : 'disabled'}>
                  ${b.cost} $
                </button>`
          }
        </div>
      `;
      this.container.appendChild(itemEl);
    }

    this.container.querySelectorAll('.btn-buy-boost').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const bId = e.currentTarget.getAttribute('data-id');
        const boost = BOOSTS.find((b) => b.id === bId);
        if (this.game.storage.data.coins >= boost.cost) {
          this.game.storage.data.coins -= boost.cost;
          this.game.storage.data.boosts[bId] = true;
          this.game.storage.save();
          this.game.audio.playSound('powerup');
          this.game.ui.updateMenuStats();
          this.render();
        }
      });
    });
  }
}
