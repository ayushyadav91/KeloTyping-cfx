import { useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/layouts/AppLayout';
import QuickMatch from '../components/QuickMatch';
import PrivateLobby from '../components/PrivateLobby';
import '../multiplayer.css';

export default function MultiplayerPage() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="multiplayer-page anim-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => navigate('/home')} className="landing-btn--ghost" style={{ alignSelf: 'flex-start', marginBottom: '2rem', color: 'inherit' }}>
          ← Back to Dashboard
        </button>
        <div className="multiplayer-page__header">
          <h1 className="multiplayer-page__title">Multiplayer Hub</h1>
          <p className="multiplayer-page__subtitle">Race against players worldwide or challenge your friends</p>
        </div>

        <div className="multiplayer-page__grid">
          <QuickMatch />
          <PrivateLobby />
        </div>
      </div>
    </AppLayout>
  );
}
