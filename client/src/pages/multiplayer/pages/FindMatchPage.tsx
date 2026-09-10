import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/layouts/AppLayout';
import '../multiplayer.css';

const OPP_NAMES = ['BlazingKeys', 'TyperX', 'SwiftFingers', 'AlphaKeys', 'NightTyper'];

export default function FindMatchPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'searching' | 'found' | 'countdown'>('searching');
  const [opponent, setOpponent] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (phase === 'searching') {
      const timer = setTimeout(() => {
        setOpponent(OPP_NAMES[Math.floor(Math.random() * OPP_NAMES.length)]);
        setPhase('found');
      }, 2000 + Math.random() * 2000);
      return () => clearTimeout(timer);
    }

    if (phase === 'found') {
      const timer = setTimeout(() => {
        setPhase('countdown');
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (phase === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        const code = `QM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        navigate(`/multiplayer/findmatch/${code}`, { state: { opponentName: opponent, matchMode: 'quick' } });
      }
    }
  }, [phase, countdown, navigate, opponent]);

  return (
    <AppLayout>
      <div className="multiplayer-page anim-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="mp-card" style={{ textAlign: 'center', padding: '3rem' }}>
          {phase === 'searching' && (
            <>
              <div className="mp-searching__spinner" style={{ margin: '0 auto 1rem' }} />
              <h2>Finding an Opponent...</h2>
              <p>Please wait while we match you with a player.</p>
              <button className="mp-ghost-btn" style={{ marginTop: '2rem' }} onClick={() => navigate('/multiplayer')}>Cancel</button>
            </>
          )}

          {phase === 'found' && (
            <>
              <h2>Opponent Found!</h2>
              <div style={{ margin: '2rem 0', fontSize: '1.5rem', color: 'var(--accent-cyan)' }}>
                You vs <span style={{ fontWeight: 'bold' }}>{opponent}</span>
              </div>
              <p>Get ready!</p>
            </>
          )}

          {phase === 'countdown' && (
            <>
              <h2>Match Starting In</h2>
              <div style={{ fontSize: '5rem', fontWeight: 'bold', color: 'var(--accent-violet)', margin: '2rem 0' }}>
                {countdown}
              </div>
              <p>Prepare your fingers!</p>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
