import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { z } from 'zod';
import { fetchPublicPortfolio, submitContactMessage } from '../lib/api';
import type { PortfolioProfile, ProjectItem } from '../types/portfolio';
import type { ScrollChoreographyState } from '../components/HeroScene3D';
import { CustomCursor } from '../components/CustomCursor';
import { MagneticControl } from '../components/MagneticButton';
import { Navbar } from '../components/Navbar';
import { AnimatedCounter, OdometerNumber, SkillProgressBar } from '../components/NumberEffects';
import { ScrubbedVideoSection } from '../components/ScrubbedVideoSection';
import { TiltProjectCard } from '../components/TiltProjectCard';
import {
  KineticHeroHeadline,
  OutlinedScrollText,
  ScrollRevealParagraph,
  SectionHeader,
  VelocityMarquee,
} from '../components/TypographyEffects';
import { WorkflowFallback2D } from '../components/WorkflowFallback2D';

const HeroScene3D = lazy(() => import('../components/HeroScene3D'));

gsap.registerPlugin(ScrollTrigger);

const contactClientSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name (at least 2 characters).').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(160),
  subject: z.string().trim().min(2, 'Please enter a subject.').max(180),
  message: z.string().trim().min(10, 'Message must be at least 10 characters long.').max(4000),
});

function formatIndex(idx: number): string {
  return String(idx + 1).padStart(2, '0');
}

interface PublicPortfolioProps {
  onNavigate: (path: string) => void;
}

