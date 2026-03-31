import { Anchor } from "lucide-react";

/** No anchor filter: single “after last anchor” window */
export function TapeSingleWindowHint({ anchorLabel }: { anchorLabel: string }) {
  return (
    <div className="mb-2 flex scroll-mt-4 items-start justify-center gap-2 rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-center text-[11px] leading-snug text-muted-foreground">
      <Anchor className="mt-0.5 size-3.5 shrink-0 text-primary/80" aria-hidden />
      <p>
        Tape entries after the last anchor
        <span className="text-foreground/75"> ({anchorLabel})</span>
        . Only this message is sent; the host continues from tape in this window.
      </p>
    </div>
  );
}

/** Anchor selected: browse segment + after-last-anchor segment */
export function TapeDualWindowHint({ fromLabel }: { fromLabel: string }) {
  return (
    <div className="mb-2 flex scroll-mt-4 items-start justify-center gap-2 rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-center text-[11px] leading-snug text-muted-foreground">
      <Anchor className="mt-0.5 size-3.5 shrink-0 text-primary/80" aria-hidden />
      <p>
        Two segments in raw API order: <span className="text-foreground/80">① Selected anchor</span> ({fromLabel});{" "}
        <span className="text-foreground/80">② After last anchor</span>
        (matches the model). Overlapping turns on tape may appear twice. Only one user message is sent; the host reads tape
        from the last anchor.
      </p>
    </div>
  );
}
