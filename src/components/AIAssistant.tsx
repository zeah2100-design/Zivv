'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, X, Minimize2, Maximize2, Settings } from 'lucide-react';

interface AIAssistantProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export default function AIAssistant({ onNavigate }: AIAssistantProps) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [mood, setMood] = useState<'idle' | 'thinking' | 'talking' | 'happy'>('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [actionResult, setActionResult] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Try to execute action commands
  const executeAction = async (aiResponse: string, userMessage: string): Promise<string | null> => {
    const msg = userMessage.toLowerCase();

    // Navigate to pages
    if (msg.includes('الرئيسية') || msg.includes('الصفحة الرئيسية') || msg.includes('الهوم')) {
      onNavigate('home'); return '✅ تم! فتحت لك الصفحة الرئيسية';
    }
    if (msg.includes('البحث') || msg.includes('ابحث عن') || msg.includes('دور على')) {
      onNavigate('search'); return '✅ تم! فتحت لك صفحة البحث';
    }
    if (msg.includes('الحالات') || msg.includes('ستوري') || msg.includes('حالة')) {
      onNavigate('stories'); return '✅ تم! فتحت لك صفحة الحالات';
    }
    if (msg.includes('ريلز') || msg.includes('فيديو قصير') || msg.includes('شورت')) {
      onNavigate('shorts'); return '✅ تم! فتحت لك صفحة الريلز';
    }
    if (msg.includes('موسيقى') || msg.includes('أغاني') || msg.includes('اغاني')) {
      onNavigate('music'); return '✅ تم! فتحت لك صفحة الموسيقى';
    }
    if (msg.includes('رسائل') || msg.includes('رسالة') || msg.includes('دردشة') || msg.includes('شات')) {
      onNavigate('chat'); return '✅ تم! فتحت لك صفحة الرسائل';
    }
    if (msg.includes('أصدقاء') || msg.includes('اصدقاء') || msg.includes('صداقة')) {
      onNavigate('friends'); return '✅ تم! فتحت لك صفحة الأصدقاء';
    }
    if (msg.includes('إشعارات') || msg.includes('اشعارات') || msg.includes('تنبيهات')) {
      onNavigate('notifications'); return '✅ تم! فتحت لك صفحة الإشعارات';
    }
    if (msg.includes('ملف شخصي') || msg.includes('بروفايل') || msg.includes('حسابي') || msg.includes('ملفي')) {
      onNavigate('profile'); return '✅ تم! فتحت لك الملف الشخصي';
    }
    if (msg.includes('إعدادات') || msg.includes('اعدادات') || msg.includes('ضبط')) {
      onNavigate('settings'); return '✅ تم! فتحت لك الإعدادات';
    }
    if (msg.includes('نشر') || msg.includes('منشور') || msg.includes('بوست') || msg.includes('انشر')) {
      onNavigate('create'); return '✅ تم! فتحت لك صفحة النشر. اكتب منشورك!';
    }

    // Create a post
    if ((msg.includes('انشر') || msg.includes('اكتب')) && (msg.includes('منشور') || msg.includes('بوست')) && user) {
      const content = msg.replace(/انشر|اكتب|منشور|بوست|لي|عن/g, '').trim();
      if (content.length > 3) {
        try {
          await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, type: 'text', content }),
          });
          return `✅ تم نشر منشور: "${content}"`;
        } catch { return '❌ فشل النشر'; }
      }
    }

    // Search for a user
    if ((msg.includes('ابحث عن') || msg.includes('دور على')) && user) {
      const query = msg.replace(/ابحث عن|دور على|شخص|حساب/g, '').trim();
      if (query.length > 1) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          const users = data.users || [];
          if (users.length > 0) {
            return `✅ لقيت ${users.length} نتيجة:\n${users.map((u: { username: string }) => `• @${u.username}`).join('\n')}`;
          }
          return `🔍 ما لقيت نتائج لـ "${query}"`;
        } catch { return '❌ فشل البحث'; }
      }
    }

    // Send friend request
    if ((msg.includes('طلب صداقة') || msg.includes('اضف') || msg.includes('أضف')) && user) {
      return '✅ اذهب لصفحة الأصدقاء > اقتراحات وأضف من تريد!';
    }

    // Gold subscription
    if ((msg.includes('اشتراك ذهبي') || msg.includes('ذهبي') || msg.includes('جولد')) && user) {
      try {
        await fetch('/api/gold-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, message: 'طلب من المساعد الذكي' }),
        });
        return '✅ تم إرسال طلب الاشتراك الذهبي! سيتم مراجعته.';
      } catch { return '❌ فشل إرسال الطلب'; }
    }

    // Follow someone
    if ((msg.includes('تابع') || msg.includes('فولو')) && user) {
      return '✅ اذهب للملف الشخصي للمستخدم واضغط "متابعة"!';
    }

    return null; // No action matched
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setIsLoading(true);
    setMood('thinking');

    try {
      // First try to execute action
      const actionMsg = await executeAction('', msg);

      // Get AI response
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, message: msg, searchWeb: false }),
      });
      const data = await res.json();
      let reply = data.response || '';

      if (actionMsg) {
        reply = actionMsg + (reply ? '\n\n' + reply : '');
      }

      setMood('talking');
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setTimeout(() => setMood('happy'), 1500);
      setTimeout(() => setMood('idle'), 3000);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'حدث خطأ 😔' }]);
      setMood('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const skinColor = '#ffcc99';
  const hairColor = gender === 'male' ? '#1a1a2e' : '#4a2c1a';
  const shirtColor = gender === 'male' ? '#0095f6' : '#e91e8f';
  const name = gender === 'male' ? 'مساعد Zivv' : 'مساعدة Zivv';

  // Floating button when not active
  if (!isActive) {
    return (
      <button
        onClick={() => setIsActive(true)}
        className="fixed bottom-[70px] left-4 md:bottom-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center animate-bounce"
        style={{ background: shirtColor, animationDuration: '2s' }}
      >
        <span className="text-2xl">🤖</span>
      </button>
    );
  }

  // Minimized
  if (isMinimized) {
    return (
      <div className="fixed bottom-[70px] left-4 md:bottom-4 z-50 flex items-center gap-2">
        <button onClick={() => setIsMinimized(false)}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
          style={{ background: shirtColor }}>
          <span className="text-2xl">🤖</span>
        </button>
        <button onClick={() => setIsActive(false)}
          className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[70px] left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-[380px] z-50 bg-[#111] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl"
      style={{ maxHeight: '70vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#262626]" style={{ background: shirtColor }}>
        <div className="flex items-center gap-2">
          {/* Mini avatar */}
          <div className="relative w-8 h-8">
            <div className="w-8 h-8 rounded-full overflow-hidden" style={{ background: skinColor }}>
              <div className="absolute top-0 left-0 right-0 h-3 rounded-t-full" style={{ background: hairColor }} />
              {gender === 'female' && <div className="absolute top-0 -left-1 w-3 h-4 rounded-full" style={{ background: hairColor }} />}
              {gender === 'female' && <div className="absolute top-0 -right-1 w-3 h-4 rounded-full" style={{ background: hairColor }} />}
              <div className="absolute top-3 left-1 right-1 flex justify-between text-[5px]">
                <span>●</span><span>●</span>
              </div>
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[6px]">
                {mood === 'talking' ? '○' : mood === 'happy' ? '◡' : mood === 'thinking' ? '∼' : '‿'}
              </div>
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#111] ${
              mood === 'thinking' ? 'bg-yellow-500' : mood === 'talking' ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
            }`} />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{name}</p>
            <p className="text-[9px] text-white/70">
              {mood === 'thinking' ? 'يفكر...' : mood === 'talking' ? 'يتكلم...' : 'متصل'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSettings(!showSettings)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Settings size={12} className="text-white" />
          </button>
          <button onClick={() => setIsMinimized(true)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Minimize2 size={12} className="text-white" />
          </button>
          <button onClick={() => setIsActive(false)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <X size={12} className="text-white" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-3 border-b border-[#262626] bg-[#0a0a0a]">
          <p className="text-xs text-[#737373] mb-2">اختر شكل المساعد:</p>
          <div className="flex gap-2">
            <button onClick={() => { setGender('male'); setShowSettings(false); }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium ${gender === 'male' ? 'bg-[#0095f6] text-white' : 'bg-[#262626] text-[#737373]'}`}>
              👨 رجل
            </button>
            <button onClick={() => { setGender('female'); setShowSettings(false); }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium ${gender === 'female' ? 'bg-[#e91e8f] text-white' : 'bg-[#262626] text-[#737373]'}`}>
              👩 امرأة
            </button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-3 py-2 border-b border-[#262626] flex gap-1.5 overflow-x-auto scrollbar-hide">
        {[
          { label: '📝 انشر', action: 'افتح صفحة النشر' },
          { label: '🔍 ابحث', action: 'افتح صفحة البحث' },
          { label: '👥 أصدقاء', action: 'افتح صفحة الأصدقاء' },
          { label: '💬 رسائل', action: 'افتح صفحة الرسائل' },
          { label: '⭐ ذهبي', action: 'اشتراك ذهبي' },
          { label: '👤 حسابي', action: 'افتح ملفي الشخصي' },
        ].map(btn => (
          <button key={btn.label} onClick={() => { setInput(btn.action); setTimeout(sendMessage, 100); }}
            className="px-2 py-1 bg-[#262626] rounded-full text-[10px] text-[#a0a0a0] whitespace-nowrap flex-shrink-0 hover:bg-[#363636]">
            {btn.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: '35vh' }}>
        {messages.length === 0 && (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">🤖</p>
            <p className="text-xs text-[#737373]">أهلاً! أنا {name}</p>
            <p className="text-[10px] text-[#525252] mt-1">أقدر أساعدك في أي شيء داخل التطبيق!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-xs ${
              msg.role === 'user' ? 'bg-[#0095f6]' : 'bg-[#262626]'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end">
            <div className="bg-[#262626] rounded-2xl px-3 py-2 flex gap-1">
              <span className="w-1 h-1 bg-[#737373] rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-[#737373] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-1 h-1 bg-[#737373] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-[#262626]">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`اطلب من ${name} أي شيء...`}
            className="flex-1 bg-[#262626] rounded-lg px-3 py-2 text-xs outline-none" />
          <button onClick={sendMessage} disabled={isLoading || !input.trim()}
            className="px-3 rounded-lg disabled:opacity-50 text-white" style={{ background: shirtColor }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
