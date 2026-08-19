import * as THREE from 'three';
import { CONFIG } from '../config/gameConfig.js';

/**
 * MiniBoss - Floating Sentinel Boss with laser barrages, rotating ring, and dynamic hover pattern.
 * v2: снаряды вылетают из пушек и летят к игроку, зарядка + muzzle flash,
 *     каскад взрывов при смерти с падением и затуханием.
 */
export class MiniBoss {
  constructor(scene, particles, audio) {
    this.scene = scene;
    this.particles = particles;
    this.audio = audio;
    this.active = false;
    this.dying = false;
    this.hp = 100;
    this.maxHp = 100;
    this.name = 'SKY SENTINEL';
    this.group = new THREE.Group();
    this.zDistance = 32;
    this.time = 0;
    this.attackTimer = 0;
    this.bossProjectiles = [];
    this.deathTimer = 0;
    this.deathExplosionInterval = 0;
    this.chargeFlash = 0; // 0..1 — вспышка зарядки перед выстрелом
    this.eyeFlashTimer = 0; // таймер вспышки глаза при уроне

    this.buildModel();
    this.scene.add(this.group);
    this.group.visible = false;
  }

  buildModel() {
    // === Core (основной корпус) ===
    const coreGeo = new THREE.OctahedronGeometry(1.6, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
      flatShading: true,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.4
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    // Внутреннее светящееся ядро (просвечивает сквозь корпус)
    const innerCoreGeo = new THREE.OctahedronGeometry(0.7, 0);
    this.innerCoreMat = new THREE.MeshBasicMaterial({ color: 0xffe600, transparent: true, opacity: 0.9 });
    this.innerCore = new THREE.Mesh(innerCoreGeo, this.innerCoreMat);
    this.innerCore.position.set(0, 0, 0.2);
    this.group.add(this.innerCore);

    // === Rotating Torus Ring (внешнее кольцо) ===
    const ringGeo = new THREE.TorusGeometry(2.4, 0.2, 6, 16);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      flatShading: true,
      emissive: 0x0f172a,
      emissiveIntensity: 0.3
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(this.ring);

    // Светящееся кольцо-энергия (внутри внешнего)
    const energyRingGeo = new THREE.TorusGeometry(2.0, 0.06, 6, 24);
    this.energyRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
    this.energyRing = new THREE.Mesh(energyRingGeo, this.energyRingMat);
    this.energyRing.rotation.x = Math.PI / 2;
    this.group.add(this.energyRing);

    // === Dual Plasma Cannons (боковые пушки) ===
    const cannonGeo = new THREE.BoxGeometry(0.4, 0.4, 1.2);
    const cannonMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      emissive: 0x78350f,
      emissiveIntensity: 0.5
    });
    this.cannonL = new THREE.Mesh(cannonGeo, cannonMat);
    this.cannonL.position.set(-1.8, 0, 0);
    this.cannonR = new THREE.Mesh(cannonGeo, cannonMat);
    this.cannonR.position.set(1.8, 0, 0);
    this.group.add(this.cannonL);
    this.group.add(this.cannonR);

    // Светящиеся наконечники пушек
    const tipGeo = new THREE.ConeGeometry(0.18, 0.3, 6);
    tipGeo.rotateX(Math.PI / 2);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
    this.cannonTipL = new THREE.Mesh(tipGeo, tipMat);
    this.cannonTipL.position.set(-1.8, 0, -0.7);
    this.cannonTipR = new THREE.Mesh(tipGeo, tipMat);
    this.cannonTipR.position.set(1.8, 0, -0.7);
    this.group.add(this.cannonTipL);
    this.group.add(this.cannonTipR);

