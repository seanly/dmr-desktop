import { useState, useRef, useCallback, useEffect, useMemo, type KeyboardEvent } from "react";
import { NEW_TAPE_SELECT_VALUE, NEW_HANDOFF_SELECT_VALUE } from "../constants";
import { loadWebPrefs, saveWebPrefs } from "../lib/webPrefs";
import { mergeTapeDisplayForLoading, parseDataStream, type ContextUsage } from "../lib/chatUtils";
import type { Message, ApprovalInfo, TapeAnchorRow } from "../types/chat";

/** Parse approval reply: y/s/a/n [// comment], or batch indices like 1,3,5 */
function parseApprovalReply(input: string, batchSize?: number): { choice: number; comment?: string; approved?: number[] } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split("//").map((s) => s.trim());
  const command = parts[0].toLowerCase();
  const comment = parts.length > 1 ? parts.slice(1).join("//").trim() : undefined;

  // Batch: numeric indices like "1,3,5" or "1-3"
  if (batchSize && /^[\d,\s-]+$/.test(command)) {
    const approved: number[] = [];
    for (const seg of command.split(",")) {
      const range = seg.trim().split("-");
      if (range.length === 2) {
        const start = parseInt(range[0], 10) - 1;
        const end = parseInt(range[1], 10) - 1;
        for (let i = start; i <= end; i++) {
          if (i >= 0 && i < batchSize) approved.push(i);
        }
      } else {
        const idx = parseInt(seg.trim(), 10) - 1;
        if (idx >= 0 && idx < batchSize) approved.push(idx);
      }
    }
    return { choice: 1, approved, comment };
  }

  if (command === "y") return { choice: 1, comment };
  if (command === "s") return { choice: 2, comment };
  if (command === "a") return { choice: 3, comment };
  if (command === "n") return { choice: 0, comment };
  return null;
}

