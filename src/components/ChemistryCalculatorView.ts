import { ChemistryCalculator, type CalculationResult } from '../services/chemistryCalculator';

type CalcCategory = 'ph' | 'dilution' | 'titration' | 'ka' | 'balance';

export class ChemistryCalculatorView {
  private element: HTMLElement;
  private currentCategory: CalcCategory = 'ph';
  private currentResult: CalculationResult | null = null;
  private errorMsg: string | null = null;

  constructor(container: HTMLElement) {
    this.element = document.createElement('main');
    this.element.className = 'flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full';
    container.appendChild(this.element);

    // Initial default calculation (pH of 0.01 M HCl)
    this.runDefaultCalculation();
    this.render();
  }

  private runDefaultCalculation() {
    try {
      this.currentResult = ChemistryCalculator.calculatePH(0.01);
      this.errorMsg = null;
    } catch (e: any) {
      this.errorMsg = e.message;
    }
  }

  private render() {
    this.element.innerHTML = `
      <div class="space-y-6">
        <!-- Title & Subtitle Banner -->
        <div class="bg-gradient-to-r from-sky-900 to-indigo-950 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
          <div class="relative z-10 space-y-2">
            <span class="inline-block px-3 py-1 bg-white/15 backdrop-blur-xs text-sky-200 text-xs rounded-lg font-semibold">
              أدوات الكيمياء التحليلية · المنهج اليمني
            </span>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">
              🧮 حاسبة الكيمياء التفاعلية الشاملة
            </h1>
            <p class="text-sky-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              حلول رياضية فورية لجميع حسابات الرقم الهيدروجيني pH، التخفيف، المعايرة، ثوابت التأين، والتحقق الذري من موازنة المعادلات مع خطوات الحل النموذجية.
            </p>
          </div>
        </div>

        <!-- Category Selector Tabs -->
        <div class="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-semibold">
          <button data-cat="ph" class="calc-tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all text-center ${
            this.currentCategory === 'ph' ? 'bg-white text-sky-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }">
            🔬 الرقم الهيدروجيني (pH)
          </button>
          <button data-cat="dilution" class="calc-tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all text-center ${
            this.currentCategory === 'dilution' ? 'bg-white text-sky-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }">
            💧 تخفيف المحاليل والكتلة
          </button>
          <button data-cat="titration" class="calc-tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all text-center ${
            this.currentCategory === 'titration' ? 'bg-white text-sky-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }">
            🧪 المعايرة الحجمية
          </button>
          <button data-cat="ka" class="calc-tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all text-center ${
            this.currentCategory === 'ka' ? 'bg-white text-sky-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }">
            ⚡ ثابت التأين Ka (أستفالد)
          </button>
          <button data-cat="balance" class="calc-tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all text-center ${
            this.currentCategory === 'balance' ? 'bg-white text-sky-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }">
            ⚖️ مدقق موازنة المعادلات
          </button>
        </div>

        <!-- Main Workspace: Inputs (Left/Top) + Step-by-Step Results (Right/Bottom) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Inputs Card (5 Cols) -->
          <div class="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
            ${this.renderCategoryInputs()}
          </div>

          <!-- Step-by-Step Solution Card (7 Cols) -->
          <div class="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span>📋</span>
                <span>الحل النموذجي والخطوات التفصيلية</span>
              </div>
              <span class="text-xs text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg font-mono font-semibold">
                طريقة منهج وزارة التربية
              </span>
            </div>

            ${
              this.errorMsg
                ? `
              <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm font-semibold flex items-center gap-3">
                <span class="text-lg">⚠️</span>
                <span>${this.errorMsg}</span>
              </div>
            `
                : this.currentResult
                ? `
              <div class="space-y-4">
                <!-- Result Ribbon -->
                <div class="bg-gradient-to-r from-sky-50 to-indigo-50/50 p-4 rounded-2xl border border-sky-200 flex items-center justify-between">
                  <div>
                    <div class="text-[11px] font-bold text-slate-500">القيمة الناتجة:</div>
                    <div class="text-2xl sm:text-3xl font-mono font-bold text-sky-900">
                      ${this.currentResult.result} ${this.currentResult.unit || ''}
                    </div>
                  </div>
                  <div class="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-indigo-700 dir-ltr shadow-2xs">
                    ${this.currentResult.formula}
                  </div>
                </div>

                <!-- Explanation -->
                <p class="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  ${this.currentResult.explanation}
                </p>

                <!-- Detailed Steps -->
                <div class="space-y-2 pt-2 border-t border-slate-100">
                  <div class="text-xs font-bold text-slate-800">خطوات التعويض والحل الرياضي:</div>
                  <div class="space-y-1.5">
                    ${this.currentResult.stepByStep
                      .map(
                        (step) => `
                      <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-800 font-mono-numbers">
                        <span class="text-sky-600 font-bold mt-0.5">•</span>
                        <span>${step}</span>
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                </div>

                ${
                  this.currentResult.atomCounts
                    ? `
                  <!-- Atom Counts Breakdown Table -->
                  <div class="pt-2 border-t border-slate-100 space-y-2">
                    <div class="text-xs font-bold text-slate-800">مقارنة أعداد الذرات على جانبي المعادلة:</div>
                    <div class="grid grid-cols-2 gap-3 text-xs">
                      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div class="font-bold text-sky-800 mb-1.5">ذرات المتفاعلات (يسار):</div>
                        <ul class="space-y-1 font-mono">
                          ${Object.entries(this.currentResult.atomCounts.left)
                            .map(([e, c]) => `<li>${e}: ${c} ذرة</li>`)
                            .join('')}
                        </ul>
                      </div>
                      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div class="font-bold text-emerald-800 mb-1.5">ذرات النواتج (يمين):</div>
                        <ul class="space-y-1 font-mono">
                          ${Object.entries(this.currentResult.atomCounts.right)
                            .map(([e, c]) => `<li>${e}: ${c} ذرة</li>`)
                            .join('')}
                        </ul>
                      </div>
                    </div>
                  </div>
                `
                    : ''
                }
              </div>
            `
                : ''
            }
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderCategoryInputs(): string {
    switch (this.currentCategory) {
      case 'ph':
        return `
          <div class="space-y-4">
            <div class="font-bold text-sm text-slate-900">حساب الرقم الهيدروجيني (pH) والرقم الهيدروكسيدي (pOH)</div>
            
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700">نوع التركيز المدخل:</label>
              <select id="sel-ph-mode" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500">
                <option value="H">تركيز أيون الهيدروجين [H+] (مول/لتر)</option>
                <option value="OH">تركيز أيون الهيدروكسيد [OH-] (مول/لتر)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700">التركيز المولي (M):</label>
              <input id="input-conc-ph" type="number" step="any" value="0.01" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold dir-ltr focus:ring-2 focus:ring-sky-500" />
            </div>

            <!-- Quick Presets -->
            <div class="space-y-1.5">
              <span class="text-[11px] text-slate-500 font-medium">أمثلة منهجية سريعة:</span>
              <div class="flex flex-wrap gap-1.5">
                <button data-preset-ph="0.01" class="btn-preset px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono">HCl (0.01 M)</button>
                <button data-preset-ph="0.001" class="btn-preset px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono">NaOH (0.001 M)</button>
                <button data-preset-ph="0.05" class="btn-preset px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono">H₂SO₄ (0.05 M)</button>
                <button data-preset-ph="0.0001" class="btn-preset px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono">1.0 × 10⁻⁴ M</button>
              </div>
            </div>

            <button id="btn-calc-ph" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs">
              احسب pH و pOH بالخطوات
            </button>
          </div>
        `;

      case 'dilution':
        return `
          <div class="space-y-4">
            <div class="font-bold text-sm text-slate-900">تخفيف المحاليل وحساب الكتلة (M₁V₁ = M₂V₂)</div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700">التركيز الابتدائي M₁ (مول/لتر):</label>
              <input id="input-m1" type="number" step="any" value="2.0" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold dir-ltr" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700">الحجم الابتدائي V₁ (ملليلتر mL):</label>
              <input id="input-v1" type="number" step="any" value="50" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold dir-ltr" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700">التركيز المخفف المطلوب M₂ (مول/لتر):</label>
              <input id="input-m2" type="number" step="any" value="0.5" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold dir-ltr" />
            </div>

            <button id="btn-calc-dilution" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs">
              احسب الحجم النهائي وكمية الماء المطلوبة
            </button>

            <div class="pt-3 border-t border-slate-100 space-y-2">
              <div class="text-xs font-bold text-slate-800">أو احسب كتلة المادة المذابة m = M × V × Mw:</div>
              <div class="grid grid-cols-2 gap-2">
                <input id="input-mass-mw" type="number" placeholder="الكتلة المولية Mw (مثال: 40 لـ NaOH)" value="40" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono dir-ltr" />
                <button id="btn-calc-mass" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-xl text-xs">احسب الكتلة (g)</button>
              </div>
            </div>
          </div>
        `;

      case 'titration':
        return `
          <div class="space-y-4">
            <div class="font-bold text-sm text-slate-900">حسابات المعايرة الحجمية وتحديد التركيز المجهول</div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700">مولارية المحلول القياسي M_std (مول/لتر):</label>
              <input id="input-m-std" type="number" step="any" value="0.100" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold dir-ltr" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700">حجم المحلول القياسي المستهلك V_std (ملليلتر mL):</label>
              <input id="input-v-std" type="number" step="any" value="25.0" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold dir-ltr" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700">حجم العينة المجهولة المعايرة V_unknown (ملليلتر mL):</label>
              <input id="input-v-unk" type="number" step="any" value="20.0" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold dir-ltr" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700">النسبة المولية في المعادلة الموزونة (مول حمض / مول قاعدة):</label>
              <input id="input-ratio" type="number" step="any" value="1.0" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold dir-ltr" />
            </div>

            <button id="btn-calc-titration" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs">
              احسب مولارية المحلول المجهول M
            </button>
          </div>
        `;

      case 'ka':
        return `
          <div class="space-y-4">
            <div class="font-bold text-sm text-slate-900">ثابت تأين الحمض الضعيف Ka وقانون أستفالد</div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700">التركيز المولي للحمض الضعيف C (مول/لتر):</label>
              <input id="input-ka-c" type="number" step="any" value="0.1" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold dir-ltr" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700">درجة التفكك الأيوني α (قيمة كسرية بين 0 و 1):</label>
              <input id="input-ka-alpha" type="number" step="any" value="0.0132" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold dir-ltr" />
              <div class="text-[10px] text-slate-400 font-mono">مثال: لحمض الخليك CH₃COOH درجة التأين = 1.32% (أي 0.0132)</div>
            </div>

            <button id="btn-calc-ka" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs">
              احسب قيمة Ka و pKa بالخطوات
            </button>
          </div>
        `;

      case 'balance':
        return `
          <div class="space-y-4">
            <div class="font-bold text-sm text-slate-900">المدقق الذكي لموازنة المعادلات الكيميائية</div>
            <p class="text-xs text-slate-500 leading-relaxed">
              افحص موازنة المعادلة بالتفصيل للتأكد من انطباق قانون بقاء الكتلة على أعداد ذرات كل عنصر.
            </p>

            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
              <div class="font-sans font-bold text-slate-800 text-xs">مثال تفاعل تصنيع غاز الأمونيا:</div>
              <div class="flex items-center gap-2">
                <input id="eq-c1" type="number" min="1" value="1" class="w-12 text-center bg-white border border-slate-300 rounded-lg p-1.5 font-bold" />
                <span>N₂</span>
                <span>+</span>
                <input id="eq-c2" type="number" min="1" value="3" class="w-12 text-center bg-white border border-slate-300 rounded-lg p-1.5 font-bold" />
                <span>H₂</span>
                <span>→</span>
                <input id="eq-c3" type="number" min="1" value="2" class="w-12 text-center bg-white border border-slate-300 rounded-lg p-1.5 font-bold" />
                <span>NH₃</span>
              </div>
            </div>

            <button id="btn-verify-eq" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs">
              التحقق من صحة موازنة المعادلة
            </button>
          </div>
        `;
    }
  }

  private bindEvents() {
    // Tab switching
    this.element.querySelectorAll('.calc-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).dataset.cat as CalcCategory;
        if (cat) {
          this.currentCategory = cat;
          this.errorMsg = null;
          this.render();
        }
      });
    });

