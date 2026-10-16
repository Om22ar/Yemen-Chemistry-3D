import { StorageService } from '../services/firebase';
import { ACHIEVEMENTS_LIST, CURRICULUM_LESSONS, SAMPLE_LEADERBOARD } from '../data/curriculumData';
import type { StudentProfile, LeaderboardStudent, RecommendationItem } from '../types';

export class DashboardView {
  private element: HTMLElement;
  private profile: StudentProfile;
  private onNavigateToLesson: (lessonId: string) => void;
  private leaderboardFilter: 'all' | 'unit5' | 'unit6' | 'unit7' | 'unit8' = 'all';

  constructor(container: HTMLElement, onNavigateToLesson: (lessonId: string) => void) {
    this.element = document.createElement('main');
    this.element.className = 'flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full';
    container.appendChild(this.element);

    this.onNavigateToLesson = onNavigateToLesson;
    this.profile = StorageService.getLocalProfile();

    StorageService.subscribe((p) => {
      this.profile = p;
      this.render();
    });

    this.render();
  }

  private generateRecommendations(): RecommendationItem[] {
    const mistakes = this.profile.mistakeLog || {};
    const recs: RecommendationItem[] = [];

    // Analyze mistakes
    for (const [topic, count] of Object.entries(mistakes)) {
      if (count >= 1) {
        let lessonId = '5.1';
        let lessonTitle = 'الدرس 5.1: مدخل لمجموعة الهالوجينات';
        if (topic.includes('هالوجين') || topic.includes('إزاحة') || topic.includes('فلور')) {
          lessonId = '5.2';
          lessonTitle = 'الدرس 5.2: الخواص وتفاعلات الإزاحة التنافسية للهالوجينات';
        } else if (topic.includes('خامل') || topic.includes('نبيل') || topic.includes('أرجون') || topic.includes('زينون')) {
          lessonId = '6.1';
          lessonTitle = 'الدرس 6.1: الغازات النبيلة وخمولها الكيميائي';
        } else if (topic.includes('موازنة')) {
          lessonId = '7.1';
          lessonTitle = 'الدرس 7.1: المصطلحات وموازنة المعادلات الكيميائية';
        } else if (topic.includes('الهيدروجيني') || topic.includes('pH')) {
          lessonId = '8.3';
          lessonTitle = 'الدرس 8.3: الرقم الهيدروجيني pH وحساباته';
        } else if (topic.includes('لوشاتلييه') || topic.includes('التصادم')) {
          lessonId = '7.5';
          lessonTitle = 'الدرس 7.5: قاعدة لوشاتلييه';
        }

        recs.push({
          type: 'review',
          topic,
          reason: `تم تسجيل ${count} أخطاء في هذا المفهوم خلال التمارين والاختبارات`,
          recommendedLessonId: lessonId,
          recommendedLessonTitle: lessonTitle,
          priority: count >= 3 ? 'high' : 'medium',
        });
      }
    }

    // If student has done great in lessons, suggest advanced challenge
    if (this.profile.completedLessons.length >= 4) {
      recs.push({
        type: 'challenge',
        topic: 'تحدي الاتزان والمعايرة الشامل',
        reason: 'أداؤك متميز في إنجاز الدروس، يمكنك الآن خوض تجربة المعايرة المتقدمة وحساب التراكيز المجهولة بدقة عالية',
        recommendedLessonId: '8.5',
        recommendedLessonTitle: 'الدرس 8.5: المعايرة الكيميائية والتحليل الحجمي',
        priority: 'medium',
      });
    }

    return recs;
  }

  private getFilteredLeaderboard(): LeaderboardStudent[] {
    const currentStudent: LeaderboardStudent = {
      id: this.profile.uid,
      rank: 1, // Will be computed
      name: this.profile.displayName || 'أنت (طالب متميز)',
      class: 'الصف الثاني الثانوي',
      totalPoints: this.profile.totalPoints,
      unit5Points: Math.round(this.profile.totalPoints * 0.25),
      unit6Points: Math.round(this.profile.totalPoints * 0.25),
      unit7Points: Math.round(this.profile.totalPoints * 0.25),
      unit8Points: Math.round(this.profile.totalPoints * 0.25),
      isCurrentUser: true,
    };

    // Combine sample students with current student
    const all: LeaderboardStudent[] = [
      ...SAMPLE_LEADERBOARD.map((s) => ({ ...s, isCurrentUser: false })),
      currentStudent,
    ];

    // Sort by filter
    if (this.leaderboardFilter === 'unit5') {
      all.sort((a, b) => (b.unit5Points ?? 0) - (a.unit5Points ?? 0));
    } else if (this.leaderboardFilter === 'unit6') {
      all.sort((a, b) => (b.unit6Points ?? 0) - (a.unit6Points ?? 0));
    } else if (this.leaderboardFilter === 'unit7') {
      all.sort((a, b) => b.unit7Points - a.unit7Points);
    } else if (this.leaderboardFilter === 'unit8') {
      all.sort((a, b) => b.unit8Points - a.unit8Points);
    } else {
      all.sort((a, b) => b.totalPoints - a.totalPoints);
    }

    // Assign rank and medals
    return all.map((item, index) => {
      const rank = index + 1;
      let medal = '';
      if (rank === 1) medal = '🥇';
      else if (rank === 2) medal = '🥈';
      else if (rank === 3) medal = '🥉';
      return { ...item, rank, medal };
    });
  }

