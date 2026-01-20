import { NextResponse } from 'next/server';
import { ResearchFinding, BlogTopic, UrgentItem } from '@/types';

export const dynamic = 'force-dynamic';

// Dummy data for preview
const dummyFindings: ResearchFinding[] = [
  {
    query: 'El Paso Texas real estate market update 2026',
    project: 'marina',
    category: 'market_intel',
    keyFindings: [
      'Median home prices increased to $274,950',
      'Market transitioning to balanced conditions',
      '2-4% price growth forecast for 2026',
    ],
    mostImportantInsight: 'El Paso median home prices have risen to $274,950, with experts forecasting 2-4% growth in 2026. The market is shifting toward balanced conditions, creating excellent opportunities for first-time buyers.',
    painPoints: [],
    solutionRequests: [],
    actionItems: [
      'Update listing presentations with 2026 market data',
      'Create social media content about price trends',
    ],
    priority: 'high',
    sources: [
      { title: 'El Paso Times Real Estate', url: 'https://elpasotimes.com/real-estate' },
      { title: 'Zillow Market Report', url: 'https://zillow.com/el-paso' },
    ],
    rawResponse: '',
    timestamp: new Date().toISOString(),
  },
  {
    query: 'Fort Bliss BAH rates 2026',
    project: 'marina',
    category: 'market_intel',
    keyFindings: [
      'BAH rates increased by 4.2% for 2026',
      'E-5 with dependents: $1,632/month',
      'O-3 with dependents: $2,148/month',
    ],
    mostImportantInsight: 'Fort Bliss BAH rates increased 4.2% for 2026, giving military families more purchasing power. An E-5 with dependents now receives $1,632/month, while an O-3 gets $2,148/month.',
    painPoints: [],
    solutionRequests: [],
    actionItems: [
      'Create BAH calculator for military clients',
      'Update military relocation guide with new rates',
    ],
    priority: 'high',
    sources: [
      { title: 'Defense.gov BAH Calculator', url: 'https://www.defensetravel.dod.mil/site/bahCalc.cfm' },
    ],
    rawResponse: '',
    timestamp: new Date().toISOString(),
  },
  {
    query: 'site:reddit.com moving to El Paso',
    project: 'marina',
    category: 'reddit_pain_points',
    keyFindings: [
      'Many people asking about safe neighborhoods',
      'Concerns about commute times to Fort Bliss',
      'Questions about school districts',
    ],
    mostImportantInsight: 'Reddit users moving to El Paso are most concerned about finding safe neighborhoods with good schools and reasonable commutes to Fort Bliss.',
    painPoints: [
      { description: 'Unsure which neighborhoods are safe for families', frequency: 'common', source: 'r/ElPaso' },
      { description: 'Confused about east side vs west side differences', frequency: 'common', source: 'r/ElPaso' },
      { description: 'Worried about finding homes within BAH budget', frequency: 'occasional', source: 'r/Military' },
    ],
    solutionRequests: [
      'Need a neighborhood guide with crime stats',
      'Want to know best areas near Fort Bliss',
    ],
    actionItems: [
      'Create neighborhood comparison guide',
      'Write blog post about east vs west El Paso',
    ],
    priority: 'medium',
    sources: [
      { title: 'r/ElPaso', url: 'https://reddit.com/r/ElPaso' },
      { title: 'r/Military', url: 'https://reddit.com/r/Military' },
    ],
    rawResponse: '',
    timestamp: new Date().toISOString(),
  },
  {
    query: 'site:reddit.com Fort Bliss housing advice',
    project: 'marina',
    category: 'reddit_pain_points',
    keyFindings: [
      'PCS families asking about buy vs rent decision',
      'Concerns about resale value after PCS',
    ],
    mostImportantInsight: 'Military families PCSing to Fort Bliss are torn between buying and renting, worried about resale if they get orders in 2-3 years.',
    painPoints: [
      { description: 'Should I buy or rent for a 3-year assignment?', frequency: 'common', source: 'r/MilitaryFinance' },
      { description: 'Will I lose money if I have to sell quickly?', frequency: 'occasional', source: 'r/Military' },
    ],
    solutionRequests: [
      'Break-even calculator for buying vs renting',
      'Info on property management for PCS moves',
    ],
    actionItems: [
      'Create buy vs rent calculator for military',
      'Partner with property management company',
    ],
    priority: 'medium',
    sources: [
      { title: 'r/MilitaryFinance', url: 'https://reddit.com/r/MilitaryFinance' },
    ],
    rawResponse: '',
    timestamp: new Date().toISOString(),
  },
];

