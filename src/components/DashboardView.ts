import { StorageService } from '../services/firebase';
import { ACHIEVEMENTS_LIST, CURRICULUM_LESSONS } from '../data/curriculumData';
import type { StudentProfile } from '../types';

export class DashboardView {
  private element: HTMLElement;
  private profile: StudentProfile;
  private onNavigateToLesson: (lessonId: string) => void;

  constructor(container: HTMLElement, onNavigateToLesson: (lessonId: string) => void) {
    this.element = document.createElement('main');
    this.element.className = 'flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full';
    container.appendChild(this.element);

    this.onNavigateToLesson = onNavigateToLesson;
    this.profile = StorageService.getLocalProfile();

    StorageService.subscribe((p) => {
      this.profile = p;
      this.render();
    });

    this.render();
  }

  private render() {
    const unit7Total = CURRICULUM_LESSONS.filter((l) => l.unitId === 7).length;
    const unit8Total = CURRICULUM_LESSONS.filter((l) => l.unitId === 8).length;

    const unit7Done = CURRICULUM_LESSONS.filter(
      (l) => l.unitId === 7 && this.profile.completedLessons.includes(l.id)
    ).length;
    const unit8Done = CURRICULUM_LESSONS.filter(
      (l) => l.unitId === 8 && this.profile.completedLessons.includes(l.id)
    ).length;

    const unit7Pct = Math.round((unit7Done / unit7Total) * 100);
    const unit8Pct = Math.round((unit8Done / unit8Total) * 100);

    const mistakes = this.profile.mistakeLog || {};
    const totalMistakes = Object.values(mistakes).reduce((a, b) => a + b, 0);

    this.element.innerHTML = `
      <div class="space-y-6">
        <!-- Hero Profile Banner -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
          <div class="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-3xl font-bold shadow-md">
                🎓
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-bold">${this.profile.displayName}</h1>
                  <span class="text-xs bg-white/20 text-sky-200 px-2 py-0.5 rounded-md font-semibold">
                    ${this.profile.isGuest ? 'وضع الضيف' : 'حساب سحابي متزامن'}
                  </span>
                </div>
                <p class="text-slate-300 text-xs sm:text-sm mt-1">
                  طالب كيمياء الصف الثاني الثانوي · الجمهورية اليمنية
                </p>
              </div>
            </div>

            <!-- Level & Points Pill -->
            <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 flex items-center gap-4">
              <div class="text-center">
                <div class="text-[10px] text-slate-400 font-bold">المستوى</div>
                <div class="text-xl font-bold text-amber-400 font-mono">${this.profile.level}</div>
              </div>
              <div class="w-px h-8 bg-white/20"></div>
              <div class="text-center">
                <div class="text-[10px] text-slate-400 font-bold">النقاط الكلية (XP)</div>
                <div class="text-xl font-bold text-sky-400 font-mono">${this.profile.totalPoints}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Units Completion Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Unit 7 -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-sm text-slate-900">
                <span>📚</span>
                <span>الوحدة 7: سرعة التفاعلات والاتزان</span>
              </div>
              <span class="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                ${unit7Done} من ${unit7Total} دروس
              </span>
            </div>
            <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div class="bg-sky-600 h-full rounded-full transition-all duration-500" style="width: ${unit7Pct}%"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>نسبة الإنجاز:</span>
              <span class="font-bold text-slate-800 font-mono">${unit7Pct}%</span>
            </div>
          </div>

          <!-- Unit 8 -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-sm text-slate-900">
                <span>🧪</span>
                <span>الوحدة 8: الاتزان الأيوني في المحاليل</span>
              </div>
              <span class="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                ${unit8Done} من ${unit8Total} دروس
              </span>
            </div>
            <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div class="bg-emerald-600 h-full rounded-full transition-all duration-500" style="width: ${unit8Pct}%"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>نسبة الإنجاز:</span>
              <span class="font-bold text-slate-800 font-mono">${unit8Pct}%</span>
            </div>
          </div>
        </div>

        <!-- Achievements & Badges Gallery -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🏆</span>
              <span>سجل الأوسمة والإنجازات</span>
            </h2>
            <span class="text-xs text-slate-500 font-medium">افتح الأوسمة بزيادة نقاطك والتفوق في الاختبارات</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${ACHIEVEMENTS_LIST.map((ach) => {
              const isUnlocked = this.profile.totalPoints >= ach.pointsRequired;
              return `
                <div class="p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  isUnlocked
                    ? 'bg-amber-50/60 border-amber-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }">
                  <div class="text-2xl p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs shrink-0">
                    ${ach.icon}
                  </div>
                  <div>
                    <div class="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>${ach.title}</span>
                      ${isUnlocked ? '<span class="text-emerald-600 text-[10px]">✓</span>' : ''}
                    </div>
                    <div class="text-[11px] text-slate-600 mt-0.5 leading-snug">${ach.description}</div>
                    <div class="text-[10px] font-mono text-slate-400 mt-1">${ach.pointsRequired} نقطة مطلوبة</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Smart Mistakes Diagnosis & Personalized Recommendations -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📈</span>
              <span>تشخيص الأخطاء الشائعة والتوصيات المخصصة</span>
            </h2>
            <span class="text-xs font-mono font-semibold ${totalMistakes > 0 ? 'text-rose-600' : 'text-emerald-600'}">
              ${totalMistakes > 0 ? `${totalMistakes} أخطاء مسجلة` : 'سجل ناصع بدون أخطاء!'}
            </span>
          </div>

          ${
            totalMistakes === 0
              ? `
            <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-center gap-3">
              <span class="text-xl">🌟</span>
              <span>أداء استثنائي! لم تسجل أي أخطاء متكررة حتى الآن. واصل تفوقك في بنك الأسئلة والمعمل الافتراضي.</span>
            </div>
          `
              : `
            <div class="space-y-3">
              ${Object.entries(mistakes)
                .map(([cat, count]) => {
                  let recommendedLessonId = '7.1';
                  let recTitle = 'الدرس 7.1: المصطلحات الأساسية';
                  if (cat.includes('موازنة')) {
                    recommendedLessonId = '7.1';
                    recTitle = 'الدرس 7.1: المصطلحات والمعادلات';
                  } else if (cat.includes('الهيدروجيني') || cat.includes('pH')) {
                    recommendedLessonId = '8.3';
                    recTitle = 'الدرس 8.3: الرقم الهيدروجيني pH وحساباته';
                  } else if (cat.includes('لوشاتلييه') || cat.includes('التصادم')) {
                    recommendedLessonId = '7.5';
                    recTitle = 'الدرس 7.5: قاعدة لوشاتلييه';
                  }

                  return `
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div class="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span class="text-rose-500 font-bold">•</span>
                        <span>${cat}</span>
                        <span class="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-mono">${count} أخطاء</span>
                      </div>
                      <div class="text-xs text-slate-600 mt-1">
                        نوصي بمراجعة: <strong class="text-sky-800">${recTitle}</strong>
                      </div>
                    </div>
                    <button data-rec-lesson="${recommendedLessonId}" class="btn-rec-jump bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0">
                      مراجعة الدرس الآن ←
                    </button>
                  </div>
                `;
                })
                .join('')}
            </div>
          `
          }
        </div>
      </div>
    `;

    // Bind Jump Buttons
    this.element.querySelectorAll('.btn-rec-jump').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.recLesson;
        if (id) {
          this.onNavigateToLesson(id);
        }
      });
    });
  }

  public dispose() {
    this.element.remove();
  }
}
