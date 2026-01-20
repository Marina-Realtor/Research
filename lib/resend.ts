import { Resend } from 'resend';

const EMAIL_CONFIG = {
  from: 'Marina Research <noreply@marina-ramirez.com>',
  to: 'hello@edwardguillen.com', // TODO: Change back to Info@marina-ramirez.com after testing
};

/**
 * Get Resend client instance
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Format date for email subject
 */
function formatDateForSubject(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Send the morning digest email
 */
export async function sendMorningDigest(
  htmlBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Resend not configured' };
  }

  const subject = `Daily Research Digest - ${formatDateForSubject()}`;

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error('Resend error:', error);
      // Retry once on failure
      console.log('Retrying email send...');
      const retry = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: EMAIL_CONFIG.to,
        subject,
        html: htmlBody,
      });

      if (retry.error) {
        return { success: false, error: retry.error.message };
      }
      return { success: true, messageId: retry.data?.id };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email send failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send the evening catch-up email
 */
export async function sendEveningCatchup(
  htmlBody: string,
  urgentCount: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Resend not configured' };
  }

  const subject = `Evening Update: ${urgentCount} new item${urgentCount !== 1 ? 's' : ''} - ${formatDateForSubject()}`;

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error('Resend error:', error);
      // Retry once
      const retry = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: EMAIL_CONFIG.to,
        subject,
        html: htmlBody,
      });

      if (retry.error) {
        return { success: false, error: retry.error.message };
      }
      return { success: true, messageId: retry.data?.id };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Evening email send failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send a test email to verify configuration
 */
export async function sendTestEmail(): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Resend not configured' };
  }

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1F2937; }
    h1 { color: #0D9488; }
    .success { background-color: #D1FAE5; border-left: 4px solid #0D9488; padding: 12px; margin: 16px 0; }
  </style>
</head>
<body>
  <h1>Marina Research System - Test Email</h1>
  <div class="success">
    <p><strong>Email configuration is working correctly!</strong></p>
    <p>This test email confirms that your Resend integration is properly configured.</p>
  </div>
  <p><strong>Configuration Details:</strong></p>
  <ul>
    <li>From: ${EMAIL_CONFIG.from}</li>
    <li>To: ${EMAIL_CONFIG.to}</li>
    <li>Timestamp: ${new Date().toISOString()}</li>
  </ul>
  <p>Your morning digest will arrive at 6:30 AM CT, and evening updates (if any) at 8:00 PM CT.</p>
  <hr>
  <p style="font-size: 12px; color: #6B7280;">research.marina-ramirez.com</p>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      subject: 'Marina Research System - Test Email',
      html: htmlBody,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Send an error notification email
 */
export async function sendErrorNotification(
  jobType: string,
  errors: string[]
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Resend not configured' };
  }

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1F2937; }
    h1 { color: #EF4444; }
    .error { background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 12px; margin: 16px 0; }
    code { background-color: #F3F4F6; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Research System Error</h1>
  <p>The <strong>${jobType}</strong> job encountered ${errors.length} error(s):</p>
  <div class="error">
    <ul>
      ${errors.map((e) => `<li><code>${e}</code></li>`).join('')}
    </ul>
  </div>
  <p>Please check the Vercel logs for more details.</p>
  <hr>
  <p style="font-size: 12px; color: #6B7280;">Timestamp: ${new Date().toISOString()}</p>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      subject: `Research System Error - ${jobType}`,
      html: htmlBody,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
