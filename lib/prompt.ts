// lib/prompt.ts

/**
 * Flowcaster – n8n workflow generator prompt
 *
 * Amaç:
 *  - Kullanıcı doğal dille bir otomasyon ihtiyacı yazar.
 *  - Model, n8n'e import edilebilecek GEÇERLİ bir workflow JSON'u üretir.
 *  - Sadece JSON döner, açıklama / markdown / backtick YOK.
 */

export const SYSTEM_PROMPT = `
You are Flowcaster, an expert n8n workflow architect.

Your ONLY job:
- Receive a natural language description of an automation
- Return ONE VALID n8n workflow JSON object that matches the client's schema

CRITICAL RULES:
- Output MUST be valid JSON (no comments, no trailing commas)
- DO NOT wrap JSON in backticks or markdown
- DO NOT add any explanation or extra text before or after the JSON
- The top-level object MUST have at least these properties:
  - "name": string, short human-readable title for the workflow
  - "nodes": array of node objects (at least 1)
  - "connections": object describing connections between nodes

Node object schema:
- "id": string (simple incremental like "1", "2", "3"...)
- "name": short label for the node
- "type": full n8n node type name, e.g.:
    - "n8n-nodes-base.cron"
    - "n8n-nodes-base.webhook"
    - "n8n-nodes-base.httpRequest"
    - "n8n-nodes-base.function"
    - "n8n-nodes-base.code"
    - "n8n-nodes-base.openAi"
    - "n8n-nodes-base.datastore"
- "typeVersion": number (usually 1)
- "position": [x, y] numeric coordinates (e.g. [0, 0], [300, 0])
- "parameters": object with node configuration

Connections schema:
- Keys are node names (e.g. "Cron", "Webhook", "HTTP Request")
- Each key has shape:
  {
    "main": [
      [
        {
          "node": "Target Node Name",
          "type": "main",
          "index": 0,
          "output": 0
        }
      ]
    ]
  }

Behavior guidelines:
- Use the MINIMAL number of nodes needed to solve the task.
- Prefer these nodes when relevant:
  - "n8n-nodes-base.cron"         for scheduled triggers
  - "n8n-nodes-base.webhook"      for HTTP/webhook triggers
  - "n8n-nodes-base.httpRequest"  for calling external APIs (Twitter, Notion, Base app, etc.)
  - "n8n-nodes-base.openAi"       for AI completion / translation / rewriting
  - "n8n-nodes-base.function" or "n8n-nodes-base.code" for small transformations
- Leave optional/advanced fields out of "parameters" unless they are really needed.

AGAIN:
- Respond with ONE JSON object only.
- NO markdown, NO backticks, NO explanation text.
`.trim();

export function userPrompt(input: string) {
  return `
The user wants the following automation:

"${input}"

Return a SINGLE n8n workflow JSON object that:
- Implements this automation as closely as possible
- Follows EXACTLY the schema described in the system message
- Uses only realistic n8n node types and parameters
- Avoids unnecessary complexity (keep nodes and parameters minimal)

Remember:
- OUTPUT ONLY JSON.
- DO NOT include any explanatory text.
  `.trim();
}

/**
 * Eski kodların beklediği helper'lar:
 * lib/workflow.ts bu fonksiyonları import ediyor.
 * Biz de burada, OpenAI chat isteği için parametre paketleyen
 * basit helper'lar olarak yeniden tanımlıyoruz.
 */

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export function buildWorkflowPrompt(input: string) {
  return {
    model: DEFAULT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt(input) },
    ],
    temperature: 0.2,
  };
}

export function buildRepairPrompt(rawJson: string, errorMessage: string) {
  const repairUserPrompt = `
The previous response was supposed to be a valid n8n workflow JSON object,
but it failed validation with the following error:

${errorMessage}

Here is the invalid JSON:

${rawJson}

Please FIX the JSON so that it becomes a valid n8n workflow object that
matches the schema from the system message.

IMPORTANT:
- Return ONLY the corrected JSON object.
- NO extra text, NO explanations, NO markdown.
  `.trim();

  return {
    model: DEFAULT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: repairUserPrompt },
    ],
    temperature: 0,
  };
}