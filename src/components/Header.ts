import { StorageService } from '../services/firebase';
import type { StudentProfile } from '../types';

export type ActiveTab = 'lessons' | 'kinetics' | 'titration' | 'calculator' | 'quiz' | 'dashboard';

export class HeaderComponent {
  private element: HTMLElement;
  private onTabChange: (tab: ActiveTab) => void;
  private currentTab: ActiveTab = 'lessons';
  private profile: StudentProfile;
  private isMobileMenuOpen: boolean = false;

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
      'sticky top-0 z-40 bg-white/95 border-b border-slate-200 px-3 sm:px-6 py-2.5 shadow-xs relative';
    container.appendChild(this.element);

    StorageService.subscribe((updatedProfile) => {
      this.profile = updatedProfile;
      this.render();
    });

    this.render();
  }

  public setTab(tab: ActiveTab) {
    this.currentTab = tab;
    this.isMobileMenuOpen = false;
    this.render();
  }

  private toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.render();
  }

  private render() {
    this.element.innerHTML = `
      <div class="flex items-center justify-between gap-2 sm:gap-4 w-full">
        <div class="flex items-center gap-3 lg:gap-6">
          <!-- Brand Logo -->
          <div class="flex items-center gap-2.5 cursor-pointer" id="brand-logo">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md text-lg sm:text-xl shrink-0">
              ⚗️
            </div>
            <div>
              <div class="font-bold text-slate-900 text-sm sm:text-base lg:text-lg tracking-tight leading-tight">
                كيمياء اليمن 3D
              </div>
              <div class="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                الصف الثاني الثانوي العلمي · الوحدتان 7 و 8
              </div>
            </div>
          </div>

          <!-- Navigation Tabs (Desktop & Tablet Lg+) -->
          <nav class="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs xl:text-sm font-medium">
            <button data-tab="lessons" class="tab-btn px-3 py-1.5 rounded-lg transition-all ${
              this.currentTab === 'lessons'
                ? 'bg-white text-sky-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }">
              📚 الدروس
            </button>
            <button data-tab="kinetics" class="tab-btn px-3 py-1.5 rounded-lg transition-all ${
              this.currentTab === 'kinetics'
                ? 'bg-white text-sky-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }">
              ⚛️ محاكاة التصادم والاتزان
            </button>
            <button data-tab="titration" class="tab-btn px-3 py-1.5 rounded-lg transition-all ${
              this.currentTab === 'titration'
                ? 'bg-white text-sky-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }">
              🧪 معمل المعايرة
            </button>
            <button data-tab="calculator" class="tab-btn px-3 py-1.5 rounded-lg transition-all ${
              this.currentTab === 'calculator'
                ? 'bg-white text-sky-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }">
              🧮 حاسبة الكيمياء
            </button>
            <button data-tab="quiz" class="tab-btn px-3 py-1.5 rounded-lg transition-all ${
              this.currentTab === 'quiz'
                ? 'bg-white text-sky-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }">
              📝 الاختبار الذاتي
            </button>
            <button data-tab="dashboard" class="tab-btn px-3 py-1.5 rounded-lg transition-all ${
              this.currentTab === 'dashboard'
                ? 'bg-white text-sky-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }">
              📊 لوحة التقدم
            </button>
          </nav>
        </div>

        <!-- Right Side: User Stats, Google Auth & Mobile Hamburger Button -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Points & Level Badge -->
          <div class="flex items-center gap-1.5 sm:gap-2 bg-amber-50 border border-amber-200/80 px-2 sm:px-3 py-1.5 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors" id="btn-open-dashboard" title="افتح لوحة التقدم والمتصدرين">
            <span class="text-amber-500 font-bold text-sm sm:text-base">⭐</span>
            <span class="font-mono-numbers font-bold text-amber-900 text-xs sm:text-sm">${this.profile.totalPoints}</span>
            <span class="text-[10px] sm:text-xs bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-semibold">مستوى ${this.profile.level}</span>
          </div>

          <!-- Desktop Google Auth / User Badge -->
          <div class="hidden sm:flex items-center">
            ${
              this.profile.isGuest
                ? `
              <button id="btn-login-google" class="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-xs">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.9l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"/>
                </svg>
                <span>حفظ (Google)</span>
              </button>
            `
                : `
              <div class="flex items-center gap-1.5 bg-slate-100 pl-2.5 pr-1 py-1 rounded-xl">
                <div class="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                  ${this.profile.displayName.charAt(0) || 'U'}
                </div>
                <span class="text-xs font-medium text-slate-700 max-w-[80px] truncate">${this.profile.displayName}</span>
                <button id="btn-logout" class="text-[11px] text-rose-600 hover:text-rose-800 font-semibold px-1.5 py-0.5 rounded-md hover:bg-rose-50 transition-colors">
                  خروج
                </button>
              </div>
            `
            }
          </div>

          <!-- Mobile Hamburger Toggle Button (< lg) -->
          <button id="btn-mobile-menu-toggle" aria-label="قائمة التصفح" class="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer border border-slate-200">
            ${
              this.isMobileMenuOpen
                ? `<span class="text-lg font-bold leading-none">✕</span>`
                : `<span class="text-xl font-bold leading-none">☰</span>`
            }
          </button>
        </div>
      </div>

      <!-- Top Collapsible Hamburger Dropdown Menu (< lg) -->
      ${
        this.isMobileMenuOpen
          ? `
        <div id="mobile-menu-dropdown" class="lg:hidden absolute top-full left-0 right-0 bg-white/98 backdrop-blur-lg border-b border-slate-200 shadow-xl p-4 z-50 animate-in slide-in-from-top-2 duration-200 space-y-3">
          <!-- Mobile User Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                ${this.profile.displayName.charAt(0) || '🎓'}
              </div>
              <div>
                <div class="font-bold text-slate-900">${this.profile.displayName}</div>
                <div class="text-[11px] text-slate-500">${this.profile.isGuest ? 'وضع الضيف المحفوظ محلياً' : 'حساب Google متزامن سحابياً'}</div>
              </div>
            </div>

            ${
              this.profile.isGuest
                ? `
              <button id="btn-mobile-login-google" class="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all shadow-xs">
                <span>دخول Google</span>
              </button>
            `
                : `
              <button id="btn-mobile-logout" class="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg bg-rose-50">
                تسجيل خروج
              </button>
            `
            }
          </div>

          <!-- Mobile Nav Items Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
            <button data-tab="lessons" class="mobile-nav-btn flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
              this.currentTab === 'lessons'
                ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }">
              <span class="text-xl">📚</span>
              <div>
                <div class="font-bold text-slate-900">الدروس والمحتوى العلمي</div>
                <div class="text-[10px] text-slate-500 font-normal">الوحدة 7 (السرعة والاتزان) + الوحدة 8 (الأيوني)</div>
              </div>
            </button>

            <button data-tab="kinetics" class="mobile-nav-btn flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
              this.currentTab === 'kinetics'
                ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }">
              <span class="text-xl">⚛️</span>
              <div>
                <div class="font-bold text-slate-900">محاكاة التصادم والاتزان 3D</div>
                <div class="text-[10px] text-slate-500 font-normal">التحكم بالحرارة والضغط وقاعدة لوشاتلييه</div>
              </div>
            </button>

            <button data-tab="titration" class="mobile-nav-btn flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
              this.currentTab === 'titration'
                ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }">
              <span class="text-xl">🧪</span>
              <div>
                <div class="font-bold text-slate-900">معمل المعايرة الافتراضي 3D</div>
                <div class="text-[10px] text-slate-500 font-normal">سحاحة، أدلة كيميائية، ومنحنى الرقم الهيدروجيني pH</div>
              </div>
            </button>

            <button data-tab="calculator" class="mobile-nav-btn flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
              this.currentTab === 'calculator'
                ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }">
              <span class="text-xl">🧮</span>
              <div>
                <div class="font-bold text-slate-900">حاسبة الكيمياء التفاعلية الشاملة</div>
                <div class="text-[10px] text-slate-500 font-normal">pH، التخفيف، المعايرة، Ka، ومدقق الموازنة</div>
              </div>
            </button>

            <button data-tab="quiz" class="mobile-nav-btn flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
              this.currentTab === 'quiz'
                ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }">
              <span class="text-xl">📝</span>
              <div>
                <div class="font-bold text-slate-900">الاختبار الذاتي التكيفي</div>
                <div class="text-[10px] text-slate-500 font-normal">أسئلة وزارية يمنية وتقييم فوري وشروحات</div>
              </div>
            </button>

            <button data-tab="dashboard" class="mobile-nav-btn flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
              this.currentTab === 'dashboard'
                ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }">
              <span class="text-xl">📊</span>
              <div>
                <div class="font-bold text-slate-900">لوحة التقدم وتنافس الطلاب</div>
                <div class="text-[10px] text-slate-500 font-normal">المتصدرين، الأوسمة، والتوصيات الذكية</div>
              </div>
            </button>
          </div>
        </div>
      `
          : ''
      }
    `;

    // Attach listeners
    this.element.querySelectorAll('.tab-btn, .mobile-nav-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.tab as ActiveTab;
        if (target) {
          this.isMobileMenuOpen = false;
          this.onTabChange(target);
        }
      });
    });

    this.element.querySelector('#btn-mobile-menu-toggle')?.addEventListener('click', () => {
      this.toggleMobileMenu();
    });

    this.element.querySelector('#brand-logo')?.addEventListener('click', () => {
      this.isMobileMenuOpen = false;
      this.onTabChange('lessons');
    });

    this.element.querySelector('#btn-open-dashboard')?.addEventListener('click', () => {
      this.isMobileMenuOpen = false;
      this.onTabChange('dashboard');
    });

    // Google Auth Desktop & Mobile
    const handleGoogleLogin = async () => {
      try {
        await StorageService.signInWithGoogle();
      } catch (err) {
        alert('تعذر تسجيل الدخول بـ Google حالياً، يمكنك الاستمرار كضيف وحفظ تقدمك محلياً.');
      }
    };

    const handleLogout = async () => {
      if (confirm('هل ترغب بتسجيل الخروج؟')) {
        await StorageService.logout();
      }
    };

    this.element.querySelector('#btn-login-google')?.addEventListener('click', handleGoogleLogin);
    this.element.querySelector('#btn-mobile-login-google')?.addEventListener('click', handleGoogleLogin);

    this.element.querySelector('#btn-logout')?.addEventListener('click', handleLogout);
    this.element.querySelector('#btn-mobile-logout')?.addEventListener('click', handleLogout);
  }
}
