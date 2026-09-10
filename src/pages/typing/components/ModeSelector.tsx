import type { TypingMode } from '../../../components/types';
import '../typing.css';

interface ModeSelectorProps {
  activeMode: TypingMode;
  onModeChange: (mode: TypingMode) => void;
}

const MODES: { value: TypingMode; label: string }[] = [
  { value: 'common-words', label: 'Common Words' },
  { value: 'quotes',       label: 'Quotes' },
  { value: 'custom-text',  label: 'Custom Text' },
];

export default function ModeSelector({ activeMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="mode-selector" role="tablist" aria-label="Typing mode">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          id={`mode-btn-${value}`}
          role="tab"
          aria-selected={activeMode === value}
          className={`mode-selector__btn ${activeMode === value ? 'mode-selector__btn--active' : ''}`}
          onClick={() => onModeChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