const dummyUrgentItems: UrgentItem[] = [
  {
    project: 'marina',
    summary: 'New down payment assistance program announced for El Paso County - up to $20,000 for first-time buyers',
    source: 'El Paso County Housing Authority',
    priority: 'urgent',
    category: 'market_intel',
    timestamp: new Date().toISOString(),
  },
  {
    project: 'marina',
    summary: 'Fort Bliss announces expansion - 2,000 new personnel expected by Q3 2026',
    source: 'Fort Bliss Public Affairs',
    priority: 'high',
    category: 'market_intel',
    timestamp: new Date().toISOString(),
  },
];

const dummyBlogTopics: BlogTopic[] = [
  {
    title: '2026 Fort Bliss BAH Rates: Complete Guide for Military Home Buyers',
    targetKeywords: ['Fort Bliss BAH 2026', 'military housing El Paso', 'BAH calculator'],
    project: 'marina',
    isDuplicate: false,
  },
  {
    title: 'Best Neighborhoods Near Fort Bliss: A Military Family Guide',
    targetKeywords: ['neighborhoods near Fort Bliss', 'El Paso military housing', 'safe areas El Paso'],
    project: 'marina',
    isDuplicate: false,
  },
  {
    title: 'First-Time Home Buyer Programs in El Paso: $45,000 in Available Assistance',
    targetKeywords: ['El Paso first time buyer', 'down payment assistance El Paso', 'Texas home buyer programs'],
    project: 'marina',
    isDuplicate: false,
  },
];

/**
 * Generate the preview HTML directly (bypassing OpenAI for instant preview)
 */
