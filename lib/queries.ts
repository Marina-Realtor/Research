import { ResearchQuery, ProjectName } from '@/types';

// Blog URL for duplicate checking
export const BLOG_URL = 'https://www.marina-ramirez.com/en/blog';

// Morning queries - Market Intel
const MORNING_MARKET_INTEL: ResearchQuery[] = [
  {
    query: 'El Paso Texas real estate market update 2026',
    project: 'marina',
    category: 'market_intel',
  },
  {
    query: 'Fort Bliss BAH rates 2026',
    project: 'marina',
    category: 'market_intel',
  },
  {
    query: 'El Paso new construction homes Horizon City Eastlake',
    project: 'marina',
    category: 'market_intel',
  },
  {
    query: 'first time home buyer El Paso down payment assistance',
    project: 'marina',
    category: 'market_intel',
  },
  {
    query: 'First Time Home buyers incoming El Paso region 2026',
    project: 'marina',
    category: 'market_intel',
  },
];

// Morning queries - Reddit Pain Points
const MORNING_REDDIT: ResearchQuery[] = [
  {
    query: 'site:reddit.com moving to El Paso',
    project: 'marina',
    category: 'reddit_pain_points',
  },
  {
    query: 'site:reddit.com Fort Bliss housing advice',
    project: 'marina',
    category: 'reddit_pain_points',
  },
  {
    query: 'site:reddit.com El Paso neighborhoods safe',
    project: 'marina',
    category: 'reddit_pain_points',
  },
  {
    query: 'site:reddit.com PCS Fort Bliss buy or rent',
    project: 'marina',
    category: 'reddit_pain_points',
  },
];

// Evening queries - Urgent news only
const EVENING_URGENT: ResearchQuery[] = [
  {
    query: 'El Paso real estate market breaking news today',
    project: 'marina',
    category: 'urgent_news',
    isEvening: true,
  },
  {
    query: 'Fort Bliss announcement housing today',
    project: 'marina',
    category: 'urgent_news',
    isEvening: true,
  },
];

// All morning queries combined
const MORNING_QUERIES: ResearchQuery[] = [
  ...MORNING_MARKET_INTEL,
  ...MORNING_REDDIT,
];

// All evening queries
const EVENING_QUERIES: ResearchQuery[] = [...EVENING_URGENT];

/**
 * Get all morning queries (Market Intel + Reddit Pain Points)
 */
export function getMorningQueries(): ResearchQuery[] {
  return MORNING_QUERIES;
}

/**
 * Get all evening queries (Urgent News only)
 */
export function getEveningQueries(): ResearchQuery[] {
  return EVENING_QUERIES;
}

/**
 * Get queries filtered by project and time of day
 */
export function getQueriesByProject(
  project: ProjectName,
  isEvening: boolean = false
): ResearchQuery[] {
  const queries = isEvening ? EVENING_QUERIES : MORNING_QUERIES;
  return queries.filter((q) => q.project === project);
}

/**
 * Get query counts for status display
 */
export function getQueryCounts(): {
  morning: number;
  evening: number;
  total: number;
} {
  return {
    morning: MORNING_QUERIES.length,
    evening: EVENING_QUERIES.length,
    total: MORNING_QUERIES.length + EVENING_QUERIES.length,
  };
}

/**
 * Get blog topic focus areas for content recommendations
 */
export function getBlogFocus(): string[] {
  return [
    'El Paso Texas real estate',
    'Fort Bliss military housing',
    'First-time home buyers El Paso',
    'PCS relocation Fort Bliss',
    'El Paso neighborhoods guide',
    'BAH housing allowance El Paso',
    'New construction Horizon City Eastlake',
    'Down payment assistance programs Texas',
  ];
}
