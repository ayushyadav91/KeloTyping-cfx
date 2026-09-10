import '../results.css';

interface KeyHeatmapProps {
  keyErrors: Record<string, number>;
}

const KEYBOARD_ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

export default function KeyHeatmap({ keyErrors }: KeyHeatmapProps) {
  const maxErrors = Math.max(...Object.values(keyErrors), 1);

  const getKeyClass = (key: string) => {
    const errors = keyErrors[key] || 0;
    if (errors === 0) return 'key-heatmap__key--none';
    if (errors / maxErrors < 0.5) return 'key-heatmap__key--low';
    return 'key-heatmap__key--high';
  };

  return (
    <div className="key-heatmap">
      <p className="key-heatmap__title">Key Error Heatmap</p>

      <div className="key-heatmap__keyboard" aria-label="Keyboard heatmap showing error frequency per key">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="key-heatmap__row">
            {row.map(key => (
              <div
                key={key}
                className={`key-heatmap__key ${getKeyClass(key)}`}
                title={`${key.toUpperCase()}: ${keyErrors[key] || 0} error${(keyErrors[key] || 0) !== 1 ? 's' : ''}`}
                aria-label={`Key ${key.toUpperCase()}: ${keyErrors[key] || 0} errors`}
              >
                {key}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="key-heatmap__legend">
        <div className="key-heatmap__legend-item">
          <div className="key-heatmap__legend-dot key-heatmap__legend-dot--none" />
          No errors
        </div>
        <div className="key-heatmap__legend-item">
          <div className="key-heatmap__legend-dot key-heatmap__legend-dot--high" />
          Frequent
        </div>
      </div>
    </div>
  );
}
