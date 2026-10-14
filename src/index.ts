import './index.css';
import { HeaderComponent, type ActiveTab } from './components/Header';
import { CurriculumSidebar } from './components/CurriculumSidebar';
import { LessonViewer } from './components/LessonViewer';
import { KineticsView } from './components/KineticsView';
import { TitrationView } from './components/TitrationView';
import { QuizView } from './components/QuizView';
import { DashboardView } from './components/DashboardView';
import { ChemistryCalculatorView } from './components/ChemistryCalculatorView';
import { FloatingCalcModal } from './components/FloatingCalcModal';
import { CURRICULUM_LESSONS } from './data/curriculumData';
import { StorageService } from './services/firebase';
import type { LessonContent } from './types';

class YemenChemistryApp {
  private root: HTMLElement;
  private header: HeaderComponent;
  private currentTab: ActiveTab = 'lessons';
  private currentLesson: LessonContent = CURRICULUM_LESSONS[0];

  // Active sub-views
  private mainContainer: HTMLElement;
  private activeViewDisposer: (() => void) | null = null;
  private sidebar: CurriculumSidebar | null = null;
  private lessonViewer: LessonViewer | null = null;
  private floatingCalc: FloatingCalcModal;

  constructor() {
    const rootEl = document.getElementById('root');
    if (!rootEl) {
      throw new Error('Root container not found in DOM');
    }
    this.root = rootEl;
    this.root.innerHTML = '';

    // Initialize user profile
    StorageService.getLocalProfile();

    // Build Header
    this.header = new HeaderComponent(this.root, this.currentTab, (tab) => {
      this.switchTab(tab);
    });

    // Main Content Host
    this.mainContainer = document.createElement('div');
    this.mainContainer.className = 'flex-1 flex overflow-hidden w-full relative';
    this.root.appendChild(this.mainContainer);

    // Floating Quick Calculator Tool
    this.floatingCalc = new FloatingCalcModal(document.body);
    this.floatingCalc.onOpenFullCalculator(() => {
      this.switchTab('calculator');
    });

    // Initial View
    this.renderCurrentTab();
  }

  public switchTab(tab: ActiveTab) {
    if (this.currentTab === tab) return;
    this.currentTab = tab;
    this.header.setTab(tab);
    this.renderCurrentTab();
  }

  public selectLesson(lesson: LessonContent) {
    this.currentLesson = lesson;
    if (this.currentTab !== 'lessons') {
      this.switchTab('lessons');
    } else {
      this.sidebar?.setLesson(lesson.id);
      this.lessonViewer?.setLesson(lesson);
    }
  }

  private cleanupActiveView() {
    if (this.activeViewDisposer) {
      this.activeViewDisposer();
      this.activeViewDisposer = null;
    }
    this.sidebar = null;
    this.lessonViewer = null;
    this.mainContainer.innerHTML = '';
  }

  private renderCurrentTab() {
    this.cleanupActiveView();

    switch (this.currentTab) {
      case 'lessons':
        this.renderLessonsTab();
        break;
      case 'kinetics':
        this.renderKineticsTab();
        break;
      case 'titration':
        this.renderTitrationTab();
        break;
      case 'calculator':
        this.renderCalculatorTab();
        break;
      case 'quiz':
        this.renderQuizTab();
        break;
      case 'dashboard':
        this.renderDashboardTab();
        break;
    }
  }

  private renderLessonsTab() {
    // 2-column layout: Sidebar + Lesson Viewer
    this.sidebar = new CurriculumSidebar(
      this.mainContainer,
      this.currentLesson.id,
      (lesson) => {
        this.currentLesson = lesson;
        this.lessonViewer?.setLesson(lesson);
      }
    );

    this.lessonViewer = new LessonViewer(
      this.mainContainer,
      this.currentLesson,
      (simulationType) => {
        if (simulationType === 'titration_lab') {
          this.switchTab('titration');
        } else if (simulationType === 'quiz') {
          this.switchTab('quiz');
        } else {
          this.switchTab('kinetics');
        }
      }
    );
  }

  private renderKineticsTab() {
    const view = new KineticsView(this.mainContainer);
    this.activeViewDisposer = () => view.dispose();
  }

  private renderTitrationTab() {
    const view = new TitrationView(this.mainContainer);
    this.activeViewDisposer = () => view.dispose();
  }

  private renderCalculatorTab() {
    const view = new ChemistryCalculatorView(this.mainContainer);
    this.activeViewDisposer = () => view.dispose();
  }

  private renderQuizTab() {
    const view = new QuizView(this.mainContainer);
    this.activeViewDisposer = () => view.dispose();
  }

  private renderDashboardTab() {
    const view = new DashboardView(this.mainContainer, (lessonId) => {
      const lesson = CURRICULUM_LESSONS.find((l) => l.id === lessonId);
      if (lesson) {
        this.selectLesson(lesson);
      }
    });
    this.activeViewDisposer = () => view.dispose();
  }
}

// Mount application once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new YemenChemistryApp();
});
