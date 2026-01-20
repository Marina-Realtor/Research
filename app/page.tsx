'use client';

import { useEffect, useState } from 'react';
import { StatusData } from '@/types';
import { getMorningQueries, getEveningQueries } from '@/lib/queries';

export default function Home() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const morningQueries = getMorningQueries();
  const eveningQueries = getEveningQueries();

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) throw new Error('Failed to fetch status');
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  function formatDate(isoString?: string): string {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  function getCategoryClass(category: string): string {
    switch (category) {
      case 'market_intel':
        return 'market';
      case 'reddit_pain_points':
        return 'reddit';
      case 'urgent_news':
        return 'urgent';
      default:
        return '';
    }
  }

  function getCategoryLabel(category: string): string {
    switch (category) {
      case 'market_intel':
        return 'Market';
      case 'reddit_pain_points':
        return 'Reddit';
      case 'urgent_news':
        return 'Urgent';
      default:
        return category;
    }
  }

  return (
    <main className="container">
      <header className="header">
        <h1>Marina Research</h1>
        <p>Automated Real Estate Intelligence for El Paso &amp; Fort Bliss</p>
      </header>

      <div className="status-card">
        <h2>
          System Status
          {loading ? (
            <span className="status-badge degraded">Loading...</span>
          ) : error ? (
            <span className="status-badge error">Error</span>
          ) : (
            <span className={`status-badge ${status?.status || 'degraded'}`}>
              {status?.status || 'Unknown'}
            </span>
          )}
        </h2>

        {!loading && !error && status && (
          <div className="info-grid">
            <div className="info-item">
              <label>Last Morning Digest</label>
              <div className="value">{formatDate(status.lastMorningRun)}</div>
            </div>
            <div className="info-item">
              <label>Last Evening Update</label>
              <div className="value">{formatDate(status.lastEveningRun)}</div>
            </div>
            <div className="info-item">
              <label>Morning Queries</label>
              <div className="value">{status.morningQueryCount}</div>
            </div>
            <div className="info-item">
              <label>Evening Queries</label>
              <div className="value">{status.eveningQueryCount}</div>
            </div>
          </div>
        )}
      </div>

      <div className="schedule-card">
        <h3>Email Schedule (Central Time)</h3>
        <div className="schedule-item">
          <span className="time">6:30 AM</span>
          <span className="description">Morning Digest - Full research report</span>
        </div>
        <div className="schedule-item">
          <span className="time">8:00 PM</span>
          <span className="description">Evening Update - Only if new urgent items</span>
        </div>
      </div>

      <div className="queries-section">
        <h3>Morning Queries ({morningQueries.length})</h3>
        <ul className="query-list">
          {morningQueries.map((q, i) => (
            <li key={i}>
              <span className={`category-badge ${getCategoryClass(q.category)}`}>
                {getCategoryLabel(q.category)}
              </span>
              {q.query}
            </li>
          ))}
        </ul>
      </div>

      <div className="queries-section">
        <h3>Evening Queries ({eveningQueries.length})</h3>
        <ul className="query-list">
          {eveningQueries.map((q, i) => (
            <li key={i}>
              <span className={`category-badge ${getCategoryClass(q.category)}`}>
                {getCategoryLabel(q.category)}
              </span>
              {q.query}
            </li>
          ))}
        </ul>
      </div>

      <footer className="footer">
        <p>Marina Ramirez Real Estate | El Paso, Texas</p>
        <p>
          <a href={status?.blogUrl || '#'} target="_blank" rel="noopener noreferrer">
            Visit Blog
          </a>
          {' | '}
          <a href="https://www.marina-ramirez.com" target="_blank" rel="noopener noreferrer">
            Main Website
          </a>
        </p>
      </footer>
    </main>
  );
}
