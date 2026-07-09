'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Save } from 'lucide-react';

export default function TestDiaryEditor() {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/diary?dayId=99')
      .then((r) => r.json())
      .then((data) => {
        if (data?.content) setContent(data.content);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      const r = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId: 99, content }),
      });
      if (r.ok) {
        setMessage('Saved!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const d = await r.json();
        setMessage(d.error || 'Failed to save — are you logged in as admin?');
      }
    } catch {
      setMessage('Error saving');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-highland-purple" />
        <h3 className="font-display text-xl font-semibold text-slate-200">Trail Diary</h3>
        <span className="ml-auto text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">Test editor</span>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        placeholder="Write a test diary entry here..."
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-highland-purple text-sm resize-y"
      />
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-highland-purple hover:bg-highland-purple-dark disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save Diary'}
        </button>
        {message && (
          <span className={`text-sm ${message === 'Saved!' ? 'text-emerald-400' : 'text-red-400'}`}>
            {message}
          </span>
        )}
      </div>
      <p className="text-slate-600 text-xs mt-2">
        Must be logged into <a href="/admin" className="text-slate-500 hover:text-slate-400 underline">/admin</a> to save.
      </p>
    </div>
  );
}
