import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/layouts/AppLayout';
import StatCards from '../components/StatCards';
import WpmChart from '../components/WpmChart';
import KeyHeatmap from '../components/KeyHeatmap';
import type { TestResult } from '../../../components/types';
import { useAppState, GHOST_PLAYERS } from '../../../store/AppContext';
import '../results.css';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { matchHistory } = useAppState();
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    // Prefer last result written to sessionStorage (most recent play)
    const stored = sessionStorage.getItem('lastResult');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TestResult;
        setResult(parsed);
        return;
      } catch {}
    }
    // Fallback: grab the newest from context
    if (matchHistory.length > 0) {
      setResult(matchHistory[0]);
    }
  }, [matchHistory]);

  /* ── No result yet ── */
  if (!result) {
    return (
      <AppLayout>
        <div
          className="results-page anim-fade-in"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', flexDirection: 'column', gap: '20px', textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '3.5rem' }}>⌨️</span>
          <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-secondary)' }}>
            No match result yet
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Complete a solo or multiplayer test to see your results here.
          </p>
          <button
            id="no-result-home-btn"
            className="results-page__btn results-page__btn--primary"
            onClick={() => navigate('/solo')}
          >
            🏠 Back to Home
          </button>
        </div>
      </AppLayout>
    );
  }

  /* ── Leaderboard context ── */
  const userBestWpm = matchHistory.length > 0
    ? Math.max(...matchHistory.map(r => r.wpm))
    : 0;
  const allEntries  = [...GHOST_PLAYERS].sort((a, b) => b.wpm - a.wpm);
  let userRank      = allEntries.findIndex(g => g.wpm < result.wpm);
  if (userRank === -1) userRank = allEntries.length;

  const modeLabel = result.mode === 'common-words' ? 'Common Words'
    : result.mode === 'quotes' ? 'Quote' : 'Custom';
  const dateLabel = new Date(result.date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <AppLayout>
      <div className="results-page anim-fade-in">

        {/* ── Match Complete Header ── */}
        <div className="results-page__header">
          <div className="results-page__complete-badge">
            <span className="results-page__complete-icon">🎯</span>
            <span className="results-page__complete-label">Match Complete</span>
          </div>
          <div className="results-page__subtitle">
            {modeLabel} · {result.time}s · {dateLabel}
          </div>
        </div>

        {/* ── Score Summary Banner ── */}
        <div className="results-score-banner">
          <div className="results-score-banner__item results-score-banner__item--main">
            <span className="results-score-banner__value" style={{ color: 'var(--accent-cyan)' }}>
              {result.wpm}
            </span>
            <span className="results-score-banner__unit">WPM</span>
          </div>
          <div className="results-score-banner__divider" aria-hidden="true" />
          <div className="results-score-banner__item">
            <span className="results-score-banner__value" style={{ color: 'var(--success)' }}>
              {result.accuracy}%
            </span>
            <span className="results-score-banner__unit">Accuracy</span>
          </div>
          <div className="results-score-banner__divider" aria-hidden="true" />
          <div className="results-score-banner__item">
            <span className="results-score-banner__value" style={{ color: 'var(--accent-rose)' }}>
              {result.errors}
            </span>
            <span className="results-score-banner__unit">Errors</span>
          </div>
          <div className="results-score-banner__divider" aria-hidden="true" />
          <div className="results-score-banner__item">
            <span className="results-score-banner__value" style={{ color: 'var(--accent-gold)' }}>
              {result.time}s
            </span>
            <span className="results-score-banner__unit">Duration</span>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <StatCards result={result} />

        {/* ── Charts ── */}
        <div className="results-page__charts">
          <WpmChart
            wpmOverTime={result.wpmOverTime}
            peakWpm={Math.max(...result.wpmOverTime)}
            avgWpm={Math.round(result.wpmOverTime.reduce((a, b) => a + b, 0) / result.wpmOverTime.length)}
            consistency={87}
          />
          <KeyHeatmap keyErrors={result.keyErrors} />
        </div>

        {/* ── Actions ── */}
        <div className="results-page__actions">
          <button
            id="home-btn"
            className="results-page__btn results-page__btn--primary"
            onClick={() => navigate('/solo')}
          >
            🏠 Back to Home
          </button>
          <button
            id="retry-btn"
            className="results-page__btn results-page__btn--secondary"
            onClick={() => navigate('/solo')}
          >
            ↺ Try Again
          </button>
          <button
            id="leaderboard-btn"
            className="results-page__btn results-page__btn--ghost"
            onClick={() => navigate('/leaderboard')}
          >
            🏆 Leaderboard
          </button>
          <button
            id="profile-btn"
            className="results-page__btn results-page__btn--ghost"
            onClick={() => navigate('/profile')}
          >
            👤 My Profile
          </button>
        </div>

        {/* ── Leaderboard Standing ── */}
        <div className="results-leaderboard">
          <h2 className="results-leaderboard__title">Your Standing</h2>
          <div className="results-leaderboard__table">
            {[
              ...allEntries.slice(0, userRank).map((g, i) => ({
                rank: i + 1, name: g.name, wpm: g.wpm, acc: g.accuracy,
                country: g.country, isYou: false,
              })),
              {
                rank: userRank + 1, name: 'You', wpm: result.wpm,
                acc: result.accuracy, country: '🏆', isYou: true,
              },
              ...allEntries.slice(userRank).map((g, i) => ({
                rank: userRank + 2 + i, name: g.name, wpm: g.wpm,
                acc: g.accuracy, country: g.country, isYou: false,
              })),
            ]
              .filter((_, i, arr) => {
                const youIdx = arr.findIndex(e => e.isYou);
                return Math.abs(i - youIdx) <= 2;
              })
              .map(entry => (
                <div
                  key={entry.rank}
                  className={`results-leaderboard__row${entry.isYou ? ' results-leaderboard__row--you' : ''}`}
                >
                  <span className="results-leaderboard__rank">#{entry.rank}</span>
                  <span className="results-leaderboard__flag">{entry.country}</span>
                  <span className="results-leaderboard__name">{entry.name}</span>
                  <span className="results-leaderboard__wpm">{entry.wpm} <small>wpm</small></span>
                  <span className="results-leaderboard__acc">{entry.acc}%</span>
                </div>
              ))}
          </div>
          {userBestWpm > 0 && (
            <p className="results-leaderboard__hint">
              Your best: <strong style={{ color: 'var(--accent-cyan)' }}>{userBestWpm} WPM</strong>
              {' '}· Rank #{userRank + 1} of {allEntries.length + 1}
              {result.wpm === userBestWpm && matchHistory.length > 1 && (
                <span className="results-leaderboard__pb"> 🎉 New Personal Best!</span>
              )}
            </p>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
