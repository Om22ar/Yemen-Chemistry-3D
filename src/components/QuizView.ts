import { QUIZ_QUESTIONS } from '../data/curriculumData';
import { StorageService } from '../services/firebase';
import type { QuizQuestion, StudentProfile } from '../types';

export class QuizView {
  private element: HTMLElement;
  private currentIndex: number = 0;
  private selectedAnswers: Record<string, any> = {};
  private submittedQuestions: Record<string, boolean> = {};
  private results: Record<string, boolean> = {};
  private profile: StudentProfile;

  constructor(container: HTMLElement) {
    this.element = document.createElement('main');
    this.element.className = 'flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full';
    container.appendChild(this.element);

    this.profile = StorageService.getLocalProfile();
    StorageService.subscribe((p) => {
      this.profile = p;
    });

    this.render();
  }

  private render() {
    const total = QUIZ_QUESTIONS.length;
    const currentQ = QUIZ_QUESTIONS[this.currentIndex];
    const isSubmitted = !!this.submittedQuestions[currentQ.id];
    const isCorrect = !!this.results[currentQ.id];

    // Progress
    const answeredCount = Object.keys(this.submittedQuestions).length;
    const progressPercent = Math.round((answeredCount / total) * 100);

    this.element.innerHTML = `
      <div class="space-y-6">
        <!-- Header & Progress -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span class="flex items-center gap-1.5 text-slate-900 text-sm">
              <span>📝</span>
              <span>بنك الاختبارات والتقييم الفوري</span>
            </span>
            <span class="font-mono text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
              السؤال ${this.currentIndex + 1} من ${total}
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div class="bg-sky-600 h-full rounded-full transition-all duration-300" style="width: ${progressPercent}%"></div>
          </div>

          <!-- Question Quick Jump Nav -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            ${QUIZ_QUESTIONS.map((q, idx) => {
              const answered = !!this.submittedQuestions[q.id];
              const correct = this.results[q.id];
              const isCurr = idx === this.currentIndex;
              let bg = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
              if (answered) {
                bg = correct ? 'bg-emerald-500 text-white font-bold' : 'bg-rose-500 text-white font-bold';
              }
              const border = isCurr ? 'ring-2 ring-sky-500 ring-offset-1 font-bold' : '';
              return `
                <button data-goto="${idx}" class="q-nav-btn w-7 h-7 rounded-lg text-xs font-mono transition-all ${bg} ${border}">
                  ${idx + 1}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Question Card -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 font-mono">
                ${currentQ.type === 'mcq' ? 'اختيار من متعدد' : currentQ.type === 'calculation' ? 'مسألة حسابية رياضية' : currentQ.type === 'le_chatelier_prediction' ? 'تنبؤ محاكاة الاتزان' : 'موازنة معادلة كيميائية'}
              </span>
              <span class="text-xs text-slate-500 font-medium">الوحدة ${currentQ.unitId}</span>
            </div>
            <h2 class="text-base sm:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-line">
              ${currentQ.questionText}
            </h2>
          </div>

          <!-- Dynamic Question Body depending on type -->
          <div id="q-body" class="space-y-4">
            ${this.renderQuestionInteractive(currentQ, isSubmitted)}
          </div>

          <!-- Feedback & Step-by-Step Explanation -->
          ${
            isSubmitted
              ? `
            <div class="p-4 rounded-xl border ${
              isCorrect ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-rose-50/80 border-rose-300 text-rose-950'
            } space-y-2 animate-in fade-in duration-200">
              <div class="font-bold text-sm flex items-center gap-2">
                <span>${isCorrect ? '✓ أحسنت! إجابة صحيحة (+50 نقطة XP)' : '✗ إجابة غير صحيحة، راجع الحل النموذجي:'}</span>
              </div>
              <p class="text-xs sm:text-sm leading-relaxed">${currentQ.explanation}</p>
              ${
                currentQ.formulaSteps
                  ? `
                <div class="pt-2 border-t border-slate-200/60 space-y-1">
                  <div class="text-xs font-bold text-slate-700">خطوات الحل التفصيلية:</div>
                  <ol class="list-decimal list-inside text-xs space-y-1 font-mono-numbers">
                    ${currentQ.formulaSteps.map((step) => `<li>${step}</li>`).join('')}
                  </ol>
                </div>
              `
                  : ''
              }
            </div>
          `
              : ''
          }

          <!-- Bottom Action Buttons -->
          <div class="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
            <button id="btn-prev-q" ${this.currentIndex === 0 ? 'disabled' : ''} class="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer">
              ← السؤال السابق
            </button>

            <div class="flex items-center gap-2">
              ${
                !isSubmitted
                  ? `
                <button id="btn-submit-q" class="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 active:scale-95 text-white shadow-xs transition-all cursor-pointer">
                  التحقق من إجابتي
                </button>
              `
                  : `
                <button id="btn-retry-q" class="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer">
                  إعادة المحاولة
                </button>
              `
              }

              <button id="btn-next-q" ${this.currentIndex === total - 1 ? 'disabled' : ''} class="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer">
                السؤال التالي →
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(currentQ, isSubmitted);
  }

