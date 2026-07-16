import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, action, imageBase64 } = await request.json();
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    if (action === 'describe' && imageBase64) {
      // Use Groq vision model to describe/analyze image
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.2-90b-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt || 'صف هذه الصورة بالتفصيل بالعربي. ما الذي تراه فيها؟' },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
              ],
            },
          ],
          max_tokens: 500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const description = data.choices?.[0]?.message?.content || '';
        return NextResponse.json({ success: true, description });
      }
      return NextResponse.json({ error: 'فشل تحليل الصورة' }, { status: 500 });
    }

    if (action === 'edit' && imageBase64) {
      // Analyze image then suggest edits
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.2-90b-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: `المستخدم يريد تعديل هذه الصورة: "${prompt}". صف التعديلات المطلوبة بالتفصيل وكيف ستبدو الصورة بعد التعديل. أجب بالعربي.` },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
              ],
            },
          ],
          max_tokens: 500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const editDescription = data.choices?.[0]?.message?.content || '';
        return NextResponse.json({ success: true, editDescription });
      }
    }

    if (action === 'generate') {
      // Use Groq to create a creative description for the image
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'أنت فنان رقمي. المستخدم سيطلب منك صورة. اكتب وصفاً تفصيلياً إبداعياً للصورة كأنك ترسمها. أجب بالعربي.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 300,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const description = data.choices?.[0]?.message?.content || '';
        return NextResponse.json({ success: true, description });
      }
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (error) {
    console.error('AI Image error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
