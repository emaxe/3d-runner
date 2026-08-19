import { CONFIG } from '../config/gameConfig.js';
import { BIOMES } from '../config/biomes.js';
import { SKINS } from '../config/skins.js';
import { ACHIEVEMENTS } from '../config/achievements.js';

import { StorageService } from '../services/StorageService.js';
import { AudioService } from '../services/AudioService.js';
import { InputService } from '../services/InputService.js';

import { Engine } from './Engine.js';
import { CameraManager } from './CameraManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { CollisionSystem } from './CollisionSystem.js';

import { Player } from '../entities/Player.js';
import { MiniBoss } from '../entities/MiniBoss.js';
import { LevelGenerator } from '../entities/LevelGenerator.js';

import { UIManager } from '../ui/UIManager.js';

/**
 * Game - Main application coordinator, state machine, and animation loop runner.
 */
export class Game {
  constructor() {
    // 1. Core Services
    this.storage = new StorageService();
    this.audio = new AudioService();
    this.input = new InputService();

    // 2. Engine & Systems
    this.engine = new Engine();
    this.cameraManager = new CameraManager(this.engine.camera);
    this.particles = new ParticleSystem(this.engine.scene);
    this.collision = new CollisionSystem(this);

    // 3. Game Entities
    this.player = new Player(this.engine.scene, this.particles, this.audio);
    this.boss = new MiniBoss(this.engine.scene, this.particles, this.audio);
    this.levelGen = new LevelGenerator(this.engine.scene, this.particles, this.audio);

    // 4. UI Manager
    this.ui = new UIManager(this);

    // 5. Game State variables
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
    this.runSpeed = CONFIG.INITIAL_SPEED;
    this.distance = 0;
    this.score = 0;
    this.coinsGathered = 0;
    this.nextBossDistance = CONFIG.BOSS_INTERVAL_METERS;
    this.nextBiomeDistance = CONFIG.BIOME_INTERVAL_METERS;
    this.currentBiomeIndex = 0;
    this.level = 1; // текущий уровень (растёт после каждого босса)

    // 6. Bind Input to Player actions
    this.bindInputs();

    // 7. Apply Settings
    this.applySavedSettings();
    this.setMenuState();

    // 8. Start RAF Loop
    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  bindInputs() {
    this.input.setHandlers({
      onMoveLeft: () => {
        if (this.state === 'PLAYING') this.player.setLane(this.player.currentLane - 1);
      },
      onMoveRight: () => {
        if (this.state === 'PLAYING') this.player.setLane(this.player.currentLane + 1);
      },
      onJumpStart: () => {
        if (this.state === 'PLAYING') this.player.jump(true);
      },
      onJumpEnd: () => {
        if (this.state === 'PLAYING') this.player.jump(false);
      },
      onSlide: () => {
        if (this.state === 'PLAYING') this.player.slide();
      },
      onGravityFlip: () => {
        if (this.state === 'PLAYING') {
          this.player.flipGravity();
          this.storage.data.totalGravityFlips++;
        }
      },
      onNitro: () => {
        if (this.state === 'PLAYING') {
          if (this.player.nitroEnergy >= CONFIG.NITRO_ENERGY_REQ) {
            this.player.activateNitro();
            this.storage.data.totalNitroUsed++;
          }
        }
      },
      onPauseToggle: () => {
        if (this.state === 'PLAYING') this.pauseGame();
        else if (this.state === 'PAUSED') this.resumeGame();
      }
    });

    // Bind virtual buttons
    this.input.bindVirtualButtons({
      jump: document.getElementById('touch-btn-jump'),
      slide: document.getElementById('touch-btn-slide'),
      gravity: document.getElementById('touch-btn-gravity'),
      nitro: document.getElementById('touch-btn-nitro')
    });
  }

  applySavedSettings() {
    const s = this.storage.data.settings;
    this.audio.setSfxVolume(s.sfxVolume / 100);
    this.audio.setMusicVolume(s.musicVolume / 100);
    this.engine.setQuality(s.quality || 'high');

    const touchOverlay = document.getElementById('hud-touch-controls');
    if (touchOverlay) {
      touchOverlay.style.display = s.hideTouchControls ? 'none' : (s.showTouchControls ? 'flex' : 'none');
    }

    const skin = SKINS.find((sk) => sk.id === this.storage.data.selectedSkin) || SKINS[0];
    this.player.model.applySkin(skin);
    const skinNameEl = document.getElementById('menu-skin-name');
    if (skinNameEl) skinNameEl.textContent = skin.name;
  }

  setMenuState() {
    this.state = 'MENU';
    this.player.reset();
    this.player.model.group.position.set(0, 0.9, 0);
    this.cameraManager.setupMenu();
    this.ui.updateMenuStats();
  }

  startGame() {
    this.state = 'PLAYING';
    this.runSpeed = CONFIG.INITIAL_SPEED;
    this.distance = 0;
    this.score = 0;
    this.coinsGathered = 0;
    this.nextBossDistance = CONFIG.BOSS_INTERVAL_METERS;
    this.nextBiomeDistance = CONFIG.BIOME_INTERVAL_METERS;
    this.currentBiomeIndex = 0;
    this.level = 1;
    const hasStartShield = (this.storage.data.upgrades.shield_start || 0) > 0;
    this.player.reset(hasStartShield);

    // Boost: Head start
    if (this.storage.data.boosts.head_start) {
      this.distance = 250;
      this.player.z = 250;
      this.storage.data.boosts.head_start = false;
      this.storage.save();
      this.ui.showAlert('HEAD START ACTIVATED!', 'Launched +250m ahead');
    }

    // Boost: Score multiplier
    if (this.storage.data.boosts.score_booster) {
      this.player.multiplierTimer = 999999;
      this.storage.data.boosts.score_booster = false;
      this.storage.save();
      this.ui.showAlert('PERMANENT 2X ACTIVE!', 'Double score during run');
    }

    this.levelGen.initTrack();
    this.levelGen.setBiome(0);
    this.engine.setBiomeVisuals(BIOMES[0]);

    // UI screen switches
    document.getElementById('menu-screen')?.classList.add('hidden');
    document.getElementById('gameover-screen')?.classList.add('hidden');
    document.getElementById('pause-screen')?.classList.add('hidden');
    document.getElementById('hud-screen')?.classList.remove('hidden');

    this.audio.startMusic();
    this.audio.playSound('powerup');
  }

  /**
   * Переход на следующий уровень после убийства босса.
   * Игрок продолжает бежать, но сложность растёт: скорость выше,
   * препятствий больше, следующий босс ближе и сильнее.
   */
  startNextLevel() {
    this.level++;
    this.boss.active = false;

    // Следующий босс — через уменьшенный интервал (но не меньше минимума)
    const interval = Math.max(
      CONFIG.LEVEL_MIN_BOSS_INTERVAL,
      CONFIG.BOSS_INTERVAL_METERS - (this.level - 1) * CONFIG.LEVEL_BOSS_INTERVAL_DECREASE
    );
    this.nextBossDistance = this.distance + interval;

    // Уведомление о новом уровне
    this.ui.showAlert(`LEVEL ${this.level}!`, 'Speed Up & More Obstacles');
    this.audio.playSound('powerup');
    this.cameraManager.shake(0.3);
  }

  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    document.getElementById('pause-screen')?.classList.remove('hidden');
    this.audio.stopMusic();
  }

  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    document.getElementById('pause-screen')?.classList.add('hidden');
    this.audio.startMusic();
  }

  gameOver() {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    this.audio.stopMusic();
    this.audio.playSound('crash');
    this.cameraManager.shake(1.2);

    // Trigger explosive impact particles & ragdoll tumble
    this.particles.spawn(this.player.x, this.player.y, this.player.z, 35, 0xef4444, 10, 0.35, 0.8);
    this.particles.spawn(this.player.x, this.player.y, this.player.z, 20, 0xf59e0b, 7, 0.25, 0.6);
    this.player.startDeathTumble(this.runSpeed);

    // Save statistics & highscore
    this.storage.data.runsCompleted++;
    this.storage.data.totalCoins += this.coinsGathered;
    this.storage.data.coins += this.coinsGathered;
    this.storage.updateBestDistance(this.distance);
    this.checkAchievements();

    setTimeout(() => {
      this.ui.showGameOver(this.distance, this.score, this.coinsGathered, this.storage.data.bestDistance);
    }, 1800);
  }

  onPlayerHitObstacle(obs) {
    if (this.player.invulnerableTimer > 0 || this.player.isNitroActive) {
      // Smashed obstacle
      this.score += 150 * this.player.combo;
      this.ui.showAlert('SMASHED!', 'Obstacle Destroyed');
      this.audio.playSound('hit');
      this.cameraManager.shake(0.25);
      if (obs && obs.mesh) {
        this.particles.spawn(obs.mesh.position.x, obs.mesh.position.y, obs.mesh.position.z, 15, 0xf59e0b, 6);
      }
      return;
    }

    if (this.player.hasShield) {
      // Shield Absorbed Hit
      this.player.hasShield = false;
      this.player.invulnerableTimer = 1.0;
      this.audio.playSound('hit');
      this.cameraManager.shake(0.35);
      this.particles.spawn(this.player.x, this.player.y + 0.9, this.player.z, 20, 0x38bdf8, 6);
      this.ui.showAlert('SHIELD BROKEN!', 'Damage Absorbed');
      return;
    }

    // Fatal crash
    this.gameOver();
  }

  collectCoin(coin) {
    coin.active = false;
    coin.mesh.visible = false;
    const multiplierLevel = this.storage.data.upgrades.coin_multiplier || 0;
    const baseVal = 1 + multiplierLevel;
    const val = coin.isGravBonus ? baseVal * 2 : baseVal;
    this.coinsGathered += val;
    this.player.nitroEnergy = Math.min(CONFIG.NITRO_MAX_ENERGY, this.player.nitroEnergy + (coin.isGravBonus ? 5.0 : 3.0));
    this.score += (coin.isGravBonus ? 50 : 25) * this.player.combo;
    this.audio.playSound('coin');

    const particleColor = coin.isGravBonus ? 0xa855f7 : 0xfbbf24;
    this.particles.spawn(
      coin.mesh.position.x,
      coin.mesh.position.y,
      coin.mesh.position.z,
      coin.isGravBonus ? 10 : 6,
      particleColor,
      3,
      0.2,
      0.35
    );

    // Occasional confetti burst on coin pickup
    if (Math.random() < 0.12) {
      const confettiColors = [0x00f0ff, 0xff007f, 0xffe600, 0x00ff66, 0x9d00ff, 0xffffff];
      for (let ci = 0; ci < 8; ci++) {
        this.particles.spawn(
          coin.mesh.position.x,
          coin.mesh.position.y,
          coin.mesh.position.z,
          1,
          confettiColors[Math.floor(Math.random() * confettiColors.length)],
          3 + Math.random() * 2,
          0.1,
          0.5,
          'sphere',
          2
        );
      }
    }

    // Combo streak
    this.player.comboScoreStreak++;
    if (this.player.comboScoreStreak >= 10 && this.player.combo < 10) {
      this.player.combo++;
      this.player.comboScoreStreak = 0;
      if (this.player.combo > this.storage.data.maxComboReached) {
        this.storage.data.maxComboReached = this.player.combo;
        this.storage.save();
      }
      this.ui.showAlert(`COMBO x${this.player.combo}!`, 'Multiplier Boost');
    }
  }

  collectPowerup(p) {
    p.active = false;
    p.mesh.visible = false;
    this.audio.playSound('powerup');
    this.particles.spawn(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, 15, 0x38bdf8, 5);

    const magnetLevel = this.storage.data.upgrades.magnet_boost || 0;

    switch (p.type) {
      case 'shield':
        this.player.hasShield = true;
        this.ui.showAlert('ENERGY SHIELD', 'Protected against 1 hit');
        break;
      case 'magnet':
        this.player.magnetTimer = 8.0 + magnetLevel * 2.5;
        this.ui.showAlert('COIN MAGNET', 'Drawing nearby gold');
        break;
      case 'multiplier':
        this.player.multiplierTimer = 12.0;
        this.ui.showAlert('2x SCORE', 'Double score active');
        break;
      case 'slowmo':
        this.player.slowmoTimer = 5.0;
        this.ui.showAlert('CHRONO SLOW', 'Time slowed down');
        break;
    }
  }

  checkAchievements() {
    for (const ach of ACHIEVEMENTS) {
      if (!this.storage.data.achievementsClaimed.includes(ach.id)) {
        const currentVal = this.storage.data[ach.key] || 0;
        if (currentVal >= ach.target) {
          // Available to claim in modal
        }
      }
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastFrameTime) * 0.001);
    this.lastFrameTime = timestamp;

    if (this.state === 'PLAYING') {
      // 1. Progressive speed increase (базовая скорость растёт с уровнем)
      const levelSpeedBonus = Math.min(
        CONFIG.LEVEL_MAX_SPEED_BONUS,
        (this.level - 1) * CONFIG.LEVEL_SPEED_BONUS
      );
      this.runSpeed = Math.min(CONFIG.MAX_SPEED + levelSpeedBonus, this.runSpeed + CONFIG.SPEED_ACCELERATION * dt);

      let effectiveSpeed = this.runSpeed;
      if (this.player.isNitroActive) effectiveSpeed *= CONFIG.NITRO_SPEED_MULTIPLIER;
      if (this.player.slowmoTimer > 0) effectiveSpeed *= 0.55;

      // 2. Audio Tempo Sync
      this.audio.setMusicTempo(effectiveSpeed);

      // 3. Player Forward Movement & Score
      const deltaZ = effectiveSpeed * dt;
      this.player.z += deltaZ;
      this.distance += deltaZ;

      const scoreRate = 10 * (this.player.multiplierTimer > 0 ? 2 : 1) * this.player.combo;
      this.score += scoreRate * dt;

      // 4. Update Subsystems
      this.player.update(dt, effectiveSpeed);
      this.input.setOnCeiling(this.player.gravityDirection === -1);
      this.levelGen.update(this.player.z, this.level);
      this.particles.update(dt);
      this.collision.update(dt);

      // 4b. Speed lines at high velocity
      if (effectiveSpeed > 24 && Math.random() < 0.3) {
        this.particles.spawn(
          this.player.x + (Math.random() - 0.5) * 6,
          this.player.y + (Math.random() - 0.5) * 4,
          this.player.z - 8 - Math.random() * 6,
          1,
          Math.random() > 0.5 ? 0x38bdf8 : 0xff007f,
          0,
          0.06,
          0.25,
          'spark',
          0
        );
      }
      if (this.player.isNitroActive && Math.random() < 0.5) {
        this.particles.spawn(
          this.player.x + (Math.random() - 0.5) * 6,
          this.player.y + (Math.random() - 0.5) * 4,
          this.player.z - 8 - Math.random() * 6,
          1,
          0xffe600,
          0,
          0.08,
          0.3,
          'spark',
          0
        );
      }

      // 5. Biome Transitions
      if (this.distance >= this.nextBiomeDistance) {
        this.currentBiomeIndex = (this.currentBiomeIndex + 1) % BIOMES.length;
        this.nextBiomeDistance += CONFIG.BIOME_INTERVAL_METERS;
        this.levelGen.setBiome(this.currentBiomeIndex);
        const biome = BIOMES[this.currentBiomeIndex];
        this.engine.setBiomeVisuals(biome);
        this.ui.showAlert(`ENTERING: ${biome.name.toUpperCase()}`, 'Biome Transition');
      }

      // 6. Mini-Boss Encounter Spawning & Combat
      if (this.distance >= this.nextBossDistance && !this.boss.active) {
        this.boss.spawn(this.player.z, this.currentBiomeIndex, this.level);
        this.nextBossDistance += CONFIG.BOSS_INTERVAL_METERS;
        this.ui.showAlert('WARNING: BOSS DETECTED!', this.boss.name);
        this.audio.bossMusicMode = true;
      }

      if (this.boss.active) {
        this.boss.update(dt, this.player, () => this.onPlayerHitObstacle());
        if (!this.boss.active) {
          // Boss Defeated Reward
          this.audio.bossMusicMode = false;
          this.storage.data.bossesDefeated++;
          this.coinsGathered += 100;
          this.score += 2000 * this.player.combo;
          this.player.hasShield = true;
          this.player.nitroEnergy = CONFIG.NITRO_MAX_ENERGY;
          this.ui.showAlert('BOSS DEFEATED!', '+100 Coins & Shield Boost');
          this.cameraManager.shake(0.6);
          // Confetti celebration
          const confettiColors = [0x00f0ff, 0xff007f, 0xffe600, 0x00ff66, 0x9d00ff, 0xffffff];
          for (let ci = 0; ci < 30; ci++) {
            this.particles.spawn(
              this.player.x + (Math.random() - 0.5) * 4,
              this.player.y + 2 + Math.random() * 2,
              this.player.z,
              1,
              confettiColors[Math.floor(Math.random() * confettiColors.length)],
              3 + Math.random() * 3,
              0.12,
              0.6,
              'sphere',
              2
            );
          }
          // Новый уровень: снова долгий забег с препятствиями, затем следующий босс
          this.startNextLevel();
        }
      }

      // 7. Dynamic Camera
      this.cameraManager.update(dt, this.player, this.player.isNitroActive);

      // 8. Update HUD
      this.ui.updateHUD(this.distance, this.coinsGathered, this.player, this.boss, this.level);
    } else if (this.state === 'GAMEOVER') {
      const dtSlow = dt * 0.75;
      this.player.updateDeath(dtSlow);
      this.particles.update(dtSlow);
      this.cameraManager.updateDeath(dtSlow, this.player);
    } else if (this.state === 'MENU') {
      const t = timestamp * 0.001;
      this.player.model.group.rotation.y = t * 1.2;
      this.player.model.animate({ isGrounded: true }, t, 0.4);
    }

    this.engine.render();
    requestAnimationFrame((t) => this.loop(t));
  }
}
