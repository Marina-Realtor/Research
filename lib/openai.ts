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
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.65;
      color: #1F2937;
      max-width: 680px;
      margin: 0 auto;
      padding: 32px 20px;
      background-color: #F9FAFB;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .masthead {
      padding: 48px 40px 40px;
      border-bottom: 1px solid #E5E7EB;
      text-align: center;
    }
    .masthead-date {
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #6B7280;
      margin-bottom: 16px;
    }
    .masthead h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 36px;
      font-weight: 400;
      color: #1F2937;
      margin: 0;
      letter-spacing: -0.02em;
      line-height: 1.15;
    }
    .masthead-subtitle {
      font-size: 14px;
      color: #6B7280;
      margin-top: 8px;
    }
    .content {
      padding: 40px;
    }
    h1, h2, h3 { color: #1F2937; }
    h2 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 24px;
      font-weight: 400;
      margin: 40px 0 4px 0;
      letter-spacing: -0.01em;
    }
    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }
    p { font-size: 15px; margin: 16px 0; }
    .section-divider {
      width: 40px;
      height: 2px;
      background: #0D9488;
      margin-bottom: 28px;
    }
    .urgent {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0 40px 0;
    }
    .urgent-header {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #6B7280;
      margin-bottom: 20px;
    }
    .urgent-item {
      padding: 16px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .urgent-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .priority-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .priority-urgent {
      background: #FEF3E2;
      color: #C2410C;
    }
    .priority-high {
      background: #F0FDFA;
      color: #0D9488;
    }
    .high-priority { color: #C2410C; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
    .action-item {
      padding: 24px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .action-item:last-child { border-bottom: none; }
    .action-item strong {
      font-size: 16px;
      font-weight: 600;
      color: #1F2937;
      display: block;
      margin-bottom: 12px;
    }
    .action-item p { font-size: 15px; line-height: 1.65; color: #374151; margin: 0 0 16px 0; }
    .action-box {
      background: #F9FAFB;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .action-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6B7280;
      display: block;
      margin-bottom: 10px;
    }
    ul { padding-left: 18px; margin: 0; }
    li { font-size: 14px; color: #374151; margin: 6px 0; line-height: 1.5; }
    a { color: #0D9488; text-decoration: none; }
    a:hover { color: #0F766E; }
    .source { font-size: 13px; color: #6B7280; }
    .source a { font-size: 13px; }
    .blog-topic {
      padding: 20px;
      background: #F9FAFB;
      border-radius: 6px;
      margin: 16px 0;
    }
    .blog-topic strong {
      font-size: 15px;
      font-weight: 600;
      color: #1F2937;
      display: block;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    .keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .keyword {
      font-size: 11px;
      color: #6B7280;
      background: #ffffff;
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid #E5E7EB;
      display: inline-block;
    }
    .duplicate { opacity: 0.5; }
    .footer {
      padding: 28px 40px;
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      text-align: center;
    }
    .footer p {
      font-size: 12px;
      color: #6B7280;
      margin: 4px 0;
      line-height: 1.6;
    }
    .footer-brand {
      font-weight: 500;
      color: #0D9488;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="masthead">
      <div class="masthead-date">${formattedDate}</div>
      <h1>El Paso Market Intelligence</h1>
      <p class="masthead-subtitle">Daily Research Digest</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p class="footer-brand">Marina Ramirez Research</p>
      <p>Automated market intelligence for El Paso, Texas</p>
    </div>
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
