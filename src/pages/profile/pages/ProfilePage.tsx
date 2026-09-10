import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/layouts/AppLayout';
import { useAppState, useAppDispatch, useUserStats } from '../../../store/AppContext';
import '../profile.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const h = diffMs / 3_600_000;
  if (h < 1) return 'Just now';
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = diffMs / 86_400_000;
  if (d < 2) return 'Yesterday';
  return `${Math.floor(d)} days ago`;
}

export const ACHIEVEMENTS = [
  { icon: '⚡', label: 'Speed Demon', desc: 'Hit 150+ WPM', key: (s: ReturnType<typeof useUserStats>) => s.bestWpm >= 150 },
  { icon: '🎯', label: 'Sharpshooter', desc: '98%+ accuracy', key: (s: ReturnType<typeof useUserStats>) => s.avgAcc >= 98 },
  { icon: '🔥', label: 'On Fire', desc: '7-day streak', key: (s: ReturnType<typeof useUserStats>) => s.streak >= 7 },
  { icon: '👑', label: 'Grandmaster', desc: 'Reach 200 WPM', key: (s: ReturnType<typeof useUserStats>) => s.bestWpm >= 200 },
  { icon: '🏆', label: 'Champion', desc: 'Win 10 multiplayer', key: (s: ReturnType<typeof useUserStats>) => s.multiWins >= 10 },
  { icon: '🌙', label: 'Night Owl', desc: 'Complete 5 tests', key: (s: ReturnType<typeof useUserStats>) => s.totalTests >= 5 },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, matchHistory, multiHistory } = useAppState();
  const stats = useUserStats();

  const [activeSection, setActiveSection] = useState<'stats' | 'history' | 'achievements'>('stats');
  const [editing, setEditing] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio || '');

  if (!user) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <span style={{ fontSize: '3rem' }}>🔒</span>
          <p style={{ color: 'var(--text-secondary)' }}>You need to be logged in to view your profile.</p>
          <button className="profile-btn profile-btn--primary" onClick={() => navigate('/auth/login')}>Login / Sign Up</button>
        </div>
      </AppLayout>
    );
  }

  const handleSaveBio = () => {
    dispatch({ type: 'UPDATE_BIO', payload: bioInput });
    setEditing(false);
  };

  const totalHours = Math.floor(stats.totalTimeSec / 3600);
  const totalMins = Math.floor((stats.totalTimeSec % 3600) / 60);

  const STATS_DATA = [
    { label: 'Best WPM', value: String(stats.bestWpm), unit: '', color: 'cyan' },
    { label: 'Avg WPM', value: String(stats.avgWpm), unit: '', color: 'cyan' },
    { label: 'Accuracy', value: String(stats.avgAcc), unit: '%', color: 'success' },
    { label: 'Tests Done', value: String(stats.totalTests), unit: '', color: 'violet' },
    { label: 'MP Wins', value: String(stats.multiWins), unit: '', color: 'warning' },
    { label: 'Time Typed', value: totalHours > 0 ? String(totalHours) : String(totalMins), unit: totalHours > 0 ? 'h' : 'm', color: 'info' },
  ];

  return (
    <AppLayout>
      <div className="profile-page anim-fade-in">

        {/* ── Hero ── */}
        <div className="profile-hero">
          <div className="profile-hero__banner" aria-hidden="true" />
          <div className="profile-hero__content">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">{user.avatarInitial}</div>
              <div className="profile-avatar__ring" aria-hidden="true" />
            </div>

            <div className="profile-hero__info">
              <h1 className="profile-hero__name">{user.username}</h1>
              <p className="profile-hero__email">{user.email}</p>
              <p className="profile-hero__joined">Member since {user.joinedDate}</p>

              {editing ? (
                <div className="profile-bio-edit">
                  <textarea id="bio-input" className="profile-bio-textarea" value={bioInput}
                    onChange={e => setBioInput(e.target.value)} maxLength={160} rows={2} />
                  <div className="profile-bio-actions">
                    <button id="save-bio-btn" className="profile-btn profile-btn--primary" onClick={handleSaveBio}>Save</button>
                    <button id="cancel-bio-btn" className="profile-btn profile-btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="profile-bio" onClick={() => { setBioInput(user.bio); setEditing(true); }} id="bio-text">
                  {user.bio} <span className="profile-bio__edit-hint">✎</span>
                </p>
              )}
            </div>

            <div className="profile-hero__actions">
              <button id="logout-btn" className="profile-btn profile-btn--danger" onClick={() => { dispatch({ type: 'LOGOUT' }); navigate('/auth/login'); }}>
                ⏻ Log Out
              </button>
            </div>
          </div>
        </div>

        {/* ── Section Tabs ── */}
        <div className="profile-tabs" role="tablist">
          {(['stats', 'history'] as const).map(tab => (
            <button key={tab} role="tab" id={`profile-tab-${tab}`}
              aria-selected={activeSection === tab}
              className={`profile-tab ${activeSection === tab ? 'profile-tab--active' : ''}`}
              onClick={() => setActiveSection(tab)}>
              {tab === 'stats' ? '📊 Stats' : '📋 History'}
            </button>
          ))}
        </div>

        {/* ── Stats ── */}
        {activeSection === 'stats' && (
          <div className="profile-section anim-fade-in">
            {stats.totalTests === 0 ? (
              <div className="profile-empty">
                <span>⌨️</span>
                <p>Complete a typing test to see your stats!</p>
                <button className="profile-btn profile-btn--primary" onClick={() => navigate('/solo')}>Start Typing</button>
              </div>
            ) : (
              <>
                <div className="profile-stats-grid">
                  {STATS_DATA.map(s => (
                    <div key={s.label} className={`profile-stat profile-stat--${s.color}`}>
                      <span className="profile-stat__value">{s.value}<span className="profile-stat__unit">{s.unit}</span></span>
                      <span className="profile-stat__label">{s.label}</span>
                    </div>
                  ))}
                </div>
                {stats.bestWpm > 0 && (
                  <div className="profile-progress-card">
                    <div className="profile-progress-card__header">
                      <span className="profile-progress-card__title">Progress to 200 WPM</span>
                      <span className="profile-progress-card__value">{stats.bestWpm} / 200</span>
                    </div>
                    <div className="profile-progress-bar" role="progressbar" aria-valuenow={Math.min(stats.bestWpm / 2, 100)}>
                      <div className="profile-progress-bar__fill" style={{ width: `${Math.min(stats.bestWpm / 2, 100)}%` }} />
                    </div>
                    <p className="profile-progress-card__hint">
                      {stats.bestWpm >= 200 ? '🎉 You reached 200 WPM!' : `${Math.min(Math.round(stats.bestWpm / 2), 100)}% of the way to 200 WPM 🎯`}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── History ── */}
        {activeSection === 'history' && (
          <div className="profile-section anim-fade-in">
            {matchHistory.length === 0 ? (
              <div className="profile-empty">
                <span>📋</span>
                <p>No test history yet. Start typing to see your results here!</p>
              </div>
            ) : (
              <div className="profile-history">
                <div className="profile-history__header">
                  <span>Date</span><span>WPM</span><span>Accuracy</span><span>Mode</span>
                </div>
                {matchHistory.map(r => (
                  <div key={r.id} className="profile-history__row">
                    <span className="profile-history__date">{formatRelative(r.date)}</span>
                    <span className="profile-history__wpm">{r.wpm}</span>
                    <span className={`profile-history__acc ${r.accuracy >= 95 ? 'profile-history__acc--good' : ''}`}>{r.accuracy}%</span>
                    <span className="profile-history__mode">
                      {r.mode === 'common-words' ? 'Words' : r.mode === 'quotes' ? 'Quote' : 'Custom'} · {r.time}s
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Multiplayer history */}
            {multiHistory.length > 0 && (
              <>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Multiplayer Matches
                </h3>
                <div className="profile-history">
                  <div className="profile-history__header">
                    <span>Date</span><span>Your WPM</span><span>Opponent</span><span>Result</span>
                  </div>
                  {multiHistory.map(m => (
                    <div key={m.id} className="profile-history__row">
                      <span className="profile-history__date">{formatDate(m.date)}</span>
                      <span className="profile-history__wpm">{m.userWpm}</span>
                      <span className="profile-history__acc">{m.opponentName} ({m.opponentWpm})</span>
                      <span className={`profile-history__mode ${m.winner === 'user' ? 'profile-history__acc--good' : ''}`}>
                        {m.winner === 'user' ? ' Win' : m.winner === 'opponent' ? ' Loss' : ' Draw'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
