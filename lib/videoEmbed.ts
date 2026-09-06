export interface ParsedVideo {
  provider: 'youtube' | 'vimeo';
  embedUrl: string;
}

// Normalize a YouTube or Vimeo share/watch URL into an embeddable iframe src.
export function parseVideoUrl(url: string): ParsedVideo | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, '');

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = u.searchParams.get('v');
    if (id) return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}` };

    const shortsMatch = u.pathname.match(/\/shorts\/([\w-]+)/);
    if (shortsMatch) return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}` };

    const embedMatch = u.pathname.match(/\/embed\/([\w-]+)/);
    if (embedMatch) return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${embedMatch[1]}` };

    return null;
  }

  if (host === 'youtu.be') {
    const id = u.pathname.slice(1);
    return id ? { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}` } : null;
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const match = u.pathname.match(/(\d+)/);
    return match ? { provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${match[1]}` } : null;
  }

  return null;
}
