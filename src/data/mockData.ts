import { ContextSource, DecisionItem, MorningBriefData } from '../types';

export const INITIAL_CONTEXT_SOURCES: ContextSource[] = [
  {
    id: 'cal-01',
    type: 'calendar',
    title: 'Architecture Review: Payment Service Caching',
    date: 'May 24, 2026',
    authorOrHost: 'Alex Rivers (Staff Arch)',
    summary: 'Team meeting discussing Redis latency spikes, maintenance overhead, and evaluating in-memory sync caching alternatives.',
    details: 'Attendees: Alex R., Nhu T., David K., Sarah L. Conclusion: Redis cluster was over-provisioned for simple session caching and introduced 45ms P99 latency spikes during cache synchronization failures.',
    url: 'https://calendar.google.com/event?id=arch-review-may24'
  },
  {
    id: 'doc-01',
    type: 'doc',
    title: 'Payment Architecture Review Notes',
    date: 'May 24, 2026',
    authorOrHost: 'Nhu T.',
    summary: 'Detailed RFC notes evaluating Redis removal vs. upgrade. Benchmarks showed in-memory LRU cache reduced mean latency from 68ms to 12ms.',
    details: 'Key tradeoffs discussed: In-memory cache means non-shared cache state across instances, but Payment API instances are stateless and cache hit ratio remains >94% with sticky routing.',
    url: 'https://docs.google.com/document/d/payment-arch-notes-2026/edit'
  },
  {
    id: 'doc-02',
    type: 'doc',
    title: 'Incident Report #42: Payment API Latency Spike',
    date: 'May 20, 2026',
    authorOrHost: 'DevOps On-Call',
    summary: 'Production incident where Payment API latency increased by 300% due to Redis connection pool exhaustion during peak load.',
    details: 'Root cause: Redis cluster master failover stalled worker threads for 4 minutes. Recommendation: Remove Redis dependency if distributed sync is not strictly required.',
    url: 'https://docs.google.com/document/d/incident-42-report/edit'
  },
  {
    id: 'github-01',
    type: 'github',
    title: 'PR #251: Remove Redis client and adopt in-memory LRU cache',
    date: 'May 25, 2026',
    authorOrHost: 'davidk-dev',
    summary: 'Replaced ioredis client with local MemoryCache manager with TTL auto-invalidation.',
    details: 'Merged by Alex Rivers. All payment unit & integration benchmark tests passing with 0 Redis connection dependency.',
    url: 'https://github.com/org/payment-service/pull/251'
  },
  {
    id: 'cal-02',
    type: 'calendar',
    title: 'AI Pipeline Sync: Reducing False Positives in Highlight Extraction',
    date: 'May 21, 2026',
    authorOrHost: 'Sarah L. (AI Lead)',
    summary: 'Review of AI Highlight Pipeline accuracy metrics. Precision dropped to 72% due to noisy log parsing.',
    details: 'Decided to introduce asynchronous pre-filtering stage using Gemini 3.6 Flash structured schema outputs before vector ranking.',
    url: 'https://calendar.google.com/event?id=ai-sync-may21'
  },
  {
    id: 'doc-03',
    type: 'doc',
    title: 'Highlight Pipeline Architecture Decision Record (ADR-014)',
    date: 'May 22, 2026',
    authorOrHost: 'Sarah L.',
    summary: 'Documented decision to update highlight extraction pipeline to asynchronous batch mode with Gemini filter.',
    details: 'Reduced false positive highlights from 28% to 4.2% while decreasing API compute expenditure by 35%.',
    url: 'https://docs.google.com/document/d/adr-014-highlight-pipeline/edit'
  },
  {
    id: 'github-02',
    type: 'github',
    title: 'PR #310: Implement Gemini-based Async Pre-filter for Highlights',
    date: 'May 24, 2026',
    authorOrHost: 'sarah-ai',
    summary: 'Added AsyncWorker queue and updated model strategy to Gemini 3.6 Flash for batch extraction.',
    details: 'Merged into main branch. Included regression benchmarks.',
    url: 'https://github.com/org/ai-engine/pull/310'
  },
  {
    id: 'doc-04',
    type: 'doc',
    title: 'RFC: Migrating Internal Microservices to gRPC',
    date: 'May 24, 2026',
    authorOrHost: 'Alex Rivers',
    summary: 'Proposal to replace HTTP REST with gRPC for service-to-service communication to reduce serialization overhead.',
    details: 'Protobuf definitions will enforce strict contracts across services. Benchmark shows 4x payload throughput improvement.',
    url: 'https://docs.google.com/document/d/rfc-grpc-migration/edit'
  },
  {
    id: 'cal-03',
    type: 'calendar',
    title: 'Gemini Model Strategy & Upgrade Workshop',
    date: 'May 23, 2026',
    authorOrHost: 'Nhu T.',
    summary: 'Evaluated Gemini 3.6 Flash vs older models for classification tasks across engineering sub-modules.',
    details: 'Consensus: Standardize on Gemini 3.6 Flash for low latency and high structured output reliability.',
    url: 'https://calendar.google.com/event?id=gemini-strategy-may23'
  },
  {
    id: 'github-03',
    type: 'github',
    title: 'PR #402: Migrate classification service to @google/genai SDK',
    date: 'May 25, 2026',
    authorOrHost: 'nhu-t',
    summary: 'Updated SDK imports and configured server-side Gemini 3.6 Flash with responseSchema.',
    details: 'Merged with zero breaking changes.',
    url: 'https://github.com/org/core-api/pull/402'
  }
];

