import { ResearchFinding, BlogTopic, UrgentItem } from '@/types';

/**
 * Format the morning digest email with structured template
 */
export async function formatMorningEmail(
  findings: ResearchFinding[],
  blogTopics: BlogTopic[],
  urgentItems: UrgentItem[]
): Promise<string> {
  // Organize findings by category
  const marketIntel = findings.filter((f) => f.category === 'market_intel');
  const redditPainPoints = findings.filter((f) => f.category === 'reddit_pain_points');

  // Filter blog topics
  const newTopics = blogTopics.filter((t) => !t.isDuplicate);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Build urgent items section
  const urgentHtml = urgentItems.length > 0 ? `
    <div class="highlight-section">
      <div class="highlight-header">HIGH VALUE ITEMS</div>
      ${urgentItems.map((item) => `
        <div class="highlight-item">
          <span class="priority-badge priority-${item.priority}">${item.priority}</span>
          <p class="highlight-text">${item.summary}</p>
          <span class="highlight-source">${item.source}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  // Build market intel section
  const marketIntelHtml = marketIntel.length > 0 ? `
    <h2>Market Intelligence</h2>
    <div class="section-divider"></div>
    ${marketIntel.map((f) => `
      <article class="intel-card">
        <h3>${f.query}</h3>
        <p class="intel-insight">${f.mostImportantInsight}</p>
        ${f.actionItems.length > 0 ? `
          <div class="action-box">
            <span class="action-label">Action Items</span>
            <ul>
              ${f.actionItems.map((a) => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <div class="source">
          ${f.sources.map((s) => `<a href="${s.url}">${s.title}</a>`).join(' · ')}
        </div>
      </article>
    `).join('')}
  ` : '';

  // Build reddit pain points section
  const redditHtml = redditPainPoints.length > 0 ? `
    <h2>Community Pulse</h2>
    <p class="section-subtitle">What people are asking about El Paso & Fort Bliss</p>
    <div class="section-divider"></div>
    ${redditPainPoints.map((f) => `
      <article class="pulse-card">
        <h3 class="pulse-title">${f.query.replace('site:reddit.com ', '')}</h3>
        <ul class="pulse-list">
          ${f.painPoints.map((p) => `
            <li>
              <span class="pulse-text">${p.description}</span>
              <span class="pulse-source">${p.source || ''}</span>
            </li>
          `).join('')}
        </ul>
      </article>
    `).join('')}
  ` : '';

  // Build blog topics section
  const blogHtml = newTopics.length > 0 ? `
    <h2>Content Opportunities</h2>
    <p class="section-subtitle">Blog topics to capture organic traffic</p>
    <div class="section-divider"></div>
    <div class="topics-grid">
      ${newTopics.map((t, i) => `
        <div class="topic-card">
          <span class="topic-number">${String(i + 1).padStart(2, '0')}</span>
          <strong class="topic-title">${t.title}</strong>
          <div class="topic-keywords">
            ${t.targetKeywords.map((k) => `<span class="keyword">${k}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const bodyContent = `
    <p class="greeting">Good morning, Marina.</p>
    <p class="subgreeting">Here's your El Paso market intelligence for ${formattedDate}.</p>
    ${urgentHtml}
    ${marketIntelHtml}
    ${redditHtml}
    ${blogHtml}
    <p class="signoff">That's all for today. Reach out if you'd like any of these expanded.</p>
  `;

  return wrapEmailHtml(bodyContent);
}

/**
 * Format the evening catch-up email with structured template
 */
export async function formatEveningEmail(
  urgentItems: UrgentItem[]
): Promise<string> {
  if (urgentItems.length === 0) {
    return wrapEmailHtml('<p>No new urgent items found this evening.</p>');
  }

  const bodyContent = `
    <p class="greeting">Good evening, Marina.</p>
    <p class="subgreeting">${urgentItems.length} new update${urgentItems.length > 1 ? 's' : ''} found since this morning.</p>

    <div class="highlight-section">
      <div class="highlight-header">EVENING UPDATES</div>
      ${urgentItems.map((item) => `
        <div class="highlight-item">
          <span class="priority-badge priority-${item.priority}">${item.priority}</span>
          <p class="highlight-text">${item.summary}</p>
          <span class="highlight-source">${item.source}</span>
        </div>
      `).join('')}
    </div>

    <p class="signoff">Review these and take action if needed.</p>
  `;

  return wrapEmailHtml(bodyContent);
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
      color: #1F2937;
      margin: 0 0 12px 0;
    }
    p { font-size: 15px; margin: 16px 0; }
    .greeting {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 24px;
      font-weight: 400;
      color: #1F2937;
      margin: 0 0 4px 0;
    }
    .subgreeting {
      font-size: 15px;
      color: #6B7280;
      margin: 0 0 32px 0;
    }
    .section-subtitle {
      font-size: 14px;
      color: #6B7280;
      margin: 0 0 16px 0;
    }
    .signoff {
      font-size: 15px;
      color: #6B7280;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #E5E7EB;
    }
    .section-divider {
      width: 40px;
      height: 2px;
      background: #0D9488;
      margin-bottom: 28px;
    }
    /* Highlight Section (High Value Items) */
    .highlight-section {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 24px;
      margin: 0 0 40px 0;
    }
    .highlight-header {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #6B7280;
      margin-bottom: 20px;
    }
    .highlight-item {
      padding: 16px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .highlight-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .highlight-text {
      font-size: 15px;
      line-height: 1.55;
      color: #1F2937;
      margin: 0 0 8px 0;
    }
    .highlight-source {
      font-size: 13px;
      color: #6B7280;
      font-style: italic;
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
    .priority-medium {
      background: #F9FAFB;
      color: #6B7280;
    }
    /* Intel Cards */
    .intel-card {
      padding: 24px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .intel-card:last-child { border-bottom: none; }
    .intel-insight {
      font-size: 15px;
      line-height: 1.65;
      color: #374151;
      margin: 0 0 16px 0;
    }
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
    .source { font-size: 13px; color: #6B7280; margin-top: 12px; }
    .source a { font-size: 13px; }
    /* Pulse Cards (Community) */
    .pulse-card {
      padding: 20px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .pulse-card:last-child { border-bottom: none; }
    .pulse-title {
      font-size: 15px;
      font-weight: 600;
      color: #1F2937;
      margin: 0 0 12px 0;
      text-transform: capitalize;
    }
    .pulse-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .pulse-list li {
      display: block;
      padding: 8px 0;
      border-bottom: 1px dashed #E5E7EB;
    }
    .pulse-list li:last-child { border-bottom: none; }
    .pulse-text {
      font-size: 14px;
      color: #374151;
    }
    .pulse-source {
      font-size: 12px;
      color: #6B7280;
      background: #F9FAFB;
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 8px;
    }
    /* Topics Grid */
    .topics-grid {
      display: block;
    }
    .topic-card {
      padding: 20px;
      background: #F9FAFB;
      border-radius: 6px;
      margin: 16px 0;
      position: relative;
    }
    .topic-number {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 32px;
      color: #E5E7EB;
      position: absolute;
      top: 12px;
      right: 16px;
      line-height: 1;
    }
    .topic-title {
      font-size: 15px;
      font-weight: 600;
      color: #1F2937;
      display: block;
      margin-bottom: 12px;
      padding-right: 40px;
      line-height: 1.4;
    }
    .topic-keywords {
      display: block;
    }
    .keyword {
      font-size: 11px;
      color: #6B7280;
      background: #ffffff;
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid #E5E7EB;
      display: inline-block;
      margin: 3px 3px 3px 0;
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
