import { useNavigate } from 'react-router-dom';
import Logo from '../Logo/Logo';
import { useAppState, useUserStats } from '../../store/AppContext';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { user }  = useAppState();
  const stats     = useUserStats();

  return (
    <header className="navbar" role="banner">
      <div className="navbar__inner">
        {/* Logo */}
        <button className="navbar__logo-btn" onClick={() => navigate('/')} aria-label="Go to home">
          <Logo size="sm" />
        </button>

        {/* Navigation Links removed for dashboard style */}
        <nav className="navbar__nav" aria-label="Main navigation">
        </nav>

        {/* Right side */}
        <div className="navbar__right">
          {/* Live stats (only if user has played) */}
          {stats.totalTests > 0 && (
            <div className="navbar__stats">
              <div className="navbar__stat">
                <span className="navbar__stat-label">WPM</span>
                <span className="navbar__stat-value navbar__stat-value--cyan">{stats.bestWpm}</span>
              </div>
              <div className="navbar__stat">
                <span className="navbar__stat-label">ACC</span>
                <span className="navbar__stat-value navbar__stat-value--green">{stats.avgAcc}%</span>
              </div>
              {stats.streak > 0 && (
                <div className="navbar__stat">
                  <span className="navbar__stat-label">Streak</span>
                  <span className="navbar__stat-value navbar__stat-value--gold">{stats.streak}</span>
                </div>
              )}
            </div>
          )}

          {/* Login or Avatar */}
          {!user ? (
            <button id="nav-login-btn" className="navbar__login-btn" onClick={() => navigate('/auth/login')}>
              Login
            </button>
          ) : (
            <button
              className="navbar__avatar"
              onClick={() => navigate('/profile')}
              aria-label={`Open profile for ${user.username}`}
              id="nav-profile-avatar"
              title={user.username}
            >
              {user.avatarInitial}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
