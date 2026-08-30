import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Key, ShieldCheck, AlertCircle, ArrowRight, Loader } from 'lucide-react';
import { sendOtp, verifyOtp } from '../services/api';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isMockMode, setIsMockMode] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await sendOtp(email);
      if (response.status === 'success') {
        setStep(2);
        setMessage(response.message);
        setIsMockMode(!!response.mock_mode);
      } else {
        setError(response.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError('');

    try {
      const response = await verifyOtp(email, otp);
      if (response.status === 'success' && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/dashboard');
      } else {
        setError(response.message || 'Invalid OTP.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">CustomerPulse</div>
          <p className="login-subtitle">Secure passwordless entry via One-Time Password</p>
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

        {isMockMode && step === 2 && (
          <div className="auth-alert info">
            <ShieldCheck size={18} />
            <span><strong>Mock Mode Active:</strong> OTP has been printed to the server terminal logs.</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="auth-form">
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

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? <Loader className="animate-spin" size={18} /> : 'Send Login Code'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="input-group">
              <label htmlFor="otp">Enter 6-Digit Code</label>
              <div className="input-wrapper">
                <Key className="input-icon" size={18} />
                <input
                  type="text"
                  id="otp"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-actions">
              <button type="submit" className="btn-auth" disabled={loading}>
                {loading ? <Loader className="animate-spin" size={18} /> : 'Verify & Enter'}
              </button>
              <button
                type="button"
                className="btn-back"
                onClick={() => {
                  setStep(1);
                  setMessage('');
                  setError('');
                }}
                disabled={loading}
              >
                Back to email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
