import './StatBadge.css';

interface StatBadgeProps {
  label: string;
  value: string | number;
  color?: 'cyan' | 'success' | 'warning' | 'danger';
}

export default function StatBadge({ label, value, color = 'cyan' }: StatBadgeProps) {
  return (
    <div className="stat-badge">
      <span className="stat-badge__label">{label}</span>
      <span className={`stat-badge__value stat-badge__value--${color}`}>{value}</span>
    </div>
  );
}
