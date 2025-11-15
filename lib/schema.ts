import { z } from "zod";

const positionSchema = z.tuple([z.number(), z.number()]);

const connectionTargetSchema = z.object({
  node: z.string().min(1, "Connection target node is required"),
  type: z.string().min(1).default("main"),
  index: z.number().int().nonnegative().default(0),
  output: z.number().int().nonnegative().default(0),
});

const connectionSchema = z.object({
  main: z
    .array(z.array(connectionTargetSchema))
    .default([])
    .describe("2D array describing n8n main connections"),
});

const credentialsSchema = z.record(
  z.string(),
  z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    data: z.unknown().optional(),
  }),
);

const nodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  typeVersion: z.number().int().gte(1).default(1),
  position: positionSchema,
  parameters: z.record(z.string(), z.unknown()).default({}),
  credentials: credentialsSchema.optional(),
  notes: z.string().optional(),
});

const workflowSettingsSchema = z
  .object({
    executionOrder: z.enum(["v1", "v2"]).optional(),
    timezone: z.string().optional(),
    saveManualExecutions: z.boolean().optional(),
  })
  .default({});

export const workflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  triggerMode: z.enum(["manual", "production"]).default("manual"),
  active: z.boolean().default(false),
  nodes: z.array(nodeSchema).min(1, "At least one node is required"),
  connections: z
    .record(z.string(), connectionSchema)
    .default({})
    .describe("Record keyed by node name, describing downstream connections"),
  settings: workflowSettingsSchema,
  versionId: z.string().optional(),
  meta: z
    .object({
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
  pinData: z.record(z.string(), z.unknown()).optional(),
});

export type N8nWorkflow = z.infer<typeof workflowSchema>;
