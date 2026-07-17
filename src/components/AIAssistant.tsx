'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, X, Minus, Settings, ChevronUp } from 'lucide-react';

interface AIAssistantProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

type Mood = 'idle' | 'thinking' | 'talking' | 'happy' | 'excited' | 'sad' | 'waving' | 'walking' | 'working';
type Gender = 'male' | 'female';

export default function AIAssistant({ onNavigate }: AIAssistantProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; text: string; action?: string }>>([]);
  const [gender, setGender] = useState<Gender>('male');
  const [mood, setMood] = useState<Mood>('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 0 });
  const [bubble, setBubble] = useState('');
  const [isWalking, setIsWalking] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [blinking, setBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [armWave, setArmWave] = useState(false);
  const [legAnim, setLegAnim] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const walkRef = useRef<NodeJS.Timeout | null>(null);
  const blinkRef = useRef<NodeJS.Timeout | null>(null);
  const talkRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Blink randomly
  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
      blinkRef.current = setTimeout(blink, 2000 + Math.random() * 4000);
    };
    blinkRef.current = setTimeout(blink, 2000);
    return () => { if (blinkRef.current) clearTimeout(blinkRef.current); };
  }, []);

  // Idle movement
  useEffect(() => {
    if (mood !== 'idle' || isOpen) return;
    const interval = setInterval(() => {
      const r = Math.random();
      if (r < 0.3) {
        walkTo(20 + Math.random() * 60);
      } else if (r < 0.5) {
        setArmWave(true);
        setBubble('👋');
        setTimeout(() => { setArmWave(false); setBubble(''); }, 1500);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [mood, isOpen]);

  const walkTo = useCallback((targetX: number) => {
    if (walkRef.current) clearInterval(walkRef.current);
    setIsWalking(true);
    setMood('walking');
    setFacingRight(targetX > position.x);

    walkRef.current = setInterval(() => {
      setPosition(prev => {
        const diff = targetX - prev.x;
        if (Math.abs(diff) < 1.5) {
          setIsWalking(false);
          setMood('idle');
          if (walkRef.current) clearInterval(walkRef.current);
          return { ...prev, x: targetX };
        }
        setLegAnim(p => (p + 1) % 4);
        return { ...prev, x: prev.x + (diff > 0 ? 1.5 : -1.5) };
      });
    }, 25);
  }, [position.x]);

  const startTalking = (duration: number) => {
    setMood('talking');
    let count = 0;
    const interval = setInterval(() => {
      setMouthOpen(p => !p);
      count++;
      if (count > duration / 100) {
        clearInterval(interval);
        setMouthOpen(false);
        setMood('happy');
        setTimeout(() => setMood('idle'), 2000);
      }
    }, 100);
    talkRef.current = interval as unknown as NodeJS.Timeout;
  };

  // Parse and execute commands
  const executeCommand = async (msg: string): Promise<string> => {
    const m = msg.toLowerCase();
    const pages: Record<string, { key: string; label: string }> = {
      'الرئيسية': { key: 'home', label: 'الصفحة الرئيسية' },
      'هوم': { key: 'home', label: 'الصفحة الرئيسية' },
      'بحث': { key: 'search', label: 'البحث' },
      'حالات': { key: 'stories', label: 'الحالات' },
      'ستوري': { key: 'stories', label: 'الحالات' },
      'ريلز': { key: 'shorts', label: 'الريلز' },
      'فيديو': { key: 'shorts', label: 'الريلز' },
      'موسيقى': { key: 'music', label: 'الموسيقى' },
      'اغاني': { key: 'music', label: 'الموسيقى' },
      'رسائل': { key: 'chat', label: 'الرسائل' },
      'رسالة': { key: 'chat', label: 'الرسائل' },
      'شات': { key: 'chat', label: 'الرسائل' },
      'دردشة': { key: 'chat', label: 'الرسائل' },
      'أصدقاء': { key: 'friends', label: 'الأصدقاء' },
      'اصدقاء': { key: 'friends', label: 'الأصدقاء' },
      'صداقة': { key: 'friends', label: 'الأصدقاء' },
      'إشعارات': { key: 'notifications', label: 'الإشعارات' },
      'اشعارات': { key: 'notifications', label: 'الإشعارات' },
      'ملف شخصي': { key: 'profile', label: 'الملف الشخصي' },
      'بروفايل': { key: 'profile', label: 'الملف الشخصي' },
      'حسابي': { key: 'profile', label: 'الملف الشخصي' },
      'ملفي': { key: 'profile', label: 'الملف الشخصي' },
      'إعدادات': { key: 'settings', label: 'الإعدادات' },
      'اعدادات': { key: 'settings', label: 'الإعدادات' },
      'نشر': { key: 'create', label: 'النشر' },
      'منشور': { key: 'create', label: 'النشر' },
      'بوست': { key: 'create', label: 'النشر' },
      'ذكاء': { key: 'ai', label: 'الذكاء الاصطناعي' },
    };

    // Check if navigating
    if (m.includes('افتح') || m.includes('روح') || m.includes('خش') || m.includes('ودين') || m.includes('فتح')) {
      for (const [keyword, page] of Object.entries(pages)) {
        if (m.includes(keyword)) {
          setMood('excited');
          setBubble(`🚶 رايح ${page.label}...`);
          walkTo(Math.random() * 60 + 20);
          await new Promise(r => setTimeout(r, 800));
          onNavigate(page.key);
          return `✅ فتحت لك ${page.label}!`;
        }
      }
    }

    // Post something
    if ((m.includes('انشر') || m.includes('اكتب') || m.includes('حط')) && user) {
      const content = m.replace(/انشر|اكتب|حط|لي|منشور|بوست|يقول|فيه|عن/g, '').trim();
      if (content.length > 2) {
        setMood('working');
        setBubble('✍️ بنشر...');
        try {
          await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, type: 'text', content }),
          });
          return `✅ نشرت لك: "${content}"`;
        } catch { return '❌ ما قدرت أنشر. حاول تاني.'; }
      }
      onNavigate('create');
      return '✅ فتحت لك صفحة النشر. اكتب منشورك!';
    }

    // Search
    if ((m.includes('ابحث') || m.includes('دور')) && user) {
      const query = m.replace(/ابحث|دور|عن|على|لي/g, '').trim();
      if (query.length > 1) {
        setMood('working');
        setBubble('🔍 ببحث...');
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          const users = data.users || [];
          const posts = data.posts || [];
          if (users.length > 0 || posts.length > 0) {
            let result = `✅ نتائج البحث عن "${query}":\n`;
            if (users.length > 0) result += `\n👥 حسابات:\n${users.slice(0, 5).map((u: { username: string }) => `  • @${u.username}`).join('\n')}`;
            if (posts.length > 0) result += `\n📝 منشورات: ${posts.length} نتيجة`;
            return result;
          }
          return `🔍 ما لقيت نتائج لـ "${query}"`;
        } catch { return '❌ فشل البحث'; }
      }
      onNavigate('search');
      return '✅ فتحت لك البحث!';
    }

    // Gold subscription
    if ((m.includes('ذهبي') || m.includes('جولد') || m.includes('اشتراك')) && user) {
      setMood('working');
      setBubble('⭐ ببعت الطلب...');
      try {
        await fetch('/api/gold-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, message: 'طلب من المساعد الذكي' }),
        });
        return '✅ تم إرسال طلب الاشتراك الذهبي! ⭐';
      } catch { return 'الطلب موجود بالفعل أو حدث خطأ.'; }
    }

    // No command matched - ask AI
    return '';
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setIsLoading(true);
    setMood('thinking');
    setBubble('🤔');

    try {
      // Try command first
      const actionResult = await executeCommand(msg);

      // Get AI response
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, message: msg, searchWeb: false }),
      });
      const data = await res.json();

      let reply = actionResult || '';
      if (data.response && !actionResult) {
        reply = data.response;
      } else if (data.response && actionResult) {
        reply = actionResult;
      }

      setBubble(reply.length > 40 ? reply.substring(0, 40) + '...' : reply);
      startTalking(Math.min(reply.length * 25, 3000));
      setMessages(prev => [...prev, { role: 'assistant', text: reply, action: actionResult ? '✅' : undefined }]);
    } catch {
      setMood('sad');
      setBubble('😔');
      setMessages(prev => [...prev, { role: 'assistant', text: 'حدث خطأ.' }]);
      setTimeout(() => setMood('idle'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Colors
  const skin = '#e8b88a';
  const hair = gender === 'male' ? '#1a1a2e' : '#3d1f0a';
  const shirt = gender === 'male' ? '#0095f6' : '#e91e8f';
  const pants = gender === 'male' ? '#1e3a5f' : '#2d1b4e';
  const name = gender === 'male' ? 'مساعد Zivv' : 'مساعدة Zivv';

  // Render avatar
  const renderAvatar = (size: number) => {
    const s = size;
    const headSize = s * 0.35;
    const bodyH = s * 0.3;
    const legH = s * 0.25;
    const armW = s * 0.07;

    const eyeOpen = !blinking;
    const mouthShape = mouthOpen ? '○' : (mood === 'happy' || mood === 'excited') ? '◡' : mood === 'sad' ? '︵' : '‿';

    return (
      <div className="relative" style={{ width: s, height: s }}>
        {/* Hair */}
        <div className="absolute rounded-t-full" style={{
          top: s * 0.02, left: s * 0.25, width: headSize * 1.1, height: headSize * 0.5, background: hair,
        }} />
        {gender === 'female' && <>
          <div className="absolute rounded-full" style={{ top: s * 0.05, left: s * 0.15, width: headSize * 0.35, height: headSize * 0.8, background: hair }} />
          <div className="absolute rounded-full" style={{ top: s * 0.05, right: s * 0.15, width: headSize * 0.35, height: headSize * 0.8, background: hair }} />
        </>}

        {/* Head */}
        <div className="absolute rounded-full" style={{
          top: s * 0.05, left: s * 0.28, width: headSize, height: headSize, background: skin,
          boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.1)',
        }}>
          {/* Eyes */}
          <div className="absolute flex justify-between" style={{
            top: headSize * 0.35, left: headSize * 0.2, right: headSize * 0.2,
          }}>
            <div style={{
              width: headSize * 0.15, height: eyeOpen ? headSize * 0.15 : headSize * 0.03,
              background: '#222', borderRadius: '50%', transition: 'height 0.1s',
            }} />
            <div style={{
              width: headSize * 0.15, height: eyeOpen ? headSize * 0.15 : headSize * 0.03,
              background: '#222', borderRadius: '50%', transition: 'height 0.1s',
            }} />
          </div>

          {/* Eyebrows */}
          <div className="absolute flex justify-between" style={{
            top: headSize * 0.22, left: headSize * 0.15, right: headSize * 0.15,
          }}>
            <div style={{
              width: headSize * 0.2, height: 2, background: hair, borderRadius: 2,
              transform: mood === 'sad' ? 'rotate(10deg)' : mood === 'excited' ? 'rotate(-15deg) translateY(-2px)' : 'rotate(0)',
              transition: 'transform 0.3s',
            }} />
            <div style={{
              width: headSize * 0.2, height: 2, background: hair, borderRadius: 2,
              transform: mood === 'sad' ? 'rotate(-10deg)' : mood === 'excited' ? 'rotate(15deg) translateY(-2px)' : 'rotate(0)',
              transition: 'transform 0.3s',
            }} />
          </div>

          {/* Blush */}
          {(mood === 'happy' || mood === 'excited') && <>
            <div className="absolute rounded-full" style={{
              top: headSize * 0.5, left: headSize * 0.05, width: headSize * 0.18, height: headSize * 0.1,
              background: 'rgba(255,100,100,0.3)',
            }} />
            <div className="absolute rounded-full" style={{
              top: headSize * 0.5, right: headSize * 0.05, width: headSize * 0.18, height: headSize * 0.1,
              background: 'rgba(255,100,100,0.3)',
            }} />
          </>}

          {/* Mouth */}
          <div className="absolute text-center" style={{
            bottom: headSize * 0.2, left: 0, right: 0,
            fontSize: headSize * 0.25, color: '#c55', transition: 'all 0.1s',
          }}>
            {mouthShape}
          </div>
        </div>

        {/* Neck */}
        <div className="absolute" style={{
          top: s * 0.05 + headSize - 2, left: s * 0.4, width: s * 0.1, height: s * 0.04, background: skin,
        }} />

        {/* Body */}
        <div className="absolute rounded-t-lg" style={{
          top: s * 0.05 + headSize + s * 0.02, left: s * 0.25, width: s * 0.4, height: bodyH, background: shirt,
        }}>
          <div className="absolute text-center font-bold" style={{
            top: bodyH * 0.3, left: 0, right: 0, fontSize: s * 0.08, color: 'rgba(255,255,255,0.6)',
          }}>Z</div>
        </div>

        {/* Left arm */}
        <div className="absolute origin-top" style={{
          top: s * 0.05 + headSize + s * 0.03, left: s * 0.18, width: armW, height: bodyH * 0.9,
          background: shirt, borderRadius: armW / 2,
          transform: armWave ? 'rotate(-60deg)' : mood === 'excited' ? 'rotate(-30deg)' : 'rotate(5deg)',
          transition: 'transform 0.3s',
        }}>
          <div className="absolute rounded-full" style={{
            bottom: -3, left: -1, width: armW + 2, height: armW + 2, background: skin,
          }} />
        </div>

        {/* Right arm */}
        <div className="absolute origin-top" style={{
          top: s * 0.05 + headSize + s * 0.03, right: s * 0.18, width: armW, height: bodyH * 0.9,
          background: shirt, borderRadius: armW / 2,
          transform: mood === 'working' ? 'rotate(30deg)' : 'rotate(-5deg)',
          transition: 'transform 0.3s',
        }}>
          <div className="absolute rounded-full" style={{
            bottom: -3, right: -1, width: armW + 2, height: armW + 2, background: skin,
          }} />
        </div>

        {/* Legs */}
        <div className="absolute flex gap-1" style={{
          top: s * 0.05 + headSize + s * 0.02 + bodyH - 2, left: s * 0.3,
        }}>
          <div style={{
            width: s * 0.12, height: legH, background: pants, borderRadius: '0 0 4px 4px',
            transform: isWalking ? `rotate(${legAnim % 2 === 0 ? 15 : -15}deg)` : 'rotate(0)',
            transformOrigin: 'top', transition: isWalking ? 'none' : 'transform 0.3s',
          }}>
            <div style={{ position: 'absolute', bottom: 0, left: -1, width: s * 0.14, height: s * 0.04, background: '#222', borderRadius: 3 }} />
          </div>
          <div style={{
            width: s * 0.12, height: legH, background: pants, borderRadius: '0 0 4px 4px',
            transform: isWalking ? `rotate(${legAnim % 2 === 0 ? -15 : 15}deg)` : 'rotate(0)',
            transformOrigin: 'top', transition: isWalking ? 'none' : 'transform 0.3s',
          }}>
            <div style={{ position: 'absolute', bottom: 0, left: -1, width: s * 0.14, height: s * 0.04, background: '#222', borderRadius: 3 }} />
          </div>
        </div>

        {/* Shadow */}
        <div className="absolute rounded-full" style={{
          bottom: 0, left: s * 0.2, width: s * 0.5, height: s * 0.04,
          background: 'rgba(0,0,0,0.3)', filter: 'blur(2px)',
        }} />
      </div>
    );
  };

  // ===== Floating character (not open) =====
  if (!isOpen) {
    return (
      <div className="fixed z-50 transition-all duration-300" style={{
        bottom: '70px', right: `${position.x}%`,
        transform: `translateX(50%) ${facingRight ? '' : 'scaleX(-1)'}`,
      }}>
        {/* Bubble */}
        {bubble && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap animate-fadeIn">
            <div className="bg-[#0095f6] text-white text-[10px] px-2 py-1 rounded-lg">{bubble}</div>
          </div>
        )}

        <button onClick={() => setIsOpen(true)} className="block">
          {renderAvatar(80)}
        </button>

        <p className="text-[8px] text-[#525252] text-center mt-1">اضغط للتفعيل</p>
      </div>
    );
  }

  // ===== Open panel =====
  return (
    <div className="fixed bottom-[60px] left-2 right-2 md:bottom-4 md:left-auto md:right-4 md:w-[400px] z-50 bg-[#0a0a0a] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl"
      style={{ maxHeight: '75vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: shirt }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9">{renderAvatar(36)}</div>
          <div>
            <p className="text-xs font-bold text-white">{name}</p>
            <p className="text-[9px] text-white/70">
              {mood === 'thinking' ? '🤔 يفكر...' : mood === 'talking' ? '🗣️ يتكلم...' : mood === 'working' ? '⚡ ينفذ...' : mood === 'walking' ? '🚶 يمشي...' : '🟢 جاهز'}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowSettings(!showSettings)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Settings size={12} className="text-white" />
          </button>
          <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <X size={12} className="text-white" />
          </button>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="p-3 border-b border-[#262626]">
          <p className="text-[10px] text-[#737373] mb-2">شكل المساعد:</p>
          <div className="flex gap-2">
            <button onClick={() => { setGender('male'); setShowSettings(false); }}
              className={`flex-1 py-2 rounded-lg text-xs ${gender === 'male' ? 'bg-[#0095f6] text-white' : 'bg-[#262626] text-[#737373]'}`}>
              👨 رجل
            </button>
            <button onClick={() => { setGender('female'); setShowSettings(false); }}
              className={`flex-1 py-2 rounded-lg text-xs ${gender === 'female' ? 'bg-[#e91e8f] text-white' : 'bg-[#262626] text-[#737373]'}`}>
              👩 امرأة
            </button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-2 py-1.5 border-b border-[#262626] flex gap-1 overflow-x-auto scrollbar-hide">
        {['📝 انشر', '🔍 ابحث', '👥 أصدقاء', '💬 رسائل', '⭐ ذهبي', '👤 حسابي', '🏠 الرئيسية', '⚙️ إعدادات'].map(btn => (
          <button key={btn} onClick={() => {
            const cmd = btn.replace(/📝|🔍|👥|💬|⭐|👤|🏠|⚙️/g, '').trim();
            setInput(`افتح ${cmd}`);
            setTimeout(() => sendMessage(), 50);
          }} className="px-2 py-1 bg-[#1a1a1a] rounded-full text-[9px] text-[#a0a0a0] whitespace-nowrap flex-shrink-0">
            {btn}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="overflow-y-auto p-2 space-y-2" style={{ maxHeight: '35vh' }}>
        {messages.length === 0 && (
          <div className="text-center py-4">
            <div className="w-16 mx-auto mb-2">{renderAvatar(64)}</div>
            <p className="text-xs text-[#737373]">أهلاً! أنا {name}</p>
            <p className="text-[10px] text-[#525252]">قولي أي حاجة وأنا أعملها!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end gap-1.5'}`}>
            {msg.role === 'assistant' && <div className="w-5 h-5 flex-shrink-0 mt-1">{renderAvatar(20)}</div>}
            <div className={`max-w-[80%] rounded-2xl px-2.5 py-1.5 text-[11px] ${
              msg.role === 'user' ? 'bg-[#0095f6]' : 'bg-[#1a1a1a]'
            } ${msg.action ? 'border border-green-500/30' : ''}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end gap-1.5">
            <div className="w-5 h-5 flex-shrink-0 mt-1">{renderAvatar(20)}</div>
            <div className="bg-[#1a1a1a] rounded-2xl px-3 py-2 flex gap-1">
              <span className="w-1 h-1 bg-[#525252] rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-[#525252] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-1 h-1 bg-[#525252] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-[#262626]">
        <div className="flex gap-1.5">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`اطلب أي حاجة...`}
            className="flex-1 bg-[#1a1a1a] rounded-lg px-3 py-2 text-xs outline-none" />
          <button onClick={sendMessage} disabled={isLoading || !input.trim()}
            className="px-3 rounded-lg disabled:opacity-30 text-white" style={{ background: shirt }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
