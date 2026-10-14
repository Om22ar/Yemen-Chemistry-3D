import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface KineticsSimulationConfig {
  temperatureC: number; // 0 to 100
  pressureAtm: number; // 1 to 10
  concentrationA: number; // 10 to 40
  concentrationB: number; // 10 to 40
  catalyst: boolean;
  onStatsUpdate?: (stats: {
    effectiveCollisionsPerSec: number;
    totalCollisionsPerSec: number;
    countA: number;
    countB: number;
    countAB: number;
    reactionRate: number;
  }) => void;
}

interface Particle {
  mesh: THREE.Group;
  type: 'A' | 'B' | 'AB';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  id: number;
}

export class KineticsSimulation3D {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private particles: Particle[] = [];
  private animFrameId: number | null = null;
  private clock: THREE.Clock;
  private config: KineticsSimulationConfig;

  // 3D Chamber Objects
  private chamberGroup: THREE.Group;
  private pistonMesh: THREE.Group;
  private catalystMesh: THREE.Mesh;
  private chamberWidth = 2.4;
  private chamberDepth = 2.4;
  private chamberMaxHeight = 2.8;
  private chamberCurrentHeight = 2.8;

  // Collision statistics tracking
  private collisionCountWindow: number = 0;
  private effectiveCountWindow: number = 0;
  private lastStatTime: number = 0;
  private effectiveRatePerSec: number = 0;
  private totalRatePerSec: number = 0;

  // Shared reusable geometries and materials
  private sphereGeom: THREE.SphereGeometry;
  private bondGeom: THREE.CylinderGeometry;
  private matA: THREE.MeshStandardMaterial;
  private matB: THREE.MeshStandardMaterial;
  private matAB: THREE.MeshStandardMaterial;
  private matBond: THREE.MeshStandardMaterial;

