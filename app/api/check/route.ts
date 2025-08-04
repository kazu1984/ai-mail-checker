import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { kanjiPairs } from '@/app/utils/kanjiPairs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, tone, useSama } = body;

    // 表記ゆれチェック（例：齋藤 vs 斉藤）
    const yureList = kanjiPairs.filter(([kanji1, kanji2]: [string, string]) =>
      message.includes(kanji1) && message.includes(kanji2)
    );

    let yureWarning = '';
    if (yureList.length > 0) {
      const pairs = yureList.map(([a, b]: [string, string]) => `「${a}」と「${b}」`).join('、');
      yureWarning = `⚠ 表記ゆれ検出: ${pairs} が混在しています\n\n---\n`;
    }

    // トーン別スタイルルール
    let styleNote = '';
    if (tone === 'superior') {
      styleNote = `
※名前に「様」は${useSama ? '必要' : '不要'}です。
※上司に対して、拝啓～敬具等は必要ありません。
※時候の挨拶（例：時下ますますご清栄のことと〜）は不要です。
※件名の提案や追加はしないでください。
※以下のような手紙的な定型文は使わないでください：
- 件名（Subject: 〜など）
- 拝啓・敬具
※宛名（例：「〇〇様」）の後に「、」などの句読点は付けないでください。
※宛名をこちらが入力していない場合は、自動的に追加しないでください。
※文末に適切なあいさつ（例：「以上、よろしくお願いいたします。」など）がない場合は自然な形で補完してください。
※すでに丁寧な文末で終わっている場合はそのまま残してください。
`;
    } else if (tone === 'colleague') {
      styleNote = `
※名前に「様」は${useSama ? '必要' : '不要'}です。
※社内向けのため、時候の挨拶（例：時下ますますご清栄のことと〜）は不要です。
※件名の提案や追加はしないでください。
※以下のような手紙的な定型文は使わないでください：
- 件名（Subject: 〜など）
- 拝啓・敬具
※宛名（例：「〇〇様」）の後に「、」などの句読点は付けないでください。
※宛名をこちらが入力していない場合は、自動的に追加しないでください。
※文末に適切なあいさつ（例：「以上、よろしくお願いいたします。」など）がない場合は自然な形で補完してください。
※すでに丁寧な文末で終わっている場合はそのまま残してください。
`;
    } else if (tone === 'external') {
      styleNote = `
※名前に「様」は${useSama ? '必要' : '不要'}です。
※件名の提案や追加はしないでください。
※外部向けの場合、以下のルールを守ってください：
- 時候の挨拶（例：時下ますますご清栄のことと〜）は必要に応じて含めても構いません。
- 「拝啓」「敬具」などの定型文は、こちらの本文に含まれていた場合のみ残し、新たに追加しないでください。
※宛名（例：「〇〇様」）の後に「、」などの句読点は付けないでください。
※宛名をこちらが入力していない場合は、自動的に追加しないでください。
※文末に適切なあいさつ（例：「以上、よろしくお願いいたします。」など）がない場合は自然な形で補完してください。
※すでに丁寧な文末で終わっている場合はそのまま残してください。
`;
    }

    const prompt = `
あなたはメールの文章チェックをするアシスタントです。
文体は「${tone === 'superior' ? '上司' : tone === 'colleague' ? '同僚' : '外部の人'}」向けに調整してください。
${styleNote}

以下が本文です：

${message}

上記の文章に対して：
・誤字脱字
・敬語の適切さ
・失礼がないか
をチェックし、必要なら添削したメールを提案してください。
`;

    const model = tone === 'external' ? 'gpt-4' : 'gpt-4-turbo';

    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });


    const aiReply = response.choices[0]?.message?.content || 'AI応答が取得できませんでした。';
    return NextResponse.json({ result: yureWarning + aiReply });

  } catch (error) {
    console.error('❌ OpenAI API 呼び出し失敗:', error);
    return NextResponse.json({ result: 'エラーが発生しました。' }, { status: 500 });
  }
}
