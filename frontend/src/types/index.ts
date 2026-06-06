export type StepStatus = "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED";

export type StepName =
  | "REPO_REGISTRATION"
  | "AWS_ACCOUNT_VPC"
  | "CICD_PIPELINE"
  | "COMPUTE_PROVISION";

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_email: string;
  aws_account_id: string;
  aws_region: string;
  repo_url: string;
  repo_branch: string;
  language: string;
  compute_type: "ecs" | "eks" | "lambda";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProjectSummary extends Project {
  steps_total: number;
  steps_completed: number;
  overall_status: StepStatus;
}

export interface OnboardingStep {
  id: string;
  step: StepName;
  status: StepStatus;
  order_index: number;
  started_at: string | null;
  completed_at: string | null;
  message: string;
}

export interface ComputeResource {
  kind: string;
  id: string;
  name: string;
  status: string;
  region: string;
  details: Record<string, unknown>;
}

export interface DatabaseResource {
  kind: string;
  id: string;
  name: string;
  engine: string;
  status: string;
  region: string;
  details: Record<string, unknown>;
}

export interface S3Resource {
  name: string;
  region: string;
  created_at: string | null;
}

export type Role = "ADMIN" | "PROJECT_MANAGER" | "PROJECT_VIEWER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  azure_oid: string;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
  user: User;
}

export interface SecretSummary {
  name: string;
  arn: string;
  description: string;
  last_changed: string | null;
}

export interface CostBreakdownItem {
  service: string;
  amount_usd: number;
}

export interface CostPeriod {
  month: string;
  amount_usd: number;
}

export interface ProjectCost {
  project_id: string;
  project_name: string;
  currency: string;
  total_current_month_usd: number;
  total_last_month_usd: number;
  breakdown: CostBreakdownItem[];
  last_6_months: CostPeriod[];
}

export interface CostMatrixRow {
  project_id: string;
  project_name: string;
  current_month_usd: number;
  last_month_usd: number;
  trend_pct: number;
}
