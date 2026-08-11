'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestOtp, verifyOtp, setAuth } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestOtp(phone);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyOtp(phone, code);

      if (result.user.role !== 'OWNER') {
        setError('Access denied. Only committee members (Owners) can access this dashboard.');
        setLoading(false);
        return;
      }

      setAuth(result.accessToken, result.user);
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🏘️ Committee Dashboard</h1>
        <p>Sign in with your registered phone number to access the society management dashboard.</p>

        {error && <div className="login-error">{error}</div>}

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || phone.length !== 10}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                id="otp"
                type="text"
                placeholder="6-digit OTP"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || code.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: '8px' }}
              onClick={() => { setStep('phone'); setCode(''); setError(''); }}
            >
              ← Change Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
