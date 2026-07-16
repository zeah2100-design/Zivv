'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Bell, LogOut, Crown } from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export default function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { user, logout, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Privacy
  const [privateAccount, setPrivateAccount] = useState(false);
  const [hideOnline, setHideOnline] = useState(false);

  // Notifications
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);

  // King
  const [showKing, setShowKing] = useState(false);
  const [kingStep, setKingStep] = useState(1);
  const [kingAnswer, setKingAnswer] = useState('');
  const [kingError, setKingError] = useState('');
  const [kingChoice, setKingChoice] = useState('');

  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const handlePressStart = () => {
    const t = setTimeout(() => { setShowKing(true); setKingStep(1); setKingAnswer(''); setKingError(''); setKingChoice(''); }, 1500);
    setPressTimer(t);
  };
  const handlePressEnd = () => { if (pressTimer) clearTimeout(pressTimer); };

  const saveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio, avatarUrl }),
      });
      if (res.ok) { updateUser({ displayName, bio, avatarUrl }); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch {} finally { setIsSaving(false); }
  };

  const checkKing = () => {
    setKingError('');
    if (kingStep === 1) {
      if (kingAnswer.trim() === 'زياد احمد صبحي' || kingAnswer.trim() === 'زياد أحمد صبحي') { setKingStep(2); setKingAnswer(''); }
      else setKingError('إجابة خاطئة!');
    } else if (kingStep === 2) {
      if (kingAnswer.trim() === '16') { setKingStep(3); setKingAnswer(''); }
      else setKingError('إجابة خاطئة!');
    } else if (kingStep === 3) {
      if (kingChoice === 'correct') { setShowKing(false); onNavigate('admin'); }
      else setKingError('إجابة خاطئة!');
    }
  };

  if (!user) return <div className="h-full flex items-center justify-center pt-[82px] md:pt-0 pb-[60px] md:pb-0"><p className="text-[#737373]">سجل الدخول</p></div>;

  return (
    <div className="h-full bg-black pt-[82px] md:pt-0 pb-[60px] md:pb-0 overflow-y-auto">
      <header className="sticky top-0 bg-black border-b border-[#262626] px-4 py-3 z-10">
        <h1 className="text-lg font-semibold text-center select-none"
          onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}>
          الإعدادات
        </h1>
        <p className="text-[9px] text-[#262626] text-center">اضغط مطولاً</p>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Profile */}
        <section>
          <h2 className="text-sm font-semibold mb-3">الملف الشخصي</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-[#262626] flex-shrink-0">
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold">{user.username?.[0]?.toUpperCase()}</div>}
              </div>
              <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
                placeholder="رابط الصورة..." className="flex-1 bg-[#262626] rounded-lg px-3 py-2 text-sm outline-none" dir="ltr" />
            </div>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="الاسم" className="w-full bg-[#262626] rounded-lg px-3 py-2 text-sm outline-none" />
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="النبذة" rows={2}
              className="w-full bg-[#262626] rounded-lg px-3 py-2 text-sm outline-none resize-none" />
            <button onClick={saveProfile} disabled={isSaving}
              className="w-full bg-[#0095f6] py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {saved ? '✅ تم الحفظ' : isSaving ? '...' : 'حفظ'}
            </button>
          </div>
        </section>

        <hr className="border-[#262626]" />

        {/* Privacy */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Lock size={16} /> الخصوصية والأمان</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between py-2">
              <span className="text-sm">حساب خاص</span>
              <input type="checkbox" checked={privateAccount} onChange={e => setPrivateAccount(e.target.checked)}
                className="w-5 h-5 accent-[#0095f6] rounded" />
            </label>
            <p className="text-xs text-[#737373] -mt-2">فقط المتابعون المعتمدون يمكنهم رؤية منشوراتك</p>

            <label className="flex items-center justify-between py-2">
              <span className="text-sm">إخفاء حالة الاتصال</span>
              <input type="checkbox" checked={hideOnline} onChange={e => setHideOnline(e.target.checked)}
                className="w-5 h-5 accent-[#0095f6] rounded" />
            </label>
            <p className="text-xs text-[#737373] -mt-2">لن يرى الآخرون متى كنت متصلاً</p>

            <button onClick={() => onNavigate('protected-chat')}
              className="w-full flex items-center justify-between py-3 text-sm">
              <span>كلمة مرور الدردشة السرية</span>
              <span className="text-[#737373]">←</span>
            </button>
          </div>
        </section>

        <hr className="border-[#262626]" />

        {/* Notifications */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Bell size={16} /> الإشعارات</h2>
          <div className="space-y-3">
            {[
              { label: 'الإعجابات', state: notifLikes, setter: setNotifLikes },
              { label: 'التعليقات', state: notifComments, setter: setNotifComments },
              { label: 'الرسائل', state: notifMessages, setter: setNotifMessages },
              { label: 'المتابعات الجديدة', state: notifFollows, setter: setNotifFollows },
            ].map(item => (
              <label key={item.label} className="flex items-center justify-between py-2">
                <span className="text-sm">{item.label}</span>
                <input type="checkbox" checked={item.state} onChange={e => item.setter(e.target.checked)}
                  className="w-5 h-5 accent-[#0095f6] rounded" />
              </label>
            ))}
          </div>
        </section>

        <hr className="border-[#262626]" />

        <button onClick={() => { logout(); onNavigate('home'); }}
          className="w-full py-3 text-sm text-[#ed4956] flex items-center gap-2 justify-center">
          <LogOut size={18} /> تسجيل الخروج
        </button>
      </div>

      {/* King Modal */}
      {showKing && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => setShowKing(false)}>
          <div className="bg-[#111] border border-[#262626] rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <Crown size={32} className="mx-auto mb-2 text-yellow-500" />
              <h3 className="font-bold">التحقق من الملك</h3>
            </div>
            <div className="flex gap-1 mb-4">{[1,2,3].map(s => <div key={s} className={`flex-1 h-1 rounded-full ${s<=kingStep?'bg-[#0095f6]':'bg-[#262626]'}`}/>)}</div>
            {kingError && <p className="text-[#ed4956] text-sm text-center mb-3">{kingError}</p>}

            {kingStep === 1 && <div className="space-y-3">
              <p className="text-sm">ما اسم الملك الحقيقي؟</p>
              <input type="text" value={kingAnswer} onChange={e=>setKingAnswer(e.target.value)} onKeyDown={e=>e.key==='Enter'&&checkKing()}
                placeholder="الاسم..." className="w-full bg-[#262626] rounded-lg px-3 py-2 text-sm outline-none" autoFocus />
            </div>}

            {kingStep === 2 && <div className="space-y-3">
              <p className="text-sm">كم كان عمره عندما أنشأ التطبيق؟</p>
              <input type="text" value={kingAnswer} onChange={e=>setKingAnswer(e.target.value)} onKeyDown={e=>e.key==='Enter'&&checkKing()}
                placeholder="العمر..." className="w-full bg-[#262626] rounded-lg px-3 py-2 text-sm outline-none" autoFocus />
            </div>}

            {kingStep === 3 && <div className="space-y-2">
              <p className="text-sm mb-2">اختر الإجابة الصحيحة:</p>
              {['زياد بيحب السفر والمغامرات','زياد بيحب الرياضة','زياد بيحب امه وابوه البرمجة','زياد بيحب الطعام','زياد بيحب الموسيقى','زياد بيحب القراءة','زياد بيحب الأفلام','زياد بيحب الطبيعة'].map((o,i) => (
                <label key={i} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm ${kingChoice===(o==='زياد بيحب امه وابوه البرمجة'?'correct':`w${i}`)?'bg-[#0095f6]/20 border border-[#0095f6]':'bg-[#262626]'}`}>
                  <input type="radio" name="q3" onChange={()=>setKingChoice(o==='زياد بيحب امه وابوه البرمجة'?'correct':`w${i}`)} className="accent-[#0095f6]" />{o}
                </label>
              ))}
            </div>}

            <div className="flex gap-2 mt-4">
              <button onClick={()=>setShowKing(false)} className="flex-1 py-2 bg-[#262626] rounded-lg text-sm">إلغاء</button>
              <button onClick={checkKing} className="flex-1 py-2 bg-[#0095f6] rounded-lg text-sm font-semibold">{kingStep===3?'تأكيد':'التالي'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
