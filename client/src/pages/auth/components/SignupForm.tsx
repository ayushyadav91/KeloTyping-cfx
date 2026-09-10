import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../store/AppContext';
import { api } from '../../../components/api';
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
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);

    try {
      const res = await api.auth.register({ username, email, password });
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
        setError(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
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
