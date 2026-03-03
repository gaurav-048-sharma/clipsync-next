'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { getMsalInstance } from '@/lib/config/msalConfig';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BsMicrosoft } from 'react-icons/bs';

const Login = () => {
  const [error, setError] = useState('');
  const [isMsalInitialized, setIsMsalInitialized] = useState(true);
  const router = useRouter();
  const msalInstance = getMsalInstance();

  // MSAL is already initialized by AuthProvider before this component renders.
  // No need to call initialize() again.

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const response = await axios.post('/api/auth/google-login', {
        token: credentialResponse.credential,
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
      console.error('Google Login error:', err);
      const errorMessage = err.response?.data?.message || 'Google Login failed';
      const hint = err.response?.data?.hint || '';
      setError(hint ? `${errorMessage}. ${hint}` : errorMessage);
    }
  };

  const handleGoogleError = () => {
    setError('Google Login failed');
  };

  const handleMicrosoftLogin = async () => {
    if (!isMsalInitialized) {
      setError('Authentication not yet initialized. Please wait.');
      return;
    }
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
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen p-3 sm:p-4 bg-theme-background"
    >
      <div className="w-full max-w-sm">
        {/* Logo Section */}
        <div className="text-center mb-6 sm:mb-8">
          <img
            src="/logo.svg"
            alt="ClipSync"
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 rounded-full"
          />
          <h1
            className="text-3xl sm:text-4xl font-light mb-2 text-theme-color font-cursive"
          >
            ClipSync
          </h1>
          <p
            className="text-xs sm:text-sm px-4 text-theme-color opacity-60"
          >
            Sign in to see photos and videos from your friends
          </p>
        </div>

        {/* Login Card */}
        <Card
          className="border rounded-sm bg-theme-background border-theme-color"
        >
          <CardContent className="p-6 sm:p-10 space-y-4 sm:space-y-5">
            <div className="flex flex-col space-y-3">
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signin_with"
                  shape="rectangular"
                  size="large"
                  width="100%"
                />
              </div>

              <div className="flex items-center gap-4 my-4">
                <div
                  className="flex-1 h-px bg-border-color"
                />
                <span
                  className="text-xs font-semibold text-theme-color opacity-40"
                >
                  OR
                </span>
                <div
                  className="flex-1 h-px bg-border-color"
                />
              </div>

              <Button
                onClick={handleMicrosoftLogin}
                disabled={!isMsalInitialized}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 py-5 sm:py-6 rounded-lg transition-all active:scale-[0.98] auth-ms-button"
              >
                <BsMicrosoft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">
                  Sign in with Microsoft
                </span>
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-2.5 sm:p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-red-600 text-xs sm:text-sm text-center">
                  {error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign Up Card */}
        <Card
          className="mt-3 border rounded-sm bg-theme-background border-theme-color"
        >
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-xs sm:text-sm text-theme-color">
              Don&apos;t have an account?{' '}
              <span
                onClick={() => router.push('/signup')}
                className="font-semibold text-blue-500 hover:text-blue-700 cursor-pointer active:opacity-70"
              >
                Sign up
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
