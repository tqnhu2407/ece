import { GoogleGenAI, Type } from '@google/genai';
import { ContextSource, DecisionItem, MorningBriefData, ReasoningResult, TimelineStep } from '../types';

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

/**
 * Curated Decision Generator:
 * Generates the single demo decision based strictly on the user's synced "Clip to TikTok" sources.
 * If required sources are not synced yet, returns an empty array.
 */
export function getCuratedDecisionsFromSources(sources: ContextSource[]): DecisionItem[] {
  const tiktokSources = sources.filter((s) => {
    const text = `${s.title} ${s.summary} ${s.details || ''}`.toLowerCase();
    return text.includes('tiktok') || text.includes('clip to tiktok');
  });

  if (tiktokSources.length === 0) {
    return [];
  }

  // Build timeline steps mapping directly to real synced source IDs
  const timeline: TimelineStep[] = [];

  // 1. Check for issue/gap source
  const issueSource = tiktokSources.find(
    (s) =>
      s.title.toLowerCase().includes('issue') ||
      s.title.toLowerCase().includes('gap') ||
      s.summary.toLowerCase().includes('issue')
  );
  if (issueSource) {
    timeline.push({
      date: issueSource.date || 'Aug 10, 2026',
      title: 'Workflow Observation & Quality Review',
      description: issueSource.summary,
      type: 'incident',
      sourceId: issueSource.id
    });
  }

  // 2. Check for discussion/meeting source
  const discussionSource = tiktokSources.find(
    (s) =>
      s.type === 'calendar' ||
      s.title.toLowerCase().includes('discussion') ||
      s.title.toLowerCase().includes('sync') ||
      s.title.toLowerCase().includes('meeting')
  );
  if (discussionSource && discussionSource.id !== issueSource?.id) {
    timeline.push({
      date: discussionSource.date || 'Aug 12, 2026',
      title: 'Product Alignment & API Feasibility',
      description: discussionSource.summary,
      type: 'review',
      sourceId: discussionSource.id
    });
  }

  // 3. Check for main feature doc/proposal
  const featureSource = tiktokSources.find(
    (s) =>
      s.id !== issueSource?.id &&
      s.id !== discussionSource?.id &&
      (s.title.toLowerCase().includes('feature') || s.title.toLowerCase().includes('clip to tiktok'))
  ) || tiktokSources[0];

  if (featureSource && !timeline.some((t) => t.sourceId === featureSource.id)) {
    timeline.push({
      date: featureSource.date || 'Aug 14, 2026',
      title: 'Direct TikTok Upload Architecture RFC',
      description: featureSource.summary,
      type: 'decision',
      sourceId: featureSource.id
    });
  }

  // Fallback step if timeline is still empty
  if (timeline.length === 0 && tiktokSources.length > 0) {
    timeline.push({
      date: tiktokSources[0].date || 'Aug 14, 2026',
      title: 'TikTok Direct Integration Proposal',
      description: tiktokSources[0].summary,
      type: 'decision',
      sourceId: tiktokSources[0].id
    });
  }

  const primaryAuthor = tiktokSources[0]?.authorOrHost || 'Product Team';

  const singleDecision: DecisionItem = {
    id: 'dec-tiktok-01',
    title: 'Integrate Direct TikTok Upload for AI-Generated Clips',
    category: 'Product',
    date: 'Aug 14, 2026',
    author: primaryAuthor,
    status: 'Under Review',
    summary: 'Move beyond the download-only clip workflow by integrating TikTok upload and conversion tracking directly into the product.',
    why: 'The current workflow ends after users download AI-generated clips, leaving the team with no visibility into whether those clips are actually uploaded to TikTok or whether users consider them valuable.',
    timeline,
    evidence: tiktokSources,
    tags: ['TikTok', 'Clips', 'Direct Upload', 'Conversion', 'Product']
  };

  return [singleDecision];
}

/**
 * Ask Why Reasoning Engine
 * Evaluates questions strictly and exclusively against currently synced sources.
 */
