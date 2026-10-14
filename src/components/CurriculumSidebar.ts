import { CURRICULUM_LESSONS } from '../data/curriculumData';
import { StorageService } from '../services/firebase';
import type { LessonContent, StudentProfile } from '../types';

export class CurriculumSidebar {
  private element: HTMLElement;
  private onSelectLesson: (lesson: LessonContent) => void;
  private currentLessonId: string = '7.1';
  private profile: StudentProfile;

  constructor(
    container: HTMLElement,
    currentLessonId: string,
    onSelectLesson: (lesson: LessonContent) => void
  ) {
    this.currentLessonId = currentLessonId;
    this.onSelectLesson = onSelectLesson;
    this.profile = StorageService.getLocalProfile();

    this.element = document.createElement('aside');
    this.element.className =
      'w-full lg:w-80 shrink-0 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto';
    container.appendChild(this.element);

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

  private render() {
    const unit7Lessons = CURRICULUM_LESSONS.filter((l) => l.unitId === 7);
    const unit8Lessons = CURRICULUM_LESSONS.filter((l) => l.unitId === 8);

    const unit7Completed = unit7Lessons.filter((l) => this.profile.completedLessons.includes(l.id)).length;
    const unit8Completed = unit8Lessons.filter((l) => this.profile.completedLessons.includes(l.id)).length;

    const unit7Percent = Math.round((unit7Completed / unit7Lessons.length) * 100);
    const unit8Percent = Math.round((unit8Completed / unit8Lessons.length) * 100);

    this.element.innerHTML = `
      <div class="p-4 border-b border-slate-100 bg-slate-50/60">
        <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          فهرس المنهج الدراسي
        </div>
        <div class="text-sm font-bold text-slate-900">
          كيمياء 2 ثانوي (الجمهورية اليمنية)
        </div>
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

    // Click handlers
    this.element.querySelectorAll('.lesson-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.lessonId;
        const lesson = CURRICULUM_LESSONS.find((l) => l.id === id);
        if (lesson) {
          this.setLesson(lesson.id);
          this.onSelectLesson(lesson);
        }
      });
    });
  }
}
