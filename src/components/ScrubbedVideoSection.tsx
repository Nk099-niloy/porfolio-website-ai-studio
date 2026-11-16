import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrubbedVideoSectionProps {
  videoUrl: string;
  posterUrl: string | null;
  title: string;
  caption: string;
}

export function ScrubbedVideoSection({
  videoUrl,
  posterUrl,
  title,
  caption,
}: ScrubbedVideoSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setVideoFailed(false);
  }, [videoUrl]);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const bar = progressBarRef.current;
    if (!section || !video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let ctx: gsap.Context | null = null;

    const setupScrub = () => {
      const duration = video.duration;
      if (!duration || Number.isNaN(duration)) return;

      ctx?.revert();
      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 75%',
          end: 'bottom 25%',
          scrub: true,
          onUpdate: (self) => {
            if (video.readyState >= 2) {
              const targetTime = Math.min(duration - 0.02, Math.max(0, self.progress * duration));
              if (Math.abs(video.currentTime - targetTime) > 0.02) {
                video.currentTime = targetTime;
              }
            }
            if (bar) {
              bar.style.transform = `scaleX(${self.progress.toFixed(3)})`;
            }
          },
        });
      }, section);
    };

    if (video.readyState >= 1) {
      setupScrub();
    } else {
      video.addEventListener('loadedmetadata', setupScrub, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', setupScrub);
      ctx?.revert();
    };
  }, [videoUrl]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="video-reel-heading"
      className="border-t border-[var(--border)] bg-[var(--bg)]/95 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-8 md:flex-row md:items-end">
          <div>
            <span className="font-mono-tabular text-xs font-medium text-[var(--accent)]">
              Scroll-Scrubbed Reel
            </span>
            <h2
              id="video-reel-heading"
              className="var-weight-heading mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {title}
            </h2>
          </div>
          <p className="max-w-md text-sm text-[var(--ink-muted)]">{caption}</p>
        </div>

        <div className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0c0c0e]">
            {!videoFailed ? (
              <video
                ref={videoRef}
                src={videoUrl}
                poster={posterUrl || undefined}
                muted
                playsInline
                preload="auto"
                onError={() => setVideoFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : posterUrl ? (
              <img
                src={posterUrl}
                alt={title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[var(--ink-muted)]">
                {title}
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/10">
              <div
                ref={progressBarRef}
                className="h-full w-full origin-left"
                style={{ backgroundColor: 'var(--accent)', transform: 'scaleX(0)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
