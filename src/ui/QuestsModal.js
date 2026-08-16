import { QUESTS_CONFIG } from '../config/quests.js';

/**
 * QuestsModal - Handles daily quests list and reward claims.
 */
export class QuestsModal {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('quests-list');
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    for (const q of QUESTS_CONFIG) {
      const isClaimed = this.game.storage.data.questClaimed[q.id];
      const cur = q.getValue(this.game.storage.data);
      const progress = Math.min(100, Math.floor((cur / q.target) * 100));
      const canClaim = !isClaimed && cur >= q.target;

      const itemEl = document.createElement('div');
      itemEl.className =
        'p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex justify-between items-center';
      itemEl.innerHTML = `
        <div class="flex-1 pr-4">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-white font-gaming text-lg">${q.title}</span>
            <span class="text-xs text-emerald-400 font-bold">+${q.reward} $</span>
          </div>
          <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div class="h-full bg-emerald-400 rounded-full" style="width: ${progress}%;"></div>
          </div>
        </div>
        <div>
          ${
            isClaimed
              ? `<span class="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs">CLAIMED</span>`
              : canClaim
              ? `<button class="btn-claim-quest px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-gaming text-base font-black hover:bg-emerald-400 animate-pulse active:scale-95" data-id="${q.id}" data-reward="${q.reward}">CLAIM</button>`
              : `<span class="text-xs text-slate-500 font-bold">${cur}/${q.target}</span>`
          }
        </div>
      `;
      this.container.appendChild(itemEl);
    }

    this.container.querySelectorAll('.btn-claim-quest').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const qId = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        const reward = parseInt(e.currentTarget.getAttribute('data-reward'), 10);
        this.game.storage.data.questClaimed[qId] = true;
        this.game.storage.data.coins += reward;
        this.game.storage.save();
        this.game.audio.playSound('coin');
        this.game.ui.updateMenuStats();
        this.render();
      });
    });
  }
}
