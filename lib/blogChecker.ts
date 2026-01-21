import { ExistingBlogPost, BlogTopic } from '@/types';
import { BLOG_URL } from './queries';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Common stop words to exclude from keyword matching
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'this',
  'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
  'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'your',
  'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
  'any', 'our', 'out', 'up', 'down', 'off', 'over', 'now', 'new', 'first',
  'also', 'get', 'go', 'going', 'know', 'like', 'make', 'one', 'way', 'well',
  'even', 'back', 'being', 'come', 'look', 'still', 'take', 'want', 'think',
  'see', 'time', 'year', 'good', 'give', 'day', 'use', 'work', 'best', 'top',
  'complete', 'guide', 'ultimate', 'tips', 'things', 'essential', 'everything',
]);

/**
 * Fetch existing blog posts from Marina's blog
 */
export async function fetchBlogPosts(): Promise<ExistingBlogPost[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.error('PERPLEXITY_API_KEY not configured for blog checking');
    return [];
  }

  const prompt = `Visit ${BLOG_URL} and list ALL blog post titles you can find.

Return a JSON array with the format:
[
  {"title": "Blog Post Title 1"},
  {"title": "Blog Post Title 2"}
]

Only return the JSON array, nothing else. If you cannot find any blog posts, return an empty array [].`;

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
          {
            role: 'system',
            content: 'You are a web scraper that extracts blog post titles. Return only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch blog posts: HTTP ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const posts = JSON.parse(jsonMatch[0]) as Array<{ title: string }>;
      return posts.map((p) => ({
        title: p.title,
        project: 'marina' as const,
        url: BLOG_URL,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

/**
 * Extract keywords from a title (removing stop words)
 */
function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

/**
 * Check if two topics are similar based on keyword overlap
 */
function isSimilarTopic(newTitle: string, existingTitle: string): boolean {
  const newKeywords = extractKeywords(newTitle);
  const existingKeywords = extractKeywords(existingTitle);

  if (newKeywords.length === 0 || existingKeywords.length === 0) {
    return false;
  }

  // Count matching keywords
  const matches = newKeywords.filter((kw) =>
    existingKeywords.some((ek) => ek.includes(kw) || kw.includes(ek))
  );

  // If more than 50% of keywords match, consider it a duplicate
  const overlapRatio = matches.length / Math.min(newKeywords.length, existingKeywords.length);

  // Also check for substring match (first 30 chars)
  const newPrefix = newTitle.toLowerCase().slice(0, 30);
  const existingPrefix = existingTitle.toLowerCase().slice(0, 30);
  const substringMatch =
    newPrefix.includes(existingPrefix.slice(0, 20)) ||
    existingPrefix.includes(newPrefix.slice(0, 20));

  return overlapRatio > 0.5 || substringMatch;
}

/**
 * Check suggested blog topics against existing posts for duplicates
 */
export async function checkTopicsForDuplicates(
  suggestedTopics: string[],
  existingPosts: ExistingBlogPost[]
): Promise<BlogTopic[]> {
  const results: BlogTopic[] = [];

  for (const topic of suggestedTopics) {
    let isDuplicate = false;
    let existingPostTitle: string | undefined;

    // Check against each existing post
    for (const post of existingPosts) {
      if (isSimilarTopic(topic, post.title)) {
        isDuplicate = true;
        existingPostTitle = post.title;
        break;
      }
    }

    // Extract keywords for the topic
    const targetKeywords = extractKeywords(topic).slice(0, 5);

    results.push({
      title: topic,
      targetKeywords,
      project: 'marina',
      isDuplicate,
      existingPostTitle,
    });
  }

  return results;
}

/**
 * Full blog check workflow: fetch existing posts and check topics
 */
export async function checkAllBlogs(): Promise<ExistingBlogPost[]> {
  console.log('Fetching existing blog posts from:', BLOG_URL);
  const posts = await fetchBlogPosts();
  console.log(`Found ${posts.length} existing blog posts`);
  return posts;
}
