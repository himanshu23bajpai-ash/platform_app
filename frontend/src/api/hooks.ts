import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  ActivityOverview,
  AiOverview,
  Assignment,
  ComputeResource,
  CostMatrixRow,
  DatabaseResource,
  OnboardingStep,
  Project,
  ProjectCost,
  ProjectSummary,
  Role,
  S3Resource,
  SecretSummary,
  StepName,
  User,
} from "@/types";

export const useMe = () =>
  useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => (await api.get<User>("/auth/me")).data,
    retry: false,
  });

export const useProjects = (includeDeleted = false) =>
  useQuery<ProjectSummary[]>({
    queryKey: ["projects", includeDeleted],
    queryFn: async () =>
      (
        await api.get<ProjectSummary[]>("/projects", {
          params: { include_deleted: includeDeleted },
        })
      ).data,
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

export const useUpdateProject = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Project>) =>
      (await api.patch<Project>(`/projects/${projectId}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      await api.delete(`/projects/${projectId}`);
      return projectId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useRestoreProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) =>
      (await api.post<Project>(`/projects/${projectId}/restore`)).data,
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
      (await api.get<DatabaseResource[]>(`/projects/${id}/aws/databases`)).data,
    enabled: !!id,
  });

export const useS3 = (id: string | undefined) =>
  useQuery<S3Resource[]>({
    queryKey: ["aws", "s3", id],
    queryFn: async () => (await api.get<S3Resource[]>(`/projects/${id}/aws/s3`)).data,
    enabled: !!id,
  });

// --- Users ---
export const useUsers = () =>
  useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => (await api.get<User[]>("/users")).data,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; name: string; role: Role }) =>
      (await api.post<User>("/users", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<User>) =>
      (await api.patch<User>(`/users/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

// --- Assignments ---
export const useAssignments = (projectId: string | undefined) =>
  useQuery<Assignment[]>({
    queryKey: ["assignments", projectId],
    queryFn: async () =>
      (await api.get<Assignment[]>(`/projects/${projectId}/assignments`)).data,
    enabled: !!projectId,
  });

export const useAddAssignment = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      (
        await api.post<Assignment>(`/projects/${projectId}/assignments`, {
          user_id: userId,
        })
      ).data,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["assignments", projectId] }),
  });
};

export const useRemoveAssignment = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/projects/${projectId}/assignments/${userId}`);
      return userId;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["assignments", projectId] }),
  });
};

// --- Secrets ---
export const useSecrets = (projectId: string | undefined) =>
  useQuery<SecretSummary[]>({
    queryKey: ["secrets", projectId],
    queryFn: async () =>
      (await api.get<SecretSummary[]>(`/projects/${projectId}/secrets`)).data,
    enabled: !!projectId,
  });

export const useReadSecret = () =>
  useMutation({
    mutationFn: async ({ projectId, key }: { projectId: string; key: string }) =>
      (await api.get<{ name: string; value: string }>(`/projects/${projectId}/secrets/${key}`))
        .data,
  });

export const usePutSecret = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      value,
      description,
    }: {
      key: string;
      value: string;
      description: string;
    }) =>
      (
        await api.put<SecretSummary>(`/projects/${projectId}/secrets/${key}`, {
          value,
          description,
        })
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secrets", projectId] }),
  });
};

export const useDeleteSecret = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      await api.delete(`/projects/${projectId}/secrets/${key}`);
      return key;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secrets", projectId] }),
  });
};

// --- Cost ---
export const useCostMatrix = () =>
  useQuery<CostMatrixRow[]>({
    queryKey: ["cost", "matrix"],
    queryFn: async () => (await api.get<CostMatrixRow[]>("/cost/matrix")).data,
  });

export const useProjectCost = (projectId: string | undefined) =>
  useQuery<ProjectCost>({
    queryKey: ["cost", "project", projectId],
    queryFn: async () =>
      (await api.get<ProjectCost>(`/projects/${projectId}/cost`)).data,
    enabled: !!projectId,
  });

// --- AI / Activity ---
export const useProjectAi = (projectId: string | undefined) =>
  useQuery<AiOverview>({
    queryKey: ["ai", projectId],
    queryFn: async () => (await api.get<AiOverview>(`/projects/${projectId}/ai`)).data,
    enabled: !!projectId,
  });

export const useProjectActivity = (projectId: string | undefined) =>
  useQuery<ActivityOverview>({
    queryKey: ["activity", projectId],
    queryFn: async () =>
      (await api.get<ActivityOverview>(`/projects/${projectId}/activity`)).data,
    enabled: !!projectId,
  });
