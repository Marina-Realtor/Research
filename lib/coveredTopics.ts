import { promises as fs } from 'fs';
import path from 'path';
import { ResearchFinding } from '@/types';

// Path to the covered topics JSON file
const COVERED_TOPICS_FILE = path.join(process.cwd(), 'covered-topics.json');

// How many weeks to keep topics (to avoid infinite growth)
const WEEKS_TO_KEEP = 4;

export interface CoveredTopic {
  topic: string;
  keywords: string[];
  dateAdded: string;
  source: 'blog' | 'email';
}

export interface CoveredTopicsData {
  lastUpdated: string;
  topics: CoveredTopic[];
}

/**
 * Load covered topics from JSON file
 */
export async function loadCoveredTopics(): Promise<CoveredTopicsData> {
  try {
    const data = await fs.readFile(COVERED_TOPICS_FILE, 'utf-8');
    return JSON.parse(data) as CoveredTopicsData;
  } catch {
    // File doesn't exist yet, return empty data
    return {
      lastUpdated: new Date().toISOString(),
      topics: [],
    };
  }
}

/**
 * Save covered topics to JSON file
 */
export async function saveCoveredTopics(data: CoveredTopicsData): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(COVERED_TOPICS_FILE, JSON.stringify(data, null, 2));
}

/**
 * Extract keywords from text for matching
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'this', 'that', 'these', 'those', 'what', 'which', 'who', 'where', 'when',
    'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'about', 'into', 'through', 'during', 'before', 'after',
    'now', 'new', 'first', 'also', 'get', 'going', 'know', 'like', 'make', 'one',
    'way', 'well', 'even', 'back', 'being', 'come', 'look', 'still', 'take',
    'want', 'think', 'see', 'time', 'year', 'good', 'give', 'day', 'use', 'work',
    'best', 'top', 'complete', 'guide', 'ultimate', 'tips', 'things', 'essential',
    'update', 'updates', 'latest', 'recent', 'today', '2025', '2026',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !stopWords.has(word));
}

/**
 * Check if a finding is similar to already covered topics
 */
function isSimilarToExisting(
  findingKeywords: string[],
  coveredTopic: CoveredTopic
): boolean {
  if (findingKeywords.length === 0 || coveredTopic.keywords.length === 0) {
    return false;
  }

  // Count matching keywords
  const matches = findingKeywords.filter((kw) =>
    coveredTopic.keywords.some((ck) => ck.includes(kw) || kw.includes(ck))
  );

  // If more than 60% of keywords match, consider it a duplicate
  const overlapRatio = matches.length / Math.min(findingKeywords.length, coveredTopic.keywords.length);
  return overlapRatio > 0.6;
}

/**
 * Clean up old topics (older than WEEKS_TO_KEEP)
 */
function cleanupOldTopics(topics: CoveredTopic[]): CoveredTopic[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - WEEKS_TO_KEEP * 7);

  return topics.filter((topic) => {
    const topicDate = new Date(topic.dateAdded);
    return topicDate > cutoffDate;
  });
}

/**
 * Filter out findings that have already been covered
 * Returns findings that are NEW (not duplicates)
 */
export async function filterDuplicateFindings(
  findings: ResearchFinding[]
): Promise<{ newFindings: ResearchFinding[]; duplicateCount: number }> {
  const coveredData = await loadCoveredTopics();
  const newFindings: ResearchFinding[] = [];
  let duplicateCount = 0;

  for (const finding of findings) {
    // Extract keywords from the finding's key content
    const contentToCheck = [
      finding.mostImportantInsight,
      ...finding.keyFindings,
    ].join(' ');
    const findingKeywords = extractKeywords(contentToCheck);

    // Check if this finding is similar to any covered topic
    const isDuplicate = coveredData.topics.some((covered) =>
      isSimilarToExisting(findingKeywords, covered)
    );

    if (isDuplicate) {
      duplicateCount++;
      console.log(`Filtered duplicate finding: "${finding.mostImportantInsight.slice(0, 50)}..."`);
    } else {
      newFindings.push(finding);
    }
  }

  console.log(`Filtered ${duplicateCount} duplicate findings, ${newFindings.length} new findings remain`);
  return { newFindings, duplicateCount };
}

/**
 * Add findings to the covered topics list (call after email is sent)
 */
export async function markFindingsAsCovered(
  findings: ResearchFinding[]
): Promise<void> {
  const coveredData = await loadCoveredTopics();
  const now = new Date().toISOString();

  for (const finding of findings) {
    const contentToCheck = [
      finding.mostImportantInsight,
      ...finding.keyFindings.slice(0, 2), // Top 2 key findings
    ].join(' ');

    const keywords = extractKeywords(contentToCheck).slice(0, 10); // Top 10 keywords

    coveredData.topics.push({
      topic: finding.mostImportantInsight.slice(0, 100),
      keywords,
      dateAdded: now,
      source: 'email',
    });
  }

  // Clean up old topics
  coveredData.topics = cleanupOldTopics(coveredData.topics);

  await saveCoveredTopics(coveredData);
  console.log(`Marked ${findings.length} findings as covered, total topics: ${coveredData.topics.length}`);
}

/**
 * Add a blog topic to the covered list
 */
export async function markBlogTopicAsCovered(
  title: string,
  keywords: string[]
): Promise<void> {
  const coveredData = await loadCoveredTopics();

  coveredData.topics.push({
    topic: title,
    keywords: keywords.length > 0 ? keywords : extractKeywords(title),
    dateAdded: new Date().toISOString(),
    source: 'blog',
  });

  coveredData.topics = cleanupOldTopics(coveredData.topics);
  await saveCoveredTopics(coveredData);
}

/**
 * Get summary of covered topics for reference
 */
export async function getCoveredTopicsSummary(): Promise<string> {
  const coveredData = await loadCoveredTopics();

  if (coveredData.topics.length === 0) {
    return 'No topics covered yet.';
  }

  const summary = coveredData.topics
    .slice(-10) // Last 10 topics
    .map((t) => `- ${t.topic} (${t.source}, ${t.dateAdded.split('T')[0]})`)
    .join('\n');

  return `Recent covered topics (${coveredData.topics.length} total):\n${summary}`;
}
