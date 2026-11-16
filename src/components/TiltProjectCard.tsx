import { useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { ProjectItem } from '../types/portfolio';

interface TiltProjectCardProps {
  project: ProjectItem;
  index: number;
  onOpenDetail: (id: number) => void;
}

export function TiltProjectCard({ project, index, onOpenDetail }: TiltProjectCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, hovering: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * 9;
    const ry = (px - 0.5) * 9;

    setTilt({
      rx,
      ry,
      gx: px * 100,
      gy: py * 100,
      hovering: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, hovering: false });
  };

  return (
    <article
      ref={cardRef}
      data-reveal
      data-cursor-label="View"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpenDetail(project.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(project.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View case study: ${project.title}`}
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden border border-[var(--border)] bg-[var(--surface)] transition-[border-color,transform] duration-200 ease-out hover:border-[var(--accent)]"
      style={{
        transform: tilt.hovering
          ? `perspective(950px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateY(-2px)`
          : 'perspective(950px) rotateX(0deg) rotateY(0deg)',
      }}
    >
      {/* Subtle 3D specular glare layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
        style={{
          opacity: tilt.hovering ? 1 : 0,
          background: `radial-gradient(420px circle at ${tilt.gx}% ${tilt.gy}%, rgba(230, 200, 120, 0.14), transparent 65%)`,
        }}
      />

      <div className="relative z-0">
        {project.imageUrl ? (
          <div className="aspect-[16/9] w-full overflow-hidden border-b border-[var(--border)] bg-[var(--surface-elevated)]">
            <img
              src={project.imageUrl}
              alt={project.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] w-full overflow-hidden border-b border-[var(--border)] bg-[var(--surface-elevated)] p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between font-mono-tabular text-xs text-[var(--ink-muted)]">
              <span>{project.mockupDevice === 'phone' ? 'Mobile System' : 'Web Architecture'}</span>
              <span className="text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {project.resultMetrics.slice(0, 3).map((metric, mIdx) => (
                <div key={mIdx} className="border border-[var(--border)] bg-[var(--bg)]/60 p-3">
                  <p className="font-mono-tabular text-base font-semibold text-[var(--accent)]">
                    {metric.value}
                    {metric.suffix}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-[var(--ink-muted)]">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-8">
          <div className="flex items-center justify-between gap-4 text-xs text-[var(--ink-muted)]">
            <span>{project.type}</span>
            <span className="font-mono-tabular text-[var(--accent)]">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>

          <h3 className="var-weight-heading mt-3 font-display text-2xl font-bold leading-snug tracking-tight text-[var(--ink)]">
            {project.title}
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
            {project.description}
          </p>
        </div>
      </div>

      <div className="relative z-0 border-t border-[var(--border)] px-8 py-5 flex items-center justify-between gap-4">
        <p className="font-mono-tabular truncate text-xs text-[var(--ink-muted)]">
          {project.technologies.join(' · ')}
        </p>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] whitespace-nowrap shrink-0">
          <span>Case study</span>
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
