import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../store/AppContext';
import { api } from '../../../components/api';
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

    try {
      const res = await api.auth.login({ email, password });
      if (res.user && res.token) {
        const userObj = {
          id: res.user.id || res.user._id,
          username: res.user.username,
          email: res.user.email,
          avatarInitial: (res.user.username?.[0] || 'U').toUpperCase(),
          joinedDate: 'Member',
          bestWpm: res.user.bestWpm || 0,
        };
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: userObj, token: res.token },
        });
        navigate('/home');
      } else {
        setError(res.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
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
