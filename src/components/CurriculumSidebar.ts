import { CURRICULUM_LESSONS } from '../data/curriculumData';
import { StorageService } from '../services/firebase';
import type { LessonContent, StudentProfile } from '../types';

export class CurriculumSidebar {
  private element: HTMLElement;
  private mobileDrawerEl: HTMLElement;
  private onSelectLesson: (lesson: LessonContent) => void;
  private currentLessonId: string = '7.1';
  private profile: StudentProfile;
  private isMobileOpen: boolean = false;

  constructor(
    container: HTMLElement,
    currentLessonId: string,
    onSelectLesson: (lesson: LessonContent) => void
  ) {
    this.currentLessonId = currentLessonId;
    this.onSelectLesson = onSelectLesson;
    this.profile = StorageService.getLocalProfile();

    // Desktop Sidebar (lg:flex)
    this.element = document.createElement('aside');
    this.element.className =
      'hidden lg:flex w-80 shrink-0 bg-white border-l border-slate-200 flex-col h-full overflow-y-auto';
    container.appendChild(this.element);

    // Mobile Drawer Modal (< lg)
    this.mobileDrawerEl = document.createElement('div');
    this.mobileDrawerEl.className =
      'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end hidden lg:hidden animate-in fade-in duration-200';
    document.body.appendChild(this.mobileDrawerEl);

    StorageService.subscribe((updatedProfile) => {
      this.profile = updatedProfile;
      this.render();
    });

    this.render();
  }

  public setLesson(lessonId: string) {
    this.currentLessonId = lessonId;
    this.render();
  }

  public openMobile() {
    this.isMobileOpen = true;
    this.mobileDrawerEl.classList.remove('hidden');
  }

  public closeMobile() {
    this.isMobileOpen = false;
    this.mobileDrawerEl.classList.add('hidden');
  }

  public dispose() {
    this.element.remove();
    this.mobileDrawerEl.remove();
  }

  private generateHtmlContent(isMobile = false): string {
    const unit7Lessons = CURRICULUM_LESSONS.filter((l) => l.unitId === 7);
    const unit8Lessons = CURRICULUM_LESSONS.filter((l) => l.unitId === 8);

    const unit7Completed = unit7Lessons.filter((l) => this.profile.completedLessons.includes(l.id)).length;
    const unit8Completed = unit8Lessons.filter((l) => this.profile.completedLessons.includes(l.id)).length;

    const unit7Percent = Math.round((unit7Completed / unit7Lessons.length) * 100);
    const unit8Percent = Math.round((unit8Completed / unit8Lessons.length) * 100);

    return `
      <div class="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <div>
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
            فهرس المنهج الدراسي
          </div>
          <div class="text-sm font-bold text-slate-900">
            كيمياء 2 ثانوي (الجمهورية اليمنية)
          </div>
        </div>
        ${
          isMobile
            ? `<button id="btn-close-mobile-drawer" class="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-base cursor-pointer">✕</button>`
            : ''
        }
      </div>

      <div class="p-4 space-y-6">
        <!-- UNIT 7 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <span>📚</span>
              <span>الوحدة 7: سرعة التفاعلات والاتزان</span>
            </span>
            <span class="text-xs font-mono font-semibold text-slate-500">${unit7Percent}%</span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
            <div class="bg-sky-600 h-full rounded-full transition-all duration-300" style="width: ${unit7Percent}%"></div>
          </div>

          <!-- Lesson Items -->
          <div class="space-y-1">
            ${unit7Lessons
              .map((lesson) => {
                const isSelected = lesson.id === this.currentLessonId;
                const isDone = this.profile.completedLessons.includes(lesson.id);
                return `
                <button data-lesson-id="${lesson.id}" class="lesson-btn w-full text-right p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200/80 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }">
                  <span class="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    isDone
                      ? 'bg-emerald-500 text-white text-[10px]'
                      : isSelected
                      ? 'bg-sky-200 text-sky-800 text-[10px]'
                      : 'border border-slate-300 text-transparent text-[8px]'
                  }">
                    ${isDone ? '✓' : '•'}
                  </span>
                  <div class="flex-1 leading-snug">
                    <div class="flex items-center justify-between gap-1">
                      <span>${lesson.id} ${lesson.title}</span>
                      <span class="text-[10px] text-slate-400 font-mono">${lesson.readingTimeMin} د</span>
                    </div>
                  </div>
                </button>
              `;
              })
              .join('')}
          </div>
        </div>

        <!-- UNIT 8 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <span>🧪</span>
              <span>الوحدة 8: الاتزان الأيوني</span>
            </span>
            <span class="text-xs font-mono font-semibold text-slate-500">${unit8Percent}%</span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
            <div class="bg-emerald-600 h-full rounded-full transition-all duration-300" style="width: ${unit8Percent}%"></div>
          </div>

          <!-- Lesson Items -->
          <div class="space-y-1">
            ${unit8Lessons
              .map((lesson) => {
                const isSelected = lesson.id === this.currentLessonId;
                const isDone = this.profile.completedLessons.includes(lesson.id);
                return `
                <button data-lesson-id="${lesson.id}" class="lesson-btn w-full text-right p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }">
                  <span class="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    isDone
                      ? 'bg-emerald-500 text-white text-[10px]'
                      : isSelected
                      ? 'bg-emerald-200 text-emerald-800 text-[10px]'
                      : 'border border-slate-300 text-transparent text-[8px]'
                  }">
                    ${isDone ? '✓' : '•'}
                  </span>
                  <div class="flex-1 leading-snug">
                    <div class="flex items-center justify-between gap-1">
                      <span>${lesson.id} ${lesson.title}</span>
                      <span class="text-[10px] text-slate-400 font-mono">${lesson.readingTimeMin} د</span>
                    </div>
                  </div>
                </button>
              `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  private render() {
    // 1. Render Desktop Sidebar
    this.element.innerHTML = this.generateHtmlContent(false);

    // 2. Render Mobile Drawer (Right-aligned slide-out card)
    this.mobileDrawerEl.innerHTML = `
      <div class="w-80 max-w-[85vw] h-full bg-white flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
        ${this.generateHtmlContent(true)}
      </div>
    `;

    // Click handler helper
    const attachLessonHandlers = (root: HTMLElement) => {
      root.querySelectorAll('.lesson-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const id = (e.currentTarget as HTMLElement).dataset.lessonId;
          const lesson = CURRICULUM_LESSONS.find((l) => l.id === id);
          if (lesson) {
            this.closeMobile();
            this.setLesson(lesson.id);
            this.onSelectLesson(lesson);
          }
        });
      });
    };

    attachLessonHandlers(this.element);
    attachLessonHandlers(this.mobileDrawerEl);

    // Mobile Close button & Backdrop click
    this.mobileDrawerEl.querySelector('#btn-close-mobile-drawer')?.addEventListener('click', () => {
      this.closeMobile();
    });

    this.mobileDrawerEl.addEventListener('click', (e) => {
      if (e.target === this.mobileDrawerEl) {
        this.closeMobile();
      }
    });
  }
}
