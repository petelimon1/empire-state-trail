import { parseVideoUrl } from '@/lib/videoEmbed';

interface DayVideoProps {
  videoUrl: string | null;
}

// Rendered only when a video is set — the caller gates on videoUrl so days
// without one don't show empty placeholder space up front on the page.
export default function DayVideo({ videoUrl }: DayVideoProps) {
  if (!videoUrl) return null;

  const parsed = parseVideoUrl(videoUrl);
  if (!parsed) {
    return (
      <div className="glass-card rounded-xl p-5">
        <p className="text-red-400 text-sm">Couldn't recognize that video link as YouTube or Vimeo.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="aspect-video bg-black">
        <iframe
          src={parsed.embedUrl}
          title="Day recap video"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