  private render() {
    const unit5Total = CURRICULUM_LESSONS.filter((l) => l.unitId === 5).length;
    const unit6Total = CURRICULUM_LESSONS.filter((l) => l.unitId === 6).length;
    const unit7Total = CURRICULUM_LESSONS.filter((l) => l.unitId === 7).length;
    const unit8Total = CURRICULUM_LESSONS.filter((l) => l.unitId === 8).length;

    const unit5Done = CURRICULUM_LESSONS.filter(
      (l) => l.unitId === 5 && this.profile.completedLessons.includes(l.id)
    ).length;
    const unit6Done = CURRICULUM_LESSONS.filter(
      (l) => l.unitId === 6 && this.profile.completedLessons.includes(l.id)
    ).length;
    const unit7Done = CURRICULUM_LESSONS.filter(
      (l) => l.unitId === 7 && this.profile.completedLessons.includes(l.id)
    ).length;
    const unit8Done = CURRICULUM_LESSONS.filter(
      (l) => l.unitId === 8 && this.profile.completedLessons.includes(l.id)
    ).length;

    const unit5Pct = unit5Total ? Math.round((unit5Done / unit5Total) * 100) : 0;
    const unit6Pct = unit6Total ? Math.round((unit6Done / unit6Total) * 100) : 0;
    const unit7Pct = unit7Total ? Math.round((unit7Done / unit7Total) * 100) : 0;
    const unit8Pct = unit8Total ? Math.round((unit8Done / unit8Total) * 100) : 0;

    const recommendations = this.generateRecommendations();
    const leaderboard = this.getFilteredLeaderboard();

    this.element.innerHTML = `
      <div class="space-y-7">
        <!-- Hero Profile Banner -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-sm relative overflow-hidden">
          <div class="relative z-10 flex flex-wrap items-center justify-between gap-5">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-3xl font-bold shadow-md">
                🎓
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-bold">${this.profile.displayName}</h1>
                  <span class="text-xs bg-white/20 text-sky-200 px-2.5 py-0.5 rounded-lg font-semibold">
                    ${this.profile.isGuest ? 'وضع الضيف' : 'حساب سحابي متزامن (Firebase)'}
                  </span>
                </div>
                <p class="text-slate-300 text-xs sm:text-sm mt-1">
                  طالب كيمياء الصف الثاني الثانوي العلمي · الجمهورية اليمنية
                </p>
              </div>
            </div>

            <!-- Level & Points Badges -->
            <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 flex items-center gap-5">
              <div class="text-center">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">المستوى الحالي</div>
                <div class="text-xl font-bold text-amber-400 font-mono">مستوى ${this.profile.level}</div>
              </div>
              <div class="w-px h-8 bg-white/20"></div>
              <div class="text-center">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">النقاط الكلية (XP)</div>
                <div class="text-xl font-bold text-sky-400 font-mono">${this.profile.totalPoints}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Units Completion Cards (All 4 Units) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Unit 5: الهالوجينات -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 truncate">
                <span>🧂</span>
                <span class="truncate">الوحدة 5: الهالوجينات</span>
              </div>
              <span class="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 shrink-0">
                ${unit5Done} من ${unit5Total}
              </span>
            </div>
            <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div class="bg-amber-500 h-full rounded-full transition-all duration-500" style="width: ${unit5Pct}%"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>نسبة الإنجاز:</span>
              <span class="font-bold text-slate-800 font-mono">${unit5Pct}%</span>
            </div>
          </div>

          <!-- Unit 6: الغازات الخاملة -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 truncate">
                <span>💡</span>
                <span class="truncate">الوحدة 6: الغازات النبيلة</span>
              </div>
              <span class="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60 shrink-0">
                ${unit6Done} من ${unit6Total}
              </span>
            </div>
            <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div class="bg-indigo-600 h-full rounded-full transition-all duration-500" style="width: ${unit6Pct}%"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>نسبة الإنجاز:</span>
              <span class="font-bold text-slate-800 font-mono">${unit6Pct}%</span>
            </div>
          </div>

          <!-- Unit 7: سرعة التفاعلات والاتزان -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 truncate">
                <span>📚</span>
                <span class="truncate">الوحدة 7: سرعة التفاعلات</span>
              </div>
              <span class="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 shrink-0">
                ${unit7Done} من ${unit7Total}
              </span>
            </div>
            <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div class="bg-sky-600 h-full rounded-full transition-all duration-500" style="width: ${unit7Pct}%"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>نسبة الإنجاز:</span>
              <span class="font-bold text-slate-800 font-mono">${unit7Pct}%</span>
            </div>
          </div>

          <!-- Unit 8: الاتزان الأيوني -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 truncate">
                <span>🧪</span>
                <span class="truncate">الوحدة 8: الاتزان الأيوني</span>
              </div>
              <span class="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 shrink-0">
                ${unit8Done} من ${unit8Total}
              </span>
            </div>
            <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div class="bg-emerald-600 h-full rounded-full transition-all duration-500" style="width: ${unit8Pct}%"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>نسبة الإنجاز:</span>
              <span class="font-bold text-slate-800 font-mono">${unit8Pct}%</span>
            </div>
          </div>
        </div>

        <!-- Competitive Student Leaderboard -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🏆</span>
                <span>لوحة المتصدرين وتنافس الطلاب (Leaderboard)</span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">
                تصنيف طلاب الصف الثاني الثانوي حسب النقاط وإنجاز التجارب المعملية
              </p>
            </div>

            <!-- Leaderboard Filter Tabs -->
            <div class="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button data-lb-filter="all" class="lb-filter-btn px-2.5 py-1.5 rounded-lg transition-all ${
                this.leaderboardFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }">
                الترتيب العام
              </button>
              <button data-lb-filter="unit5" class="lb-filter-btn px-2.5 py-1.5 rounded-lg transition-all ${
                this.leaderboardFilter === 'unit5' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }">
                الوحدة 5
              </button>
              <button data-lb-filter="unit6" class="lb-filter-btn px-2.5 py-1.5 rounded-lg transition-all ${
                this.leaderboardFilter === 'unit6' ? 'bg-white text-indigo-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }">
                الوحدة 6
              </button>
              <button data-lb-filter="unit7" class="lb-filter-btn px-2.5 py-1.5 rounded-lg transition-all ${
                this.leaderboardFilter === 'unit7' ? 'bg-white text-sky-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }">
                الوحدة 7
              </button>
              <button data-lb-filter="unit8" class="lb-filter-btn px-2.5 py-1.5 rounded-lg transition-all ${
                this.leaderboardFilter === 'unit8' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }">
                الوحدة 8
              </button>
            </div>
          </div>

          <!-- Leaderboard Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-right border-collapse">
              <thead>
                <tr class="border-b border-slate-200 text-slate-400 font-medium">
                  <th class="py-2.5 px-3 text-center">الترتيب</th>
                  <th class="py-2.5 px-3">اسم الطالب</th>
                  <th class="py-2.5 px-3 hidden sm:table-cell">الشعبة</th>
                  <th class="py-2.5 px-3 text-left">النقاط</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${leaderboard
                  .map((st) => {
                    const isYou = st.isCurrentUser;
                    const points =
                      this.leaderboardFilter === 'unit5'
                        ? (st.unit5Points ?? 0)
                        : this.leaderboardFilter === 'unit6'
                        ? (st.unit6Points ?? 0)
                        : this.leaderboardFilter === 'unit7'
                        ? st.unit7Points
                        : this.leaderboardFilter === 'unit8'
                        ? st.unit8Points
                        : st.totalPoints;

                    return `
                    <tr class="transition-colors ${isYou ? 'bg-sky-50/80 font-bold text-sky-950' : 'hover:bg-slate-50/80 text-slate-800'}">
                      <td class="py-3 px-3 text-center font-mono font-bold">
                        ${st.medal ? `<span class="text-base">${st.medal}</span>` : `#${st.rank}`}
                      </td>
                      <td class="py-3 px-3">
                        <div class="flex items-center gap-2">
                          <span>${st.name}</span>
                          ${isYou ? '<span class="text-[10px] bg-sky-200 text-sky-900 px-1.5 py-0.5 rounded font-bold">أنت</span>' : ''}
                        </div>
                      </td>
                      <td class="py-3 px-3 text-slate-500 hidden sm:table-cell">${st.class}</td>
                      <td class="py-3 px-3 text-left font-mono font-bold ${isYou ? 'text-sky-800' : 'text-slate-900'}">
                        ${points} XP
                      </td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Full 10 Achievements & Badges Gallery -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🎖️</span>
                <span>سجل الأوسمة والشارات الشامل (10 أوسمة)</span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">
                افتح الشارات العلمية من خلال تجميع النقاط، دقة المعايرة، والتفوق في الاختبارات
              </p>
            </div>
            <span class="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              ${ACHIEVEMENTS_LIST.filter((a) => this.isBadgeUnlocked(a)).length} من 10 شارات
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            ${ACHIEVEMENTS_LIST.map((ach) => {
              const isUnlocked = this.isBadgeUnlocked(ach);
              return `
                <div class="p-3.5 rounded-2xl border transition-all flex flex-col items-center text-center gap-2 ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-amber-50 to-white border-amber-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 opacity-55'
                }">
                  <div class="text-3xl p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs ${
                    isUnlocked ? 'scale-105' : 'grayscale'
                  }">
                    ${ach.icon}
                  </div>
                  <div>
                    <div class="font-bold text-xs text-slate-900 flex items-center justify-center gap-1">
                      <span>${ach.title}</span>
                      ${isUnlocked ? '<span class="text-emerald-600 text-xs">✓</span>' : ''}
                    </div>
                    <div class="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">${ach.description}</div>
                    <div class="text-[9px] font-mono font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                      ${ach.conditionDescription}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Adaptive Learning & Personalized Recommendations -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🧠</span>
                <span>المسار التعليمي التكيفي والتوصيات الذكية</span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">
                توصيات مخصصة مبنية على تحليل أدائك في الاختبارات المعملية والنظرية
              </p>
            </div>
          </div>

          ${
            recommendations.length === 0
              ? `
            <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-center gap-3">
              <span class="text-2xl">🌟</span>
              <span>سجل ناصع وأداء أكاديمي متفوق! واصل استكشاف محاكاة التصادم ومعمل المعايرة لخوض أعلى مستويات التحدي.</span>
            </div>
          `
              : `
            <div class="space-y-3">
              ${recommendations
                .map((rec) => `
                <div class="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  rec.priority === 'high'
                    ? 'bg-rose-50/60 border-rose-200'
                    : rec.type === 'challenge'
                    ? 'bg-indigo-50/60 border-indigo-200'
                    : 'bg-slate-50 border-slate-200'
                }">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold ${
                        rec.priority === 'high' ? 'text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md' : 'text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md'
                      }">
                        ${rec.type === 'challenge' ? '💡 تحدي تفوق' : '⚠️ مراجعة موصى بها'}
                      </span>
                      <span class="font-bold text-xs text-slate-900">${rec.topic}</span>
                    </div>
                    <div class="text-xs text-slate-600">${rec.reason}</div>
                    <div class="text-[11px] text-slate-500 font-medium">الدرس المقترح: <strong class="text-sky-800">${rec.recommendedLessonTitle}</strong></div>
                  </div>

                  <button data-goto-rec="${rec.recommendedLessonId}" class="btn-rec-action bg-white hover:bg-sky-50 text-sky-800 border border-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0 shadow-2xs">
                    فتح الدرس المقترح ←
                  </button>
                </div>
              `).join('')}
            </div>
          `
          }
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private isBadgeUnlocked(badge: any): boolean {
    const pts = this.profile.totalPoints;
    if (badge.id === 'chemistry_beginner') return pts >= 100;
    if (badge.id === 'chemistry_expert') return pts >= 500;
    if (badge.id === 'chemistry_genius') return pts >= 1000;
    if (badge.id === 'halogens_master') return this.profile.completedLessons.filter((id) => id.startsWith('5.')).length >= 3;
    if (badge.id === 'noble_gas_genius') return this.profile.completedLessons.filter((id) => id.startsWith('6.')).length >= 3;
    if (badge.id === 'equilibrium_master') return this.profile.completedLessons.filter((id) => id.startsWith('7.')).length >= 5;
    if (badge.id === 'ionic_expert') return this.profile.completedLessons.filter((id) => id.startsWith('8.')).length >= 5;
    if (badge.id === 'perfect_score') return pts >= 300;
    if (badge.id === 'titration_master') return pts >= 400;
    if (badge.id === 'speed_demon') return pts >= 200;
    if (badge.id === 'consistency_king') return pts >= 600;
    if (badge.id === 'perfect_week') return pts >= 800;
    return false;
  }

  private bindEvents() {
    // Leaderboard filter toggles
    this.element.querySelectorAll('.lb-filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const filter = (e.currentTarget as HTMLElement).dataset.lbFilter as any;
        if (filter) {
          this.leaderboardFilter = filter;
          this.render();
        }
      });
    });

    // Jump to recommended lessons
    this.element.querySelectorAll('.btn-rec-action').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.gotoRec;
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
