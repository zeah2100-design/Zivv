'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, ArrowRight, Search } from 'lucide-react';

interface Friend {
  id: number;
  friendId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface Msg {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadFriends();
  }, [user]);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedFriend]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadFriends = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/friends?userId=${user.id}&status=accepted`);
      const data = await res.json();
      setFriends(data.friends || []);
    } catch {} finally { setIsLoading(false); }
  };

  const loadMessages = async () => {
    if (!user || !selectedFriend) return;
    try {
      const res = await fetch(`/api/messages?userId=${user.id}&friendId=${selectedFriend.friendId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
  };

  const sendMessage = async () => {
    if (!user || !selectedFriend || !newMsg.trim()) return;
    const content = newMsg;
    setNewMsg('');
    
    // Optimistic update
    setMessages(prev => [...prev, {
      id: Date.now(),
      senderId: user.id,
      receiverId: selectedFriend.friendId,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    }]);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, receiverId: selectedFriend.friendId, content }),
      });
    } catch {}
  };

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase()) ||
    f.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) {
    return <div className="h-full flex items-center justify-center pt-[82px] md:pt-0 pb-[60px] md:pb-0"><p className="text-[#737373]">سجل الدخول</p></div>;
  }

  // Conversation view
  if (selectedFriend) {
    return (
      <div className="flex flex-col pt-[82px] md:pt-0 pb-[60px] md:pb-0" style={{ height: '100dvh' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] bg-black flex-shrink-0">
          <button onClick={() => setSelectedFriend(null)} className="p-1"><ArrowRight size={20} /></button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#262626]">
            {selectedFriend.avatarUrl ? <img src={selectedFriend.avatarUrl} alt="" className="w-full h-full object-cover" /> :
              <div className="w-full h-full flex items-center justify-center text-xs font-bold">{selectedFriend.username[0].toUpperCase()}</div>}
          </div>
          <div>
            <p className="font-semibold text-sm">{selectedFriend.displayName || selectedFriend.username}</p>
            <p className="text-[10px] text-[#00a67e]">متصل</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#737373] text-sm">لا توجد رسائل بعد</p>
              <p className="text-[#737373] text-xs mt-1">ابدأ المحادثة!</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                msg.senderId === user.id ? 'bg-[#0095f6] text-white' : 'bg-[#262626]'
              }`}>
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-0.5 ${msg.senderId === user.id ? 'text-white/60' : 'text-[#737373]'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-[#262626] bg-black flex-shrink-0">
          <div className="flex gap-2">
            <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="اكتب رسالة..." className="flex-1 bg-[#262626] rounded-lg px-3 py-2 text-sm outline-none" autoFocus />
            <button onClick={sendMessage} disabled={!newMsg.trim()} className="bg-[#0095f6] px-3 rounded-lg disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Friends list
  return (
    <div className="h-full bg-black pt-[82px] md:pt-0 pb-[60px] md:pb-0 overflow-y-auto">
      <header className="sticky top-0 bg-black border-b border-[#262626] px-4 py-3 z-10">
        <h1 className="font-semibold text-center mb-3">الرسائل</h1>
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث..." className="w-full bg-[#262626] rounded-lg py-2 pr-10 pl-4 text-sm placeholder:text-[#737373] outline-none" />
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#737373] border-t-white rounded-full animate-spin" />
        </div>
      ) : filteredFriends.length > 0 ? (
        <div>
          {filteredFriends.map(friend => (
            <button key={friend.id} onClick={() => setSelectedFriend(friend)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#0a0a0a]">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#262626]">
                {friend.avatarUrl ? <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center font-semibold">{friend.username[0].toUpperCase()}</div>}
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-sm">{friend.displayName || friend.username}</p>
                <p className="text-xs text-[#737373]">اضغط لبدء المحادثة</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-[#737373] text-sm">أضف أصدقاء لبدء الدردشة</p>
        </div>
      )}
    </div>
  );
}
