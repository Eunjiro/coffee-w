'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock, Coffee, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
            router.push('/cashier');
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
    <div className="flex bg-[#F3EEEA] w-full min-h-screen text-[#776B5D]">
      {/* Image Panel (Visible on large screens) */}
      <div className="hidden lg:block bg-cover bg-center lg:w-1/2" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop')" }}>
        <div className="flex justify-center items-end bg-black/40 h-full">
          <h1 className="p-12 font-bold text-white text-4xl text-center leading-tight">Welcome to the Future of Your Cafe Management</h1>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex justify-center items-center p-4 w-full lg:w-1/2">
        <div className="bg-white shadow-2xl mx-4 p-8 rounded-2xl w-full max-w-md">
          <header className="mb-8 text-center">
            <div className="flex justify-center items-center gap-3 mb-3">
              <Coffee className="w-8 h-8 text-[#776B5D]" />
              <h1 className="font-bold text-[#776B5D] text-3xl">Coffee Win</h1>
            </div>
            <p className="text-[#776B5D]/75">Please sign in to continue</p>
          </header>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 p-3 border border-red-200 rounded-lg text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block font-medium text-[#776B5D] text-sm">Username</label>
              <div className="relative">
                <User className="top-1/2 left-3 absolute w-5 h-5 text-[#776B5D]/40 -translate-y-1/2" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[#F3EEEA] py-3 pr-4 pl-10 border border-[#B0A695] focus:border-[#776B5D] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#776B5D] w-full text-[#776B5D] placeholder:text-[#776B5D]/50"
                  placeholder="e.g., admin"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block font-medium text-[#776B5D] text-sm">Password</label>
              <div className="relative">
                <Lock className="top-1/2 left-3 absolute w-5 h-5 text-[#776B5D]/40 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#F3EEEA] py-3 pr-12 pl-10 border border-[#B0A695] focus:border-[#776B5D] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#776B5D] w-full text-[#776B5D] placeholder:text-[#776B5D]/50"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="top-1/2 right-3 absolute text-[#776B5D]/50 hover:text-[#776B5D] -translate-y-1/2">
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex justify-center items-center gap-2 bg-[#776B5D] hover:bg-[#776B5D]/90 disabled:bg-[#776B5D]/50 py-3 rounded-lg w-full font-semibold text-[#F3EEEA] transition-colors duration-200"
            >
              {isLoading ? (
                <div className="border-2 border-t-[#F3EEEA] border-[#F3EEEA]/30 rounded-full w-5 h-5 animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
