import OpenAI from 'openai';
import { ResearchFinding, BlogTopic, UrgentItem } from '@/types';

/**
 * Format the morning digest email using GPT-4o
 */
export async function formatMorningEmail(
  findings: ResearchFinding[],
  blogTopics: BlogTopic[],
  urgentItems: UrgentItem[]
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OPENAI_API_KEY not configured, using fallback format');
    return generateFallbackMorningEmail(findings, blogTopics, urgentItems);
  }

  const openai = new OpenAI({ apiKey });

  // Organize findings by category
  const marketIntel = findings.filter((f) => f.category === 'market_intel');
  const redditPainPoints = findings.filter((f) => f.category === 'reddit_pain_points');

  // Filter blog topics
  const newTopics = blogTopics.filter((t) => !t.isDuplicate);
  const duplicateTopics = blogTopics.filter((t) => t.isDuplicate);

  const prompt = `Create a professional HTML email digest for Marina Ramirez, a real estate agent in El Paso, Texas who specializes in Fort Bliss military relocations and first-time home buyers.

Write in a warm, professional tone. Marina is busy and needs actionable insights quickly.

## Today's Research Findings

### Market Intelligence
${marketIntel.map((f) => `
**Query:** ${f.query}
**Key Findings:** ${f.keyFindings.join('; ')}
**Most Important:** ${f.mostImportantInsight}
**Action Items:** ${f.actionItems.join('; ')}
**Priority:** ${f.priority}
`).join('\n')}

### Reddit Pain Points (What People Are Asking)
${redditPainPoints.map((f) => `
**Query:** ${f.query}
**Pain Points:** ${f.painPoints.map((p) => p.description).join('; ')}
**What People Want:** ${f.solutionRequests.join('; ')}
**Action Items:** ${f.actionItems.join('; ')}
`).join('\n')}

${urgentItems.length > 0 ? `
### Urgent Items Requiring Attention
${urgentItems.map((item) => `- **${item.priority.toUpperCase()}:** ${item.summary}`).join('\n')}
` : ''}

### Blog Topic Recommendations
${newTopics.length > 0 ? `
**New Topics to Write:**
${newTopics.map((t) => `- ${t.title} (Keywords: ${t.targetKeywords.join(', ')})`).join('\n')}
` : 'No new blog topic recommendations today.'}

${duplicateTopics.length > 0 ? `
**Already Covered (skip these):**
${duplicateTopics.map((t) => `- ${t.title} → Similar to: ${t.existingPostTitle}`).join('\n')}
` : ''}

Format as clean HTML email with:
- Teal (#0D9488) for headers and accents
- Orange (#F97316) for urgent/important callouts
- Clear section headers
- Bullet points for easy scanning
- Mobile-friendly layout
- Professional but warm tone
- No emojis
- Include a brief greeting and sign-off

Return ONLY the HTML body content (no <html> or <head> tags).`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional email writer for a real estate marketing firm. Write concise, actionable email digests. Return only HTML content, no markdown.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const htmlContent = response.choices[0]?.message?.content || '';
    return wrapEmailHtml(htmlContent);
  } catch (error) {
    console.error('OpenAI formatting error:', error);
    return generateFallbackMorningEmail(findings, blogTopics, urgentItems);
  }
}

/**
 * Format the evening catch-up email using GPT-4o
 */
export async function formatEveningEmail(
  urgentItems: UrgentItem[]
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || urgentItems.length === 0) {
    return generateFallbackEveningEmail(urgentItems);
  }

  const openai = new OpenAI({ apiKey });

  const prompt = `Create a brief HTML email alert for Marina Ramirez about ${urgentItems.length} urgent real estate market update(s) found since this morning.

## Urgent Items
${urgentItems.map((item) => `
- **${item.priority.toUpperCase()}:** ${item.summary}
  Source: ${item.source}
  Category: ${item.category}
