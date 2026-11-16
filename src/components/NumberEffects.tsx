import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
}

export function AnimatedCounter({ value, suffix = '' }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<number>(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setDisplay(value);
      return;
    }

    setDisplay(0);
    const obj = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: value,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
        onUpdate: () => {
          setDisplay(Math.round(obj.val));
        },
      });
    }, el);

    return () => ctx.revert();
  }, [value]);

  return (
    <span ref={ref} className="font-mono-tabular tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

interface OdometerNumberProps {
  value: number;
  suffix?: string;
}

export function OdometerNumber({ value, suffix = '' }: OdometerNumberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);
  const digits = String(Math.max(0, Math.round(value))).split('');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setTriggered(true);
      return;
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => setTriggered(true),
    });

    return () => st.kill();
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="inline-flex items-baseline font-display font-bold tabular-nums leading-none"
      aria-label={`${value}${suffix}`}
    >
      {digits.map((digitChar, idx) => {
        const digitNum = Number(digitChar);
        const offsetPercent = triggered ? -(digitNum * 10) : 0;
        return (
          <span
            key={idx}
            aria-hidden="true"
            className="relative inline-block h-[1em] w-[0.65em] overflow-hidden align-top"
          >
            <span
              className="block transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: `translateY(${offsetPercent}%)`,
                transitionDelay: `${idx * 70}ms`,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <span key={n} className="block h-[1em] leading-[1em] text-center">
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
      {suffix && (
        <span aria-hidden="true" className="ml-0.5 text-[var(--accent)]">
          {suffix}
        </span>
      )}
    </div>
  );
}

interface SkillProgressBarProps {
  name: string;
  level: number;
  index: number;
}

export function SkillProgressBar({ name, level, index }: SkillProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const fill = fillRef.current;
    if (!bar || !fill) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      fill.style.transform = `scaleX(${level / 100})`;
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        fill,
        { scaleX: 0 },
        {
          scaleX: level / 100,
          duration: 0.9,
          delay: (index % 5) * 0.06,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: bar,
            start: 'top 90%',
            once: true,
          },
        },
      );
    }, bar);

    return () => ctx.revert();
  }, [level, index]);

  return (
    <div ref={barRef} className="py-3">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium text-[var(--ink)]">{name}</span>
        <span className="font-mono-tabular text-xs text-[var(--accent)]">
          <AnimatedCounter value={level} suffix="%" />
        </span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden bg-white/10">
        <div
          ref={fillRef}
          className="h-full w-full origin-left"
          style={{ backgroundColor: 'var(--accent)', transform: 'scaleX(0)' }}
        />
      </div>
    </div>
  );
}

interface ResultProgressRingProps {
  label: string;
  value: number;
  suffix?: string;
}

export function ResultProgressRing({ label, value, suffix = '%' }: ResultProgressRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, value));
  const targetOffset = circumference * (1 - clampedPct / 100);

  useEffect(() => {
    const container = containerRef.current;
    const circle = circleRef.current;
    if (!container || !circle) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      circle.style.strokeDashoffset = String(targetOffset);
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        circle,
        { strokeDashoffset: circumference },
        {
          strokeDashoffset: targetOffset,
          duration: 1.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 88%',
            once: true,
          },
        },
      );
    }, container);

    return () => ctx.revert();
  }, [circumference, targetOffset]);

  return (
    <div ref={containerRef} className="flex items-center gap-4 border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="rgba(245,243,238,0.1)"
            strokeWidth="3.5"
          />
          <circle
            ref={circleRef}
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="butt"
          />
        </svg>
        <span className="absolute font-mono-tabular text-sm font-semibold text-[var(--ink)]">
          <AnimatedCounter value={value} suffix={suffix} />
        </span>
      </div>
      <p className="text-sm font-medium text-[var(--ink)]">{label}</p>
    </div>
  );
}
