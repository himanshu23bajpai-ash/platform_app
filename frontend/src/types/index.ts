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

export interface User {
  email: string;
  name: string;
  oid: string;
}
