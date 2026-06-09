export interface Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  category: "legal" | "grant" | "benefits" | "finance" | "content" | "kofi";
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "overdue";
  alertDays: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  deadlineId: string;
  type: "email" | "sms" | "dashboard";
  scheduledFor: string;
  sentAt?: string;
  status: "scheduled" | "sent" | "failed";
  message: string;
}

export interface AgentState {
  agentId: string;
  agentType: string;
  lastRun: string;
  nextRun: string;
  status: "idle" | "running" | "error";
  error?: string;
}

export interface LegalDeadline extends Deadline {
  caseNumber: string;
  court: string;
  opposingParty: string;
  filingType: string;
  notes: string;
}

export interface GrantDeadline extends Omit<Deadline, "status"> {
  funder: string;
  amount: number;
  requirements: string[];
  status: "researching" | "assembling" | "submitted" | "awarded" | "rejected";
}

export interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
  priority: "high" | "normal" | "low";
}

export interface CortexEnv {
  DB: D1Database;
  ORCHESTRATOR: DurableObjectNamespace;
  LEGAL_AGENT: DurableObjectNamespace;
  GRANT_AGENT: DurableObjectNamespace;
  CONTENT_AGENT: DurableObjectNamespace;
  FINANCE_AGENT: DurableObjectNamespace;
  BENEFITS_AGENT: DurableObjectNamespace;
  KOFI_AGENT: DurableObjectNamespace;
  AI: Ai;
  ALERT_EMAIL: string;
  MAILCHANNELS_API: string;
  DISCORD_WEBHOOK_URL: string;
  ENVIRONMENT: string;
}
