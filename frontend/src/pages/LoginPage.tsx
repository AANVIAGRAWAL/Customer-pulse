import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, Loader } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import axios from 'axios';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [useMock, setUseMock] = useState(false); // Developer toggle for testing without Firebase setup
  
  const navigate = useNavigate();

  const handleFirebaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ email: userCredential.user.email }));
        setMessage("Account created successfully!");
        setTimeout(() => navigate('/upload'), 1000);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ email: userCredential.user.email }));
        navigate('/upload');
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Authentication failed.";
      if (err.code === 'auth/invalid-credential') {
        errMsg = "Invalid email or password.";
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = "An account with this email already exists.";
      } else if (err.code === 'auth/weak-password') {
        errMsg = "Password should be at least 6 characters.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ email: result.user.email }));
      navigate('/upload');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  // Mock Developer Login to allow testing without Firebase Setup
  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call backend mock login endpoint which returns a signed token
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';
      const response = await axios.post(`${API_BASE_URL}/auth/mock-login`, { email });
      
      if (response.data.status === 'success') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/upload');
      } else {
        setError("Mock login failed.");
      }
    } catch (err: any) {
      setError("Mock login endpoint is not running or failed. Make sure Flask backend is active.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">CustomerPulse</div>
          <p className="login-subtitle">
            {useMock 
              ? "Dev Mock Mode: Authenticate without Firebase credentials" 
              : "Analyze customer churn using predictive machine learning"}
          </p>
        </div>

        {error && (
          <div className="auth-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="auth-alert success">
            <ShieldCheck size={18} />
            <span>{message}</span>
          </div>
        )}

        {useMock ? (
          /* Mock Login Form */
          <form onSubmit={handleMockLogin} className="auth-form">
            <div className="input-group">
              <label htmlFor="mock-email">Developer Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  id="mock-email"
                  placeholder="developer@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <p className="input-help-text" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Enter any email to sign in using local JWT signing.
              </p>
            </div>

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? <Loader className="animate-spin" size={18} /> : 'Login via Mock Mode'}
            </button>
          </form>
        ) : (
          /* Firebase Auth Form */
          <form onSubmit={handleFirebaseAuth} className="auth-form">
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  id="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {isSignUp && (
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? <Loader className="animate-spin" size={18} /> : (isSignUp ? 'Create Account' : 'Log In')}
            </button>

            {!isSignUp && (
              <>
                <div className="auth-divider">
                  <span>OR</span>
                </div>

                <button 
                  type="button" 
                  className="btn-google" 
                  onClick={handleGoogleSignIn} 
                  disabled={loading}
                >
                  <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Sign In with Google
                </button>
              </>
            )}
          </form>
        )}

        <div className="auth-footer">
          {useMock ? (
            <button 
              className="toggle-mode-btn" 
              onClick={() => { setUseMock(false); setError(''); }}
              style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              Switch back to Firebase Auth
            </button>
          ) : (
            <div className="auth-toggle-links" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginTop: '20px' }}>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setMessage('');
                }}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
              >
                {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
              </button>
              
              <button 
                className="toggle-mode-btn" 
                onClick={() => { setUseMock(true); setError(''); }}
                style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
              >
                Enable Developer Mock Mode (Bypass Firebase setup)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
