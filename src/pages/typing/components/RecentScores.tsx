import { useAppState } from '../../../store/AppContext';
import '../typing.css';

function formatRelativeDate(isoString: string): string {
  const date  = new Date(isoString);
  const now   = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH  = diffMs / 3_600_000;
  const diffD  = diffMs / 86_400_000;

  if (diffH < 1)   return 'Just now';
  if (diffH < 24)  return `${Math.floor(diffH)}h ago`;
  if (diffD < 2)   return 'Yesterday';
  if (diffD < 7)   return `${Math.floor(diffD)} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecentScores() {
  const { matchHistory } = useAppState();
  const recent = matchHistory.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="recent-scores">
        <p className="recent-scores__title">Recent Tests</p>
        <div className="recent-scores__empty">
          <span className="recent-scores__empty-icon">⌨️</span>
          <p>No tests yet — start typing!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-scores">
      <p className="recent-scores__title">Recent Tests</p>
      <ul className="recent-scores__list" aria-label="Recent test results">
        {recent.map((r, i) => (
          <li key={r.id} className="recent-scores__item anim-fade-in-up" style={{ animationDelay: `${i * 0.06}s`, animationFillMode: 'both' }}>
            <div className="recent-scores__meta">
              <span className="recent-scores__date">{formatRelativeDate(r.date)}</span>
              <span className="recent-scores__mode">{r.mode === 'common-words' ? 'Words' : r.mode === 'quotes' ? 'Quote' : 'Custom'} · {r.time}s</span>
            </div>
            <div className="recent-scores__stats">
              <span className="recent-scores__wpm">{r.wpm}</span>
              <span className="recent-scores__unit">wpm</span>
              <span className="recent-scores__acc">{r.accuracy}%</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
