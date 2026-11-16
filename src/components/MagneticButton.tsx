import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface BaseProps {
  children: ReactNode;
  strength?: number;
  className?: string;
  showArrow?: boolean;
  cursorLabel?: string;
  variant?: 'primary' | 'outline';
}

type MagneticButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    asAnchor?: false;
  };

type MagneticAnchorProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    asAnchor: true;
  };

export function MagneticControl(props: MagneticButtonProps | MagneticAnchorProps) {
  const ref = useRef<HTMLElement>(null);
  const strength = props.strength ?? 0.26;
  const showArrow = props.showArrow ?? false;
  const variant = props.variant ?? 'outline';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
      const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
      el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
    };

    const handleLeave = () => {
      el.style.transform = 'translate3d(0px, 0px, 0)';
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);

    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [strength]);

  const innerContent = (label: ReactNode) => (
    <>
      <span className="btn-fill" aria-hidden="true" />
      <span className="btn-label-wrap">
        <span className="btn-label-primary">{label}</span>
        <span className="btn-label-clone" aria-hidden="true">
          {label}
        </span>
      </span>
      {showArrow && (
        <span className="btn-arrow-wrap" aria-hidden="true">
          <span className="btn-arrow-out">
            <ArrowUpRight className="h-4 w-4" />
          </span>
          <span className="btn-arrow-in">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </span>
      )}
    </>
  );

  const baseClasses =
    variant === 'primary'
      ? 'btn-luxury inline-flex items-center justify-center gap-2.5 border border-[var(--accent)] bg-[var(--surface-elevated)] text-[var(--ink)]'
      : 'btn-luxury inline-flex items-center justify-center gap-2.5 border border-[var(--border)] bg-transparent text-[var(--ink)] hover:border-[var(--accent)]';

  if (props.asAnchor) {
    const {
      asAnchor: _a,
      children,
      strength: _s,
      showArrow: _sa,
      cursorLabel,
      variant: _v,
      className = '',
      ...anchorRest
    } = props;
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        data-magnetic="true"
        data-cursor-label={cursorLabel || 'Open'}
        className={`${baseClasses} ${className}`}
        {...anchorRest}
      >
        {innerContent(children)}
      </a>
    );
  }

  const {
    asAnchor: _a,
    children,
    strength: _s,
    showArrow: _sa,
    cursorLabel,
    variant: _v,
    className = '',
    ...buttonRest
  } = props;
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      data-magnetic="true"
      data-cursor-label={cursorLabel || 'Open'}
      className={`${baseClasses} ${className}`}
      {...buttonRest}
    >
      {innerContent(children)}
    </button>
  );
}
