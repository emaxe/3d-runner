import * as THREE from 'three';
import { CONFIG } from '../config/gameConfig.js';

/**
 * ParticleSystem - High-performance object-pooled particle emitter for 3D visual FX.
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    this.mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.9
    });

    // Pre-allocate particle pool
    for (let i = 0; i < CONFIG.PARTICLE_POOL_SIZE; i++) {
      const p = new THREE.Mesh(this.geo, this.mat.clone());
      p.visible = false;
      p.active = false;
      p.velocity = new THREE.Vector3();
      p.life = 0;
      p.maxLife = 1;
      p.baseScale = 1;
      this.scene.add(p);
      this.particles.push(p);
    }
  }

  spawn(x, y, z, count = 8, color = 0x06b6d4, speed = 4, size = 0.25, life = 0.5) {
    let spawned = 0;
    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.visible = true;
        p.position.set(x, y, z);
        p.material.color.setHex(color);
        p.material.opacity = 1;
        p.life = life;
        p.maxLife = life;
        p.baseScale = size;
        p.scale.set(size, size, size);

        p.velocity.set(
          (Math.random() - 0.5) * speed,
          (Math.random() - 0.5) * speed + 1,
          (Math.random() - 0.5) * speed
        );
        spawned++;
      }
    }
  }

  update(dt) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          p.visible = false;
        } else {
          p.position.addScaledVector(p.velocity, dt);
          const progress = p.life / p.maxLife;
          p.material.opacity = progress;
          const s = p.baseScale * progress;
          p.scale.set(s, s, s);
        }
      }
    }
  }

  clear() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.active = false;
      p.visible = false;
    }
  }
}
