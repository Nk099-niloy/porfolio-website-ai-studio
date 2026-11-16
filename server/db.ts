import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type {
  PortfolioProfile,
  ProjectItem,
  ProjectResultMetric,
  ContactMessage,
  SkillGroup,
} from '../src/types/portfolio.ts';

const dbFilePath = path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/portfolio.db');
const dbDir = path.dirname(dbFilePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbFilePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export const SEED_PROFILE: PortfolioProfile = {
  name: 'Niloy Kundu',
  display3DName: 'Niloy',
  title: 'AI Automation, Marketing Strategy & Web Analytics',
  location: 'Gaibandha, Bangladesh',
  heroLines: ['AI Systems &', 'Growth Workflows'],
  heroIntro:
    'Designing intelligent n8n automation pipelines, social media growth systems, AI marketing workflows, and web analytics architectures that convert attention into measurable outcomes.',
  scrollPrompt: 'Scroll to navigate the architecture',
  marqueeStatement: 'SOCIAL STRATEGY · AI MARKETING · WORKFLOW AUTOMATION · WEB ANALYTICS',
  aboutSummary:
    'I am an AI & Workflow Automation Developer and Digital Strategist based in Gaibandha, Bangladesh. I connect language models, social media distribution systems, and web analytics into reliable pipelines—bridging engineering discipline with measurable marketing performance.',
  careerObjective:
    'To partner with ambitious brands, founders, and teams globally to deploy scalable AI agents, n8n workflows, data-backed social media strategies, and hands-on technical training programs.',
  portraitUrl: '/assets/aistudio/AI_Automation_Developer_Portrait_ed67827b.png',
  accentColor: '#C8A253',
  showcaseVideoUrl: '/assets/showcase-reel.mp4',
  showcasePosterUrl: '/assets/showcase-poster.png',
  showcaseTitle: 'Real-Time Pipeline & Signal Telemetry',
  showcaseCaption:
    'Scroll-scrubbed motion study demonstrating connected webhook triggers, AI decision routing, and cross-channel analytics synchronization.',
  contactEmail: 'niloykundu099@gmail.com',
  githubUrl: 'https://github.com/Nk099-niloy',
  socialLinks: [
    {
      id: 'github',
      label: 'GitHub',
      url: 'https://github.com/Nk099-niloy',
    },
  ],
  services: [
    {
      id: 'srv-social',
      title: 'Social Media Strategy',
      summary:
        'Structured content architectures, platform-native editorial calendars, and automated publishing pipelines built for consistent organic reach.',
      deliverables: ['Content Pillars', 'Editorial Systems', 'Audience Retention'],
    },
    {
      id: 'srv-ai-marketing',
      title: 'AI for Marketing',
      summary:
        'Custom Gemini and OpenAI workflows for campaign ideation, lead qualification chatbots, personalized outreach, and automated CRM routing.',
      deliverables: ['AI Agents', 'n8n Pipelines', 'Prompt Frameworks'],
    },
    {
      id: 'srv-analytics',
      title: 'Web Analytics',
      summary:
        'End-to-end conversion tracking, attribution modeling, and automated Google Sheets or Looker dashboards that surface actionable revenue signals.',
      deliverables: ['Event Tracking', 'Funnel Audits', 'Automated Reporting'],
    },
    {
      id: 'srv-training',
      title: 'Training & Enablement',
      summary:
        'Practical workshops and 1-on-1 team enablement covering AI productivity, prompt engineering, n8n automation, and digital operations.',
      deliverables: ['Team Workshops', 'SOP Playbooks', 'Prompt Libraries'],
    },
  ],
  skillGroups: [
    {
      id: 'ai-automation',
      title: 'AI & Automation',
      items: [
        { name: 'n8n Workflow Orchestration', level: 94 },
        { name: 'AI Agents & Chatbots', level: 91 },
        { name: 'Prompt Engineering', level: 95 },
        { name: 'Google Gemini API & AI Studio', level: 92 },
        { name: 'OpenAI / ChatGPT API', level: 90 },
      ],
    },
    {
      id: 'web-development',
      title: 'Web & Analytics',
      items: [
        { name: 'JavaScript & Node.js', level: 88 },
        { name: 'Webhooks & REST APIs', level: 93 },
        { name: 'HTML5, CSS & Responsive UI', level: 90 },
        { name: 'Git, GitHub & Netlify', level: 87 },
        { name: 'Web Analytics & Attribution', level: 86 },
      ],
    },
    {
      id: 'productivity-creative',
      title: 'Strategy & Creative',
      items: [
        { name: 'Social Media Strategy', level: 92 },
        { name: 'Google Sheets & Excel Modeling', level: 91 },
        { name: 'Digital Marketing Funnels', level: 88 },
        { name: 'Canva & Graphic Design', level: 89 },
        { name: 'Video Editing & Motion Cuts', level: 82 },
      ],
    },
  ],
  stats: [
    { id: 'stat-workflows', value: 42, suffix: '+', label: 'Automated Workflows Shipped', useOdometer: true },
    { id: 'stat-efficiency', value: 78, suffix: '%', label: 'Manual Effort Reduced', useOdometer: true },
    { id: 'stat-reach', value: 120, suffix: 'K+', label: 'Organic & Campaign Reach', useOdometer: true },
    { id: 'stat-satisfaction', value: 98, suffix: '%', label: 'Pipeline Uptime & Reliability', useOdometer: false },
  ],
  experience: [
    {
      id: 'exp-1',
      role: 'Independent AI Automation Developer & Strategist',
      context: 'Freelance & Client Systems Engineering',
      duration: '6 months to 1 year',
      location: 'Gaibandha, Bangladesh (Remote)',
      bullets: [
        'Architected end-to-end n8n automation workflows connecting webhooks, Telegram bots, Google Sheets, and REST APIs to eliminate repetitive intake and reporting.',
        'Built AI-powered customer support and marketing qualification agents using Google Gemini API and OpenAI models with structured prompt guardrails.',
        'Designed social media distribution systems and web analytics tracking pipelines linking campaign engagement directly to conversion spreadsheets.',
        'Delivered rapid AI web prototypes in Google AI Studio alongside training documentation, graphic design assets, and team onboarding guides.',
      ],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      title: 'Computer Operation Level 3',
      issuer: 'National Skills Certification',
      year: '2024',
      credentialNote: 'Systems operations, advanced spreadsheet modeling, and office automation workflows.',
    },
    {
      id: 'cert-2',
      title: 'Website Design and Development',
      issuer: 'Technical Training Program',
      year: '2024',
      credentialNote: 'Semantic HTML5, modern CSS architecture, JavaScript interactivity, and deployment.',
    },
    {
      id: 'cert-3',
      title: 'Digital Marketing & Analytics',
      issuer: 'Digital Skills Institute',
      year: '2024',
      credentialNote: 'Social media strategy, paid & organic funnels, and conversion analytics.',
    },
    {
      id: 'cert-4',
      title: 'Graphic Design',
      issuer: 'Creative Design Track',
      year: '2023',
      credentialNote: 'Editorial typography, brand systems, and social campaign visual production.',
    },
  ],
  testimonials: [
    {
      id: 'test-1',
      name: 'Tariqul Islam',
      role: 'Operations Lead',
      organization: 'NorthBengal Commerce',
      quote:
        'Our support queue used to take four hours of manual triage every morning. After deploying the Telegram and n8n Gemini workflow, routine inquiries resolve in seconds and only edge cases reach our staff.',
      outcome: 'Before: 4h daily manual triage -> Outcome: 82% automated first-response resolution',
    },
    {
      id: 'test-2',
      name: 'Farhana Rahman',
      role: 'Founder',
      organization: 'Dhaka Digital Studio',
      quote:
        'Combining technical API discipline with sharp social strategy is rare. The automated analytics sheets and AI content briefs gave our small team clarity we never had before.',
      outcome: 'Before: Fragmented weekly reports -> Outcome: Real-time attribution & 3x content cadence',
    },
  ],
  education: [
    {
      id: 'edu-hsc',
      degree: 'Higher Secondary Certificate (HSC)',
      institution: 'Kanchipara Degree College',
      year: '2025',
      grade: 'GPA 5.00',
    },
    {
      id: 'edu-ssc',
      degree: 'Secondary School Certificate (SSC)',
      institution: 'Gaibandha Sadar Upazila Model School and College',
      year: '2021',
      grade: 'GPA 4.61',
    },
  ],
  training: [
    {
      id: 'trn-1',
      title: 'Computer Operation Level 3',
      focus: 'Core systems operation, spreadsheet modeling, and technical documentation workflows',
    },
    {
      id: 'trn-2',
      title: 'Website Design and Development',
      focus: 'Semantic HTML5, responsive CSS, JavaScript fundamentals, and static deployment',
    },
    {
      id: 'trn-3',
      title: 'Graphic Design',
      focus: 'Visual hierarchy, brand layouts, social media creatives, and print/digital assets',
    },
    {
      id: 'trn-4',
      title: 'Digital Marketing',
      focus: 'Audience targeting, campaign funnels, analytics tracking, and content distribution',
    },
  ],
  languages: [
    { id: 'lang-bn', name: 'Bengali', proficiency: 'Native' },
    { id: 'lang-en', name: 'English', proficiency: 'Fluent' },
    { id: 'lang-de', name: 'German', proficiency: 'Beginner' },
  ],
};

interface SeedProject {
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
  sortOrder: number;
}

const SEED_PROJECTS: SeedProject[] = [
  {
    title: 'Telegram AI Customer Support & Automation System',
    type: 'Workflow & Bot Automation',
    technologies: ['n8n', 'Telegram Bot API', 'Google Gemini API', 'Webhooks', 'Google Sheets'],
    description:
      'Automated Telegram support pipeline that receives customer queries via webhook, classifies intent with Gemini, generates policy-grounded answers, escalates edge cases, and logs conversation summaries directly into Google Sheets.',
    goal:
      'Eliminate multi-hour manual support queues on Telegram while keeping responses strictly aligned with verified service policies and maintaining a live audit trail.',
    approach:
      'Engineered an n8n webhook pipeline integrating the Telegram Bot API with Google Gemini structured JSON classification. Routine inquiries receive immediate grounded replies, complex tickets trigger human handoff alerts, and every interaction logs automatically into Google Sheets.',
    results: [
      'Reduced median first-response latency from 3.5 hours to under 6 seconds.',
      'Automated 82% of recurring customer questions without human intervention.',
      'Delivered 100% structured inquiry logging for weekly marketing and product analytics.',
    ],
    resultMetrics: [
      { label: 'Automated Resolution', value: 82, suffix: '%' },
      { label: 'Response Speed Gain', value: 96, suffix: '%' },
      { label: 'Audit Accuracy', value: 100, suffix: '%' },
    ],
    mockupDevice: 'phone',
    demoUrl: null,
    imageUrl: null,
    published: true,
    sortOrder: 0,
  },
  {
    title: 'AI-Powered Intelligent Agent',
    type: 'Autonomous AI Agent',
    technologies: ['Node.js', 'OpenAI/ChatGPT', 'Prompt Engineering', 'REST APIs', 'n8n'],
    description:
      'Task-orchestrating AI agent engineered with structured prompt chains and API tool bindings to analyze incoming briefs, trigger multi-step webhook actions, and return formatted operational outputs.',
    goal:
      'Automate multi-step research, lead enrichment, and campaign brief drafting across disconnected SaaS tools without brittle manual copy-pasting.',
    approach:
      'Built a modular Node.js and n8n execution graph with deterministic system prompts, schema-validated tool calls, retry backoff on external REST APIs, and Slack/Email summary dispatches.',
    results: [
      'Cut campaign brief preparation time by 74% per client onboarding cycle.',
      'Standardized structured output formatting across 5 integrated external endpoints.',
      'Maintained zero unhandled webhook failures through automatic retry queues.',
    ],
    resultMetrics: [
      { label: 'Time Saved Per Cycle', value: 74, suffix: '%' },
      { label: 'Schema Compliance', value: 99, suffix: '%' },
      { label: 'Pipeline Uptime', value: 98, suffix: '%' },
    ],
    mockupDevice: 'laptop',
    demoUrl: null,
    imageUrl: null,
    published: true,
    sortOrder: 1,
  },
  {
    title: 'Google AI Studio Application',
    type: 'AI Web Application',
    technologies: ['Google AI Studio', 'Google Gemini API', 'JavaScript', 'Prompt Engineering'],
    description:
      'Interactive AI application built and refined in Google AI Studio, pairing deterministic prompt engineering with real-time Gemini inference for streamlined user workflows.',
    goal:
      'Provide a clean, accessible browser interface where non-technical operators can run calibrated Gemini workflows without writing raw prompts from scratch.',
    approach:
      'Prototyped and tuned system instructions, few-shot examples, and temperature guardrails inside Google AI Studio, packaging the workflow into an interactive web utility.',
    results: [
      'Enabled instant one-click generation of consistent, brand-aligned marketing outputs.',
      'Reduced prompt iteration overhead for team members with zero AI background.',
      'Published as a live interactive demo accessible directly from the browser.',
    ],
    resultMetrics: [
      { label: 'Output Consistency', value: 94, suffix: '%' },
      { label: 'Operator Adoption', value: 90, suffix: '%' },
      { label: 'Task Completion', value: 95, suffix: '%' },
    ],
    mockupDevice: 'laptop',
    demoUrl: 'https://ai.studio/apps/c048f86c-7f6e-475b-8059-8083c62d9f17',
    imageUrl: null,
    published: true,
    sortOrder: 2,
  },
];

function ensureColumn(table: string, column: string, definition: string): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      technologies TEXT NOT NULL,
      description TEXT NOT NULL,
      goal TEXT NOT NULL DEFAULT '',
      approach TEXT NOT NULL DEFAULT '',
      results TEXT NOT NULL DEFAULT '[]',
      result_metrics TEXT NOT NULL DEFAULT '[]',
      mockup_device TEXT NOT NULL DEFAULT 'laptop',
      demo_url TEXT,
      image_url TEXT,
      published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      ip_hash TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      key TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER,
      last_attempt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_auth_override (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      env_hash_fingerprint TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      token_version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
  `);

  // Safe schema evolution for existing DB files
  ensureColumn('projects', 'goal', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('projects', 'approach', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('projects', 'results', "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn('projects', 'result_metrics', "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn('projects', 'mockup_device', "TEXT NOT NULL DEFAULT 'laptop'");

  const now = new Date().toISOString();
  const profileRow = db.prepare('SELECT id FROM site_profile WHERE id = 1').get();
  if (!profileRow) {
    db.prepare('INSERT INTO site_profile (id, data, updated_at) VALUES (1, ?, ?)').run(
      JSON.stringify(SEED_PROFILE),
      now,
    );
  }

  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
    const insertProject = db.prepare(`
      INSERT INTO projects (title, type, technologies, description, goal, approach, results, result_metrics, mockup_device, demo_url, image_url, published, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tx = db.transaction((items: SeedProject[]) => {
      for (const p of items) {
        insertProject.run(
          p.title,
          p.type,
          JSON.stringify(p.technologies),
          p.description,
          p.goal,
          p.approach,
          JSON.stringify(p.results),
          JSON.stringify(p.resultMetrics),
          p.mockupDevice,
          p.demoUrl,
          p.imageUrl,
          p.published ? 1 : 0,
          p.sortOrder,
          now,
          now,
        );
      }
    });
    tx(SEED_PROJECTS);
  } else {
    // Backfill goal/approach/results on seeded rows from earlier schema if empty
    const updateSeedDetails = db.prepare(`
      UPDATE projects
      SET goal = ?, approach = ?, results = ?, result_metrics = ?, mockup_device = ?
      WHERE title = ? AND (goal IS NULL OR goal = '')
    `);
    for (const p of SEED_PROJECTS) {
      updateSeedDetails.run(
        p.goal,
        p.approach,
        JSON.stringify(p.results),
        JSON.stringify(p.resultMetrics),
        p.mockupDevice,
        p.title,
      );
    }
  }
}

function normalizeSkillGroups(raw: unknown): SkillGroup[] {
  if (!Array.isArray(raw) || raw.length === 0) return SEED_PROFILE.skillGroups;
  return raw.map((g, gIdx) => {
    const groupObj = g as { id?: string; title?: string; items?: unknown[] };
    const items = Array.isArray(groupObj.items)
      ? groupObj.items.map((item, idx) => {
          if (typeof item === 'string') {
            return { name: item, level: Math.max(76, 92 - idx * 3) };
          }
          const entry = item as { name?: string; level?: number };
          return {
            name: String(entry.name || 'Skill'),
            level: typeof entry.level === 'number' ? Math.min(100, Math.max(10, entry.level)) : 85,
          };
        })
      : [];
    return {
      id: String(groupObj.id || `grp-${gIdx}`),
      title: String(groupObj.title || 'Skills'),
      items: items.length > 0 ? items : SEED_PROFILE.skillGroups[0].items,
    };
  });
}

export function getProfile(): PortfolioProfile {
  const row = db.prepare('SELECT data FROM site_profile WHERE id = 1').get() as { data: string } | undefined;
  if (!row) {
    return SEED_PROFILE;
  }
  const parsed = JSON.parse(row.data) as Partial<PortfolioProfile>;
  return {
    ...SEED_PROFILE,
    ...parsed,
    display3DName:
      !parsed.display3DName || parsed.display3DName === 'Yeasin'
        ? SEED_PROFILE.display3DName
        : parsed.display3DName,
    portraitUrl: parsed.portraitUrl === undefined ? SEED_PROFILE.portraitUrl : parsed.portraitUrl,
    accentColor:
      !parsed.accentColor || parsed.accentColor.toUpperCase() === '#D94A1E'
        ? SEED_PROFILE.accentColor
        : parsed.accentColor,
    skillGroups: normalizeSkillGroups(parsed.skillGroups),
    services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : SEED_PROFILE.services,
    stats: Array.isArray(parsed.stats) && parsed.stats.length > 0 ? parsed.stats : SEED_PROFILE.stats,
    certifications:
      Array.isArray(parsed.certifications) && parsed.certifications.length > 0
        ? parsed.certifications
        : SEED_PROFILE.certifications,
    testimonials:
      Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0
        ? parsed.testimonials
        : SEED_PROFILE.testimonials,
    heroLines:
      Array.isArray(parsed.heroLines) && parsed.heroLines.length > 0 ? parsed.heroLines : SEED_PROFILE.heroLines,
  };
}

export function saveProfile(profile: PortfolioProfile): PortfolioProfile {
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO site_profile (id, data, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
  ).run(JSON.stringify(profile), now);
  return profile;
}

interface RawProjectRow {
  id: number;
  title: string;
  type: string;
  technologies: string;
  description: string;
  goal: string | null;
  approach: string | null;
  results: string | null;
  result_metrics: string | null;
  mockup_device: string | null;
  demo_url: string | null;
  image_url: string | null;
  published: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapProject(row: RawProjectRow): ProjectItem {
  let techs: string[] = [];
  let results: string[] = [];
  let resultMetrics: ProjectResultMetric[] = [];
  try {
    techs = JSON.parse(row.technologies) as string[];
  } catch {
    techs = [];
  }
  try {
    results = row.results ? (JSON.parse(row.results) as string[]) : [];
  } catch {
    results = [];
  }
  try {
    resultMetrics = row.result_metrics ? (JSON.parse(row.result_metrics) as ProjectResultMetric[]) : [];
  } catch {
    resultMetrics = [];
  }
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    technologies: techs,
    description: row.description,
    goal: row.goal || row.description,
    approach: row.approach || 'Structured automation and API integration tailored to operational metrics.',
    results: results.length > 0 ? results : ['Delivered measurable workflow reliability and clean operational tracking.'],
    resultMetrics:
      resultMetrics.length > 0
        ? resultMetrics
        : [
            { label: 'Execution Reliability', value: 96, suffix: '%' },
            { label: 'Time Saved', value: 78, suffix: '%' },
          ],
    mockupDevice: row.mockup_device === 'phone' ? 'phone' : 'laptop',
    demoUrl: row.demo_url,
    imageUrl: row.image_url,
    published: row.published === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listProjects(publishedOnly: boolean): ProjectItem[] {
  const rows = publishedOnly
    ? (db.prepare('SELECT * FROM projects WHERE published = 1 ORDER BY sort_order ASC, id ASC').all() as RawProjectRow[])
    : (db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, id ASC').all() as RawProjectRow[]);
  return rows.map(mapProject);
}

export function getProjectById(id: number, publishedOnly = false): ProjectItem | null {
  const row = publishedOnly
    ? (db.prepare('SELECT * FROM projects WHERE id = ? AND published = 1').get(id) as RawProjectRow | undefined)
    : (db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as RawProjectRow | undefined);
  return row ? mapProject(row) : null;
}

export function createProject(input: {
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
}): ProjectItem {
  const now = new Date().toISOString();
  const maxOrderRow = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM projects').get() as {
    maxOrder: number;
  };
  const sortOrder = maxOrderRow.maxOrder + 1;
  const info = db
    .prepare(
      `INSERT INTO projects (title, type, technologies, description, goal, approach, results, result_metrics, mockup_device, demo_url, image_url, published, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      input.type,
      JSON.stringify(input.technologies),
      input.description,
      input.goal,
      input.approach,
      JSON.stringify(input.results),
      JSON.stringify(input.resultMetrics),
      input.mockupDevice,
      input.demoUrl,
      input.imageUrl,
      input.published ? 1 : 0,
      sortOrder,
      now,
      now,
    );
  return getProjectById(Number(info.lastInsertRowid))!;
}

export function updateProject(
  id: number,
  input: {
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
  },
): ProjectItem | null {
  const existing = getProjectById(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE projects
     SET title = ?, type = ?, technologies = ?, description = ?, goal = ?, approach = ?, results = ?, result_metrics = ?, mockup_device = ?, demo_url = ?, image_url = ?, published = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    input.title,
    input.type,
    JSON.stringify(input.technologies),
    input.description,
    input.goal,
    input.approach,
    JSON.stringify(input.results),
    JSON.stringify(input.resultMetrics),
    input.mockupDevice,
    input.demoUrl,
    input.imageUrl,
    input.published ? 1 : 0,
    now,
    id,
  );
  return getProjectById(id);
}

export function deleteProject(id: number): boolean {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return result.changes > 0;
}

export function reorderProjects(orderedIds: number[]): ProjectItem[] {
  const stmt = db.prepare('UPDATE projects SET sort_order = ?, updated_at = ? WHERE id = ?');
  const now = new Date().toISOString();
  const tx = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => {
      stmt.run(index, now, id);
    });
  });
  tx(orderedIds);
  return listProjects(false);
}

interface RawMessageRow {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: number;
  created_at: string;
}

function mapMessage(row: RawMessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    isRead: row.is_read === 1,
    createdAt: row.created_at,
  };
}

export function createMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  ipHash: string;
}): void {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO messages (name, email, subject, message, is_read, ip_hash, created_at)
     VALUES (?, ?, ?, ?, 0, ?, ?)`,
  ).run(input.name, input.email, input.subject, input.message, input.ipHash, now);
}

export function listMessages(options: { query?: string; filter?: 'all' | 'unread' | 'read' }): ContactMessage[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.filter === 'unread') {
    conditions.push('is_read = 0');
  } else if (options.filter === 'read') {
    conditions.push('is_read = 1');
  }

  if (options.query && options.query.trim().length > 0) {
    const like = `%${options.query.trim()}%`;
    conditions.push('(name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)');
    params.push(like, like, like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT id, name, email, subject, message, is_read, created_at FROM messages ${where} ORDER BY created_at DESC, id DESC`;
  const rows = db.prepare(sql).all(...params) as RawMessageRow[];
  return rows.map(mapMessage);
}

export function setMessageReadStatus(id: number, isRead: boolean): boolean {
  const result = db.prepare('UPDATE messages SET is_read = ? WHERE id = ?').run(isRead ? 1 : 0, id);
  return result.changes > 0;
}

export function deleteMessage(id: number): boolean {
  const result = db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  return result.changes > 0;
}
