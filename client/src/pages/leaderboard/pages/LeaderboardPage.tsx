import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/layouts/AppLayout';
import { useAppState, GHOST_PLAYERS } from '../../../store/AppContext';
import { api } from '../../../components/api';
import '../leaderboard.css';

const RANK_COLORS: Record<number, string> = { 1: '#f59e0b', 2: '#94a3b8', 3: '#cd7f32' };

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { matchHistory, user } = useAppState();
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    api.results.leaderboard()
      .then(res => {
        if (res.leaderboard && Array.isArray(res.leaderboard)) {
          setLiveLeaderboard(res.leaderboard);
        }
      })
      .catch(() => {});
  }, []);

  // Compute user's best WPM
  const userBestWpm = matchHistory.length > 0 ? Math.max(...matchHistory.map(r => r.wpm)) : (user?.bestWpm || 0);
  const userBestAcc = matchHistory.length > 0
    ? Math.round(matchHistory.reduce((s, r) => s + r.accuracy, 0) / matchHistory.length)
    : 0;
  const userStreak  = matchHistory.length > 0 ? matchHistory[0].streak : 0;

  // Build ranked list from live API + ghost fallback + current user
  let baseList: any[] = [];
  if (liveLeaderboard.length > 0) {
    baseList = liveLeaderboard.map((item: any) => ({
      id: item.userId || item._id || item.username,
      name: item.username,
      wpm: item.bestWpm,
      accuracy: 98,
      streak: 5,
      country: '🌐',
      isUser: user?.username && item.username === user.username,
      isGhost: false,
    }));
  } else {
    baseList = GHOST_PLAYERS.map(g => ({ ...g, isUser: false }));
  }

  if (userBestWpm > 0 && !baseList.some(e => e.name === (user?.username || 'You'))) {
    baseList.push({
      id: 'user',
      name: user?.username || 'You',
      wpm: userBestWpm,
      accuracy: userBestAcc,
      streak: userStreak,
      country: '🏆',
      isUser: true,
      isGhost: false,
    });
  }

  baseList.sort((a, b) => b.wpm - a.wpm);
  const ranked = baseList.map((e, i) => ({ ...e, rank: i + 1 }));

  const top3 = [
    ranked.find(e => e.rank === 2),
    ranked.find(e => e.rank === 1),
    ranked.find(e => e.rank === 3),
  ].filter(Boolean);

  return (
    <AppLayout>
      <div className="leaderboard-page anim-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => navigate('/home')} className="landing-btn--ghost" style={{ alignSelf: 'flex-start', marginBottom: '2rem', color: 'inherit' }}>
          ← Back to Dashboard
        </button>
        {/* Header */}
        <div className="leaderboard-page__header" style={{ marginTop: '2rem' }}>
          <h1 className="leaderboard-page__title">
            <span className="gradient-text">Global Leaderboard</span>
          </h1>
          <p className="leaderboard-page__subtitle">
            Top typists worldwide · Your score updates after every match
          </p>
          {matchHistory.length === 0 && (
            <div className="leaderboard-page__cta">
              Complete a test to appear on the leaderboard!
            </div>
          )}
        </div>



        {/* Podium — top 3 */}
        <div className="leaderboard-podium">
          {top3.map(entry => {
            const pos = entry.rank;
            return (
              <div key={entry.id} className={`leaderboard-podium__item leaderboard-podium__item--${pos} ${entry.isUser ? 'leaderboard-podium__item--you' : ''}`}>
                <div className="leaderboard-podium__crown" aria-hidden="true">
                  {pos === 1 ? '👑' : pos === 2 ? '🥈' : '🥉'}
                </div>
                <div className="leaderboard-podium__avatar" style={{ borderColor: RANK_COLORS[pos], boxShadow: `0 0 20px ${RANK_COLORS[pos]}55` }}>
                  {entry.name.charAt(0).toUpperCase()}
                </div>
                <div className="leaderboard-podium__rank" style={{ color: RANK_COLORS[pos] }}>#{pos}</div>
                <div className="leaderboard-podium__name">{entry.name}</div>
                <div className="leaderboard-podium__wpm" style={{ color: RANK_COLORS[pos] }}>{entry.wpm} <span>wpm</span></div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="leaderboard-table">
          <div className="leaderboard-table__head">
            <span>Rank</span>
            <span>Player</span>
            <span>Best WPM</span>
            <span>Avg Acc</span>
            <span>Streak</span>
          </div>

          {ranked.map((entry, idx) => (
            <div
              key={entry.id}
              id={`leaderboard-row-${entry.rank}`}
              className={`leaderboard-table__row anim-fade-in-up anim-delay-${Math.min(idx + 1, 8)} ${entry.isUser ? 'leaderboard-table__row--you' : ''}`}
            >
              <span className="leaderboard-table__rank">
                {entry.rank <= 3
                  ? <span style={{ fontSize: '1.2rem' }}>{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
                  : <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>#{entry.rank}</span>
                }
              </span>
              <div className="leaderboard-table__player">
                <div className="leaderboard-table__avatar" style={entry.isUser ? { background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))' } : {}}>
                  {entry.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="leaderboard-table__name">
                    {entry.name}
                    {entry.isUser && <span className="leaderboard-table__you-badge">YOU</span>}
                  </div>
                  <div className="leaderboard-table__country">{entry.country}</div>
                </div>
              </div>
              <span className="leaderboard-table__wpm">{entry.wpm}</span>
              <span className="leaderboard-table__acc">{entry.accuracy}%</span>
              <span className="leaderboard-table__streak">{entry.streak} 🔥</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
