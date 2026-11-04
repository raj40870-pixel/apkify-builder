export interface User {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  credits_remaining?: number;
  history_limit?: number;
  buildsUsed?: number;
  totalBuilds?: number;
  trialDaysLeft?: number;
  photoURL?: string;
  createdAt?: string;
  expiresAt?: string | null;
  credits?: number;
  nextRefillDate?: string;
  plan?: string;
  plan_expiry_date?: string;
  last_credit_refill?: string;
}

export interface Build {
  id: string;
  appName: string;
  techStack: string;
  date: string;
  status: 'Completed' | 'Failed' | 'Building';
  downloadUrl: string;
}