export function useTapeChatSession() {
  const [user, setUser] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tapeName, setTapeName] = useState(() => loadWebPrefs().tape);
  const [tapeList, setTapeList] = useState<string[]>([]);
  const [historyAfterEntryId, setHistoryAfterEntryId] = useState<number | null>(() => loadWebPrefs().afterEntryId);
  const [anchors, setAnchors] = useState<TapeAnchorRow[]>([]);
  const [loadedHistoryCount, setLoadedHistoryCount] = useState(0);
  const [browsePrefixLength, setBrowsePrefixLength] = useState(0);
  const [contextUsage, setContextUsage] = useState<ContextUsage>({ promptTokens: 0, completionTokens: 0, contextBudget: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Dialog states
  const [showCreateTapeDialog, setShowCreateTapeDialog] = useState(false);
  const [showCreateHandoffDialog, setShowCreateHandoffDialog] = useState(false);
  const [showTapeSelectDialog, setShowTapeSelectDialog] = useState(false);
  const [showAnchorSelectDialog, setShowAnchorSelectDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (r.status === 401) {
          setAuthEnabled(true);
          setUser(null);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          if (data.username) {
            setUser(data.username);
            setAuthEnabled(true);
          } else {
            setUser("");
            setAuthEnabled(false);
          }
        }
      })
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    saveWebPrefs(tapeName, historyAfterEntryId);
  }, [tapeName, historyAfterEntryId]);

  const loadTapes = useCallback(() => {
    fetch("/api/tapes")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("list tapes failed"))))
      .then((data: { tapes?: string[] }) => {
        if (Array.isArray(data.tapes)) setTapeList(data.tapes);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (authEnabled && user == null) return;
    loadTapes();
  }, [authChecked, authEnabled, user, loadTapes]);

  const loadAnchors = useCallback(() => {
    fetch(`/api/tapes/${encodeURIComponent(tapeName)}/anchors`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("anchors failed"))))
      .then((data: { anchors?: TapeAnchorRow[] }) => {
        setAnchors(Array.isArray(data.anchors) ? data.anchors : []);
      })
      .catch(() => setAnchors([]));
  }, [tapeName]);

  useEffect(() => {
    if (!authChecked) return;
    if (authEnabled && user == null) return;
    loadAnchors();
  }, [authChecked, authEnabled, user, loadAnchors]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // SSE: listen for approval events and inject as temporary messages
  useEffect(() => {
    if (!authChecked) return;
    if (authEnabled && user == null) return;

    // Fetch any existing pending approvals (survives page refresh)
    fetch("/api/approvals/pending")
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((data: { events?: ApprovalInfo[] }) => {
        if (Array.isArray(data.events) && data.events.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.filter((m) => m.approval).map((m) => m.approval!.id));
            const newApprovals = data.events!
              .filter((e) => !existingIds.has(e.id))
              .map((e): Message => ({ role: "assistant", content: "", approval: e }));
            return newApprovals.length > 0 ? [...prev, ...newApprovals] : prev;
          });
        }
      })
      .catch(() => {});

    const es = new EventSource("/api/approvals");
    es.addEventListener("approval", (e) => {
      const event: ApprovalInfo = JSON.parse((e as MessageEvent).data);
      setMessages((prev) => {
        // Deduplicate: skip if already present
        if (prev.some((m) => m.approval?.id === event.id)) return prev;
        return [...prev, { role: "assistant", content: "", approval: event }];
      });
    });
    return () => es.close();
  }, [authChecked, authEnabled, user]);

  // Load history: optional selected anchor + always after last anchor; concat without dedup
  useEffect(() => {
    if (!authChecked) return;
    if (authEnabled && user == null) return;

    setMessages([]);
    setLoadedHistoryCount(0);
    setBrowsePrefixLength(0);

    const baseQ = new URLSearchParams({ tape: tapeName });
    const fetchLive = (): Promise<Message[]> =>
      fetch(`/api/history?${baseQ.toString()}`)
        .then((r) => r.json())
        .then((data: { messages?: Message[] }) => (Array.isArray(data.messages) ? data.messages : []));

    const hasFrom =
      historyAfterEntryId != null && historyAfterEntryId > 0 && !Number.isNaN(historyAfterEntryId);

    if (!hasFrom) {
      fetchLive()
        .then((live) => {
          setMessages(live);
          setLoadedHistoryCount(live.length);
          setBrowsePrefixLength(0);
        })
        .catch(() => {
          setMessages([]);
          setLoadedHistoryCount(0);
          setBrowsePrefixLength(0);
        });
      return;
    }

    const browseQ = new URLSearchParams({ tape: tapeName, after_entry_id: String(historyAfterEntryId) });
    const fetchBrowse = (): Promise<Message[]> =>
      fetch(`/api/history?${browseQ.toString()}`)
        .then((r) => r.json())
        .then((data: { messages?: Message[] }) => (Array.isArray(data.messages) ? data.messages : []));

    Promise.all([fetchBrowse(), fetchLive()])
      .then(([browse, live]) => {
        const { display, browsePrefixLength: blen } = mergeTapeDisplayForLoading(browse, live, true);
        setMessages(display);
        setLoadedHistoryCount(display.length);
        setBrowsePrefixLength(blen);
      })
      .catch(() => {
        setMessages([]);
        setLoadedHistoryCount(0);
        setBrowsePrefixLength(0);
      });
  }, [tapeName, historyAfterEntryId, authChecked, authEnabled, user]);

  const anchorWindowLabel = useMemo(() => {
    if (historyAfterEntryId == null || historyAfterEntryId <= 0 || Number.isNaN(historyAfterEntryId)) {
      return "Default · after last anchor";
    }
    const row = anchors.find((a) => a.entry_id === historyAfterEntryId);
    return row
      ? `Anchor #${row.entry_id} · ${row.name || "(unnamed)"}`
      : `Anchor entry #${historyAfterEntryId}`;
  }, [anchors, historyAfterEntryId]);

  const createTape = useCallback((name: string) => {
    fetch("/api/tapes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.text()) || r.statusText);
        return r.json();
      })
      .then(() => {
        loadTapes();
        setHistoryAfterEntryId(null);
        setTapeName(name);
      })
      .catch((e) => setErrorDialog({ open: true, message: String(e) }));
  }, [loadTapes]);

  const createHandoffAnchor = useCallback((name: string) => {
    fetch(`/api/tapes/${encodeURIComponent(tapeName)}/handoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, state: { source: "web" } }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.text()) || r.statusText);
        return r.json() as Promise<{ entry_id?: number }>;
      })
      .then((data) => {
        loadAnchors();
        if (typeof data.entry_id === "number") {
          setHistoryAfterEntryId(data.entry_id);
        }
      })
      .catch((e) => setErrorDialog({ open: true, message: String(e) }));
  }, [tapeName, loadAnchors]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    // Check for pending approval — intercept reply (allowed even while loading)
    const pendingApproval = [...messages].reverse().find((m) => m.approval && !m.approval.resolved);
    if (pendingApproval?.approval) {
      const ap = pendingApproval.approval;
      const batchSize = ap.type === "batch" && ap.requests ? ap.requests.length : undefined;
      const parsed = parseApprovalReply(text, batchSize);

      // Show user reply in chat
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setInput("");

      const markResolved = (id: string) =>
        setMessages((prev) =>
          prev.map((m) =>
            m.approval?.id === id ? { ...m, approval: { ...m.approval, resolved: true } } : m,
          ),
        );

      if (parsed) {
        try {
          const resp = await fetch(`/api/approve/${ap.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ choice: parsed.choice, comment: parsed.comment, approved: parsed.approved }),
          });
          if (resp.ok) {
            markResolved(ap.id);
          }
        } catch (err) {
          setMessages((prev) => [...prev, { role: "assistant", content: `Approval error: ${err}` }]);
        }
      } else {
        // Unrecognized input — treat as deny
        try {
          await fetch(`/api/approve/${ap.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ choice: 0, comment: text }),
          });
          markResolved(ap.id);
        } catch { /* ignore */ }
      }
      inputRef.current?.focus();
      return;
    }

    // Normal chat — block while loading
    if (loading) return;

    const userMsg: Message = { role: "user", content: text };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setLoading(true);
    try {
      const chatBody = { tape: tapeName, messages: [{ role: "user" as const, content: text }] };
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatBody),
      });
      const body = await resp.text();
      if (!resp.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `请求失败 (${resp.status}): ${body.slice(0, 500) || resp.statusText}`,
          },
        ]);
        return;
      }
      const { content, toolCalls, contextUsage: usage } = parseDataStream(body);
      setContextUsage(usage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: content || "No response", toolCalls: toolCalls.length > 0 ? toolCalls : undefined },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages, tapeName]);

  const handleTapeChange = useCallback(
    (value: string) => {
      if (value === NEW_TAPE_SELECT_VALUE) {
        setShowCreateTapeDialog(true);
        return;
      }
      setHistoryAfterEntryId(null);
      setTapeName(value);
    },
    [],
  );

  const handleAnchorChange = useCallback(
    (value: string | number | null) => {
      if (value === NEW_HANDOFF_SELECT_VALUE) {
        setShowCreateHandoffDialog(true);
        return;
      }
      if (value === "" || value === null) {
        setHistoryAfterEntryId(null);
        return;
      }
      const n = typeof value === "number" ? value : Number.parseInt(value, 10);
      setHistoryAfterEntryId(Number.isNaN(n) ? null : n);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage],
  );

  const isEmpty = messages.length === 0 && !loading;
  const tapeOptions = useMemo(() => Array.from(new Set([...tapeList, tapeName])).sort(), [tapeList, tapeName]);
  const hasSession = loadedHistoryCount > 0 && messages.length > loadedHistoryCount;
  const showLanding =
    loadedHistoryCount > 0 && messages.length > 0 && messages.length === loadedHistoryCount && !loading;
  const tapeReadOnly = tapeName !== "web" && !tapeName.startsWith("web:");

  const suggestedHandoffName = useMemo(
    () => `web:${new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15)}`,
    [],
  );

  const hasPendingApproval = messages.some((m) => !!m.approval && !m.approval.resolved);

  return {
    user,
    setUser,
    authChecked,
    authEnabled,
    messages,
    input,
    setInput,
    loading,
    tapeName,
    tapeOptions,
    historyAfterEntryId,
    anchors,
    loadedHistoryCount,
    browsePrefixLength,
    contextUsage,
    scrollRef,
    inputRef,
    loadTapes,
    loadAnchors,
    anchorWindowLabel,
    handleTapeChange,
    handleAnchorChange,
    sendMessage,
    handleKeyDown,
    isEmpty,
    hasSession,
    showLanding,
    tapeReadOnly,
    hasPendingApproval,
    // Dialog states
    showCreateTapeDialog,
    setShowCreateTapeDialog,
    showCreateHandoffDialog,
    setShowCreateHandoffDialog,
    showTapeSelectDialog,
    setShowTapeSelectDialog,
    showAnchorSelectDialog,
    setShowAnchorSelectDialog,
    errorDialog,
    setErrorDialog,
    createTape,
    createHandoffAnchor,
    suggestedHandoffName,
  };
}
