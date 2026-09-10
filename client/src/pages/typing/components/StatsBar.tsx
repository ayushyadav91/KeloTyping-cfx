import '../typing.css';

interface StatsBarProps {
  wpm: number;
  accuracy: number;
  timeLeft: number;
  totalTyped: number;
  totalChars: number;
  onReset: () => void;
}

export default function StatsBar({ wpm, accuracy, timeLeft, totalTyped, totalChars, onReset }: StatsBarProps) {
  const progress = totalChars > 0 ? Math.min((totalTyped / totalChars) * 100, 100) : 0;

  return (
    <div className="stats-bar" role="status" aria-live="polite" aria-label="Live test statistics">
      <div className="stats-bar__stat">
        <span className="stats-bar__label">WPM</span>
        <span className="stats-bar__value stats-bar__value--wpm" aria-label={`${wpm} words per minute`}>{wpm}</span>
      </div>

      <div className="stats-bar__stat">
        <span className="stats-bar__label">ACCURACY</span>
        <span className="stats-bar__value stats-bar__value--accuracy" aria-label={`${accuracy} percent accuracy`}>{accuracy}%</span>
      </div>

      <div className="stats-bar__stat">
        <span className="stats-bar__label">TIME</span>
        <span className="stats-bar__value stats-bar__value--time" aria-label={`${timeLeft} seconds remaining`}>{timeLeft}s</span>
      </div>

      <div className="stats-bar__stat">
        <span className="stats-bar__label">CHARS</span>
        <span className="stats-bar__value" aria-label={`${totalTyped} of ${totalChars} characters`}>
          {totalTyped}/{totalChars}
        </span>
      </div>

      <div className="stats-bar__progress" aria-hidden="true">
        <div className="stats-bar__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <button
        className="stats-bar__reset"
        onClick={onReset}
        id="reset-test-btn"
        aria-label="Reset test (Tab)"
        title="Reset (Tab)"
      >
        ↺ Reset
      </button>
    </div>
  );
}
