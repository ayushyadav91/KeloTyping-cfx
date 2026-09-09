import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../../components/layouts/AuthLayout';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import '../auth.css';

export default function AuthPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(
    location.pathname === '/auth/register' ? 'signup' : 'login'
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/auth/register') {
      setActiveTab('signup');
    } else if (location.pathname === '/auth/login') {
      setActiveTab('login');
    }
  }, [location.pathname]);

  const handleTabSwitch = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    navigate(tab === 'login' ? '/auth/login' : '/auth/register', { replace: true });
  };

  return (
    <AuthLayout>
      {/* Tab Toggle */}
      <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
        <button
          role="tab"
          id="tab-login"
          aria-selected={activeTab === 'login'}
          aria-controls="panel-login"
          className={`auth-tab ${activeTab === 'login' ? 'auth-tab--active' : ''}`}
          onClick={() => handleTabSwitch('login')}
        >
          Log In
        </button>
        <button
          role="tab"
          id="tab-signup"
          aria-selected={activeTab === 'signup'}
          aria-controls="panel-signup"
          className={`auth-tab ${activeTab === 'signup' ? 'auth-tab--active' : ''}`}
          onClick={() => handleTabSwitch('signup')}
        >
          Sign Up
        </button>
      </div>

      {/* Form Panels */}
      <div className="auth-panel-wrapper">
        <div
          id="panel-login"
          role="tabpanel"
          aria-labelledby="tab-login"
          className={`auth-panel ${activeTab === 'login' ? 'auth-panel--visible' : 'auth-panel--hidden'}`}
        >
          <LoginForm />
        </div>
        <div
          id="panel-signup"
          role="tabpanel"
          aria-labelledby="tab-signup"
          className={`auth-panel ${activeTab === 'signup' ? 'auth-panel--visible' : 'auth-panel--hidden'}`}
        >
          <SignupForm />
        </div>
      </div>
    </AuthLayout>
  );
}
