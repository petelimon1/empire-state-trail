'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MessageSquare, Send, User } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface Comment {
  id: string;
  day_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

interface CommentsProps {
  dayId: number;
}

const NAME_KEY = 'whw_commenter_name';

export default function Comments({ dayId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase =
    supabaseUrl && supabaseAnonKey
      ? createClient(supabaseUrl, supabaseAnonKey)
      : null;

  useEffect(() => {
    // Restore saved name
    const saved = localStorage.getItem(NAME_KEY);
    if (saved) setName(saved);

    if (!supabase) { setLoading(false); return; }

    // Fetch existing comments
    supabase
      .from('comments')
      .select('id, day_id, user_name, content, created_at')
      .eq('day_id', dayId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setComments(data || []);
        setLoading(false);
      });

    // Realtime: comments from other users/devices appear instantly
    // Deduplicates by ID so optimistic inserts don't appear twice
    const channel = supabase
      .channel(`comments-day-${dayId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `day_id=eq.${dayId}` },
        (payload) => {
          const incoming = payload.new as Comment;
          setComments((prev) =>
            prev.some((c) => c.id === incoming.id) ? prev : [incoming, ...prev]
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dayId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedComment = newComment.trim();
    if (!trimmedName || !trimmedComment) return;

    setSubmitting(true);
    setError(null);
    localStorage.setItem(NAME_KEY, trimmedName);

    try {
      const r = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, name: trimmedName, content: trimmedComment }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to post');
      // Immediately add to the list — don't wait for realtime
      setComments((prev) => [data as Comment, ...prev]);
      setNewComment('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!supabase) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-highland-purple" />
          Comments
        </h3>
        <p className="text-slate-500 text-sm">Comments require Supabase configuration.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="font-display text-xl font-semibold text-slate-200 mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-highland-purple" />
        Comments
        {comments.length > 0 && (
          <span className="text-sm font-normal text-slate-500 font-body ml-1">({comments.length})</span>
        )}
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={50}
          className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-highland-purple text-sm"
        />
        <div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Leave a comment..."
            rows={3}
            maxLength={500}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-highland-purple resize-none text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-600">{newComment.length}/500</span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim() || !name.trim()}
              className="flex items-center gap-2 bg-highland-purple hover:bg-highland-purple-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-32 rounded" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-slate-600">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <span className="text-slate-400 text-xs font-medium">
                  {comment.user_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-slate-300 text-sm">{comment.user_name}</span>
                  <span className="text-slate-600 text-xs">{formatRelativeTime(comment.created_at)}</span>
                </div>
                <p className="text-slate-400 text-sm mt-1 break-words">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
