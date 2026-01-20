import { kv } from '@vercel/kv';
import { UrgentItem, ResearchFinding, DailyResearchData } from '@/types';

// In-memory fallback storage for development
let inMemoryStorage: Map<string, DailyResearchData> = new Map();

/**
 * Get today's date key for storage
 */
function getTodayKey(): string {
  const today = new Date().toISOString().split('T')[0];
  return `research_urgent_${today}`;
}

/**
 * Check if Vercel KV is available
 */
function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Get daily data from storage
 */
async function getDailyData(): Promise<DailyResearchData | null> {
  const key = getTodayKey();

  if (isKvAvailable()) {
    try {
      const data = await kv.get<DailyResearchData>(key);
      return data;
    } catch (error) {
      console.error('KV read error:', error);
      return inMemoryStorage.get(key) || null;
    }
  }

  return inMemoryStorage.get(key) || null;
}

/**
 * Save daily data to storage
 */
async function saveDailyData(data: DailyResearchData): Promise<void> {
  const key = getTodayKey();

  if (isKvAvailable()) {
    try {
      // Set with 2-day expiration (172800 seconds)
      await kv.set(key, data, { ex: 172800 });
    } catch (error) {
      console.error('KV write error:', error);
      inMemoryStorage.set(key, data);
    }
  } else {
    inMemoryStorage.set(key, data);
  }
}

/**
 * Convert a ResearchFinding to an UrgentItem
 */
export function findingToUrgentItem(finding: ResearchFinding): UrgentItem {
  return {
    project: finding.project,
    summary: finding.mostImportantInsight,
    source: finding.sources[0]?.url || finding.query,
    priority: finding.priority as 'high' | 'urgent',
    category: finding.category,
    timestamp: finding.timestamp,
  };
}

/**
 * Save urgent items from morning digest
 */
export async function saveMorningUrgentItems(
  items: UrgentItem[]
): Promise<void> {
  const existing = await getDailyData();
  const today = new Date().toISOString().split('T')[0];

  const data: DailyResearchData = {
    date: today,
    morningUrgentItems: items,
    eveningUrgentItems: existing?.eveningUrgentItems,
    lastMorningRun: new Date().toISOString(),
    lastEveningRun: existing?.lastEveningRun,
  };

  await saveDailyData(data);
  console.log(`Saved ${items.length} morning urgent items`);
}

/**
 * Load urgent items from morning for comparison
 */
export async function loadMorningUrgentItems(): Promise<UrgentItem[]> {
  const data = await getDailyData();
  return data?.morningUrgentItems || [];
}

/**
 * Save urgent items from evening catchup
 */
export async function saveEveningUrgentItems(
  items: UrgentItem[]
): Promise<void> {
  const existing = await getDailyData();
  const today = new Date().toISOString().split('T')[0];

  const data: DailyResearchData = {
    date: today,
    morningUrgentItems: existing?.morningUrgentItems || [],
    eveningUrgentItems: items,
    lastMorningRun: existing?.lastMorningRun,
    lastEveningRun: new Date().toISOString(),
  };

  await saveDailyData(data);
  console.log(`Saved ${items.length} evening urgent items`);
}

/**
 * Filter evening items to only include those not found in morning
 */
export function filterNewUrgentItems(
  eveningItems: UrgentItem[],
  morningItems: UrgentItem[]
): UrgentItem[] {
  return eveningItems.filter((eveningItem) => {
    // Check if this item already exists in morning items
    const isDuplicate = morningItems.some((morningItem) => {
      // Same project
      if (morningItem.project !== eveningItem.project) return false;

      // Check word overlap in summary
      const eveningWords = eveningItem.summary.toLowerCase().split(/\s+/);
      const morningWords = morningItem.summary.toLowerCase().split(/\s+/);

      const matchingWords = eveningWords.filter((word) =>
        morningWords.includes(word)
      );

      // If more than 50% of words match, consider it a duplicate
      const overlapRatio = matchingWords.length / eveningWords.length;
      return overlapRatio > 0.5;
    });

    return !isDuplicate;
  });
}

/**
 * Get last run timestamps for status display
 */
export async function getLastRunTimestamps(): Promise<{
  lastMorningRun?: string;
  lastEveningRun?: string;
}> {
  const data = await getDailyData();
  return {
    lastMorningRun: data?.lastMorningRun,
    lastEveningRun: data?.lastEveningRun,
  };
}

/**
 * Clear in-memory storage (for testing)
 */
export function clearInMemoryStorage(): void {
  inMemoryStorage = new Map();
}
