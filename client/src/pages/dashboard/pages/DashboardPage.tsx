import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch } from '../../../store/AppContext';
import '../../landing/landing.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { theme } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div className="landing" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '2rem', position: 'relative' }}>
      
      {/* Theme Toggle Button */}
      <button 
        onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
        className="landing-btn--ghost"
        style={{ position: 'absolute', top: '2rem', right: '2rem', padding: '0.5rem 1rem' }}
      >
        {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="landing-btn--ghost"
        style={{ position: 'absolute', top: '2rem', left: '2rem', padding: '0.5rem 1rem' }}
      >
        ← Back
      </button>
      
      {/* ── Floating particles ── */}
      <div className="landing-particles" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="landing-particle"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              background: i % 3 === 0
                ? 'var(--accent-cyan)'
                : i % 3 === 1
                  ? 'var(--accent-violet)'
                  : 'var(--accent-rose)',
              animationDuration: `${10 + Math.random() * 15}s`,
              animationDelay: `${Math.random() * 10}s`,
              opacity: 0.15 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      <div className="landing-hero__content" style={{ textAlign: 'center', zIndex: 1, maxWidth: '1200px', width: '100%' }}>
        <h1 className="landing-hero__title" style={{ marginBottom: '2rem' }}>
          Select <span className="landing-hero__title-gradient">Game Mode</span>
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
          {/* Top Row */}
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
            {/* Solo Box */}
            <div 
              onClick={() => navigate('/solo')}
              className="landing-feature-card anim-fade-in-up"
              style={{ cursor: 'pointer', flex: '1', minWidth: '300px', maxWidth: '350px', transition: 'transform 0.2s', '--glow-color': 'rgba(34,211,238,0.06)', '--glow-border': 'rgba(34,211,238,0.4)' } as any}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <h3 className="landing-feature-card__title" style={{ fontSize: '1.5rem', textAlign: 'center' }}>Solo</h3>
              <p className="landing-feature-card__desc" style={{ textAlign: 'center' }}>Practice typing by yourself and improve your words per minute.</p>
            </div>

            {/* Multiplayer Box */}
            <div 
              onClick={() => navigate('/multiplayer')}
              className="landing-feature-card anim-fade-in-up"
              style={{ cursor: 'pointer', flex: '1', minWidth: '300px', maxWidth: '350px', transition: 'transform 0.2s', '--glow-color': 'rgba(139,92,246,0.06)', '--glow-border': 'rgba(139,92,246,0.4)' } as any}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <h3 className="landing-feature-card__title" style={{ fontSize: '1.5rem', textAlign: 'center' }}>Multiplayer</h3>
              <p className="landing-feature-card__desc" style={{ textAlign: 'center' }}>Race against others or play with your friends in a private room.</p>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {/* Leaderboard Box */}
            <div 
              onClick={() => navigate('/leaderboard')}
              className="landing-feature-card anim-fade-in-up"
              style={{ cursor: 'pointer', width: '100%', minWidth: '300px', maxWidth: '350px', transition: 'transform 0.2s', '--glow-color': 'rgba(245,158,11,0.06)', '--glow-border': 'rgba(245,158,11,0.4)' } as any}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <h3 className="landing-feature-card__title" style={{ fontSize: '1.5rem', textAlign: 'center' }}>Leaderboard</h3>
              <p className="landing-feature-card__desc" style={{ textAlign: 'center' }}>See the top players and find out where you rank globally.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
