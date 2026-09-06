import { Video as VideoIcon } from 'lucide-react';
import { parseVideoUrl } from '@/lib/videoEmbed';

interface DayVideoProps {
  videoUrl: string | null;
}

export default function DayVideo({ videoUrl }: DayVideoProps) {
  if (!videoUrl) {
    return (
      <div className="glass-card rounded-xl p-6 text-center py-12 text-slate-600">
        <VideoIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No recap video yet</p>
        <p className="text-xs mt-1 text-slate-700">The day's video will appear here once uploaded</p>
      </div>
    );
  }

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