export const INITIAL_DECISIONS: DecisionItem[] = [
  {
    id: 'dec-01',
    title: 'Remove Redis from Payment Service',
    category: 'Architecture',
    date: 'May 24, 2026',
    author: 'Alex Rivers',
    status: 'Implemented',
    summary: 'Removed Redis dependency from Payment Service in favor of in-memory caching to eliminate P99 latency spikes and connection pool exhaustion.',
    why: 'The team experienced increasing production latency during failovers (Incident #42) and determined that distributed Redis synchronization introduced unnecessary infrastructure complexity for stateless payment nodes.',
    timeline: [
      {
        date: 'May 20, 2026',
        title: 'Production Incident',
        description: 'Payment API latency increased significantly due to Redis connection pool stalls during master failover.',
        type: 'incident',
        sourceId: 'doc-02'
      },
      {
        date: 'May 22, 2026',
        title: 'Investigation',
        description: 'DevOps identified Redis cluster network sync delay as the primary bottleneck affecting worker threads.',
        type: 'investigation',
        sourceId: 'doc-02'
      },
      {
        date: 'May 24, 2026',
        title: 'Architecture Review',
        description: 'Team evaluated distributed vs in-memory LRU cache alternatives in a dedicated design meeting.',
        type: 'review',
        sourceId: 'cal-01'
      },
      {
        date: 'May 24, 2026',
        title: 'Decision',
        description: 'Selected in-memory local caching with sticky ingress routing to remove Redis completely.',
        type: 'decision',
        sourceId: 'doc-01'
      },
      {
        date: 'May 25, 2026',
        title: 'Implementation',
        description: 'PR #251 merged into production, replacing Redis client with local MemoryCache manager.',
        type: 'implementation',
        sourceId: 'github-01'
      }
    ],
    evidence: [
      INITIAL_CONTEXT_SOURCES[0], // cal-01
      INITIAL_CONTEXT_SOURCES[1], // doc-01
      INITIAL_CONTEXT_SOURCES[2], // doc-02
      INITIAL_CONTEXT_SOURCES[3]  // github-01
    ],
    tags: ['Payment', 'Redis', 'Caching', 'Latency', 'Infrastructure']
  },
  {
    id: 'dec-02',
    title: 'Update Highlight Pipeline Strategy with AI Pre-filter',
    category: 'Data Pipeline',
    date: 'May 22, 2026',
    author: 'Sarah L.',
    status: 'Implemented',
    summary: 'Introduced an asynchronous batch processing pipeline using Gemini 3.6 Flash structured schema outputs to filter noisy log highlights.',
    why: 'The previous rule-based highlight extractor suffered a high false-positive rate (28%). The new AI pre-filter increased precision to 95.8% while reducing overall cloud compute overhead.',
    timeline: [
      {
        date: 'May 20, 2026',
        title: 'Quality Alert',
        description: 'User feedback indicated false positive highlights polluted 28% of daily summary feeds.',
        type: 'incident',
        sourceId: 'cal-02'
      },
      {
        date: 'May 21, 2026',
        title: 'AI Pipeline Sync',
        description: 'AI team benchmarked rule-based vs LLM structured classification.',
        type: 'review',
        sourceId: 'cal-02'
      },
      {
        date: 'May 22, 2026',
        title: 'ADR Documented',
        description: 'ADR-014 published approving Gemini batch pre-filtering strategy.',
        type: 'decision',
        sourceId: 'doc-03'
      },
      {
        date: 'May 24, 2026',
        title: 'Implementation',
        description: 'PR #310 deployed with background queue processor.',
        type: 'implementation',
        sourceId: 'github-02'
      }
    ],
    evidence: [
      INITIAL_CONTEXT_SOURCES[4], // cal-02
      INITIAL_CONTEXT_SOURCES[5], // doc-03
      INITIAL_CONTEXT_SOURCES[6]  // github-02
    ],
    tags: ['AI Pipeline', 'Gemini', 'Highlight', 'Batch Processing']
  },
  {
    id: 'dec-03',
    title: 'Standardize on Gemini 3.6 Flash for Classification',
    category: 'AI / ML',
    date: 'May 23, 2026',
    author: 'Nhu T.',
    status: 'Implemented',
    summary: 'Standardized all automated engineering document and log classification services on Gemini 3.6 Flash via the official @google/genai server-side SDK.',
    why: 'Gemini 3.6 Flash provides optimal balance of sub-second reasoning latency, reliable JSON response schema enforcement, and cost efficiency across high-volume internal context pipelines.',
    timeline: [
      {
        date: 'May 21, 2026',
        title: 'SDK Audit',
        description: 'Audit revealed legacy client-side SDK usage in 2 services, causing credential fragmentation.',
        type: 'investigation',
        sourceId: 'cal-03'
      },
      {
        date: 'May 23, 2026',
        title: 'Workshop Decision',
        description: 'Agreed to enforce server-side @google/genai standard with Gemini 3.6 Flash across all internal services.',
        type: 'decision',
        sourceId: 'cal-03'
      },
      {
        date: 'May 25, 2026',
        title: 'Implementation',
        description: 'PR #402 refactored core classification endpoints to Express server proxies with Gemini 3.6 Flash.',
        type: 'implementation',
        sourceId: 'github-03'
      }
    ],
    evidence: [
      INITIAL_CONTEXT_SOURCES[8], // cal-03
      INITIAL_CONTEXT_SOURCES[9]  // github-03
    ],
    tags: ['Gemini', 'AI Model', 'SDK', 'Server-Side', 'Architecture']
  },
  {
    id: 'dec-04',
    title: 'Migrate Core Service-to-Service API to gRPC',
    category: 'API',
    date: 'May 24, 2026',
    author: 'Alex Rivers',
    status: 'Awaiting Implementation',
    summary: 'Transitioning high-volume microservice APIs from HTTP/JSON REST to gRPC with Protocol Buffers.',
    why: 'JSON parsing overhead accounted for 22% of internal service CPU usage. Protobuf binary serialization will improve throughput by 4x and enforce strict cross-team API schemas.',
    timeline: [
      {
        date: 'May 21, 2026',
        title: 'Profiling Report',
        description: 'CPU flamegraphs showed high JSON marshalling cost in inter-service gateway nodes.',
        type: 'investigation',
        sourceId: 'doc-04'
      },
      {
        date: 'May 24, 2026',
        title: 'RFC Published',
        description: 'RFC for gRPC migration published and approved by lead architects.',
        type: 'decision',
        sourceId: 'doc-04'
      }
    ],
    evidence: [
      INITIAL_CONTEXT_SOURCES[7] // doc-04
    ],
    tags: ['gRPC', 'Protobuf', 'Microservices', 'API', 'Performance']
  }
];

