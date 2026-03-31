import type { Message, ToolCall } from "../types/chat";

const OUTLINE_USER_PREVIEW_LEN = 52;

export type ContextUsage = {
  promptTokens: number;
  completionTokens: number;
  contextBudget: number;
};

/** Selected-anchor history + after-last-anchor history concatenated (no UI dedup; overlaps may repeat). */
export function mergeTapeDisplayForLoading(
  browse: Message[],
  live: Message[],
  hasFromFilter: boolean,
): { display: Message[]; browsePrefixLength: number } {
  if (!hasFromFilter) {
    return { display: live, browsePrefixLength: 0 };
  }
  return { display: [...browse, ...live], browsePrefixLength: browse.length };
}

export function parseDataStream(text: string): { content: string; toolCalls: ToolCall[]; contextUsage: ContextUsage } {
  let content = "";
  const toolCalls: ToolCall[] = [];
  const contextUsage: ContextUsage = { promptTokens: 0, completionTokens: 0, contextBudget: 0 };

  for (const line of text.split("\n")) {
    if (line.startsWith("0:")) {
      const raw = line.slice(2);
      try {
        content += JSON.parse(raw);
      } catch {
        content += raw;
      }
    } else if (line.startsWith("2:")) {
      try {
        toolCalls.push(JSON.parse(line.slice(2)));
      } catch {
        /* skip */
      }
    } else if (line.startsWith("e:") || line.startsWith("d:")) {
      // plugin.go emits final usage in `e:`/`d:` JSON.
      const raw = line.slice(2);
      try {
        const obj = JSON.parse(raw) as any;
        const usage = obj?.usage;
        const pb = usage?.promptTokens;
        const cb = usage?.completionTokens;
        const budget = obj?.contextBudget;
        if (typeof pb === "number") contextUsage.promptTokens = pb;
        if (typeof cb === "number") contextUsage.completionTokens = cb;
        if (typeof budget === "number") contextUsage.contextBudget = budget;
      } catch {
        /* skip */
      }
    }
  }
  return { content, toolCalls, contextUsage };
}

export function extractSummary(name: string, args: string): string {
  try {
    const parsed = JSON.parse(args);
    if (name === "shell" && parsed.cmd) return parsed.cmd;
    if (parsed.path) return parsed.path;
    if (parsed.query) return parsed.query;
  } catch {
    /* ignore */
  }
  return "";
}

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function buildUserOutlineEntries(messages: Message[]): { index: number; label: string; ordinal: number }[] {
  const out: { index: number; label: string; ordinal: number }[] = [];
  let ord = 0;
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role !== "user") continue;
    ord += 1;
    const raw = messages[i].content.trim() || "(empty)";
    const label = raw.length > OUTLINE_USER_PREVIEW_LEN ? `${raw.slice(0, OUTLINE_USER_PREVIEW_LEN)}…` : raw;
    out.push({ index: i, label, ordinal: ord });
  }
  return out;
}
