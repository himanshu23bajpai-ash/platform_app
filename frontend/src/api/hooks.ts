import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  ComputeResource,
  DatabaseResource,
  OnboardingStep,
  Project,
  ProjectSummary,
  S3Resource,
  StepName,
  User,
} from "@/types";

export const useMe = () =>
  useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => (await api.get<User>("/auth/me")).data,
    retry: false,
  });

export const useProjects = () =>
  useQuery<ProjectSummary[]>({
    queryKey: ["projects"],
    queryFn: async () => (await api.get<ProjectSummary[]>("/projects")).data,
  });

export const useProject = (id: string | undefined) =>
  useQuery<Project>({
    queryKey: ["project", id],
    queryFn: async () => (await api.get<Project>(`/projects/${id}`)).data,
    enabled: !!id,
  });

export const useOnboarding = (id: string | undefined) =>
  useQuery<OnboardingStep[]>({
    queryKey: ["onboarding", id],
    queryFn: async () =>
      (await api.get<OnboardingStep[]>(`/projects/${id}/onboarding`)).data,
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      const ongoing = data.some(
        (s) => s.status === "PENDING" || s.status === "IN_PROGRESS",
      );
      return ongoing ? 2000 : false;
    },
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Project>) =>
      (await api.post<Project>("/projects", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useRetryStep = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (step: StepName) =>
      (
        await api.post<OnboardingStep[]>(
          `/projects/${projectId}/onboarding/${step}/retry`,
        )
      ).data,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["onboarding", projectId] }),
  });
};

export const useCompute = (id: string | undefined) =>
  useQuery<ComputeResource[]>({
    queryKey: ["aws", "compute", id],
    queryFn: async () =>
      (await api.get<ComputeResource[]>(`/projects/${id}/aws/compute`)).data,
    enabled: !!id,
  });

export const useDatabases = (id: string | undefined) =>
  useQuery<DatabaseResource[]>({
    queryKey: ["aws", "databases", id],
    queryFn: async () =>
      (await api.get<DatabaseResource[]>(`/projects/${id}/aws/databases`))
        .data,
    enabled: !!id,
  });

export const useS3 = (id: string | undefined) =>
  useQuery<S3Resource[]>({
    queryKey: ["aws", "s3", id],
    queryFn: async () => (await api.get<S3Resource[]>(`/projects/${id}/aws/s3`)).data,
    enabled: !!id,
  });