  constructor(container: HTMLElement, initialConfig: KineticsSimulationConfig) {
    this.container = container;
    this.config = { ...initialConfig };
    this.clock = new THREE.Clock();

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf1f5f9);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    this.camera.position.set(0, 2.5, 4.8);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1.2, 0);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 8.0;

    // Studio Environment map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting
    this.setupLighting();

    // Shared particle assets
    this.sphereGeom = new THREE.SphereGeometry(0.09, 16, 16);
    this.bondGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.14, 8);
    this.matA = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sky Blue
      roughness: 0.25,
      metalness: 0.2,
    });
    this.matB = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Coral Red
      roughness: 0.25,
      metalness: 0.2,
    });
    this.matAB = new THREE.MeshStandardMaterial({
      color: 0x9333ea, // Purple
      roughness: 0.2,
      metalness: 0.35,
    });
    this.matBond = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.4,
      metalness: 0.6,
    });

    // Build 3D Chamber
    this.chamberGroup = this.buildChamber();
    this.scene.add(this.chamberGroup);

    // Build Movable Piston
    this.pistonMesh = this.buildPiston();
    this.scene.add(this.pistonMesh);

    // Catalyst Grid
    this.catalystMesh = this.buildCatalystMesh();
    this.scene.add(this.catalystMesh);
    this.catalystMesh.visible = this.config.catalyst;

    // Spawn initial particles
    this.spawnParticles();

    // Resize handler
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);

    // Start render loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfd8dc, 2.5);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 3.2);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
    fillLight.position.set(-3, 3, -2);
    this.scene.add(fillLight);

    // Floor Contact Shadow Plate
    const floorGeom = new THREE.PlaneGeometry(6, 6);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  private buildChamber(): THREE.Group {
    const group = new THREE.Group();

    // Chamber Base
    const baseGeom = new THREE.BoxGeometry(this.chamberWidth + 0.3, 0.12, this.chamberDepth + 0.3);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.06;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // 4 Corner Metal Pillars
    const pillarGeom = new THREE.CylinderGeometry(0.04, 0.04, this.chamberMaxHeight, 16);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.2, metalness: 0.9 });
    const hw = this.chamberWidth / 2;
    const hd = this.chamberDepth / 2;
    const py = this.chamberMaxHeight / 2 + 0.12;

    const corners = [
      [-hw, -hd],
      [hw, -hd],
      [-hw, hd],
      [hw, hd],
    ];
    for (const [cx, cz] of corners) {
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(cx, py, cz);
      pillar.castShadow = true;
      group.add(pillar);
    }

    // Glass Walls (Semi-transparent)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5,
      depthWrite: false,
    });

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.chamberWidth, this.chamberMaxHeight),
      glassMat
    );
    backWall.position.set(0, py, -hd);
    group.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.chamberDepth, this.chamberMaxHeight),
      glassMat
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-hw, py, 0);
    group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.chamberDepth, this.chamberMaxHeight),
      glassMat
    );
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(hw, py, 0);
    group.add(rightWall);

    return group;
  }

  private buildPiston(): THREE.Group {
    const group = new THREE.Group();

    // Piston Plate
    const plateGeom = new THREE.BoxGeometry(this.chamberWidth - 0.04, 0.1, this.chamberDepth - 0.04);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sky Blue Accent
      roughness: 0.3,
      metalness: 0.7,
    });
    const plate = new THREE.Mesh(plateGeom, plateMat);
    plate.castShadow = true;
    group.add(plate);

    // Piston Rod
    const rodGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 16);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.9 });
    const rod = new THREE.Mesh(rodGeom, rodMat);
    rod.position.y = 0.65;
    rod.castShadow = true;
    group.add(rod);

    // Pressure Gauge Handle
    const handleGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.5 });
    const handle = new THREE.Mesh(handleGeom, handleMat);
    handle.position.y = 1.25;
    group.add(handle);

    // Initial position at top
    group.position.y = this.chamberMaxHeight + 0.07;
    return group;
  }

  private buildCatalystMesh(): THREE.Mesh {
    const geom = new THREE.BoxGeometry(this.chamberWidth - 0.1, 0.04, this.chamberDepth - 0.1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Gold/Amber honeycomb catalyst
      roughness: 0.3,
      metalness: 0.85,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = 0.14;
    return mesh;
  }

  private createParticleMesh(type: 'A' | 'B' | 'AB'): THREE.Group {
    const group = new THREE.Group();
    if (type === 'A') {
      const s1 = new THREE.Mesh(this.sphereGeom, this.matA);
      s1.position.x = -0.06;
      s1.castShadow = true;
      const s2 = new THREE.Mesh(this.sphereGeom, this.matA);
      s2.position.x = 0.06;
      s2.castShadow = true;
      const bond = new THREE.Mesh(this.bondGeom, this.matBond);
      bond.rotation.z = Math.PI / 2;
      group.add(s1, s2, bond);
    } else if (type === 'B') {
      const s1 = new THREE.Mesh(this.sphereGeom, this.matB);
      s1.position.x = -0.06;
      s1.castShadow = true;
      const s2 = new THREE.Mesh(this.sphereGeom, this.matB);
      s2.position.x = 0.06;
      s2.castShadow = true;
      const bond = new THREE.Mesh(this.bondGeom, this.matBond);
      bond.rotation.z = Math.PI / 2;
      group.add(s1, s2, bond);
    } else {
      // Product AB: One blue atom + one red atom bonded
      const s1 = new THREE.Mesh(this.sphereGeom, this.matA);
      s1.position.x = -0.07;
      s1.castShadow = true;
      const s2 = new THREE.Mesh(this.sphereGeom, this.matB);
      s2.position.x = 0.07;
      s2.castShadow = true;
      const bond = new THREE.Mesh(this.bondGeom, this.matAB);
      bond.rotation.z = Math.PI / 2;
      group.add(s1, s2, bond);
    }
    return group;
  }

  private spawnParticles() {
    // Clear existing
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];

    const numA = Math.floor(this.config.concentrationA);
    const numB = Math.floor(this.config.concentrationB);

    let id = 0;
    for (let i = 0; i < numA; i++) {
      this.addParticle('A', id++);
    }
    for (let i = 0; i < numB; i++) {
      this.addParticle('B', id++);
    }
  }

  private addParticle(type: 'A' | 'B' | 'AB', id: number) {
    const mesh = this.createParticleMesh(type);
    const hw = (this.chamberWidth - 0.3) / 2;
    const hd = (this.chamberDepth - 0.3) / 2;
    const minY = 0.3;
    const maxY = this.chamberCurrentHeight - 0.2;

    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 2 * hw,
      minY + Math.random() * (maxY - minY),
      (Math.random() - 0.5) * 2 * hd
    );

    // Velocity scale depends on temperature: v ~ sqrt(T_kelvin)
    const tKelvin = this.config.temperatureC + 273.15;
    const speed = 0.8 * Math.sqrt(tKelvin / 298.15);

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const vel = new THREE.Vector3(
      speed * Math.sin(phi) * Math.cos(theta),
      speed * Math.sin(phi) * Math.sin(theta),
      speed * Math.cos(phi)
    );

    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      type,
      position: pos,
      velocity: vel,
      radius: 0.14,
      id,
    });
  }

  public updateConfig(newConfig: Partial<KineticsSimulationConfig>) {
    const prevCatalyst = this.config.catalyst;
    const prevTemp = this.config.temperatureC;
    const prevConcA = this.config.concentrationA;
    const prevConcB = this.config.concentrationB;

    this.config = { ...this.config, ...newConfig };

    if (newConfig.catalyst !== undefined) {
      this.catalystMesh.visible = this.config.catalyst;
    }

    // Velocity scaling when temperature changes
    if (newConfig.temperatureC !== undefined && newConfig.temperatureC !== prevTemp) {
      const prevKelvin = prevTemp + 273.15;
      const newKelvin = this.config.temperatureC + 273.15;
      const ratio = Math.sqrt(newKelvin / prevKelvin);
      for (const p of this.particles) {
        p.velocity.multiplyScalar(ratio);
      }
    }

    // Add or remove particles if concentrations changed
    if (newConfig.concentrationA !== undefined && newConfig.concentrationA !== prevConcA) {
      const diff = Math.floor(this.config.concentrationA) - this.particles.filter((p) => p.type === 'A').length;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) this.addParticle('A', Date.now() + i);
      } else if (diff < 0) {
        const toRemove = -diff;
        let removed = 0;
        for (let i = this.particles.length - 1; i >= 0 && removed < toRemove; i--) {
          if (this.particles[i].type === 'A') {
            this.scene.remove(this.particles[i].mesh);
            this.particles.splice(i, 1);
            removed++;
          }
        }
      }
    }

    if (newConfig.concentrationB !== undefined && newConfig.concentrationB !== prevConcB) {
      const diff = Math.floor(this.config.concentrationB) - this.particles.filter((p) => p.type === 'B').length;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) this.addParticle('B', Date.now() + i + 100);
      } else if (diff < 0) {
        const toRemove = -diff;
        let removed = 0;
        for (let i = this.particles.length - 1; i >= 0 && removed < toRemove; i--) {
          if (this.particles[i].type === 'B') {
            this.scene.remove(this.particles[i].mesh);
            this.particles.splice(i, 1);
            removed++;
          }
        }
      }
    }
  }

  public triggerForcedCollision() {
    // Bring two opposite particles directly toward each other with high energy
    const aList = this.particles.filter((p) => p.type === 'A');
    const bList = this.particles.filter((p) => p.type === 'B');
    if (aList.length > 0 && bList.length > 0) {
      const pA = aList[0];
      const pB = bList[0];
      pA.position.set(-0.5, 1.2, 0);
      pB.position.set(0.5, 1.2, 0);
      pA.velocity.set(2.5, 0, 0);
      pB.velocity.set(-2.5, 0, 0);
    }
  }

  public resetSimulation() {
    this.spawnParticles();
  }

  private animate() {
    this.animFrameId = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Smoothly interpolate Piston Height based on pressure (1 to 10 atm)
    // Higher pressure => smaller volume => lower piston height
    const targetHeight = THREE.MathUtils.lerp(
      this.chamberMaxHeight,
      0.9,
      (this.config.pressureAtm - 1) / 9
    );
    this.chamberCurrentHeight = THREE.MathUtils.damp(
      this.chamberCurrentHeight,
      targetHeight,
      4,
      dt
    );
    this.pistonMesh.position.y = this.chamberCurrentHeight + 0.07;

    // Update Particles
    this.updatePhysics(dt);

    // Orbit controls
    this.controls.update();

    // Render
    this.renderer.render(this.scene, this.camera);

    // Periodic stats emission (every 0.5s)
    const now = performance.now();
    if (now - this.lastStatTime >= 500) {
      const elapsedSec = (now - this.lastStatTime) / 1000;
      this.totalRatePerSec = Math.round(this.collisionCountWindow / elapsedSec);
      this.effectiveRatePerSec = Math.round(this.effectiveCountWindow / elapsedSec);
      this.collisionCountWindow = 0;
      this.effectiveCountWindow = 0;
      this.lastStatTime = now;

      const countA = this.particles.filter((p) => p.type === 'A').length;
      const countB = this.particles.filter((p) => p.type === 'B').length;
      const countAB = this.particles.filter((p) => p.type === 'AB').length;

      this.config.onStatsUpdate?.({
        effectiveCollisionsPerSec: this.effectiveRatePerSec,
        totalCollisionsPerSec: this.totalRatePerSec,
        countA,
        countB,
        countAB,
        reactionRate: this.effectiveRatePerSec,
      });
    }
  }

  private updatePhysics(dt: number) {
    const hw = (this.chamberWidth - 0.28) / 2;
    const hd = (this.chamberDepth - 0.28) / 2;
    const minY = 0.2;
    const maxY = this.chamberCurrentHeight - 0.12;

    // Move particles & bounce off chamber boundaries
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.position.addScaledVector(p.velocity, dt);

      // Bounce X
      if (p.position.x > hw) {
        p.position.x = hw;
        p.velocity.x *= -1;
      } else if (p.position.x < -hw) {
        p.position.x = -hw;
        p.velocity.x *= -1;
      }

      // Bounce Z
      if (p.position.z > hd) {
        p.position.z = hd;
        p.velocity.z *= -1;
      } else if (p.position.z < -hd) {
        p.position.z = -hd;
        p.velocity.z *= -1;
      }

      // Bounce Y (Floor & Piston)
      if (p.position.y > maxY) {
        p.position.y = maxY;
        p.velocity.y *= -1;
      } else if (p.position.y < minY) {
        p.position.y = minY;
        p.velocity.y *= -1;
      }

      // Subtle rotation for diatomic realism
      p.mesh.rotation.x += p.velocity.y * dt * 2;
      p.mesh.rotation.y += p.velocity.x * dt * 2;
      p.mesh.position.copy(p.position);
    }

    // Inter-particle Collisions
    const effectiveThreshold = this.config.catalyst ? 0.9 : 1.7; // Catalyst lowers Ea!

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];

        const delta = p1.position.clone().sub(p2.position);
        const dist = delta.length();
        const minDist = p1.radius + p2.radius;

        if (dist < minDist && dist > 0.001) {
          this.collisionCountWindow++;

          // Normal collision elastic response
          const normal = delta.normalize();
          const p1Norm = p1.velocity.dot(normal);
          const p2Norm = p2.velocity.dot(normal);

          // Relative approach speed is proportional to collision energy
          const relSpeed = Math.abs(p1Norm - p2Norm);

          // Elastic bounce
          p1.velocity.sub(normal.clone().multiplyScalar(p1Norm - p2Norm));
          p2.velocity.add(normal.clone().multiplyScalar(p1Norm - p2Norm));

          // Separation to avoid overlapping
          const overlap = 0.5 * (minDist - dist);
          p1.position.addScaledVector(normal, overlap);
          p2.position.addScaledVector(normal, -overlap);

          // Chemical Reaction Condition (Effective Collision)
          // 1. Reactants A and B colliding
          // 2. Relative Kinetic Energy >= Activation Energy (Ea)
          if (
            ((p1.type === 'A' && p2.type === 'B') || (p1.type === 'B' && p2.type === 'A')) &&
            relSpeed >= effectiveThreshold
          ) {
            this.effectiveCountWindow++;

            // Transform into product AB!
            p1.type = 'AB';
            this.scene.remove(p1.mesh);
            p1.mesh = this.createParticleMesh('AB');
            this.scene.add(p1.mesh);

            // Remove p2 (consumption of second reactant)
            this.scene.remove(p2.mesh);
            this.particles.splice(j, 1);
            j--; // adjust loop index
          }
          // Reversible reaction: AB colliding with high energy can decompose back into A + B
          else if (p1.type === 'AB' && relSpeed >= effectiveThreshold * 1.5) {
            p1.type = 'A';
            this.scene.remove(p1.mesh);
            p1.mesh = this.createParticleMesh('A');
            this.scene.add(p1.mesh);

            // Spawn B alongside
            this.addParticle('B', Date.now());
          }
        }
      }
    }
  }

  private onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
