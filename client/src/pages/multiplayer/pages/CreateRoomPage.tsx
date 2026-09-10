import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/layouts/AppLayout';
import { socketEvents } from '../../../components/socket';
import { useAppState } from '../../../store/AppContext';
import '../multiplayer.css';

const OPPONENT_NAMES = ['BlazingKeys', 'TyperX', 'SwiftFingers', 'CodeRunner', 'NightTyper'];

interface IncomingUser {
  id: string;
  name: string;
}

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { user } = useAppState();
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<IncomingUser[]>([]);
  const [accepted, setAccepted] = useState<IncomingUser[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const handleRoomState = (state: any) => {
      if (state.code) setRoomCode(state.code);
      if (state.players && Array.isArray(state.players)) {
        setPlayers(state.players);
      }
    };

    const handleRoomCountdown = (data: any) => {
      setCountdown(data.secondsRemaining ?? data);
    };

    const handleRaceStarted = (data: any) => {
      const code = roomCode || data.code || 'ROOM';
      navigate(`/multiplayer/createroom/${code}`, {
        state: {
          opponentName: players.find(p => p.username !== user?.username)?.username || 'Opponent',
          opponents: players.filter(p => p.username !== user?.username).map(p => p.username),
          matchMode: 'private',
          playersCount: players.length,
          promptData: data,
        },
      });
    };

    socketEvents.onRoomState(handleRoomState);
    socketEvents.onRoomCountdown(handleRoomCountdown);
    socketEvents.onRaceStarted(handleRaceStarted);

    socketEvents.emitCreateRoom({ maxPlayers: 6 });

    return () => {
      socketEvents.offRoomState(handleRoomState);
      socketEvents.offRoomCountdown(handleRoomCountdown);
      socketEvents.offRaceStarted(handleRaceStarted);
    };
  }, [navigate, roomCode, players, user]);

  // Fallback simulation for local practice testing
  useEffect(() => {
    if (players.length > 1 || countdown !== null) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.5 && incoming.length + accepted.length < 3) {
        const name = OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
        if (!incoming.some(u => u.name === name) && !accepted.some(u => u.name === name)) {
          setIncoming(prev => [...prev, { id: Math.random().toString(36).substring(2, 7), name }]);
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [incoming, accepted, countdown, players]);

  const handleAccept = (u: IncomingUser) => {
    setIncoming(prev => prev.filter(x => x.id !== u.id));
    setAccepted(prev => [...prev, u]);
  };

  const handleReject = (u: IncomingUser) => {
    setIncoming(prev => prev.filter(x => x.id !== u.id));
  };

  const handleStartMatch = () => {
    // If connected via real socket room
    if (players.length > 1) {
      socketEvents.emitToggleReady();
    } else {
      setCountdown(3);
    }
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (players.length <= 1) {
      const oppName = accepted.length > 0 ? accepted[0].name : 'BlazingKeys';
      const code = roomCode || 'KELO-7X42';
      navigate(`/multiplayer/createroom/${code}`, {
        state: { opponentName: oppName, opponents: accepted.map(a => a.name), matchMode: 'private', playersCount: accepted.length + 1 },
      });
    }
  }, [countdown, accepted, navigate, roomCode, players]);

  const displayCode = roomCode || 'KELO-7X42';

  return (
    <AppLayout>
      <div className="multiplayer-page anim-fade-in" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          
          {/* Left Side: Users / Lobby */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div className="mp-card">
              <h2 className="mp-card__title">Room Players</h2>
              <p className="mp-card__subtitle" style={{ marginBottom: '1rem' }}>
                {players.length > 0 ? `Connected Players (${players.length})` : 'Waiting for players to join...'}
              </p>

              {players.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  {players.map((p, index) => (
                    <div key={p.userId || index} style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: p.isHost ? 'var(--accent-cyan)' : 'inherit' }}>
                        {index + 1}. {p.username} {p.isHost ? '(Host)' : ''}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: p.isReady ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>
                        {p.isReady ? '✓ Ready' : 'Waiting...'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {incoming.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{u.name}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="mp-accept-btn" onClick={() => handleAccept(u)}>Accept</button>
                        <button className="mp-decline-btn" onClick={() => handleReject(u)}>Reject</button>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>1. You ({user?.username || 'Host'})</span>
                    </div>
                    {accepted.map((u, index) => (
                      <div key={u.id} style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>{index + 2}. {u.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
                  <span className="mp-code-box__code">{displayCode}</span>
                  <button className="mp-copy-btn" onClick={() => navigator.clipboard.writeText(displayCode)}>Copy</button>
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
                >
                  Start Match
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
