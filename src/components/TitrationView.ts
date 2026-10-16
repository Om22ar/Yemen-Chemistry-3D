import { TitrationLab3D, type TitrationLabConfig } from '../simulations/TitrationLab3D';
import { StorageService } from '../services/firebase';
import type { IndicatorType, TitrationDataPoint } from '../types';

export class TitrationView {
  private element: HTMLElement;
  private lab: TitrationLab3D | null = null;
  private canvasContainer: HTMLElement | null = null;
  private curveCanvas: HTMLCanvasElement | null = null;
  private curveCtx: CanvasRenderingContext2D | null = null;
  private isAutoDripActive: boolean = false;

  private config: TitrationLabConfig = {
    analyteName: 'حمض الهيدروكلوريك',
    analyteFormula: 'HCl',
    analyteVolumeMl: 25.0,
    analyteActualMolarity: 0.1, // 0.100 M -> Equivalence at 25.0 mL
    titrantName: 'هيدروكسيد الصوديوم القياسي',
    titrantFormula: 'NaOH',
    titrantMolarity: 0.1,
    indicator: 'phenolphthalein',
  };

  private currentVolumeAdded: number = 0;
  private currentPH: number = 1.0;
  private dropsCount: number = 0;
  private isEquivalenceReached: boolean = false;
  private history: TitrationDataPoint[] = [];

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'relative w-full h-[calc(100vh-65px)] flex flex-col bg-slate-50 overflow-hidden select-none';
    container.appendChild(this.element);

