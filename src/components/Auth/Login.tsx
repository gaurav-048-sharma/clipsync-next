'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMsalInstance } from '@/lib/config/msalConfig';
import axios from 'axios';
import { BsMicrosoft } from 'react-icons/bs';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const msalInstance = getMsalInstance();

  const handleMicrosoftLogin = async () => {
    setError('');
    setLoading(true);
    const loginRequest = {
      scopes: ['User.Read'],
      prompt: 'select_account' as const,
    };

    try {
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      const msalToken = loginResponse.accessToken;
      localStorage.setItem('msalToken', msalToken);

      const response = await axios.post('/api/auth/microsoft-login', {
        token: msalToken,
      });
      localStorage.setItem('token', response.data.token);
      if (response.data.college) {
        localStorage.setItem('college', JSON.stringify(response.data.college));
      }
      if (response.data.enrollmentId) {
        localStorage.setItem('enrollmentId', response.data.enrollmentId);
      }
      if (response.data.department) {
        localStorage.setItem('department', response.data.department);
      }
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Microsoft Login error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Microsoft Login failed';
      const hint = err.response?.data?.hint || '';
      setError(hint ? `${errorMessage}. ${hint}` : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-theme-background">
      <div className="w-full max-w-[350px]">
        {/* Logo & branding */}
        <div className="text-center mb-8">
          <img
            src="/logo.svg"
            alt="ClipSync"
            className="w-16 h-16 mx-auto mb-4 rounded-full"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-theme-color">
            ClipSync
          </h1>
          <p className="text-sm mt-1 text-theme-color opacity-50">
            Your college community
          </p>
        </div>

        {/* Login card */}
        <div className="border rounded-lg p-8 bg-theme-background border-theme-color">
          <p className="text-center text-sm text-theme-color opacity-70 mb-6">
            Sign in with your college Microsoft account
          </p>

          <button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-md font-medium text-sm transition-colors bg-[#2f2f2f] text-white hover:bg-[#404040] disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#f3f3f3] dark:text-[#1a1a1a] dark:hover:bg-[#e0e0e0]"
          >
            <BsMicrosoft className="w-4 h-4 flex-shrink-0" />
            {loading ? 'Signing in...' : 'Sign in with Microsoft'}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400 text-xs text-center">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-theme-color opacity-40 mt-6">
          Only registered college emails are supported
        </p>
      </div>
    </div>
  );
};

export default Login;
