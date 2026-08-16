import * as THREE from 'three';
import { CONFIG } from '../config/gameConfig.js';
import { BIOMES } from '../config/biomes.js';

/**
 * LevelGenerator - High-detail procedural environment generator featuring sci-fi corridor architecture,
 * neon lane runway strips, biome-specific scenery structures, and animated obstacles.
 */
export class LevelGenerator {
  constructor(scene, particles, audio) {
    this.scene = scene;
    this.particles = particles;
    this.audio = audio;

    this.activeChunks = [];
    this.currentChunkIndex = 0;
    this.currentBiomeIndex = 0;

    this.obstacles = [];
    this.coins = [];
    this.powerups = [];

    this.initSharedResources();
  }

  initSharedResources() {
    this.materials = {
      floor: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.2, flatShading: true }),
      ceiling: new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8, metalness: 0.2, flatShading: true }),
      laneStripe: new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 }),
      archStructure: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.4, flatShading: true }),
      archNeon: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      barrierFrame: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, flatShading: true }),
      barrierHazard: new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3, emissive: 0x991b1b, emissiveIntensity: 0.6, flatShading: true }),
      laserWall: new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 }),
      spike: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.5, flatShading: true }),
      spikeTip: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
      droneBody: new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.6, flatShading: true }),
      droneEye: new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
      coin: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.15, flatShading: true }),
      coinRing: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
      gravCoin: new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.85, roughness: 0.1, flatShading: true }),
      gravRing: new THREE.MeshBasicMaterial({ color: 0xe879f9 }),
      sceneryPrimary: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6, metalness: 0.2, flatShading: true }),
      scenerySecondary: new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.5, flatShading: true }),
      sceneryRock: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, flatShading: true }),
      sceneryGlow: new THREE.MeshBasicMaterial({ color: 0x34d399 })
    };

    this.geos = {
      chunkPlatform: new THREE.BoxGeometry(CONFIG.LANE_WIDTH * 3 + 1.6, 0.5, CONFIG.CHUNK_LENGTH),
      laneDivider: new THREE.BoxGeometry(0.08, 0.02, CONFIG.CHUNK_LENGTH),
      railBeam: new THREE.BoxGeometry(0.25, 0.35, CONFIG.CHUNK_LENGTH),
      railGlow: new THREE.BoxGeometry(0.06, 0.08, CONFIG.CHUNK_LENGTH),
      archPillar: new THREE.BoxGeometry(0.45, CONFIG.CEILING_HEIGHT + 0.5, 0.45),
      archBeam: new THREE.BoxGeometry(CONFIG.LANE_WIDTH * 3 + 1.8, 0.45, 0.45),
      archSign: new THREE.BoxGeometry(2.0, 0.2, 0.1),
      spikeBase: new THREE.CylinderGeometry(0.35, 0.45, 0.3, 5),
      spikeCone: new THREE.ConeGeometry(0.38, 0.85, 5),
      hangingCone: new THREE.ConeGeometry(0.38, 0.85, 5),
      barrierPylon: new THREE.BoxGeometry(0.28, 0.8, 0.28),
      barrierBar: new THREE.BoxGeometry(2.4, 0.32, 0.18),
      highBarrierBar: new THREE.BoxGeometry(2.4, 0.4, 0.2),
      fullLaserGrid: new THREE.BoxGeometry(CONFIG.LANE_WIDTH * 3 + 0.8, 2.7, 0.15),
      laserGeneratorPylon: new THREE.BoxGeometry(0.4, 2.8, 0.4),
      droneOcta: new THREE.OctahedronGeometry(0.5, 0),
      droneRing: new THREE.TorusGeometry(0.8, 0.04, 4, 12),
      droneEye: new THREE.SphereGeometry(0.18, 6, 6),
      coinCore: new THREE.CylinderGeometry(0.35, 0.35, 0.1, 8),
      coinRim: new THREE.TorusGeometry(0.38, 0.04, 4, 12),
      powerup: new THREE.OctahedronGeometry(0.5, 0),
      treeTrunk: new THREE.CylinderGeometry(0.25, 0.4, 1.8, 5),
      treeCone: new THREE.ConeGeometry(1.3, 3.2, 5),
      treeCrystal: new THREE.DodecahedronGeometry(0.9, 0),
      sceneryPyramid: new THREE.ConeGeometry(1.6, 3.6, 4),
      sceneryRock: new THREE.DodecahedronGeometry(1.2, 0),
      sceneryPillar: new THREE.BoxGeometry(0.8, 4.2, 0.8)
    };

    this.geos.coinCore.rotateX(Math.PI / 2);
    this.geos.hangingCone.rotateX(Math.PI);
  }

  setBiome(biomeIndex) {
    this.currentBiomeIndex = biomeIndex % BIOMES.length;
    const b = BIOMES[this.currentBiomeIndex];

    this.materials.floor.color.setHex(0x0f172a);
    this.materials.ceiling.color.setHex(0x090d16);
    this.materials.laneStripe.color.setHex(b.accentColor);
    this.materials.archNeon.color.setHex(b.accentColor);
    this.materials.barrierHazard.color.setHex(b.hazardColor);
    this.materials.spikeTip.color.setHex(b.hazardColor);

    // Scenery color shifts per biome
    if (b.id === 'neon_meadows') {
      this.materials.sceneryPrimary.color.setHex(0x10b981);
      this.materials.scenerySecondary.color.setHex(0x06b6d4);
      this.materials.sceneryGlow.color.setHex(0x34d399);
      this.materials.sceneryRock.color.setHex(0x334155);
    } else if (b.id === 'solar_dunes') {
      this.materials.sceneryPrimary.color.setHex(0xd97706);
      this.materials.scenerySecondary.color.setHex(0xf59e0b);
      this.materials.sceneryGlow.color.setHex(0xfef08a);
      this.materials.sceneryRock.color.setHex(0x78350f);
    } else if (b.id === 'glacial_peaks') {
      this.materials.sceneryPrimary.color.setHex(0x38bdf8);
      this.materials.scenerySecondary.color.setHex(0xa5f3fc);
      this.materials.sceneryGlow.color.setHex(0xe0f2fe);
      this.materials.sceneryRock.color.setHex(0x1e293b);
    } else {
      // Cyber Volcano
      this.materials.sceneryPrimary.color.setHex(0x7f1d1d);
      this.materials.scenerySecondary.color.setHex(0xf43f5e);
      this.materials.sceneryGlow.color.setHex(0xfacc15);
      this.materials.sceneryRock.color.setHex(0x18000a);
    }
  }

  createChunk(chunkZIndex) {
    const chunkGroup = new THREE.Group();
    const zPos = chunkZIndex * CONFIG.CHUNK_LENGTH;
    const chunkCenterZ = zPos + CONFIG.CHUNK_LENGTH * 0.5;

    // 1. Floor Platform & Glowing Runway Stripes
    const floor = new THREE.Mesh(this.geos.chunkPlatform, this.materials.floor);
    floor.position.set(0, -0.25, chunkCenterZ);
    chunkGroup.add(floor);

    // Two glowing neon lane dividers on floor
    const laneDivOffset = CONFIG.LANE_WIDTH * 0.5;
    const stripeFloorL = new THREE.Mesh(this.geos.laneDivider, this.materials.laneStripe);
    stripeFloorL.position.set(-laneDivOffset, 0.01, chunkCenterZ);
    const stripeFloorR = new THREE.Mesh(this.geos.laneDivider, this.materials.laneStripe);
    stripeFloorR.position.set(laneDivOffset, 0.01, chunkCenterZ);
    chunkGroup.add(stripeFloorL);
    chunkGroup.add(stripeFloorR);

    // 2. Ceiling Platform & Glowing Stripes
    const ceiling = new THREE.Mesh(this.geos.chunkPlatform, this.materials.ceiling);
    ceiling.position.set(0, CONFIG.CEILING_HEIGHT + 0.25, chunkCenterZ);
    chunkGroup.add(ceiling);

    const stripeCeilL = new THREE.Mesh(this.geos.laneDivider, this.materials.laneStripe);
    stripeCeilL.position.set(-laneDivOffset, CONFIG.CEILING_HEIGHT - 0.01, chunkCenterZ);
    const stripeCeilR = new THREE.Mesh(this.geos.laneDivider, this.materials.laneStripe);
    stripeCeilR.position.set(laneDivOffset, CONFIG.CEILING_HEIGHT - 0.01, chunkCenterZ);
    chunkGroup.add(stripeCeilL);
    chunkGroup.add(stripeCeilR);

    // 3. Side Guard Rails with Neon Insets
    const railX = CONFIG.LANE_WIDTH * 1.5 + 0.5;

    // Floor rails
    const railFL = new THREE.Mesh(this.geos.railBeam, this.materials.archStructure);
    railFL.position.set(-railX, 0.2, chunkCenterZ);
    const glowFL = new THREE.Mesh(this.geos.railGlow, this.materials.laneStripe);
    glowFL.position.set(-railX + 0.1, 0.2, chunkCenterZ);

    const railFR = new THREE.Mesh(this.geos.railBeam, this.materials.archStructure);
    railFR.position.set(railX, 0.2, chunkCenterZ);
    const glowFR = new THREE.Mesh(this.geos.railGlow, this.materials.laneStripe);
    glowFR.position.set(railX - 0.1, 0.2, chunkCenterZ);

    chunkGroup.add(railFL); chunkGroup.add(glowFL);
    chunkGroup.add(railFR); chunkGroup.add(glowFR);

    // Ceiling rails
    const railCL = new THREE.Mesh(this.geos.railBeam, this.materials.archStructure);
    railCL.position.set(-railX, CONFIG.CEILING_HEIGHT - 0.2, chunkCenterZ);
    const railCR = new THREE.Mesh(this.geos.railBeam, this.materials.archStructure);
    railCR.position.set(railX, CONFIG.CEILING_HEIGHT - 0.2, chunkCenterZ);
    chunkGroup.add(railCL); chunkGroup.add(railCR);

    // 4. Structural Sci-Fi Support Arches (at chunk start)
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, zPos);

    const pillarL = new THREE.Mesh(this.geos.archPillar, this.materials.archStructure);
    pillarL.position.set(-railX, (CONFIG.CEILING_HEIGHT + 0.5) * 0.5 - 0.25, 0);
    const pillarR = new THREE.Mesh(this.geos.archPillar, this.materials.archStructure);
    pillarR.position.set(railX, (CONFIG.CEILING_HEIGHT + 0.5) * 0.5 - 0.25, 0);

    const archBeamTop = new THREE.Mesh(this.geos.archBeam, this.materials.archStructure);
    archBeamTop.position.set(0, CONFIG.CEILING_HEIGHT + 0.25, 0);

    const archNeonSign = new THREE.Mesh(this.geos.archSign, this.materials.archNeon);
    archNeonSign.position.set(0, CONFIG.CEILING_HEIGHT - 0.1, 0.25);

    archGroup.add(pillarL);
    archGroup.add(pillarR);
    archGroup.add(archBeamTop);
    archGroup.add(archNeonSign);
    chunkGroup.add(archGroup);

    // 5. Procedural Biome-Rich Scenery Elements Outside the Track
    this.populateScenery(chunkGroup, zPos);

    // 6. Populate Gameplay Obstacles & Pickups
    if (chunkZIndex >= 2) {
      this.populateChunkContent(chunkGroup, zPos);
    }

    this.scene.add(chunkGroup);
    return { group: chunkGroup, zIndex: chunkZIndex };
  }

  populateScenery(chunkGroup, zPos) {
    const currentBiome = BIOMES[this.currentBiomeIndex] || BIOMES[0];
    const railX = CONFIG.LANE_WIDTH * 1.5 + 1.2;

    for (let i = 0; i < 4; i++) {
      const sideZ = zPos + (i + 0.5) * (CONFIG.CHUNK_LENGTH / 4);

      if (currentBiome.id === 'neon_meadows') {
        // Left: Cyber-tree with crystal foliage
        const treeL = new THREE.Group();
        const trunk = new THREE.Mesh(this.geos.treeTrunk, this.materials.archStructure);
        trunk.position.y = 0.9;
        const foliage = new THREE.Mesh(this.geos.treeCone, this.materials.sceneryPrimary);
        foliage.position.y = 2.8;
        const beacon = new THREE.Mesh(this.geos.treeCrystal, this.materials.sceneryGlow);
        beacon.position.y = 4.4;
        beacon.scale.set(0.35, 0.35, 0.35);

        treeL.add(trunk); treeL.add(foliage); treeL.add(beacon);
        treeL.position.set(-railX - 1.5 - Math.random() * 2.5, 0, sideZ);
        chunkGroup.add(treeL);

        // Right: Angular crystal rock cluster
        const rock = new THREE.Mesh(this.geos.sceneryRock, this.materials.sceneryRock);
        const s = 0.8 + Math.random() * 0.7;
        rock.scale.set(s, s * 1.3, s);
        rock.position.set(railX + 1.5 + Math.random() * 2.5, 0.6 * s, sideZ);
        chunkGroup.add(rock);

      } else if (currentBiome.id === 'solar_dunes') {
        // Left: Floating antigravity solar pyramid
        const pyramid = new THREE.Mesh(this.geos.sceneryPyramid, this.materials.sceneryPrimary);
        pyramid.position.set(-railX - 2.5 - Math.random() * 2, 2.5 + Math.sin(i) * 0.8, sideZ);
        pyramid.rotation.y = i * 0.8;
        chunkGroup.add(pyramid);

        // Right: Solar capacitor monolith
        const pillar = new THREE.Mesh(this.geos.sceneryPillar, this.materials.scenerySecondary);
        pillar.position.set(railX + 2.0 + Math.random() * 2, 2.1, sideZ);
        chunkGroup.add(pillar);

      } else if (currentBiome.id === 'glacial_peaks') {
        // Left & Right: Ice crystal monoliths
        const iceL = new THREE.Mesh(this.geos.treeCone, this.materials.sceneryPrimary);
        iceL.scale.set(1.1, 1.8, 1.1);
        iceL.position.set(-railX - 2.0 - Math.random() * 2, 2.8, sideZ);
        chunkGroup.add(iceL);

        const iceR = new THREE.Mesh(this.geos.sceneryRock, this.materials.scenerySecondary);
        const s = 1.0 + Math.random() * 0.8;
        iceR.scale.set(s, s * 1.6, s);
        iceR.position.set(railX + 2.0 + Math.random() * 2, s * 0.8, sideZ);
        chunkGroup.add(iceR);

      } else {
        // Cyber Volcano: Obsidian basalt towers & magma vents
        const basalt = new THREE.Mesh(this.geos.sceneryPillar, this.materials.sceneryRock);
        basalt.position.set(-railX - 2.0 - Math.random() * 2, 2.1, sideZ);
        chunkGroup.add(basalt);

        const lavaRock = new THREE.Mesh(this.geos.sceneryRock, this.materials.scenerySecondary);
        lavaRock.position.set(railX + 2.0 + Math.random() * 2, 0.8, sideZ);
        chunkGroup.add(lavaRock);
      }
    }
  }

  populateChunkContent(chunkGroup, zStart) {
    const laneXs = [CONFIG.LANE_WIDTH, 0, -CONFIG.LANE_WIDTH]; // 0=Left, 1=Center, 2=Right
    const chunkType = Math.random();

    // 25% chance: Massive Floor Energy Wall (Requires Ceiling Gravity Inversion!)
    if (chunkType < 0.25) {
      const zWall = zStart + 24;

      const wallGroup = new THREE.Group();
      wallGroup.position.set(0, 0, zWall);

      const pylonL = new THREE.Mesh(this.geos.laserGeneratorPylon, this.materials.archStructure);
      pylonL.position.set(-CONFIG.LANE_WIDTH * 1.5 - 0.2, 1.4, 0);
      const pylonR = new THREE.Mesh(this.geos.laserGeneratorPylon, this.materials.archStructure);
      pylonR.position.set(CONFIG.LANE_WIDTH * 1.5 + 0.2, 1.4, 0);

      const wall = new THREE.Mesh(this.geos.fullLaserGrid, this.materials.laserWall);
      wall.position.set(0, 1.35, 0);

      wallGroup.add(pylonL);
      wallGroup.add(pylonR);
      wallGroup.add(wall);
      chunkGroup.add(wallGroup);

      this.obstacles.push({
        mesh: wallGroup,
        type: 'floor_wall',
        hitbox: {
          minX: -CONFIG.LANE_WIDTH * 1.5 - 0.3,
          maxX: CONFIG.LANE_WIDTH * 1.5 + 0.3,
          minY: 0,
          maxY: 2.7,
          minZ: zWall - 0.3,
          maxZ: zWall + 0.3
        }
      });

      // Bonus Grav-Coins on the ceiling over the wall
      for (let c = 0; c < 5; c++) {
        const coinMesh = this.createCoinMesh(true);
        const coinZ = zWall - 8 + c * 4;
        const coinY = CONFIG.CEILING_HEIGHT - 0.9;
        coinMesh.position.set(0, coinY, coinZ);
        chunkGroup.add(coinMesh);
        this.coins.push({ mesh: coinMesh, active: true, isGravBonus: true, x: 0, y: coinY, z: coinZ });
      }
      return;
    }

    // Standard segments with mixed Floor & Ceiling obstacles and rewards
    for (let segment = 1; segment <= 3; segment++) {
      const z = zStart + segment * 13 + Math.random() * 2;
      const freeFloorLane = Math.floor(Math.random() * 3);
      const freeCeilLane = Math.floor(Math.random() * 3);

      // Floor obstacles & coins
      for (let lane = 0; lane < 3; lane++) {
        const x = laneXs[lane];

        if (lane !== freeFloorLane) {
          const obsType = Math.random();
          if (obsType < 0.4) {
            // Detailed Low Barrier (Jump over)
            const barrierGrp = new THREE.Group();
            barrierGrp.position.set(x, 0, z);

            const pL = new THREE.Mesh(this.geos.barrierPylon, this.materials.barrierFrame);
            pL.position.set(-1.1, 0.4, 0);
            const pR = new THREE.Mesh(this.geos.barrierPylon, this.materials.barrierFrame);
            pR.position.set(1.1, 0.4, 0);
            const bar = new THREE.Mesh(this.geos.barrierBar, this.materials.barrierHazard);
            bar.position.set(0, 0.4, 0);

            barrierGrp.add(pL); barrierGrp.add(pR); barrierGrp.add(bar);
            chunkGroup.add(barrierGrp);

            this.obstacles.push({
              mesh: barrierGrp,
              type: 'jump',
              hitbox: { minX: x - 1.1, maxX: x + 1.1, minY: 0, maxY: 0.8, minZ: z - 0.3, maxZ: z + 0.3 }
            });
          } else if (obsType < 0.75) {
            // High Laser Barrier (Slide under)
            const barrierGrp = new THREE.Group();
            barrierGrp.position.set(x, 0, z);

            const pL = new THREE.Mesh(this.geos.barrierPylon, this.materials.barrierFrame);
            pL.scale.set(1, 2.8, 1);
            pL.position.set(-1.1, 1.4, 0);
            const pR = new THREE.Mesh(this.geos.barrierPylon, this.materials.barrierFrame);
            pR.scale.set(1, 2.8, 1);
            pR.position.set(1.1, 1.4, 0);

            const bar = new THREE.Mesh(this.geos.highBarrierBar, this.materials.barrierHazard);
            bar.position.set(0, 2.0, 0);

            barrierGrp.add(pL); barrierGrp.add(pR); barrierGrp.add(bar);
            chunkGroup.add(barrierGrp);

            this.obstacles.push({
              mesh: barrierGrp,
              type: 'slide',
              hitbox: { minX: x - 1.1, maxX: x + 1.1, minY: 1.1, maxY: 2.9, minZ: z - 0.3, maxZ: z + 0.3 }
            });
          } else {
            // Metallic Spike Cluster with Glowing Tips
            const spikeGrp = new THREE.Group();
            spikeGrp.position.set(x, 0, z);

            for (let s = -0.5; s <= 0.5; s += 0.5) {
              const base = new THREE.Mesh(this.geos.spikeBase, this.materials.spike);
              base.position.set(s, 0.15, 0);
              const tip = new THREE.Mesh(this.geos.spikeCone, this.materials.spikeTip);
              tip.position.set(s, 0.55, 0);
              spikeGrp.add(base);
              spikeGrp.add(tip);
            }
            chunkGroup.add(spikeGrp);

            this.obstacles.push({
              mesh: spikeGrp,
              type: 'spike',
              hitbox: { minX: x - 0.9, maxX: x + 0.9, minY: 0, maxY: 1.1, minZ: z - 0.3, maxZ: z + 0.3 }
            });
          }
        } else {
          // Free floor lane: Coins or Powerup
          if (Math.random() < 0.12) {
            const types = ['magnet', 'shield', 'multiplier', 'slowmo'];
            const pType = types[Math.floor(Math.random() * types.length)];
            const colorMap = { shield: 0x38bdf8, magnet: 0xf43f5e, multiplier: 0xfacc15, slowmo: 0x22c55e };
            const pMesh = new THREE.Mesh(this.geos.powerup, new THREE.MeshBasicMaterial({ color: colorMap[pType] }));
            pMesh.position.set(x, 1.2, z);
            chunkGroup.add(pMesh);
            this.powerups.push({ mesh: pMesh, type: pType, active: true, z, isCeiling: false });
          } else {
            for (let c = 0; c < 3; c++) {
              const coinMesh = this.createCoinMesh(false);
              const coinZ = z - 1.5 + c * 1.5;
              const coinY = 0.8 + Math.sin((c / 2) * Math.PI) * 0.7;
              coinMesh.position.set(x, coinY, coinZ);
              chunkGroup.add(coinMesh);
              this.coins.push({ mesh: coinMesh, active: true, x, y: coinY, z: coinZ });
            }
          }
        }
      }

      // Ceiling obstacles & coins
      for (let lane = 0; lane < 3; lane++) {
        const x = laneXs[lane];

        if (lane !== freeCeilLane) {
          if (Math.random() < 0.45) {
            const isHangingSpike = Math.random() < 0.5;
            if (isHangingSpike) {
              const spikeGrp = new THREE.Group();
              spikeGrp.position.set(x, 0, z);

              for (let s = -0.4; s <= 0.4; s += 0.4) {
                const tip = new THREE.Mesh(this.geos.hangingCone, this.materials.spikeTip);
                tip.position.set(s, CONFIG.CEILING_HEIGHT - 0.55, 0);
                spikeGrp.add(tip);
              }
              chunkGroup.add(spikeGrp);
              this.obstacles.push({
                mesh: spikeGrp,
                type: 'ceiling_spike',
                hitbox: { minX: x - 0.9, maxX: x + 0.9, minY: CONFIG.CEILING_HEIGHT - 1.1, maxY: CONFIG.CEILING_HEIGHT, minZ: z - 0.3, maxZ: z + 0.3 }
              });
            } else {
              // Ceiling Low Barrier (hangs down from ceiling)
              const barrierGrp = new THREE.Group();
              barrierGrp.position.set(x, 0, z);

              const bar = new THREE.Mesh(this.geos.barrierBar, this.materials.barrierHazard);
              bar.position.set(0, CONFIG.CEILING_HEIGHT - 0.4, 0);
              barrierGrp.add(bar);
              chunkGroup.add(barrierGrp);

              this.obstacles.push({
                mesh: barrierGrp,
                type: 'ceiling_jump',
                hitbox: { minX: x - 1.1, maxX: x + 1.1, minY: CONFIG.CEILING_HEIGHT - 0.8, maxY: CONFIG.CEILING_HEIGHT, minZ: z - 0.3, maxZ: z + 0.3 }
              });
            }
          }
        } else {
          // Free Ceiling Lane: Purple Grav-Coins
          for (let c = 0; c < 3; c++) {
            const coinMesh = this.createCoinMesh(true);
            const coinZ = z - 1.5 + c * 1.5;
            const coinY = CONFIG.CEILING_HEIGHT - 0.8 - Math.sin((c / 2) * Math.PI) * 0.6;
            coinMesh.position.set(x, coinY, coinZ);
            chunkGroup.add(coinMesh);
            this.coins.push({ mesh: coinMesh, active: true, isGravBonus: true, x, y: coinY, z: coinZ });
          }
        }
      }
    }
  }

  createCoinMesh(isGrav) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(this.geos.coinCore, isGrav ? this.materials.gravCoin : this.materials.coin);
    const rim = new THREE.Mesh(this.geos.coinRim, isGrav ? this.materials.gravRing : this.materials.coinRing);
    group.add(core);
    group.add(rim);
    return group;
  }

  initTrack() {
    for (const c of this.activeChunks) {
      this.scene.remove(c.group);
    }
    this.activeChunks = [];
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.currentChunkIndex = 0;

    for (let i = 0; i < CONFIG.MAX_ACTIVE_CHUNKS; i++) {
      const chunk = this.createChunk(i);
      this.activeChunks.push(chunk);
      this.currentChunkIndex++;
    }
  }

  update(playerZ) {
    if (this.activeChunks.length > 0) {
      const firstChunk = this.activeChunks[0];
      if (playerZ > (firstChunk.zIndex + 1) * CONFIG.CHUNK_LENGTH + 10) {
        this.scene.remove(firstChunk.group);
        this.activeChunks.shift();

        const newChunk = this.createChunk(this.currentChunkIndex);
        this.activeChunks.push(newChunk);
        this.currentChunkIndex++;
      }
    }

    // Animate item rotations
    const time = performance.now() * 0.003;
    for (let i = 0; i < this.coins.length; i++) {
      const c = this.coins[i];
      if (c.active) {
        c.mesh.rotation.z = time * 2;
        c.mesh.rotation.y = time * 1.5;
      }
    }
    for (let i = 0; i < this.powerups.length; i++) {
      const p = this.powerups[i];
      if (p.active) {
        p.mesh.rotation.y = time * 2.5;
        p.mesh.rotation.x = time * 1.5;
      }
    }
  }
}
