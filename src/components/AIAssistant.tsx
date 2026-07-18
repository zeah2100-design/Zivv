'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, X, Settings, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface AIAssistantProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

type Mood = 'idle' | 'thinking' | 'talking' | 'happy' | 'waving' | 'walking' | 'working' | 'listening';
type Gender = 'male' | 'female';

const AVATARS: Record<Gender, Record<string, string>> = {
  male: {
    idle: '/images/avatar-male.png',
    happy: '/images/avatar-male-happy.png',
    thinking: '/images/avatar-male-thinking.png',
    talking: '/images/avatar-male-talking.png',
    waving: '/images/avatar-male-waving.png',
    walking: '/images/avatar-male.png',
    working: '/images/avatar-male-thinking.png',
    listening: '/images/avatar-male-thinking.png',
  },
  female: {
    idle: '/images/avatar-female.png',
    happy: '/images/avatar-female-happy.png',
    thinking: '/images/avatar-female-thinking.png',
    talking: '/images/avatar-female-talking.png',
    waving: '/images/avatar-female.png',
    walking: '/images/avatar-female.png',
    working: '/images/avatar-female-thinking.png',
    listening: '/images/avatar-female-thinking.png',
  },
};

export default function AIAssistant({ onNavigate }: AIAssistantProps) {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msgs, setMsgs] = useState<Array<{ role: string; text: string }>>([]);
  const [gender, setGender] = useState<Gender>('male');
  const [mood, setMood] = useState<Mood>('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [posX, setPosX] = useState(50);
  const [bubble, setBubble] = useState('');
  const [facingRight, setFacingRight] = useState(true);
  const [assistantName, setAssistantName] = useState('زيفي');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const walkRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('zivv_assistant') || '{}');
      if (s.enabled) setEnabled(true);
      if (s.gender) setGender(s.gender);
      if (s.name) setAssistantName(s.name);
      if (s.voiceEnabled !== undefined) setVoiceEnabled(s.voiceEnabled);
    } catch {}
  }, []);

  const save = (updates: Record<string, any> = {}) => {
    const cur = JSON.parse(localStorage.getItem('zivv_assistant') || '{}');
    localStorage.setItem('zivv_assistant', JSON.stringify({ ...cur, ...updates }));
  };

  // Idle movement
  useEffect(() => {
    if (!enabled || isOpen || mood !== 'idle') return;
    const interval = setInterval(() => {
      const r = Math.random();
      if (r < 0.3) walkTo(15 + Math.random() * 70);
      else if (r < 0.5) { setMood('waving'); setBubble('👋'); setTimeout(() => { setMood('idle'); setBubble(''); }, 1500); }
    }, 5000);
    return () => clearInterval(interval);
  }, [enabled, isOpen, mood]);

  const walkTo = useCallback((target: number) => {
    if (walkRef.current) clearInterval(walkRef.current);
    setMood('walking'); setFacingRight(target > posX);
    walkRef.current = setInterval(() => {
      setPosX(prev => {
        const diff = target - prev;
        if (Math.abs(diff) < 2) { setMood('idle'); if (walkRef.current) clearInterval(walkRef.current); return target; }
        return prev + (diff > 0 ? 1.5 : -1.5);
      });
    }, 30);
  }, [posX]);

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA'; u.rate = 1; u.pitch = gender === 'female' ? 1.3 : 0.9;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.startsWith('ar'));
    if (v) u.voice = v;
    setMood('talking');
    u.onend = () => { setMood('happy'); setTimeout(() => setMood('idle'), 2000); };
    window.speechSynthesis.speak(u);
  };

  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); setMood('idle'); return; }
    const r = new SR(); r.lang = 'ar-SA'; r.continuous = false;
    r.onstart = () => { setIsListening(true); setMood('listening'); setBubble('🎤 بسمعك...'); };
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; setIsListening(false); setMood('idle'); setBubble(''); processMessage(t); };
    r.onerror = () => { setIsListening(false); setMood('idle'); setBubble(''); };
    r.onend = () => setIsListening(false);
    recognitionRef.current = r; r.start();
  };

  const executeCommand = async (m: string): Promise<string | null> => {
    const msg = m.toLowerCase();
    if (msg.includes('اختفي') || msg.includes('باي')) { setTimeout(() => { setEnabled(false); save({ enabled: false }); }, 1500); return '👋 باي!'; }

    const pages: Record<string, string> = {
      'الرئيسية': 'home', 'هوم': 'home', 'بحث': 'search', 'حالات': 'stories', 'ريلز': 'shorts',
      'موسيقى': 'music', 'رسائل': 'chat', 'شات': 'chat', 'دردشة': 'chat',
      'أصدقاء': 'friends', 'اصدقاء': 'friends', 'إشعارات': 'notifications', 'اشعارات': 'notifications',
      'بروفايل': 'profile', 'حسابي': 'profile', 'ملفي': 'profile', 'إعدادات': 'settings', 'اعدادات': 'settings',
      'نشر': 'create', 'منشور': 'create',
    };

    if (msg.includes('افتح') || msg.includes('روح') || msg.includes('خش') || msg.includes('ودين')) {
      for (const [kw, page] of Object.entries(pages)) {
        if (msg.includes(kw)) {
          setMood('happy'); walkTo(Math.random() * 60 + 20);
          await new Promise(r => setTimeout(r, 600));
          onNavigate(page); return `✅ حاضر! فتحت ${kw}`;
        }
      }
    }

    if ((msg.includes('انشر') || msg.includes('اكتب')) && user) {
      const c = msg.replace(/انشر|اكتب|حط|لي|منشور|بوست|يقول|فيه|عن/g, '').trim();
      if (c.length > 2) {
        setMood('working');
        try { await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, type: 'text', content: c }) }); return `✅ نشرت: "${c}"`; } catch { return '❌ فشل'; }
      }
      onNavigate('create'); return '✅ فتحت النشر!';
    }

    if ((msg.includes('ابحث') || msg.includes('دور')) && user) {
      const q = msg.replace(/ابحث|دور|عن|على|لي/g, '').trim();
      if (q.length > 1) {
        try { const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`); const d = await r.json();
          if (d.users?.length) return `✅ لقيت:\n${d.users.slice(0, 3).map((u: any) => `• @${u.username}`).join('\n')}`;
          return `🔍 ما لقيت "${q}"`; } catch { return '❌ فشل'; }
      }
    }

    if ((msg.includes('ذهبي') || msg.includes('اشتراك')) && user) {
      try { await fetch('/api/gold-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, message: 'من المساعد' }) }); return '✅ تم طلب الذهبي! ⭐'; } catch { return 'موجود بالفعل'; }
    }

    if (msg.includes('ابعت رسال') && user) { onNavigate('chat'); return '✅ فتحت الرسائل!'; }
    return null;
  };

  const processMessage = async (text: string) => {
    setMsgs(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true); setMood('thinking'); setBubble('🤔');
    try {
      const action = await executeCommand(text);
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id, message: text }) });
      const data = await res.json();
      const reply = action || data.response || 'ما فهمت';
      setBubble(reply.length > 30 ? reply.substring(0, 30) + '...' : reply);
      setMsgs(prev => [...prev, { role: 'assistant', text: reply }]);
      speak(reply);
    } catch { setMood('idle'); setMsgs(prev => [...prev, { role: 'assistant', text: 'خطأ' }]); }
    finally { setIsLoading(false); }
  };

  const sendMessage = () => { if (!input.trim() || isLoading) return; const m = input; setInput(''); processMessage(m); };

  const avatarImg = AVATARS[gender][mood] || AVATARS[gender].idle;
  const shirt = gender === 'male' ? '#0095f6' : '#e91e8f';

  if (!enabled) return null;

  // Floating character
  if (!isOpen) {
    return (
      <div className="fixed z-50 transition-all duration-500" style={{
        bottom: 60, right: `${posX}%`, transform: `translateX(50%) ${facingRight ? '' : 'scaleX(-1)'}`,
      }}>
        {bubble && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap animate-fadeIn" style={{ transform: facingRight ? 'translateX(-50%)' : 'translateX(-50%) scaleX(-1)' }}>
            <div className="bg-white text-black text-[10px] px-2.5 py-1 rounded-xl shadow-lg font-medium">{bubble}</div>
          </div>
        )}
        <button onClick={() => setIsOpen(true)} className="block">
          <img src={avatarImg} alt={assistantName} className="h-24 w-auto object-contain drop-shadow-lg"
            style={{ filter: mood === 'walking' ? 'none' : undefined, animation: mood === 'waving' ? 'bounce 0.5s ease infinite' : mood === 'walking' ? 'pulse 0.3s ease infinite' : undefined }} />
        </button>
      </div>
    );
  }

  // Open panel
  return (
    <div className="fixed bottom-[60px] left-2 right-2 md:bottom-4 md:left-auto md:right-4 md:w-[380px] z-50 bg-[#0a0a0a] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl" style={{ maxHeight: '80vh' }}>
      {/* Header with avatar */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: shirt }}>
        <div className="flex items-center gap-2">
          <img src={avatarImg} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
          <div>
            <p className="text-xs font-bold text-white">{assistantName}</p>
            <p className="text-[8px] text-white/70">
              {mood === 'thinking' ? '🤔 يفكر...' : mood === 'talking' ? '🗣️ يتكلم...' : mood === 'working' ? '⚡ ينفذ...' : mood === 'listening' ? '🎤 يسمعك...' : '🟢 جاهز'}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            {voiceEnabled ? <Volume2 size={10} className="text-white" /> : <VolumeX size={10} className="text-white" />}
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Settings size={10} className="text-white" />
          </button>
          <button onClick={() => setIsOpen(false)} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <X size={10} className="text-white" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="p-3 border-b border-[#262626] space-y-2">
          <div><p className="text-[9px] text-[#737373] mb-1">الاسم:</p>
            <input type="text" value={assistantName} onChange={e => setAssistantName(e.target.value)}
              onBlur={() => save({ name: assistantName })} className="w-full bg-[#1a1a1a] rounded px-2 py-1 text-xs outline-none" /></div>
          <div><p className="text-[9px] text-[#737373] mb-1">الشكل:</p>
            <div className="flex gap-2">
              <button onClick={() => { setGender('male'); save({ gender: 'male' }); }} className={`flex-1 py-1.5 rounded text-[10px] flex items-center justify-center gap-1 ${gender === 'male' ? 'bg-[#0095f6] text-white' : 'bg-[#1a1a1a] text-[#737373]'}`}>
                <img src="/images/avatar-male-happy.png" className="w-5 h-5 rounded-full object-cover" /> رجل
              </button>
              <button onClick={() => { setGender('female'); save({ gender: 'female' }); }} className={`flex-1 py-1.5 rounded text-[10px] flex items-center justify-center gap-1 ${gender === 'female' ? 'bg-[#e91e8f] text-white' : 'bg-[#1a1a1a] text-[#737373]'}`}>
                <img src="/images/avatar-female-happy.png" className="w-5 h-5 rounded-full object-cover" /> امرأة
              </button>
            </div>
          </div>
          <button onClick={() => { setEnabled(false); save({ enabled: false }); setIsOpen(false); }}
            className="w-full py-1 bg-[#ed4956]/20 text-[#ed4956] rounded text-[9px]">إلغاء التفعيل</button>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-2 py-1.5 border-b border-[#262626] flex gap-1 overflow-x-auto scrollbar-hide">
        {['📝 انشر', '🔍 ابحث', '💬 رسائل', '👥 أصدقاء', '⭐ ذهبي', '👤 حسابي'].map(b => (
          <button key={b} onClick={() => processMessage(`افتح ${b.replace(/📝|🔍|💬|👥|⭐|👤/g, '').trim()}`)}
            className="px-2 py-1 bg-[#1a1a1a] rounded-full text-[9px] text-[#a0a0a0] whitespace-nowrap flex-shrink-0">{b}</button>
        ))}
      </div>

      {/* Messages */}
      <div className="overflow-y-auto p-2 space-y-1.5" style={{ maxHeight: '30vh' }}>
        {msgs.length === 0 && (
          <div className="text-center py-3">
            <img src={avatarImg} alt="" className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-[#262626]" />
            <p className="text-[11px] text-[#737373]">أهلاً! أنا {assistantName}</p>
            <p className="text-[9px] text-[#525252]">اكتب أو تكلم 🎤</p>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end gap-1'}`}>
            {m.role === 'assistant' && <img src={avatarImg} className="w-5 h-5 rounded-full object-cover mt-1 flex-shrink-0" />}
            <div className={`max-w-[80%] rounded-xl px-2 py-1.5 text-[11px] ${m.role === 'user' ? 'bg-[#0095f6]' : 'bg-[#1a1a1a]'}`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {isLoading && <div className="flex justify-end gap-1">
          <img src={AVATARS[gender].thinking} className="w-5 h-5 rounded-full object-cover mt-1" />
          <div className="bg-[#1a1a1a] rounded-xl px-3 py-1.5 flex gap-1">
            <span className="w-1 h-1 bg-[#525252] rounded-full animate-bounce" />
            <span className="w-1 h-1 bg-[#525252] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <span className="w-1 h-1 bg-[#525252] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-[#262626] flex gap-1.5">
        <button onClick={toggleListening}
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isListening ? 'bg-[#ed4956] animate-pulse' : 'bg-[#1a1a1a]'}`}>
          {isListening ? <MicOff size={14} /> : <Mic size={14} className="text-[#737373]" />}
        </button>
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="اكتب أو تكلم..." className="flex-1 bg-[#1a1a1a] rounded-lg px-2 py-1.5 text-xs outline-none" />
        <button onClick={sendMessage} disabled={isLoading || !input.trim()}
          className="px-2.5 rounded-lg disabled:opacity-30 text-white" style={{ background: shirt }}>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
