import type { ReactNode } from 'react';
import Logo from '../Logo/Logo';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      {/* Animated background particles */}
      <div className="auth-layout__bg" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="auth-layout__particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${8 + Math.random() * 12}s`,
              animationDelay: `${Math.random() * 8}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              opacity: 0.2 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>

      {/* Grid overlay */}
      <div className="auth-layout__grid" aria-hidden="true" />

      {/* Header */}
      <header className="auth-layout__header">
        <Logo size="lg" />
        <p className="auth-layout__tagline">Become a typing master</p>
      </header>

      {/* Form card */}
      <div className="auth-layout__card">
        {children}
      </div>
    </div>
  );
}
