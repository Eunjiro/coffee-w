'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Coffee, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const res = await fetch('/api/auth/session');
      const session = await res.json();

      if (session?.user?.role) {
        switch (session.user.role) {
          case 'ADMIN':
            router.push('/admin');
            break;
          case 'CASHIER':
            router.push('/cashier');
            break;
          case 'BARISTA':
            router.push('/barista');
            break;
          default:
            router.push('/');
        }
      }
    }

    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', { username, password, redirect: false });

      if (res?.error) {
        setError('Invalid credentials');
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-[#776B5D] overflow-hidden px-4">
      {/* Background Image */}
      <div className="absolute w-full h-full bg-[url('/login-background.jpg')] bg-cover bg-center z-0"></div>

      {/* Login Card */}
      <div className="relative flex flex-col items-center gap-4 p-6 w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-md z-10">
        {/* Decorative Image */}
        <img
          src="/beans.png"
          alt="Decoration"
          className="absolute left-4 bottom-4 w-16 h-16 -scale-x-100 sm:w-20 sm:h-20"
        />

        {/* Logo + Title */}
        <div className="flex flex-row justify-center items-center gap-2 w-full h-[64px] pt-4">
          <div className="flex items-center justify-center p-2 rounded-full">
            <Coffee className="w-8 h-8 text-[#776B5D]" strokeWidth={2.5} />
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-[#776B5D] leading-[36px] sm:leading-[48px]">
            Coffee Win
          </h1>
        </div>

        <p className="text-[14px] sm:text-[16px] text-[#776B5D] leading-5 sm:leading-6">
          Login to your account
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded w-full text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full px-2 sm:px-4">
          {/* Username */}
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="text-[14px] sm:text-[16px] text-[#776B5D]">
              Username
            </label>
            <div className="flex items-center gap-2 px-3 py-2 border border-[#B0A695] rounded-lg">
              <User className="w-5 h-5 text-[#776B5D]" />
              <input
                id="username"
                type="text"
                required
                placeholder="Enter your username"
                className="flex-1 text-[14px] sm:text-[16px] text-[#776B5D] placeholder:text-[#776B5D] outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[14px] sm:text-[16px] text-[#776B5D]">
              Password
            </label>
            <div className="flex items-center gap-2 px-3 py-2 border border-[#B0A695] rounded-lg">
              <Lock className="w-5 h-5 text-[#776B5D]" />
              <input
                id="password"
                type="password"
                required
                placeholder="Ex: 123456789"
                className="flex-1 text-[14px] sm:text-[16px] text-[#776B5D] placeholder:text-[#776B5D] outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex justify-center items-center gap-2 px-3 py-2 w-full sm:w-[212px] h-10 mx-auto bg-[#776B5D] text-[#F3EEEA] text-[16px] rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