    this.render();
    this.initLab();
  }

  private render() {
    this.element.innerHTML = `
      <!-- Top Lab Header Strip -->
      <div class="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-20 flex flex-wrap items-center justify-between gap-2.5 bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div class="flex items-center gap-2 sm:gap-3">
          <span class="text-lg sm:text-xl shrink-0">🧪</span>
          <div>
            <div class="font-bold text-slate-900 text-xs sm:text-sm">
              معمل المعايرة الافتراضي: حمض وقاعدة قوية
            </div>
            <div class="text-[10px] sm:text-[11px] text-slate-500 font-mono hidden sm:block">
              HCl (25 mL مجهول التركيز) + NaOH القياسي (0.100 M في السحاحة)
            </div>
          </div>
        </div>

        <!-- Indicators Selector -->
        <div class="flex items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 rounded-xl text-[11px] sm:text-xs overflow-x-auto max-w-full">
          <span class="text-slate-500 font-medium px-1 hidden sm:inline">الدليل:</span>
          <button data-ind="phenolphthalein" class="ind-btn px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            this.config.indicator === 'phenolphthalein'
              ? 'bg-white text-pink-700 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }">
            فينولفثالين
          </button>
          <button data-ind="bromothymol_blue" class="ind-btn px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            this.config.indicator === 'bromothymol_blue'
              ? 'bg-white text-emerald-700 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }">
            أزرق بروموثيمول
          </button>
          <button data-ind="methyl_orange" class="ind-btn px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            this.config.indicator === 'methyl_orange'
              ? 'bg-white text-amber-700 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }">
            ميثيل برتقالي
          </button>
        </div>
      </div>

      <!-- Touch Zoom & Reset Overlay Controls for Mobile/Touch -->
      <div class="absolute top-16 sm:top-18 left-3 sm:left-4 z-20 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-sm">
        <button id="btn-titr-zoom-in" class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-base sm:text-lg font-bold shadow-2xs border border-slate-200 active:scale-95 transition-all cursor-pointer" title="تكبير">+</button>
        <button id="btn-titr-zoom-out" class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-base sm:text-lg font-bold shadow-2xs border border-slate-200 active:scale-95 transition-all cursor-pointer" title="تصغير">−</button>
        <button id="btn-titr-reset-cam" class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs border border-slate-200 active:scale-95 transition-all cursor-pointer" title="إعادة ضبط الكاميرا">↺</button>
      </div>

      <!-- Live pH Meter & Volume Badge (Top-Left Floating under touch buttons) -->
      <div class="absolute top-36 sm:top-38 left-3 sm:left-4 z-20 flex flex-col gap-1.5 sm:gap-2">
        <!-- Digital pH Meter -->
        <div class="bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-sm min-w-[130px] sm:min-w-[150px]">
          <div class="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-0.5">مقياس pH</div>
          <div class="flex items-baseline gap-1.5">
            <span id="meter-ph-val" class="text-2xl sm:text-3xl font-bold font-mono-numbers text-slate-900">1.00</span>
            <span id="meter-ph-status" class="text-[10px] sm:text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">حمضي</span>
          </div>
          <!-- Color indicator preview -->
          <div class="mt-1 flex items-center gap-1.5">
            <span id="color-preview" class="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs" style="background-color: #f8fafc;"></span>
            <span id="color-name" class="text-[10px] text-slate-500 font-medium truncate">عديم اللون</span>
          </div>
        </div>

        <!-- Volume Added Meter -->
        <div class="bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-sm min-w-[130px] sm:min-w-[150px]">
          <div class="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-0.5">حجم NaOH المستهلك</div>
          <div class="flex items-baseline gap-1">
            <span id="meter-vol-val" class="text-xl sm:text-2xl font-bold font-mono-numbers text-sky-700">0.00</span>
            <span class="text-[10px] sm:text-xs text-slate-500 font-medium">مل (mL)</span>
          </div>
          <div class="text-[9px] sm:text-[10px] text-slate-400 font-mono mt-0.5" id="meter-drops-val">
            عدد القطرات: 0 قطرة
          </div>
        </div>
      </div>

      <!-- Live Titration Curve (Top-Right Floating) -->
      <div class="absolute top-16 sm:top-18 right-3 sm:right-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-sm hidden md:block w-72">
        <div class="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
          <span>منحنى المعايرة الحجمية</span>
          <span class="text-[10px] text-sky-600 font-mono">pH مقابل الحجم</span>
        </div>
        <canvas id="titration-curve-canvas" width="260" height="150" class="w-full h-[150px] bg-slate-50 rounded-xl border border-slate-200"></canvas>
        <div class="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
          <span>0 mL</span>
          <span class="text-emerald-600 font-bold">نقطة التكافؤ (25 mL)</span>
          <span>50 mL</span>
        </div>
      </div>

      <!-- 3D Canvas -->
      <div id="titration-canvas-viewport" class="simulation-canvas-container flex-1"></div>

      <!-- Bottom Interactive Controls Dock -->
      <div class="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg p-2.5 sm:p-4">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          <div class="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2">
            <!-- Add 1 Drop Button -->
            <button id="btn-add-drop" class="col-span-2 sm:col-span-1 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
              <span class="text-sm sm:text-base">💧</span>
              <span>إضافة قطرة (+0.05 mL)</span>
            </button>

            <!-- Auto Drip Toggle Button -->
            <button id="btn-auto-drip" class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-1 cursor-pointer">
              <span>▶</span>
              <span id="txt-auto-drip" class="truncate">تدفق مستمر</span>
            </button>

            <!-- Undo Drop Button -->
            <button id="btn-undo-drop" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center" title="تراجع عن قطرة">
              ↩️
            </button>
          </div>

          <div class="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <!-- Reset Button -->
            <button id="btn-reset-lab" class="col-span-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer">
              تصفير
            </button>

            <!-- Complete Experiment & Calculate Molarity -->
            <button id="btn-evaluate" class="col-span-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
              <span>📋</span>
              <span class="truncate">حساب التركيز والتقرير</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Evaluation Report Modal (Hidden by default) -->
      <div id="eval-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2 font-bold text-lg text-slate-900">
              <span>🧪</span>
              <span>تقرير نتائج المعايرة والتحليل</span>
            </div>
            <button id="btn-close-modal" class="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
          </div>

          <div id="eval-modal-content" class="space-y-4">
            <!-- Injected dynamically -->
          </div>

          <button id="btn-modal-done" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition-all shadow-xs">
            حفظ النتيجة والعودة للمعمل
          </button>
        </div>
      </div>
    `;

    this.canvasContainer = this.element.querySelector('#titration-canvas-viewport');
    this.curveCanvas = this.element.querySelector('#titration-curve-canvas');
    if (this.curveCanvas) {
      this.curveCtx = this.curveCanvas.getContext('2d');
    }

    this.bindEvents();
  }

  private initLab() {
    if (!this.canvasContainer) return;

    this.config.onUpdate = (state) => {
      this.currentVolumeAdded = state.volumeAddedMl;
      this.currentPH = state.currentPH;
      this.dropsCount = state.dropsCount;
      this.isEquivalenceReached = state.isEquivalenceReached;
      this.history = state.history;

      // Update UI Meters
      const elPH = this.element.querySelector('#meter-ph-val');
      if (elPH) elPH.textContent = state.currentPH.toFixed(2);

      const elVol = this.element.querySelector('#meter-vol-val');
      if (elVol) elVol.textContent = state.volumeAddedMl.toFixed(2);

      const elDrops = this.element.querySelector('#meter-drops-val');
      if (elDrops) elDrops.textContent = `عدد القطرات: ${state.dropsCount} قطرة`;

      const elStatus = this.element.querySelector('#meter-ph-status');
      if (elStatus) {
        if (state.currentPH < 6.8) {
          elStatus.textContent = 'حمضي';
          elStatus.className = 'text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200';
        } else if (state.currentPH > 7.2) {
          elStatus.textContent = 'قاعدي';
          elStatus.className = 'text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200';
        } else {
          elStatus.textContent = 'نقطة التعادل';
          elStatus.className = 'text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300';
        }
      }

      const elColor = this.element.querySelector('#color-preview') as HTMLElement;
      if (elColor) elColor.style.backgroundColor = state.colorHex;

      const elColorName = this.element.querySelector('#color-name');
      if (elColorName) {
        if (this.config.indicator === 'phenolphthalein') {
          elColorName.textContent = state.currentPH >= 8.2 ? 'وردي / فوشيا' : 'عديم اللون';
        } else if (this.config.indicator === 'bromothymol_blue') {
          elColorName.textContent = state.currentPH > 7.6 ? 'أزرق' : state.currentPH >= 6.0 ? 'أخضر (متعادل)' : 'أصفر';
        } else {
          elColorName.textContent = state.currentPH > 4.4 ? 'أصفر' : state.currentPH >= 3.1 ? 'برتقالي' : 'أحمر';
        }
      }

      this.drawTitrationCurve();
    };

    this.lab = new TitrationLab3D(this.canvasContainer, this.config);
    this.drawTitrationCurve();
  }

  private drawTitrationCurve() {
    if (!this.curveCtx || !this.curveCanvas) return;
    const ctx = this.curveCtx;
    const w = this.curveCanvas.width;
    const h = this.curveCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Coordinate grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    // pH 7 dashed line
    const y7 = h - (7 / 14) * (h - 24) - 12;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(10, y7);
    ctx.lineTo(w - 10, y7);
    ctx.stroke();
    ctx.setLineDash([]);

    // 25 mL equivalence vertical guide
    const xEq = (25 / 50) * (w - 24) + 12;
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(xEq, 10);
    ctx.lineTo(xEq, h - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Plot data points
    if (this.history.length > 1) {
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < this.history.length; i++) {
        const pt = this.history[i];
        const x = (Math.min(pt.volumeAddedMl, 50) / 50) * (w - 24) + 12;
        const y = h - (Math.min(pt.ph, 14) / 14) * (h - 24) - 12;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  private bindEvents() {
    // Touch Camera Controls
    this.element.querySelector('#btn-titr-zoom-in')?.addEventListener('click', () => {
      this.lab?.zoomIn();
    });

    this.element.querySelector('#btn-titr-zoom-out')?.addEventListener('click', () => {
      this.lab?.zoomOut();
    });

    this.element.querySelector('#btn-titr-reset-cam')?.addEventListener('click', () => {
      this.lab?.resetView();
    });

    // Add Drop
    this.element.querySelector('#btn-add-drop')?.addEventListener('click', () => {
      this.lab?.addSingleDrop();
    });

    // Auto Drip
    const btnAuto = this.element.querySelector('#btn-auto-drip');
    const txtAuto = this.element.querySelector('#txt-auto-drip');
    btnAuto?.addEventListener('click', () => {
      this.isAutoDripActive = !this.isAutoDripActive;
      this.lab?.toggleAutoDrip(this.isAutoDripActive);
      if (txtAuto) {
        txtAuto.textContent = this.isAutoDripActive ? 'إيقاف التدفق' : 'تدفق مستمر';
      }
      btnAuto.className = this.isAutoDripActive
        ? 'bg-rose-100 text-rose-800 font-semibold px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1.5'
        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1.5';
    });

    // Undo Drop
    this.element.querySelector('#btn-undo-drop')?.addEventListener('click', () => {
      this.lab?.undoDrop();
    });

    // Reset Lab
    this.element.querySelector('#btn-reset-lab')?.addEventListener('click', () => {
      if (confirm('هل ترغب بإعادة تصفير التجربة والبدء من جديد؟')) {
        this.isAutoDripActive = false;
        if (txtAuto) txtAuto.textContent = 'تدفق مستمر';
        this.lab?.resetLab();
      }
    });

    // Indicators Selection
    this.element.querySelectorAll('.ind-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const ind = (e.currentTarget as HTMLElement).dataset.ind as IndicatorType;
        if (ind) {
          this.config.indicator = ind;
          this.lab?.setIndicator(ind);
          this.element.querySelectorAll('.ind-btn').forEach((b) => {
            const bInd = (b as HTMLElement).dataset.ind;
            b.className =
              bInd === ind
                ? 'ind-btn px-2.5 py-1 rounded-lg font-bold bg-white shadow-2xs text-slate-900'
                : 'ind-btn px-2.5 py-1 rounded-lg font-medium text-slate-600 hover:text-slate-900';
          });
        }
      });
    });

    // Evaluate & Report Modal
    this.element.querySelector('#btn-evaluate')?.addEventListener('click', () => {
      this.openEvaluationModal();
    });

    this.element.querySelector('#btn-close-modal')?.addEventListener('click', () => {
      this.closeEvaluationModal();
    });

    this.element.querySelector('#btn-modal-done')?.addEventListener('click', () => {
      this.closeEvaluationModal();
    });
  }

  private async openEvaluationModal() {
    const modal = this.element.querySelector('#eval-modal');
    const content = this.element.querySelector('#eval-modal-content');
    if (!modal || !content) return;

    // Calculate Unknown Molarity:
    // Ma = (Mb * Vb) / Va
    const Va = this.config.analyteVolumeMl; // 25.0 mL
    const Vb = this.currentVolumeAdded; // Student's volume added
    const Mb = this.config.titrantMolarity; // 0.100 M

    const calculatedMolarity = Va > 0 ? (Mb * Vb) / Va : 0;
    const actualMolarity = this.config.analyteActualMolarity; // 0.100 M

    // Accuracy percentage = (1 - |calc - actual| / actual) * 100
    const accuracy = Math.max(0, Math.min(100, (1 - Math.abs(calculatedMolarity - actualMolarity) / actualMolarity) * 100));

    // Award Points
    let pointsAwarded = 20;
    if (accuracy >= 98) pointsAwarded = 100;
    else if (accuracy >= 90) pointsAwarded = 75;
    else if (accuracy >= 80) pointsAwarded = 50;

    await StorageService.addPoints(pointsAwarded, 'معايرة معملية افتراضية');

    content.innerHTML = `
      <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-500">حجم حمض HCl المعاير (Va):</span>
          <span class="font-mono font-bold">${Va.toFixed(1)} mL</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">حجم NaOH القياسي المستهلك (Vb):</span>
          <span class="font-mono font-bold text-sky-700">${Vb.toFixed(2)} mL</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">عدد القطرات المستخدمة:</span>
          <span class="font-mono font-bold">${this.dropsCount} قطرة</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">الرقم الهيدروجيني النهائي:</span>
          <span class="font-mono font-bold">${this.currentPH.toFixed(2)}</span>
        </div>
      </div>

      <!-- Calculation Steps -->
      <div class="p-4 bg-gradient-to-br from-indigo-50/90 to-sky-50/90 rounded-2xl border border-indigo-200 text-xs space-y-2.5">
        <div class="flex items-center justify-between border-b border-indigo-100 pb-1.5">
          <span class="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
            <span>📐</span>
            <span>خطوات الحساب الكيميائي للتركيز المجهول (Ma)</span>
          </span>
          <span class="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
            M₁V₁ = M₂V₂
          </span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs space-y-2 text-center">
          <div class="text-[11px] text-slate-500 font-medium">قانون المعايرة والتكافؤ عند نقطة التعادل:</div>
          <div class="flex items-center justify-center gap-2 font-mono font-bold text-sm sm:text-base dir-ltr text-slate-900">
            <span class="text-sky-800 font-extrabold">M<sub>حمض</sub></span>
            <span>=</span>
            <div class="inline-flex flex-col items-center justify-center leading-tight">
              <span class="border-b-2 border-indigo-400 pb-0.5 px-2 font-bold text-indigo-800">M<sub>قاعدة</sub> × V<sub>قاعدة</sub></span>
              <span class="pt-0.5 px-2 font-bold text-slate-700">V<sub>حمض</sub></span>
            </div>
          </div>
          
          <div class="pt-1.5 border-t border-slate-100 text-[11px] text-slate-600 font-mono dir-ltr flex items-center justify-center gap-2">
            <span>M<sub>a</sub></span>
            <span>=</span>
            <div class="inline-flex flex-col items-center justify-center leading-tight">
              <span class="border-b border-slate-300 px-1 font-bold">0.100 M × ${Vb.toFixed(2)} mL</span>
              <span class="px-1 font-bold text-slate-700">${Va.toFixed(1)} mL</span>
            </div>
            <span>=</span>
            <span class="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-bold text-xs">${calculatedMolarity.toFixed(4)} M</span>
          </div>
        </div>

        <div class="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-indigo-100/60 leading-relaxed">
          <span class="font-bold text-indigo-900">💡 الشرح:</span> بما أن حمض HCl وقاعدة NaOH يتفاعلان بنسبة مولية (1 : 1)، فإن عدد مولات الحمض يساوي تماماً عدد مولات القاعدة عند نقطة التكافؤ.
        </div>
      </div>

      <!-- Accuracy Score Ribbon -->
      <div class="p-4 rounded-2xl text-center border ${
        accuracy >= 90 ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'
      }">
        <div class="text-xs text-slate-500 font-bold mb-1">دقة المعايرة المخبرية</div>
        <div class="text-3xl font-bold font-mono ${accuracy >= 90 ? 'text-emerald-700' : 'text-amber-800'}">
          ${accuracy.toFixed(1)}%
        </div>
        <div class="text-xs font-semibold mt-1 ${accuracy >= 90 ? 'text-emerald-800' : 'text-amber-800'}">
          ${accuracy >= 95 ? 'ممتاز جداً! وصلت لنقطة التكافؤ بدقة مذهلة 🌟' : accuracy >= 80 ? 'جيد جداً! قريب جداً من نقطة التكافؤ 👍' : 'تحتاج للمزيد من التأني وضبط القطرات تدريجياً 🔬'}
        </div>
        <div class="mt-2 text-xs font-bold text-sky-800 bg-white/80 py-1 px-3 rounded-lg inline-block border border-slate-200">
          +${pointsAwarded} نقطة XP أضيفت لحسابك
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  private closeEvaluationModal() {
    const modal = this.element.querySelector('#eval-modal');
    modal?.classList.add('hidden');
  }

  public dispose() {
    this.lab?.dispose();
    this.element.remove();
  }
}
