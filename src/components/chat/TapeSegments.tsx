/** Selected-anchor segment label (raw API list) */
export function BrowseSegmentLabel({ fromLabel, id }: { fromLabel: string; id?: string }) {
  return (
    <div id={id} className="mb-1 scroll-mt-4 rounded-md border border-border/50 bg-muted/20 px-3 py-1.5 text-center text-[11px] text-muted-foreground">
      <span className="font-semibold text-foreground/80">① Selected anchor</span> ({fromLabel}) · raw API order
    </div>
  );
}

/** Between selected-anchor browse segment and after-last-anchor segment */
export function BrowseToLiveContextDivider({ id }: { id?: string }) {
  return (
    <div
      id={id}
      className="relative my-3 scroll-mt-4 flex flex-col items-center gap-1 py-2"
      role="separator"
      aria-label="Tape after the last anchor, aligned with model context"
    >
      <div className="h-px w-full max-w-md bg-border" />
      <div className="rounded-md border border-dashed border-primary/30 bg-primary/4 px-3 py-1.5 text-center text-[11px] text-muted-foreground">
        <span className="font-semibold text-primary/90">② After last anchor</span> (raw API list · send / model context)
      </div>
    </div>
  );
}

/** After loaded tape history, before any message sent this session — shows where new turns will appear. */
export function NewMessagesLandingZone({ id }: { id?: string }) {
  return (
    <div
      id={id}
      className="mt-1 flex min-h-[88px] scroll-mt-4 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/35 bg-primary/4 px-4 py-5 text-center"
      aria-label="新消息将显示在此区域"
    >
      <span className="text-base leading-none text-primary/60" aria-hidden>
        ↓
      </span>
      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground/85">新消息将出现在这里</span>
        <br />
        After you send from the bottom, replies go to the same tape and appear in the{" "}
        <strong className="text-foreground/85">after last anchor</strong> context.
      </p>
    </div>
  );
}
