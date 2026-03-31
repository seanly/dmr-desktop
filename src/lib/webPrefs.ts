/** Legacy single-key tape name (kept in sync when saving prefs) */
const TAPE_STORAGE_KEY = "dmr_tape";
/** JSON: { tape, afterEntryId } — survives refresh */
const WEB_PREFS_KEY = "dmr_web_prefs";

export function loadWebPrefs(): { tape: string; afterEntryId: number | null } {
  try {
    const raw = localStorage.getItem(WEB_PREFS_KEY);
    if (raw) {
      const o = JSON.parse(raw) as { tape?: unknown; afterEntryId?: unknown };
      const tape = typeof o.tape === "string" && o.tape.trim() ? o.tape.trim() : "web";
      let afterEntryId: number | null = null;
      if (typeof o.afterEntryId === "number" && o.afterEntryId > 0 && !Number.isNaN(o.afterEntryId)) {
        afterEntryId = o.afterEntryId;
      } else if (typeof o.afterEntryId === "string" && o.afterEntryId) {
        const n = Number.parseInt(o.afterEntryId, 10);
        if (!Number.isNaN(n) && n > 0) afterEntryId = n;
      }
      return { tape, afterEntryId };
    }
    const legacy = localStorage.getItem(TAPE_STORAGE_KEY);
    const tape = legacy && legacy.trim() ? legacy.trim() : "web";
    return { tape, afterEntryId: null };
  } catch {
    return { tape: "web", afterEntryId: null };
  }
}

export function saveWebPrefs(tape: string, afterEntryId: number | null) {
  try {
    localStorage.setItem(WEB_PREFS_KEY, JSON.stringify({ tape, afterEntryId }));
    localStorage.setItem(TAPE_STORAGE_KEY, tape);
  } catch {
    /* ignore */
  }
}
