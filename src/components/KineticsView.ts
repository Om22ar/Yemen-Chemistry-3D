import { KineticsSimulation3D, type KineticsSimulationConfig } from '../simulations/KineticsSimulation3D';

export class KineticsView {
  private element: HTMLElement;
  private sim: KineticsSimulation3D | null = null;
  private canvasContainer: HTMLElement | null = null;
  private chartCanvas: HTMLCanvasElement | null = null;
  private chartCtx: CanvasRenderingContext2D | null = null;
  private graphHistory: { a: number; b: number; ab: number }[] = [];
  private graphInterval: number | null = null;

  private config: KineticsSimulationConfig = {
    temperatureC: 35,
    pressureAtm: 1,
    concentrationA: 20,
    concentrationB: 20,
    catalyst: false,
  };

  private isDockCollapsed: boolean = false;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'relative w-full h-[calc(100vh-65px)] flex flex-col bg-slate-100 overflow-hidden select-none';
    container.appendChild(this.element);

    this.render();
    this.initSimulation();
    this.initChart();
  }

  private render() {
    this.element.innerHTML = `
      <!-- Top Live Stats Bar (Clean & Static - No Pulsating Dots) -->
      <div class="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-sm text-xs">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-800 text-sm">⚛️ محاكاة سرعة التفاعل ونظرية التصادم</span>
          <span class="hidden sm:inline text-slate-400">·</span>
          <span class="hidden sm:inline text-slate-500 font-mono text-[11px]">N₂ (أزرق) + H₂ (أحمر) ⇌ NH₃ (بنفسجي)</span>
        </div>

        <div class="flex items-center gap-4 text-xs">
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500">الحرارة:</span>
            <span id="stat-temp" class="font-mono-numbers font-bold text-slate-900">35°م</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500">الضغط:</span>
            <span id="stat-pressure" class="font-mono-numbers font-bold text-slate-900">1.0 بار</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500">التصادم الفعال/ث:</span>
            <span id="stat-rate" class="font-mono-numbers font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">0</span>
          </div>
        </div>
      </div>

      <!-- Real-Time Mini Equilibrium Graph Card (Top-Right) -->
      <div class="absolute top-18 right-4 z-20 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-sm hidden md:block w-64">
        <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
          <span>منحنى التراكيز مع الزمن</span>
          <span class="text-[10px] text-slate-400 font-mono">الاتزان الكيميائي</span>
        </div>
        <canvas id="concentration-chart" width="230" height="90" class="w-full h-[90px] rounded-lg bg-slate-50 border border-slate-200"></canvas>
        <div class="flex items-center justify-around text-[10px] mt-1.5 font-bold">
          <span class="text-sky-600 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-sky-600"></span> [N₂]</span>
          <span class="text-rose-600 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-600"></span> [H₂]</span>
          <span class="text-purple-600 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-600"></span> [NH₃]</span>
        </div>
      </div>

      <!-- 3D WebGL Canvas Container -->
      <div id="sim-canvas-viewport" class="simulation-canvas-container flex-1"></div>

      <!-- Collapsible Bottom Dock (Per Three.js ergonomics: no mid-flank clutter, zero occlusion) -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl transition-all duration-300 ${
        this.isDockCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }">
        <div class="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-lg p-4">
          <!-- Dock Header Toggle -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div class="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>🎛️</span>
              <span>لوحة التحكم في متغيرات التفاعل وقاعدة لوشاتلييه</span>
            </div>
            <button id="btn-toggle-dock" class="text-xs text-slate-500 hover:text-slate-900 font-semibold px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1">
              <span>${this.isDockCollapsed ? '▴ إظهار عناصر التحكم' : '▾ طي لوحة التحكم'}</span>
            </button>
          </div>

          <!-- Controls Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <!-- 1. Temperature Slider -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-slate-600 font-medium">الحرارة (متوسط الطاقة):</span>
                <span id="val-temp" class="font-mono-numbers font-bold text-slate-900">${this.config.temperatureC}°م</span>
              </div>
              <input id="slider-temp" type="range" min="0" max="100" step="5" value="${this.config.temperatureC}" class="w-full accent-sky-600 cursor-pointer" />
            </div>

            <!-- 2. Pressure / Volume Piston Slider -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-slate-600 font-medium">الضغط (حركة المكبس):</span>
                <span id="val-pressure" class="font-mono-numbers font-bold text-slate-900">${this.config.pressureAtm} بار</span>
              </div>
              <input id="slider-pressure" type="range" min="1" max="10" step="1" value="${this.config.pressureAtm}" class="w-full accent-sky-600 cursor-pointer" />
            </div>

            <!-- 3. Concentrations -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-slate-600 font-medium">تركيز المتفاعلات:</span>
                <span id="val-conc" class="font-mono-numbers font-bold text-slate-900">A:${this.config.concentrationA} | B:${this.config.concentrationB}</span>
              </div>
              <div class="flex items-center gap-2">
                <button id="btn-add-particles" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-1 rounded-lg font-semibold transition-colors">
                  + زيادة التركيز
                </button>
                <button id="btn-remove-particles" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-1 rounded-lg font-semibold transition-colors">
                  - تقليل التركيز
                </button>
              </div>
            </div>

            <!-- 4. Catalyst & Force Collision -->
            <div class="space-y-2 flex flex-col justify-end">
              <label class="flex items-center gap-2 cursor-pointer">
                <input id="chk-catalyst" type="checkbox" ${this.config.catalyst ? 'checked' : ''} class="w-4 h-4 accent-amber-500 rounded cursor-pointer" />
                <span class="font-bold text-slate-800">إضافة عامل حفاز (خفض Ea)</span>
              </label>

              <div class="flex items-center gap-2">
                <button id="btn-force-collision" class="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-1.5 rounded-lg transition-all shadow-xs">
                  💥 تصادم إجباري
                </button>
                <button id="btn-reset-sim" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                  🔄
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvasContainer = this.element.querySelector('#sim-canvas-viewport');
    this.chartCanvas = this.element.querySelector('#concentration-chart');
    if (this.chartCanvas) {
      this.chartCtx = this.chartCanvas.getContext('2d');
    }

    this.bindControls();
  }

  private initSimulation() {
    if (!this.canvasContainer) return;

    this.config.onStatsUpdate = (stats) => {
      const elRate = this.element.querySelector('#stat-rate');
      if (elRate) elRate.textContent = `${stats.effectiveCollisionsPerSec}`;

      // Feed real-time graph
      this.graphHistory.push({
        a: stats.countA,
        b: stats.countB,
        ab: stats.countAB,
      });
      if (this.graphHistory.length > 40) {
        this.graphHistory.shift();
      }
      this.drawChart();
    };

    this.sim = new KineticsSimulation3D(this.canvasContainer, this.config);
  }

  private initChart() {
    this.drawChart();
  }

  private drawChart() {
    if (!this.chartCtx || !this.chartCanvas) return;
    const ctx = this.chartCtx;
    const w = this.chartCanvas.width;
    const h = this.chartCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (this.graphHistory.length < 2) return;

    const maxVal = 50;

    const drawLine = (key: 'a' | 'b' | 'ab', color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < this.graphHistory.length; i++) {
        const x = (i / (this.graphHistory.length - 1)) * (w - 10) + 5;
        const val = this.graphHistory[i][key];
        const y = h - (val / maxVal) * (h - 16) - 8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawLine('a', '#0284c7');
    drawLine('b', '#dc2626');
    drawLine('ab', '#9333ea');
  }

  private bindControls() {
    const sliderTemp = this.element.querySelector('#slider-temp') as HTMLInputElement;
    const valTemp = this.element.querySelector('#val-temp');
    const statTemp = this.element.querySelector('#stat-temp');
    sliderTemp?.addEventListener('input', () => {
      const val = parseInt(sliderTemp.value);
      this.config.temperatureC = val;
      if (valTemp) valTemp.textContent = `${val}°م`;
      if (statTemp) statTemp.textContent = `${val}°م`;
      this.sim?.updateConfig({ temperatureC: val });
    });

    const sliderPressure = this.element.querySelector('#slider-pressure') as HTMLInputElement;
    const valPressure = this.element.querySelector('#val-pressure');
    const statPressure = this.element.querySelector('#stat-pressure');
    sliderPressure?.addEventListener('input', () => {
      const val = parseInt(sliderPressure.value);
      this.config.pressureAtm = val;
      if (valPressure) valPressure.textContent = `${val} بار`;
      if (statPressure) statPressure.textContent = `${val}.0 بار`;
      this.sim?.updateConfig({ pressureAtm: val });
    });

    const chkCatalyst = this.element.querySelector('#chk-catalyst') as HTMLInputElement;
    chkCatalyst?.addEventListener('change', () => {
      this.config.catalyst = chkCatalyst.checked;
      this.sim?.updateConfig({ catalyst: chkCatalyst.checked });
    });

    this.element.querySelector('#btn-force-collision')?.addEventListener('click', () => {
      this.sim?.triggerForcedCollision();
    });

    this.element.querySelector('#btn-reset-sim')?.addEventListener('click', () => {
      this.sim?.resetSimulation();
      this.graphHistory = [];
      this.drawChart();
    });

    this.element.querySelector('#btn-add-particles')?.addEventListener('click', () => {
      this.config.concentrationA = Math.min(40, this.config.concentrationA + 5);
      this.config.concentrationB = Math.min(40, this.config.concentrationB + 5);
      const valConc = this.element.querySelector('#val-conc');
      if (valConc) valConc.textContent = `A:${this.config.concentrationA} | B:${this.config.concentrationB}`;
      this.sim?.updateConfig({
        concentrationA: this.config.concentrationA,
        concentrationB: this.config.concentrationB,
      });
    });

    this.element.querySelector('#btn-remove-particles')?.addEventListener('click', () => {
      this.config.concentrationA = Math.max(5, this.config.concentrationA - 5);
      this.config.concentrationB = Math.max(5, this.config.concentrationB - 5);
      const valConc = this.element.querySelector('#val-conc');
      if (valConc) valConc.textContent = `A:${this.config.concentrationA} | B:${this.config.concentrationB}`;
      this.sim?.updateConfig({
        concentrationA: this.config.concentrationA,
        concentrationB: this.config.concentrationB,
      });
    });

    this.element.querySelector('#btn-toggle-dock')?.addEventListener('click', () => {
      this.isDockCollapsed = !this.isDockCollapsed;
      this.render();
      this.initSimulation();
    });
  }

  public dispose() {
    if (this.graphInterval) clearInterval(this.graphInterval);
    this.sim?.dispose();
    this.element.remove();
  }
}