    // === Side Wing Panels (боковые крылья) ===
    const wingGeo = new THREE.BoxGeometry(0.8, 0.1, 1.6);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.5,
      flatShading: true
    });
    this.wingL = new THREE.Mesh(wingGeo, wingMat);
    this.wingL.position.set(-2.6, 0.2, 0);
    this.wingL.rotation.z = 0.2;
    this.wingR = new THREE.Mesh(wingGeo, wingMat);
    this.wingR.position.set(2.6, 0.2, 0);
    this.wingR.rotation.z = -0.2;
    this.group.add(this.wingL);
    this.group.add(this.wingR);

    // Светящиеся кромки крыльев
    const wingGlowGeo = new THREE.BoxGeometry(0.8, 0.04, 0.1);
    const wingGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.wingGlowL = new THREE.Mesh(wingGlowGeo, wingGlowMat);
    this.wingGlowL.position.set(-2.6, 0.2, 0.8);
    this.wingGlowR = new THREE.Mesh(wingGlowGeo, wingGlowMat);
    this.wingGlowR.position.set(2.6, 0.2, 0.8);
    this.group.add(this.wingGlowL);
    this.group.add(this.wingGlowR);

    // === Lower Emitter (нижний излучатель) ===
    const emitterGeo = new THREE.ConeGeometry(0.5, 0.8, 6);
    emitterGeo.rotateX(Math.PI);
    this.emitterMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 });
    this.emitter = new THREE.Mesh(emitterGeo, this.emitterMat);
    this.emitter.position.set(0, -1.6, 0);
    this.group.add(this.emitter);

    // === Eye Visor (пульсирующее свечение) ===
    const eyeGeo = new THREE.SphereGeometry(0.5, 8, 8);
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true });
    this.eye = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.eye.position.set(0, 0, -1.2);
    this.group.add(this.eye);

    // === Muzzle flash lights (невидимые, для вспышки при выстреле) ===
    this.muzzleL = new THREE.PointLight(0xf59e0b, 0, 6);
    this.muzzleL.position.set(-1.8, 0, -0.6);
    this.group.add(this.muzzleL);
    this.muzzleR = new THREE.PointLight(0xf59e0b, 0, 6);
    this.muzzleR.position.set(1.8, 0, -0.6);
    this.group.add(this.muzzleR);
  }

  spawn(playerZ, biomeIndex = 0, level = 1) {
    this.active = true;
    this.dying = false;
    this.level = level;
    // HP растёт с уровнем
    this.maxHp = 100 + (level - 1) * CONFIG.LEVEL_BOSS_HP_BONUS;
    this.hp = this.maxHp;
    this.time = 0;
    this.attackTimer = 1.5;
    this.deathTimer = 0;
    this.chargeFlash = 0;
    this.eyeFlashTimer = 0;
    this.group.visible = true;

    const names = ['SKY SENTINEL', 'SOLAR ANNIHILATOR', 'FROST DREADNOUGHT', 'MAGMA BEHEMOTH'];
    this.name = names[biomeIndex % names.length];

    this.group.position.set(0, 2.5, playerZ + this.zDistance);
    this.audio.playSound('boss_alarm');
  }

  takeDamage(amount) {
    if (!this.active || this.dying) return false;
    this.hp -= amount;
    // Вспышка при попадании — частицы на позиции попадания (по центру босса)
    this.particles.spawn(
      this.group.position.x + (Math.random() - 0.5) * 2,
      this.group.position.y + (Math.random() - 0.5) * 2,
      this.group.position.z,
      8,
      0xf59e0b,
      5,
      0.2,
      0.4,
      'spark'
    );
    // Краткая вспышка глаза при уроне
    this.eyeMat.color.setHex(0xffffff);
    this.eyeFlashTimer = 0.08;

    if (this.hp <= 0) {
      this.hp = 0;
      this.defeat();
      return true;
    }
    return false;
  }

  defeat() {
    // Запускаем каскадную анимацию смерти (не выключаем active сразу —
    // Game даст награду, когда active станет false после анимации)
    this.dying = true;
    this.deathTimer = 0;
    this.deathExplosionInterval = 0;
    this.audio.playSound('crash');

    // Первый мощный взрыв в центре
    this.spawnBigExplosion(this.group.position.x, this.group.position.y, this.group.position.z, 0xef4444, 30);

    // Убираем активные снаряды босса
    for (const p of this.bossProjectiles) {
      this.scene.remove(p.mesh);
    }
    this.bossProjectiles = [];
  }

  spawnBigExplosion(x, y, z, color, count) {
    this.particles.spawn(x, y, z, count, color, 8, 0.35, 0.8, 'sphere', 3);
    this.particles.spawn(x, y, z, Math.floor(count * 0.6), 0xffe600, 10, 0.15, 0.5, 'spark', 2);
  }

  updateDeath(dt) {
    this.deathTimer += dt;
    this.deathExplosionInterval -= dt;

    // Каскад взрывов каждые ~0.12с в случайных точках вокруг босса
    if (this.deathExplosionInterval <= 0) {
      this.deathExplosionInterval = 0.12;
      const colors = [0xef4444, 0xf59e0b, 0xffe600, 0xdc2626];
      const col = colors[Math.floor(Math.random() * colors.length)];
      const ox = (Math.random() - 0.5) * 3;
      const oy = (Math.random() - 0.5) * 3;
      const oz = (Math.random() - 0.5) * 2;
      this.spawnBigExplosion(
        this.group.position.x + ox,
        this.group.position.y + oy,
        this.group.position.z + oz,
        col,
        12
      );
    }

    // Падение вниз с вращением
    this.group.position.y -= 6 * dt;
    this.group.rotation.x += 4 * dt;
    this.group.rotation.z += 3 * dt;
    this.group.scale.multiplyScalar(Math.max(0.2, 1 - dt * 1.2));

    // Затухание материалов
    const fade = Math.max(0, 1 - this.deathTimer / 1.6);
    this.core.material.emissiveIntensity = 0.4 * fade;
    this.eyeMat.opacity = fade;
    this.eyeMat.transparent = true;

    // Конец анимации
    if (this.deathTimer >= 1.6) {
      this.active = false;
      this.dying = false;
      this.group.visible = false;
      this.group.scale.set(1, 1, 1);
      this.group.rotation.set(0, 0, 0);
      // Финальный мощный взрыв
      this.spawnBigExplosion(this.group.position.x, this.group.position.y, this.group.position.z, 0xffe600, 40);
    }
  }

  update(dt, player, onPlayerHit) {
    if (!this.active) return;
    this.time += dt;

    // Анимация смерти — отдельная ветка, босс не атакует
    if (this.dying) {
      this.updateDeath(dt);
      return;
    }

    // Follow pacing ahead of player
    const targetZ = player.z + this.zDistance;
    this.group.position.z = targetZ;

    // Sine hover motion across lanes
    const hoverX = Math.sin(this.time * 1.8) * (CONFIG.LANE_WIDTH * 1.1);
    const hoverY = 2.5 + Math.cos(this.time * 2.5) * 0.8;
    this.group.position.x += (hoverX - this.group.position.x) * 6 * dt;
    this.group.position.y += (hoverY - this.group.position.y) * 6 * dt;

    // Mesh Rotations
    this.core.rotation.y += 1.5 * dt;
    this.ring.rotation.z += 2.0 * dt;
    this.ring.rotation.x = Math.sin(this.time) * 0.3;

    // Внутреннее ядро вращается в противофазе
    this.innerCore.rotation.y -= 2.5 * dt;
    this.innerCore.rotation.z += 1.5 * dt;
    // Пульсация внутреннего ядра
    const innerPulse = 0.8 + Math.sin(this.time * 5) * 0.2;
    this.innerCore.scale.setScalar(innerPulse);

    // Энергетическое кольцо вращается и пульсирует
    this.energyRing.rotation.z += 1.2 * dt;
    this.energyRing.rotation.x = Math.PI / 2 + Math.sin(this.time * 2) * 0.2;
    this.energyRingMat.opacity = 0.5 + Math.sin(this.time * 4) * 0.2;

    // Крылья слегка покачиваются
    this.wingL.rotation.z = 0.2 + Math.sin(this.time * 3) * 0.1;
    this.wingR.rotation.z = -0.2 - Math.sin(this.time * 3) * 0.1;

    // Нижний излучатель пульсирует
    this.emitterMat.opacity = 0.5 + Math.sin(this.time * 6) * 0.3;
    this.emitter.scale.setScalar(1 + Math.sin(this.time * 6) * 0.15);

    // Пульсация глаза (свечение) — пропускаем, если активна вспышка урона
    if (this.eyeFlashTimer > 0) {
      this.eyeFlashTimer -= dt;
      if (this.eyeFlashTimer <= 0) this.eyeMat.color.setHex(0xfacc15);
    } else {
      const eyePulse = 0.7 + Math.sin(this.time * 6) * 0.3;
      this.eyeMat.color.setHex(0xfacc15).multiplyScalar(eyePulse);
    }
    this.eye.scale.setScalar(1 + Math.sin(this.time * 8) * 0.1);

    // Auto-fire player blaster when in boss combat
    player.shootCooldown -= dt;
    if (player.shootCooldown <= 0) {
      player.shootBlaster();
      player.shootCooldown = 0.28;
    }

    // Boss Attack Timer (скорость атак растёт с уровнем)
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      const level = this.level || 1;
      const attackSpeedBonus = 1 + (level - 1) * CONFIG.LEVEL_BOSS_ATTACK_BONUS;
      this.attackTimer = 1.6 / attackSpeedBonus;
      this.fireAttack(player);
    }

    // Затухание muzzle flash
    this.muzzleL.intensity = Math.max(0, this.muzzleL.intensity - 30 * dt);
    this.muzzleR.intensity = Math.max(0, this.muzzleR.intensity - 30 * dt);

    // Check Player projectiles hitting Boss
    const bossHitbox = {
      minX: this.group.position.x - 2.2,
      maxX: this.group.position.x + 2.2,
      minY: this.group.position.y - 1.8,
      maxY: this.group.position.y + 1.8,
      minZ: this.group.position.z - 1.5,
      maxZ: this.group.position.z + 1.5
    };

    for (let i = player.projectiles.length - 1; i >= 0; i--) {
      const p = player.projectiles[i];
      const pPos = p.mesh.position;
      if (
        pPos.x >= bossHitbox.minX &&
        pPos.x <= bossHitbox.maxX &&
        pPos.y >= bossHitbox.minY &&
        pPos.y <= bossHitbox.maxY &&
        pPos.z >= bossHitbox.minZ &&
        pPos.z <= bossHitbox.maxZ
      ) {
        this.takeDamage(12);
        this.scene.remove(p.mesh);
        player.projectiles.splice(i, 1);
      }
    }

    // Check Boss Projectiles hitting Player
    const pHitbox = player.getHitbox();
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const bp = this.bossProjectiles[i];
      // Снаряд летит по своему вектору направления (из пушки к игроку)
      bp.mesh.position.x += bp.vx * dt;
      bp.mesh.position.y += bp.vy * dt;
      bp.mesh.position.z += bp.vz * dt;
      bp.mesh.rotation.y += 5 * dt;
      bp.life -= dt;

      const pos = bp.mesh.position;
      if (
        pos.z <= pHitbox.maxZ &&
        pos.z >= pHitbox.minZ &&
        pos.x >= pHitbox.minX &&
        pos.x <= pHitbox.maxX &&
        pos.y >= pHitbox.minY &&
        pos.y <= pHitbox.maxY
      ) {
        this.scene.remove(bp.mesh);
        this.bossProjectiles.splice(i, 1);
        onPlayerHit();
      } else if (pos.z < player.z - 10 || bp.life <= 0) {
        this.scene.remove(bp.mesh);
        this.bossProjectiles.splice(i, 1);
      }
    }
  }

  fireAttack(player) {
    // Снаряд вылетает из пушки босса и летит к текущей позиции игрока
    const side = Math.random() < 0.5 ? -1 : 1;
    const cannon = side < 0 ? this.cannonL : this.cannonR;
    const muzzle = side < 0 ? this.muzzleL : this.muzzleR;

    // Стартовая позиция — из дула пушки (в мировых координатах)
    const startX = this.group.position.x + cannon.position.x;
    const startY = this.group.position.y + cannon.position.y;
    const startZ = this.group.position.z + cannon.position.z - 0.6;

    // Цель — текущая позиция игрока (по центру массы)
    const targetX = player.x;
    const targetY = player.y + 0.9;
    const targetZ = player.z;

    // Направление от пушки к игроку
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dz = targetZ - startZ;
    const len = Math.hypot(dx, dy, dz) || 1;
    const speed = 42;

    const geo = new THREE.DodecahedronGeometry(0.5, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(startX, startY, startZ);
    this.scene.add(mesh);
    this.bossProjectiles.push({
      mesh,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      vz: (dz / len) * speed,
      life: 2.5
    });

    // Muzzle flash — вспышка света и частицы из дула
    muzzle.intensity = 2.5;
    this.particles.spawn(startX, startY, startZ, 6, 0xf59e0b, 4, 0.15, 0.25, 'spark', 0);

    this.audio.playSound('laser');
  }
}
