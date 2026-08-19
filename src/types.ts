export type ContextType = 'calendar' | 'doc' | 'github' | 'incident';

export interface ContextSource {
  id: string;
  type: ContextType;
  title: string;
  date: string;
  authorOrHost?: string;
  summary: string;
  details?: string;
  url?: string;
  metadata?: Record<string, string>;
}

export interface TimelineStep {
  date: string;
  title: string;
  description: string;
  type: 'incident' | 'investigation' | 'review' | 'decision' | 'implementation' | 'update';
  sourceId?: string;
}

export interface DecisionItem {
  id: string;
  title: string;
  category: 'Architecture' | 'Infrastructure' | 'AI / ML' | 'Data Pipeline' | 'API' | 'Product';
  date: string;
  author: string;
  status: 'Implemented' | 'Awaiting Implementation' | 'Under Review' | 'Deprecated';
  summary: string;
  why: string;
  timeline: TimelineStep[];
  evidence: ContextSource[];
  tags: string[];
}

export interface MorningBriefData {
  user: {
    name: string;
    avatarUrl?: string;
    team: string;
  };
  period: string;
  stats: {
    importantDecisions: number;
    architectureChanges: number;
    meetings: number;
    needsAttention: number;
  };
  summaryText: string;
  supportingSourcesCount?: number;
  changes: Array<{
    id: string;
    title: string;
    category: string;
    impact: 'High' | 'Medium' | 'Low';
    decisionId?: string;
    askQuestion?: string;
  }>;
  suggestedQuestions: string[];
}

export interface ReasoningResult {
  question: string;
  answer: string;
  confidence: 'High' | 'Medium' | 'Low';
  confidenceReason: string;
  reasoningTimeline: TimelineStep[];
  evidence: ContextSource[];
  relatedDecisionId?: string;
}
