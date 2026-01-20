// Marina Real Estate Research Automation Types

export type ProjectName = 'marina';

export type QueryCategory =
  | 'market_intel'
  | 'reddit_pain_points'
  | 'urgent_news';

export interface ResearchQuery {
  query: string;
  project: ProjectName;
  category: QueryCategory;
  isEvening?: boolean;
}

export interface Source {
  title: string;
  url: string;
}

export interface PainPoint {
  description: string;
  frequency: 'common' | 'occasional' | 'rare';
  source?: string;
}

export interface ResearchFinding {
  query: string;
  project: ProjectName;
  category: QueryCategory;
  keyFindings: string[];
  mostImportantInsight: string;
  painPoints: PainPoint[];
  solutionRequests: string[];
  actionItems: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sources: Source[];
  rawResponse: string;
  timestamp: string;
}

export interface UrgentItem {
  project: ProjectName;
  summary: string;
  source: string;
  priority: 'high' | 'urgent';
  category: QueryCategory;
  timestamp: string;
}

export interface BlogTopic {
  title: string;
  targetKeywords: string[];
  project: ProjectName;
  isDuplicate: boolean;
  existingPostTitle?: string;
}

export interface ExistingBlogPost {
  title: string;
  project: ProjectName;
  url?: string;
}

export interface DailyResearchData {
  date: string;
  morningUrgentItems: UrgentItem[];
  eveningUrgentItems?: UrgentItem[];
  lastMorningRun?: string;
  lastEveningRun?: string;
}

export interface CronJobResult {
  success: boolean;
  jobType: 'morning-digest' | 'evening-catchup';
  timestamp: string;
  queriesProcessed: number;
  urgentItemsFound: number;
  emailSent: boolean;
  errors: string[];
}

export interface StatusData {
  status: 'operational' | 'degraded' | 'error';
  lastMorningRun?: string;
  lastEveningRun?: string;
  morningQueryCount: number;
  eveningQueryCount: number;
  blogUrl: string;
}
