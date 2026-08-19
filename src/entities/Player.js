import * as THREE from 'three';
import { CONFIG } from '../config/gameConfig.js';
import { PlayerModel } from './PlayerModel.js';

/**
 * Player - Handles physics, lane switching, variable jumps, sliding, gravity inversion,
 * and cinematic death ragdoll tumbling physics.
 */
export class Player {
  constructor(scene, particles, audio) {
    this.scene = scene;
    this.particles = particles;
    this.audio = audio;
    this.model = new PlayerModel(scene);

    this.currentLane = 1; // 0 = Left, 1 = Center, 2 = Right
    this.targetX = 0;
    this.x = 0;
    this.y = 0.9;
    this.z = 0;
    this.vy = 0;

    this.gravityDirection = 1; // 1 = floor, -1 = ceiling
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isJumping = false;
    this.jumpHoldTimer = 0;
    this.canDoubleJump = true;
    this.doubleJumpCooldown = 0;

    // Powerups & Buffs
    this.hasShield = false;
    this.magnetTimer = 0;
    this.multiplierTimer = 0;
    this.slowmoTimer = 0;
    this.invulnerableTimer = 0;

    // Nitro
    this.nitroEnergy = 40;
    this.isNitroActive = false;
    this.nitroTimer = 0;

    // State & Streaks
    this.isDead = false;
    this.combo = 1;
    this.comboScoreStreak = 0;

    // Death Ragdoll Physics
    this.deathTimer = 0;
    this.deathVx = 0;
    this.deathVy = 0;
    this.deathVz = 0;
    this.deathRotSpeedX = 0;
    this.deathRotSpeedY = 0;
    this.deathRotSpeedZ = 0;

    // Blaster Projectiles
    this.projectiles = [];
    this.shootCooldown = 0;
  }