  private renderQuestionInteractive(q: QuizQuestion, isSubmitted: boolean): string {
    if (q.type === 'mcq' || q.type === 'le_chatelier_prediction') {
      const selected = this.selectedAnswers[q.id];
      return `
        <div class="space-y-2.5">
          ${(q.options || [])
            .map((opt) => {
              const isChecked = selected === opt;
              let itemClass = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800';
              if (isSubmitted) {
                if (opt === q.correctAnswer) {
                  itemClass = 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold';
                } else if (isChecked && opt !== q.correctAnswer) {
                  itemClass = 'border-rose-400 bg-rose-50 text-rose-900 font-medium';
                }
              } else if (isChecked) {
                itemClass = 'border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-2xs';
              }

              return `
              <label class="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${itemClass}">
                <input type="radio" name="opt-${q.id}" value="${opt}" ${isChecked ? 'checked' : ''} ${isSubmitted ? 'disabled' : ''} class="w-4 h-4 accent-sky-600" />
                <span class="text-xs sm:text-sm flex-1">${opt}</span>
              </label>
            `;
            })
            .join('')}
        </div>
      `;
    }

    if (q.type === 'calculation') {
      const currentVal = this.selectedAnswers[q.id] ?? '';
      return `
        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div class="text-xs text-slate-600 font-medium">أدخل القيمة المحسوبة:</div>
          <div class="flex items-center gap-3">
            <input id="calc-input" type="number" step="any" placeholder="مثال: 2" value="${currentVal}" ${isSubmitted ? 'disabled' : ''} class="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-xs shadow-2xs dir-ltr" />
            <span class="text-xs text-slate-500 font-medium">قيمة الناتج النهائي</span>
          </div>
        </div>
      `;
    }

    if (q.type === 'equation_balancing') {
      const parts = q.equationParts;
      if (!parts) return '';
      const state = this.selectedAnswers[q.id] || {
        r: parts.reactants.map((r) => r.defaultCoeff || 1),
        p: parts.products.map((p) => p.defaultCoeff || 1),
      };
      this.selectedAnswers[q.id] = state;

      return `
        <div class="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-4">
          <div class="text-xs text-slate-600 font-medium">استخدم الأسهم لتحديد معاملات موازنة المعادلة:</div>
          
          <div class="flex flex-wrap items-center justify-center gap-3 text-base sm:text-lg font-mono font-bold text-slate-900 dir-ltr bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
            <!-- Reactants -->
            ${parts.reactants
              .map((r, i) => `
                <div class="flex items-center gap-1.5">
                  <div class="flex flex-col items-center">
                    <button data-coeff-change="r" data-idx="${i}" data-step="1" ${isSubmitted ? 'disabled' : ''} class="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-30">▲</button>
                    <span class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold text-sm">${state.r[i]}</span>
                    <button data-coeff-change="r" data-idx="${i}" data-step="-1" ${isSubmitted ? 'disabled' : ''} class="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-30">▼</button>
                  </div>
                  <span>${r.formula}</span>
                  ${i < parts.reactants.length - 1 ? '<span class="text-slate-400 font-sans mx-1">+</span>' : ''}
                </div>
              `).join('')}

            <span class="text-indigo-700 font-sans text-xl mx-2">→</span>

            <!-- Products -->
            ${parts.products
              .map((p, i) => `
                <div class="flex items-center gap-1.5">
                  <div class="flex flex-col items-center">
                    <button data-coeff-change="p" data-idx="${i}" data-step="1" ${isSubmitted ? 'disabled' : ''} class="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-30">▲</button>
                    <span class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold text-sm">${state.p[i]}</span>
                    <button data-coeff-change="p" data-idx="${i}" data-step="-1" ${isSubmitted ? 'disabled' : ''} class="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-30">▼</button>
                  </div>
                  <span>${p.formula}</span>
                </div>
              `).join('')}
          </div>
        </div>
      `;
    }

    return '';
  }

