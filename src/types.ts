// Types definition for Yemen Grade 11 Chemistry 3D Platform

export type UnitId = 7 | 8;

export type InteractiveType =
  | 'kinetics'
  | 'collision_theory'
  | 'activation_energy'
  | 'equilibrium'
  | 'le_chatelier'
  | 'electrolytes'
  | 'acid_base'
  | 'ph_scale'
  | 'buffer_solution'
  | 'titration_lab';

export interface DefinitionItem {
  term: string;
  definition: string;
  example?: string;
  chemicalFormula?: string;
}

export interface LessonContent {
  id: string; // e.g. "7.1", "7.2", etc.
  unitId: UnitId;
  unitTitle: string;
  title: string;
  subtitle: string;
  readingTimeMin: number;
  introduction: string;
  definitions: DefinitionItem[];
  keyLaws: {
    name: string;
    formula: string;
    description: string;
    variables: { symbol: string; meaning: string; unit?: string }[];
  }[];
  practicalExamples: {
    title: string;
    problem: string;
    solution: string;
  }[];
  summaryPoints: string[];
  relatedSimulation: InteractiveType;
}

export type IndicatorType = 'phenolphthalein' | 'methyl_orange' | 'bromothymol_blue';

export interface TitrationExperimentConfig {
  analyteName: string;
  analyteFormula: string;
  analyteType: 'acid' | 'base';
  analyteVolumeMl: number;
  analyteMolarity: number; // Known to engine, student calculates or discovers it
  titrantName: string;
  titrantFormula: string;
  titrantMolarity: number;
  idealIndicator: IndicatorType;
  equivalencePointMl: number;
}

export interface TitrationDataPoint {
  volumeAddedMl: number;
  ph: number;
  colorHex: string;
}

export interface StudentProfile {
  uid: string;
  displayName: string;
  email: string;
  isGuest: boolean;
  totalPoints: number;
  level: number;
  completedLessons: string[];
  completedQuizzes: string[];
  achievements: string[];
  mistakeLog: Record<string, number>;
  experimentsCount: number;
  updatedAt: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  unlocked: boolean;
}

export type QuizQuestionType =
  | 'mcq'
  | 'calculation'
  | 'le_chatelier_prediction'
  | 'equation_balancing';

export interface QuizQuestion {
  id: string;
  unitId: UnitId;
  lessonId: string;
  type: QuizQuestionType;
  questionText: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  formulaSteps?: string[];
  // For equation balancing
  equationParts?: {
    reactants: { formula: string; defaultCoeff?: number; correctCoeff: number }[];
    products: { formula: string; defaultCoeff?: number; correctCoeff: number }[];
  };
  // For simulation prediction
  simulationContext?: {
    system: string;
    disturbance: string;
    reactionEquation: string;
  };
}
