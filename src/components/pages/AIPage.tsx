'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Globe, Mic } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

type AvatarMood = 'happy' | 'thinking' | 'surprised' | 'talking' | 'idle' | 'waving' | 'sad';

const AVATAR_FACES: Record<AvatarMood, { eyes: string; mouth: string; brows: string }> = {
  idle:      { eyes: '● ●', mouth: '‿',  brows: '︵ ︵' },
  happy:     { eyes: '◠ ◠', mouth: '◡',  brows: '︵ ︵' },
  thinking:  { eyes: '● ◔', mouth: '∼',  brows: '︵ ╱' },
  surprised: { eyes: '◉ ◉', mouth: 'O',  brows: '╱ ╱' },
  talking:   { eyes: '● ●', mouth: '○',  brows: '︵ ︵' },
  waving:    { eyes: '◠ ◠', mouth: '◡',  brows: '︵ ︵' },
  sad:       { eyes: '● ●', mouth: '︵', brows: '╲ ╲' },
};

export default function AIPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchWeb, setSearchWeb] = useState(false);
  const [mood, setMood] = useState<AvatarMood>('idle');
  const [avatarPos, setAvatarPos] = useState(50); // percentage from right
  const [isBouncing, setIsBouncing] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [bubbleText, setBubbleText] = useState('أهلاً! أنا مساعد Zivv 👋\nاسألني أي شيء!');
  const [isWalking, setIsWalking] = useState(false);
  const [walkDirection, setWalkDirection] = useState<'left' | 'right'>('left');
  const endRef = useRef<HTMLDivElement>(null);
  const walkInterval = useRef<NodeJS.Timeout | null>(null);
  const moodTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Random idle animations
  useEffect(() => {
    const interval = setInterval(() => {
      if (mood === 'idle' && !isLoading) {
        const actions = ['blink', 'look', 'wave'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        if (action === 'blink') {
          setMood('happy');
          setTimeout(() => setMood('idle'), 300);
        } else if (action === 'look') {
          setAvatarPos(prev => {
            const newPos = prev + (Math.random() > 0.5 ? 10 : -10);
            return Math.max(20, Math.min(80, newPos));
          });
        } else if (action === 'wave') {
          setMood('waving');
          setIsBouncing(true);
          setTimeout(() => { setMood('idle'); setIsBouncing(false); }, 1500);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [mood, isLoading]);

  const setMoodTemporary = (m: AvatarMood, duration: number) => {
    if (moodTimeout.current) clearTimeout(moodTimeout.current);
    setMood(m);
    moodTimeout.current = setTimeout(() => setMood('idle'), duration);
  };

  const walkTo = (targetPos: number) => {
    setIsWalking(true);
    setWalkDirection(targetPos > avatarPos ? 'left' : 'right');
    
    if (walkInterval.current) clearInterval(walkInterval.current);
    
    walkInterval.current = setInterval(() => {
      setAvatarPos(prev => {
        const diff = targetPos - prev;
        if (Math.abs(diff) < 2) {
          setIsWalking(false);
          if (walkInterval.current) clearInterval(walkInterval.current);
          return targetPos;
        }
        return prev + (diff > 0 ? 2 : -2);
      });
    }, 30);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const msg = input;
    setMessages(prev => [...prev, { id: prev.length, role: 'user', content: msg }]);
    setInput('');
    setIsLoading(true);

    // Avatar reacts
    setMood('thinking');
    setBubbleText('🤔 أفكر...');
    setShowBubble(true);
    walkTo(30 + Math.random() * 40);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, message: msg, searchWeb }),
      });
      const data = await res.json();
      const reply = data.response || 'عذراً، حدث خطأ.';

      // Avatar talks
      setMood('talking');
      setBubbleText(reply.length > 60 ? reply.substring(0, 60) + '...' : reply);

      // Simulate talking animation
      const talkDuration = Math.min(reply.length * 30, 3000);
      setTimeout(() => {
        setMood('happy');
        setIsBouncing(true);
        setTimeout(() => { setIsBouncing(false); setMoodTemporary('happy', 2000); }, 500);
      }, talkDuration);

      setMessages(prev => [...prev, { id: prev.length, role: 'assistant', content: reply }]);
    } catch {
      setMood('sad');
      setBubbleText('حدث خطأ 😔');
      setMessages(prev => [...prev, { id: prev.length, role: 'assistant', content: 'حدث خطأ.' }]);
      setTimeout(() => setMoodTemporary('idle', 2000), 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const face = AVATAR_FACES[mood];

  return (
    <div className="flex flex-col pt-[82px] md:pt-0 pb-[60px] md:pb-0" style={{ height: '100dvh' }}>
      
      {/* Avatar Area */}
      <div className="relative bg-gradient-to-b from-[#0a0a1a] to-[#000] overflow-hidden flex-shrink-0" style={{ height: '200px' }}>
        
        {/* Stars background */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }} />
          ))}
        </div>

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1a1a2e] to-transparent" />
        
        {/* Avatar Character */}
        <div 
          className="absolute bottom-6 transition-all duration-300 ease-out"
          style={{ 
            right: `${avatarPos}%`, 
            transform: `translateX(50%) ${isWalking ? (walkDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)') : 'scaleX(1)'}`,
          }}
        >
          {/* Speech Bubble */}
          {showBubble && bubbleText && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 animate-fadeIn">
              <div className="bg-[#0095f6] rounded-2xl rounded-br-sm px-3 py-2 text-[11px] text-white leading-relaxed text-center">
                {bubbleText}
              </div>
              <div className="w-3 h-3 bg-[#0095f6] rotate-45 mx-auto -mt-1.5" />
            </div>
          )}
          
          {/* Character Body */}
          <div className={`relative ${isBouncing ? 'animate-bounce' : ''} ${isWalking ? 'animate-pulse' : ''}`}
            style={{ animationDuration: isWalking ? '0.3s' : '1s' }}>
            
            {/* Head */}
            <div className="relative w-16 h-16 mx-auto">
              {/* Hair */}
              <div className="absolute -top-2 left-1 right-1 h-6 bg-[#1a1a2e] rounded-t-full" />
              
              {/* Face */}
              <div className="absolute inset-0 bg-[#ffcc99] rounded-full border-2 border-[#f0b866] overflow-hidden">
                {/* Eyebrows */}
                <div className="absolute top-3 left-2 right-2 flex justify-between text-[6px] text-[#4a3520]">
                  <span>{face.brows.split(' ')[0]}</span>
                  <span>{face.brows.split(' ')[1]}</span>
                </div>
                
                {/* Eyes */}
                <div className="absolute top-5 left-2 right-2 flex justify-between text-[10px]">
                  <span className={mood === 'talking' ? 'animate-pulse' : ''}>{face.eyes.split(' ')[0]}</span>
                  <span className={mood === 'talking' ? 'animate-pulse' : ''}>{face.eyes.split(' ')[1]}</span>
                </div>
                
                {/* Cheeks (blush when happy) */}
                {(mood === 'happy' || mood === 'waving') && (
                  <>
                    <div className="absolute top-7 left-0.5 w-3 h-2 bg-[#ff9999]/40 rounded-full" />
                    <div className="absolute top-7 right-0.5 w-3 h-2 bg-[#ff9999]/40 rounded-full" />
                  </>
                )}
                
                {/* Mouth */}
                <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-[12px] text-[#cc6655] ${mood === 'talking' ? 'animate-pulse' : ''}`}
                  style={{ animationDuration: '0.15s' }}>
                  {face.mouth}
                </div>
              </div>
            </div>
            
            {/* Body */}
            <div className="relative w-12 h-14 mx-auto -mt-1">
              {/* Shirt */}
              <div className="w-full h-full bg-[#0095f6] rounded-t-lg rounded-b-md relative">
                {/* Collar */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-[#007acc] rounded-b-full" />
                {/* Zivv logo on shirt */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[7px] text-white/80 font-bold">Z</div>
              </div>
              
              {/* Arms */}
              <div className={`absolute -left-3 top-1 w-3 h-10 bg-[#0095f6] rounded-full origin-top transition-transform ${
                mood === 'waving' ? 'animate-bounce -rotate-45' : 'rotate-6'
              }`} style={{ animationDuration: '0.5s' }} />
              <div className="absolute -right-3 top-1 w-3 h-10 bg-[#0095f6] rounded-full rotate-[-6deg]" />
              
              {/* Hands */}
              <div className={`absolute -left-4 ${mood === 'waving' ? 'top-[-4px]' : 'top-10'} w-3 h-3 bg-[#ffcc99] rounded-full transition-all`} />
              <div className="absolute -right-4 top-10 w-3 h-3 bg-[#ffcc99] rounded-full" />
            </div>
            
            {/* Legs */}
            <div className="flex justify-center gap-1 -mt-1">
              <div className={`w-4 h-8 bg-[#2a2a3e] rounded-b-md ${isWalking ? 'animate-pulse' : ''}`}
                style={{ animationDuration: '0.2s' }} />
              <div className={`w-4 h-8 bg-[#2a2a3e] rounded-b-md ${isWalking ? 'animate-pulse' : ''}`}
                style={{ animationDuration: '0.2s', animationDelay: '0.1s' }} />
            </div>
            
            {/* Shoes */}
            <div className="flex justify-center gap-1 -mt-0.5">
              <div className="w-5 h-2 bg-[#333] rounded-md" />
              <div className="w-5 h-2 bg-[#333] rounded-md" />
            </div>
            
            {/* Shadow */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-2 bg-black/30 rounded-full blur-sm" />
          </div>
        </div>
        
        {/* Mood indicator */}
        <div className="absolute top-3 right-3 text-[10px] text-white/30 bg-white/5 rounded-full px-2 py-0.5">
          {mood === 'idle' && '😌 جاهز'}
          {mood === 'happy' && '😊 سعيد'}
          {mood === 'thinking' && '🤔 يفكر'}
          {mood === 'surprised' && '😮 متفاجئ'}
          {mood === 'talking' && '🗣️ يتكلم'}
          {mood === 'waving' && '👋 يلوّح'}
          {mood === 'sad' && '😔 حزين'}
        </div>

        {/* Tap to interact */}
        <button 
          onClick={() => {
            walkTo(Math.random() * 60 + 20);
            setMoodTemporary('waving', 2000);
            setIsBouncing(true);
            setBubbleText(['أهلاً! 😊', 'كيف حالك؟ 👋', 'اسألني شيء! 🤖', 'أنا هنا! ✨'][Math.floor(Math.random() * 4)]);
            setTimeout(() => setIsBouncing(false), 1500);
          }}
          className="absolute bottom-2 left-3 text-[9px] text-white/20 bg-white/5 rounded-full px-2 py-0.5"
        >
          👆 اضغط للتفاعل
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-[#737373]">اكتب رسالة وسيرد عليك المساعد! 🤖</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              msg.role === 'user' ? 'bg-[#0095f6]' : 'bg-[#262626]'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end">
            <div className="bg-[#262626] rounded-2xl px-4 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 bg-[#737373] rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-[#737373] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-1.5 h-1.5 bg-[#737373] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#262626] bg-black flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setSearchWeb(!searchWeb)}
            className={`text-[10px] px-2 py-1 rounded-full flex items-center gap-1 ${
              searchWeb ? 'bg-[#0095f6] text-white' : 'bg-[#262626] text-[#737373]'
            }`}>
            <Globe size={10} /> بحث الإنترنت
          </button>
        </div>
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="اكتب رسالة..." 
            className="flex-1 bg-[#262626] rounded-lg px-3 py-2 text-sm outline-none" />
          <button onClick={sendMessage} disabled={isLoading || !input.trim()}
            className="bg-[#0095f6] px-3 rounded-lg disabled:opacity-50">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
