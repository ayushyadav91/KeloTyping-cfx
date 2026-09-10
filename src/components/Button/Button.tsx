import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    'kbtn',
    `kbtn--${variant}`,
    `kbtn--${size}`,
    fullWidth && 'kbtn--full',
    loading && 'kbtn--loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading && <span className="kbtn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
