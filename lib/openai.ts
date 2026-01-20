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

This digest is EXCLUSIVELY focused on the El Paso, Texas real estate market. Write in a warm, professional tone. Marina is busy and needs actionable insights quickly.

## Today's El Paso Market Research

### Market Intelligence
${marketIntel.map((f) => `
**Query:** ${f.query}
**Key Findings:** ${f.keyFindings.join('; ')}
**Most Important:** ${f.mostImportantInsight}
**Action Items:** ${f.actionItems.join('; ')}
**Priority:** ${f.priority}
**Sources:** ${f.sources.map((s) => `${s.title} (${s.url})`).join('; ')}
`).join('\n')}

### Reddit Pain Points (What People Are Asking About El Paso)
${redditPainPoints.map((f) => `
**Query:** ${f.query}
**Pain Points:** ${f.painPoints.map((p) => p.description).join('; ')}
**What People Want:** ${f.solutionRequests.join('; ')}
**Action Items:** ${f.actionItems.join('; ')}
**Sources:** ${f.sources.map((s) => `${s.title} (${s.url})`).join('; ')}
`).join('\n')}

${urgentItems.length > 0 ? `
### Urgent Items Requiring Attention
${urgentItems.map((item) => `- **${item.priority.toUpperCase()}:** ${item.summary} (Source: ${item.source})`).join('\n')}
` : ''}

### Blog Topic Recommendations for El Paso SEO
${newTopics.length > 0 ? `
**New Topics to Write:**
${newTopics.map((t) => `- ${t.title} (Keywords: ${t.targetKeywords.join(', ')})`).join('\n')}
` : 'No new blog topic recommendations today.'}

${duplicateTopics.length > 0 ? `
**Already Covered (skip these):**
${duplicateTopics.map((t) => `- ${t.title} → Similar to: ${t.existingPostTitle}`).join('\n')}
` : ''}

Format as clean HTML email with:
- ALL CONTENT CENTERED in the email
- Teal (#0D9488) for headers and accents
- Orange (#F97316) for urgent/important callouts
- Clear section headers (centered)
- Content blocks centered with max-width
- ALWAYS include source links for each finding
- Larger font sizes (body 16px, headers 18-26px)
- Mobile-friendly centered layout
- Professional but warm tone
- No emojis
- Include a brief greeting and sign-off
- Focus on El Paso market only

Return ONLY the HTML body content (no <html> or <head> tags, as these are already provided).`;

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
      line-height: 1.7;
      color: #1F2937;
      max-width: 650px;
      margin: 0 auto;
      padding: 24px;
      background-color: #ffffff;
      text-align: center;
    }
    h1, h2, h3 { color: #0D9488; margin-top: 28px; text-align: center; }
    h1 { font-size: 26px; border-bottom: 2px solid #0D9488; padding-bottom: 10px; }
    h2 { font-size: 22px; }
    h3 { font-size: 18px; }
    p { font-size: 16px; text-align: center; }
    .urgent {
      background-color: #FEF3C7;
      border-left: 4px solid #F97316;
      padding: 14px 18px;
      margin: 18px auto;
      border-radius: 6px;
      text-align: left;
      max-width: 580px;
    }
    .high-priority { color: #F97316; font-weight: bold; font-size: 15px; }
    .action-item {
      background-color: #F0FDFA;
      padding: 12px 16px;
      margin: 8px auto;
      border-radius: 6px;
      border-left: 4px solid #0D9488;
      text-align: left;
      max-width: 580px;
    }
    .action-item strong { font-size: 16px; }
    .action-item p { font-size: 15px; text-align: left; margin: 8px 0; }
    ul { padding-left: 24px; text-align: left; max-width: 580px; margin: 0 auto; }
    li { margin: 10px 0; font-size: 15px; }
    a { color: #0D9488; font-size: 15px; }
    .source { font-size: 13px; color: #6B7280; font-style: italic; margin-top: 6px; }
    .footer {
      margin-top: 36px;
      padding-top: 18px;
      border-top: 1px solid #E5E7EB;
      font-size: 13px;
      color: #6B7280;
      text-align: center;
    }
    .blog-topic {
      background-color: #F9FAFB;
      padding: 14px;
      margin: 10px auto;
      border-radius: 6px;
      text-align: left;
      max-width: 580px;
    }
    .blog-topic strong { font-size: 16px; }
    .blog-topic small { font-size: 14px; }
    .duplicate {
      opacity: 0.6;
      text-decoration: line-through;
    }
    .market-header {
      background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .market-header h1 { color: white; border-bottom: none; margin: 0; font-size: 28px; }
    .market-header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 15px; }
  </style>
</head>
<body>
<div class="market-header">
  <h1>El Paso Market Intelligence</h1>
  <p>Daily Research Digest for Marina Ramirez</p>
</div>
${bodyContent}
<div class="footer">
  <p>This is an automated research digest from your Marina Research system.</p>
  <p>Focused exclusively on the El Paso, Texas real estate market.</p>
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
        <h3 style="text-align: left; margin-top: 0;">Urgent Items</h3>
        <ul>
          ${urgentItems.map((item) => `<li><span class="high-priority">${item.priority.toUpperCase()}:</span> ${item.summary}<br><span class="source">Source: ${item.source}</span></li>`).join('')}
        </ul>
      </div>`
    : '';

  const bodyContent = `
<p>Good morning, Marina. Here's your El Paso market research update for ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>

${urgentHtml}

<h2>El Paso Market Intelligence</h2>
${marketIntel.map((f) => `
<div class="action-item">
  <strong>${f.query}</strong>
  <p>${f.mostImportantInsight}</p>
  ${f.actionItems.length > 0 ? `<p><em>Action:</em> ${f.actionItems[0]}</p>` : ''}
  ${f.sources.length > 0 ? `<p class="source">Source: <a href="${f.sources[0].url}">${f.sources[0].title}</a></p>` : ''}
</div>
`).join('')}

<h2>Reddit Pain Points</h2>
<p>What people are asking about El Paso and Fort Bliss:</p>
<ul>
${redditPainPoints.flatMap((f) => f.painPoints.map((p) => `<li>${p.description}${p.source ? `<br><span class="source">Source: ${p.source}</span>` : ''}</li>`)).join('')}
</ul>

<h2>Blog Topic Ideas for El Paso SEO</h2>
${newTopics.length > 0
  ? newTopics.map((t) => `<div class="blog-topic"><strong>${t.title}</strong><br><small>Target Keywords: ${t.targetKeywords.join(', ')}</small></div>`).join('')
  : '<p>No new blog topics recommended today.</p>'}

<p style="margin-top: 28px;">Have a great day!</p>
<p><em style="font-size: 13px;">Note: This email was formatted with the fallback system due to a processing issue.</em></p>
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