  reset(startWithShield = false) {
    this.currentLane = 1;
    this.targetX = 0;
    this.x = 0;
    this.y = 0.9;
    this.z = 0;
    this.vy = 0;
    this.gravityDirection = 1;
    this.model.group.rotation.set(0, 0, 0);
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isJumping = false;
    this.jumpHoldTimer = 0;
    this.canDoubleJump = true;
    this.doubleJumpCooldown = 0;

    this.hasShield = startWithShield;
    this.model.shieldMesh.visible = startWithShield;
    this.magnetTimer = 0;
    this.multiplierTimer = 0;
    this.slowmoTimer = 0;
    this.invulnerableTimer = 0;
    this.nitroEnergy = 40;
    this.isNitroActive = false;
    this.nitroTimer = 0;

    this.isDead = false;
    this.deathTimer = 0;
    this.deathVx = 0;
    this.deathVy = 0;
    this.deathVz = 0;
    this.deathRotSpeedX = 0;
    this.deathRotSpeedY = 0;
    this.deathRotSpeedZ = 0;

    this.combo = 1;
    this.comboScoreStreak = 0;

    // Clear projectiles
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];
  }

  setLane(lane) {
    if (this.isDead) return;
    this.currentLane = Math.max(0, Math.min(2, lane));
    this.targetX = (1 - this.currentLane) * CONFIG.LANE_WIDTH;
  }

  jump(startJump = true) {
    if (this.isDead) return;

    if (startJump) {
      if (this.isGrounded) {
        this.vy = CONFIG.JUMP_VELOCITY * this.gravityDirection;
        this.isGrounded = false;
        this.isJumping = true;
        this.jumpHoldTimer = CONFIG.MAX_JUMP_HOLD_TIME;
        this.audio.playSound('jump');
        this.particles.spawn(this.x, this.y, this.z, 6, 0x06b6d4, 2);
      } else if (this.canDoubleJump && this.doubleJumpCooldown <= 0) {
        this.vy = CONFIG.DOUBLE_JUMP_VELOCITY * this.gravityDirection;
        this.canDoubleJump = false;
        this.doubleJumpCooldown = CONFIG.DOUBLE_JUMP_COOLDOWN;
        this.audio.playSound('double_jump');
        this.particles.spawn(this.x, this.y, this.z, 12, 0x38bdf8, 3.5);
      }
    } else {
      this.isJumping = false;
    }
  }

  slide() {
    if (this.isDead) return;
    if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = CONFIG.SLIDE_DURATION;
      this.audio.playSound('slide');
      this.particles.spawn(this.x, this.y, this.z, 8, 0xf59e0b, 3);

      if (!this.isGrounded) {
        this.vy = -CONFIG.JUMP_VELOCITY * 1.4 * this.gravityDirection;
      }
    }
  }

  flipGravity() {
    if (this.isDead) return;
    this.gravityDirection *= -1;
    this.isGrounded = false;
    this.vy = this.gravityDirection === 1 ? -CONFIG.GRAVITY_FLIP_VELOCITY : CONFIG.GRAVITY_FLIP_VELOCITY;
    this.audio.playSound('gravity');
    this.particles.spawn(this.x, this.y, this.z, 16, 0xa855f7, 4);
  }

  activateNitro() {
    if (this.isDead || this.isNitroActive || this.nitroEnergy < CONFIG.NITRO_ENERGY_REQ) return;
    this.isNitroActive = true;
    this.nitroTimer = CONFIG.NITRO_DURATION;
    this.invulnerableTimer = CONFIG.NITRO_DURATION;
    this.nitroEnergy = 0;
    this.audio.playSound('nitro');
    this.particles.spawn(this.x, this.y, this.z - 0.5, 25, 0x06b6d4, 6);
  }

  shootBlaster() {
    if (this.isDead) return;
    const geo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(this.x, this.y, this.z + 1.2);
    this.scene.add(mesh);
    this.projectiles.push({ mesh, speed: 65, life: 1.2 });
    this.audio.playSound('laser');
  }

  startDeathTumble(worldSpeed) {
    this.isDead = true;
    this.deathTimer = 0;

    // Launch trajectory
    this.deathVz = Math.max(10, worldSpeed * 0.75);
    this.deathVy = 9.0 * this.gravityDirection;
    this.deathVx = (Math.random() - 0.5) * 7.0;

    // Tumbling rotational momentum
    this.deathRotSpeedX = (Math.random() * 5 + 10) * (Math.random() < 0.5 ? 1 : -1);
    this.deathRotSpeedY = (Math.random() * 4 + 4) * (Math.random() < 0.5 ? 1 : -1);
    this.deathRotSpeedZ = (Math.random() * 3 + 2) * (Math.random() < 0.5 ? 1 : -1);
  }

  updateDeath(dt) {
    this.deathTimer += dt;

    // Gravity pull on ragdoll
    const grav = CONFIG.GRAVITY * 0.7 * this.gravityDirection;
    this.deathVy -= grav * dt;

    this.x += this.deathVx * dt;
    this.y += this.deathVy * dt;
    this.z += this.deathVz * dt;

    // Floor / Ceiling Rebound & Ground Friction
    const minFloorY = 0.45;
    const maxCeilY = CONFIG.CEILING_HEIGHT - 0.45;

    if (this.gravityDirection === 1) {
      if (this.y <= minFloorY) {
        this.y = minFloorY;
        if (Math.abs(this.deathVy) > 2.2) {
          // Rebound bounce
          this.deathVy = -this.deathVy * 0.42;
          this.deathVz *= 0.75;
          this.particles.spawn(this.x, minFloorY + 0.1, this.z, 12, 0xf59e0b, 4);
        } else {
          // Ground skidding
          this.deathVy = 0;
          this.deathVz = Math.max(0, this.deathVz - 28 * dt);
          this.deathVx *= Math.max(0, 1 - 8 * dt);
          if (this.deathVz > 1) {
            this.particles.spawn(this.x, minFloorY + 0.05, this.z, 2, 0xf59e0b, 1.5, 0.1, 0.2);
          }
        }
      }
    } else {
      if (this.y >= maxCeilY) {
        this.y = maxCeilY;
        if (Math.abs(this.deathVy) > 2.2) {
          this.deathVy = -this.deathVy * 0.42;
          this.deathVz *= 0.75;
          this.particles.spawn(this.x, maxCeilY - 0.1, this.z, 12, 0xa855f7, 4);
        } else {
          this.deathVy = 0;
          this.deathVz = Math.max(0, this.deathVz - 28 * dt);
          this.deathVx *= Math.max(0, 1 - 8 * dt);
          if (this.deathVz > 1) {
            this.particles.spawn(this.x, maxCeilY - 0.05, this.z, 2, 0xa855f7, 1.5, 0.1, 0.2);
          }
        }
      }
    }

    // Rotational tumble dampening
    this.model.group.rotation.x += this.deathRotSpeedX * dt;
    this.model.group.rotation.y += this.deathRotSpeedY * dt;
    this.model.group.rotation.z += this.deathRotSpeedZ * dt;

    const rotDamp = Math.max(0, 1 - 2.2 * dt);
    this.deathRotSpeedX *= rotDamp;
    this.deathRotSpeedY *= rotDamp;
    this.deathRotSpeedZ *= rotDamp;

    // Malfunctioning jetpack smoke & sparks
    if (this.deathTimer < 1.4 && Math.random() < 0.4) {
      this.particles.spawn(this.x, this.y, this.z, 3, 0xef4444, 2, 0.2, 0.4);
    }

    this.model.group.position.set(this.x, this.y, this.z);
    this.model.animate({ isDead: true }, this.deathTimer, 1.0);
  }

  update(dt, worldSpeed) {
    if (this.isDead) return;

    // 1. Smooth Lane Interpolation (Lerp)
    this.x += (this.targetX - this.x) * 14 * dt;

    // 2. Variable Jump Hold
    if (this.isJumping && this.jumpHoldTimer > 0) {
      this.jumpHoldTimer -= dt;
      this.vy += CONFIG.GRAVITY * 0.4 * this.gravityDirection * dt;
    }

    // 3. Gravity Physics
    const currentGravity = CONFIG.GRAVITY * this.gravityDirection;
    this.vy -= currentGravity * dt;
    this.y += this.vy * dt;

    // 4. Floor & Ceiling Boundaries
    const floorStandY = 0.9;
    const ceilingStandY = CONFIG.CEILING_HEIGHT - 0.9;
    const maxHeadCeilingY = CONFIG.CEILING_HEIGHT - 0.95;
    const minHeadFloorY = 0.95;

    if (this.gravityDirection === 1) {
      if (this.y <= floorStandY) {
        this.y = floorStandY;
        this.vy = 0;
        this.isGrounded = true;
        this.canDoubleJump = true;
      }
      if (this.y > maxHeadCeilingY) {
        this.y = maxHeadCeilingY;
        this.vy = -2.0;
        this.particles.spawn(this.x, CONFIG.CEILING_HEIGHT - 0.1, this.z, 4, 0x38bdf8, 2);
      }
    } else {
      if (this.y >= ceilingStandY) {
        this.y = ceilingStandY;
        this.vy = 0;
        this.isGrounded = true;
        this.canDoubleJump = true;
      }
      if (this.y < minHeadFloorY) {
        this.y = minHeadFloorY;
        this.vy = 2.0;
        this.particles.spawn(this.x, 0.1, this.z, 4, 0x38bdf8, 2);
      }
    }

    // 5. Timers
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    if (this.doubleJumpCooldown > 0) {
      this.doubleJumpCooldown -= dt;
    }

    if (this.magnetTimer > 0) this.magnetTimer -= dt;
    if (this.multiplierTimer > 0) this.multiplierTimer -= dt;
    if (this.slowmoTimer > 0) this.slowmoTimer -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    // 6. Nitro Update & Recharge
    if (this.isNitroActive) {
      this.nitroTimer -= dt;
      this.particles.spawn(
        this.x + (Math.random() - 0.5) * 0.3,
        this.y,
        this.z - 0.4,
        2,
        0x06b6d4,
        1.5,
        0.15,
        0.2
      );
      // Nitro flame trail (spark shape)
      if (Math.random() < 0.5) {
        this.particles.spawn(
          this.x + (Math.random() - 0.5) * 0.4,
          this.y - 0.3,
          this.z - 0.6,
          1,
          Math.random() > 0.5 ? 0xffe600 : 0xff007f,
          2,
          0.12,
          0.3,
          'spark',
          2
        );
      }
      if (this.nitroTimer <= 0) {
        this.isNitroActive = false;
      }
    } else {
      this.nitroEnergy = Math.min(CONFIG.NITRO_MAX_ENERGY, this.nitroEnergy + dt * CONFIG.NITRO_RECHARGE_RATE);
    }

    // 6b. Running dust puffs
    if (this.isGrounded && !this.isSliding && Math.random() < 0.15) {
      const dustY = this.gravityDirection === 1 ? 0.1 : CONFIG.CEILING_HEIGHT - 0.1;
      this.particles.spawn(
        this.x + (Math.random() - 0.5) * 0.3,
        dustY,
        this.z - 0.2,
        1,
        0x94a3b8,
        0.8,
        0.12,
        0.4,
        'sphere',
        0.5
      );
    }

    // 6c. Jetpack flame when airborne
    if (!this.isGrounded && !this.isSliding && Math.random() < 0.4) {
      const flameY = this.gravityDirection === 1 ? this.y - 0.4 : this.y + 0.4;
      this.particles.spawn(
        this.x + (Math.random() - 0.5) * 0.2,
        flameY,
        this.z - 0.3,
        1,
        this.isNitroActive ? 0xffe600 : 0x38bdf8,
        1.5,
        0.1,
        0.25,
        'spark',
        1
      );
    }

    // 6d. Slide sparks
    if (this.isSliding && this.isGrounded && Math.random() < 0.3) {
      const sparkY = this.gravityDirection === 1 ? 0.1 : CONFIG.CEILING_HEIGHT - 0.1;
      this.particles.spawn(
        this.x + (Math.random() - 0.5) * 0.4,
        sparkY,
        this.z - 0.2,
        1,
        0xf59e0b,
        2,
        0.08,
        0.2,
        'spark',
        3
      );
    }

    // 7. Gravity Visual Inversion Roll & Smooth Bank Angle
    const targetRotZ = this.gravityDirection === 1 ? 0 : Math.PI;
    this.model.group.rotation.z += (targetRotZ - this.model.group.rotation.z) * 12 * dt;

    const targetRotY = (this.targetX - this.x) * 0.08;
    this.model.group.rotation.y += (targetRotY - this.model.group.rotation.y) * 14 * dt;
    this.model.group.rotation.x = 0;

    // 8. Transform Position
    this.model.group.position.set(this.x, this.y, this.z);

    // 9. Procedural Skeletal Animation
    this.model.shieldMesh.visible = this.hasShield;
    this.model.animate(
      {
        isGrounded: this.isGrounded,
        isSliding: this.isSliding,
        isDead: this.isDead
      },
      performance.now() * 0.001,
      worldSpeed / CONFIG.INITIAL_SPEED
    );

    // 10. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.z += p.speed * dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  getHitbox() {
    let halfHeight = this.isSliding ? CONFIG.SLIDE_HEIGHT * 0.5 : CONFIG.NORMAL_HEIGHT * 0.5;

    let centerY = this.y;
    if (this.isSliding) {
      centerY = this.gravityDirection === 1 ? this.y - 0.45 : this.y + 0.45;
    }

    return {
      minX: this.x - 0.4,
      maxX: this.x + 0.4,
      minY: centerY - halfHeight,
      maxY: centerY + halfHeight,
      minZ: this.z - 0.35,
      maxZ: this.z + 0.35
    };
  }
}
