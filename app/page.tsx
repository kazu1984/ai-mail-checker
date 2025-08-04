'use client';
import styles from './page.module.css';
import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState('');
  const [tone, setTone] = useState('superior');
  const [useSama, setUseSama] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    setResult('');
    const res = await fetch('/api/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, tone, useSama }),
    });
    const data = await res.json();
    setResult(data.result);
    setLoading(false);
  };

  const handleCopy = async () => {
    const splitIndex = result.indexOf('---\n');
    const copyText = splitIndex !== -1 ? result.slice(splitIndex + 4).trim() : result;

    try {
      await navigator.clipboard.writeText(copyText);
      alert('添削済みの本文をコピーしました');
    } catch (err) {
      alert('コピーに失敗しました');
      console.error('コピーエラー:', err);
    }
  };

  // 表記ゆれと添削済み本文に分割
  const splitIndex = result.indexOf('---\n');
  const yureWarning = splitIndex !== -1 ? result.slice(0, splitIndex).trim() : '';
  const fixedBody = splitIndex !== -1 ? result.slice(splitIndex + 4).trim() : result;

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>AIメールチェック</h1>

      <textarea
        className={styles.textarea}
        placeholder="ここにメール本文を入力してください"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <div className={styles.radioGroup}>
        <label>
          <input
            type="radio"
            name="tone"
            value="superior"
            checked={tone === 'superior'}
            onChange={() => setTone('superior')}
          />
          上司
        </label>
        <label>
          <input
            type="radio"
            name="tone"
            value="colleague"
            checked={tone === 'colleague'}
            onChange={() => setTone('colleague')}
          />
          同僚
        </label>
        <label>
          <input
            type="radio"
            name="tone"
            value="external"
            checked={tone === 'external'}
            onChange={() => setTone('external')}
          />
          外部
        </label>
      </div>

      {tone === 'superior' && (
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={useSama}
            onChange={(e) => setUseSama(e.target.checked)}
          />
          名前に「様」をつける
        </label>
      )}

      <button
        className={styles.button}
        onClick={handleCheck}
        disabled={loading}
      >
        {loading ? 'チェック中...' : 'チェック'}
      </button>

      {loading && <p className={styles.loadingMessage}>🕒 AIチェック中です…</p>}

      {result && (
        <div className={styles.resultBox}>
          {yureWarning && (
            <div className={styles.warningBox}>
              <pre>{yureWarning}</pre>
            </div>
          )}
          <pre>{fixedBody}</pre>
          <button className={styles.copyButton} onClick={handleCopy}>
            本文のみコピー
          </button>
        </div>
      )}
    </main>
  );
}
