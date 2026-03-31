export type ToolCall = { name: string; arguments: string; result: string };
export type Message = { role: "user" | "assistant"; content: string; toolCalls?: ToolCall[] };
export type TapeAnchorRow = { name: string; entry_id: number; date: string };
