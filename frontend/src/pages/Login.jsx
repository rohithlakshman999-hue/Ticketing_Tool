import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isRegister) {
        await register({ 
          email, 
          password, 
          full_name: email.split('@')[0], 
          role: 'customer',
          company_name: companyName || undefined
        });
        await login(email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      // Distinguish between network errors (Render cold start) and auth errors
      if (!err.response) {
        setError('⏳ Server is starting up, please wait a moment and try again. (This can take up to 30 seconds on first load)');
      } else {
        const detail = err.response?.data?.detail;
        if (Array.isArray(detail)) {
          setError(detail.map(d => d.msg).join(', '));
        } else {
          setError(detail || 'An error occurred. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full glass-card overflow-hidden animate-fade-in-up">
        <div className="px-8 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-500/20 text-blue-400 mb-4 shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/30">
              <Ticket size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isRegister ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p className="text-sm text-slate-300">
              IT Service & Support Portal
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email address</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 glass-input text-sm" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 glass-input text-sm" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required 
                />
              </div>
            )}

            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full px-3 py-2 glass-input text-sm pr-10" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <div 
                className="absolute right-3 top-7 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg font-medium glass-button text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isRegister ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isRegister ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </form>
            
          <div className="mt-8 flex items-center justify-center">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="px-4 text-xs text-slate-400 uppercase tracking-wide font-medium">OR</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <div className="bg-white/90 p-1.5 rounded-lg shadow-lg">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  console.log('Google login success:', credentialResponse);
                  try {
                    setError(''); // Clear any previous errors
                    await googleLogin(credentialResponse.credential);
                    navigate('/dashboard');
                  } catch(err) {
                    console.error('Google login error:', err);
                    const detail = err.response?.data?.detail ||
                      err.message ||
                      "Google Login failed. Please check your Google Cloud Console configuration.";
                    setError(detail);
                  }
                }}
                onError={(error) => {
                  console.error('Google OAuth error:', error);
                  setError("Google Sign-In failed. Please check:\n1. Your internet connection\n2. Google Cloud Console configuration\n3. Authorized origins include http://localhost:5173\n4. Try email/password login instead.");
                }}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                useOneTap={false}
              />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="text-center text-sm">
              <span className="text-slate-400">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <button 
                type="button" 
                className="ml-1.5 font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? 'Sign in' : 'Sign up'}
              </button>
            </div>
            <div className="text-center text-xs text-slate-500">
              💡 If Google Sign-In fails, use your email and password to login instead.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
