import { NextResponse } from 'next/server';
import { processQueries, getTrendingBlogTopics, isUrgentResult } from '@/lib/perplexity';
import { formatMorningEmail } from '@/lib/emailTemplates';
import { sendMorningDigest, sendErrorNotification } from '@/lib/resend';
import { checkAllBlogs, checkTopicsForDuplicates } from '@/lib/blogChecker';
import { saveMorningUrgentItems, findingToUrgentItem } from '@/lib/urgentTracker';
import { filterDuplicateFindings, markFindingsAsCovered } from '@/lib/coveredTopics';
import { getMorningQueries } from '@/lib/queries';
import { CronJobResult, UrgentItem, BlogTopic } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for morning digest

/**
 * Verify cron secret if configured
 */
function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // No secret configured, allow request

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request): Promise<NextResponse> {
  const startTime = Date.now();
  const errors: string[] = [];

  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('Starting morning digest job...');

  try {
    // Step 1: Process all morning queries
    console.log('Step 1: Processing morning queries...');
    const queries = getMorningQueries();
    const { findings: rawFindings, errors: queryErrors } = await processQueries(queries, false);
    errors.push(...queryErrors);
    console.log(`Processed ${rawFindings.length} queries with ${queryErrors.length} errors`);

    // Step 1b: Filter out already-covered topics
    console.log('Step 1b: Filtering duplicate/already-covered topics...');
    const { newFindings: findings, duplicateCount } = await filterDuplicateFindings(rawFindings);
    console.log(`Filtered ${duplicateCount} duplicates, ${findings.length} new findings remain`);

    // Step 2: Get trending blog topics (only on Mondays)
    console.log('Step 2: Checking for blog topics...');
    let trendingTopics: string[] = [];
    const today = new Date();
    const isMonday = today.getDay() === 1;

    if (isMonday) {
      console.log('Today is Monday - fetching blog topics...');
      try {
        trendingTopics = await getTrendingBlogTopics();
        console.log(`Found ${trendingTopics.length} trending topics`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Blog topics error: ${errorMsg}`);
        console.error('Failed to get trending topics:', error);
      }
    } else {
      console.log('Not Monday - skipping blog topics');
    }

    // Step 3: Check existing blog posts
    console.log('Step 3: Checking existing blog posts...');
    let existingPosts: Awaited<ReturnType<typeof checkAllBlogs>> = [];
    try {
      existingPosts = await checkAllBlogs();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Blog check error: ${errorMsg}`);
      console.error('Failed to check existing blogs:', error);
    }

    // Step 4: Check topics for duplicates
    console.log('Step 4: Checking for duplicate topics...');
    let blogTopics: BlogTopic[] = [];
    if (trendingTopics.length > 0) {
      blogTopics = await checkTopicsForDuplicates(trendingTopics, existingPosts);
      const duplicateCount = blogTopics.filter((t) => t.isDuplicate).length;
      console.log(`Checked ${blogTopics.length} topics, ${duplicateCount} duplicates found`);
    }

    // Step 5: Extract and save urgent items
    console.log('Step 5: Extracting urgent items...');
    const urgentFindings = findings.filter(isUrgentResult);
    const urgentItems: UrgentItem[] = urgentFindings.map(findingToUrgentItem);
    await saveMorningUrgentItems(urgentItems);
    console.log(`Saved ${urgentItems.length} urgent items`);

    // Step 6: Format email with GPT-4o
    console.log('Step 6: Formatting email...');
    let emailHtml: string;
    try {
      emailHtml = await formatMorningEmail(findings, blogTopics, urgentItems);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Email formatting error: ${errorMsg}`);
      console.error('Email formatting failed:', error);
      // Will use fallback format from formatMorningEmail
      emailHtml = await formatMorningEmail(findings, blogTopics, urgentItems);
    }

    // Step 7: Send email via Resend
    console.log('Step 7: Sending email...');
    const emailResult = await sendMorningDigest(emailHtml);

    if (!emailResult.success) {
      errors.push(`Email send error: ${emailResult.error}`);
    }

    // Step 8: Mark findings as covered (so they won't repeat next week)
    if (emailResult.success && findings.length > 0) {
      console.log('Step 8: Marking findings as covered...');
      try {
        await markFindingsAsCovered(findings);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to mark findings as covered: ${errorMsg}`);
        console.error('Failed to mark findings as covered:', error);
      }
    }

    // Send error notification if too many errors
    if (errors.length > 5 && emailResult.success) {
      await sendErrorNotification('morning-digest', errors);
    }

    const duration = Date.now() - startTime;
    console.log(`Morning digest completed in ${duration}ms`);

    const result: CronJobResult = {
      success: emailResult.success,
      jobType: 'morning-digest',
      timestamp: new Date().toISOString(),
      queriesProcessed: findings.length,
      urgentItemsFound: urgentItems.length,
      emailSent: emailResult.success,
      errors,
    };

    return NextResponse.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Morning digest job failed:', error);

    const result: CronJobResult = {
      success: false,
      jobType: 'morning-digest',
      timestamp: new Date().toISOString(),
      queriesProcessed: 0,
      urgentItemsFound: 0,
      emailSent: false,
      errors: [...errors, `Fatal error: ${errorMsg}`],
    };

    return NextResponse.json(result, { status: 500 });
  }
}
