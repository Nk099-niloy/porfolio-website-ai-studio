import { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateAvailability = () => {
      const active = finePointer.matches && !reducedMotion.matches;
      setEnabled(active);
      document.body.classList.toggle('custom-cursor-active', active);
    };

    updateAvailability();
    finePointer.addEventListener('change', updateAvailability);
    reducedMotion.addEventListener('change', updateAvailability);

    return () => {
      document.body.classList.remove('custom-cursor-active');
      finePointer.removeEventListener('change', updateAvailability);
      reducedMotion.removeEventListener('change', updateAvailability);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let cursorLabel = '';
    let isInteractive = false;
    let rafId = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      const target = e.target as HTMLElement | null;
      const labeledEl = target?.closest<HTMLElement>('[data-cursor-label]');
      const interactiveEl = target?.closest<HTMLElement>('a, button, [data-magnetic]');

      if (labeledEl) {
        cursorLabel = labeledEl.dataset.cursorLabel || 'View';
        isInteractive = true;
      } else if (interactiveEl) {
        cursorLabel = interactiveEl.dataset.cursorLabel || '';
        isInteractive = true;
      } else {
        cursorLabel = '';
        isInteractive = false;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        dotRef.current.style.opacity = cursorLabel ? '0' : '1';
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = '1';
      }
      if (labelRef.current) {
        labelRef.current.textContent = cursorLabel;
      }
    };

    const onMouseLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    const animate = () => {
      ringX += (mouseX - ringX) * 0.2;
      ringY += (mouseY - ringY) * 0.2;
      if (ringRef.current) {
        const size = cursorLabel ? 68 : isInteractive ? 44 : 28;
        ringRef.current.style.width = `${size}px`;
        ringRef.current.style.height = `${size}px`;
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        ringRef.current.style.borderColor =
          cursorLabel || isInteractive ? 'var(--accent)' : 'rgba(245, 243, 238, 0.35)';
        ringRef.current.style.backgroundColor = cursorLabel
          ? 'rgba(200, 162, 83, 0.92)'
          : 'transparent';
      }
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50">
      <div
        ref={dotRef}
        className="fixed top-0 left-0 h-2 w-2 rounded-full opacity-0 transition-opacity duration-150"
        style={{ backgroundColor: 'var(--accent)' }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 flex items-center justify-center rounded-full border opacity-0 transition-[width,height,border-color,background-color,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width: 28, height: 28, borderColor: 'rgba(245, 243, 238, 0.35)' }}
      >
        <span
          ref={labelRef}
          className="font-mono-tabular text-[10px] font-semibold uppercase tracking-wider text-[#0b0b0e]"
        />
      </div>
    </div>
  );
}