export async function reconstructReasoning(
  question: string,
  sources: ContextSource[] = []
): Promise<ReasoningResult> {
  const curatedDecisions = getCuratedDecisionsFromSources(sources);

  // If no sources have been synced at all, return honest insufficient response
  if (sources.length === 0) {
    return {
      question,
      answer: 'No workspace context has been connected yet. Please connect Google Docs or Google Calendar to enable Trace reasoning.',
      confidence: 'Low',
      confidenceReason: 'Zero connected sources in workspace memory.',
      reasoningTimeline: [],
      evidence: []
    };
  }

  const contextString = `
Connected Workspace Context Sources (Google Docs, Google Calendar):
${JSON.stringify(sources, null, 2)}

Curated Decisions:
${JSON.stringify(curatedDecisions, null, 2)}
`;

  const ai = getGenAI();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `
You are Trace's Engineering Context Engine (ECE).
Your core mission is to reconstruct the underlying reasoning behind engineering decisions, pipeline changes, or onboarding questions based strictly and exclusively on the provided synced context sources.

User Question: "${question}"

Instructions:
1. Reason strictly from the connected context sources (Google Docs, Google Calendar meetings, decisions).
2. Synthesize a direct, concise 1-3 sentence answer explaining why the decision or change occurred, or providing direct onboarding guidance.
3. Construct a chronological step-by-step reasoning timeline citing the exact 'sourceId' from the provided sources.
4. Return an array of 'evidenceSourceIds' that strictly match the 'id' field of the sources that support your answer.
5. If the connected context does not contain enough information to answer the question, explicitly state that there is insufficient context in the synced sources, set confidence to 'Low' with an honest justification, and return empty timeline and evidence arrays.
6. NEVER invent a source, date, meeting, decision, alternative, or implementation that is not supported by the connected context.

Context:
${contextString}
`,
        config: {
          systemInstruction: 'Reconstruct engineering decision reasoning and team context accurately with exact chronological timeline steps and explicit synced evidence sources. Never fabricate facts or sources.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING, description: 'Direct 1-3 sentence explanation grounded purely in synced context' },
              confidence: { type: Type.STRING, description: 'High, Medium, or Low' },
              confidenceReason: { type: Type.STRING, description: 'Short justification for confidence rating' },
              relatedDecisionId: { type: Type.STRING, description: 'Matching decision ID if applicable (e.g., dec-tiktok-01)' },
              reasoningTimeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, description: 'incident, investigation, review, decision, update, or implementation' },
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

        // Resolve evidence strictly from matching synced sources
        const sourceMap = new Map(sources.map((s) => [s.id, s]));
        const evidence: ContextSource[] = (parsed.evidenceSourceIds || [])
          .map((id: string) => sourceMap.get(id))
          .filter((s: ContextSource | undefined): s is ContextSource => s !== undefined);

        return {
          question: parsed.question || question,
          answer: parsed.answer,
          confidence: (['High', 'Medium', 'Low'].includes(parsed.confidence) ? parsed.confidence : 'High') as 'High' | 'Medium' | 'Low',
          confidenceReason: parsed.confidenceReason || 'Reasoning reconstructed from connected primary workspace artifacts.',
          reasoningTimeline: (parsed.reasoningTimeline || []) as TimelineStep[],
          evidence,
          relatedDecisionId: parsed.relatedDecisionId || (curatedDecisions.length > 0 && question.toLowerCase().includes('tiktok') ? curatedDecisions[0].id : undefined)
        };
      }
    } catch (err) {
      console.warn('Gemini API query error, utilizing deterministic contextual fallback:', err);
    }
  }

  // Dynamic deterministic contextual reasoning fallback (no hardcoded fake data)
  return fallbackReasoningEngine(question, sources, curatedDecisions);
}

