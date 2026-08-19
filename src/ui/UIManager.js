import { SKINS } from '../config/skins.js';
import { ShopModal } from './ShopModal.js';
import { AchievementsModal } from './AchievementsModal.js';
import { QuestsModal } from './QuestsModal.js';
import { SettingsModal } from './SettingsModal.js';

/**
 * UIManager - High-level UI orchestrator managing all HUD indicators, screen transitions, and modals.
 */
export class UIManager {
  constructor(game) {
    this.game = game;

    // Sub-modal controllers
    this.shop = new ShopModal(game);
    this.achievements = new AchievementsModal(game);
    this.quests = new QuestsModal(game);
    this.settings = new SettingsModal(game);

    this.alertTimeout = null;
    this.currentSkinIndex = 0;

    this.initScreensAndButtons();
    this.initSkinSelector();
    this.initModals();
  }

  initScreensAndButtons() {
    // Menu buttons
    const btnPlay = document.getElementById('btn-play-game');
    if (btnPlay) btnPlay.addEventListener('click', () => this.game.startGame());

    const btnPause = document.getElementById('btn-pause-game');
    if (btnPause) btnPause.addEventListener('click', () => this.game.pauseGame());

    const btnResume = document.getElementById('btn-resume-game');
    if (btnResume) btnResume.addEventListener('click', () => this.game.resumeGame());

    const btnRestart = document.getElementById('btn-restart-game');
    if (btnRestart) btnRestart.addEventListener('click', () => this.game.startGame());

    const btnPauseMenu = document.getElementById('btn-pause-menu');
    if (btnPauseMenu) {
      btnPauseMenu.addEventListener('click', () => {
        document.getElementById('pause-screen')?.classList.add('hidden');
        document.getElementById('hud-screen')?.classList.add('hidden');
        document.getElementById('menu-screen')?.classList.remove('hidden');
        this.game.setMenuState();
      });
    }

    const btnGameOverMenu = document.getElementById('btn-gameover-menu');
    if (btnGameOverMenu) {
      btnGameOverMenu.addEventListener('click', () => {
        document.getElementById('gameover-screen')?.classList.add('hidden');
        document.getElementById('menu-screen')?.classList.remove('hidden');
        this.game.setMenuState();
      });
    }

    const btnGameOverRetry = document.getElementById('btn-gameover-retry');
    if (btnGameOverRetry) btnGameOverRetry.addEventListener('click', () => this.game.startGame());
  }

  initSkinSelector() {
    const savedSkinId = this.game.storage.data.selectedSkin;
    const foundIdx = SKINS.findIndex((s) => s.id === savedSkinId);
    if (foundIdx >= 0) this.currentSkinIndex = foundIdx;

    const updateDisplay = () => {
      const skin = SKINS[this.currentSkinIndex];
      const skinNameEl = document.getElementById('menu-skin-name');
      if (skinNameEl) skinNameEl.textContent = skin.name;
      this.game.player.model.applySkin(skin);
      this.game.storage.data.selectedSkin = skin.id;
      this.game.storage.save();
    };

    const btnPrevSkin = document.getElementById('btn-prev-skin');
    const btnNextSkin = document.getElementById('btn-next-skin');

    if (btnPrevSkin) {
      btnPrevSkin.addEventListener('click', () => {
        this.currentSkinIndex = (this.currentSkinIndex - 1 + SKINS.length) % SKINS.length;
        updateDisplay();
      });
    }

    if (btnNextSkin) {
      btnNextSkin.addEventListener('click', () => {
        this.currentSkinIndex = (this.currentSkinIndex + 1) % SKINS.length;
        updateDisplay();
      });
    }
  }

