import { randomUUID } from "crypto";
import OpenAI from "openai";
import type { N8nWorkflow } from "./schema";
import { saveWorkflow } from "./store";
import {
  validateWorkflow,
  WorkflowValidationError,
  formatIssues,
} from "./validator";
import { buildRepairPrompt, buildWorkflowPrompt } from "./prompt";

type GenerateOptions = {
  maxAttempts?: number;
  signal?: AbortSignal;
  mock?: boolean;
};

type GenerateResult = {
  workflow: N8nWorkflow;
  raw: string;
  repairAttempted: boolean;
  mocked: boolean;
};

export type StoredWorkflowResult = GenerateResult & { id: string };

const DEFAULT_MODEL = process.env.OPENAI_AUTOMATION_MODEL?.trim() || "gpt-4o-mini";
const shouldMock =
  (process.env.MOCK_OPENAI ?? "").toLowerCase() === "true" ||
  process.env.NODE_ENV === "test";

let openaiClient: OpenAI | null = null;

function getOpenAI() {
  if (shouldMock) {
    return null;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

export async function generateWorkflowFromPrompt(
  userPrompt: string,
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const maxAttempts = options.maxAttempts ?? 2;

  if (options.mock || shouldMock) {
    const mock = buildMockWorkflow(userPrompt);
    return {
      workflow: mock,
      raw: JSON.stringify(mock, null, 2),
      repairAttempted: false,
      mocked: true,
    };
  }

  const client = getOpenAI();
  if (!client) {
    throw new Error("OpenAI client is not available");
  }

  const basePrompt = buildWorkflowPrompt(userPrompt);
  let attempt = 0;
  let lastError: WorkflowValidationError | Error | null = null;
  let transcript = convertMessages(basePrompt.messages);
  let lastRaw = "";

  while (attempt < maxAttempts) {
    const temperature = attempt === 0 ? 0.2 : 0.05;

    const completion = await client.chat.completions.create(
      {
        model: DEFAULT_MODEL,
        temperature,
        response_format: { type: "json_object" },
        messages: transcript,
      },
      options.signal ? { signal: options.signal } : undefined,
    );

    lastRaw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = stripCodeFences(lastRaw);
    let candidate: unknown;

    try {
      candidate = JSON.parse(cleaned);
    } catch (error) {
      lastError = new Error(
        `The model returned invalid JSON. ${error instanceof Error ? error.message : ""}`.trim(),
      );
      const repairPrompt = buildRepairPrompt(
        lastRaw,
        "JSON parse error. Ensure you return a single valid JSON object without trailing commas.",
      );
      transcript = convertMessages(repairPrompt.messages);
      attempt += 1;
      continue;
    }

    try {
      const workflow = validateWorkflow(candidate);
      return {
        workflow,
        raw: cleaned,
        repairAttempted: attempt > 0,
        mocked: false,
      };
    } catch (error) {
      if (error instanceof WorkflowValidationError) {
        lastError = error;
        const issueReport = formatIssues(error.issues);
        const repairPrompt = buildRepairPrompt(lastRaw, issueReport);
        transcript = convertMessages(repairPrompt.messages);
        attempt += 1;
        continue;
      }

      lastError = error instanceof Error ? error : new Error("Unknown error");
      break;
    }
  }

  throw lastError ?? new Error("Unable to generate workflow");
}

export async function generateAndStoreWorkflow(
  userPrompt: string,
  options: GenerateOptions = {},
): Promise<StoredWorkflowResult> {
  const result = await generateWorkflowFromPrompt(userPrompt, options);
  const id = randomUUID();
  saveWorkflow(id, result.workflow);

  return {
    id,
    ...result,
  };
}

function stripCodeFences(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/```json\s*/i, "").replace(/```$/, "").trim();
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  return trimmed;
}

function buildMockWorkflow(userPrompt: string): N8nWorkflow {
  const normalized = userPrompt.trim() || "Sample Flow";
  return {
    name: `Mock – ${normalized.slice(0, 32)}`,
    triggerMode: "manual",
    active: false,
    meta: {
      description: "Mock workflow returned because MOCK_OPENAI=true.",
      tags: ["mock", "flowcaster"],
    },
    nodes: [
      {
        id: "1",
        name: "Manual Trigger",
        type: "n8n-nodes-base.manualTrigger",
        typeVersion: 1,
        position: [0, 0],
        parameters: {},
      },
      {
        id: "2",
        name: "Log Prompt",
        type: "n8n-nodes-base.code",
        typeVersion: 1,
        position: [240, 0],
        parameters: {
          language: "javascript",
          code: `return [{ prompt: ${JSON.stringify(normalized)} }];`,
        },
      },
    ],
    connections: {
      "Manual Trigger": {
        main: [
          [
            {
              node: "Log Prompt",
              type: "main",
              index: 0,
              output: 0,
            },
          ],
        ],
      },
    },
    settings: {
      executionOrder: "v1",
      timezone: "UTC",
    },
  };
}

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

function convertMessages(messages: { role: "system" | "user" | "assistant"; content: string }[]): ChatMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}
