import * as THREE from 'three';

/**
 * CameraManager - Manages dynamic third-person camera follow, FOV speed warping,
 * screen shakes, and slow-mo cinematic crash tracking.
 */
export class CameraManager {
  constructor(camera) {
    this.camera = camera;
    this.baseFov = 65;
    this.targetFov = 65;
    this.nitroFov = 80;

    // Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 6;
  }

  shake(amount = 0.3) {
    this.shakeIntensity = Math.min(1.2, this.shakeIntensity + amount);
  }

  setupMenu() {
    this.camera.position.set(0, 2.2, -4.2);
    this.camera.lookAt(0, 1.0, 0);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  update(dt, player, isNitroActive) {
    // 1. Follow Target calculation (adapts smoothly between floor and ceiling)
    const targetCamZ = player.z - 7.5;
    const targetCamY = player.gravityDirection === 1 ? 3.0 : 2.6;
    const lookTargetY = player.gravityDirection === 1 ? 2.2 : 3.4;

    // Smooth horizontal and vertical camera dampening
    this.camera.position.x += (player.x * 0.4 - this.camera.position.x) * 8 * dt;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 6 * dt;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 16 * dt;

    // 2. Dynamic FOV
    this.targetFov = isNitroActive ? this.nitroFov : this.baseFov;
    this.camera.fov += (this.targetFov - this.camera.fov) * 5 * dt;
    this.camera.updateProjectionMatrix();

    // 3. Look ahead on the track
    this.camera.lookAt(player.x * 0.5, lookTargetY, player.z + 12);

    // 4. Screen Shake
    if (this.shakeIntensity > 0.001) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.x += offsetX;
      this.camera.position.y += offsetY;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }
  }

  updateDeath(dt, player) {
    // Cinematic slow-motion dolly & crane shot focusing on the skidding runner
    const targetCamZ = player.z - 6.2;
    const targetCamY = player.gravityDirection === 1 ? 3.2 : 2.4;

    this.camera.position.x += (player.x * 0.5 - this.camera.position.x) * 5 * dt;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 4 * dt;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 6 * dt;

    // Focus camera directly on the tumbling character
    this.camera.lookAt(player.x, player.y, player.z);

    // Camera FOV tightens slightly for dramatic focus
    this.camera.fov += (58 - this.camera.fov) * 3 * dt;
    this.camera.updateProjectionMatrix();

    // Lingering vibration
    if (this.shakeIntensity > 0.001) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.x += offsetX;
      this.camera.position.y += offsetY;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }
  }
}
