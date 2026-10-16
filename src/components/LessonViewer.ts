import { StorageService } from '../services/firebase';
import type { LessonContent, StudentProfile } from '../types';
import {
  renderStudentFriendlyFormula,
  formatMathHtml,
  renderComprehensiveLawCard,
  formatSolutionStep,
} from '../utils/formulaFormatter';

export class LessonViewer {
  private element: HTMLElement;
  private currentLesson: LessonContent;
  private onLaunchSimulation: (type: string) => void;
  private onOpenCurriculumDrawer?: () => void;
  private profile: StudentProfile;

  constructor(
    container: HTMLElement,
    initialLesson: LessonContent,
    onLaunchSimulation: (type: string) => void,
    onOpenCurriculumDrawer?: () => void
  ) {
    this.currentLesson = initialLesson;
    this.onLaunchSimulation = onLaunchSimulation;
    this.onOpenCurriculumDrawer = onOpenCurriculumDrawer;
    this.profile = StorageService.getLocalProfile();

    this.element = document.createElement('main');
    this.element.className = 'flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full';
    container.appendChild(this.element);

    StorageService.subscribe((updatedProfile) => {
      this.profile = updatedProfile;
      this.updateCompletionState();
    });

    this.render();
  }

  public setLesson(lesson: LessonContent) {
    this.currentLesson = lesson;
    this.render();
    this.element.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateCompletionState() {
    const isCompleted = this.profile.completedLessons.includes(this.currentLesson.id);
    const btn = this.element.querySelector('#btn-mark-completed') as HTMLButtonElement;
    if (btn) {
      if (isCompleted) {
        btn.innerHTML = '<span>✓</span> <span>تمت دراسة هذا الدرس بنجاح (+50 نقطة)</span>';
        btn.className =
          'w-full sm:w-auto bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 cursor-default';
        btn.disabled = true;
      } else {
        btn.innerHTML = '<span>⭐</span> <span>تعليم الدرس كمكتمل (+50 نقطة XP)</span>';
        btn.className =
          'w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer';
        btn.disabled = false;
      }
    }
  }

  private render() {
    const isCompleted = this.profile.completedLessons.includes(this.currentLesson.id);

    this.element.innerHTML = `
      <div class="space-y-5 sm:space-y-6">
        <!-- Top Breadcrumb & Metadata -->
        <div class="flex flex-wrap items-center justify-between gap-2.5 pb-3 sm:pb-4 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <!-- Mobile Open Curriculum Drawer Button -->
            <button id="btn-mobile-curriculum" class="lg:hidden flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-sky-200 transition-all cursor-pointer shadow-2xs">
              <span>📖</span>
              <span>فهرس الدروس</span>
            </button>
            <div class="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>${this.currentLesson.unitTitle}</span>
              <span>/</span>
              <span class="text-slate-800 font-bold">الدرس ${this.currentLesson.id}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span>⏱️ مدة القراءة:</span>
            <span class="font-mono font-bold text-slate-700">${this.currentLesson.readingTimeMin} دقيقة</span>
          </div>
        </div>

        <!-- Title & Subtitle Banner -->
        <div class="bg-gradient-to-r from-sky-900 to-indigo-900 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div class="relative z-10 space-y-2">
            <span class="inline-block px-3 py-1 bg-white/15 backdrop-blur-xs text-sky-200 text-xs rounded-lg font-semibold">
              المنهج اليمني · الثاني الثانوي
            </span>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">
              ${this.currentLesson.title}
            </h1>
            <p class="text-sky-100 text-sm max-w-2xl leading-relaxed">
              ${this.currentLesson.subtitle}
            </p>
          </div>
          <div class="absolute -left-8 -bottom-8 opacity-10 text-9xl select-none pointer-events-none">
            ⚛️
          </div>
        </div>

        <!-- Quick 3D Simulation CTA Card -->
        <div class="bg-sky-50 border border-sky-200/80 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xl shrink-0">
              👓
            </div>
            <div>
              <div class="font-bold text-slate-900 text-sm">
                محاكاة ثلاثية الأبعاد تفاعلية لهذا الدرس
              </div>
              <div class="text-xs text-slate-600">
                شاهد الجزيئات والتصادمات وتغيرات الاتزان بصورة حية
              </div>
            </div>
          </div>
          <button id="btn-launch-sim" class="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs shrink-0 flex items-center justify-center gap-2">
            <span>تشغيل المحاكاة 3D</span>
            <span>←</span>
          </button>
        </div>

        <!-- Introduction Section -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📖</span>
            <span>مقدمة وتمهيد الدرس</span>
          </h2>
          <p class="text-slate-700 text-sm sm:text-base leading-relaxed">
            ${this.currentLesson.introduction}
          </p>
        </div>

        <!-- Core Definitions -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📌</span>
            <span>المصطلحات والمفاهيم الأساسية</span>
          </h2>
          <div class="grid gap-3">
            ${this.currentLesson.definitions
              .map(
                (def) => `
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-colors">
                <div class="font-bold text-slate-900 text-sm mb-1 text-sky-800">
                  ${def.term}
                </div>
                <div class="text-slate-700 text-xs sm:text-sm leading-relaxed mb-2">
                  ${def.definition}
                </div>
                ${
                  def.chemicalFormula
                    ? renderStudentFriendlyFormula(def.chemicalFormula, def.term)
                    : ''
                }
                ${
                  def.example
                    ? `<div class="text-xs text-slate-600 font-mono mt-1.5 p-2 bg-slate-100/70 rounded-lg border border-slate-200/80"><span class="font-sans text-slate-500 font-semibold">مثال توضيحي:</span> <span class="dir-ltr inline-block font-bold text-slate-800">${formatMathHtml(def.example)}</span></div>`
                    : ''
                }
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Key Laws and Mathematical Equations -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📐</span>
            <span>القوانين والمعادلات الرياضية</span>
          </h2>
          <div class="space-y-4">
            ${this.currentLesson.keyLaws
              .map((law) => renderComprehensiveLawCard(law))
              .join('')}
          </div>
        </div>

        <!-- Solved Practical Examples -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>💡</span>
            <span>مسائل وتطبيقات محلولة</span>
          </h2>
          <div class="space-y-3">
            ${this.currentLesson.practicalExamples
              .map(
                (ex) => `
              <div class="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
                <div class="font-bold text-xs text-amber-950 flex items-center justify-between pb-1.5 border-b border-amber-200/60">
                  <span class="flex items-center gap-1.5">
                    <span>❓</span>
                    <span>${ex.title}</span>
                  </span>
                  <span class="text-[10px] bg-white text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 font-semibold">تطبيق منهجي</span>
                </div>
                <div class="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  ${formatMathHtml(ex.problem)}
                </div>
                <div class="p-3.5 bg-white rounded-xl border border-amber-300/80 text-xs sm:text-sm text-slate-900 leading-relaxed font-mono-numbers shadow-2xs">
                  <div class="font-bold text-emerald-800 font-sans mb-1.5 flex items-center gap-1.5 text-xs">
                    <span>✓</span>
                    <span>خطوات التعويض والحل النموذجي:</span>
                  </div>
                  <div class="text-slate-800 leading-relaxed">
                    ${formatSolutionStep(ex.solution)}
                  </div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Lesson Summary Takeaways -->
        <div class="bg-emerald-50/70 border border-emerald-200 p-6 rounded-2xl space-y-3">
          <h2 class="text-base font-bold text-emerald-950 flex items-center gap-2">
            <span>✨</span>
            <span>خلاصة الدرس وأهم النقاط</span>
          </h2>
          <ul class="space-y-2 text-xs sm:text-sm text-emerald-900">
            ${this.currentLesson.summaryPoints
              .map(
                (pt) => `
              <li class="flex items-start gap-2">
                <span class="text-emerald-600 font-bold mt-0.5">•</span>
                <span>${formatMathHtml(pt)}</span>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>

        <!-- Bottom Action Bar (Complete & Next) -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <button id="btn-mark-completed" class="w-full sm:w-auto ${
            isCompleted
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 cursor-default'
              : 'bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2'
          }">
            ${
              isCompleted
                ? '<span>✓</span> <span>تمت دراسة هذا الدرس بنجاح (+50 نقطة)</span>'
                : '<span>⭐</span> <span>تعليم الدرس كمكتمل (+50 نقطة XP)</span>'
            }
          </button>

          <button id="btn-open-quiz-from-lesson" class="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2">
            <span>اختبر معلوماتك في هذا الدرس</span>
            <span>📝</span>
          </button>
        </div>
      </div>
    `;

    // Event listeners
    this.element.querySelector('#btn-mobile-curriculum')?.addEventListener('click', () => {
      this.onOpenCurriculumDrawer?.();
    });

    this.element.querySelector('#btn-launch-sim')?.addEventListener('click', () => {
      this.onLaunchSimulation(this.currentLesson.relatedSimulation);
    });

    this.element.querySelector('#btn-mark-completed')?.addEventListener('click', async () => {
      await StorageService.markLessonCompleted(this.currentLesson.id);
      this.updateCompletionState();
    });

    this.element.querySelector('#btn-open-quiz-from-lesson')?.addEventListener('click', () => {
      this.onLaunchSimulation('quiz');
    });
  }
}
