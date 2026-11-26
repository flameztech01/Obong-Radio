// src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { 
  User, Mail, Hash, Phone, Lock, ArrowRight, 
  ArrowLeft, Loader2, ShieldCheck, CheckCircle2, 
  BookOpen, ChevronDown
} from 'lucide-react';
import { 
  useSignupMutation, 
  useVerifyOtpMutation, 
  useResendOtpMutation,
  useGetPublicDepartmentsQuery // <-- Imported
} from '../features/authApiSlice';

const Register = () => {
  const navigate = useNavigate();
  
  // RTK Query Hooks
  const [signup, { isLoading: isSigningUp }] = useSignupMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  
  // Fetch Departments
  const { data: deptData, isLoading: isDeptLoading } = useGetPublicDepartmentsQuery();
  const departments = deptData?.departments || [];

  // States
  const [step, setStep] = useState(1); // 1 = Register, 2 = Verify OTP
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    matricNumber: '',
    phone: '',
    department: '', // Added department
    level: '',      // Added level
  });
  
  // OTP State
  const [otp, setOtp] = useState('');
  const [identifier, setIdentifier] = useState(''); 
  const [maskedEmail, setMaskedEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Set default department if list loads, or fallback if empty
  useEffect(() => {
    if (!isDeptLoading) {
      if (departments.length > 0 && !formData.department) {
        setFormData(prev => ({ ...prev, department: departments[0]._id }));
      } else if (departments.length === 0 && !formData.department) {
        // Fallback ID if DB is empty (24 zeros is a valid ObjectId format)
        setFormData(prev => ({ ...prev, department: "000000000000000000000000" }));
      }
    }
  }, [departments, isDeptLoading]);

  // Cooldown Timer
  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!formData.name || !formData.email) {
      return setErrorMsg('Name and Email are required');
    }

    try {
      const res = await signup(formData).unwrap();
      setIdentifier(res.identifier);
      setMaskedEmail(res.email);
      setStep(2);
      setCooldown(60);
      setSuccessMsg('Account created! Check your email for the OTP.');
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to create account. Try again.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (otp.length !== 6) {
      return setErrorMsg('Please enter the 6-digit OTP');
    }

    try {
      await verifyOtp({ identifier, otp }).unwrap();
      navigate('/home');
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await resendOtp({ identifier }).unwrap();
      setCooldown(60);
      setSuccessMsg('A new OTP has been sent to your email.');
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-zinc-950 overflow-hidden">
      
      {/* =========================================
          LEFT SIDE: Decorative Image (Desktop Only)
          ========================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop" 
          alt="Radio Studio" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
        
        <div className="relative z-10 px-12 text-left w-full max-w-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-full overflow-hidden border border-zinc-700 bg-white shadow-xl">
              <img src="/logo.jfif" alt="Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="font-serif text-2xl text-white tracking-tight">O.B Radio</h1>
              <p className="text-[11px] font-bold text-yellow-500 uppercase tracking-widest">Obong University</p>
            </div>
          </div>
          <h2 className="text-4xl font-serif text-white leading-tight mb-4 shadow-sm">
            Join the heartbeat of campus.
          </h2>
          <p className="text-[15px] text-zinc-300 leading-relaxed max-w-md">
            Create an account to listen live, chat with hosts, and never miss your favorite Afrobeat shows.
          </p>
        </div>
      </div>

      {/* =========================================
          RIGHT SIDE: Form (All Devices)
          ========================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-yellow-500/10 blur-[100px] pointer-events-none rounded-full lg:hidden"></div>

        <div className="w-full max-w-md bg-zinc-900 lg:bg-transparent border border-zinc-800 lg:border-none rounded-3xl p-6 sm:p-8 lg:p-0 shadow-2xl lg:shadow-none relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Back Button */}
          <button 
            onClick={() => step === 2 ? setStep(1) : navigate('/')}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors mb-6 lg:mb-10"
          >
            <ArrowLeft size={14} /> {step === 2 ? 'Back to Edit' : 'Back to Home'}
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif tracking-tight text-white mb-2">
              {step === 1 ? 'Create Account' : 'Verify Email'}
            </h1>
            <p className="text-[13px] text-zinc-400">
              {step === 1 
                ? 'Enter your details below to get started.' 
                : `Enter the 6-digit code sent to ${maskedEmail}`}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              {successMsg}
            </div>
          )}

          {/* =========================================
              STEP 1: SIGNUP FORM
              ========================================= */}
          {step === 1 && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Tobi Amaka" 
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3.5 pl-11 pr-4 text-[13px] text-white placeholder-zinc-600 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com" 
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3.5 pl-11 pr-4 text-[13px] text-white placeholder-zinc-600 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Matric No.</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      type="text" 
                      name="matricNumber"
                      value={formData.matricNumber}
                      onChange={handleChange}
                      placeholder="OBU/..." 
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3.5 pl-11 pr-4 text-[13px] text-white placeholder-zinc-600 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="080..." 
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3.5 pl-11 pr-4 text-[13px] text-white placeholder-zinc-600 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Department and Level */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Department</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <select 
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-950 py-3.5 pl-11 pr-10 text-[13px] text-white focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
                    >
                      {isDeptLoading ? (
                        <option value="">Loading...</option>
                      ) : departments.length > 0 ? (
                        departments.map(dept => (
                          <option key={dept._id} value={dept._id}>{dept.name}</option>
                        ))
                      ) : (
                        <option value="000000000000000000000000">General</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Level</label>
                  <div className="relative">
                    <select 
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-950 py-3.5 pl-4 pr-10 text-[13px] text-white focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
                    >
                      <option value="">Select Level</option>
                      <option value="100">100 Level</option>
                      <option value="200">200 Level</option>
                      <option value="300">300 Level</option>
                      <option value="400">400 Level</option>
                      <option value="500">500 Level</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSigningUp}
                className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3.5 text-[13px] font-bold uppercase tracking-wider text-zinc-950 transition-all hover:bg-yellow-400 active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
              >
                {isSigningUp ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                {!isSigningUp && <ArrowRight size={18} />}
              </button>

              <p className="text-center text-[12px] text-zinc-500 mt-6">
                Already have an account?{' '}
                <Link to="/" className="text-yellow-500 hover:text-yellow-400 font-semibold transition-colors">
                  Log in
                </Link>
              </p>
            </form>
          )}

          {/* =========================================
              STEP 2: OTP VERIFICATION
              ========================================= */}
          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1 text-center block">Enter OTP Code</label>
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
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3.5 pl-11 pr-4 text-[20px] font-bold tracking-[0.5em] text-center text-white placeholder-zinc-700 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isVerifying || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3.5 text-[13px] font-bold uppercase tracking-wider text-zinc-950 transition-all hover:bg-yellow-400 active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
              >
                {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                {isVerifying ? 'Verifying...' : 'Verify & Login'}
              </button>

              <div className="text-center">
                <p className="text-[12px] text-zinc-500 mb-2">Didn't receive the code?</p>
                <button 
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending}
                  className="text-[12px] font-bold text-yellow-500 hover:text-yellow-400 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;