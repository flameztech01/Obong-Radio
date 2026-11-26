// src/pages/admin/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { 
  Mail, Lock, ArrowRight, ArrowLeft, 
  Loader2, ShieldCheck, CheckCircle2, 
  ShieldAlert, Terminal
} from 'lucide-react';
import { 
  useLoginMutation, 
  useVerifyOtpMutation, 
  useResendOtpMutation,
  useLogoutMutation
} from '../../features/authApiSlice'; // Adjust path if needed

const AdminLogin = () => {
  const navigate = useNavigate();
  
  // RTK Query Hooks
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [logout] = useLogoutMutation();

  // States
  const [step, setStep] = useState(1); // 1 = Identifier, 2 = OTP
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [identifier, setIdentifier] = useState(''); 
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown Timer
  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  // Step 1: Request OTP
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!identifier.trim()) {
      return setErrorMsg('Please enter your admin email address');
    }

    try {
      const res = await login({ identifier }).unwrap();
      setMaskedEmail(res.email);
      setStep(2);
      setCooldown(60);
      setSuccessMsg('Security code sent to your email.');
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to send security code.');
    }
  };

  // Step 2: Verify OTP & Check Role
  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (otp.length !== 6) {
      return setErrorMsg('Please enter the 6-digit security code');
    }

    try {
      const res = await verifyOtp({ identifier, otp }).unwrap();
      
      // ✅ CRITICAL: Check if the user actually has admin privileges
      if (res.user.role !== 'admin' && res.user.role !== 'super_admin') {
        // If not admin, kill the session cookie immediately
        await logout().unwrap();
        throw new Error("Access Denied. You do not have administrator privileges.");
      }

      // Redirect to Admin Dashboard
      navigate('/admin/dashboard'); 
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Invalid security code.');
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await resendOtp({ identifier }).unwrap();
      setCooldown(60);
      setSuccessMsg('A new security code has been sent.');
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-zinc-950 overflow-hidden">
      
      {/* =========================================
          LEFT SIDE: Admin Command Center Image
          ========================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center overflow-hidden border-r border-zinc-800">
        {/* Dark, secure background image */}
        <img 
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop" 
          alt="Admin Security" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
        
        <div className="relative z-10 px-12 text-left w-full max-w-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-red-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <ShieldAlert size={24} className="text-red-500" />
            </div>
            <div>
              <h1 className="font-mono text-xl text-white tracking-widest uppercase">System Admin</h1>
              <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Restricted Access</p>
            </div>
          </div>
          <h2 className="text-4xl font-serif text-white leading-tight mb-4 shadow-sm">
            Obong Radio <br/> Command Center
          </h2>
          <p className="text-[15px] text-zinc-400 leading-relaxed max-w-md">
            Authorized personnel only. All login attempts are logged and monitored.
          </p>
        </div>
      </div>

      {/* =========================================
          RIGHT SIDE: Login Form
          ========================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-red-500/5 blur-[100px] pointer-events-none rounded-full lg:hidden"></div>

        <div className="w-full max-w-md bg-zinc-900 lg:bg-transparent border border-zinc-800 lg:border-none rounded-3xl p-6 sm:p-8 lg:p-0 shadow-2xl lg:shadow-none relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Back Button */}
          <button 
            onClick={() => step === 2 ? setStep(1) : navigate('/')}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors mb-6 lg:mb-10"
          >
            <ArrowLeft size={14} /> {step === 2 ? 'Back' : 'Back to Main Site'}
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif tracking-tight text-white mb-2">
              {step === 1 ? 'Admin Login' : 'Security Check'}
            </h1>
            <p className="text-[13px] text-zinc-400">
              {step === 1 
                ? 'Enter your authorized email to receive a secure code.' 
                : `Enter the 6-digit code sent to ${maskedEmail}`}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] font-medium flex items-center gap-2">
              <ShieldAlert size={16} className="shrink-0" />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              {successMsg}
            </div>
          )}

          {/* STEP 1: IDENTIFIER */}
          {step === 1 && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="email" 
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="admin@obonguniversity.edu.ng" 
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3.5 pl-11 pr-4 text-[13px] text-white placeholder-zinc-600 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3.5 text-[13px] font-bold uppercase tracking-wider text-zinc-950 transition-all hover:bg-white active:scale-[0.98] disabled:opacity-50"
              >
                {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : 'Send Security Code'}
                {!isLoggingIn && <ArrowRight size={18} />}
              </button>

              <p className="text-center text-[12px] text-zinc-500 mt-6">
                Not an admin?{' '}
                <Link to="/login" className="text-yellow-500 hover:text-yellow-400 font-semibold transition-colors">
                  User Login
                </Link>
              </p>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1 text-center block">Security Code</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="text" 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      setErrorMsg('');
                    }}
                    placeholder="000000" 
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3.5 pl-11 pr-4 text-[20px] font-bold tracking-[0.5em] text-center text-white placeholder-zinc-700 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isVerifying || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3.5 text-[13px] font-bold uppercase tracking-wider text-zinc-950 transition-all hover:bg-white active:scale-[0.98] disabled:opacity-50"
              >
                {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <Terminal size={18} />}
                {isVerifying ? 'Authenticating...' : 'Access Dashboard'}
              </button>

              <div className="text-center">
                <p className="text-[12px] text-zinc-500 mb-2">Didn't receive the code?</p>
                <button 
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending}
                  className="text-[12px] font-bold text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;