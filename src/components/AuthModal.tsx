'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Mail, ArrowRight } from 'lucide-react';

interface AuthModalProps { isOpen: boolean; onClose: () => void; }

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  if (!isOpen) return null;

  const sendCode = async () => {
    setError('');
    if (!email) { setError('أدخل البريد الإلكتروني'); return; }
    if (mode === 'register' && (!username || !password || !birthDate)) { setError('جميع الحقول مطلوبة'); return; }
    if (mode === 'login' && !password) { setError('أدخل كلمة المرور'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: mode }),
      });
      const data = await res.json();
      if (data.success) {
        setVerificationToken(data.verificationToken || '');
        setStep('verify');
      }
      else { setError(data.error || 'حدث خطأ'); }
    } catch { setError('حدث خطأ في الاتصال'); }
    finally { setIsLoading(false); }
  };

  const verify = async () => {
    if (code.length !== 6) { setError('أدخل الرمز المكون من 6 أرقام'); return; }
    setIsLoading(true); setError('');

    try {
      // Verify code
      const vRes = await fetch('/api/auth/verify-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type: mode, verificationToken }),
      });
      const vData = await vRes.json();
      if (!vData.verified) { setError(vData.error || 'رمز غير صحيح'); setIsLoading(false); return; }

      // Now login or register
      if (mode === 'login') {
        const result = await login(email, password);
        if (result.success) { reset(); onClose(); }
        else { setError(result.error || 'بيانات غير صحيحة'); }
      } else {
        const result = await register(username, email, password, birthDate, code);
        if (result.success) { reset(); onClose(); }
        else { setError(result.error || 'حدث خطأ'); }
      }
    } catch { setError('حدث خطأ'); }
    finally { setIsLoading(false); }
  };

  const reset = () => { setUsername(''); setEmail(''); setPassword(''); setBirthDate(''); setCode(''); setVerificationToken(''); setStep('form'); setError(''); };

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => { reset(); onClose(); }}>
      <div className="bg-[#111] border border-[#262626] rounded-2xl p-6 max-w-[360px] w-full" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <h1 className="text-3xl font-semibold mb-1">Zivv</h1>
          <p className="text-xs text-[#737373]">{step === 'verify' ? 'أدخل رمز التحقق' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</p>
        </div>

        {error && <div className="bg-[#ed4956]/10 border border-[#ed4956]/30 text-[#ed4956] rounded-lg p-2.5 mb-4 text-xs text-center">{error}</div>}

        {step === 'form' ? (
          <div className="space-y-3">
            {mode === 'register' && <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="اسم المستخدم" className="w-full bg-[#262626] rounded-lg px-3 py-2.5 text-sm outline-none" />}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full bg-[#262626] rounded-lg px-3 py-2.5 text-sm outline-none" dir="ltr" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full bg-[#262626] rounded-lg px-3 py-2.5 text-sm outline-none" />
            {mode === 'register' && <div>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full bg-[#262626] rounded-lg px-3 py-2.5 text-sm outline-none" />
              <p className="text-[10px] text-[#737373] mt-1">يجب أن يكون عمرك 18 سنة على الأقل</p>
            </div>}
            <button onClick={sendCode} disabled={isLoading} className="w-full bg-[#0095f6] py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? '...' : <><Mail size={16} /> إرسال رمز التحقق</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#00a67e]/10 border border-[#00a67e]/30 rounded-lg p-3 text-center">
              <Mail size={24} className="text-[#00a67e] mx-auto mb-2" />
              <p className="text-sm text-[#00a67e]">تم إرسال الرمز إلى</p>
              <p className="text-sm font-semibold" dir="ltr">{email}</p>
              <p className="text-[10px] text-[#737373] mt-1">تحقق من صندوق الوارد</p>
            </div>
            <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" className="w-full bg-[#262626] rounded-lg px-3 py-3 text-center text-2xl tracking-[8px] font-bold outline-none" maxLength={6} dir="ltr" autoFocus />
            <button onClick={verify} disabled={isLoading || code.length !== 6}
              className="w-full bg-[#0095f6] py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
              {isLoading ? '...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
            </button>
            <div className="flex justify-between">
              <button onClick={() => { setStep('form'); setError(''); }} className="text-xs text-[#737373] flex items-center gap-1"><ArrowRight size={12} /> رجوع</button>
              <button onClick={sendCode} className="text-xs text-[#0095f6]">إعادة الإرسال</button>
            </div>
          </div>
        )}

        <p className="text-center mt-5 text-sm border-t border-[#262626] pt-4">
          <span className="text-[#737373]">{mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب؟'} </span>
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setStep('form'); setError(''); }} className="text-[#0095f6] font-semibold">
            {mode === 'login' ? 'سجّل الآن' : 'تسجيل الدخول'}
          </button>
        </p>
      </div>
    </div>
  );
}
