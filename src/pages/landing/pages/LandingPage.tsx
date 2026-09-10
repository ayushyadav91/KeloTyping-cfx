import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../../store/AppContext';
import '../landing.css';

/* ── Typing demo preview text ── */
const DEMO_TEXT = 'the quick brown fox jumps over the lazy dog';
const DEMO_TYPED = 'the quick brown fox ';

interface FeatureCard {
  icon: string;
  title: string;
  desc: string;
  glowColor: string;
  glowBorder: string;
  glowShadow: string;
  iconBg: string;
  iconBorder: string;
}

const FEATURES: FeatureCard[] = [
  {
    icon: '⌨️',
    title: 'Real-time WPM',
    desc: 'Live words-per-minute tracking with millisecond accuracy. See exactly how fast you type as you go.',
    glowColor: 'rgba(34,211,238,0.06)',
    glowBorder: 'rgba(34,211,238,0.4)',
    glowShadow: 'rgba(34,211,238,0.15)',
    iconBg: 'rgba(34,211,238,0.1)',
    iconBorder: 'rgba(34,211,238,0.25)',
  },
  {
    icon: '⚡',
    title: 'Multiplayer Races',
    desc: 'Challenge friends or random opponents in head-to-head typing races with live progress bars.',
    glowColor: 'rgba(139,92,246,0.06)',
    glowBorder: 'rgba(139,92,246,0.4)',
    glowShadow: 'rgba(139,92,246,0.15)',
    iconBg: 'rgba(139,92,246,0.1)',
    iconBorder: 'rgba(139,92,246,0.25)',
  },
  {
    icon: '📊',
    title: 'Deep Analytics',
    desc: 'WPM over time graphs, per-key error heatmaps, and streak tracking to identify weak spots.',
    glowColor: 'rgba(245,158,11,0.06)',
    glowBorder: 'rgba(245,158,11,0.4)',
    glowShadow: 'rgba(245,158,11,0.15)',
    iconBg: 'rgba(245,158,11,0.1)',
    iconBorder: 'rgba(245,158,11,0.25)',
  },
  {
    icon: '🎯',
    title: 'Accuracy Mode',
    desc: 'Toggle between pure speed, accuracy focus, or balanced mode — train exactly what you need.',
    glowColor: 'rgba(16,185,129,0.06)',
    glowBorder: 'rgba(16,185,129,0.4)',
    glowShadow: 'rgba(16,185,129,0.15)',
    iconBg: 'rgba(16,185,129,0.1)',
    iconBorder: 'rgba(16,185,129,0.25)',
  },
  {
    icon: '🏆',
    title: 'Global Leaderboard',
    desc: 'Compete with typists worldwide. Climb the ranks from beginner to Grandmaster 200 WPM.',
    glowColor: 'rgba(244,63,94,0.06)',
    glowBorder: 'rgba(244,63,94,0.4)',
    glowShadow: 'rgba(244,63,94,0.15)',
    iconBg: 'rgba(244,63,94,0.1)',
    iconBorder: 'rgba(244,63,94,0.25)',
  },
  {
    icon: '🔥',
    title: 'Daily Streaks',
    desc: 'Build momentum with daily practice streaks. Unlock achievements as you hit speed milestones.',
    glowColor: 'rgba(249,115,22,0.06)',
    glowBorder: 'rgba(249,115,22,0.4)',
    glowShadow: 'rgba(249,115,22,0.15)',
    iconBg: 'rgba(249,115,22,0.1)',
    iconBorder: 'rgba(249,115,22,0.25)',
  },
];

