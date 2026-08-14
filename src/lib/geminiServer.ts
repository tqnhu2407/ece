import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_CONTEXT_SOURCES, INITIAL_DECISIONS } from '../data/mockData';
import { ContextSource, ReasoningResult, TimelineStep } from '../types';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return genAIClient;
}

export async function reconstructReasoning(
  question: string,
  extraContextSources: ContextSource[] = []
): Promise<ReasoningResult> {
  const allSources = [...INITIAL_CONTEXT_SOURCES, ...extraContextSources];
  const allDecisions = INITIAL_DECISIONS;

  // Formulate prompt context string
  const contextString = `
Team Engineering Context Database:

Decisions:
${JSON.stringify(allDecisions, null, 2)}

Context Sources (Google Calendar, Google Docs, GitHub PRs, Incident Reports):
${JSON.stringify(allSources, null, 2)}
`;

  const ai = getGenAI();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `
You are the Engineering Context Engine (ECE).
Your core mission is to reconstruct the underlying reasoning behind engineering team decisions and changes, preserving team context and preventing context decay.

User Question: "${question}"

Analyze the provided engineering context (Calendar meetings, Docs review notes/ADRs, GitHub PRs, Incident reports).
Synthesize a direct concise AI answer, step-by-step reasoning timeline, evidence sources used, and a Evidence Strength (High, Medium, or Low) with rationale.

Context:
${contextString}
`,
        config: {
          systemInstruction: 'Reconstruct engineering decision reasoning accurately with exact chronological timeline steps and explicit evidence sources.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING, description: 'Direct 1-2 sentence explanation of why the decision or change occurred' },
              confidence: { type: Type.STRING, description: 'High, Medium, or Low' },
              confidenceReason: { type: Type.STRING, description: 'Short justification for confidence rating' },
              relatedDecisionId: { type: Type.STRING, description: 'Matching decision ID if applicable (e.g., dec-01)' },
              reasoningTimeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, description: 'incident, investigation, review, decision, or implementation' },
                    sourceId: { type: Type.STRING }
                  },
                  required: ['date', 'title', 'description', 'type']
                }
              },
              evidenceSourceIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['question', 'answer', 'confidence', 'confidenceReason', 'reasoningTimeline', 'evidenceSourceIds']
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        
        // Resolve evidence sources by IDs
        const evidenceMap = new Map(allSources.map(s => [s.id, s]));
        const evidence: ContextSource[] = (parsed.evidenceSourceIds || [])
          .map((id: string) => evidenceMap.get(id))
          .filter((s: ContextSource | undefined): s is ContextSource => s !== undefined);

        // If evidence array turned out empty, fallback to matched sources
        const finalEvidence = evidence.length > 0 ? evidence : allSources.slice(0, 3);

        return {
          question: parsed.question || question,
          answer: parsed.answer,
          confidence: (['High', 'Medium', 'Low'].includes(parsed.confidence) ? parsed.confidence : 'High') as 'High' | 'Medium' | 'Low',
          confidenceReason: parsed.confidenceReason || 'Reasoning reconstructed from multiple linked primary engineering artifacts.',
          reasoningTimeline: (parsed.reasoningTimeline || []) as TimelineStep[],
          evidence: finalEvidence,
          relatedDecisionId: parsed.relatedDecisionId
        };
      }
    } catch (err) {
      console.warn('Gemini API query error, utilizing deterministic contextual reasoning engine:', err);
    }
  }

  // Deterministic contextual reasoning fallback matching exact query terms
  return fallbackReasoningEngine(question, allSources, allDecisions);
}

function fallbackReasoningEngine(
  question: string,
  sources: ContextSource[],
  decisions: typeof INITIAL_DECISIONS
): ReasoningResult {
  const qLower = question.toLowerCase();

  if (qLower.includes('redis') || qLower.includes('payment') || qLower.includes('cache')) {
    const dec = decisions.find(d => d.id === 'dec-01') || decisions[0];
    return {
      question,
      answer: 'Redis was removed from the Payment Service after the team observed increasing production latency (Incident #42) and concluded that the additional infrastructure complexity was no longer justified for the service\'s stateless workload.',
      confidence: 'High',
      confidenceReason: 'Supported by 4 primary artifacts including production incident log, architecture notes, and merged PR #251.',
      reasoningTimeline: dec.timeline,
      evidence: dec.evidence,
      relatedDecisionId: 'dec-01'
    };
  }

  if (qLower.includes('highlight') || qLower.includes('pipeline') || qLower.includes('false positive')) {
    const dec = decisions.find(d => d.id === 'dec-02') || decisions[1];
    return {
      question,
      answer: 'The highlight pipeline was updated to an asynchronous batch mode using Gemini 3.6 Flash structured schema filtering to reduce a 28% false positive rate down to 4.2%.',
      confidence: 'High',
      confidenceReason: 'Verified against ADR-014 and merged GitHub PR #310.',
      reasoningTimeline: dec.timeline,
      evidence: dec.evidence,
      relatedDecisionId: 'dec-02'
    };
  }

  if (qLower.includes('gemini') || qLower.includes('classification') || qLower.includes('model')) {
    const dec = decisions.find(d => d.id === 'dec-03') || decisions[2];
    return {
      question,
      answer: 'The team standardized on Gemini 3.6 Flash across internal classification services to ensure sub-second latency, eliminate SDK fragmentation, and guarantee server-side schema adherence.',
      confidence: 'High',
      confidenceReason: 'Reconstructed from workshop meeting notes and SDK migration commit #402.',
      reasoningTimeline: dec.timeline,
      evidence: dec.evidence,
      relatedDecisionId: 'dec-03'
    };
  }

  if (qLower.includes('grpc') || qLower.includes('api') || qLower.includes('rest')) {
    const dec = decisions.find(d => d.id === 'dec-04') || decisions[3];
    return {
      question,
      answer: 'The team decided to migrate internal microservices to gRPC to eliminate HTTP JSON serialization overhead which consumed 22% of service CPU bandwidth.',
      confidence: 'Medium',
      confidenceReason: 'RFC published and approved; implementation PR pending.',
      reasoningTimeline: dec.timeline,
      evidence: dec.evidence,
      relatedDecisionId: 'dec-04'
    };
  }

  // Generic matching fallback
  return {
    question,
    answer: `Based on team memory, recent engineering discussions centered around payment infrastructure optimizations, Gemini AI model strategy standardization, and microservice RPC transitions.`,
    confidence: 'Medium',
    confidenceReason: 'Matched general weekly engineering context updates across team meetings and documentation.',
    reasoningTimeline: [
      {
        date: 'May 20, 2026',
        title: 'Production Incident #42',
        description: 'Initiated payment service performance investigation.',
        type: 'incident'
      },
      {
        date: 'May 24, 2026',
        title: 'Architecture Review',
        description: 'Evaluated system bottlenecks and infrastructure design.',
        type: 'review'
      },
      {
        date: 'May 23, 2026',
        title: 'Gemini Strategy Sync',
        description: 'Standardized AI capabilities across internal services.',
        type: 'decision'
      }
    ],
    evidence: sources.slice(0, 3)
  };
}
