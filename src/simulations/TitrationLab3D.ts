import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { IndicatorType, TitrationDataPoint } from '../types';

export interface TitrationLabConfig {
  analyteName: string;
  analyteFormula: string;
  analyteVolumeMl: number; // e.g. 25 mL
  analyteActualMolarity: number; // e.g. 0.100 M
  titrantName: string;
  titrantFormula: string;
  titrantMolarity: number; // e.g. 0.100 M
  indicator: IndicatorType;
  onUpdate?: (state: {
    volumeAddedMl: number;
    dropsCount: number;
    currentPH: number;
    colorHex: string;
    isEquivalenceReached: boolean;
    history: TitrationDataPoint[];
  }) => void;
}

export class TitrationLab3D {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private animFrameId: number | null = null;
  private clock: THREE.Clock;
  private config: TitrationLabConfig;

  // Lab 3D Parts
  private stopcockLever: THREE.Mesh;
  private liquidMesh: THREE.Mesh;
  private stirBar: THREE.Mesh;
  private dropletMesh: THREE.Mesh;
  private buretLiquidMesh: THREE.Mesh;

  // Experiment State
  private dropsCount: number = 0;
  private volumeAddedMl: number = 0;
  private readonly mlPerDrop = 0.05; // Standard 20 drops per mL
  private history: TitrationDataPoint[] = [];
  private isDropping: boolean = false;
  private dropletProgress: number = 0;
  private isStirring: boolean = true;
  private autoDripInterval: number | null = null;

  constructor(container: HTMLElement, config: TitrationLabConfig) {
    this.container = container;
    this.config = { ...config };
    this.clock = new THREE.Clock();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf8fafc);

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
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    this.camera.position.set(0, 1.8, 3.6);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.target.set(0, 1.1, 0);
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 6.0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;

    // Studio Environment map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting
    this.setupLighting();

    // Build Bench and Glassware
    this.buildLaboratoryBench();
    const { stopcock, buretLiquid } = this.buildBuretAssembly();
    this.stopcockLever = stopcock;
    this.buretLiquidMesh = buretLiquid;

    const { liquid, stirBar } = this.buildFlaskAssembly();
    this.liquidMesh = liquid;
    this.stirBar = stirBar;

    this.dropletMesh = this.buildDroplet();
    this.scene.add(this.dropletMesh);

    // Initial calculation
    this.recalculatePH();