  initModals() {
    const bindModal = (openBtnId, closeBtnId, modalId, onOpen) => {
      const openBtn = document.getElementById(openBtnId);
      const closeBtn = document.getElementById(closeBtnId);
      const modal = document.getElementById(modalId);

      if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
          modal.classList.remove('hidden');
          if (onOpen) onOpen();
        });
      }
      if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
          modal.classList.add('hidden');
          this.updateMenuStats();
        });
      }
    };

    bindModal('btn-open-shop', 'btn-close-shop', 'shop-modal', () => this.shop.render());
    document.getElementById('btn-done-shop')?.addEventListener('click', () => {
      document.getElementById('shop-modal')?.classList.add('hidden');
      this.updateMenuStats();
    });

    bindModal('btn-open-achievements', 'btn-close-achievements', 'achievements-modal', () =>
      this.achievements.render()
    );
    document.getElementById('btn-done-achievements')?.addEventListener('click', () => {
      document.getElementById('achievements-modal')?.classList.add('hidden');
    });

    bindModal('btn-open-quests', 'btn-close-quests', 'quests-modal', () => this.quests.render());
    document.getElementById('btn-done-quests')?.addEventListener('click', () => {
      document.getElementById('quests-modal')?.classList.add('hidden');
    });

    bindModal('btn-open-settings', 'btn-close-settings', 'settings-modal');
    document.getElementById('btn-done-settings')?.addEventListener('click', () => {
      document.getElementById('settings-modal')?.classList.add('hidden');
    });

    bindModal('btn-open-tutorial', 'btn-close-tutorial', 'tutorial-modal');
    document.getElementById('btn-done-tutorial')?.addEventListener('click', () => {
      document.getElementById('tutorial-modal')?.classList.add('hidden');
    });
  }

  updateMenuStats() {
    const coinsEl = document.getElementById('menu-coins');
    const highscoreEl = document.getElementById('menu-highscore');
    const shopCoinsEl = document.getElementById('shop-coins-counter');

    if (coinsEl) coinsEl.textContent = this.game.storage.data.coins;
    if (highscoreEl) highscoreEl.textContent = `${Math.floor(this.game.storage.data.bestDistance)} m`;
    if (shopCoinsEl) shopCoinsEl.textContent = this.game.storage.data.coins;
  }

  showAlert(title, subtitle) {
    const banner = document.getElementById('hud-alert-banner');
    const titleEl = document.getElementById('hud-alert-title');
    const subEl = document.getElementById('hud-alert-sub');
    if (!banner || !titleEl || !subEl) return;

    titleEl.textContent = title;
    subEl.textContent = subtitle;

    // Shift to top when running on floor, shift to bottom when running on ceiling
    const isFloor = this.game.player.gravityDirection === 1;
    if (isFloor) {
      banner.style.top = '74px';
      banner.style.bottom = 'auto';
    } else {
      banner.style.top = 'auto';
      banner.style.bottom = '96px';
    }

    banner.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
    banner.classList.add('opacity-100', 'scale-100');

    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      banner.classList.remove('opacity-100', 'scale-100');
      banner.classList.add('opacity-0', 'scale-90');
    }, 1400);
  }

  updateHUD(distance, coins, player, boss, level = 1) {
    // Distance & Multiplier
    const distEl = document.getElementById('hud-distance');
    if (distEl) {
      distEl.innerHTML = `${Math.floor(distance)} <span class="text-lg text-cyan-400 font-normal">m</span>`;
    }

    const levelEl = document.getElementById('hud-level');
    if (levelEl) levelEl.textContent = level;

    const coinsEl = document.getElementById('hud-coins');
    if (coinsEl) coinsEl.textContent = coins;

    const multEl = document.getElementById('hud-multiplier');
    if (multEl) multEl.textContent = `x${player.combo}`;

    // Nitro Bar
    const nitroFill = document.getElementById('hud-nitro-fill');
    if (nitroFill) nitroFill.style.width = `${player.nitroEnergy}%`;

    const nitroReady = document.getElementById('hud-nitro-ready');
    if (nitroReady) {
      if (player.isNitroActive) {
        nitroReady.textContent = 'BOOSTING!';
        nitroReady.className =
          'text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-amber-500/30 text-amber-300 rounded border border-amber-500/60 animate-pulse';
      } else if (player.nitroEnergy >= 30) {
        nitroReady.textContent = 'READY [F]';
        nitroReady.className =
          'text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/40';
      } else {
        nitroReady.textContent = 'CHARGING';
        nitroReady.className =
          'text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-slate-700/40 text-slate-400 rounded border border-slate-700';
      }
    }

    // Boss Bar
    const bossContainer = document.getElementById('hud-boss-bar-container');
    if (bossContainer) {
      if (boss && boss.active) {
        bossContainer.classList.remove('hidden');
        const bossNameEl = document.getElementById('hud-boss-name');
        if (bossNameEl) bossNameEl.textContent = `BOSS: ${boss.name}`;

        const pct = Math.max(0, Math.floor((boss.hp / boss.maxHp) * 100));
        const bossHpText = document.getElementById('hud-boss-hp-text');
        if (bossHpText) bossHpText.textContent = `${pct}%`;

        const bossHpFill = document.getElementById('hud-boss-hp-fill');
        if (bossHpFill) bossHpFill.style.width = `${pct}%`;
      } else {
        bossContainer.classList.add('hidden');
      }
    }

    // Powerups List
    const pList = document.getElementById('hud-powerups-list');
    if (pList) {
      let html = '';
      if (player.hasShield) {
        html += `<div class="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-gaming flex items-center space-x-1"><span>🛡️</span><span>SHIELD</span></div>`;
      }
      if (player.magnetTimer > 0) {
        html += `<div class="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold font-gaming flex items-center space-x-1"><span>🧲</span><span>${Math.ceil(
          player.magnetTimer
        )}s</span></div>`;
      }
      if (player.multiplierTimer > 0) {
        html += `<div class="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-gaming flex items-center space-x-1"><span>⭐ x2</span><span>${Math.ceil(
          player.multiplierTimer
        )}s</span></div>`;
      }
      if (player.slowmoTimer > 0) {
        html += `<div class="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-gaming flex items-center space-x-1"><span>⏳ SLOW</span><span>${Math.ceil(
          player.slowmoTimer
        )}s</span></div>`;
      }
      pList.innerHTML = html;
    }
  }

  showGameOver(distance, score, coinsGathered, bestDistance) {
    document.getElementById('hud-screen')?.classList.add('hidden');
    document.getElementById('gameover-screen')?.classList.remove('hidden');

    const distEl = document.getElementById('gameover-dist');
    const scoreEl = document.getElementById('gameover-score');
    const coinsEl = document.getElementById('gameover-coins');
    const bestEl = document.getElementById('gameover-best');

    if (distEl) distEl.textContent = `${Math.floor(distance)} m`;
    if (scoreEl) scoreEl.textContent = Math.floor(score);
    if (coinsEl) coinsEl.textContent = `+${coinsGathered} $`;
    if (bestEl) bestEl.textContent = `${Math.floor(bestDistance)} m`;

    this.updateMenuStats();
  }
}
