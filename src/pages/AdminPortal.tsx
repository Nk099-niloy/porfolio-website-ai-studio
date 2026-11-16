import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  LogOut,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  changeAdminPassword,
  checkAdminSession,
  createAdminProject,
  deleteAdminMessage,
  deleteAdminProject,
  fetchAdminMessages,
  fetchAdminProfile,
  fetchAdminProjects,
  loginAdmin,
  logoutAdmin,
  markMessageReadStatus,
  reorderAdminProjects,
  saveAdminProfile,
  updateAdminProject,
  uploadProjectImage,
  uploadShowcaseVideo,
} from '../lib/api';
import type {
  ContactMessage,
  PortfolioProfile,
  ProjectItem,
  ProjectResultMetric,
} from '../types/portfolio';

type AdminTab = 'profile' | 'projects' | 'inbox' | 'security';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function AdminPortal() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState('');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active tab & global notice
  const [activeTab, setActiveTab] = useState<AdminTab>('profile');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile state
  const [profile, setProfile] = useState<PortfolioProfile | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  // Projects state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [projTitle, setProjTitle] = useState('');
  const [projType, setProjType] = useState('');
  const [projTechs, setProjTechs] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projGoal, setProjGoal] = useState('');
  const [projApproach, setProjApproach] = useState('');
  const [projResultsText, setProjResultsText] = useState('');
  const [projMetrics, setProjMetrics] = useState<ProjectResultMetric[]>([
    { label: 'Automation Efficiency', value: 94, suffix: '%' },
  ]);
  const [projMockupDevice, setProjMockupDevice] = useState<'phone' | 'laptop'>('laptop');
  const [projDemoUrl, setProjDemoUrl] = useState('');
  const [projImageUrl, setProjImageUrl] = useState('');
  const [projPublished, setProjPublished] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [confirmDeleteProjId, setConfirmDeleteProjId] = useState<number | null>(null);

  // Messages inbox state
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [msgSearch, setMsgSearch] = useState('');
  const [msgFilter, setMsgFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = useState<number | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [generatedEnvHash, setGeneratedEnvHash] = useState<string | null>(null);

  // Enforce noindex meta tag dynamically while on /admin or /admin-portal
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Portal Access';

    let robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const createdMeta = !robotsMeta;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    const prevContent = robotsMeta.content;
    robotsMeta.content = 'noindex, nofollow';

    return () => {
      document.title = prevTitle;
      if (createdMeta && robotsMeta?.parentNode) {
        robotsMeta.parentNode.removeChild(robotsMeta);
      } else if (robotsMeta) {
        robotsMeta.content = prevContent;
      }
    };
  }, []);

  const loadWorkspaceData = useCallback(async () => {
    try {
      const [profRes, projRes, msgRes] = await Promise.all([
        fetchAdminProfile(),
        fetchAdminProjects(),
        fetchAdminMessages('', 'all'),
      ]);
      setProfile(profRes.profile);
      setProjects(projRes.projects);
      setMessages(msgRes.messages);
      if (profRes.profile.accentColor) {
        document.documentElement.style.setProperty('--accent', profRes.profile.accentColor);
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load admin workspace.',
      });
    }
  }, []);

  useEffect(() => {
    checkAdminSession()
      .then((res) => {
        setAuthenticated(true);
        setAdminUser(res.username);
        return loadWorkspaceData();
      })
      .catch(() => {
        setAuthenticated(false);
      })
      .finally(() => {
        setCheckingSession(false);
      });
  }, [loadWorkspaceData]);

  const refreshMessages = useCallback(async (q: string, filter: 'all' | 'unread' | 'read') => {
    try {
      const res = await fetchAdminMessages(q, filter);
      setMessages(res.messages);
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to refresh inbox.',
      });
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(() => {
      refreshMessages(msgSearch, msgFilter);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [authenticated, msgSearch, msgFilter, refreshMessages]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await loginAdmin(username.trim(), password);
      setAuthenticated(true);
      setAdminUser(res.username);
      setPassword('');
      await loadWorkspaceData();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } finally {
      setAuthenticated(false);
      setAdminUser('');
      setProfile(null);
      setProjects([]);
      setMessages([]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setNotice(null);
    setSavingProfile(true);
    try {
      const sanitizedProfile: PortfolioProfile = {
        ...profile,
        heroLines: profile.heroLines.map((l) => l.trim()).filter(Boolean),
        skillGroups: profile.skillGroups.map((g) => ({
          ...g,
          items: g.items.filter((it) => it.name.trim().length > 0),
        })),
        services: profile.services.map((s) => ({
          ...s,
          deliverables: s.deliverables.map((d) => d.trim()).filter(Boolean),
        })),
        experience: profile.experience.map((ex) => ({
          ...ex,
          bullets: ex.bullets.map((b) => b.trim()).filter(Boolean),
        })),
      };

      const res = await saveAdminProfile(sanitizedProfile);
      setProfile(res.profile);
      document.documentElement.style.setProperty('--accent', res.profile.accentColor);
      setNotice({ type: 'success', text: 'Profile and site configuration saved.' });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const resetProjectForm = () => {
    setEditingProjectId(null);
    setProjTitle('');
    setProjType('');
    setProjTechs('');
    setProjDesc('');
    setProjGoal('');
    setProjApproach('');
    setProjResultsText('');
    setProjMetrics([{ label: 'Automation Efficiency', value: 94, suffix: '%' }]);
    setProjMockupDevice('laptop');
    setProjDemoUrl('');
    setProjImageUrl('');
    setProjPublished(true);
  };

  const startEditProject = (project: ProjectItem) => {
    setEditingProjectId(project.id);
    setProjTitle(project.title);
    setProjType(project.type);
    setProjTechs(project.technologies.join(', '));
    setProjDesc(project.description);
    setProjGoal(project.goal || '');
    setProjApproach(project.approach || '');
    setProjResultsText((project.results || []).join('\n'));
    setProjMetrics(
      project.resultMetrics && project.resultMetrics.length > 0
        ? project.resultMetrics
        : [{ label: 'System Reliability', value: 99, suffix: '%' }],
    );
    setProjMockupDevice(project.mockupDevice || 'laptop');
    setProjDemoUrl(project.demoUrl || '');
    setProjImageUrl(project.imageUrl || '');
    setProjPublished(project.published);
  };

  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNotice(null);
    setUploadingImage(true);
    try {
      const res = await uploadProjectImage(file);
      setProjImageUrl(res.imageUrl);
      setNotice({ type: 'success', text: 'Image uploaded safely.' });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Image upload failed.',
      });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleShowcaseVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setNotice(null);
    setUploadingVideo(true);
    try {
      const res = await uploadShowcaseVideo(file);
      setProfile({ ...profile, showcaseVideoUrl: res.videoUrl });
      setNotice({ type: 'success', text: 'MP4 video uploaded. Click "Save all changes" to publish.' });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Video upload failed.',
      });
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const technologies = projTechs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (technologies.length === 0) {
      setNotice({ type: 'error', text: 'Please add at least one technology.' });
      return;
    }

    const results = projResultsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanedMetrics = projMetrics
      .filter((m) => m.label.trim().length > 0)
      .map((m) => ({
        label: m.label.trim(),
        value: Number(m.value) || 0,
        suffix: m.suffix.trim(),
      }));

    setSavingProject(true);
    try {
      const payload = {
        title: projTitle.trim(),
        type: projType.trim(),
        technologies,
        description: projDesc.trim(),
        goal: projGoal.trim() || projDesc.trim(),
        approach: projApproach.trim() || projDesc.trim(),
        results: results.length > 0 ? results : ['Delivered production workflow.'],
        resultMetrics: cleanedMetrics,
        mockupDevice: projMockupDevice,
        demoUrl: projDemoUrl.trim() || null,
        imageUrl: projImageUrl.trim() || null,
        published: projPublished,
      };

      if (editingProjectId) {
        await updateAdminProject(editingProjectId, payload);
        setNotice({ type: 'success', text: 'Project updated.' });
      } else {
        await createAdminProject(payload);
        setNotice({ type: 'success', text: 'Project added.' });
      }

      const refreshed = await fetchAdminProjects();
      setProjects(refreshed.projects);
      resetProjectForm();
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not save project.',
      });
    } finally {
      setSavingProject(false);
    }
  };

  const handleTogglePublished = async (project: ProjectItem) => {
    setNotice(null);
    try {
      await updateAdminProject(project.id, {
        title: project.title,
        type: project.type,
        technologies: project.technologies,
        description: project.description,
        goal: project.goal || project.description,
        approach: project.approach || project.description,
        results: project.results.length > 0 ? project.results : ['Delivered production workflow.'],
        resultMetrics: project.resultMetrics || [],
        mockupDevice: project.mockupDevice || 'laptop',
        demoUrl: project.demoUrl,
        imageUrl: project.imageUrl,
        published: !project.published,
      });
      const refreshed = await fetchAdminProjects();
      setProjects(refreshed.projects);
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update publish status.',
      });
    }
  };

  const handleMoveProject = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= projects.length) return;
    const next = [...projects];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setProjects(next);
    try {
      const res = await reorderAdminProjects(next.map((p) => p.id));
      setProjects(res.projects);
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to reorder projects.',
      });
    }
  };

  const handleDeleteProject = async (id: number) => {
    setNotice(null);
    try {
      await deleteAdminProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (editingProjectId === id) resetProjectForm();
      setConfirmDeleteProjId(null);
      setNotice({ type: 'success', text: 'Project removed.' });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete project.',
      });
    }
  };

  const handleToggleMessageRead = async (msg: ContactMessage) => {
    try {
      await markMessageReadStatus(msg.id, !msg.isRead);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: !m.isRead } : m)));
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update message status.',
      });
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      await deleteAdminMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setConfirmDeleteMsgId(null);
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete message.',
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setGeneratedEnvHash(null);

    if (newPassword.length < 10) {
      setNotice({ type: 'error', text: 'New password must be at least 10 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await changeAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (res.envHash) setGeneratedEnvHash(res.envHash);
      setNotice({ type: 'success', text: res.message });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Password change failed.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-sm text-[var(--ink-muted)]">
        Verifying session...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-16 text-[var(--ink)]">
        <div className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-10">
          <div className="border-b border-[var(--border)] pb-5">
            <p className="font-mono-tabular text-xs text-[var(--accent)]">Restricted Access</p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">Portfolio Admin</h1>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div>
              <label htmlFor="admin-username" className="block text-xs font-semibold text-[var(--ink)]">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-[var(--ink)]">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            {loginError && (
              <div
                role="alert"
                className="border border-red-400/60 bg-[var(--bg)] px-4 py-3 text-xs text-red-300"
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {loginLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--border)] pt-4 flex items-center justify-between text-xs text-[var(--ink-muted)]">
            <a href="/" className="hover:text-[var(--ink)]">
              Return to portfolio
            </a>
            <span className="font-mono-tabular">JWT + CSRF Protected</span>
          </div>
        </div>
      </main>
    );
  }

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Admin Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4 lg:px-10">
          <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
            Portfolio Admin
          </span>

          <nav aria-label="Admin sections" className="flex items-center gap-6 overflow-x-auto text-sm font-medium">
            {(
              [
                ['profile', 'Profile & Content'],
                ['projects', `Projects (${projects.length})`],
                ['inbox', `Inbox (${unreadCount} unread)`],
                ['security', 'Security'],
              ] as Array<[AdminTab, string]>
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => {
                  setActiveTab(tabKey);
                  setNotice(null);
                }}
                className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                  activeTab === tabKey
                    ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                    : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] whitespace-nowrap"
            >
              <span>View site</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent)] whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        {notice && (
          <div
            role="status"
            className={`mb-8 flex items-center justify-between border px-5 py-3.5 text-sm ${
              notice.type === 'success'
                ? 'border-[var(--accent)] bg-[var(--surface)] text-[var(--ink)]'
                : 'border-red-400/70 bg-[var(--surface)] text-red-300'
            }`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: PROFILE & CONTENT */}
        {activeTab === 'profile' && profile && (
          <form onSubmit={handleSaveProfile} className="space-y-10">
            <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center">
              <div>
                <h1 className="font-display text-2xl font-bold">Profile &amp; Site Content</h1>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Signed in as {adminUser}. All edits update SQLite immediately.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 text-sm font-semibold text-[var(--accent-ink)] whitespace-nowrap shrink-0 disabled:opacity-60"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {savingProfile ? 'Saving...' : 'Save all changes'}
              </button>
            </div>

            {/* 01. Hero & Visual Identity */}
            <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-6">
              <h2 className="font-display text-lg font-bold border-b border-[var(--border)] pb-3">
                01. Hero, 3D Display Name &amp; Visual Accent
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">3D Extruded Hero Name</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={profile.display3DName}
                    onChange={(e) => setProfile({ ...profile, display3DName: e.target.value })}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Professional Title</label>
                  <input
                    type="text"
                    required
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Location</label>
                  <input
                    type="text"
                    required
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Scroll Prompt</label>
                  <input
                    type="text"
                    required
                    value={profile.scrollPrompt}
                    onChange={(e) => setProfile({ ...profile, scrollPrompt: e.target.value })}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Accent Color (Hex)</label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <input
                      type="color"
                      value={profile.accentColor}
                      onChange={(e) => setProfile({ ...profile, accentColor: e.target.value })}
                      className="h-10 w-12 cursor-pointer border border-[var(--border)] bg-[var(--bg)] p-1"
                    />
                    <input
                      type="text"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      required
                      value={profile.accentColor}
                      onChange={(e) => setProfile({ ...profile, accentColor: e.target.value })}
                      className="font-mono-tabular w-32 border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold">Hero Split Headline Lines (one per line)</label>
                  <textarea
                    rows={3}
                    required
                    value={profile.heroLines.join('\n')}
                    onChange={(e) => setProfile({ ...profile, heroLines: e.target.value.split('\n') })}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Hero One-Line Intro</label>
                  <textarea
                    rows={3}
                    required
                    value={profile.heroIntro}
                    onChange={(e) => setProfile({ ...profile, heroIntro: e.target.value })}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold">Outlined Scroll-Fill Statement</label>
                <input
                  type="text"
                  required
                  value={profile.marqueeStatement}
                  onChange={(e) => setProfile({ ...profile, marqueeStatement: e.target.value })}
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>
            </section>

            {/* 02. About & Portrait */}
            <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-5">
              <h2 className="font-display text-lg font-bold border-b border-[var(--border)] pb-3">
                02. About &amp; Career Objective
              </h2>
              <div>
                <label className="block text-xs font-semibold">Professional Summary</label>
                <textarea
                  rows={4}
                  required
                  value={profile.aboutSummary}
                  onChange={(e) => setProfile({ ...profile, aboutSummary: e.target.value })}
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Career Objective</label>
                <textarea
                  rows={3}
                  required
                  value={profile.careerObjective}
                  onChange={(e) => setProfile({ ...profile, careerObjective: e.target.value })}
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold">Developer Portrait (PNG, JPEG, WebP · max 2MB)</label>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {profile.portraitUrl && (
                    <img
                      src={profile.portraitUrl}
                      alt={profile.name}
                      className="h-20 w-20 border border-[var(--border)] object-cover object-top"
                    />
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-xs font-semibold hover:border-[var(--accent)]">
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload portrait'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setNotice(null);
                        setUploadingImage(true);
                        try {
                          const res = await uploadProjectImage(file);
                          setProfile({ ...profile, portraitUrl: res.imageUrl });
                          setNotice({ type: 'success', text: 'Portrait uploaded. Save changes to publish.' });
                        } catch (err) {
                          setNotice({
                            type: 'error',
                            text: err instanceof Error ? err.message : 'Portrait upload failed.',
                          });
                        } finally {
                          setUploadingImage(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  {profile.portraitUrl && (
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, portraitUrl: null })}
                      className="text-xs text-[var(--accent)] underline"
                    >
                      Remove portrait
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* 03. Scroll-Scrubbed 3D Video Showcase */}
            <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-5">
              <h2 className="font-display text-lg font-bold border-b border-[var(--border)] pb-3">
                03. Scroll-Scrubbed 3D Video Reel
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold">Section Title</label>
                  <input
                    type="text"
                    required
                    value={profile.showcaseTitle}
                    onChange={(e) => setProfile({ ...profile, showcaseTitle: e.target.value })}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">MP4 Video Path / URL</label>
                  <input
                    type="text"
                    required
                    value={profile.showcaseVideoUrl}
                    onChange={(e) => setProfile({ ...profile, showcaseVideoUrl: e.target.value })}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold">Reel Caption</label>
                <input
                  type="text"
                  required
                  value={profile.showcaseCaption}
                  onChange={(e) => setProfile({ ...profile, showcaseCaption: e.target.value })}
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-xs font-semibold hover:border-[var(--accent)]">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{uploadingVideo ? 'Uploading MP4...' : 'Replace MP4 Video (max 25MB)'}</span>
                  <input
                    type="file"
                    accept="video/mp4"
                    className="sr-only"
                    disabled={uploadingVideo}
                    onChange={handleShowcaseVideoUpload}
                  />
                </label>

                <label className="inline-flex cursor-pointer items-center gap-2 border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-xs font-semibold hover:border-[var(--accent)]">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{uploadingPoster ? 'Uploading Poster...' : 'Upload Poster Fallback'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={uploadingPoster}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingPoster(true);
                      try {
                        const res = await uploadProjectImage(file);
                        setProfile({ ...profile, showcasePosterUrl: res.imageUrl });
                        setNotice({ type: 'success', text: 'Poster uploaded. Save changes to publish.' });
                      } catch (err) {
                        setNotice({
                          type: 'error',
                          text: err instanceof Error ? err.message : 'Poster upload failed.',
                        });
                      } finally {
                        setUploadingPoster(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>

                {profile.showcasePosterUrl && (
                  <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">
                    Poster: {profile.showcasePosterUrl}
                  </span>
                )}
              </div>
            </section>

            {/* 04. Services */}
            <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 className="font-display text-lg font-bold">04. Services</h2>
                <button
                  type="button"
                  onClick={() =>
                    setProfile({
                      ...profile,
                      services: [
                        ...profile.services,
                        {
                          id: makeId('srv'),
                          title: 'New Service',
                          summary: 'Service description',
                          deliverables: ['Deliverable 1'],
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--accent)]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add service</span>
                </button>
              </div>

              <div className="space-y-4">
                {profile.services.map((service, idx) => (
                  <div key={service.id} className="border border-[var(--border)] bg-[var(--bg)] p-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <input
                        type="text"
                        required
                        value={service.title}
                        onChange={(e) => {
                          const next = [...profile.services];
                          next[idx] = { ...service, title: e.target.value };
                          setProfile({ ...profile, services: next });
                        }}
                        className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProfile({
                            ...profile,
                            services: profile.services.filter((s) => s.id !== service.id),
                          })
                        }
                        className="text-xs font-medium text-[var(--accent)] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={service.summary}
                      onChange={(e) => {
                        const next = [...profile.services];
                        next[idx] = { ...service, summary: e.target.value };
                        setProfile({ ...profile, services: next });
                      }}
                      className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <div>
                      <label className="block text-xs text-[var(--ink-muted)]">
                        Deliverables (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={service.deliverables.join(', ')}
                        onChange={(e) => {
                          const next = [...profile.services];
                          next[idx] = {
                            ...service,
                            deliverables: e.target.value.split(',').map((d) => d.trim()),
                          };
                          setProfile({ ...profile, services: next });
                        }}
                        className="mt-1 w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 05. Skill Groups (with numeric proficiency levels) */}
            <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 className="font-display text-lg font-bold">05. Skill Groups &amp; Levels</h2>
                <button
                  type="button"
                  onClick={() =>
                    setProfile({
                      ...profile,
                      skillGroups: [
                        ...profile.skillGroups,
                        { id: makeId('grp'), title: 'New Discipline', items: [{ name: 'Skill 1', level: 85 }] },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--accent)]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add group</span>
                </button>
              </div>

              <div className="space-y-6">
                {profile.skillGroups.map((group, gIdx) => (
                  <div key={group.id} className="border border-[var(--border)] bg-[var(--bg)] p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <input
                        type="text"
                        required
                        value={group.title}
                        onChange={(e) => {
                          const next = [...profile.skillGroups];
                          next[gIdx] = { ...group, title: e.target.value };
                          setProfile({ ...profile, skillGroups: next });
                        }}
                        className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold"
                      />
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...profile.skillGroups];
                            next[gIdx] = {
                              ...group,
                              items: [...group.items, { name: 'New Skill', level: 80 }],
                            };
                            setProfile({ ...profile, skillGroups: next });
                          }}
                          className="text-xs font-semibold text-[var(--ink)] hover:text-[var(--accent)]"
                        >
                          + Add skill
                        </button>
                        {profile.skillGroups.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setProfile({
                                ...profile,
                                skillGroups: profile.skillGroups.filter((g) => g.id !== group.id),
                              })
                            }
                            className="text-xs font-medium text-[var(--accent)] hover:underline"
                          >
                            Remove group
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {group.items.map((skill, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-2 border border-[var(--border)] bg-[var(--surface)] p-2.5"
                        >
                          <input
                            type="text"
                            required
                            value={skill.name}
                            onChange={(e) => {
                              const next = [...profile.skillGroups];
                              const items = [...group.items];
                              items[sIdx] = { ...skill, name: e.target.value };
                              next[gIdx] = { ...group, items };
                              setProfile({ ...profile, skillGroups: next });
                            }}
                            className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm focus:outline-none"
                          />
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={skill.level}
                            onChange={(e) => {
                              const next = [...profile.skillGroups];
                              const items = [...group.items];
                              items[sIdx] = {
                                ...skill,
                                level: Math.min(100, Math.max(1, Number(e.target.value) || 0)),
                              };
                              next[gIdx] = { ...group, items };
                              setProfile({ ...profile, skillGroups: next });
                            }}
                            className="font-mono-tabular w-16 border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-right text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...profile.skillGroups];
                              next[gIdx] = {
                                ...group,
                                items: group.items.filter((_, idx) => idx !== sIdx),
                              };
                              setProfile({ ...profile, skillGroups: next });
                            }}
                            aria-label="Remove skill"
                            className="px-1.5 text-[var(--accent)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 06. Impact Stats */}
            <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 className="font-display text-lg font-bold">06. Key Stats (Animated &amp; Odometer)</h2>
                <button
                  type="button"
                  onClick={() =>
                    setProfile({
                      ...profile,
                      stats: [
                        ...profile.stats,
                        { id: makeId('stat'), value: 25, suffix: '+', label: 'New Metric', useOdometer: false },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--accent)]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add stat</span>
                </button>
              </div>

              <div className="space-y-3">
                {profile.stats.map((stat, idx) => (
                  <div
                    key={stat.id}
                    className="grid grid-cols-1 gap-3 border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-[100px_90px_1fr_auto_auto]"
                  >
                    <input
                      type="number"
                      required
                      value={stat.value}
                      onChange={(e) => {
                        const next = [...profile.stats];
                        next[idx] = { ...stat, value: Number(e.target.value) || 0 };
                        setProfile({ ...profile, stats: next });
                      }}
                      placeholder="Value"
                      className="font-mono-tabular border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={stat.suffix}
                      onChange={(e) => {
                        const next = [...profile.stats];
                        next[idx] = { ...stat, suffix: e.target.value };
                        setProfile({ ...profile, stats: next });
                      }}
                      placeholder="+ / %"
                      className="font-mono-tabular border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={stat.label}
                      onChange={(e) => {
                        const next = [...profile.stats];
                        next[idx] = { ...stat, label: e.target.value };
                        setProfile({ ...profile, stats: next });
                      }}
                      placeholder="Stat label"
                      className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <label className="inline-flex items-center gap-2 text-xs text-[var(--ink-muted)] px-2">
                      <input
                        type="checkbox"
                        checked={stat.useOdometer}
                        onChange={(e) => {
                          const next = [...profile.stats];
                          next[idx] = { ...stat, useOdometer: e.target.checked };
                          setProfile({ ...profile, stats: next });
                        }}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      <span>Odometer</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          stats: profile.stats.filter((s) => s.id !== stat.id),
                        })
                      }
                      aria-label="Remove stat"
                      className="px-2 text-[var(--accent)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* 07. Experience */}
            <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 className="font-display text-lg font-bold">07. Experience Timeline</h2>
                <button
                  type="button"
                  onClick={() =>
                    setProfile({
                      ...profile,
                      experience: [
                        ...profile.experience,
                        {
                          id: makeId('exp'),
                          role: 'Automation Role',
                          context: 'Independent',
                          duration: '6 months',
                          location: profile.location,
                          bullets: ['Delivered automated workflow pipeline.'],
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--accent)]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add experience</span>
                </button>
              </div>

              {profile.experience.map((exp, idx) => (
                <div key={exp.id} className="border border-[var(--border)] bg-[var(--bg)] p-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      required
                      placeholder="Role"
                      value={exp.role}
                      onChange={(e) => {
                        const next = [...profile.experience];
                        next[idx] = { ...exp, role: e.target.value };
                        setProfile({ ...profile, experience: next });
                      }}
                      className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Duration"
                      value={exp.duration}
                      onChange={(e) => {
                        const next = [...profile.experience];
                        next[idx] = { ...exp, duration: e.target.value };
                        setProfile({ ...profile, experience: next });
                      }}
                      className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Context / Organization"
                      value={exp.context}
                      onChange={(e) => {
                        const next = [...profile.experience];
                        next[idx] = { ...exp, context: e.target.value };
                        setProfile({ ...profile, experience: next });
                      }}
                      className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Location"
                      value={exp.location}
                      onChange={(e) => {
                        const next = [...profile.experience];
                        next[idx] = { ...exp, location: e.target.value };
                        setProfile({ ...profile, experience: next });
                      }}
                      className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--ink-muted)]">
                      Bullet points (one per line)
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={exp.bullets.join('\n')}
                      onChange={(e) => {
                        const next = [...profile.experience];
                        next[idx] = { ...exp, bullets: e.target.value.split('\n') };
                        setProfile({ ...profile, experience: next });
                      }}
                      className="mt-1.5 w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        experience: profile.experience.filter((item) => item.id !== exp.id),
                      })
                    }
                    className="text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    Remove entry
                  </button>
                </div>
              ))}
            </section>

            {/* 08. Certifications & Testimonials */}
            <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-8">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h2 className="font-display text-lg font-bold">08. Certifications</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        certifications: [
                          ...profile.certifications,
                          {
                            id: makeId('cert'),
                            title: 'New Certification',
                            issuer: 'Issuing Body',
                            year: '2025',
                            credentialNote: 'Credential scope details',
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add certification</span>
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {profile.certifications.map((cert, idx) => (
                    <div
                      key={cert.id}
                      className="grid grid-cols-1 gap-3 border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-4"
                    >
                      <input
                        type="text"
                        required
                        value={cert.title}
                        onChange={(e) => {
                          const next = [...profile.certifications];
                          next[idx] = { ...cert, title: e.target.value };
                          setProfile({ ...profile, certifications: next });
                        }}
                        placeholder="Title"
                        className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={cert.issuer}
                        onChange={(e) => {
                          const next = [...profile.certifications];
                          next[idx] = { ...cert, issuer: e.target.value };
                          setProfile({ ...profile, certifications: next });
                        }}
                        placeholder="Issuer"
                        className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={cert.year}
                        onChange={(e) => {
                          const next = [...profile.certifications];
                          next[idx] = { ...cert, year: e.target.value };
                          setProfile({ ...profile, certifications: next });
                        }}
                        placeholder="Year"
                        className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={cert.credentialNote}
                          onChange={(e) => {
                            const next = [...profile.certifications];
                            next[idx] = { ...cert, credentialNote: e.target.value };
                            setProfile({ ...profile, certifications: next });
                          }}
                          placeholder="Credential note"
                          className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProfile({
                              ...profile,
                              certifications: profile.certifications.filter((c) => c.id !== cert.id),
                            })
                          }
                          aria-label="Remove certification"
                          className="px-2 text-[var(--accent)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h2 className="font-display text-lg font-bold">09. Client Testimonials</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        testimonials: [
                          ...profile.testimonials,
                          {
                            id: makeId('test'),
                            name: 'Client Name',
                            role: 'Role',
                            organization: 'Organization',
                            quote: 'Quote text...',
                            outcome: 'Measured outcome',
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add testimonial</span>
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {profile.testimonials.map((t, idx) => (
                    <div key={t.id} className="border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <input
                          type="text"
                          required
                          value={t.name}
                          onChange={(e) => {
                            const next = [...profile.testimonials];
                            next[idx] = { ...t, name: e.target.value };
                            setProfile({ ...profile, testimonials: next });
                          }}
                          placeholder="Name"
                          className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          required
                          value={t.role}
                          onChange={(e) => {
                            const next = [...profile.testimonials];
                            next[idx] = { ...t, role: e.target.value };
                            setProfile({ ...profile, testimonials: next });
                          }}
                          placeholder="Role"
                          className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          required
                          value={t.organization}
                          onChange={(e) => {
                            const next = [...profile.testimonials];
                            next[idx] = { ...t, organization: e.target.value };
                            setProfile({ ...profile, testimonials: next });
                          }}
                          placeholder="Organization"
                          className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          required
                          value={t.outcome}
                          onChange={(e) => {
                            const next = [...profile.testimonials];
                            next[idx] = { ...t, outcome: e.target.value };
                            setProfile({ ...profile, testimonials: next });
                          }}
                          placeholder="Outcome metric"
                          className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2 items-start">
                        <textarea
                          rows={2}
                          required
                          value={t.quote}
                          onChange={(e) => {
                            const next = [...profile.testimonials];
                            next[idx] = { ...t, quote: e.target.value };
                            setProfile({ ...profile, testimonials: next });
                          }}
                          placeholder="Quote"
                          className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProfile({
                              ...profile,
                              testimonials: profile.testimonials.filter((item) => item.id !== t.id),
                            })
                          }
                          aria-label="Remove testimonial"
                          className="p-2 text-[var(--accent)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 10. Education, Training, Languages */}
            <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-8">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h2 className="font-display text-lg font-bold">10. Education</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        education: [
                          ...profile.education,
                          {
                            id: makeId('edu'),
                            degree: 'Degree',
                            institution: 'Institution',
                            year: '2025',
                            grade: 'GPA 5.00',
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add education</span>
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {profile.education.map((edu, idx) => (
                    <div
                      key={edu.id}
                      className="grid grid-cols-1 gap-3 border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-4"
                    >
                      <input
                        type="text"
                        required
                        value={edu.degree}
                        onChange={(e) => {
                          const next = [...profile.education];
                          next[idx] = { ...edu, degree: e.target.value };
                          setProfile({ ...profile, education: next });
                        }}
                        className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={edu.institution}
                        onChange={(e) => {
                          const next = [...profile.education];
                          next[idx] = { ...edu, institution: e.target.value };
                          setProfile({ ...profile, education: next });
                        }}
                        className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={edu.year}
                        onChange={(e) => {
                          const next = [...profile.education];
                          next[idx] = { ...edu, year: e.target.value };
                          setProfile({ ...profile, education: next });
                        }}
                        className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={edu.grade}
                          onChange={(e) => {
                            const next = [...profile.education];
                            next[idx] = { ...edu, grade: e.target.value };
                            setProfile({ ...profile, education: next });
                          }}
                          className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProfile({
                              ...profile,
                              education: profile.education.filter((eItem) => eItem.id !== edu.id),
                            })
                          }
                          aria-label="Remove education"
                          className="px-2 text-[var(--accent)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h2 className="font-display text-lg font-bold">11. Training</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        training: [...profile.training, { id: makeId('trn'), title: 'Course', focus: 'Focus area' }],
                      })
                    }
                    className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add training</span>
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {profile.training.map((trn, idx) => (
                    <div
                      key={trn.id}
                      className="grid grid-cols-1 gap-3 border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-[1fr_2fr_auto]"
                    >
                      <input
                        type="text"
                        required
                        value={trn.title}
                        onChange={(e) => {
                          const next = [...profile.training];
                          next[idx] = { ...trn, title: e.target.value };
                          setProfile({ ...profile, training: next });
                        }}
                        className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={trn.focus}
                        onChange={(e) => {
                          const next = [...profile.training];
                          next[idx] = { ...trn, focus: e.target.value };
                          setProfile({ ...profile, training: next });
                        }}
                        className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProfile({
                            ...profile,
                            training: profile.training.filter((t) => t.id !== trn.id),
                          })
                        }
                        aria-label="Remove training"
                        className="px-2 text-[var(--accent)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h2 className="font-display text-lg font-bold">12. Languages</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        languages: [
                          ...profile.languages,
                          { id: makeId('lang'), name: 'Language', proficiency: 'Conversational' },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add language</span>
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {profile.languages.map((lang, idx) => (
                    <div key={lang.id} className="border border-[var(--border)] bg-[var(--bg)] p-4 space-y-2">
                      <input
                        type="text"
                        required
                        value={lang.name}
                        onChange={(e) => {
                          const next = [...profile.languages];
                          next[idx] = { ...lang, name: e.target.value };
                          setProfile({ ...profile, languages: next });
                        }}
                        className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={lang.proficiency}
                          onChange={(e) => {
                            const next = [...profile.languages];
                            next[idx] = { ...lang, proficiency: e.target.value };
                            setProfile({ ...profile, languages: next });
                          }}
                          className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProfile({
                              ...profile,
                              languages: profile.languages.filter((l) => l.id !== lang.id),
                            })
                          }
                          aria-label="Remove language"
                          className="px-2 text-[var(--accent)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 13. Contact & Social Links */}
            <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 className="font-display text-lg font-bold">13. Contact &amp; Social Links</h2>
                <button
                  type="button"
                  onClick={() =>
                    setProfile({
                      ...profile,
                      socialLinks: [
                        ...profile.socialLinks,
                        { id: makeId('soc'), label: 'LinkedIn', url: 'https://' },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add link</span>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={profile.contactEmail}
                    onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Primary GitHub URL</label>
                  <input
                    type="url"
                    required
                    value={profile.githubUrl}
                    onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {profile.socialLinks.map((link, idx) => (
                  <div
                    key={link.id}
                    className="grid grid-cols-1 gap-3 border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-[1fr_2fr_auto]"
                  >
                    <input
                      type="text"
                      required
                      value={link.label}
                      onChange={(e) => {
                        const next = [...profile.socialLinks];
                        next[idx] = { ...link, label: e.target.value };
                        setProfile({ ...profile, socialLinks: next });
                      }}
                      className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <input
                      type="url"
                      required
                      value={link.url}
                      onChange={(e) => {
                        const next = [...profile.socialLinks];
                        next[idx] = { ...link, url: e.target.value };
                        setProfile({ ...profile, socialLinks: next });
                      }}
                      className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          socialLinks: profile.socialLinks.filter((s) => s.id !== link.id),
                        })
                      }
                      aria-label="Remove social link"
                      className="px-2 text-[var(--accent)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </form>
        )}

        {/* TAB 2: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <form
                onSubmit={handleSaveProject}
                className="border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h1 className="font-display text-lg font-bold">
                    {editingProjectId ? 'Edit Project' : 'Add Project'}
                  </h1>
                  {editingProjectId && (
                    <button
                      type="button"
                      onClick={resetProjectForm}
                      className="text-xs font-medium text-[var(--ink-muted)] underline"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold">Project Title</label>
                  <input
                    type="text"
                    required
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    placeholder="e.g. Automated Lead Enrichment Agent"
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold">Project Type</label>
                    <input
                      type="text"
                      required
                      value={projType}
                      onChange={(e) => setProjType(e.target.value)}
                      placeholder="Workflow & Bot Automation"
                      className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">3D Detail Mockup</label>
                    <select
                      value={projMockupDevice}
                      onChange={(e) => setProjMockupDevice(e.target.value as 'phone' | 'laptop')}
                      className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                    >
                      <option value="laptop">Laptop</option>
                      <option value="phone">Phone</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold">Technologies (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={projTechs}
                    onChange={(e) => setProjTechs(e.target.value)}
                    placeholder="n8n, Google Gemini API, Webhooks"
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold">Card Summary</label>
                  <textarea
                    rows={3}
                    required
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold">Case Study Goal</label>
                  <textarea
                    rows={2}
                    value={projGoal}
                    onChange={(e) => setProjGoal(e.target.value)}
                    placeholder="What business problem this solved..."
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold">System Approach</label>
                  <textarea
                    rows={2}
                    value={projApproach}
                    onChange={(e) => setProjApproach(e.target.value)}
                    placeholder="How the architecture and workflows were built..."
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold">Results Bullets (one per line)</label>
                  <textarea
                    rows={3}
                    value={projResultsText}
                    onChange={(e) => setProjResultsText(e.target.value)}
                    placeholder="Delivered 94% autonomous ticket triage..."
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold">Result Progress Ring Metrics</label>
                    <button
                      type="button"
                      onClick={() =>
                        setProjMetrics([...projMetrics, { label: 'Metric', value: 85, suffix: '%' }])
                      }
                      className="text-xs font-semibold text-[var(--accent)]"
                    >
                      + Add metric
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {projMetrics.map((m, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_70px_50px_auto] gap-2">
                        <input
                          type="text"
                          value={m.label}
                          onChange={(e) => {
                            const next = [...projMetrics];
                            next[idx] = { ...m, label: e.target.value };
                            setProjMetrics(next);
                          }}
                          placeholder="Label"
                          className="border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs"
                        />
                        <input
                          type="number"
                          value={m.value}
                          onChange={(e) => {
                            const next = [...projMetrics];
                            next[idx] = { ...m, value: Number(e.target.value) || 0 };
                            setProjMetrics(next);
                          }}
                          className="font-mono-tabular border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={m.suffix}
                          onChange={(e) => {
                            const next = [...projMetrics];
                            next[idx] = { ...m, suffix: e.target.value };
                            setProjMetrics(next);
                          }}
                          className="font-mono-tabular border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setProjMetrics(projMetrics.filter((_, i) => i !== idx))}
                          aria-label="Remove metric"
                          className="px-1.5 text-[var(--accent)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold">Demo URL (optional)</label>
                  <input
                    type="url"
                    value={projDemoUrl}
                    onChange={(e) => setProjDemoUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold">Project Image (mapped onto 3D mockup)</label>
                  <div className="mt-2 flex items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-xs font-semibold hover:border-[var(--accent)]">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload image'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        disabled={uploadingImage}
                        onChange={handleProjectImageUpload}
                      />
                    </label>
                    {projImageUrl && (
                      <button
                        type="button"
                        onClick={() => setProjImageUrl('')}
                        className="text-xs text-[var(--accent)] underline"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                  {projImageUrl && (
                    <img
                      src={projImageUrl}
                      alt="Uploaded project preview"
                      className="mt-3 aspect-[16/9] w-full border border-[var(--border)] object-cover"
                    />
                  )}
                </div>

                <label className="flex items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={projPublished}
                    onChange={(e) => setProjPublished(e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>Published on public portfolio</span>
                </label>

                <button
                  type="submit"
                  disabled={savingProject}
                  className="w-full py-3 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {savingProject ? 'Saving...' : editingProjectId ? 'Update project' : 'Create project'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 className="font-display text-lg font-bold">Manage &amp; Reorder Projects</h2>
                <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">
                  {projects.length} total
                </span>
              </div>

              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className="border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                        <span className="font-mono-tabular text-[var(--accent)]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span>·</span>
                        <span>{project.type}</span>
                        <span>·</span>
                        <span>{project.mockupDevice}</span>
                        <span>·</span>
                        <span className="font-semibold text-[var(--ink)]">
                          {project.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-lg font-bold">{project.title}</h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveProject(index, -1)}
                        aria-label="Move project up"
                        className="border border-[var(--border)] p-1.5 disabled:opacity-35"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === projects.length - 1}
                        onClick={() => handleMoveProject(index, 1)}
                        aria-label="Move project down"
                        className="border border-[var(--border)] p-1.5 disabled:opacity-35"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--ink-muted)]">{project.description}</p>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-xs">
                    <span className="font-mono-tabular text-[var(--ink-muted)]">
                      {project.technologies.join(' · ')}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(project)}
                        className="font-semibold hover:underline"
                      >
                        {project.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditProject(project)}
                        className="font-semibold hover:underline"
                      >
                        Edit
                      </button>
                      {confirmDeleteProjId === project.id ? (
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project.id)}
                            className="font-semibold text-[var(--accent)] underline"
                          >
                            Confirm delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProjId(null)}
                            className="text-[var(--ink-muted)]"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteProjId(project.id)}
                          className="text-[var(--accent)] hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGES INBOX */}
        {activeTab === 'inbox' && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center">
              <div>
                <h1 className="font-display text-2xl font-bold">Messages Inbox</h1>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Contact form submissions stored securely in SQLite.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={msgSearch}
                    onChange={(e) => setMsgSearch(e.target.value)}
                    placeholder="Search sender, subject, text..."
                    className="border border-[var(--border)] bg-[var(--surface)] py-2 pr-4 pl-9 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                <div className="flex border border-[var(--border)] bg-[var(--surface)] p-1 text-xs font-medium">
                  {(['all', 'unread', 'read'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setMsgFilter(f)}
                      className={`px-3 py-1.5 capitalize transition-colors ${
                        msgFilter === f
                          ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                          : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-sm text-[var(--ink-muted)]">
                No messages match the current filter.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <article
                    key={msg.id}
                    className={`border p-6 ${
                      msg.isRead
                        ? 'border-[var(--border)] bg-[var(--surface)]/75'
                        : 'border-[var(--accent)] bg-[var(--surface)]'
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`font-mono-tabular font-semibold ${
                              msg.isRead ? 'text-[var(--ink-muted)]' : 'text-[var(--accent)]'
                            }`}
                          >
                            {msg.isRead ? 'Read' : 'Unread'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[var(--ink)]">{msg.name}</span>
                          <span aria-hidden="true">·</span>
                          <a href={`mailto:${msg.email}`} className="text-[var(--ink-muted)] hover:underline">
                            {msg.email}
                          </a>
                        </div>
                        <h2 className="mt-1.5 font-display text-lg font-bold">{msg.subject}</h2>
                      </div>

                      <span className="font-mono-tabular text-xs text-[var(--ink-muted)] whitespace-nowrap shrink-0">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
                      {msg.message}
                    </p>

                    <div className="mt-5 flex items-center justify-end gap-4 border-t border-[var(--border)] pt-3 text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleMessageRead(msg)}
                        className="inline-flex items-center gap-1.5 font-semibold hover:underline"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{msg.isRead ? 'Mark as unread' : 'Mark as read'}</span>
                      </button>

                      {confirmDeleteMsgId === msg.id ? (
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="font-semibold text-[var(--accent)] underline"
                          >
                            Confirm delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMsgId(null)}
                            className="text-[var(--ink-muted)]"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteMsgId(msg.id)}
                          className="font-semibold text-[var(--accent)] hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SECURITY */}
        {activeTab === 'security' && (
          <div className="max-w-xl space-y-8">
            <div className="border-b border-[var(--border)] pb-4">
              <h1 className="font-display text-2xl font-bold">Security &amp; Credentials</h1>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                Rotate your admin password. Sessions use httpOnly, strict sameSite JWT cookies with CSRF verification.
              </p>
            </div>

            <form
              onSubmit={handleChangePassword}
              className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold">Current Password</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold">New Password (min 10 characters)</label>
                <input
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-3 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {changingPassword ? 'Updating...' : 'Update password'}
              </button>

              {generatedEnvHash && (
                <div className="border border-[var(--border)] bg-[var(--bg)] p-4 text-xs space-y-2">
                  <p className="font-semibold">Updated bcrypt hash (sync to ADMIN_PASSWORD_HASH in .env):</p>
                  <code className="font-mono-tabular block break-all select-all text-[var(--ink-muted)]">
                    {generatedEnvHash}
                  </code>
                </div>
              )}
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