    // 1. pH Calc
    this.element.querySelector('#btn-calc-ph')?.addEventListener('click', () => {
      try {
        const mode = (this.element.querySelector('#sel-ph-mode') as HTMLSelectElement).value;
        const val = parseFloat((this.element.querySelector('#input-conc-ph') as HTMLInputElement).value);
        if (mode === 'H') {
          this.currentResult = ChemistryCalculator.calculatePH(val);
        } else {
          this.currentResult = ChemistryCalculator.calculatePOH(val);
        }
        this.errorMsg = null;
      } catch (err: any) {
        this.errorMsg = err.message;
      }
      this.render();
    });

    // Presets
    this.element.querySelectorAll('.btn-preset').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const p = parseFloat((e.currentTarget as HTMLElement).dataset.presetPh || '0.01');
        const input = this.element.querySelector('#input-conc-ph') as HTMLInputElement;
        if (input) {
          input.value = `${p}`;
          this.currentResult = ChemistryCalculator.calculatePH(p);
          this.render();
        }
      });
    });

    // 2. Dilution Calc
    this.element.querySelector('#btn-calc-dilution')?.addEventListener('click', () => {
      try {
        const m1 = parseFloat((this.element.querySelector('#input-m1') as HTMLInputElement).value);
        const v1 = parseFloat((this.element.querySelector('#input-v1') as HTMLInputElement).value);
        const m2 = parseFloat((this.element.querySelector('#input-m2') as HTMLInputElement).value);
        this.currentResult = ChemistryCalculator.dilutionFormula(m1, v1, m2);
        this.errorMsg = null;
      } catch (err: any) {
        this.errorMsg = err.message;
      }
      this.render();
    });

    // Mass Calc
    this.element.querySelector('#btn-calc-mass')?.addEventListener('click', () => {
      try {
        const m1 = parseFloat((this.element.querySelector('#input-m1') as HTMLInputElement).value);
        const v1 = parseFloat((this.element.querySelector('#input-v1') as HTMLInputElement).value);
        const mw = parseFloat((this.element.querySelector('#input-mass-mw') as HTMLInputElement).value);
        this.currentResult = ChemistryCalculator.calculateMass(m1, v1, mw);
        this.errorMsg = null;
      } catch (err: any) {
        this.errorMsg = err.message;
      }
      this.render();
    });

    // 3. Titration Calc
    this.element.querySelector('#btn-calc-titration')?.addEventListener('click', () => {
      try {
        const mStd = parseFloat((this.element.querySelector('#input-m-std') as HTMLInputElement).value);
        const vStd = parseFloat((this.element.querySelector('#input-v-std') as HTMLInputElement).value);
        const vUnk = parseFloat((this.element.querySelector('#input-v-unk') as HTMLInputElement).value);
        const ratio = parseFloat((this.element.querySelector('#input-ratio') as HTMLInputElement).value || '1');
        this.currentResult = ChemistryCalculator.titrationCalculation(mStd, vStd, vUnk, ratio);
        this.errorMsg = null;
      } catch (err: any) {
        this.errorMsg = err.message;
      }
      this.render();
    });

    // 4. Ka Calc
    this.element.querySelector('#btn-calc-ka')?.addEventListener('click', () => {
      try {
        const c = parseFloat((this.element.querySelector('#input-ka-c') as HTMLInputElement).value);
        const alpha = parseFloat((this.element.querySelector('#input-ka-alpha') as HTMLInputElement).value);
        this.currentResult = ChemistryCalculator.calculateKa(c, alpha);
        this.errorMsg = null;
      } catch (err: any) {
        this.errorMsg = err.message;
      }
      this.render();
    });

    // 5. Balance Verifier
    this.element.querySelector('#btn-verify-eq')?.addEventListener('click', () => {
      try {
        const c1 = parseInt((this.element.querySelector('#eq-c1') as HTMLInputElement).value || '1');
        const c2 = parseInt((this.element.querySelector('#eq-c2') as HTMLInputElement).value || '1');
        const c3 = parseInt((this.element.querySelector('#eq-c3') as HTMLInputElement).value || '1');
        this.currentResult = ChemistryCalculator.verifyEquationBalance(
          [
            { formula: 'N2', coefficient: c1 },
            { formula: 'H2', coefficient: c2 },
          ],
          [{ formula: 'NH3', coefficient: c3 }]
        );
        this.errorMsg = null;
      } catch (err: any) {
        this.errorMsg = err.message;
      }
      this.render();
    });
  }

  public dispose() {
    this.element.remove();
  }
}