export const INITIAL_MORNING_BRIEF: MorningBriefData = {
  user: {
    name: 'Nhu',
    team: 'Platform & Infrastructure Team'
  },
  period: 'This week · May 20-25, 2026',
  stats: {
    importantDecisions: 3,
    architectureChanges: 2,
    meetings: 4,
    needsAttention: 1
  },
  summaryText: 'The team changed the Payment Service caching architecture after a production latency incident, completely removing Redis in favor of local in-memory caching. The AI Highlight Pipeline was also updated to reduce false positives using Gemini 3.6 Flash. One new architecture decision (gRPC Migration) is currently awaiting implementation.',
  changes: [
    {
      id: 'c-1',
      title: 'Payment service architecture changed (Redis removed)',
      category: 'Architecture',
      impact: 'High',
      decisionId: 'dec-01'
    },
    {
      id: 'c-2',
      title: 'Highlight extraction pipeline was updated',
      category: 'Data Pipeline',
      impact: 'Medium',
      decisionId: 'dec-02'
    },
    {
      id: 'c-3',
      title: 'Gemini model strategy standardized on 3.6 Flash',
      category: 'AI / ML',
      impact: 'High',
      decisionId: 'dec-03'
    },
    {
      id: 'c-4',
      title: 'gRPC Migration RFC approved (Awaiting implementation)',
      category: 'API',
      impact: 'Medium',
      decisionId: 'dec-04'
    }
  ],
  suggestedQuestions: [
    'Why did we remove Redis?',
    'Why did we change the highlight pipeline?',
    'Why are we using Gemini for classification?',
    'What changed in the payment architecture?',
    'What decisions were made this week?'
  ]
};
