import { ACHIEVEMENTS } from '../config/achievements.js';

/**
 * AchievementsModal - Renders achievements progress and handles reward collection.
 */
export class AchievementsModal {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('achievements-list');
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    for (const ach of ACHIEVEMENTS) {
      const isClaimed = this.game.storage.data.achievementsClaimed.includes(ach.id);
      const currentVal = this.game.storage.data[ach.key] || 0;
      const progress = Math.min(100, Math.floor((currentVal / ach.target) * 100));
      const canClaim = !isClaimed && currentVal >= ach.target;

      const itemEl = document.createElement('div');
      itemEl.className =
        'p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex justify-between items-center';
      itemEl.innerHTML = `
        <div class="flex-1 pr-4">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-white font-gaming text-lg">${ach.name}</span>
            <span class="text-xs text-amber-400 font-bold">+${ach.reward} $</span>
          </div>
          <div class="text-xs text-slate-400 mb-1.5">${ach.desc}</div>
          <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-cyan-400 rounded-full" style="width: ${progress}%;"></div>
          </div>
        </div>
        <div>
          ${
            isClaimed
              ? `<span class="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs">CLAIMED</span>`
              : canClaim
              ? `<button class="btn-claim-ach px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-gaming text-base font-black hover:bg-cyan-400 animate-pulse active:scale-95" data-id="${ach.id}" data-reward="${ach.reward}">CLAIM</button>`
              : `<span class="text-xs text-slate-500 font-bold">${currentVal}/${ach.target}</span>`
          }
        </div>
      `;
      this.container.appendChild(itemEl);
    }

    this.container.querySelectorAll('.btn-claim-ach').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const achId = e.currentTarget.getAttribute('data-id');
        const reward = parseInt(e.currentTarget.getAttribute('data-reward'), 10);
        this.game.storage.data.achievementsClaimed.push(achId);
        this.game.storage.data.coins += reward;
        this.game.storage.save();
        this.game.audio.playSound('coin');
        this.game.ui.updateMenuStats();
        this.render();
      });
    });
  }
}
