import { ChemistryCalculator } from '../services/chemistryCalculator';

export class FloatingCalcModal {
  private buttonEl: HTMLElement;
  private modalEl: HTMLElement;
  private isOpen: boolean = false;

  constructor(container: HTMLElement) {
    // 1. Floating Action Button (Bottom Left)
    this.buttonEl = document.createElement('button');
    this.buttonEl.className =
      'fixed bottom-3 sm:bottom-5 left-3 sm:left-5 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center text-lg sm:text-xl cursor-pointer border border-white/20';
    this.buttonEl.title = 'حاسبة الكيمياء السريعة';
    this.buttonEl.innerHTML = '🧮';
    container.appendChild(this.buttonEl);

    // 2. Modal Overlay & Popup Card
    this.modalEl = document.createElement('div');
    this.modalEl.className =
      'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden';
    container.appendChild(this.modalEl);

    this.renderModal();
    this.bindEvents();
  }

  private renderModal() {
    this.modalEl.innerHTML = `
      <div class="bg-white rounded-3xl max-w-sm w-[94vw] p-4 sm:p-5 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <div class="flex items-center gap-2 font-bold text-sm text-slate-900">
            <span>🧮</span>
            <span>حاسبة الكيمياء السريعة</span>
          </div>
          <button id="btn-close-quick-calc" class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
        </div>

        <div class="space-y-3.5 text-xs">
          <!-- 1. pH Formula Section -->
          <div class="bg-sky-50/50 p-3 rounded-2xl border border-sky-100 space-y-2">
            <div class="flex items-center justify-between">
              <label class="font-bold text-sky-950 block">حساب الرقم الهيدروجيني pH:</label>
              <span class="bg-white px-2 py-0.5 rounded-md border border-sky-200 font-mono text-[10px] font-bold text-sky-800 dir-ltr shadow-2xs">
                pH = -log[H⁺]
              </span>
            </div>
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <input id="quick-input-h" type="number" step="any" value="0.01" placeholder="[H⁺]" class="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold dir-ltr shadow-2xs" />
                <span class="absolute left-2.5 top-1.5 text-[10px] text-slate-400 font-mono">M</span>
              </div>
              <button id="btn-quick-calc-ph" class="bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer">احسب</button>
            </div>
            <div id="quick-ph-result" class="p-2.5 rounded-xl bg-white text-sky-950 border border-sky-200 shadow-2xs text-center space-y-1">
              <div class="font-mono text-xs font-bold text-sky-900 dir-ltr">pH = 2.00  |  pOH = 12.00</div>
              <div class="text-[10px] text-slate-500 font-medium">محلول حمضي قوي (pH &lt; 7)</div>
            </div>
          </div>

          <!-- 2. Dilution Formula Section -->
          <div class="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 space-y-2">
            <div class="flex items-center justify-between">
              <label class="font-bold text-indigo-950 block">تخفيف المحاليل المائية:</label>
              <span class="bg-white px-2 py-0.5 rounded-md border border-indigo-200 font-mono text-[10px] font-bold text-indigo-800 dir-ltr shadow-2xs">
                M₁ · V₁ = M₂ · V₂
              </span>
            </div>
            <div class="grid grid-cols-3 gap-1.5 font-mono text-center">
              <div>
                <span class="text-[10px] text-slate-500 block mb-0.5">M₁ (قبل)</span>
                <input id="quick-m1" type="number" step="any" placeholder="M₁" value="1.0" class="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold shadow-2xs text-center" />
              </div>
              <div>
                <span class="text-[10px] text-slate-500 block mb-0.5">V₁ (mL)</span>
                <input id="quick-v1" type="number" step="any" placeholder="V₁" value="25" class="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold shadow-2xs text-center" />
              </div>
              <div>
                <span class="text-[10px] text-slate-500 block mb-0.5">M₂ (بعد)</span>
                <input id="quick-m2" type="number" step="any" placeholder="M₂" value="0.1" class="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold shadow-2xs text-center" />
              </div>
            </div>
            <button id="btn-quick-calc-dilute" class="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-1.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer">
              احسب الحجم النهائي V₂
            </button>
            <div id="quick-dilute-result" class="p-2.5 rounded-xl bg-white text-indigo-950 border border-indigo-200 shadow-2xs text-center space-y-1">
              <div class="font-mono text-xs font-bold text-indigo-900 dir-ltr">V₂ = (1.0 × 25) ÷ 0.1 = 250.00 mL</div>
              <div class="text-[10px] text-slate-600 font-medium">حجم الماء الواجب إضافته = <strong class="text-indigo-800 font-mono">225.0 mL</strong></div>
            </div>
          </div>
        </div>

        <button id="btn-open-full-calc" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5">
          <span>الانتقال للحاسبة الكيميائية الشاملة</span>
          <span>←</span>
        </button>
      </div>
    `;
  }

