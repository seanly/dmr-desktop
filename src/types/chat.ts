export type ToolCall = { name: string; arguments: string; result: string };

export type ApprovalEventItem = {
  tool: string;
  args: Record<string, unknown>;
  decision: { action: string; reason: string; risk: string };
};

export type ApprovalInfo = {
  id: string;
  type: "single" | "batch";
  tool: string;
  args?: Record<string, unknown>;
  decision: { action: string; reason: string; risk: string };
  requests?: ApprovalEventItem[];
  resolved?: boolean;
};

export type Message = { role: "user" | "assistant"; content: string; toolCalls?: ToolCall[]; approval?: ApprovalInfo };
export type TapeAnchorRow = { name: string; entry_id: number; date: string };