export function getRankDisplay(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export function getRankClass(rank: number): string {
  if (rank === 1) return 'landing-lb__rank--gold';
  if (rank === 2) return 'landing-lb__rank--silver';
  if (rank === 3) return 'landing-lb__rank--bronze';
  return '';
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAppState();
  const revealRefs = useRef<HTMLElement[]>([]);

  /* ── Intersection Observer for scroll-reveal ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addRevealRef = (el: HTMLElement | null): void => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const handleStart = (): void => {
    if (user) navigate('/home');
    else navigate('/auth/login');
  };

  return (
    <div className="landing">

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

      {/* ── Navigation ── */}
      <nav className="landing-nav" role="navigation" aria-label="Landing navigation">
        <button className="landing-nav__logo" onClick={() => navigate('/')} aria-label="Kelotyping home">
          <div className="landing-nav__logo-icon" aria-hidden="true">K</div>
          Kelotyping
        </button>


        <div className="landing-nav__cta">
          {user ? (
            <>
              <button className="landing-nav__login" onClick={() => navigate('/profile')}>
                {user.avatarInitial} {user.username}
              </button>
              <button className="landing-nav__start" id="nav-play-btn" onClick={() => navigate('/home')}>
                Play Now
              </button>
            </>
          ) : (
            <>
              <button className="landing-nav__login" id="nav-login-link" onClick={() => navigate('/auth/login')}>
                Log In
              </button>
              <button className="landing-nav__start" id="nav-signup-btn" onClick={() => navigate('/auth/register')}>
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="landing-hero" aria-labelledby="hero-title">
        {/* Background orbs */}
        <div className="landing-hero__orb landing-hero__orb--violet" aria-hidden="true" />
        <div className="landing-hero__orb landing-hero__orb--cyan" aria-hidden="true" />
        <div className="landing-hero__orb landing-hero__orb--rose" aria-hidden="true" />
        <div className="landing-hero__grid" aria-hidden="true" />

        <div className="landing-hero__content">
          <div className="landing-hero__badge" aria-label="Live platform status">
            <span className="landing-hero__badge-dot" aria-hidden="true" />
            1,200+ Active Players Today
          </div>

          <h1 id="hero-title" className="landing-hero__title">
            Type Faster.<br />
            <span className="landing-hero__title-gradient">
              Rank Higher.
            </span>
          </h1>

          <p className="landing-hero__sub">
            The most immersive typing speed platform. Real-time WPM, global leaderboards,
            multiplayer races, and deep analytics all in one place.
          </p>

          <div className="landing-hero__actions">
            <button
              id="hero-start-btn"
              className="landing-btn--primary"
              onClick={handleStart}
              aria-label={user ? 'Go to typing test' : 'Create account'}
            >
              {user ? 'Start Typing' : 'Get Started'}
            </button>
            <button
              id="hero-leaderboard-btn"
              className="landing-btn--ghost"
              onClick={() => navigate('/leaderboard')}
            >
              View Leaderboard →
            </button>
          </div>

          {/* Global stats */}
          <div className="landing-hero__stats" role="list" aria-label="Platform statistics">
            {[
              { value: '215', label: 'Top WPM' },
              { value: '98%', label: 'Accuracy' },
              { value: '50K+', label: 'Tests Run' },
              { value: '180+', label: 'Countries' },
            ].map(({ value, label }) => (
              <div key={label} className="landing-hero__stat" role="listitem">
                <span className="landing-hero__stat-value">{value}</span>
                <span className="landing-hero__stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Typing Demo Preview ── */}
      <section
        className="landing-demo landing-reveal"
        ref={addRevealRef}
        aria-label="Typing test preview"
      >
        <div className="landing-demo__inner">
          <p className="landing-demo__label">Live Typing Interface</p>

          <div className="landing-demo__card" role="presentation">
            <div className="landing-demo__bar" aria-label="Stats">
              <div className="landing-demo__metric">
                <span className="landing-demo__metric-val">127</span>
                <span className="landing-demo__metric-label">WPM</span>
              </div>
              <div className="landing-demo__metric">
                <span className="landing-demo__metric-val landing-demo__metric-val--violet">97%</span>
                <span className="landing-demo__metric-label">Accuracy</span>
              </div>
              <div className="landing-demo__metric">
                <span className="landing-demo__metric-val landing-demo__metric-val--gold">42s</span>
                <span className="landing-demo__metric-label">Time Left</span>
              </div>
            </div>

            <div className="landing-demo__text" aria-hidden="true">
              {DEMO_TEXT.split('').map((char, i) => {
                const typedChar = DEMO_TYPED[i];
                if (i === DEMO_TYPED.length) {
                  return <span key={i} className="landing-demo__char--cursor">{char}</span>;
                }
                if (typedChar === undefined) {
                  return <span key={i}>{char}</span>;
                }
                return (
                  <span
                    key={i}
                    className={
                      typedChar === char
                        ? 'landing-demo__char--correct'
                        : 'landing-demo__char--incorrect'
                    }
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        className="landing-features landing-reveal"
        ref={addRevealRef}
        aria-labelledby="features-title"
      >
        <div className="landing-section-header">
          <p className="landing-section-header__eyebrow">Everything You Need</p>
          <h2 id="features-title" className="landing-section-header__title">
            Built for <span className="gradient-text">Serious Typists</span>
          </h2>
          <p className="landing-section-header__sub">
            Every feature is designed to accelerate your progress from average to elite.
          </p>
        </div>

        <div className="landing-features__grid" role="list">
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className="landing-feature-card landing-reveal anim-fade-in-up"
              ref={addRevealRef}
              role="listitem"
              style={{
                animationDelay: `${i * 0.08}s`,
                animationFillMode: 'both',
                '--glow-color': f.glowColor,
                '--glow-border': f.glowBorder,
                '--glow-shadow': f.glowShadow,
                '--icon-bg': f.iconBg,
                '--icon-border': f.iconBorder,
              } as React.CSSProperties}
            >
              <div className="landing-feature-card__icon" aria-hidden="true">{f.icon}</div>
              <h3 className="landing-feature-card__title">{f.title}</h3>
              <p className="landing-feature-card__desc">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        className="landing-how landing-reveal"
        ref={addRevealRef}
        aria-labelledby="how-title"
      >
        <div className="landing-how__inner">
          <div className="landing-section-header">
            <p className="landing-section-header__eyebrow">Simple Start</p>
            <h2 id="how-title" className="landing-section-header__title">
              From Zero to <span className="gradient-text">200 WPM</span>
            </h2>
          </div>

          <div className="landing-how__steps" role="list">
            {[
              { n: '01', title: 'Create Account', desc: 'Sign up in seconds — no credit card, no friction.' },
              { n: '02', title: 'Start Typing', desc: 'Choose your mode: timed words, famous quotes, or multiplayer.' },
              { n: '03', title: 'Track Growth', desc: 'Review your stats, spot weak keys, and climb the leaderboard.' },
            ].map((s) => (
              <div key={s.n} className="landing-how-step" role="listitem">
                <div className="landing-how-step__number" aria-hidden="true">{s.n}</div>
                <h3 className="landing-how-step__title">{s.title}</h3>
                <p className="landing-how-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Multiplayer Online ── */}
      <section
        className="landing-multiplayer landing-reveal"
        ref={addRevealRef}
        aria-labelledby="mp-title"
      >
        <div className="landing-how__inner">
          <div className="landing-section-header">
            <p className="landing-section-header__eyebrow">Race Friends</p>
            <h2 id="mp-title" className="landing-section-header__title">
              Multiplayer <span className="gradient-text">Online</span>
            </h2>
            <p className="landing-section-header__sub">
              Challenge your friends to real-time typing races. Create a private room, share the link, and see who types the fastest.
            </p>
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            <button
              id="view-mp-btn"
              className="landing-btn--primary"
              onClick={() => navigate('/multiplayer')}
            >
              Play with Friends →
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="landing-cta landing-reveal"
        ref={addRevealRef}
        aria-labelledby="cta-title"
      >
        <div className="landing-cta__card">
          <h2 id="cta-title" className="landing-cta__title">
            Ready to Break<br />
            <span className="gradient-text">Your Record?</span>
          </h2>
          <p className="landing-cta__sub">
            Join thousands of typists improving every day.
            No account required to start.
          </p>
          <div className="landing-cta__actions">
            <button
              id="cta-start-btn"
              className="landing-btn--primary"
              onClick={handleStart}
            >
              {user ? 'Back to Typing' : 'Start Typing'}
            </button>
            <button
              id="cta-multi-btn"
              className="landing-btn--ghost"
              onClick={() => navigate('/multiplayer')}
            >
              Try Multiplayer
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer" role="contentinfo">
        <div className="landing-footer__brand">Kelotyping</div>
        <p className="landing-footer__copy">
          © {new Date().getFullYear()} Kelotyping · Built for speed
        </p>
      </footer>
    </div>
  );
}
