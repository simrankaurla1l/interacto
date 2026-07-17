const items = [
  'AI-Generated Content',
  'Real-Time Sync',
  'Players Join With No Signup',
  'Live Leaderboards',
  'Shareable Links',
  'Instant Results'
];

export default function Marquee() {
  const track = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-slate-100 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
      <div className="flex w-max animate-marquee gap-10 [animation-play-state:running] hover:[animation-play-state:paused]">
        {track.map((label, index) => (
          <span key={`${label}-${index}`} className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gradient-to-br from-orange-400 to-amber-400" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