    // Resize
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);

    // Render loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfd8dc, 2.6);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 3.0);
    keyLight.position.set(2.5, 5.0, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.0);
    fillLight.position.set(-3, 2.5, -2);
    this.scene.add(fillLight);
  }

  private buildLaboratoryBench() {
    // Ceramic Laboratory Table Top
    const tableGeom = new THREE.BoxGeometry(4.2, 0.15, 3.0);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.05,
    });
    const table = new THREE.Mesh(tableGeom, tableMat);
    table.position.y = -0.075;
    table.receiveShadow = true;
    this.scene.add(table);

    // Soft Contact Shadow
    const shadowGeom = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeom, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.001, 0);
    this.scene.add(shadow);
  }

  private buildBuretAssembly(): { stopcock: THREE.Mesh; buretLiquid: THREE.Mesh } {
    const group = new THREE.Group();

    // Retort Stand Base (Heavy cast iron)
    const standBaseGeom = new THREE.BoxGeometry(0.5, 0.04, 0.7);
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.8 });
    const standBase = new THREE.Mesh(standBaseGeom, ironMat);
    standBase.position.set(-0.28, 0.02, 0);
    standBase.castShadow = true;
    group.add(standBase);

    // Retort Rod
    const rodGeom = new THREE.CylinderGeometry(0.016, 0.016, 2.4, 16);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.95 });
    const rod = new THREE.Mesh(rodGeom, steelMat);
    rod.position.set(-0.28, 1.22, 0);
    rod.castShadow = true;
    group.add(rod);

    // Buret Clamp
    const clampGeom = new THREE.BoxGeometry(0.32, 0.04, 0.06);
    const clamp = new THREE.Mesh(clampGeom, ironMat);
    clamp.position.set(-0.14, 1.6, 0);
    clamp.castShadow = true;
    group.add(clamp);

    // Glass Buret Tube
    const buretHeight = 1.35;
    const buretOuterGeom = new THREE.CylinderGeometry(0.04, 0.04, buretHeight, 24);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.88,
      ior: 1.5,
      depthWrite: false,
    });
    const buretOuter = new THREE.Mesh(buretOuterGeom, glassMat);
    buretOuter.position.set(0, 1.7, 0);
    group.add(buretOuter);

    // Titrant liquid column inside buret
    const buretLiquidGeom = new THREE.CylinderGeometry(0.036, 0.036, buretHeight - 0.04, 24);
    const titrantMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
    });
    const buretLiquid = new THREE.Mesh(buretLiquidGeom, titrantMat);
    buretLiquid.position.set(0, 1.7, 0);
    group.add(buretLiquid);

    // Buret Tip (Nozzle)
    const nozzleGeom = new THREE.ConeGeometry(0.025, 0.16, 16);
    const nozzle = new THREE.Mesh(nozzleGeom, glassMat);
    nozzle.rotation.x = Math.PI;
    nozzle.position.set(0, 1.7 - buretHeight / 2 - 0.08, 0);
    group.add(nozzle);

    // Stopcock Valve Housing & Lever
    const stopcockBodyGeom = new THREE.CylinderGeometry(0.032, 0.032, 0.1, 16);
    const stopcockBody = new THREE.Mesh(stopcockBodyGeom, ironMat);
    stopcockBody.rotation.z = Math.PI / 2;
    stopcockBody.position.set(0, 1.7 - buretHeight / 2 + 0.03, 0);
    group.add(stopcockBody);

    // Rotating Lever Handle
    const leverGeom = new THREE.BoxGeometry(0.03, 0.02, 0.14);
    const leverMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4 });
    const stopcock = new THREE.Mesh(leverGeom, leverMat);
    stopcock.position.set(0.06, 1.7 - buretHeight / 2 + 0.03, 0);
    group.add(stopcock);

    this.scene.add(group);
    return { stopcock, buretLiquid };
  }

  private buildFlaskAssembly(): { liquid: THREE.Mesh; stirBar: THREE.Mesh } {
    const group = new THREE.Group();

    // Magnetic Stirrer Plate Base
    const plateBaseGeom = new THREE.CylinderGeometry(0.38, 0.42, 0.12, 32);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.7,
    });
    const plate = new THREE.Mesh(plateBaseGeom, plateMat);
    plate.position.set(0, 0.06, 0);
    plate.castShadow = true;
    group.add(plate);

    // White Ceramic Top
    const ceramicGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.02, 32);
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.05 });
    const ceramic = new THREE.Mesh(ceramicGeom, ceramicMat);
    ceramic.position.set(0, 0.13, 0);
    group.add(ceramic);

    // Erlenmeyer Flask Glass
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.05,
      transmission: 0.9,
      ior: 1.5,
      depthWrite: false,
    });

    // Body (Conical base)
    const flaskBodyGeom = new THREE.ConeGeometry(0.28, 0.45, 32, 1, true);
    const flaskBody = new THREE.Mesh(flaskBodyGeom, glassMat);
    flaskBody.position.set(0, 0.14 + 0.225, 0);
    group.add(flaskBody);

    // Flask Neck
    const neckGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 24, 1, true);
    const neck = new THREE.Mesh(neckGeom, glassMat);
    neck.position.set(0, 0.14 + 0.45 + 0.11, 0);
    group.add(neck);

    // Flask Lip/Rim
    const lipGeom = new THREE.TorusGeometry(0.085, 0.012, 16, 24);
    const lip = new THREE.Mesh(lipGeom, glassMat);
    lip.rotation.x = Math.PI / 2;
    lip.position.set(0, 0.14 + 0.45 + 0.22, 0);
    group.add(lip);

    // Analyte Liquid Inside Flask
    const liquidGeom = new THREE.ConeGeometry(0.24, 0.28, 32);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      roughness: 0.15,
      metalness: 0.1,
    });
    const liquid = new THREE.Mesh(liquidGeom, liquidMat);
    liquid.position.set(0, 0.14 + 0.14, 0);
    group.add(liquid);

    // Magnetic Stir Bar (Teflon capsule)
    const stirGeom = new THREE.CapsuleGeometry(0.018, 0.07, 8, 16);
    const stirMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1 });
    const stirBar = new THREE.Mesh(stirGeom, stirMat);
    stirBar.rotation.x = Math.PI / 2;
    stirBar.position.set(0, 0.15, 0);
    group.add(stirBar);

    this.scene.add(group);
    return { liquid, stirBar };
  }

  private buildDroplet(): THREE.Mesh {
    const geom = new THREE.SphereGeometry(0.018, 16, 16);
    geom.scale(1, 1.8, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.1,
    });
    const droplet = new THREE.Mesh(geom, mat);
    droplet.visible = false;
    droplet.position.set(0, 0.94, 0);
    return droplet;
  }

  public addSingleDrop() {
    if (this.isDropping) return;
    this.dropsCount++;
    this.volumeAddedMl = parseFloat((this.dropsCount * this.mlPerDrop).toFixed(2));

    // Animate Stopcock turn
    this.stopcockLever.rotation.x += Math.PI / 2;

    // Trigger falling droplet animation
    this.isDropping = true;
    this.dropletProgress = 0;
    this.dropletMesh.visible = true;
    this.dropletMesh.position.set(0, 0.94, 0);

    this.recalculatePH();
  }

  public undoDrop() {
    if (this.dropsCount <= 0) return;
    this.dropsCount--;
    this.volumeAddedMl = parseFloat((this.dropsCount * this.mlPerDrop).toFixed(2));
    if (this.history.length > 0) {
      this.history.pop();
    }
    this.recalculatePH();
  }

  public toggleAutoDrip(enabled: boolean) {
    if (this.autoDripInterval) {
      clearInterval(this.autoDripInterval);
      this.autoDripInterval = null;
    }
    if (enabled) {
      this.autoDripInterval = window.setInterval(() => {
        this.addSingleDrop();
      }, 400);
    }
  }

  public setIndicator(indicator: IndicatorType) {
    this.config.indicator = indicator;
    this.recalculatePH();
  }

  public resetLab() {
    this.toggleAutoDrip(false);
    this.dropsCount = 0;
    this.volumeAddedMl = 0;
    this.history = [];
    this.recalculatePH();
  }

  private recalculatePH() {
    // Chemical Calculations: Titration of Strong Acid (HCl) with Strong Base (NaOH)
    // n_acid = M_a * V_a
    // n_base = M_b * V_b
    const Va_liters = this.config.analyteVolumeMl / 1000;
    const Vb_liters = this.volumeAddedMl / 1000;
    const Vtotal_liters = Va_liters + Vb_liters;

    const n_acid = this.config.analyteActualMolarity * Va_liters;
    const n_base = this.config.titrantMolarity * Vb_liters;

    let ph = 7.0;
    const deltaMoles = n_acid - n_base;

    if (Math.abs(deltaMoles) < 1e-9) {
      // Equivalence Point
      ph = 7.0;
    } else if (deltaMoles > 0) {
      // Excess Acid (before equivalence)
      const concH = deltaMoles / Vtotal_liters;
      ph = -Math.log10(concH);
    } else {
      // Excess Base (after equivalence)
      const concOH = -deltaMoles / Vtotal_liters;
      const poh = -Math.log10(concOH);
      ph = 14.0 - poh;
    }

    // Clamp pH between 0.5 and 13.8 for practical realistic bounds
    ph = Math.max(0.5, Math.min(13.8, ph));
    ph = parseFloat(ph.toFixed(2));

    // Determine Indicator Color
    const colorHex = this.getIndicatorColorHex(ph, this.config.indicator);

    // Apply color to 3D liquid mesh
    (this.liquidMesh.material as THREE.MeshStandardMaterial).color.set(colorHex);

    // Save to titration curve history
    const dataPoint: TitrationDataPoint = {
      volumeAddedMl: this.volumeAddedMl,
      ph,
      colorHex,
    };
    this.history.push(dataPoint);

    const isEquivalenceReached = Math.abs(ph - 7.0) <= 0.8 || (this.volumeAddedMl >= 24.5 && this.volumeAddedMl <= 25.5);

    this.config.onUpdate?.({
      volumeAddedMl: this.volumeAddedMl,
      dropsCount: this.dropsCount,
      currentPH: ph,
      colorHex,
      isEquivalenceReached,
      history: [...this.history],
    });
  }

  private getIndicatorColorHex(ph: number, indicator: IndicatorType): string {
    if (indicator === 'phenolphthalein') {
      // Colorless below 8.2, pink/magenta from 8.2 to 10.0
      if (ph < 8.2) {
        return '#f8fafc'; // Clear colorless
      } else if (ph > 10.0) {
        return '#ec4899'; // Vibrant magenta pink
      } else {
        // Interpolate pink shade
        const t = (ph - 8.2) / 1.8;
        return t > 0.5 ? '#f472b6' : '#fbcfe8';
      }
    } else if (indicator === 'bromothymol_blue') {
      // Yellow (pH < 6.0), Green (pH 6.0 - 7.6), Blue (pH > 7.6)
      if (ph < 6.0) {
        return '#facc15'; // Yellow
      } else if (ph > 7.6) {
        return '#2563eb'; // Deep Blue
      } else {
        return '#10b981'; // Green
      }
    } else {
      // methyl_orange: Red (pH < 3.1), Orange (pH 3.1 - 4.4), Yellow (pH > 4.4)
      if (ph < 3.1) {
        return '#ef4444'; // Red
      } else if (ph > 4.4) {
        return '#eab308'; // Golden Yellow
      } else {
        return '#f97316'; // Orange
      }
    }
  }

  private animate() {
    this.animFrameId = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Magnetic stir bar rotation
    if (this.isStirring) {
      this.stirBar.rotation.z += 15 * dt;
    }

    // Droplet falling animation
    if (this.isDropping) {
      this.dropletProgress += dt * 3.5;
      const startY = 0.94;
      const endY = 0.38;
      this.dropletMesh.position.y = THREE.MathUtils.lerp(startY, endY, this.dropletProgress);

      if (this.dropletProgress >= 1.0) {
        this.isDropping = false;
        this.dropletMesh.visible = false;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
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
    this.toggleAutoDrip(false);
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
