'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, X, Settings, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface AIAssistantProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

type Mood = 'idle' | 'thinking' | 'talking' | 'happy' | 'excited' | 'sad' | 'waving' | 'walking' | 'working' | 'listening';
type Gender = 'male' | 'female';

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
  const [blink, setBlink] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);
  const [legFrame, setLegFrame] = useState(0);
  const [armAngle, setArmAngle] = useState(0);
  const [assistantName, setAssistantName] = useState('زيفي');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [skinTone, setSkinTone] = useState('#e8b88a');
  const endRef = useRef<HTMLDivElement>(null);
  const walkRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zivv_assistant');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.enabled !== undefined) setEnabled(s.enabled);
        if (s.gender) setGender(s.gender);
        if (s.name) setAssistantName(s.name);
        if (s.voiceEnabled !== undefined) setVoiceEnabled(s.voiceEnabled);
        if (s.skinTone) setSkinTone(s.skinTone);
        if (s.photos) setUserPhotos(s.photos);
      } catch {}
    }
  }, []);

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('zivv_assistant', JSON.stringify({
      enabled, gender, name: assistantName, voiceEnabled, skinTone, photos: userPhotos,
    }));
  };

  // Blink
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [enabled]);

  // Idle animations
  useEffect(() => {
    if (!enabled || isOpen || mood !== 'idle') return;
    const interval = setInterval(() => {
      const r = Math.random();
      if (r < 0.25) walkTo(15 + Math.random() * 70);
      else if (r < 0.4) { setArmAngle(-50); setBubble('👋'); setTimeout(() => { setArmAngle(0); setBubble(''); }, 1200); }
    }, 5000);
    return () => clearInterval(interval);
  }, [enabled, isOpen, mood]);

  const walkTo = useCallback((target: number) => {
    if (walkRef.current) clearInterval(walkRef.current);
    setMood('walking');
    setFacingRight(target > posX);
    walkRef.current = setInterval(() => {
      setPosX(prev => {
        const diff = target - prev;
        if (Math.abs(diff) < 2) { setMood('idle'); if (walkRef.current) clearInterval(walkRef.current); return target; }
        setLegFrame(f => (f + 1) % 4);
        return prev + (diff > 0 ? 2 : -2);
      });
    }, 30);
  }, [posX]);

  // Text to Speech (FREE - browser built-in)
  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ar-SA';
    utter.rate = 1;
    utter.pitch = gender === 'female' ? 1.3 : 0.9;
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arVoice) utter.voice = arVoice;
    
    // Mouth animation while speaking
    setMood('talking');
    const mouthInterval = setInterval(() => setMouthFrame(f => (f + 1) % 3), 120);
    utter.onend = () => { clearInterval(mouthInterval); setMouthFrame(0); setMood('happy'); setTimeout(() => setMood('idle'), 2000); };
    
    window.speechSynthesis.speak(utter);
  };

  // Speech to Text (FREE - browser built-in)
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('متصفحك لا يدعم التعرف على الصوت'); return; }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setMood('idle');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => { setIsListening(true); setMood('listening'); setBubble('🎤 بسمعك...'); };
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setIsListening(false);
      setMood('idle');
      setBubble('');
      // Auto send
      setTimeout(() => {
        setInput('');
        processMessage(text);
      }, 300);
    };
    recognition.onerror = () => { setIsListening(false); setMood('idle'); setBubble(''); };
    recognition.onend = () => { setIsListening(false); };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Execute commands
  const executeCommand = async (m: string): Promise<string | null> => {
    const msg = m.toLowerCase();
    
    // Hide assistant
    if (msg.includes('اختفي') || msg.includes('اختف') || msg.includes('روح') || msg.includes('باي')) {
      setTimeout(() => setEnabled(false), 1500);
      return `باي باي! 👋 قولي "فعّل المساعد" من الإعدادات لو احتجتني`;
    }

    // Navigation
    const pages: Record<string, string> = {
      'الرئيسية': 'home', 'هوم': 'home', 'بحث': 'search', 'حالات': 'stories', 'ستوري': 'stories',
      'ريلز': 'shorts', 'فيديو': 'shorts', 'موسيقى': 'music', 'اغاني': 'music',
      'رسائل': 'chat', 'رسالة': 'chat', 'شات': 'chat', 'دردشة': 'chat',
      'أصدقاء': 'friends', 'اصدقاء': 'friends', 'إشعارات': 'notifications', 'اشعارات': 'notifications',
      'ملف شخصي': 'profile', 'بروفايل': 'profile', 'حسابي': 'profile', 'ملفي': 'profile',
      'إعدادات': 'settings', 'اعدادات': 'settings', 'نشر': 'create', 'منشور': 'create', 'بوست': 'create',
    };

    if (msg.includes('افتح') || msg.includes('روح') || msg.includes('خش') || msg.includes('ودين') || msg.includes('فتح')) {
      for (const [kw, page] of Object.entries(pages)) {
        if (msg.includes(kw)) {
          setMood('excited');
          walkTo(Math.random() * 60 + 20);
          await new Promise(r => setTimeout(r, 600));
          onNavigate(page);
          return `✅ حاضر! فتحت لك ${kw}`;
        }
      }
    }

    // Post
    if ((msg.includes('انشر') || msg.includes('اكتب بوست') || msg.includes('حط منشور')) && user) {
      const content = msg.replace(/انشر|اكتب|حط|لي|منشور|بوست|يقول|فيه|عن/g, '').trim();
      if (content.length > 2) {
        setMood('working');
        try {
          await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, type: 'text', content }) });
          return `✅ تم! نشرت لك: "${content}"`;
        } catch { return '❌ ما قدرت أنشر'; }
      }
      onNavigate('create'); return '✅ فتحت لك صفحة النشر!';
    }

    // Search
    if ((msg.includes('ابحث') || msg.includes('دور')) && user) {
      const q = msg.replace(/ابحث|دور|عن|على|لي/g, '').trim();
      if (q.length > 1) {
        setMood('working');
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
          const data = await res.json();
          if (data.users?.length > 0) return `✅ لقيت:\n${data.users.slice(0, 3).map((u: any) => `• @${u.username}`).join('\n')}`;
          return `🔍 ما لقيت نتائج لـ "${q}"`;
        } catch { return '❌ فشل البحث'; }
      }
    }

    // Send message
    if ((msg.includes('ابعت رسالة') || msg.includes('ابعت رساله') || msg.includes('ارسل رسالة')) && user) {
      onNavigate('chat'); return '✅ فتحت لك الرسائل! اختر صديق وابعت الرسالة';
    }

    // Gold
    if ((msg.includes('ذهبي') || msg.includes('جولد') || msg.includes('اشتراك')) && user) {
      try {
        await fetch('/api/gold-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, message: 'طلب من المساعد الذكي' }) });
        return '✅ تم إرسال طلب الاشتراك الذهبي! ⭐';
      } catch { return 'الطلب موجود بالفعل'; }
    }

    return null;
  };

  const processMessage = async (text: string) => {
    setMsgs(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true); setMood('thinking'); setBubble('🤔');

    try {
      const action = await executeCommand(text);
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, message: text }) });
      const data = await res.json();
      
      const reply = action || data.response || 'ما فهمت. ممكن تعيد؟';
      setBubble(reply.length > 35 ? reply.substring(0, 35) + '...' : reply);
      setMsgs(prev => [...prev, { role: 'assistant', text: reply }]);
      speak(reply);
    } catch {
      setMood('sad'); setBubble('😔');
      setMsgs(prev => [...prev, { role: 'assistant', text: 'حدث خطأ' }]);
    } finally { setIsLoading(false); }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input; setInput('');
    await processMessage(msg);
  };

  // Colors
  const hair = gender === 'male' ? '#1a1a2e' : '#3d1f0a';
  const shirt = gender === 'male' ? '#0095f6' : '#e91e8f';
  const pants = gender === 'male' ? '#1e3a5f' : '#2d1b4e';

  // Avatar renderer
  const Avatar = ({ size }: { size: number }) => {
    const s = size;
    const headR = s * 0.17;
    const mouthShapes = ['‿', '○', '◡'];
    const hasPhoto = userPhotos.length > 0;

    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        {/* Shadow */}
        <ellipse cx={s/2} cy={s*0.95} rx={s*0.2} ry={s*0.02} fill="rgba(0,0,0,0.3)" />

        {/* Legs */}
        <rect x={s*0.38} y={s*0.65} width={s*0.09} height={s*0.22} rx={3} fill={pants}
          transform={mood==='walking'?`rotate(${legFrame%2===0?12:-12} ${s*0.42} ${s*0.65})`:''} />
        <rect x={s*0.53} y={s*0.65} width={s*0.09} height={s*0.22} rx={3} fill={pants}
          transform={mood==='walking'?`rotate(${legFrame%2===0?-12:12} ${s*0.57} ${s*0.65})`:''} />
        
        {/* Shoes */}
        <rect x={s*0.35} y={s*0.85} width={s*0.13} height={s*0.04} rx={2} fill="#222" />
        <rect x={s*0.52} y={s*0.85} width={s*0.13} height={s*0.04} rx={2} fill="#222" />

        {/* Body */}
        <rect x={s*0.3} y={s*0.4} width={s*0.4} height={s*0.28} rx={6} fill={shirt} />
        <text x={s/2} y={s*0.58} textAnchor="middle" fontSize={s*0.07} fill="rgba(255,255,255,0.5)" fontWeight="bold">Z</text>

        {/* Left arm */}
        <rect x={s*0.2} y={s*0.42} width={s*0.08} height={s*0.22} rx={4} fill={shirt}
          transform={`rotate(${armAngle} ${s*0.24} ${s*0.42})`} />
        <circle cx={s*0.22} cy={s*0.65+armAngle*-0.15} r={s*0.035} fill={skinTone} />

        {/* Right arm */}
        <rect x={s*0.72} y={s*0.42} width={s*0.08} height={s*0.22} rx={4} fill={shirt}
          transform={`rotate(${mood==='working'?20:0} ${s*0.76} ${s*0.42})`} />
        <circle cx={s*0.78} cy={mood==='working'?s*0.6:s*0.65} r={s*0.035} fill={skinTone} />

        {/* Neck */}
        <rect x={s*0.44} y={s*0.36} width={s*0.12} height={s*0.06} fill={skinTone} />

        {/* Head */}
        {hasPhoto ? (
          <clipPath id="headClip"><circle cx={s/2} cy={s*0.22} r={headR} /></clipPath>
        ) : null}
        <circle cx={s/2} cy={s*0.22} r={headR} fill={skinTone} />
        
        {/* Hair */}
        <ellipse cx={s/2} cy={s*0.12} rx={headR*1.1} ry={headR*0.55} fill={hair} />
        {gender === 'female' && <>
          <ellipse cx={s*0.32} cy={s*0.2} rx={headR*0.3} ry={headR*0.7} fill={hair} />
          <ellipse cx={s*0.68} cy={s*0.2} rx={headR*0.3} ry={headR*0.7} fill={hair} />
        </>}

        {/* Eyes */}
        <ellipse cx={s*0.43} cy={s*0.2} rx={s*0.025} ry={blink?s*0.005:s*0.025} fill="#222" />
        <ellipse cx={s*0.57} cy={s*0.2} rx={s*0.025} ry={blink?s*0.005:s*0.025} fill="#222" />
        {!blink && <>
          <circle cx={s*0.435} cy={s*0.195} r={s*0.008} fill="#fff" />
          <circle cx={s*0.575} cy={s*0.195} r={s*0.008} fill="#fff" />
        </>}

        {/* Eyebrows */}
        <line x1={s*0.4} y1={mood==='sad'?s*0.16:s*0.15} x2={s*0.46} y2={s*0.15} stroke={hair} strokeWidth={1.5} strokeLinecap="round" />
        <line x1={s*0.54} y1={s*0.15} x2={s*0.6} y2={mood==='sad'?s*0.16:s*0.15} stroke={hair} strokeWidth={1.5} strokeLinecap="round" />

        {/* Blush */}
        {(mood==='happy'||mood==='excited') && <>
          <circle cx={s*0.38} cy={s*0.24} r={s*0.02} fill="rgba(255,100,100,0.3)" />
          <circle cx={s*0.62} cy={s*0.24} r={s*0.02} fill="rgba(255,100,100,0.3)" />
        </>}

        {/* Mouth */}
        <text x={s/2} y={s*0.3} textAnchor="middle" fontSize={s*0.06} fill="#c55">
          {mood==='talking' ? mouthShapes[mouthFrame] : mood==='happy'||mood==='excited' ? '◡' : mood==='sad' ? '︵' : mood==='listening' ? '○' : '‿'}
        </text>

        {/* Headphones when listening */}
        {mood==='listening' && <>
          <path d={`M ${s*0.33} ${s*0.18} Q ${s*0.33} ${s*0.08} ${s/2} ${s*0.08} Q ${s*0.67} ${s*0.08} ${s*0.67} ${s*0.18}`} stroke="#333" strokeWidth={2} fill="none" />
          <circle cx={s*0.33} cy={s*0.2} r={s*0.03} fill="#333" />
          <circle cx={s*0.67} cy={s*0.2} r={s*0.03} fill="#333" />
        </>}
      </svg>
    );
  };

  if (!enabled) return null;

  // Floating character
  if (!isOpen) {
    return (
      <div className="fixed z-50 transition-all duration-500 ease-out" style={{
        bottom: 65, right: `${posX}%`, transform: `translateX(50%) ${facingRight?'':'scaleX(-1)'}`,
      }}>
        {bubble && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap animate-fadeIn">
            <div className="bg-[#0095f6] text-white text-[9px] px-2 py-1 rounded-lg shadow-lg">{bubble}</div>
          </div>
        )}
        <button onClick={() => setIsOpen(true)}><Avatar size={70} /></button>
      </div>
    );
  }

  // Open panel
  return (
    <div className="fixed bottom-[60px] left-2 right-2 md:bottom-4 md:left-auto md:right-4 md:w-[380px] z-50 bg-[#0a0a0a] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl" style={{ maxHeight: '75vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: shirt }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8"><Avatar size={32} /></div>
          <div>
            <p className="text-[11px] font-bold text-white">{assistantName}</p>
            <p className="text-[8px] text-white/70">
              {mood==='thinking'?'🤔 يفكر':mood==='talking'?'🗣️ يتكلم':mood==='working'?'⚡ ينفذ':mood==='listening'?'🎤 يسمعك':'🟢 جاهز'}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={()=>setVoiceEnabled(!voiceEnabled)} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            {voiceEnabled?<Volume2 size={10} className="text-white"/>:<VolumeX size={10} className="text-white"/>}
          </button>
          <button onClick={()=>setShowSettings(!showSettings)} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Settings size={10} className="text-white"/>
          </button>
          <button onClick={()=>setIsOpen(false)} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <X size={10} className="text-white"/>
          </button>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="p-3 border-b border-[#262626] space-y-3">
          <div>
            <p className="text-[10px] text-[#737373] mb-1">اسم المساعد:</p>
            <input type="text" value={assistantName} onChange={e=>setAssistantName(e.target.value)} onBlur={saveSettings}
              className="w-full bg-[#1a1a1a] rounded px-2 py-1 text-xs outline-none" />
          </div>
          <div>
            <p className="text-[10px] text-[#737373] mb-1">الشكل:</p>
            <div className="flex gap-2">
              <button onClick={()=>{setGender('male');saveSettings();}} className={`flex-1 py-1.5 rounded text-[10px] ${gender==='male'?'bg-[#0095f6] text-white':'bg-[#1a1a1a] text-[#737373]'}`}>👨 رجل</button>
              <button onClick={()=>{setGender('female');saveSettings();}} className={`flex-1 py-1.5 rounded text-[10px] ${gender==='female'?'bg-[#e91e8f] text-white':'bg-[#1a1a1a] text-[#737373]'}`}>👩 امرأة</button>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[#737373] mb-1">لون البشرة:</p>
            <div className="flex gap-1">
              {['#f5d0a9','#e8b88a','#d4956b','#a0704e','#6b4226'].map(c=>(
                <button key={c} onClick={()=>{setSkinTone(c);saveSettings();}}
                  className={`w-7 h-7 rounded-full border-2 ${skinTone===c?'border-white':'border-transparent'}`} style={{background:c}} />
              ))}
            </div>
          </div>
          <button onClick={()=>{setEnabled(false);saveSettings();setIsOpen(false);}} className="w-full py-1.5 bg-[#ed4956]/20 text-[#ed4956] rounded text-[10px]">
            إلغاء تفعيل المساعد
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-2 py-1.5 border-b border-[#262626] flex gap-1 overflow-x-auto scrollbar-hide">
        {['📝 انشر','🔍 ابحث','💬 رسائل','👥 أصدقاء','⭐ ذهبي','👤 حسابي','🏠 رئيسية','⚙️ إعدادات'].map(b=>(
          <button key={b} onClick={()=>processMessage(`افتح ${b.replace(/📝|🔍|💬|👥|⭐|👤|🏠|⚙️/g,'').trim()}`)}
            className="px-2 py-1 bg-[#1a1a1a] rounded-full text-[9px] text-[#a0a0a0] whitespace-nowrap flex-shrink-0">{b}</button>
        ))}
      </div>

      {/* Messages */}
      <div className="overflow-y-auto p-2 space-y-1.5" style={{maxHeight:'30vh'}}>
        {msgs.length===0 && (
          <div className="text-center py-3">
            <div className="w-14 mx-auto mb-2"><Avatar size={56} /></div>
            <p className="text-[11px] text-[#737373]">أهلاً! أنا {assistantName}</p>
            <p className="text-[9px] text-[#525252]">اكتب أو تكلم وأنا أعملها 🎤</p>
          </div>
        )}
        {msgs.map((m,i)=>(
          <div key={i} className={`flex ${m.role==='user'?'justify-start':'justify-end gap-1'}`}>
            {m.role==='assistant' && <div className="w-4 h-4 mt-1 flex-shrink-0"><Avatar size={16}/></div>}
            <div className={`max-w-[80%] rounded-xl px-2 py-1 text-[11px] ${m.role==='user'?'bg-[#0095f6]':'bg-[#1a1a1a]'}`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {isLoading && <div className="flex justify-end gap-1">
          <div className="w-4 h-4 mt-1"><Avatar size={16}/></div>
          <div className="bg-[#1a1a1a] rounded-xl px-3 py-1.5 flex gap-1">
            <span className="w-1 h-1 bg-[#525252] rounded-full animate-bounce"/>
            <span className="w-1 h-1 bg-[#525252] rounded-full animate-bounce" style={{animationDelay:'0.1s'}}/>
            <span className="w-1 h-1 bg-[#525252] rounded-full animate-bounce" style={{animationDelay:'0.2s'}}/>
          </div>
        </div>}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div className="p-2 border-t border-[#262626] flex gap-1.5">
        <button onClick={toggleListening}
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isListening?'bg-[#ed4956] animate-pulse':'bg-[#1a1a1a]'}`}>
          {isListening?<MicOff size={14}/>:<Mic size={14} className="text-[#737373]"/>}
        </button>
        <input type="text" value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&sendMessage()}
          placeholder="اكتب أو تكلم..." className="flex-1 bg-[#1a1a1a] rounded-lg px-2 py-1.5 text-xs outline-none"/>
        <button onClick={sendMessage} disabled={isLoading||!input.trim()}
          className="px-2.5 rounded-lg disabled:opacity-30 text-white" style={{background:shirt}}>
          <Send size={13}/>
        </button>
      </div>
    </div>
  );
}
