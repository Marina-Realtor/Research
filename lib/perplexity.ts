import {
  ResearchQuery,
  ResearchFinding,
  PainPoint,
  Source,
} from '@/types';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2000;

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process a single research query through Perplexity API
 */
async function processQuery(
  query: ResearchQuery,
  isEvening: boolean = false
): Promise<ResearchFinding | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.error('PERPLEXITY_API_KEY not configured');
    return null;
  }

  const systemPrompt = isEvening
    ? `You are a real estate market research assistant for Marina Ramirez, a realtor in El Paso, Texas specializing in Fort Bliss military relocations and first-time home buyers.

Focus ONLY on urgent, breaking news from the last 24 hours.

Return a JSON object with:
{
  "keyFindings": ["array of 1-3 key urgent findings"],
  "mostImportantInsight": "single most critical insight",
  "painPoints": [],
  "solutionRequests": [],
  "actionItems": ["immediate actions Marina should take"],
  "priority": "urgent" | "high" | "medium" | "low",
  "sources": [{"title": "source name", "url": "url"}]
}

If there is NO urgent news, return priority "low" with keyFindings stating "No urgent updates found in the last 24 hours."`
    : `You are a real estate market research assistant for Marina Ramirez, a realtor in El Paso, Texas specializing in Fort Bliss military relocations and first-time home buyers.

Analyze the search results and extract actionable insights.

Return a JSON object with:
{
  "keyFindings": ["array of 3-5 key findings"],
  "mostImportantInsight": "single most important insight for Marina's business",
  "painPoints": [{"description": "pain point", "frequency": "common" | "occasional" | "rare", "source": "where found"}],
  "solutionRequests": ["what people are asking for"],
  "actionItems": ["specific actions Marina could take"],
  "priority": "urgent" | "high" | "medium" | "low",
  "sources": [{"title": "source name", "url": "url"}]
}

Focus on:
- El Paso real estate market trends
- Fort Bliss military housing and BAH information
- First-time home buyer pain points and needs
- Neighborhood safety concerns
- PCS relocation advice
- Down payment assistance programs
- New construction opportunities in Horizon City and Eastlake`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query.query },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error for query "${query.query}":`, errorText);
      return null;
    }

    const data = await response.json();
    const rawResponse = data.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    const finding = parsePerplexityResponse(rawResponse, query);
    return finding;
  } catch (error) {
    console.error(`Error processing query "${query.query}":`, error);
    return null;
  }
}

/**
 * Parse Perplexity response into structured finding
 */
function parsePerplexityResponse(
  rawResponse: string,
  query: ResearchQuery
): ResearchFinding {
  const timestamp = new Date().toISOString();

  // Try to extract JSON from response
  let parsed: Record<string, unknown> = {};
  try {
    // Look for JSON in the response (may be wrapped in markdown code blocks)
    const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                     rawResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                     rawResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      parsed = JSON.parse(jsonStr);
    }
  } catch {
    console.warn(`Could not parse JSON from response for query: ${query.query}`);
  }

  // Extract data with defaults
  const keyFindings = Array.isArray(parsed.keyFindings)
    ? parsed.keyFindings as string[]
    : [rawResponse.slice(0, 500)];

  const mostImportantInsight = typeof parsed.mostImportantInsight === 'string'
    ? parsed.mostImportantInsight
    : keyFindings[0] || 'No specific insight extracted';

  const painPoints: PainPoint[] = Array.isArray(parsed.painPoints)
    ? (parsed.painPoints as Array<{description?: string; frequency?: string; source?: string}>).map((pp) => ({
        description: pp.description || 'Unknown',
        frequency: (pp.frequency as PainPoint['frequency']) || 'occasional',
        source: pp.source,
      }))
    : [];

  const solutionRequests = Array.isArray(parsed.solutionRequests)
    ? parsed.solutionRequests as string[]
    : [];

  const actionItems = Array.isArray(parsed.actionItems)
    ? parsed.actionItems as string[]
    : [];

  const priority = ['urgent', 'high', 'medium', 'low'].includes(parsed.priority as string)
    ? (parsed.priority as ResearchFinding['priority'])
    : 'medium';

  const sources: Source[] = Array.isArray(parsed.sources)
    ? (parsed.sources as Array<{title?: string; url?: string}>).map((s) => ({
        title: s.title || 'Unknown Source',
        url: s.url || '',
      }))
    : [];

  return {
    query: query.query,
    project: query.project,
    category: query.category,
    keyFindings,
    mostImportantInsight,
    painPoints,
    solutionRequests,
    actionItems,
    priority,
    sources,
    rawResponse,
    timestamp,
  };
}

/**
 * Process multiple queries in parallel batches
 */
export async function processQueries(
  queries: ResearchQuery[],
  isEvening: boolean = false
): Promise<{ findings: ResearchFinding[]; errors: string[] }> {
  const findings: ResearchFinding[] = [];
  const errors: string[] = [];

  const totalBatches = Math.ceil(queries.length / BATCH_SIZE);

  for (let i = 0; i < queries.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batch = queries.slice(i, i + BATCH_SIZE);

    console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} queries)`);

    // Process batch in parallel
    const batchPromises = batch.map((query) => processQuery(query, isEvening));
    const results = await Promise.all(batchPromises);

    // Collect results
    results.forEach((result, index) => {
      if (result) {
        findings.push(result);
      } else {
        errors.push(`Failed to process query: ${batch[index].query}`);
      }
    });

    // Rate limiting delay between batches (except for last batch)
    if (i + BATCH_SIZE < queries.length) {
      console.log(`Waiting ${BATCH_DELAY_MS}ms before next batch...`);
      await delay(BATCH_DELAY_MS);
    }
  }

  console.log(`Completed processing: ${findings.length} findings, ${errors.length} errors`);

  return { findings, errors };
}

/**
 * Get trending blog topics based on research focus
 */
export async function getTrendingBlogTopics(): Promise<string[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.error('PERPLEXITY_API_KEY not configured');
    return [];
  }

  const prompt = `As a real estate SEO expert, suggest 5 blog topics for a realtor in El Paso, Texas who specializes in:
- Fort Bliss military relocations and PCS moves
- First-time home buyers
- Local neighborhoods (especially safe areas)
- New construction in Horizon City and Eastlake
- Down payment assistance programs

Focus on topics with high search intent that would attract potential clients. Consider local SEO opportunities.

Return ONLY a JSON array of objects:
[
  {"title": "Blog title with SEO keywords", "targetKeywords": ["keyword1", "keyword2", "keyword3"]}
]`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are an SEO expert for real estate content marketing.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('Failed to get blog topics');
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const topics = JSON.parse(jsonMatch[0]) as Array<{title: string}>;
      return topics.map((t) => t.title);
    }

    return [];
  } catch (error) {
    console.error('Error getting blog topics:', error);
    return [];
  }
}

/**
 * Check if a finding indicates urgent news
 */
export function isUrgentResult(finding: ResearchFinding): boolean {
  const noUrgentPhrases = [
    'no urgent updates',
    'no breaking news',
    'no significant developments',
    'nothing urgent',
  ];

  const summaryLower = finding.mostImportantInsight.toLowerCase();
  const hasNoUrgent = noUrgentPhrases.some((phrase) =>
    summaryLower.includes(phrase)
  );

  return (
    (finding.priority === 'urgent' || finding.priority === 'high') &&
    !hasNoUrgent
  );
}
