/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  var __FLOWCASTER_WORKFLOW_STORE: Map<string, any> | undefined;
}

const WORKFLOW_STORE: Map<string, any> =
  globalThis.__FLOWCASTER_WORKFLOW_STORE ?? new Map<string, any>();

if (!globalThis.__FLOWCASTER_WORKFLOW_STORE) {
  globalThis.__FLOWCASTER_WORKFLOW_STORE = WORKFLOW_STORE;
}

export function saveWorkflow(id: string, workflow: any): void {
  WORKFLOW_STORE.set(id, workflow);
}

export function getWorkflow(id: string): any | null {
  return WORKFLOW_STORE.get(id) ?? null;
}
