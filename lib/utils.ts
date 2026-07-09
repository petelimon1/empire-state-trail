import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr + 'T12:00:00Z');
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z');
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function getDayEmoji(dayId: number): string {
  const emojis = ['🏔️', '🌲', '⛺', '🦌', '🏕️', '🌊', '🎉'];
  return emojis[dayId - 1] || '🥾';
}

export function getAccommodationIcon(name: string): string {
  if (name.toLowerCase().includes('camp') || name.toLowerCase().includes('wild')) return '⛺';
  if (name.toLowerCase().includes('bunkhouse') || name.toLowerCase().includes('hostel')) return '🛏️';
  if (name.toLowerCase().includes('hotel')) return '🏨';
  if (name.toLowerCase().includes('guest') || name.toLowerCase().includes('b&b') || name.toLowerCase().includes('bnb')) return '🏠';
  return '🏠';
}
