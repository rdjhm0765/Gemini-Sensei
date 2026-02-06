
export type ReasoningMode = 'EXAM' | 'COACH' | 'COGNITIVE';

export interface ThinkingReplay {
  header: string;
  moments: string[];
  additionalNote?: string;
  cognitiveInsight?: string;
}

export interface StepByStepLogic {
  steps: string[];
  incorrectStepIndex: number;
  criticalDeviationType?: string;
}

export interface VideoRecommendation {
  title: string;
  explanation: string;
  link: string;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface BoundingBox {
  box_2d: number[]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  label: string;
}

export interface SenseiAnalysis {
  id: string;
  timestamp: number;
  mode: ReasoningMode;
  stepByStepLogic: StepByStepLogic;
  correctSolution: string;
  finalAnswer: string;
  examTrapAlert?: string;
  thinkingReplay: ThinkingReplay;
  shortcutMethod?: string;
  cognitiveInsights?: string[];
  videoRecommendation?: VideoRecommendation;
  modeSummaryFooter: string;
  groundingSources?: GroundingSource[];
  errorBoundingBox?: BoundingBox;
}

export interface CognitiveProfile {
  totalSessions: number;
  topErrorTypes: Record<string, number>;
  strengths: string[];
  growthAdvice: string;
}
