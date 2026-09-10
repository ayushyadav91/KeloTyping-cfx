import '../results.css';

interface WpmChartProps {
  wpmOverTime: number[];
  peakWpm: number;
  avgWpm: number;
  consistency: number;
}

export default function WpmChart({ wpmOverTime, peakWpm, avgWpm, consistency }: WpmChartProps) {
  const maxWpm = Math.max(...wpmOverTime, 1);
  const timeLabels = wpmOverTime.map((_, i) => `${(i + 1) * 6}s`);

  return (
    <div className="wpm-chart">
      <p className="wpm-chart__title">WPM Over Time</p>

      <div className="wpm-chart__bars" aria-label="WPM over time bar chart">
        {wpmOverTime.map((wpm, i) => {
          const heightPct = (wpm / maxWpm) * 100;
          return (
            <div key={i} className="wpm-chart__bar-wrap">
              <div
                className="wpm-chart__bar"
                style={{
                  height: `${heightPct}%`,
                  animationDelay: `${i * 0.05}s`,
                }}
                role="img"
                aria-label={`${timeLabels[i]}: ${wpm} WPM`}
                title={`${timeLabels[i]}: ${wpm} WPM`}
              />
              <span className="wpm-chart__bar-label">{timeLabels[i]}</span>
            </div>
          );
        })}
      </div>

      <div className="wpm-chart__footer">
        <div className="wpm-chart__footer-stat">
          <span className="wpm-chart__footer-label">Peak WPM</span>
          <span className="wpm-chart__footer-value" style={{ color: 'var(--text-primary)' }}>{peakWpm}</span>
        </div>
        <div className="wpm-chart__footer-stat">
          <span className="wpm-chart__footer-label">Average WPM</span>
          <span className="wpm-chart__footer-value" style={{ color: 'var(--text-primary)' }}>{avgWpm}</span>
        </div>
        <div className="wpm-chart__footer-stat">
          <span className="wpm-chart__footer-label">Consistency</span>
          <span className="wpm-chart__footer-value" style={{ color: 'var(--success)' }}>{consistency}%</span>
        </div>
      </div>
    </div>
  );
}
