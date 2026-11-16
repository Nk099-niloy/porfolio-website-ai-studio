import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { MagneticControl } from './MagneticButton';

interface NavbarProps {
  brandName: string;
  onNavigate?: (path: string) => void;
  isSubPage?: boolean;
}

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#skills', label: 'Skills' },
  { href: '#experience', label: 'Experience' },
  { href: '#projects', label: 'Projects' },
];

export function Navbar({ brandName, onNavigate, isSubPage = false }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileOpen(false);
    if (isSubPage && onNavigate) {
      e.preventDefault();
      onNavigate('/');
      window.setTimeout(() => {
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4 lg:px-10">
        {/* Zone 1: Brand wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            if (isSubPage && onNavigate) {
              e.preventDefault();
              onNavigate('/');
            }
          }}
          className="var-weight-heading font-display text-lg font-bold tracking-tight text-[var(--ink)] whitespace-nowrap shrink-0"
        >
          {brandName}
        </a>

        {/* Zone 2: Concise single-line nav links with variable weight hover shift */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm text-[var(--ink-muted)]"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="var-weight-link relative py-1 whitespace-nowrap shrink-0 hover:text-[var(--ink)] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[var(--accent)] after:transition-[width] after:duration-200 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary CTA + Mobile drawer toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <MagneticControl
            asAnchor
            href="#contact"
            variant="primary"
            cursorLabel="Open"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="hidden sm:inline-flex px-5 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap shrink-0"
          >
            Get in touch
          </MagneticControl>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-11 w-11 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-[var(--border)] bg-[var(--bg)] px-6 py-5 md:hidden"
        >
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="py-2 text-base font-medium text-[var(--ink)] hairline-b"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, '#contact')}
              className="mt-2 inline-flex items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-ink)]"
            >
              Get in touch
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
