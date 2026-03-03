'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { getMsalInstance, loginRequest } from '@/lib/config/msalConfig';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BsMicrosoft } from 'react-icons/bs';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isMsalInitialized, setIsMsalInitialized] = useState(true);
  const router = useRouter();
  const msalInstance = getMsalInstance();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualSignup = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/signup', formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  const handleGoogleSignup = async (credentialResponse: CredentialResponse) => {
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
      console.error('Google Signup error:', err);
      const errorMsg = err.response?.data?.message || 'Google Signup failed';
      if (errorMsg.includes('not allowed') || errorMsg.includes('Access denied')) {
        setError(errorMsg + ' Only college email addresses are accepted.');
      } else {
        setError(errorMsg);
      }
    }
  };

  // MSAL is already initialized by AuthProvider before this component renders.
  // No need to call initialize() again.

  const handleMicrosoftSignup = async () => {
    if (!isMsalInitialized) {
      setError('Authentication not yet initialized. Please wait.');
      return;
    }

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
      console.error('Microsoft Signup error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || 'Microsoft Signup failed';
      if (errorMsg.includes('not allowed') || errorMsg.includes('Access denied')) {
        setError(errorMsg + ' Only college email addresses are accepted.');
      } else {
        setError(errorMsg);
      }
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 bg-theme-background"
    >
      <div className="w-full max-w-sm">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <img
            src="/logo.svg"
            alt="ClipSync"
            className="w-24 h-24 mx-auto mb-4 rounded-full"
          />
          <h1
            className="text-4xl font-light mb-2 text-theme-color font-cursive"
          >
            ClipSync
          </h1>
          <p
            className="text-sm font-medium text-theme-color opacity-60"
          >
            Sign up to see photos and videos from your friends.
          </p>
        </div>

        {/* Signup Card */}
        <Card
          className="border rounded-sm bg-theme-background border-theme-color"
        >
          <CardContent className="p-10 space-y-5">
            <div className="flex flex-col space-y-3">
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSignup}
                  onError={() => setError('Google Signup failed')}
                  text="signup_with"
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
                onClick={handleMicrosoftSignup}
                disabled={!isMsalInitialized}
                className="w-full flex items-center justify-center gap-3 py-6 rounded-lg transition-all auth-ms-button"
              >
                <BsMicrosoft className="w-5 h-5" />
                <span className="font-medium">Sign up with Microsoft</span>
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <p
              className="text-xs text-center mt-6 text-theme-color opacity-50"
            >
              By signing up, you agree to our Terms, Data Policy and Cookies
              Policy.
            </p>
          </CardContent>
        </Card>

        {/* Login Card */}
        <Card
          className="mt-3 border rounded-sm bg-theme-background border-theme-color"
        >
          <CardContent className="p-6 text-center">
            <p className="text-sm text-theme-color">
              Have an account?{' '}
              <span
                onClick={() => router.push('/login')}
                className="font-semibold text-blue-500 hover:text-blue-700 cursor-pointer"
              >
                Log in
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
