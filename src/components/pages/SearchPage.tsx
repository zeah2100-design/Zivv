'use client';

import { useState, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface SearchResult {
  users?: Array<{ id: number; username: string; displayName: string | null; avatarUrl: string | null; isGoldMember: boolean | null }>;
  posts?: Array<{ id: number; content: string | null; type: string; mediaUrl: string | null; username: string }>;
}

interface SearchPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export default function SearchPage({ onNavigate }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({});
  const [isSearching, setIsSearching] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!aiMode) {
      const timer = setTimeout(() => {
        if (query.trim()) performSearch();
        else setResults({});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [query, aiMode]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch {} finally { setIsSearching(false); }
  };

  const aiSearch = async () => {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `ابحث لي عن: ${query}`, searchWeb: true }),
      });
      const data = await res.json();
      setAiResult(data.response || 'لم أجد نتائج.');
    } catch {
      setAiResult('حدث خطأ.');
    } finally { setAiLoading(false); }
  };

  const handleSubmit = () => {
    if (aiMode) aiSearch();
    else performSearch();
  };

  return (
    <div className="h-full bg-black pt-[82px] md:pt-0 pb-[60px] md:pb-0 overflow-y-auto">
      <header className="sticky top-0 z-10 bg-black px-4 py-3 border-b border-[#262626]">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373]" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={aiMode ? 'اسأل الذكاء الاصطناعي...' : 'بحث عن أشخاص أو منشورات...'}
            className="w-full bg-[#262626] rounded-lg py-2.5 pr-10 pl-10 text-sm placeholder:text-[#737373] outline-none" autoFocus />
          {query && (
            <button onClick={() => { setQuery(''); setResults({}); setAiResult(''); }} className="absolute left-3 top-1/2 -translate-y-1/2">
              <X size={16} className="text-[#737373]" />
            </button>
          )}
        </div>

        {/* Toggle AI mode */}
        <div className="flex gap-2">
          <button onClick={() => { setAiMode(false); setAiResult(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${!aiMode ? 'bg-white text-black' : 'bg-[#262626] text-[#737373]'}`}>
            <Search size={14} /> بحث عادي
          </button>
          <button onClick={() => { setAiMode(true); setResults({}); }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${aiMode ? 'bg-[#0095f6] text-white' : 'bg-[#262626] text-[#737373]'}`}>
            <Sparkles size={14} /> بحث بالذكاء الاصطناعي
          </button>
        </div>
      </header>

      <div className="p-4">
        {/* AI Mode */}
        {aiMode ? (
          <div>
            {!query && !aiResult && (
              <div className="text-center py-12">
                <Sparkles size={40} className="text-[#262626] mx-auto mb-3" />
                <p className="text-sm text-[#737373]">اكتب سؤالك والذكاء الاصطناعي سيبحث لك</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {['ما هي البرمجة؟', 'أخبار التقنية', 'نصائح تصوير'].map(s => (
                    <button key={s} onClick={() => { setQuery(s); setTimeout(aiSearch, 100); }}
                      className="px-3 py-1.5 bg-[#262626] rounded-full text-xs text-[#737373]">{s}</button>
                  ))}
                </div>
              </div>
            )}

            {aiLoading && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#0095f6] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[#737373]">جاري البحث بالذكاء الاصطناعي...</span>
                </div>
              </div>
            )}

            {aiResult && (
              <div className="bg-[#111] border border-[#262626] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-[#0095f6]" />
                  <span className="text-xs text-[#0095f6] font-semibold">نتيجة الذكاء الاصطناعي</span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{aiResult}</p>
              </div>
            )}
          </div>
        ) : (
          /* Normal search */
          <div>
            {!query ? (
              <div>
                <p className="text-sm text-[#737373] mb-3">جرب البحث عن:</p>
                {['ahmed', 'sara', 'omar', 'برمجة'].map(s => (
                  <button key={s} onClick={() => setQuery(s)}
                    className="flex items-center gap-3 w-full py-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center">
                      <Search size={14} className="text-[#737373]" />
                    </div>
                    {s}
                  </button>
                ))}
              </div>
            ) : isSearching ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#737373] border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {results.users && results.users.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold mb-2">الحسابات</h2>
                    {results.users.map(u => (
                      <button key={u.id} onClick={() => onNavigate('profile', { viewUserId: u.id })}
                        className="flex items-center gap-3 w-full py-2">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-[#262626]">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                            <div className="w-full h-full flex items-center justify-center font-semibold">{u.username[0].toUpperCase()}</div>}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold">{u.username}</span>
                            {u.isGoldMember && <span className="text-[#0095f6] text-xs">✓</span>}
                          </div>
                          {u.displayName && <p className="text-xs text-[#737373]">{u.displayName}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.posts && results.posts.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold mb-2">المنشورات</h2>
                    <div className="grid grid-cols-3 gap-1">
                      {results.posts.filter(p => p.mediaUrl).map(p => (
                        <div key={p.id} className="aspect-square bg-[#262626]">
                          <img src={p.mediaUrl!} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    {results.posts.filter(p => !p.mediaUrl).map(p => (
                      <div key={p.id} className="py-2 border-b border-[#262626]">
                        <span className="text-xs text-[#737373]">{p.username}</span>
                        <p className="text-sm">{p.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {(!results.users?.length && !results.posts?.length) && (
                  <p className="text-center text-[#737373] text-sm py-8">لا توجد نتائج</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
