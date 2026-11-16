import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ProjectDetail } from './pages/ProjectDetail';
import { PublicPortfolio } from './pages/PublicPortfolio';

const AdminPortal = lazy(() => import('./pages/AdminPortal'));

export default function App() {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextPath: string) => {
    if (nextPath === window.location.pathname) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      window.history.pushState({}, '', nextPath);
      setPathname(nextPath);
      window.scrollTo({ top: 0 });
      return;
    }

    setTransitioning(true);
    window.setTimeout(() => {
      window.history.pushState({}, '', nextPath);
      setPathname(nextPath);
      window.scrollTo({ top: 0 });
      window.setTimeout(() => setTransitioning(false), 60);
    }, 150);
  }, []);

  const isAdminRoute =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/admin-portal' ||
    pathname.startsWith('/admin-portal/');

  const projectMatch = pathname.match(/^\/projects\/(\d+)\/?$/);

  let view: React.ReactNode;
  if (isAdminRoute) {
    view = (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#0b0b0e] text-sm text-[#a19e96]">
            Loading workspace...
          </div>
        }
      >
        <AdminPortal />
      </Suspense>
    );
  } else if (projectMatch) {
    view = <ProjectDetail projectId={Number(projectMatch[1])} onNavigate={navigate} />;
  } else {
    view = <PublicPortfolio onNavigate={navigate} />;
  }

  return (
    <div
      className="transition-opacity duration-200 ease-out"
      style={{ opacity: transitioning ? 0.15 : 1 }}
    >
      {view}
    </div>
  );
}
