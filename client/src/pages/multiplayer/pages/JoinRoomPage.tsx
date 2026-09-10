import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/layouts/AppLayout';
import { socketEvents } from '../../../components/socket';
import '../multiplayer.css';

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [phase, setPhase] = useState<'input' | 'joining' | 'waiting_accept' | 'countdown'>('input');
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState('');

  const handleJoin = () => {
    if (!joinCode) return;
    setPhase('joining');
    setError('');

    socketEvents.emitJoinRoom(joinCode);

    // Fallback simulation timer if socket room server doesn't respond
    const timeout = setTimeout(() => {
      setPhase('waiting_accept');
    }, 1500);

    return () => clearTimeout(timeout);
  };

  useEffect(() => {
    const handleRoomState = (state: any) => {
      if (state.code) {
        setPhase('waiting_accept');
      }
    };

    const handleRoomCountdown = (data: any) => {
      setPhase('countdown');
      setCountdown(data.secondsRemaining ?? data);
    };

    const handleRaceStarted = (data: any) => {
      navigate(`/multiplayer/joinroom/${joinCode}`, {
        state: { opponentName: 'Host Player', matchMode: 'private', playersCount: 2, promptData: data },
      });
    };

    const handleError = (err: any) => {
      setError(err.message || 'Could not join room');
      setPhase('input');
    };

    socketEvents.onRoomState(handleRoomState);
    socketEvents.onRoomCountdown(handleRoomCountdown);
    socketEvents.onRaceStarted(handleRaceStarted);
    socketEvents.onError(handleError);

    return () => {
      socketEvents.offRoomState(handleRoomState);
      socketEvents.offRoomCountdown(handleRoomCountdown);
      socketEvents.offRaceStarted(handleRaceStarted);
      socketEvents.offError(handleError);
    };
  }, [joinCode, navigate]);

  useEffect(() => {
    if (phase === 'waiting_accept') {
      const timer = setTimeout(() => {
        setPhase('countdown');
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (phase === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        navigate(`/multiplayer/joinroom/${joinCode}`, {
          state: { opponentName: 'Host Player', matchMode: 'private', playersCount: 2 },
        });
      }
    }
  }, [phase, countdown, navigate, joinCode]);

  return (
    <AppLayout>
      <div className="multiplayer-page anim-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="mp-card" style={{ textAlign: 'center', padding: '3rem', minWidth: '400px' }}>
          
          {phase === 'input' && (
            <>
              <h2 className="mp-card__title" style={{ marginBottom: '1rem' }}>Join Private Room</h2>
              {error && <p style={{ color: 'var(--accent-rose)', marginBottom: '1rem' }}>{error}</p>}
              <input
                type="text" 
                className="mp-join-input"
                placeholder="Enter Room Code (e.g. KELO-7X42)" 
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={12}
                style={{ width: '100%', marginBottom: '1.5rem' }}
              />
              <button 
                className="mp-find-btn" 
                disabled={joinCode.length < 4} 
                onClick={handleJoin}
                style={{ width: '100%' }}
              >
                Join Room
              </button>
              <button className="mp-ghost-btn" style={{ marginTop: '1rem' }} onClick={() => navigate('/multiplayer')}>Back</button>
            </>
          )}

          {phase === 'joining' && (
            <>
              <div className="mp-waiting-box__spinner" style={{ margin: '0 auto 1rem' }} />
              <h3 className="mp-waiting-box__title">Connecting to Room...</h3>
              <p>Looking for room {joinCode}</p>
            </>
          )}

          {phase === 'waiting_accept' && (
            <>
              <div className="mp-waiting-box__spinner" style={{ margin: '0 auto 1rem' }} />
              <h3 className="mp-waiting-box__title">Request Sent</h3>
              <p>Waiting for the leader to accept you into the room.</p>
            </>
          )}

          {phase === 'countdown' && (
            <>
              <h2>Accepted! Match Starting In</h2>
              <div style={{ fontSize: '5rem', fontWeight: 'bold', color: 'var(--accent-violet)', margin: '2rem 0' }}>
                {countdown}
              </div>
              <p>Get ready!</p>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
