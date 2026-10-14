import { ChemistryCalculator } from '../services/chemistryCalculator';

export class FloatingCalcModal {
  private buttonEl: HTMLElement;
  private modalEl: HTMLElement;
  private isOpen: boolean = false;

  constructor(container: HTMLElement) {
    // 1. Floating Action Button (Bottom Left)
    this.buttonEl = document.createElement('button');
    this.buttonEl.className =
      'fixed bottom-5 left-5 z-40 w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center text-xl cursor-pointer';
    this.buttonEl.title = 'حاسبة الكيمياء السريعة';
    this.buttonEl.innerHTML = '🧮';
    container.appendChild(this.buttonEl);

    // 2. Modal Overlay & Popup Card
    this.modalEl = document.createElement('div');
    this.modalEl.className =
      'fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 hidden';
    container.appendChild(this.modalEl);

    this.renderModal();
    this.bindEvents();
  }

  private renderModal() {
    this.modalEl.innerHTML = `
      <div class="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <div class="flex items-center gap-2 font-bold text-sm text-slate-900">
            <span>🧮</span>
            <span>حاسبة الكيمياء السريعة</span>
          </div>
          <button id="btn-close-quick-calc" class="text-slate-400 hover:text-slate-600 text-base font-bold">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="font-semibold text-slate-700 block mb-1">احسب pH من تركيز [H⁺] (مول/لتر):</label>
            <div class="flex items-center gap-2">
              <input id="quick-input-h" type="number" step="any" value="0.01" class="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold dir-ltr" />
              <button id="btn-quick-calc-ph" class="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors">احسب</button>
            </div>
            <div id="quick-ph-result" class="mt-2 p-2.5 rounded-xl bg-sky-50 text-sky-950 font-mono font-bold text-center border border-sky-100">
              pH = 2.00 · pOH = 12.00
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100">
            <label class="font-semibold text-slate-700 block mb-1">تخفيف سريع M₁V₁ = M₂V₂ (لإيجاد V₂):</label>
            <div class="grid grid-cols-3 gap-1.5 font-mono text-center">
              <input id="quick-m1" type="number" step="any" placeholder="M₁" value="1.0" class="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold" />
              <input id="quick-v1" type="number" step="any" placeholder="V₁ (mL)" value="25" class="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold" />
              <input id="quick-m2" type="number" step="any" placeholder="M₂" value="0.1" class="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold" />
            </div>
            <button id="btn-quick-calc-dilute" class="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-xl text-xs transition-colors">
              احسب حجم التخفيف V₂
            </button>
            <div id="quick-dilute-result" class="mt-2 p-2 rounded-xl bg-indigo-50 text-indigo-950 font-mono font-bold text-center border border-indigo-100 text-xs">
              V₂ = 250.00 mL (ماء مضاف: 225 mL)
            </div>
          </div>
        </div>

        <button id="btn-open-full-calc" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition-colors">
          الانتقال للحاسبة الكيميائية الكاملة ←
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
          resEl.textContent = `pH = ${res.result} · pOH = ${poh}`;
          resEl.className = 'mt-2 p-2.5 rounded-xl bg-sky-50 text-sky-950 font-mono font-bold text-center border border-sky-100';
        } catch (e: any) {
          resEl.textContent = e.message;
          resEl.className = 'mt-2 p-2.5 rounded-xl bg-rose-50 text-rose-900 font-sans text-xs text-center border border-rose-200';
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
          resEl.textContent = `V₂ = ${res.result} mL (ماء مضاف: ${water.toFixed(1)} mL)`;
          resEl.className = 'mt-2 p-2 rounded-xl bg-indigo-50 text-indigo-950 font-mono font-bold text-center border border-indigo-100 text-xs';
        } catch (e: any) {
          resEl.textContent = e.message;
          resEl.className = 'mt-2 p-2 rounded-xl bg-rose-50 text-rose-900 font-sans text-xs text-center border border-rose-200';
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
