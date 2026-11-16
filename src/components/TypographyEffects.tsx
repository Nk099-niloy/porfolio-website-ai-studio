import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface KineticHeroHeadlineProps {
  lines: string[];
}

export function KineticHeroHeadline({ lines }: KineticHeroHeadlineProps) {
  const rootRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chars = Array.from(el.querySelectorAll<HTMLElement>('[data-hero-char]'));

    if (!reducedMotion) {
      gsap.fromTo(
        chars,
        { yPercent: 115, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.78,
          stagger: 0.022,
          ease: 'power3.out',
          delay: 0.08,
        },
      );
    }

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer || reducedMotion) return;

    const onMove = (e: MouseEvent) => {
      for (const charEl of chars) {
        const rect = charEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 130) {
          const factor = (1 - dist / 130) * 7;
          const ox = (-dx / (dist || 1)) * factor;
          const oy = (-dy / (dist || 1)) * factor;
          charEl.style.transform = `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0)`;
          charEl.style.fontVariationSettings = `"wght" ${Math.round(700 + (1 - dist / 130) * 100)}`;
        } else {
          charEl.style.transform = 'translate3d(0, 0, 0)';
          charEl.style.fontVariationSettings = '"wght" 700';
        }
      }
    };

    const onLeave = () => {
      for (const charEl of chars) {
        charEl.style.transform = 'translate3d(0, 0, 0)';
        charEl.style.fontVariationSettings = '"wght" 700';
      }
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [lines]);

  return (
    <h1
      ref={rootRef}
      className="font-display text-[clamp(2.65rem,5.4vw,4.85rem)] font-bold leading-[0.98] tracking-tight text-[var(--ink)]"
      style={{ textWrap: 'balance' }}
    >
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} className="block overflow-hidden py-1">
          {Array.from(line).map((char, charIdx) => (
            <span
              key={`${lineIdx}-${charIdx}`}
              data-hero-char
              className="inline-block transition-[transform,font-variation-settings] duration-150 ease-out will-change-transform"
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}

interface SectionHeaderProps {
  indexLabel: string;
  title: string;
  subtitle?: string;
  id?: string;
}

export function SectionHeader({ indexLabel, title, subtitle, id }: SectionHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    const lineEl = lineRef.current;
    if (!el || !lineEl) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const titleLines = el.querySelectorAll('[data-title-line]');
      gsap.fromTo(
        titleLines,
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            once: true,
          },
        },
      );

      gsap.fromTo(
        lineEl,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            once: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [title]);

  const words = title.split(' ');
  const mid = Math.ceil(words.length / 2);
  const line1 = words.length > 2 ? words.slice(0, mid).join(' ') : title;
  const line2 = words.length > 2 ? words.slice(mid).join(' ') : '';

  return (
    <div ref={containerRef} className="space-y-3">
      <span className="font-mono-tabular text-xs font-medium text-[var(--accent)]">{indexLabel}</span>
      <h2
        id={id}
        className="var-weight-heading font-display text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl"
      >
        <span className="block overflow-hidden">
          <span data-title-line className="inline-block">
            {line1}
          </span>
        </span>
        {line2 && (
          <span className="block overflow-hidden">
            <span data-title-line className="inline-block">
              {line2}
            </span>
          </span>
        )}
      </h2>
      <div
        ref={lineRef}
        className="h-px w-20 origin-left"
        style={{ backgroundColor: 'var(--accent)' }}
        aria-hidden="true"
      />
      {subtitle && <p className="max-w-md pt-1 text-sm text-[var(--ink-muted)]">{subtitle}</p>}
    </div>
  );
}

interface ScrollRevealParagraphProps {
  text: string;
  className?: string;
}

export function ScrollRevealParagraph({ text, className = '' }: ScrollRevealParagraphProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const words = el.querySelectorAll<HTMLElement>('[data-word]');
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { opacity: 0.22 },
        {
          opacity: 1,
          stagger: 0.04,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 84%',
            end: 'bottom 52%',
            scrub: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [text]);

  const tokens = text.split(/\s+/).filter(Boolean);

  return (
    <p ref={ref} className={className}>
      {tokens.map((word, idx) => (
        <span key={idx} data-word className="inline-block mr-[0.28em]">
          {word}
        </span>
      ))}
    </p>
  );
}

interface OutlinedScrollTextProps {
  text: string;
}

export function OutlinedScrollText({ text }: OutlinedScrollTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const fill = fillRef.current;
    if (!container || !fill) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      fill.style.clipPath = 'inset(0 0% 0 0)';
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        fill,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
            end: 'top 35%',
            scrub: true,
          },
        },
      );
    }, container);

    return () => ctx.revert();
  }, [text]);

  return (
    <div ref={containerRef} className="relative overflow-hidden py-8 select-none">
      <div className="relative font-display text-[clamp(2rem,5.2vw,4.5rem)] font-extrabold leading-none tracking-tight">
        <span
          aria-hidden="true"
          className="block"
          style={{
            color: 'transparent',
            WebkitTextStroke: '1px rgba(200, 162, 83, 0.42)',
          }}
        >
          {text}
        </span>
        <span
          ref={fillRef}
          className="absolute inset-0 block"
          style={{
            color: 'var(--accent)',
            clipPath: 'inset(0 100% 0 0)',
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

interface VelocityMarqueeProps {
  items: string[];
}

export function VelocityMarquee({ items }: VelocityMarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let xPercent = 0;
    let currentSkew = 0;

    const tickerFn = (_time: number, deltaTime: number) => {
      const dt = Math.min(deltaTime, 50) / 1000;
      xPercent -= dt * 3.2;
      if (xPercent <= -50) xPercent = 0;
      currentSkew += (0 - currentSkew) * 0.08;
      track.style.transform = `translate3d(${xPercent}%, 0, 0) skewX(${currentSkew.toFixed(2)}deg)`;
    };

    gsap.ticker.add(tickerFn);

    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const velocity = self.getVelocity();
        const targetSkew = gsap.utils.clamp(-8, 8, velocity / 320);
        currentSkew = targetSkew;
      },
    });

    return () => {
      gsap.ticker.remove(tickerFn);
      st.kill();
    };
  }, [items]);

  const joined = [...items, ...items];

  return (
    <div
      aria-label="Core capabilities marquee"
      className="overflow-hidden border-y border-[var(--border)] bg-[var(--surface)] py-5"
    >
      <div ref={trackRef} className="flex w-max items-center gap-8 will-change-transform">
        {joined.map((item, idx) => (
          <div key={`${item}-${idx}`} className="flex items-center gap-8 whitespace-nowrap">
            <span className="font-display text-lg font-semibold tracking-tight text-[var(--ink)] sm:text-xl">
              {item}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
}
