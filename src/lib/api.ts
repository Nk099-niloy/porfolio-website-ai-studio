import type {
  ContactMessage,
  PortfolioProfile,
  ProjectItem,
  ProjectResultMetric,
  PublicPortfolioResponse,
} from '../types/portfolio';

let cachedCsrfToken: string | null = null;

async function ensureCsrfToken(forceRefresh = false): Promise<string> {
  if (cachedCsrfToken && !forceRefresh) {
    return cachedCsrfToken;
  }
  const res = await fetch('/api/csrf-token', {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to initialize security token.');
  }
  const data = (await res.json()) as { csrfToken: string };
  cachedCsrfToken = data.csrfToken;
  return cachedCsrfToken;
}

async function apiRequest<T>(url: string, options: RequestInit = {}, retryCsrf = true): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (method !== 'GET' && method !== 'HEAD') {
    const csrf = await ensureCsrfToken();
    headers.set('X-CSRF-Token', csrf);
  }

  if (!(options.body instanceof FormData) && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 403 && retryCsrf && method !== 'GET') {
    await ensureCsrfToken(true);
    return apiRequest<T>(url, options, false);
  }

  const text = await res.text();
  let json: Record<string, unknown> = {};
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = {};
    }
  }

  if (!res.ok) {
    const msg = typeof json.error === 'string' ? json.error : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return json as T;
}

// --- Public API ---

export async function fetchPublicPortfolio(): Promise<PublicPortfolioResponse> {
  return apiRequest<PublicPortfolioResponse>('/api/portfolio');
}

export async function fetchPublicProjectById(id: number): Promise<{ project: ProjectItem }> {
  return apiRequest<{ project: ProjectItem }>(`/api/projects/${id}`);
}

export async function submitContactMessage(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
  formLoadedAt: number;
}): Promise<{ ok: boolean; message: string }> {
  return apiRequest<{ ok: boolean; message: string }>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// --- Admin API ---

export async function checkAdminSession(): Promise<{ authenticated: boolean; username: string }> {
  return apiRequest<{ authenticated: boolean; username: string }>('/api/admin/session');
}

export async function loginAdmin(username: string, password: string): Promise<{ ok: boolean; username: string }> {
  return apiRequest<{ ok: boolean; username: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logoutAdmin(): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/api/admin/logout', {
    method: 'POST',
  });
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string; envHash?: string }> {
  return apiRequest<{ ok: boolean; message: string; envHash?: string }>('/api/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function fetchAdminProfile(): Promise<{ profile: PortfolioProfile }> {
  return apiRequest<{ profile: PortfolioProfile }>('/api/admin/profile');
}

export async function saveAdminProfile(profile: PortfolioProfile): Promise<{ ok: boolean; profile: PortfolioProfile }> {
  return apiRequest<{ ok: boolean; profile: PortfolioProfile }>('/api/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export async function fetchAdminProjects(): Promise<{ projects: ProjectItem[] }> {
  return apiRequest<{ projects: ProjectItem[] }>('/api/admin/projects');
}

export interface ProjectSavePayload {
  title: string;
  type: string;
  technologies: string[];
  description: string;
  goal: string;
  approach: string;
  results: string[];
  resultMetrics: ProjectResultMetric[];
  mockupDevice: 'phone' | 'laptop';
  demoUrl: string | null;
  imageUrl: string | null;
  published: boolean;
}

export async function createAdminProject(project: ProjectSavePayload): Promise<{ ok: boolean; project: ProjectItem }> {
  return apiRequest<{ ok: boolean; project: ProjectItem }>('/api/admin/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}

export async function updateAdminProject(
  id: number,
  project: ProjectSavePayload,
): Promise<{ ok: boolean; project: ProjectItem }> {
  return apiRequest<{ ok: boolean; project: ProjectItem }>(`/api/admin/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(project),
  });
}

export async function deleteAdminProject(id: number): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/admin/projects/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderAdminProjects(orderedIds: number[]): Promise<{ ok: boolean; projects: ProjectItem[] }> {
  return apiRequest<{ ok: boolean; projects: ProjectItem[] }>('/api/admin/projects/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  });
}

export async function uploadProjectImage(file: File): Promise<{ ok: boolean; imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return apiRequest<{ ok: boolean; imageUrl: string }>('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function uploadShowcaseVideo(file: File): Promise<{ ok: boolean; videoUrl: string }> {
  const formData = new FormData();
  formData.append('video', file);
  return apiRequest<{ ok: boolean; videoUrl: string }>('/api/admin/upload-video', {
    method: 'POST',
    body: formData,
  });
}

export async function fetchAdminMessages(query = '', filter: 'all' | 'unread' | 'read' = 'all'): Promise<{
  messages: ContactMessage[];
}> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  params.set('filter', filter);
  return apiRequest<{ messages: ContactMessage[] }>(`/api/admin/messages?${params.toString()}`);
}

export async function markMessageReadStatus(id: number, isRead: boolean): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/admin/messages/${id}/read`, {
    method: 'PATCH',
    body: JSON.stringify({ isRead }),
  });
}

export async function deleteAdminMessage(id: number): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/admin/messages/${id}`, {
    method: 'DELETE',
  });
}
