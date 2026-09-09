import { useNavigate } from 'react-router-dom';
import '../multiplayer.css';

export default function PrivateLobby() {
  const navigate = useNavigate();

  return (
    <div className="mp-card anim-slide-in-right">
      <div className="mp-card__header">
        <div className="mp-card__icon mp-card__icon--lock"></div>
        <div>
          <h2 className="mp-card__title">Private Lobby</h2>
          <p className="mp-card__subtitle">Play with friends</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <button 
          className="mp-find-btn" 
          onClick={() => navigate('/multiplayer/createroom')}
        >
          Create Room
        </button>
        <button 
          className="mp-find-btn" 
          onClick={() => navigate('/multiplayer/joinroom')}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}
