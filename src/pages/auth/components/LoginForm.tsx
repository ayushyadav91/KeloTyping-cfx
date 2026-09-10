import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../store/AppContext';
import SocialLogin from './SocialLogin';
import '../auth.css';

export default function LoginForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);

    // Derive username from email prefix
    const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    dispatch({
      type: 'SET_USER',
      payload: {
        id: `user_${Date.now()}`,
        username: username || 'Player',
        email,
        avatarInitial: (username[0] || 'P').toUpperCase(),
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        bio: 'Passionate about speed typing 🚀',
      },
    });
    navigate('/home');
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate aria-label="Login form">
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          className="auth-form__input"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          className="auth-form__input"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {error && <p className="auth-form__error" role="alert">{error}</p>}

      <button
        type="submit"
        id="login-submit-btn"
        className="auth-form__submit"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? <span className="auth-form__spinner" /> : 'Log In'}
      </button>

      <div className="auth-divider">or continue with</div>
      <SocialLogin />
    </form>
  );
}
