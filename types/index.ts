// types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface RoadmapForm {
  title?: string; // roadmap title
  description?: string;
  level: string;
  languages: string[];
  field: string;
  frameworks: string[];
  hours: number;
  goal: string;
  focus: string;
}

export interface PhaseProject {
  name: string;
  description: string;
}

export interface Phase {
  number: number;
  name: string;
  duration: string;
  goal: string;
  topics: string[];
  tools: string[];
  resources: string[];
  exercises: string[];
  checklist: string[];
  project: PhaseProject;
  milestone: string;
}

export interface Roadmap {
  id: string;
  title: string;
  summary: string;
  totalMonths: number;
  weeklyHours: number;
  phases: Phase[];
  form: RoadmapForm;
  createdAt: number;
}

export interface PhaseProgress {
  [taskIndex: number]: boolean;
}

export interface Progress {
  roadmapId: string;
  currentPhase: number;
  completedPhases: number[];
  checks: { [phaseIndex: number]: PhaseProgress };
}
