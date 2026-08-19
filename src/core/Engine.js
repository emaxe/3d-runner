import * as THREE from 'three';
import { BIOMES } from '../config/biomes.js';

/**
 * Engine - Core Three.js WebGL renderer, scene hierarchy, lighting, and quality profile management.
 */
export class Engine {
  constructor(containerElement) {
    this.container = containerElement || document.getElementById('canvas-container');
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BIOMES[0].skyColor);
    this.scene.fog = new THREE.FogExp2(BIOMES[0].fogColor, BIOMES[0].fogDensity);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      320
    );

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);

    // Lighting setup
    this.initLighting();
    this.initStarfield();

    // Resize listener
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initStarfield() {
    // Distant starfield points for depth
    this.starGroup = new THREE.Group();
    const starGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 1] = Math.random() * 60 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
      const c = 0.5 + Math.random() * 0.5;
      colors[i * 3] = c;
      colors[i * 3 + 1] = c;
      colors[i * 3 + 2] = c;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);
  }

  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    this.dirLight.position.set(15, 30, 20);
    this.scene.add(this.dirLight);

    // Rim/back light for richer silhouette definition
    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    this.rimLight.position.set(-10, 15, -20);
    this.scene.add(this.rimLight);

    // Hemisphere light for richer low poly ambient shading
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.4);
    this.scene.add(this.hemiLight);
  }

  setQuality(preset) {
    switch (preset) {
      case 'low':
        this.renderer.setPixelRatio(1);
        break;
      case 'med':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        break;
      case 'high':
      default:
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        break;
    }
    this.onWindowResize();
  }

  setBiomeVisuals(biome) {
    this.scene.background.setHex(biome.skyColor);
    this.scene.fog.color.setHex(biome.fogColor);
    this.scene.fog.density = biome.fogDensity || 0.015;
    this.dirLight.color.setHex(biome.lightColor || 0xffffff);
    this.rimLight.color.setHex(biome.accentColor || 0x38bdf8);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  render() {
    // Slowly rotate starfield for subtle parallax depth
    if (this.stars) {
      this.stars.rotation.y += 0.0001;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