  private bindEvents(q: QuizQuestion, isSubmitted: boolean) {
    // MCQ & Prediction Radio change
    this.element.querySelectorAll(`input[name="opt-${q.id}"]`).forEach((radio) => {
      radio.addEventListener('change', (e) => {
        this.selectedAnswers[q.id] = (e.target as HTMLInputElement).value;
      });
    });

    // Calculation Input
    const calcInput = this.element.querySelector('#calc-input') as HTMLInputElement;
    calcInput?.addEventListener('input', () => {
      this.selectedAnswers[q.id] = parseFloat(calcInput.value);
    });

    // Equation Balancing Steppers
    this.element.querySelectorAll('button[data-coeff-change]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const side = (e.currentTarget as HTMLElement).dataset.coeffChange as 'r' | 'p';
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.idx || '0');
        const step = parseInt((e.currentTarget as HTMLElement).dataset.step || '1');
        const state = this.selectedAnswers[q.id];
        if (state && state[side]) {
          state[side][idx] = Math.max(1, Math.min(10, state[side][idx] + step));
          this.render();
        }
      });
    });

    // Submit Answer
    this.element.querySelector('#btn-submit-q')?.addEventListener('click', async () => {
      const userAns = this.selectedAnswers[q.id];
      if (userAns === undefined || userAns === '' || isNaN(userAns)) {
        alert('يرجى تحديد أو إدخال إجابة قبل التحقق!');
        return;
      }

      let isCorrect = false;
      if (q.type === 'mcq' || q.type === 'le_chatelier_prediction') {
        isCorrect = userAns === q.correctAnswer;
      } else if (q.type === 'calculation') {
        const expected = Number(q.correctAnswer);
        const actual = Number(userAns);
        isCorrect = Math.abs(expected - actual) <= 0.05;
      } else if (q.type === 'equation_balancing') {
        const state = this.selectedAnswers[q.id];
        const studentStr = [...state.r, ...state.p].join(',');
        isCorrect = studentStr === q.correctAnswer;
      }

      this.submittedQuestions[q.id] = true;
      this.results[q.id] = isCorrect;

      if (isCorrect) {
        await StorageService.addPoints(50, `إجابة صحيحة للسؤال ${q.id}`);
      } else {
        // Log mistake category
        const cat = q.type === 'equation_balancing' ? 'موازنة المعادلات' : q.type === 'calculation' ? 'حسابات الأس الهيدروجيني' : 'قاعدة لوشاتلييه والتصادم';
        await StorageService.logMistake(cat);
      }

      this.render();
    });

    // Retry
    this.element.querySelector('#btn-retry-q')?.addEventListener('click', () => {
      delete this.submittedQuestions[q.id];
      delete this.results[q.id];
      this.render();
    });

    // Nav Previous / Next / Quick Jump
    this.element.querySelector('#btn-prev-q')?.addEventListener('click', () => {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.render();
      }
    });

    this.element.querySelector('#btn-next-q')?.addEventListener('click', () => {
      if (this.currentIndex < QUIZ_QUESTIONS.length - 1) {
        this.currentIndex++;
        this.render();
      }
    });

    this.element.querySelectorAll('.q-nav-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.goto || '0');
        this.currentIndex = idx;
        this.render();
      });
    });
  }

  public dispose() {
    this.element.remove();
  }
}
