import type { TestResult } from '../../../components/types';
import '../results.css';

interface StatCardsProps {
  result: TestResult;
}

export default function StatCards({ result }: StatCardsProps) {
  const cards = [
    { label: 'WPM',      value: result.wpm,      sub: 'words per minute',      color: 'cyan',    delay: 1 },
    { label: 'ACCURACY', value: `${result.accuracy}%`, sub: 'characters correct', color: 'success', delay: 2 },
    { label: 'ERRORS',   value: result.errors,   sub: 'incorrect keystrokes',  color: 'danger',  delay: 3 },
    { label: 'STREAK',   value: result.streak,   sub: 'days in a row',         color: 'warning', delay: 4 },
  ];

  return (
    <div className="stat-cards">
      {cards.map(({ label, value, sub, color, delay }) => (
        <div
          key={label}
          className={`stat-card anim-delay-${delay}`}
          role="group"
          aria-label={`${label}: ${value}`}
        >
          <span className="stat-card__label">{label}</span>
          <span className={`stat-card__value stat-card__value--${color}`}>{value}</span>
          <span className="stat-card__sub">{sub}</span>
        </div>
      ))}
    </div>
  );
}
