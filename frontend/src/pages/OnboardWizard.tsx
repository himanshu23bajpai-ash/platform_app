import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateProject } from "@/api/hooks";
import { neutral, purple, semantic, surface, text } from "@/colors";

interface FormState {
  name: string;
  description: string;
  repo_url: string;
  repo_branch: string;
  language: string;
  aws_account_id: string;
  aws_region: string;
  compute_type: "ecs" | "eks" | "lambda";
}

const initial: FormState = {
  name: "",
  description: "",
  repo_url: "",
  repo_branch: "main",
  language: "python",
  aws_account_id: "",
  aws_region: "us-east-1",
  compute_type: "ecs",
};

const STEPS = ["Repository", "AWS Account", "CI/CD", "Compute"];

export function OnboardWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const create = useCreateProject();
  const navigate = useNavigate();

  const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    const project = await create.mutateAsync(form);
    navigate(`/projects/${project.id}`);
  };

  return (
    <div>
      <h2>Onboard a project</h2>
      <ol style={{ display: "flex", gap: 8, padding: 0, listStyle: "none", marginBottom: 24 }}>
        {STEPS.map((label, i) => (
          <li
            key={label}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 6,
              background: i === step ? purple[800] : i < step ? semantic.success.light : neutral[200],
              color: i === step ? text.onPrimary : i < step ? semantic.success.dark : text.secondary,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <div style={{ background: "white", padding: 24, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        {step === 0 && (
          <>
            <Field label="Project name *">
              <input value={form.name} onChange={update("name")} style={inputStyle} required />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={update("description")} style={{ ...inputStyle, height: 60 }} />
            </Field>
            <Field label="Repository URL">
              <input value={form.repo_url} onChange={update("repo_url")} placeholder="https://github.com/org/repo" style={inputStyle} />
            </Field>
            <Field label="Branch">
              <input value={form.repo_branch} onChange={update("repo_branch")} style={inputStyle} />
            </Field>
            <Field label="Language">
              <input value={form.language} onChange={update("language")} style={inputStyle} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="AWS Account ID">
              <input value={form.aws_account_id} onChange={update("aws_account_id")} placeholder="123456789012" style={inputStyle} />
            </Field>
            <Field label="AWS Region">
              <input value={form.aws_region} onChange={update("aws_region")} style={inputStyle} />
            </Field>
          </>
        )}

        {step === 2 && (
          <p style={{ color: text.secondary }}>
            A default CI/CD pipeline will be created for <strong>{form.name || "your project"}</strong>.
            No further configuration is required for v1.
          </p>
        )}

        {step === 3 && (
          <Field label="Compute type">
            <select value={form.compute_type} onChange={update("compute_type")} style={inputStyle}>
              <option value="ecs">ECS</option>
              <option value="eks">EKS</option>
              <option value="lambda">Lambda</option>
            </select>
          </Field>
        )}

        <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
          <button onClick={() => setStep(step - 1)} disabled={step === 0} style={btnSecondary}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !form.name}
              style={btnPrimary}
            >
              Next
            </button>
          ) : (
            <button onClick={submit} disabled={create.isPending || !form.name} style={btnPrimary}>
              {create.isPending ? "Creating..." : "Onboard"}
            </button>
          )}
        </div>
        {create.error && (
          <p style={{ color: semantic.error.dark, marginTop: 12 }}>
            {(create.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: "block", marginBottom: 12 }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: neutral[700], marginBottom: 4 }}>{label}</div>
    {children}
  </label>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: `1px solid ${neutral[300]}`,
  borderRadius: 6,
  fontSize: 14,
};

const btnPrimary: React.CSSProperties = {
  padding: "8px 16px",
  background: purple[800],
  color: text.onPrimary,
  border: 0,
  borderRadius: 6,
  fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  padding: "8px 16px",
  background: surface.border,
  color: neutral[700],
  border: 0,
  borderRadius: 6,
  fontWeight: 600,
  cursor: "pointer",
};
