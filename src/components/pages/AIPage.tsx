'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Globe } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', content: 'مرحباً! أنا مساعد Zivv 🤖\nاسألني أي شيء!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchWeb, setSearchWeb] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: prev.length, role: 'user', content: input }]);
    const msg = input;
    setInput('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, message: msg, searchWeb }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: prev.length, role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { id: prev.length, role: 'assistant', content: 'حدث خطأ.' }]);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col pt-[82px] md:pt-0 pb-[60px] md:pb-0" style={{ height: '100dvh' }}>
      <div className="bg-black border-b border-[#262626] px-4 py-3 flex-shrink-0">
        <h1 className="text-base font-semibold text-center">الذكاء الاصطناعي 🤖</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-[#0095f6]' : 'bg-[#262626]'}`}>
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
      <div className="p-3 border-t border-[#262626] bg-black flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setSearchWeb(!searchWeb)}
            className={`text-[10px] px-2 py-1 rounded-full flex items-center gap-1 ${searchWeb ? 'bg-[#0095f6] text-white' : 'bg-[#262626] text-[#737373]'}`}>
            <Globe size={10} /> بحث الإنترنت
          </button>
        </div>
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="اكتب رسالة..." className="flex-1 bg-[#262626] rounded-lg px-3 py-2 text-sm outline-none" />
          <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="bg-[#0095f6] px-3 rounded-lg disabled:opacity-50">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