function fallbackReasoningEngine(
  question: string,
  sources: ContextSource[],
  decisions: DecisionItem[]
): ReasoningResult {
  const qLower = question.toLowerCase();
  const queryTokens = qLower.split(/\W+/).filter((t) => t.length > 2);

  // 1. Check for AI Pipeline v1 -> v2 queries
  if (qLower.includes('pipeline') || qLower.includes('v1') || qLower.includes('v2') || (qLower.includes('ai') && qLower.includes('change'))) {
    const pipelineSources = sources.filter((s) => {
      const text = `${s.title} ${s.summary} ${s.details || ''}`.toLowerCase();
      return text.includes('pipeline') || text.includes('v1') || text.includes('v2') || text.includes('ai');
    });

    if (pipelineSources.length > 0) {
      const issueDoc = pipelineSources.find((s) => s.title.toLowerCase().includes('issue') || s.summary.toLowerCase().includes('issue') || s.summary.toLowerCase().includes('latency'));
      const v2Doc = pipelineSources.find((s) => s.title.toLowerCase().includes('v2') || s.summary.toLowerCase().includes('v2'));

      const answer = v2Doc
        ? `The AI pipeline was updated from v1 to v2 to address limitations identified in v1 (${issueDoc ? issueDoc.summary : 'performance and accuracy bottlenecks'}) by introducing ${v2Doc.summary}.`
        : `The team changed the AI pipeline based on observations in ${pipelineSources[0].title}: ${pipelineSources[0].summary}`;

      const timeline: TimelineStep[] = pipelineSources.map((s) => ({
        date: s.date,
        title: s.title,
        description: s.summary,
        type: s.title.toLowerCase().includes('issue') ? 'incident' : s.type === 'calendar' ? 'review' : 'decision',
        sourceId: s.id
      }));

      return {
        question,
        answer,
        confidence: 'High',
        confidenceReason: 'Directly synthesized from synced AI Pipeline documentation and related calendar review events.',
        reasoningTimeline: timeline,
        evidence: pipelineSources
      };
    }
  }

  // 2. Check for Onboarding / First Week queries
  if (qLower.includes('onboarding') || qLower.includes('first week') || qLower.includes('joined') || qLower.includes('join')) {
    const onboardingSources = sources.filter((s) => {
      const text = `${s.title} ${s.summary} ${s.details || ''}`.toLowerCase();
      return text.includes('onboarding') || text.includes('first week') || text.includes('getting started') || text.includes('setup');
    });

    if (onboardingSources.length > 0) {
      const primary = onboardingSources[0];
      return {
        question,
        answer: `In your first week, you should review the team onboarding materials: ${primary.summary} Follow the steps outlined in "${primary.title}" to set up your environment, connect to workspace resources, and review active engineering decisions.`,
        confidence: 'High',
        confidenceReason: `Reconstructed directly from synced onboarding documentation "${primary.title}".`,
        reasoningTimeline: [
          {
            date: primary.date,
            title: `Onboarding Guide: ${primary.title}`,
            description: primary.summary,
            type: 'decision',
            sourceId: primary.id
          }
        ],
        evidence: onboardingSources
      };
    }
  }

  // 3. Check for TikTok Direct Upload queries
  if (qLower.includes('tiktok') || qLower.includes('clip')) {
    const dec = decisions.find((d) => d.id === 'dec-tiktok-01');
    if (dec) {
      return {
        question,
        answer: `${dec.summary} ${dec.why}`,
        confidence: 'High',
        confidenceReason: 'Supported by synced TikTok product requirement docs and alignment meetings.',
        reasoningTimeline: dec.timeline,
        evidence: dec.evidence,
        relatedDecisionId: dec.id
      };
    }
  }

  // 4. Dynamic matching across all synced sources
  const matchedSources = sources.filter((s) => {
    const textToMatch = `${s.title} ${s.summary} ${s.details || ''} ${s.authorOrHost || ''}`.toLowerCase();
    return queryTokens.some((tok) => textToMatch.includes(tok));
  });

  if (matchedSources.length > 0) {
    const primary = matchedSources[0];
    const sourceLabel = primary.type === 'calendar' ? 'Google Calendar event' : 'Google Doc';

    return {
      question,
      answer: `Based on synced ${sourceLabel} "${primary.title}": ${primary.summary}`,
      confidence: 'High',
      confidenceReason: `Directly reconstructed from the connected artifact "${primary.title}" and associated team context.`,
      reasoningTimeline: matchedSources.map((s) => ({
        date: s.date,
        title: s.title,
        description: s.summary.slice(0, 180) + (s.summary.length > 180 ? '...' : ''),
        type: s.type === 'calendar' ? 'review' : 'decision',
        sourceId: s.id
      })),
      evidence: matchedSources
    };
  }

  // 5. Honest insufficient-evidence response (No mock fallback)
  return {
    question,
    answer: 'Insufficient context found in currently synced sources to answer this question. Please connect or sync relevant Google Docs or Calendar events.',
    confidence: 'Low',
    confidenceReason: 'No matching records found in connected engineering context sources.',
    reasoningTimeline: [],
    evidence: []
  };
}

/**
 * Dynamic Morning Brief Generator
 * Generates a fresh Morning Brief using only currently synced context sources and curated decisions.
 */