export function PublicPortfolio({ onNavigate }: PublicPortfolioProps) {
  const [profile, setProfile] = useState<PortfolioProfile | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [honeypotWebsite, setHoneypotWebsite] = useState('');
  const [formLoadedAt, setFormLoadedAt] = useState<number>(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [copiedEmail, setCopiedEmail] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const scrollStateRef = useRef<ScrollChoreographyState>({
    progress: 0,
    sectionIndex: 0,
    mouseX: 0,
    mouseY: 0,
  });

  const loadPortfolio = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchPublicPortfolio();
      setProfile(data.profile);
      setProjects(data.projects);
      if (data.profile.accentColor) {
        document.documentElement.style.setProperty('--accent', data.profile.accentColor);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load portfolio data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      scrollStateRef.current.mouseX = nx;
      scrollStateRef.current.mouseY = ny;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    if (loading || !profile || !pageRef.current) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: pageRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          scrollStateRef.current.progress = self.progress;
        },
      });

      const sectionSelectors = ['#top', '#about', '#services', '#skills', '#projects', '#contact'];
      sectionSelectors.forEach((selector, index) => {
        const el = document.querySelector(selector);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 45%',
          onEnter: () => {
            scrollStateRef.current.sectionIndex = index;
          },
          onEnterBack: () => {
            scrollStateRef.current.sectionIndex = index;
          },
        });
      });

      if (!reducedMotion) {
        const revealEls = gsap.utils.toArray<HTMLElement>('[data-reveal]');
        revealEls.forEach((el) => {
          gsap.fromTo(
            el,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                once: true,
              },
            },
          );
        });

        // Staggered entrance for Key Stats
        const statCards = gsap.utils.toArray<HTMLElement>('[data-stat-card]');
        if (statCards.length > 0) {
          gsap.fromTo(
            statCards,
            { y: 26, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              stagger: 0.12,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: statCards[0],
                start: 'top 88%',
                once: true,
              },
            },
          );
        }
      }
    }, pageRef);

    return () => ctx.revert();
  }, [loading, profile]);

  const marqueeItems = useMemo(() => {
    if (!profile) return [];
    const serviceTitles = profile.services.map((s) => s.title);
    const skillNames = profile.skillGroups.flatMap((g) => g.items.map((item) => item.name));
    return Array.from(new Set([...serviceTitles, ...skillNames]));
  }, [profile]);

  const handleCopyEmail = async () => {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(profile.contactEmail);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitFeedback(null);

    const parsed = contactClientSchema.safeParse({
      name: contactName,
      email: contactEmail,
      subject: contactSubject,
      message: contactMessage,
    });

    if (!parsed.success) {
      setSubmitFeedback({
        type: 'error',
        text: parsed.error.issues[0]?.message || 'Please check your form details.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitContactMessage({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        website: honeypotWebsite,
        formLoadedAt,
      });
      setSubmitFeedback({ type: 'success', text: result.message });
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
      setHoneypotWebsite('');
      setFormLoadedAt(Date.now());
    } catch (err) {
      setSubmitFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not send message. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10">
          <div className="h-4 w-36 bg-white/10" />
          <div className="mt-8 h-16 w-2/3 bg-white/10" />
          <div className="mt-4 h-6 w-1/2 bg-white/10" />
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--ink)]">
        <div className="max-w-md border border-[var(--border)] bg-[var(--surface)] p-8">
          <p className="font-mono-tabular text-xs uppercase tracking-wider text-[var(--ink-muted)]">
            Connection Notice
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold">Unable to load portfolio</h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">{loadError}</p>
          <button
            type="button"
            onClick={loadPortfolio}
            className="mt-6 border border-[var(--accent)] bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-[var(--accent-ink)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} id="top" className="relative min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <CustomCursor />

      <Suspense fallback={<WorkflowFallback2D accentColor={profile.accentColor} />}>
        <HeroScene3D
          scrollStateRef={scrollStateRef}
          accentColor={profile.accentColor}
          display3DName={profile.display3DName}
        />
      </Suspense>

      <div className="relative z-10">
        <Navbar brandName={profile.name} onNavigate={onNavigate} />

        <main>
          {/* 01 · HERO */}
          <section
            aria-label="Introduction"
            className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl flex-col justify-between px-6 pt-16 pb-10 lg:px-10 lg:pt-24 lg:pb-14"
          >
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7 bg-[var(--bg)]/70 py-4 backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none">
                <div className="flex items-center gap-3 text-xs font-medium text-[var(--ink-muted)]">
                  <span className="font-mono-tabular text-[var(--accent)]">01</span>
                  <span aria-hidden="true">—</span>
                  <span>{profile.location}</span>
                </div>

                <div className="mt-5">
                  <KineticHeroHeadline
                    lines={profile.heroLines.length > 0 ? profile.heroLines : [profile.name]}
                  />
                </div>

                <p className="mt-4 font-display text-xl font-semibold tracking-tight text-[var(--accent)] sm:text-2xl">
                  {profile.title}
                </p>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
                  {profile.heroIntro}
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-5">
                  <MagneticControl
                    asAnchor
                    href="#projects"
                    variant="primary"
                    showArrow
                    cursorLabel="View"
                    className="px-6 py-3.5 text-sm font-semibold whitespace-nowrap shrink-0"
                  >
                    Explore projects
                  </MagneticControl>

                  <MagneticControl
                    asAnchor
                    href="#contact"
                    variant="outline"
                    cursorLabel="Open"
                    className="px-6 py-3.5 text-sm font-semibold whitespace-nowrap shrink-0"
                  >
                    Get in touch
                  </MagneticControl>
                </div>
              </div>

              {/* Open right viewport for extruded gold 3D name, glass cards, rotating phone, analytics bars */}
              <div className="hidden lg:block lg:col-span-5" aria-hidden="true" />
            </div>

            <div className="mt-16 flex items-center justify-between border-t border-[var(--border)] pt-6 text-xs text-[var(--ink-muted)]">
              <a
                href="#about"
                className="var-weight-link inline-flex items-center gap-3 font-medium hover:text-[var(--ink)]"
              >
                <span className="inline-block h-5 w-px bg-[var(--accent)]" aria-hidden="true" />
                <span>{profile.scrollPrompt}</span>
              </a>
              <span className="font-mono-tabular hidden sm:inline">
                {projects.length} Case Studies · {profile.services.length} Services
              </span>
            </div>
          </section>

          {/* VELOCITY MARQUEE & SCROLL-FILLED STATEMENT */}
          <VelocityMarquee items={marqueeItems} />

          <section aria-label="Positioning statement" className="bg-[var(--bg)]/95 px-6 py-6 lg:px-10">
            <div className="mx-auto max-w-6xl">
              <OutlinedScrollText text={profile.marqueeStatement} />
            </div>
          </section>

          {/* 02 · ABOUT */}
          <section
            id="about"
            aria-labelledby="about-heading"
            className="border-t border-[var(--border)] bg-[var(--bg)]/92 py-20 lg:py-28"
          >
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                <div className="lg:col-span-4" data-reveal>
                  <SectionHeader
                    indexLabel="02"
                    title="About"
                    id="about-heading"
                    subtitle="Systems thinking applied to AI workflows, marketing analytics, and automation."
                  />

                  {profile.portraitUrl && (
                    <figure className="mt-8 max-w-[280px] border border-[var(--border)] bg-[var(--surface)] p-2">
                      <img
                        src={profile.portraitUrl}
                        alt={`${profile.name}, ${profile.title}`}
                        referrerPolicy="no-referrer"
                        className="aspect-square w-full object-cover object-top"
                      />
                      <figcaption className="mt-2 flex items-center justify-between px-1 pb-1 text-xs text-[var(--ink-muted)]">
                        <span>{profile.name}</span>
                        <span className="font-mono-tabular text-[var(--accent)]">
                          {profile.display3DName}
                        </span>
                      </figcaption>
                    </figure>
                  )}
                </div>

                <div className="lg:col-span-8 grid grid-cols-1 gap-10 md:grid-cols-2">
                  <div className="border-t border-[var(--border)] pt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                      Professional Summary
                    </h3>
                    <ScrollRevealParagraph
                      text={profile.aboutSummary}
                      className="mt-4 text-[16px] leading-relaxed text-[var(--ink)]"
                    />
                  </div>

                  <div className="border-t border-[var(--border)] pt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                      Career Objective
                    </h3>
                    <ScrollRevealParagraph
                      text={profile.careerObjective}
                      className="mt-4 text-[16px] leading-relaxed text-[var(--ink)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 03 · SERVICES */}
          <section
            id="services"
            aria-labelledby="services-heading"
            className="border-t border-[var(--border)] bg-[var(--surface)]/92 py-20 lg:py-28"
          >
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <div className="border-b border-[var(--border)] pb-8" data-reveal>
                <SectionHeader
                  indexLabel="03"
                  title="Core Services"
                  id="services-heading"
                  subtitle="Structured strategy, AI agent architecture, analytics telemetry, and team enablement."
                />
              </div>

              <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
                {profile.services.map((service, idx) => (
                  <article
                    key={service.id}
                    data-reveal
                    className="flex flex-col justify-between border border-[var(--border)] bg-[var(--bg)] p-8 transition-colors duration-200 hover:border-[var(--accent)]"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                        <h3 className="var-weight-heading font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
                          {service.title}
                        </h3>
                        <span className="font-mono-tabular text-xs font-medium text-[var(--accent)]">
                          {formatIndex(idx)}
                        </span>
                      </div>
                      <p className="mt-5 text-[15px] leading-relaxed text-[var(--ink-muted)]">
                        {service.summary}
                      </p>
                    </div>

                    {service.deliverables.length > 0 && (
                      <ul className="mt-6 space-y-2 border-t border-[var(--border)] pt-5 text-xs text-[var(--ink)]">
                        {service.deliverables.map((deliv, dIdx) => (
                          <li key={dIdx} className="flex items-baseline gap-3">
                            <span className="font-mono-tabular text-[var(--accent)]">
                              {formatIndex(dIdx)}
                            </span>
                            <span>{deliv}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* 04 · SKILLS */}
          <section
            id="skills"
            aria-labelledby="skills-heading"
            className="border-t border-[var(--border)] bg-[var(--bg)]/94 py-20 lg:py-28"
          >
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <div className="border-b border-[var(--border)] pb-8" data-reveal>
                <SectionHeader
                  indexLabel="04"
                  title="Technical Capabilities"
                  id="skills-heading"
                  subtitle="Self-drawing proficiency telemetry across AI workflows, web platforms, and creative production."
                />
              </div>

              <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                {profile.skillGroups.map((group, groupIndex) => (
                  <div
                    key={group.id}
                    data-reveal
                    className="flex flex-col border border-[var(--border)] bg-[var(--surface)] p-7"
                  >
                    <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-4">
                      <h3 className="var-weight-heading font-display text-lg font-bold tracking-tight text-[var(--ink)]">
                        {group.title}
                      </h3>
                      <span className="font-mono-tabular text-xs text-[var(--accent)]">
                        {formatIndex(groupIndex)}
                      </span>
                    </div>

                    <div className="mt-3 divide-y divide-[var(--border)]">
                      {group.items.map((skill, idx) => (
                        <SkillProgressBar
                          key={`${skill.name}-${idx}`}
                          name={skill.name}
                          level={skill.level}
                          index={idx}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 05 · STATS (Odometer & Eased Counters) */}
          {profile.stats.length > 0 && (
            <section
              id="stats"
              aria-labelledby="stats-heading"
              className="border-t border-[var(--border)] bg-[var(--surface)]/92 py-16 lg:py-24"
            >
              <div className="mx-auto max-w-6xl px-6 lg:px-10">
                <div className="mb-10" data-reveal>
                  <SectionHeader
                    indexLabel="05"
                    title="Operational Impact"
                    id="stats-heading"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {profile.stats.map((stat, idx) => (
                    <div
                      key={stat.id}
                      data-stat-card
                      className="border border-[var(--border)] bg-[var(--bg)] p-7"
                    >
                      <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">
                        {formatIndex(idx)}
                      </span>
                      <div className="mt-4 text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
                        {stat.useOdometer ? (
                          <OdometerNumber value={stat.value} suffix={stat.suffix} />
                        ) : (
                          <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                        )}
                      </div>
                      <p className="mt-3 text-sm text-[var(--ink-muted)]">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SCROLL-SCRUBBED 3D VIDEO SECTION */}
          <ScrubbedVideoSection
            videoUrl={profile.showcaseVideoUrl}
            posterUrl={profile.showcasePosterUrl}
            title={profile.showcaseTitle}
            caption={profile.showcaseCaption}
          />

          {/* 06 · EXPERIENCE TIMELINE */}
          <section
            id="experience"
            aria-labelledby="experience-heading"
            className="border-t border-[var(--border)] bg-[var(--bg)]/94 py-20 lg:py-28"
          >
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                <div className="lg:col-span-4" data-reveal>
                  <SectionHeader
                    indexLabel="06"
                    title="Experience Timeline"
                    id="experience-heading"
                    subtitle="Practical delivery of automated agents, digital funnels, and integrated API pipelines."
                  />
                </div>

                <div className="lg:col-span-8 relative space-y-10 pl-6 border-l border-[var(--border)]">
                  {profile.experience.map((exp, idx) => (
                    <article
                      key={exp.id}
                      data-reveal
                      className="relative border border-[var(--border)] bg-[var(--surface)] p-8"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -left-[31px] top-9 h-3 w-3 border border-[var(--accent)] bg-[var(--bg)]"
                      />

                      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-baseline">
                        <div>
                          <span className="font-mono-tabular text-xs text-[var(--accent)]">
                            {formatIndex(idx)} · {exp.duration}
                          </span>
                          <h3 className="var-weight-heading mt-1 font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
                            {exp.role}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--ink-muted)]">
                            {exp.context} · {exp.location}
                          </p>
                        </div>
                      </div>

                      <ul className="mt-6 space-y-4">
                        {exp.bullets.map((bullet, bIdx) => (
                          <li
                            key={bIdx}
                            className="grid grid-cols-[28px_1fr] gap-3 text-[15px] leading-relaxed text-[var(--ink-muted)]"
                          >
                            <span className="font-mono-tabular pt-0.5 text-xs font-medium text-[var(--accent)]">
                              {formatIndex(bIdx)}
                            </span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 07 · PROJECTS */}
          <section
            id="projects"
            aria-labelledby="projects-heading"
            className="border-t border-[var(--border)] bg-[var(--surface)]/92 py-20 lg:py-28"
          >
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <div className="border-b border-[var(--border)] pb-8" data-reveal>
                <SectionHeader
                  indexLabel="07"
                  title="Selected Projects"
                  id="projects-heading"
                  subtitle="Click any build to open its interactive 3D mockup case study, goals, approach, and metrics."
                />
              </div>

              {projects.length === 0 ? (
                <div className="mt-12 border border-[var(--border)] bg-[var(--bg)] p-10 text-center text-sm text-[var(--ink-muted)]">
                  No published projects yet.
                </div>
              ) : (
                <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
                  {projects.map((project, idx) => (
                    <TiltProjectCard
                      key={project.id}
                      project={project}
                      index={idx}
                      onOpenDetail={(id) => onNavigate(`/projects/${id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 08 · CERTIFICATIONS, EDUCATION & LANGUAGES */}
          <section
            id="education"
            aria-labelledby="education-heading"
            className="border-t border-[var(--border)] bg-[var(--bg)]/94 py-20 lg:py-28"
          >
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <div data-reveal>
                <SectionHeader
                  indexLabel="08"
                  title="Certifications & Education"
                  id="education-heading"
                />
              </div>

              {profile.certifications.length > 0 && (
                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2" data-reveal>
                  {profile.certifications.map((cert, idx) => (
                    <div
                      key={cert.id}
                      className="border border-[var(--border)] bg-[var(--surface)] p-6"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-mono-tabular text-xs text-[var(--accent)]">
                          {formatIndex(idx)} · {cert.year}
                        </span>
                        <span className="text-xs text-[var(--ink-muted)]">{cert.issuer}</span>
                      </div>
                      <h3 className="mt-3 font-display text-lg font-bold text-[var(--ink)]">
                        {cert.title}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--ink-muted)]">{cert.credentialNote}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-12">
                <div className="lg:col-span-6" data-reveal>
                  <h3 className="border-b border-[var(--border)] pb-3 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Academic Education
                  </h3>
                  <div className="divide-y divide-[var(--border)]">
                    {profile.education.map((edu) => (
                      <div key={edu.id} className="py-6">
                        <div className="flex items-baseline justify-between gap-4">
                          <h4 className="font-display text-lg font-bold text-[var(--ink)]">
                            {edu.degree}
                          </h4>
                          <span className="font-mono-tabular text-xs font-medium text-[var(--accent)] whitespace-nowrap shrink-0">
                            {edu.year}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-[var(--ink-muted)]">{edu.institution}</p>
                        <p className="font-mono-tabular mt-2 text-xs font-medium text-[var(--ink)]">
                          Result: {edu.grade}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-10" data-reveal>
                  <div>
                    <h3 className="border-b border-[var(--border)] pb-3 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                      Technical Training
                    </h3>
                    <div className="divide-y divide-[var(--border)]">
                      {profile.training.map((item, idx) => (
                        <div key={item.id} className="py-4 grid grid-cols-[28px_1fr] gap-3">
                          <span className="font-mono-tabular pt-1 text-xs text-[var(--accent)]">
                            {formatIndex(idx)}
                          </span>
                          <div>
                            <h4 className="font-display text-base font-bold text-[var(--ink)]">
                              {item.title}
                            </h4>
                            <p className="mt-1 text-sm text-[var(--ink-muted)]">{item.focus}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="border-b border-[var(--border)] pb-3 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                      Languages
                    </h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {profile.languages.map((lang) => (
                        <div
                          key={lang.id}
                          className="border border-[var(--border)] bg-[var(--surface)] px-5 py-4"
                        >
                          <p className="font-display text-base font-bold text-[var(--ink)]">
                            {lang.name}
                          </p>
                          <p className="font-mono-tabular mt-1 text-xs text-[var(--ink-muted)]">
                            {lang.proficiency}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 09 · TESTIMONIALS */}
          {profile.testimonials.length > 0 && (
            <section
              id="testimonials"
              aria-labelledby="testimonials-heading"
              className="border-t border-[var(--border)] bg-[var(--surface)]/92 py-20 lg:py-28"
            >
              <div className="mx-auto max-w-6xl px-6 lg:px-10">
                <div className="border-b border-[var(--border)] pb-8" data-reveal>
                  <SectionHeader
                    indexLabel="09"
                    title="Client Testimonials"
                    id="testimonials-heading"
                  />
                </div>

                <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
                  {profile.testimonials.map((t, idx) => (
                    <blockquote
                      key={t.id}
                      data-reveal
                      className="flex flex-col justify-between border border-[var(--border)] bg-[var(--bg)] p-8"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
                          <span className="font-mono-tabular text-[var(--accent)]">
                            {formatIndex(idx)}
                          </span>
                          <span className="font-mono-tabular">{t.outcome}</span>
                        </div>
                        <p className="mt-5 text-[16px] leading-relaxed text-[var(--ink)]">
                          &ldquo;{t.quote}&rdquo;
                        </p>
                      </div>

                      <footer className="mt-8 border-t border-[var(--border)] pt-4">
                        <p className="font-display text-sm font-bold text-[var(--ink)]">{t.name}</p>
                        <p className="text-xs text-[var(--ink-muted)]">
                          {t.role} · {t.organization}
                        </p>
                      </footer>
                    </blockquote>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 10 · GET IN TOUCH */}
          <section
            id="contact"
            aria-labelledby="contact-heading"
            className="border-t border-[var(--border)] bg-[var(--bg)]/96 py-20 lg:py-28"
          >
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
                <div className="lg:col-span-5" data-reveal>
                  <SectionHeader
                    indexLabel="10"
                    title="Get in touch"
                    id="contact-heading"
                    subtitle="Available for workflow automation builds, AI agent integrations, social strategy, and analytics systems."
                  />

                  <div className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">
                    <div className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--ink-muted)]">Email</p>
                        <a
                          href={`mailto:${profile.contactEmail}`}
                          className="mt-0.5 block truncate text-sm font-semibold text-[var(--ink)] hover:text-[var(--accent)]"
                        >
                          {profile.contactEmail}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="inline-flex items-center gap-1.5 border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--ink)] whitespace-nowrap shrink-0 hover:border-[var(--accent)]"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--ink-muted)]">GitHub</p>
                        <a
                          href={profile.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 block truncate text-sm font-semibold text-[var(--ink)] hover:text-[var(--accent)]"
                        >
                          {profile.githubUrl}
                        </a>
                      </div>
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open GitHub profile"
                        className="inline-flex h-9 w-9 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] shrink-0 hover:border-[var(--accent)]"
                      >
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>

                    {profile.socialLinks
                      .filter((s) => s.url !== profile.githubUrl)
                      .map((link) => (
                        <div key={link.id} className="py-4 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs text-[var(--ink-muted)]">{link.label}</p>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 block truncate text-sm font-semibold text-[var(--ink)] hover:text-[var(--accent)]"
                            >
                              {link.url}
                            </a>
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${link.label}`}
                            className="inline-flex h-9 w-9 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] shrink-0 hover:border-[var(--accent)]"
                          >
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                          </a>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Contact Form */}
                <div className="lg:col-span-7" data-reveal>
                  <form
                    onSubmit={handleContactSubmit}
                    noValidate
                    className="border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-10"
                  >
                    {/* Honeypot field */}
                    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                      <label htmlFor="contact-website">Website</label>
                      <input
                        id="contact-website"
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypotWebsite}
                        onChange={(e) => setHoneypotWebsite(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="contact-name" className="block text-xs font-semibold text-[var(--ink)]">
                          Name
                        </label>
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          required
                          maxLength={120}
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Your name"
                          className="mt-2 w-full border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 focus:border-[var(--accent)] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="contact-email" className="block text-xs font-semibold text-[var(--ink)]">
                          Email
                        </label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          required
                          maxLength={160}
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="you@domain.com"
                          className="mt-2 w-full border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 focus:border-[var(--accent)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label htmlFor="contact-subject" className="block text-xs font-semibold text-[var(--ink)]">
                        Subject
                      </label>
                      <input
                        id="contact-subject"
                        name="subject"
                        type="text"
                        required
                        maxLength={180}
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="Workflow automation inquiry"
                        className="mt-2 w-full border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>

                    <div className="mt-6">
                      <label htmlFor="contact-message" className="block text-xs font-semibold text-[var(--ink)]">
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={5}
                        maxLength={4000}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Describe the workflow, channels, or AI integration you want to build..."
                        className="mt-2 w-full resize-y border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>

                    {submitFeedback && (
                      <div
                        role="status"
                        className={`mt-6 border px-4 py-3 text-sm ${
                          submitFeedback.type === 'success'
                            ? 'border-[var(--accent)] bg-[var(--bg)] text-[var(--ink)]'
                            : 'border-red-400/70 bg-[var(--bg)] text-red-300'
                        }`}
                      >
                        <span className="font-semibold text-[var(--accent)]">
                          {submitFeedback.type === 'success' ? 'Sent: ' : 'Notice: '}
                        </span>
                        {submitFeedback.text}
                      </div>
                    )}

                    <div className="mt-8 flex items-center justify-between gap-4">
                      <span className="text-xs text-[var(--ink-muted)]">
                        Direct response within 24–48 hours.
                      </span>
                      <MagneticControl
                        type="submit"
                        disabled={submitting}
                        variant="primary"
                        showArrow
                        cursorLabel="Send"
                        className="px-7 py-3.5 text-sm font-semibold whitespace-nowrap shrink-0 disabled:opacity-60"
                      >
                        {submitting ? 'Sending...' : 'Send message'}
                      </MagneticControl>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] bg-[var(--bg)] py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 text-xs text-[var(--ink-muted)] sm:flex-row sm:items-center lg:px-10">
            <p>
              &copy; {new Date().getFullYear()} {profile.name} · {profile.location}
            </p>
            <div className="flex items-center gap-6">
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="var-weight-link hover:text-[var(--ink)]"
              >
                GitHub
              </a>
              <a
                href={`mailto:${profile.contactEmail}`}
                className="var-weight-link hover:text-[var(--ink)]"
              >
                Email
              </a>
              <a href="#top" className="var-weight-link hover:text-[var(--ink)]">
                Back to top
              </a>
            </div>
          </div>

          <div className="mx-auto mt-6 flex max-w-6xl justify-end px-6 lg:px-10">
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/admin');
              }}
              className="text-[11px] text-[var(--ink-muted)]/35 transition-colors hover:text-[var(--ink-muted)]/80"
            >
              Admin
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