  private bindEvents() {
    this.buttonEl.addEventListener('click', () => {
      this.open();
    });

    this.modalEl.querySelector('#btn-close-quick-calc')?.addEventListener('click', () => {
      this.close();
    });

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });

    // Quick pH
    this.modalEl.querySelector('#btn-quick-calc-ph')?.addEventListener('click', () => {
      const val = parseFloat((this.modalEl.querySelector('#quick-input-h') as HTMLInputElement).value);
      const resEl = this.modalEl.querySelector('#quick-ph-result');
      if (resEl) {
        try {
          const res = ChemistryCalculator.calculatePH(val);
          const poh = (14 - Number(res.result)).toFixed(2);
          const nature = Number(res.result) < 6.8 ? 'محلول حمضي' : Number(res.result) > 7.2 ? 'محلول قاعدي' : 'محلول متعادل';
          resEl.innerHTML = `
            <div class="font-mono text-xs font-bold text-sky-900 dir-ltr">pH = ${res.result}  |  pOH = ${poh}</div>
            <div class="text-[10px] text-slate-600 font-medium">${nature} (عند 25°م)</div>
          `;
          resEl.className = 'p-2.5 rounded-xl bg-white text-sky-950 border border-sky-200 shadow-2xs text-center space-y-1';
        } catch (e: any) {
          resEl.textContent = e.message;
          resEl.className = 'p-2 rounded-xl bg-rose-50 text-rose-900 font-sans text-xs text-center border border-rose-200';
        }
      }
    });

    // Quick Dilution
    this.modalEl.querySelector('#btn-quick-calc-dilute')?.addEventListener('click', () => {
      const m1 = parseFloat((this.modalEl.querySelector('#quick-m1') as HTMLInputElement).value);
      const v1 = parseFloat((this.modalEl.querySelector('#quick-v1') as HTMLInputElement).value);
      const m2 = parseFloat((this.modalEl.querySelector('#quick-m2') as HTMLInputElement).value);
      const resEl = this.modalEl.querySelector('#quick-dilute-result');
      if (resEl) {
        try {
          const res = ChemistryCalculator.dilutionFormula(m1, v1, m2);
          const water = Number(res.result) - v1;
          resEl.innerHTML = `
            <div class="font-mono text-xs font-bold text-indigo-900 dir-ltr">V₂ = (${m1} × ${v1}) ÷ ${m2} = ${res.result} mL</div>
            <div class="text-[10px] text-slate-600 font-medium">حجم الماء المضاف = <strong class="text-indigo-800 font-mono">${water.toFixed(1)} mL</strong></div>
          `;
          resEl.className = 'p-2.5 rounded-xl bg-white text-indigo-950 border border-indigo-200 shadow-2xs text-center space-y-1';
        } catch (e: any) {
          resEl.textContent = e.message;
          resEl.className = 'p-2 rounded-xl bg-rose-50 text-rose-900 font-sans text-xs text-center border border-rose-200';
        }
      }
    });
  }

  public onOpenFullCalculator(callback: () => void) {
    this.modalEl.querySelector('#btn-open-full-calc')?.addEventListener('click', () => {
      this.close();
      callback();
    });
  }

  public open() {
    this.isOpen = true;
    this.modalEl.classList.remove('hidden');
  }

  public close() {
    this.isOpen = false;
    this.modalEl.classList.add('hidden');
  }

  public dispose() {
    this.buttonEl.remove();
    this.modalEl.remove();
  }
}
