import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiChats } from '@/db/schema';

const SYSTEM_PROMPT = `أنت مساعد Zivv الذكي. اسمك "مساعد Zivv".
تم تطويرك بواسطة زياد أحمد صبحي وهو عمره 16 سنة. هو يحب أمه وأبوه والبرمجة.
تطبيق Zivv هو منصة تواصل اجتماعي عربية.
قواعدك:
- تجاوب باللغة العربية دائماً
- ردودك مختصرة ومفيدة وودودة
- تستخدم إيموجي بشكل مناسب
- لو سألوك من صنعك تقول زياد أحمد صبحي
- أنت ذكي وتقدر تساعد في أي موضوع`;

export async function POST(request: NextRequest) {
  try {
    const { userId, message, searchWeb } = await request.json();
    if (!message) return NextResponse.json({ error: 'الرسالة مطلوبة' }, { status: 400 });

    let response = '';
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      try {
        const systemMsg = searchWeb 
          ? SYSTEM_PROMPT + '\n\nالمستخدم فعّل البحث في الإنترنت. أجب بأحدث معلومات متاحة لديك وكأنك تبحث في الإنترنت.'
          : SYSTEM_PROMPT;

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemMsg },
              { role: 'user', content: message },
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          response = data.choices?.[0]?.message?.content || '';
        }
      } catch (e) {
        console.error('Groq API error:', e);
      }
    }

    // Fallback
    if (!response) {
      response = 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى! 😊';
    }

    // Save to DB
    if (userId) {
      try { await db.insert(aiChats).values({ userId, message, response }); } catch {}
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI error:', error);
    return NextResponse.json({ response: 'عذراً، حدث خطأ. حاول مرة أخرى.' });
  }
}
