export interface SkillEntry {
  name: string;
  level: number;
}

export interface SkillGroup {
  id: string;
  title: string;
  items: SkillEntry[];
}

export interface ServiceItem {
  id: string;
  title: string;
  summary: string;
  deliverables: string[];
}

export interface StatItem {
  id: string;
  value: number;
  suffix: string;
  label: string;
  useOdometer: boolean;
}

export interface ExperienceItem {
  id: string;
  role: string;
  context: string;
  duration: string;
  location: string;
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
  credentialNote: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  organization: string;
  quote: string;
  outcome: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  grade: string;
}

export interface TrainingItem {
  id: string;
  title: string;
  focus: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: string;
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
}

export interface PortfolioProfile {
  name: string;
  display3DName: string;
  title: string;
  location: string;
  heroLines: string[];
  heroIntro: string;
  scrollPrompt: string;
  marqueeStatement: string;
  aboutSummary: string;
  careerObjective: string;
  portraitUrl: string | null;
  accentColor: string;
  showcaseVideoUrl: string;
  showcasePosterUrl: string | null;
  showcaseTitle: string;
  showcaseCaption: string;
  contactEmail: string;
  githubUrl: string;
  socialLinks: SocialLink[];
  services: ServiceItem[];
  skillGroups: SkillGroup[];
  stats: StatItem[];
  experience: ExperienceItem[];
  certifications: CertificationItem[];
  testimonials: TestimonialItem[];
  education: EducationItem[];
  training: TrainingItem[];
  languages: LanguageItem[];
}

export interface ProjectResultMetric {
  label: string;
  value: number;
  suffix: string;
}

export interface ProjectItem {
  id: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface PublicPortfolioResponse {
  profile: PortfolioProfile;
  projects: ProjectItem[];
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
