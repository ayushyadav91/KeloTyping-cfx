import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/layouts/AppLayout';
import '../multiplayer.css';

const ROOM_CODE = 'KELO-7X42';
const OPPONENT_NAMES = ['BlazingKeys', 'TyperX', 'SwiftFingers', 'CodeRunner', 'NightTyper'];

interface IncomingUser {
  id: string;
  name: string;
}

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState<IncomingUser[]>([]);
  const [accepted, setAccepted] = useState<IncomingUser[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Simulate incoming users joining the room
  useEffect(() => {
    if (countdown !== null) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.5 && incoming.length + accepted.length < 4) {
        const name = OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
        // Check if name already in room
        if (!incoming.some(u => u.name === name) && !accepted.some(u => u.name === name)) {
          setIncoming(prev => [...prev, { id: Math.random().toString(36).substr(2, 5), name }]);
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [incoming, accepted, countdown]);

  const handleAccept = (user: IncomingUser) => {
    setIncoming(prev => prev.filter(u => u.id !== user.id));
    setAccepted(prev => [...prev, user]);
  };

  const handleReject = (user: IncomingUser) => {
    setIncoming(prev => prev.filter(u => u.id !== user.id));
  };

  const handleStartMatch = () => {
    setCountdown(5);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Just pass the first accepted opponent to the match for now
      const oppName = accepted.length > 0 ? accepted[0].name : 'AI Bot';
      navigate(`/multiplayer/createroom/${ROOM_CODE}`, {
        state: { opponentName: oppName, matchMode: 'private', playersCount: accepted.length + 1 },
      });
    }
  }, [countdown, accepted, navigate]);

  return (
    <AppLayout>
      <div className="multiplayer-page anim-fade-in" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          
          {/* Left Side: Users / Lobby */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div className="mp-card">
              <h2 className="mp-card__title">Incoming Requests</h2>
              <p className="mp-card__subtitle" style={{ marginBottom: '1rem' }}>Players trying to join your room</p>
              
              {incoming.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No incoming requests...</p>}
              
              {incoming.map(user => (
                <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{user.name}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="mp-accept-btn" onClick={() => handleAccept(user)}>Accept</button>
                    <button className="mp-decline-btn" onClick={() => handleReject(user)}>Reject</button>
                  </div>
                </div>
              ))}

              <h2 className="mp-card__title" style={{ marginTop: '2rem' }}>Room Members (Max 4)</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>1. You (Leader)</span>
                </div>
                {accepted.map((user, index) => (
                  <div key={user.id} style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{index + 2}. {user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Room Info & Start */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div className="mp-card" style={{ textAlign: 'center' }}>
              <h2 className="mp-card__title">Private Room</h2>
              <p className="mp-card__subtitle">Share this code with your friends</p>
              
              <div className="mp-code-box" style={{ marginTop: '2rem', textAlign: 'left' }}>
                <p className="mp-code-box__label">Your Room Code</p>
                <div className="mp-code-box__row">
                  <span className="mp-code-box__code">{ROOM_CODE}</span>
                  <button className="mp-copy-btn" onClick={() => navigator.clipboard.writeText(ROOM_CODE)}>Copy</button>
                </div>
              </div>

              {countdown !== null ? (
                <div style={{ marginTop: '2rem' }}>
                  <h3>Match starts in</h3>
                  <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--accent-rose)' }}>{countdown}</div>
                </div>
              ) : (
                <button 
                  className="mp-find-btn" 
                  style={{ marginTop: '2rem', width: '100%' }}
                  onClick={handleStartMatch}
                  disabled={accepted.length === 0}
                >
                  Start Match
                </button>
              )}
              {accepted.length === 0 && countdown === null && (
                <p style={{ marginTop: '1rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Wait for players to join before starting.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