`).join('\n')}

Format as a clean, mobile-friendly HTML email:
- Yellow (#FEF3C7) alert box at the top
- Orange (#F97316) border for emphasis
- Teal (#0D9488) for headers
- Brief greeting acknowledging it's an evening update
- Clear action items if applicable
- Keep it short - this is a quick alert, not a full digest
- No emojis
- Professional tone

Return ONLY the HTML body content.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional email writer. Create brief, urgent alert emails. Return only HTML content.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const htmlContent = response.choices[0]?.message?.content || '';
    return wrapEmailHtml(htmlContent);
  } catch (error) {
    console.error('OpenAI evening formatting error:', error);
    return generateFallbackEveningEmail(urgentItems);
  }
}

/**
 * Wrap HTML content in email-safe structure
 */
function wrapEmailHtml(bodyContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1F2937;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    h1, h2, h3 { color: #0D9488; margin-top: 24px; }
    h1 { font-size: 24px; border-bottom: 2px solid #0D9488; padding-bottom: 8px; }
    h2 { font-size: 20px; }
    h3 { font-size: 16px; }
    .urgent {
      background-color: #FEF3C7;
      border-left: 4px solid #F97316;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
    .high-priority { color: #F97316; font-weight: bold; }
    .action-item {
      background-color: #F0FDFA;
      padding: 8px 12px;
      margin: 4px 0;
      border-radius: 4px;
      border-left: 3px solid #0D9488;
    }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    a { color: #0D9488; }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
      font-size: 12px;
      color: #6B7280;
    }
    .blog-topic {
      background-color: #F9FAFB;
      padding: 12px;
      margin: 8px 0;
      border-radius: 4px;
    }
    .duplicate {
      opacity: 0.6;
      text-decoration: line-through;
    }
  </style>
</head>
<body>
${bodyContent}
<div class="footer">
  <p>This is an automated research digest from your Marina Research system.</p>
  <p>research.marina-ramirez.com</p>
</div>
</body>
</html>`;
}

/**
 * Generate fallback morning email if OpenAI fails
 */
function generateFallbackMorningEmail(
  findings: ResearchFinding[],
  blogTopics: BlogTopic[],
  urgentItems: UrgentItem[]
): string {
  const marketIntel = findings.filter((f) => f.category === 'market_intel');
  const redditPainPoints = findings.filter((f) => f.category === 'reddit_pain_points');
  const newTopics = blogTopics.filter((t) => !t.isDuplicate);

  const urgentHtml = urgentItems.length > 0
    ? `<div class="urgent">
        <h3>Urgent Items</h3>
        <ul>
          ${urgentItems.map((item) => `<li><span class="high-priority">${item.priority.toUpperCase()}:</span> ${item.summary}</li>`).join('')}
        </ul>
      </div>`
    : '';

  const bodyContent = `
<h1>Daily Research Digest</h1>
<p>Good morning, Marina. Here's your research update for ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>

${urgentHtml}

<h2>Market Intelligence</h2>
${marketIntel.map((f) => `
<div class="action-item">
  <strong>${f.query}</strong>
  <p>${f.mostImportantInsight}</p>
  ${f.actionItems.length > 0 ? `<p><em>Action:</em> ${f.actionItems[0]}</p>` : ''}
</div>
`).join('')}

<h2>Reddit Pain Points</h2>
<p>What people are asking about El Paso and Fort Bliss:</p>
<ul>
${redditPainPoints.flatMap((f) => f.painPoints.map((p) => `<li>${p.description}</li>`)).join('')}
</ul>

<h2>Blog Topic Ideas</h2>
${newTopics.length > 0
  ? `<ul>${newTopics.map((t) => `<li class="blog-topic"><strong>${t.title}</strong><br><small>Keywords: ${t.targetKeywords.join(', ')}</small></li>`).join('')}</ul>`
  : '<p>No new blog topics recommended today.</p>'}

<p style="margin-top: 24px;">Have a great day!</p>
<p><em>Note: This email was formatted with the fallback system due to a processing issue.</em></p>
`;

  return wrapEmailHtml(bodyContent);
}

/**
 * Generate fallback evening email if OpenAI fails
 */
function generateFallbackEveningEmail(urgentItems: UrgentItem[]): string {
  if (urgentItems.length === 0) {
    return wrapEmailHtml('<p>No new urgent items found this evening.</p>');
  }

  const bodyContent = `
<h1>Evening Update</h1>
<p>Good evening, Marina. Here are ${urgentItems.length} new urgent item(s) found since this morning:</p>

<div class="urgent">
  <ul>
    ${urgentItems.map((item) => `
      <li>
        <span class="high-priority">${item.priority.toUpperCase()}:</span> ${item.summary}
        <br><small>Source: ${item.source} | Category: ${item.category}</small>
      </li>
    `).join('')}
  </ul>
</div>

<p>Review these items and take action if needed.</p>
<p><em>Note: This email was formatted with the fallback system.</em></p>
`;

  return wrapEmailHtml(bodyContent);
}
