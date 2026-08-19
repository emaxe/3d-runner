import * as THREE from 'three';

/**
 * PlayerModel - Highly detailed low-poly sci-fi cyber runner with articulated limbs,
 * chest reactor, shoulder pauldrons, glowing visor, and pulsating thruster plasma cones.
 */
export class PlayerModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Standard low-poly flat-shaded materials
    this.materials = {
      body: new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.35, metalness: 0.15, flatShading: true }),
      bodyDark: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.3, flatShading: true }),
      head: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, flatShading: true }),
      visor: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      glowCore: new THREE.MeshBasicMaterial({ color: 0x06b6d4 }),
      limbs: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.2, flatShading: true }),
      accent: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.4, flatShading: true }),
      flame: new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 }),
      neon: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      gauntlet: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.6, flatShading: true })
    };

    this.buildModel();
    this.scene.add(this.group);
  }

  buildModel() {
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }

    // 1. Torso Center
    const torsoGeo = new THREE.BoxGeometry(0.62, 0.76, 0.38);
    this.torso = new THREE.Mesh(torsoGeo, this.materials.body);
    this.torso.position.y = 0.0;
    this.group.add(this.torso);

    // Chest Armor Plate (front)
    const chestPlateGeo = new THREE.BoxGeometry(0.52, 0.42, 0.1);
    const chestPlate = new THREE.Mesh(chestPlateGeo, this.materials.bodyDark);
    chestPlate.position.set(0, 0.12, 0.18);
    this.torso.add(chestPlate);

    // Glowing Chest Reactor Core
    const coreGeo = new THREE.OctahedronGeometry(0.12, 0);
    this.coreMesh = new THREE.Mesh(coreGeo, this.materials.glowCore);
    this.coreMesh.position.set(0, 0.12, 0.23);
    this.torso.add(this.coreMesh);

    // Reactor glow halo (additive sprite-like ring)
    const haloGeo = new THREE.TorusGeometry(0.2, 0.02, 4, 12);
    this.coreHalo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.6
    }));
    this.coreHalo.position.set(0, 0.12, 0.24);
    this.torso.add(this.coreHalo);

    // Cyber Belt & Buckle
    const beltGeo = new THREE.BoxGeometry(0.66, 0.12, 0.42);
    const belt = new THREE.Mesh(beltGeo, this.materials.bodyDark);
    belt.position.set(0, -0.32, 0);
    this.torso.add(belt);

    const buckleGeo = new THREE.BoxGeometry(0.2, 0.14, 0.44);
    const buckle = new THREE.Mesh(buckleGeo, this.materials.accent);
    buckle.position.set(0, -0.32, 0);
    this.torso.add(buckle);

    // Neon side strips on torso
    const sideStripGeo = new THREE.BoxGeometry(0.05, 0.5, 0.4);
    const sideStripL = new THREE.Mesh(sideStripGeo, this.materials.neon);
    sideStripL.position.set(-0.34, 0, 0);
    this.torso.add(sideStripL);
    const sideStripR = new THREE.Mesh(sideStripGeo, this.materials.neon);
    sideStripR.position.set(0.34, 0, 0);
    this.torso.add(sideStripR);

    // 2. Head & Helmet
    const headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.44);
    this.head = new THREE.Mesh(headGeo, this.materials.head);
    this.head.position.set(0, 0.62, 0.02);
    this.torso.add(this.head);

    // Curved Visor
    const visorGeo = new THREE.BoxGeometry(0.36, 0.18, 0.14);
    this.visor = new THREE.Mesh(visorGeo, this.materials.visor);
    this.visor.position.set(0, 0.04, 0.2);
    this.head.add(this.visor);

    // Helmet Side Antenna Fins
    const antennaGeo = new THREE.BoxGeometry(0.06, 0.22, 0.16);
    const antL = new THREE.Mesh(antennaGeo, this.materials.accent);
    antL.position.set(-0.23, 0.1, -0.05);
    const antR = new THREE.Mesh(antennaGeo, this.materials.accent);
    antR.position.set(0.23, 0.1, -0.05);
    this.head.add(antL);
    this.head.add(antR);

    // Chin Filter Guard
    const chinGeo = new THREE.BoxGeometry(0.22, 0.12, 0.12);
    const chin = new THREE.Mesh(chinGeo, this.materials.bodyDark);
    chin.position.set(0, -0.16, 0.2);
    this.head.add(chin);

    // Helmet top neon crest
    const crestGeo = new THREE.BoxGeometry(0.1, 0.08, 0.3);
    const crest = new THREE.Mesh(crestGeo, this.materials.neon);
    crest.position.set(0, 0.24, 0.02);
    this.head.add(crest);

    // 3. Jetpack Unit with Active Thruster Flames
    const jetGeo = new THREE.BoxGeometry(0.48, 0.52, 0.22);
    this.jetpack = new THREE.Mesh(jetGeo, this.materials.accent);
    this.jetpack.position.set(0, 0.05, -0.28);
    this.torso.add(this.jetpack);

    // Jetpack Nozzles & Plasma Flames
    const thrusterGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.18, 6);
    const tL = new THREE.Mesh(thrusterGeo, this.materials.bodyDark);
    tL.position.set(-0.14, -0.3, 0);
    const tR = new THREE.Mesh(thrusterGeo, this.materials.bodyDark);
    tR.position.set(0.14, -0.3, 0);
    this.jetpack.add(tL);
    this.jetpack.add(tR);

    const flameGeo = new THREE.ConeGeometry(0.09, 0.35, 5);
    flameGeo.rotateX(Math.PI);
    this.flameL = new THREE.Mesh(flameGeo, this.materials.flame);
    this.flameL.position.set(0, -0.22, 0);
    tL.add(this.flameL);

    this.flameR = new THREE.Mesh(flameGeo, this.materials.flame);
    this.flameR.position.set(0, -0.22, 0);
    tR.add(this.flameR);

    // Jetpack energy rings
    const jetRingGeo = new THREE.TorusGeometry(0.3, 0.02, 4, 12);
    this.jetRing1 = new THREE.Mesh(jetRingGeo, new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5
    }));
    this.jetRing1.position.set(0, 0.1, -0.1);
    this.jetpack.add(this.jetRing1);
    this.jetRing2 = new THREE.Mesh(jetRingGeo, new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4
    }));
    this.jetRing2.position.set(0, -0.1, -0.1);
    this.jetpack.add(this.jetRing2);

    // 4. Arms (Shoulder Pauldrons + Upper Arm + Forearm with Gauntlets)
    const pauldronGeo = new THREE.BoxGeometry(0.22, 0.16, 0.24);

    // Left Arm
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.42, 0.3, 0);
    this.torso.add(this.leftArmPivot);

    const pL = new THREE.Mesh(pauldronGeo, this.materials.accent);
    pL.position.set(-0.04, 0.05, 0);
    this.leftArmPivot.add(pL);

    const upperArmGeo = new THREE.BoxGeometry(0.16, 0.32, 0.16);
    upperArmGeo.translate(0, -0.16, 0);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, this.materials.limbs);
    this.leftArmPivot.add(leftUpperArm);

    this.leftForearmPivot = new THREE.Group();
    this.leftForearmPivot.position.set(0, -0.32, 0);
    this.leftArmPivot.add(this.leftForearmPivot);

    const forearmGeo = new THREE.BoxGeometry(0.18, 0.34, 0.18);
    forearmGeo.translate(0, -0.15, 0);
    const leftForearm = new THREE.Mesh(forearmGeo, this.materials.bodyDark);
    this.leftForearmPivot.add(leftForearm);

    // Left Glowing Gauntlet (fist)
    const gauntletGeo = new THREE.BoxGeometry(0.2, 0.16, 0.2);
    const leftGauntlet = new THREE.Mesh(gauntletGeo, this.materials.gauntlet);
    leftGauntlet.position.set(0, -0.34, 0);
    this.leftForearmPivot.add(leftGauntlet);
    const leftGauntletNeon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.22), this.materials.neon);
    leftGauntletNeon.position.set(0, -0.34, 0);
    this.leftForearmPivot.add(leftGauntletNeon);

    // Right Arm
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.42, 0.3, 0);
    this.torso.add(this.rightArmPivot);

    const pR = new THREE.Mesh(pauldronGeo, this.materials.accent);
    pR.position.set(0.04, 0.05, 0);
    this.rightArmPivot.add(pR);

    const rightUpperArm = new THREE.Mesh(upperArmGeo, this.materials.limbs);
    this.rightArmPivot.add(rightUpperArm);

    this.rightForearmPivot = new THREE.Group();
    this.rightForearmPivot.position.set(0, -0.32, 0);
    this.rightArmPivot.add(this.rightForearmPivot);

    const rightForearm = new THREE.Mesh(forearmGeo, this.materials.bodyDark);
    this.rightForearmPivot.add(rightForearm);

    // Right Glowing Gauntlet (fist)
    const rightGauntlet = new THREE.Mesh(gauntletGeo, this.materials.gauntlet);
    rightGauntlet.position.set(0, -0.34, 0);
    this.rightForearmPivot.add(rightGauntlet);
    const rightGauntletNeon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.22), this.materials.neon);
    rightGauntletNeon.position.set(0, -0.34, 0);
    this.rightForearmPivot.add(rightGauntletNeon);

    // 5. Legs (Hip + Thigh + Knee + Calf & Armored Boots)
    const thighGeo = new THREE.BoxGeometry(0.2, 0.38, 0.2);
    thighGeo.translate(0, -0.19, 0);

    const calfGeo = new THREE.BoxGeometry(0.22, 0.4, 0.24);
    calfGeo.translate(0, -0.18, 0.02);

    // Left Leg
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.2, -0.36, 0);
    this.torso.add(this.leftLegPivot);

    const leftThigh = new THREE.Mesh(thighGeo, this.materials.limbs);
    this.leftLegPivot.add(leftThigh);

    this.leftKneePivot = new THREE.Group();
    this.leftKneePivot.position.set(0, -0.36, 0);
    this.leftLegPivot.add(this.leftKneePivot);

    const leftCalf = new THREE.Mesh(calfGeo, this.materials.bodyDark);
    this.leftKneePivot.add(leftCalf);

    // Left Armored Boot with glowing sole
    const bootGeo = new THREE.BoxGeometry(0.24, 0.18, 0.34);
    const leftBoot = new THREE.Mesh(bootGeo, this.materials.gauntlet);
    leftBoot.position.set(0, -0.36, 0.04);
    this.leftKneePivot.add(leftBoot);
    const leftBootNeon = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.36), this.materials.neon);
    leftBootNeon.position.set(0, -0.44, 0.04);
    this.leftKneePivot.add(leftBootNeon);

    // Right Leg
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.2, -0.36, 0);
    this.torso.add(this.rightLegPivot);

    const rightThigh = new THREE.Mesh(thighGeo, this.materials.limbs);
    this.rightLegPivot.add(rightThigh);

    this.rightKneePivot = new THREE.Group();
    this.rightKneePivot.position.set(0, -0.36, 0);
    this.rightLegPivot.add(this.rightKneePivot);

    const rightCalf = new THREE.Mesh(calfGeo, this.materials.bodyDark);
    this.rightKneePivot.add(rightCalf);

    // Right Armored Boot with glowing sole
    const rightBoot = new THREE.Mesh(bootGeo, this.materials.gauntlet);
    rightBoot.position.set(0, -0.36, 0.04);
    this.rightKneePivot.add(rightBoot);
    const rightBootNeon = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.36), this.materials.neon);
    rightBootNeon.position.set(0, -0.44, 0.04);
    this.rightKneePivot.add(rightBootNeon);

    // 6. Holographic Dual-Ring Energy Shield
    this.shieldGroup = new THREE.Group();

    const shieldGeo = new THREE.IcosahedronGeometry(1.25, 2);
    this.shieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });
    this.shieldDome = new THREE.Mesh(shieldGeo, this.shieldMat);
    this.shieldGroup.add(this.shieldDome);

    const ringGeo = new THREE.TorusGeometry(1.35, 0.04, 4, 16);
    this.shieldRing1 = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true }));
    this.shieldRing2 = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true }));
    this.shieldRing2.rotation.x = Math.PI / 2;
    this.shieldGroup.add(this.shieldRing1);
    this.shieldGroup.add(this.shieldRing2);

    this.shieldGroup.position.y = 0.0;
    this.shieldGroup.visible = false;
    this.group.add(this.shieldGroup);

    // Property alias for external access
    this.shieldMesh = this.shieldGroup;
  }

  applySkin(skinConfig) {
    if (!skinConfig || !skinConfig.colors) return;
    const colors = skinConfig.colors;
    this.materials.body.color.setHex(colors.body);
    this.materials.head.color.setHex(colors.head);
    this.materials.visor.color.setHex(colors.visor);
    this.materials.glowCore.color.setHex(colors.visor);
    this.materials.flame.color.setHex(colors.visor);
    this.materials.limbs.color.setHex(colors.limbs);
    this.materials.accent.color.setHex(colors.accent);
    this.materials.neon.color.setHex(colors.visor);
  }

  animate(state, time, speedFactor = 1.0) {
    const runFreq = time * 14 * speedFactor;

    // Thruster flame flicker & pulsation
    const flameScale = 0.8 + Math.sin(time * 30) * 0.3 + (state.isNitroActive ? 0.8 : 0);
    this.flameL.scale.set(1, flameScale, 1);
    this.flameR.scale.set(1, flameScale, 1);

    // Core pulse
    if (this.coreMesh) {
      this.coreMesh.rotation.y = time * 3;
      this.coreMesh.rotation.z = time * 2;
    }
    // Core halo pulse
    if (this.coreHalo) {
      const haloScale = 1 + Math.sin(time * 5) * 0.15;
      this.coreHalo.scale.set(haloScale, haloScale, haloScale);
      this.coreHalo.rotation.z = time * 2;
    }
    // Jetpack energy rings rotation
    if (this.jetRing1) {
      this.jetRing1.rotation.x = time * 2;
      this.jetRing2.rotation.x = -time * 2;
    }

    // Shield rotation
    if (this.shieldGroup.visible) {
      this.shieldDome.rotation.y += 0.02;
      this.shieldDome.rotation.x += 0.01;
      this.shieldRing1.rotation.z += 0.03;
      this.shieldRing2.rotation.y += 0.025;
    }

    // Death animation
    if (state.isDead) {
      this.torso.rotation.x = Math.PI / 2;
      this.leftArmPivot.rotation.x = -Math.PI / 3;
      this.rightArmPivot.rotation.x = -Math.PI / 3;
      this.leftForearmPivot.rotation.x = 0;
      this.rightForearmPivot.rotation.x = 0;
      this.leftLegPivot.rotation.x = 0;
      this.rightLegPivot.rotation.x = 0;
      this.leftKneePivot.rotation.x = 0;
      this.rightKneePivot.rotation.x = 0;
      return;
    }

    if (state.isSliding) {
      // Sliding posture (tucked body, limbs trailing back)
      this.torso.position.y = -0.4;
      this.torso.rotation.x = -Math.PI / 3;
      this.head.rotation.x = Math.PI / 4;

      this.leftLegPivot.rotation.x = -Math.PI / 3;
      this.rightLegPivot.rotation.x = -Math.PI / 3;
      this.leftKneePivot.rotation.x = 0.4;
      this.rightKneePivot.rotation.x = 0.4;

      this.leftArmPivot.rotation.x = Math.PI / 3;
      this.rightArmPivot.rotation.x = Math.PI / 3;
      this.leftForearmPivot.rotation.x = 0.5;
      this.rightForearmPivot.rotation.x = 0.5;
    } else if (!state.isGrounded) {
      // Airborne posture (dynamic jump flex)
      this.torso.position.y = 0.0;
      this.torso.rotation.x = -0.15;
      this.head.rotation.x = 0.1;

      this.leftArmPivot.rotation.x = -Math.PI / 1.6;
      this.rightArmPivot.rotation.x = -Math.PI / 1.6;
      this.leftForearmPivot.rotation.x = -0.4;
      this.rightForearmPivot.rotation.x = -0.4;

      this.leftLegPivot.rotation.x = 0.7;
      this.leftKneePivot.rotation.x = 0.8;
      this.rightLegPivot.rotation.x = -0.4;
      this.rightKneePivot.rotation.x = 0.2;
    } else {
      // Running cycle with knee & elbow bending
      this.torso.position.y = Math.abs(Math.sin(runFreq)) * 0.12;
      this.torso.rotation.x = 0.16; // Sprint lean forward
      this.torso.rotation.y = Math.sin(runFreq * 0.5) * 0.08;
      this.head.rotation.x = -0.1;

      const swing = Math.sin(runFreq) * 0.85;

      // Arms swing with elbow flexion
      this.leftArmPivot.rotation.x = swing;
      this.leftForearmPivot.rotation.x = Math.max(0, -swing * 0.8) - 0.3;

      this.rightArmPivot.rotation.x = -swing;
      this.rightForearmPivot.rotation.x = Math.max(0, swing * 0.8) - 0.3;

      // Legs swing with realistic knee bending when moving back
      this.leftLegPivot.rotation.x = -swing;
      this.leftKneePivot.rotation.x = Math.max(0, swing * 1.2);

      this.rightLegPivot.rotation.x = swing;
      this.rightKneePivot.rotation.x = Math.max(0, -swing * 1.2);
    }
  }
}