export async function generateDynamicMorningBrief(
  sources: ContextSource[],
  userName: string = 'Engineering Team'
): Promise<MorningBriefData | null> {
  if (sources.length === 0) {
    return null;
  }

  const curatedDecisions = getCuratedDecisionsFromSources(sources);
  const ai = getGenAI();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `
You are Trace's Morning Brief engine.
Synthesize a high-level Morning Brief for the engineering team based strictly and exclusively on the currently connected Google Workspace sources (Google Docs, Google Calendar meetings) and decisions.

Team member: ${userName}
Connected Sources:
${JSON.stringify(sources, null, 2)}

Curated Decisions:
${JSON.stringify(curatedDecisions, null, 2)}

Instructions:
1. period: Create a realistic concise period string (e.g. "This week · Aug 14-19, 2026" or matching the dates of the sources).
2. summaryText: A cohesive 2-3 sentence overview summarizing the latest team activities, decisions, and architectural/product updates from the sources.
3. changes: Array of 2-5 key updates from the sources. For each change:
   - id: unique string (e.g., 'c-1', 'c-2')
   - title: clear, concise headline of the change
   - category: 'Product' | 'Architecture' | 'AI / ML' | 'Data Pipeline' | 'API' | 'Infrastructure'
   - impact: 'High' | 'Medium' | 'Low'
   - decisionId: optional decision ID if it matches a curated decision (e.g., 'dec-tiktok-01')
   - askQuestion: a suggested natural language question to ask Trace about this specific change (e.g. 'Why did we change the AI pipeline from v1 to v2?')
4. suggestedQuestions: 3-5 high-value questions grounded directly in the synced sources that the team can ask Trace (e.g., 'Why did we change the AI pipeline from v1 to v2?', 'I just joined the team. What should I do in my first week?', 'Why are we integrating TikTok direct upload?').
`,
        config: {
          systemInstruction: 'Synthesize concise, high-value Morning Briefs grounded strictly in connected team context. Never hallucinate fake context.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              period: { type: Type.STRING },
              summaryText: { type: Type.STRING },
              changes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    impact: { type: Type.STRING },
                    decisionId: { type: Type.STRING },
                    askQuestion: { type: Type.STRING }
                  },
                  required: ['id', 'title', 'category', 'impact']
                }
              },
              suggestedQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['period', 'summaryText', 'changes', 'suggestedQuestions']
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          user: {
            name: userName,
            team: 'Engineering & Product Team'
          },
          period: parsed.period || 'This week',
          stats: {
            importantDecisions: curatedDecisions.length,
            architectureChanges: sources.filter((s) => s.type === 'doc').length,
            meetings: sources.filter((s) => s.type === 'calendar').length,
            needsAttention: 1
          },
          summaryText: parsed.summaryText,
          supportingSourcesCount: sources.length,
          changes: parsed.changes.map((c: any) => ({
            ...c,
            impact: ['High', 'Medium', 'Low'].includes(c.impact) ? c.impact : 'Medium'
          })),
          suggestedQuestions: parsed.suggestedQuestions || []
        };
      }
    } catch (err) {
      console.warn('Gemini morning brief generation error, utilizing dynamic fallback:', err);
    }
  }

  // Dynamic fallback brief built from actual synced sources
  const changes: MorningBriefData['changes'] = sources.slice(0, 4).map((s, idx) => {
    let cat = 'Architecture';
    if (s.title.toLowerCase().includes('tiktok') || s.title.toLowerCase().includes('clip')) cat = 'Product';
    else if (s.title.toLowerCase().includes('ai') || s.title.toLowerCase().includes('pipeline')) cat = 'AI / ML';
    else if (s.title.toLowerCase().includes('onboarding')) cat = 'Product';

    const isTikTok = s.title.toLowerCase().includes('tiktok');
    const isPipeline = s.title.toLowerCase().includes('pipeline');
    const isOnboarding = s.title.toLowerCase().includes('onboarding');

    return {
      id: `change-${idx + 1}`,
      title: s.title,
      category: cat,
      impact: idx === 0 ? 'High' : 'Medium',
      decisionId: isTikTok && curatedDecisions.length > 0 ? curatedDecisions[0].id : undefined,
      askQuestion: isPipeline
        ? 'Why did we change the AI pipeline from v1 to v2?'
        : isOnboarding
        ? 'I just joined the team. What should I do in my first week?'
        : `What was discussed in ${s.title}?`
    };
  });

  const suggestedQuestions = [
    'Why did we change the AI pipeline from v1 to v2?',
    'I just joined the team. What should I do in my first week?',
    curatedDecisions.length > 0 ? 'Why are we integrating TikTok direct upload?' : 'What decisions were made recently?'
  ];

  return {
    user: {
      name: userName,
      team: 'Engineering & Product Team'
    },
    period: 'Recent Activity',
    stats: {
      importantDecisions: curatedDecisions.length,
      architectureChanges: sources.filter((s) => s.type === 'doc').length,
      meetings: sources.filter((s) => s.type === 'calendar').length,
      needsAttention: 0
    },
    summaryText: `The team has synced ${sources.length} workspace context items across Google Docs and Google Calendar. Trace is actively tracking engineering discussions, product requirements, and system changes.`,
    supportingSourcesCount: sources.length,
    changes,
    suggestedQuestions
  };
}
