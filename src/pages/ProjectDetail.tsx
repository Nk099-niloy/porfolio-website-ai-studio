import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { fetchPublicPortfolio, fetchPublicProjectById } from '../lib/api';
import type { ProjectItem } from '../types/portfolio';
import { CustomCursor } from '../components/CustomCursor';
import { MagneticControl } from '../components/MagneticButton';
import { Navbar } from '../components/Navbar';
import { ResultProgressRing } from '../components/NumberEffects';
import { SectionHeader } from '../components/TypographyEffects';

const DeviceMockup3D = lazy(() => import('../components/DeviceMockup3D'));

interface ProjectDetailProps {
  projectId: number;
  onNavigate: (path: string) => void;
}

export function ProjectDetail({ projectId, onNavigate }: ProjectDetailProps) {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [brandName, setBrandName] = useState('Niloy Kundu');
  const [accentColor, setAccentColor] = useState('#c8a253');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([fetchPublicProjectById(projectId), fetchPublicPortfolio()])
      .then(([projRes, portRes]) => {
        if (!active) return;
        setProject(projRes.project);
        setBrandName(portRes.profile.name);
        if (portRes.profile.accentColor) {
          setAccentColor(portRes.profile.accentColor);
          document.documentElement.style.setProperty('--accent', portRes.profile.accentColor);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Project could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <CustomCursor />
      <Navbar brandName={brandName} onNavigate={onNavigate} isSubPage />

      <main className="mx-auto max-w-6xl px-6 py-12 lg:px-10 lg:py-20">
        <div className="mb-10">
          <MagneticControl
            type="button"
            variant="outline"
            cursorLabel="Back"
            onClick={() => onNavigate('/')}
            className="px-5 py-2.5 text-xs font-semibold"
          >
            <ArrowLeft className="mr-2 inline h-3.5 w-3.5" aria-hidden="true" />
            Back to portfolio
          </MagneticControl>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="h-5 w-40 bg-white/10" />
            <div className="h-14 w-2/3 bg-white/10" />
            <div className="h-80 w-full bg-white/5" />
          </div>
        ) : error || !project ? (
          <div className="border border-[var(--border)] bg-[var(--surface)] p-10">
            <h1 className="font-display text-2xl font-bold">Case study unavailable</h1>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">{error || 'Project not found.'}</p>
          </div>
        ) : (
          <article className="space-y-16">
            {/* Case Study Hero */}
            <header className="grid grid-cols-1 gap-10 border-b border-[var(--border)] pb-12 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8 space-y-5">
                <div className="flex flex-wrap items-center gap-3 font-mono-tabular text-xs text-[var(--accent)]">
                  <span>{project.type}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[var(--ink-muted)]">
                    {project.mockupDevice === 'phone' ? 'Mobile System Mockup' : 'Desktop Platform Mockup'}
                  </span>
                </div>

                <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.75rem)] font-bold leading-[1.03] tracking-tight">
                  {project.title}
                </h1>

                <p className="max-w-2xl text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
                  {project.description}
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col items-start gap-4 lg:items-end">
                {project.demoUrl && (
                  <MagneticControl
                    asAnchor
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="primary"
                    showArrow
                    cursorLabel="Open"
                    className="px-6 py-3.5 text-sm font-semibold"
                  >
                    Launch live build
                  </MagneticControl>
                )}
              </div>
            </header>

            {/* Interactive 3D Device Mockup */}
            <section aria-label="Interactive 3D showcase">
              <div className="mb-4 flex items-center justify-between text-xs text-[var(--ink-muted)]">
                <span className="font-mono-tabular uppercase tracking-wider text-[var(--accent)]">
                  Interactive 3D Stage
                </span>
                <span>Move pointer to inspect {project.mockupDevice} view</span>
              </div>

              <Suspense
                fallback={
                  <div className="flex h-[360px] sm:h-[430px] w-full items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--ink-muted)]">
                    Loading 3D device showcase...
                  </div>
                }
              >
                <DeviceMockup3D
                  device={project.mockupDevice}
                  imageUrl={project.imageUrl}
                  title={project.title}
                  accentColor={accentColor}
                />
              </Suspense>
            </section>

            {/* Goal & Approach */}
            <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="border border-[var(--border)] bg-[var(--surface)] p-8">
                <SectionHeader indexLabel="01" title="Project Goal" />
                <p className="mt-6 text-[15px] leading-relaxed text-[var(--ink-muted)]">
                  {project.goal || project.description}
                </p>
              </div>

              <div className="border border-[var(--border)] bg-[var(--surface)] p-8">
                <SectionHeader indexLabel="02" title="System Approach" />
                <p className="mt-6 text-[15px] leading-relaxed text-[var(--ink-muted)]">
                  {project.approach}
                </p>
              </div>
            </section>

            {/* Results & Animated Progress Rings */}
            <section className="space-y-8 border-t border-[var(--border)] pt-12">
              <SectionHeader
                indexLabel="03"
                title="Measured Results"
                subtitle="Key outcomes and automated execution benchmarks."
              />

              {project.resultMetrics && project.resultMetrics.length > 0 && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {project.resultMetrics.map((metric, idx) => (
                    <ResultProgressRing
                      key={`${metric.label}-${idx}`}
                      label={metric.label}
                      value={metric.value}
                      suffix={metric.suffix}
                    />
                  ))}
                </div>
              )}

              {project.results && project.results.length > 0 && (
                <div className="border border-[var(--border)] bg-[var(--surface)] p-8">
                  <ul className="space-y-4">
                    {project.results.map((item, idx) => (
                      <li
                        key={idx}
                        className="grid grid-cols-[32px_1fr] gap-3 text-[15px] leading-relaxed text-[var(--ink-muted)]"
                      >
                        <span className="font-mono-tabular pt-0.5 text-xs font-semibold text-[var(--accent)]">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Technologies Stack */}
            <section className="border-t border-[var(--border)] pt-10">
              <h2 className="font-mono-tabular text-xs uppercase tracking-wider text-[var(--ink-muted)]">
                Architecture &amp; Stack
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {project.technologies.map((tech, idx) => (
                  <div
                    key={`${tech}-${idx}`}
                    className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--ink)]"
                  >
                    {tech}
                  </div>
                ))}
              </div>
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
