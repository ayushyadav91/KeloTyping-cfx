import type { TimeDuration } from '../../../components/types';
import '../typing.css';

interface TimeSelectorProps {
  activeDuration: TimeDuration;
  onDurationChange: (d: TimeDuration) => void;
}

const DURATIONS: TimeDuration[] = [15, 30, 60, 120];

export default function TimeSelector({ activeDuration, onDurationChange }: TimeSelectorProps) {
  return (
    <div className="time-selector" role="group" aria-label="Test duration">
      <span className="time-selector__label">Time:</span>
      <div className="time-selector__options">
        {DURATIONS.map(d => (
          <button
            key={d}
            id={`time-btn-${d}s`}
            className={`time-selector__btn ${activeDuration === d ? 'time-selector__btn--active' : ''}`}
            onClick={() => onDurationChange(d)}
            aria-pressed={activeDuration === d}
          >
            {d}s
          </button>
        ))}
        <button
          id="time-btn-keys"
          className="time-selector__btn"
          aria-label="Keys mode"
        >
          ⌨ Keys
        </button>
      </div>
    </div>
  );
}
