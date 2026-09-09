import './Logo.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ size = 'md' }: LogoProps) {
  return (
    <div className={`logo logo--${size}`}>
      <div className="logo__icon" aria-hidden="true">K</div>
      <span className="logo__text">Kelotyping</span>
    </div>
  );
}
