import type { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  glow?: 'cyan' | 'success' | 'danger' | 'warning';
  onClick?: () => void;
}

export default function Card({ children, className = '', elevated = false, glow, onClick }: CardProps) {
  const classes = [
    'kcard',
    elevated && 'kcard--elevated',
    glow && `kcard--glow-${glow}`,
    onClick && 'kcard--clickable',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  );
}