function generatePreviewHtml(): string {
  const marketIntel = dummyFindings.filter((f) => f.category === 'market_intel');
  const redditPainPoints = dummyFindings.filter((f) => f.category === 'reddit_pain_points');

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const urgentHtml = `
    <div class="highlight-section">
      <div class="highlight-header">
        <span class="highlight-icon">&#9733;</span>
        <span class="highlight-title">High Value Items</span>
      </div>
      ${dummyUrgentItems.map((item) => `
        <div class="highlight-item">
          <span class="priority-badge ${item.priority}">${item.priority}</span>
          <p class="highlight-text">${item.summary}</p>
          <span class="highlight-source">${item.source}</span>
        </div>
      `).join('')}
    </div>
  `;

  const bodyContent = `
<p class="greeting">Good morning, Marina.</p>
<p class="subgreeting">Here's your El Paso market intelligence for ${formattedDate}.</p>

${urgentHtml}

<div class="section">
  <h2 class="section-title">Market Intelligence</h2>
  <div class="section-divider"></div>

  ${marketIntel.map((f) => `
  <article class="intel-card">
    <h3 class="intel-title">${f.query}</h3>
    <p class="intel-insight">${f.mostImportantInsight}</p>
    <div class="intel-actions">
      <span class="actions-label">Action Items</span>
      <ul class="actions-list">
        ${f.actionItems.map((a) => `<li>${a}</li>`).join('')}
      </ul>
    </div>
    <div class="intel-sources">
      ${f.sources.map((s) => `<a href="${s.url}" class="source-link">${s.title}</a>`).join('')}
    </div>
  </article>
  `).join('')}
</div>

<div class="section">
  <h2 class="section-title">Community Pulse</h2>
  <p class="section-subtitle">What people are asking about El Paso & Fort Bliss</p>
  <div class="section-divider"></div>

  ${redditPainPoints.map((f) => `
  <article class="pulse-card">
    <h3 class="pulse-title">${f.query.replace('site:reddit.com ', '')}</h3>
    <ul class="pulse-list">
      ${f.painPoints.map((p) => `
        <li>
          <span class="pulse-text">${p.description}</span>
          <span class="pulse-source">${p.source}</span>
        </li>
      `).join('')}
    </ul>
  </article>
  `).join('')}
</div>

<div class="section">
  <h2 class="section-title">Content Opportunities</h2>
  <p class="section-subtitle">Blog topics to capture organic traffic</p>
  <div class="section-divider"></div>

  <div class="topics-grid">
    ${dummyBlogTopics.map((t, i) => `
    <div class="topic-card">
      <span class="topic-number">${String(i + 1).padStart(2, '0')}</span>
      <h4 class="topic-title">${t.title}</h4>
      <div class="topic-keywords">
        ${t.targetKeywords.map((k) => `<span class="keyword">${k}</span>`).join('')}
      </div>
    </div>
    `).join('')}
  </div>
</div>

<p class="signoff">That's all for today. Reach out if you'd like any of these expanded.</p>
`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Preview - El Paso Market Intelligence</title>
  <style>
    * {
      box-sizing: border-box;
    }

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

    .greeting {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 24px;
      font-weight: 400;
      color: #1F2937;
      margin: 0 0 4px 0;
      text-align: left;
    }

    .subgreeting {
      font-size: 15px;
      color: #6B7280;
      margin: 0 0 32px 0;
      text-align: left;
    }

    /* High Value Items */
    .highlight-section {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 40px;
    }

    .highlight-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }

    .highlight-icon {
      color: #0D9488;
      font-size: 14px;
    }

    .highlight-title {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #6B7280;
    }

    .highlight-item {
      padding: 16px 0;
      border-bottom: 1px solid #E5E7EB;
    }

    .highlight-item:last-child {
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

    .priority-badge.urgent {
      background: #FEF3E2;
      color: #C2410C;
    }

    .priority-badge.high {
      background: #F0FDFA;
      color: #0D9488;
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

    /* Sections */
    .section {
      margin-bottom: 48px;
    }

    .section-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 26px;
      font-weight: 400;
      color: #1F2937;
      margin: 0 0 4px 0;
      letter-spacing: -0.01em;
    }

    .section-subtitle {
      font-size: 14px;
      color: #6B7280;
      margin: 0 0 16px 0;
    }

    .section-divider {
      width: 40px;
      height: 2px;
      background: #0D9488;
      margin-bottom: 28px;
    }

    /* Intel Cards */
    .intel-card {
      padding: 24px 0;
      border-bottom: 1px solid #E5E7EB;
    }

    .intel-card:last-child {
      border-bottom: none;
    }

    .intel-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #1F2937;
      margin: 0 0 12px 0;
    }

    .intel-insight {
      font-size: 15px;
      line-height: 1.65;
      color: #374151;
      margin: 0 0 16px 0;
    }

    .intel-actions {
      background: #F9FAFB;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 12px;
    }

    .actions-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6B7280;
      display: block;
      margin-bottom: 10px;
    }

    .actions-list {
      margin: 0;
      padding-left: 18px;
    }

    .actions-list li {
      font-size: 14px;
      color: #374151;
      margin: 6px 0;
      line-height: 1.5;
    }

    .intel-sources {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .source-link {
      font-size: 13px;
      color: #0D9488;
      text-decoration: none;
      transition: color 0.15s;
    }

    .source-link:hover {
      color: #0F766E;
    }

    .source-link::before {
      content: '→ ';
      opacity: 0.5;
    }

    /* Pulse Cards */
    .pulse-card {
      padding: 20px 0;
      border-bottom: 1px solid #E5E7EB;
    }

    .pulse-card:last-child {
      border-bottom: none;
    }

    .pulse-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding: 8px 0;
      border-bottom: 1px dashed #E5E7EB;
    }

    .pulse-list li:last-child {
      border-bottom: none;
    }

    .pulse-text {
      font-size: 14px;
      color: #374151;
      flex: 1;
    }

    .pulse-source {
      font-size: 12px;
      color: #6B7280;
      background: #F9FAFB;
      padding: 2px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }

    /* Topics Grid */
    .topics-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .topic-card {
      padding: 20px;
      background: #F9FAFB;
      border-radius: 6px;
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #1F2937;
      margin: 0 0 12px 0;
      padding-right: 40px;
      line-height: 1.4;
    }

    .topic-keywords {
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
    }

    /* Signoff */
    .signoff {
      font-size: 15px;
      color: #6B7280;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #E5E7EB;
      text-align: left;
    }

    /* Footer */
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

export async function GET(): Promise<NextResponse> {
  const html = generatePreviewHtml();

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
