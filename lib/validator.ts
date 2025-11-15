import type { ZodIssue } from "zod";
import { workflowSchema, type N8nWorkflow } from "./schema";

export class WorkflowValidationError extends Error {
  public readonly issues: ZodIssue[];

  constructor(message: string, issues: ZodIssue[]) {
    super(message);
    this.name = "WorkflowValidationError";
    this.issues = issues;
  }
}

export function validateWorkflow(payload: unknown): N8nWorkflow {
  const parsed = workflowSchema.safeParse(payload);

  if (!parsed.success) {
    throw new WorkflowValidationError("Generated workflow failed validation", [
      ...parsed.error.issues,
    ]);
  }

  return parsed.data;
}

export function formatIssues(issues: ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "(root)";
      return `- ${path}: ${issue.message}`;
    })
    .join("\n");
}
