import * as THREE from 'three';
import { CONFIG } from '../config/gameConfig.js';

/**
 * MiniBoss - Floating Sentinel Boss with laser barrages, rotating ring, and dynamic hover pattern.
 */
export class MiniBoss {
  constructor(scene, particles, audio) {
    this.scene = scene;
    this.particles = particles;
    this.audio = audio;
    this.active = false;
    this.hp = 100;
    this.maxHp = 100;
    this.name = 'SKY SENTINEL';
    this.group = new THREE.Group();
    this.zDistance = 32;
    this.time = 0;
    this.attackTimer = 0;
    this.bossProjectiles = [];

    this.buildModel();
    this.scene.add(this.group);
    this.group.visible = false;
  }

  buildModel() {
    // Core
    const coreGeo = new THREE.OctahedronGeometry(1.6, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
      flatShading: true
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    // Rotating Torus Ring
    const ringGeo = new THREE.TorusGeometry(2.4, 0.2, 6, 16);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      flatShading: true
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(this.ring);

    // Dual Plasma Cannons
    const cannonGeo = new THREE.BoxGeometry(0.4, 0.4, 1.2);
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
    this.cannonL = new THREE.Mesh(cannonGeo, cannonMat);
    this.cannonL.position.set(-1.8, 0, 0);
    this.cannonR = new THREE.Mesh(cannonGeo, cannonMat);
    this.cannonR.position.set(1.8, 0, 0);
    this.group.add(this.cannonL);
    this.group.add(this.cannonR);

    // Eye Visor
    const eyeGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.eye = new THREE.Mesh(eyeGeo, eyeMat);
    this.eye.position.set(0, 0, -1.2);
    this.group.add(this.eye);
  }

  spawn(playerZ, biomeIndex = 0) {
    this.active = true;
    this.hp = 100;
    this.maxHp = 100;
    this.time = 0;
    this.attackTimer = 1.5;
    this.group.visible = true;

    const names = ['SKY SENTINEL', 'SOLAR ANNIHILATOR', 'FROST DREADNOUGHT', 'MAGMA BEHEMOTH'];
    this.name = names[biomeIndex % names.length];

    this.group.position.set(0, 2.5, playerZ + this.zDistance);
    this.audio.playSound('boss_alarm');
  }

  takeDamage(amount) {
    if (!this.active) return false;
    this.hp -= amount;
    this.particles.spawn(
      this.group.position.x,
      this.group.position.y,
      this.group.position.z,
      10,
      0xf59e0b,
      5
    );

    if (this.hp <= 0) {
      this.hp = 0;
      this.defeat();
      return true;
    }
    return false;
  }

  defeat() {
    this.active = false;
    this.group.visible = false;
    this.particles.spawn(
      this.group.position.x,
      this.group.position.y,
      this.group.position.z,
      40,
      0xef4444,
      10,
      0.4,
      1.2
    );
    this.audio.playSound('crash');

    // Clean active projectiles
    for (const p of this.bossProjectiles) {
      this.scene.remove(p.mesh);
    }
    this.bossProjectiles = [];
  }

  update(dt, player, onPlayerHit) {
    if (!this.active) return;
    this.time += dt;

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

    // Auto-fire player blaster when in boss combat
    player.shootCooldown -= dt;
    if (player.shootCooldown <= 0) {
      player.shootBlaster();
      player.shootCooldown = 0.28;
    }

    // Boss Attack Timer
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = 1.6;
      this.fireAttack(player);
    }

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
      bp.mesh.position.z -= bp.speed * dt;
      bp.mesh.rotation.y += 5 * dt;

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
      } else if (pos.z < player.z - 10) {
        this.scene.remove(bp.mesh);
        this.bossProjectiles.splice(i, 1);
      }
    }
  }

  fireAttack(player) {
    const geo = new THREE.DodecahedronGeometry(0.5, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const mesh = new THREE.Mesh(geo, mat);

    // Aim toward player target lane
    mesh.position.set(player.targetX, player.y + 0.9, this.group.position.z - 2);
    this.scene.add(mesh);
    this.bossProjectiles.push({ mesh, speed: 28 });
    this.audio.playSound('laser');
  }
}
