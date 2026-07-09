'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Clock } from 'lucide-react';
import { DiaryEntry as DiaryEntryType } from '@/types';
import { formatDate } from '@/lib/utils';

interface DiaryEntryProps {
  dayId: number;
}

export default function DiaryEntry({ dayId }: DiaryEntryProps) {
  const [entry, setEntry] = useState<DiaryEntryType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/diary?dayId=${dayId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setEntry(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dayId]);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6 space-y-3">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="skeleton h-3 w-32 rounded" />
        <div className="space-y-2 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`skeleton h-3 rounded ${i === 4 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-highland-purple" />
        <h3 className="font-display text-xl font-semibold text-slate-200">Trail Diary</h3>
      </div>

      {entry ? (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Written {new Date(entry.updated_at).toLocaleString('en-US', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/New_York',
              })} (Eastern time)
            </span>
          </div>
          <div
            className="prose-highland"
            dangerouslySetInnerHTML={{
              __html: entry.content
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br/>')
                .replace(/^/, '<p>')
                .replace(/$/, '</p>'),
            }}
          />
        </div>
      ) : (
        <div className="py-8 text-center">
          <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Diary entry coming soon...</p>
          <p className="text-slate-600 text-xs mt-1">
            Pete will write about this day's adventure here.
          </p>
        </div>
      )}
    </div>
  );
}
