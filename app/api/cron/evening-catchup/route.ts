import { NextResponse } from 'next/server';
import { processQueries, isUrgentResult } from '@/lib/perplexity';
import { formatEveningEmail } from '@/lib/emailTemplates';
import { sendEveningCatchup } from '@/lib/resend';
import {
  loadMorningUrgentItems,
  saveEveningUrgentItems,
  filterNewUrgentItems,
  findingToUrgentItem,
} from '@/lib/urgentTracker';
import { getEveningQueries } from '@/lib/queries';
import { CronJobResult, UrgentItem } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute max for evening catchup

/**
 * Verify cron secret if configured
 */
function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

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

  console.log('Starting evening catchup job...');

  try {
    // Step 1: Load morning urgent items for comparison
    console.log('Step 1: Loading morning urgent items...');
    const morningUrgentItems = await loadMorningUrgentItems();
    console.log(`Found ${morningUrgentItems.length} morning urgent items`);

    // Step 2: Process evening queries (urgent news only)
    console.log('Step 2: Processing evening queries...');
    const queries = getEveningQueries();
    const { findings, errors: queryErrors } = await processQueries(queries, true);
    errors.push(...queryErrors);
    console.log(`Processed ${findings.length} queries with ${queryErrors.length} errors`);

    // Step 3: Filter for urgent results only
    console.log('Step 3: Filtering urgent results...');
    const urgentFindings = findings.filter(isUrgentResult);
    const eveningUrgentItems: UrgentItem[] = urgentFindings.map(findingToUrgentItem);
    console.log(`Found ${eveningUrgentItems.length} urgent items from queries`);

    // Step 4: Filter out items already found in morning
    console.log('Step 4: Filtering out morning duplicates...');
    const newUrgentItems = filterNewUrgentItems(eveningUrgentItems, morningUrgentItems);
    console.log(`Found ${newUrgentItems.length} NEW urgent items`);

    // Save evening items regardless
    await saveEveningUrgentItems(newUrgentItems);

    // Step 5: Only send email if there are NEW urgent items
    let emailSent = false;
    if (newUrgentItems.length > 0) {
      console.log('Step 5: Formatting and sending email...');
      const emailHtml = await formatEveningEmail(newUrgentItems);
      const emailResult = await sendEveningCatchup(emailHtml, newUrgentItems.length);

      if (!emailResult.success) {
        errors.push(`Email send error: ${emailResult.error}`);
      }
      emailSent = emailResult.success;
    } else {
      console.log('Step 5: No new urgent items, skipping email');
    }

    const duration = Date.now() - startTime;
    console.log(`Evening catchup completed in ${duration}ms`);

    const result: CronJobResult = {
      success: true,
      jobType: 'evening-catchup',
      timestamp: new Date().toISOString(),
      queriesProcessed: findings.length,
      urgentItemsFound: newUrgentItems.length,
      emailSent,
      errors,
    };

    return NextResponse.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Evening catchup job failed:', error);

    const result: CronJobResult = {
      success: false,
      jobType: 'evening-catchup',
      timestamp: new Date().toISOString(),
      queriesProcessed: 0,
      urgentItemsFound: 0,
      emailSent: false,
      errors: [...errors, `Fatal error: ${errorMsg}`],
    };

    return NextResponse.json(result, { status: 500 });
  }
}
