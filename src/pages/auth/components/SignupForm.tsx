import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../store/AppContext';
import SocialLogin from './SocialLogin';
import '../auth.css';

export default function SignupForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);

    dispatch({
      type: 'SET_USER',
      payload: {
        id: `user_${Date.now()}`,
        username,
        email,
        avatarInitial: username[0].toUpperCase(),
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        bio: 'Passionate about speed typing 🚀',
      },
    });
    navigate('/home');
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate aria-label="Sign up form">
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-username">Username</label>
        <input
          id="signup-username"
          type="text"
          className="auth-form__input"
          placeholder="speedtyper123"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
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
        <label className="auth-form__label" htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          className="auth-form__input"
          placeholder="min. 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      {error && <p className="auth-form__error" role="alert">{error}</p>}

      <button
        type="submit"
        id="signup-submit-btn"
        className="auth-form__submit"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? <span className="auth-form__spinner" /> : 'Create Account'}
      </button>

      <div className="auth-divider">or continue with</div>
      <SocialLogin />
    </form>
  );
}
