'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Shield, Check, X } from '@/components/icons';
import ChatPage from './ChatPage';

export default function ProtectedChatPage() {
  const { user, updateUser } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !user.chatPassword) {
      setIsSettingPassword(true);
    }
  }, [user]);

  const handleUnlock = () => {
    if (!user) return;
    
    if (password === user.chatPassword) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('كلمة المرور غير صحيحة');
    }
  };

  const handleSetPassword = async () => {
    if (!user) return;

    if (newPassword.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatPassword: newPassword }),
      });

      if (res.ok) {
        updateUser({ chatPassword: newPassword });
        setIsSettingPassword(false);
        setIsUnlocked(true);
        setError('');
      }
    } catch (error) {
      console.error('Error setting password:', error);
      setError('حدث خطأ أثناء حفظ كلمة المرور');
    }
  };

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-4">
        <div className="text-8xl mb-6">🔒</div>
        <h2 className="text-2xl font-bold mb-2">سجل دخولك</h2>
        <p className="text-[#a1a1aa] text-center">يجب تسجيل الدخول للوصول إلى الدردشة المحمية</p>
      </div>
    );
  }

  if (isUnlocked) {
    return <ChatPage />;
  }

  return (
    <div className="h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
          <Shield size={40} className="text-white" />
        </div>

        <h2 className="text-2xl font-bold mb-2">الدردشة المحمية</h2>
        <p className="text-[#a1a1aa] mb-6">
          {isSettingPassword 
            ? 'قم بتعيين كلمة مرور لحماية دردشاتك الخاصة'
            : 'أدخل كلمة المرور للوصول إلى دردشاتك المحمية'
          }
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        {isSettingPassword ? (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="كلمة المرور الجديدة"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
            />
            <input
              type="password"
              placeholder="تأكيد كلمة المرور"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
            />
            <button 
              onClick={handleSetPassword}
              className="btn-primary w-full"
            >
              <Check size={20} className="inline ml-2" />
              تعيين كلمة المرور
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              className="input"
            />
            <button 
              onClick={handleUnlock}
              className="btn-primary w-full"
            >
              <Lock size={20} className="inline ml-2" />
              فتح القفل
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
