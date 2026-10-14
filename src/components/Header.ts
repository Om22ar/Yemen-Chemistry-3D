import { StorageService } from '../services/firebase';
import type { StudentProfile } from '../types';

export type ActiveTab = 'lessons' | 'kinetics' | 'titration' | 'quiz' | 'dashboard';

export class HeaderComponent {
  private element: HTMLElement;
  private onTabChange: (tab: ActiveTab) => void;
  private currentTab: ActiveTab = 'lessons';
  private profile: StudentProfile;

  constructor(
    container: HTMLElement,
    initialTab: ActiveTab,
    onTabChange: (tab: ActiveTab) => void
  ) {
    this.currentTab = initialTab;
    this.onTabChange = onTabChange;
    this.profile = StorageService.getLocalProfile();

    this.element = document.createElement('header');
    this.element.className =
      'sticky top-0 z-40 bg-white/95 border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-xs';
    container.appendChild(this.element);

    StorageService.subscribe((updatedProfile) => {
      this.profile = updatedProfile;
      this.render();
    });

    this.render();
  }

  public setTab(tab: ActiveTab) {
    this.currentTab = tab;
    this.render();
  }

  private render() {
    this.element.innerHTML = `
      <div class="flex items-center gap-6">
        <!-- Brand Logo -->
        <div class="flex items-center gap-3 cursor-pointer" id="brand-logo">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md text-xl">
            ⚗️
          </div>
          <div>
            <div class="font-bold text-slate-900 text-lg tracking-tight leading-tight">
              كيمياء اليمن 3D
            </div>
            <div class="text-xs text-slate-500 font-medium">
              الصف الثاني الثانوي العلمي · الوحدتان 7 و 8
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <nav class="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-sm font-medium">
          <button data-tab="lessons" class="tab-btn px-3.5 py-1.5 rounded-lg transition-all ${
            this.currentTab === 'lessons'
              ? 'bg-white text-sky-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }">
            📚 الدروس
          </button>
          <button data-tab="kinetics" class="tab-btn px-3.5 py-1.5 rounded-lg transition-all ${
            this.currentTab === 'kinetics'
              ? 'bg-white text-sky-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }">
            ⚛️ محاكاة التصادم والاتزان
          </button>
          <button data-tab="titration" class="tab-btn px-3.5 py-1.5 rounded-lg transition-all ${
            this.currentTab === 'titration'
              ? 'bg-white text-sky-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }">
            🧪 معمل المعايرة الافتراضي
          </button>
          <button data-tab="quiz" class="tab-btn px-3.5 py-1.5 rounded-lg transition-all ${
            this.currentTab === 'quiz'
              ? 'bg-white text-sky-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }">
            📝 الاختبار الذاتي
          </button>
          <button data-tab="dashboard" class="tab-btn px-3.5 py-1.5 rounded-lg transition-all ${
            this.currentTab === 'dashboard'
              ? 'bg-white text-sky-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }">
            📊 لوحة التقدم
          </button>
        </nav>
      </div>

      <!-- User Stats & Auth -->
      <div class="flex items-center gap-3">
        <!-- Points & Level Badge -->
        <div class="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors" id="btn-open-dashboard">
          <span class="text-amber-500 font-bold">⭐</span>
          <span class="font-mono-numbers font-bold text-amber-900 text-sm">${this.profile.totalPoints}</span>
          <span class="text-xs text-amber-700 font-medium">نقطة</span>
          <span class="text-xs bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-semibold">مستوى ${this.profile.level}</span>
        </div>

        <!-- Google Auth or Guest -->
        ${
          this.profile.isGuest
            ? `
          <button id="btn-login-google" class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.9l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"/>
            </svg>
            <span>حفظ تقدمي (Google)</span>
          </button>
        `
            : `
          <div class="flex items-center gap-2 bg-slate-100 pl-3 pr-1.5 py-1 rounded-xl">
            <div class="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs uppercase">
              ${this.profile.displayName.charAt(0) || 'U'}
            </div>
            <span class="text-xs font-medium text-slate-700 hidden sm:inline">${this.profile.displayName}</span>
            <button id="btn-logout" class="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors">
              خروج
            </button>
          </div>
        `
        }
      </div>
    `;

    // Attach listeners
    this.element.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.tab as ActiveTab;
        if (target) {
          this.onTabChange(target);
        }
      });
    });

    this.element.querySelector('#brand-logo')?.addEventListener('click', () => {
      this.onTabChange('lessons');
    });

    this.element.querySelector('#btn-open-dashboard')?.addEventListener('click', () => {
      this.onTabChange('dashboard');
    });

    this.element.querySelector('#btn-login-google')?.addEventListener('click', async () => {
      try {
        await StorageService.signInWithGoogle();
      } catch (err) {
        alert('تعذر تسجيل الدخول بـ Google حالياً، يمكنك الاستمرار كضيف وحفظ تقدمك محلياً.');
      }
    });

    this.element.querySelector('#btn-logout')?.addEventListener('click', async () => {
      if (confirm('هل ترغب بتسجيل الخروج؟')) {
        await StorageService.logout();
      }
    });
  }
}
