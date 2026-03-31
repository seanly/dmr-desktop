import { useLayoutEffect, type RefObject, type KeyboardEvent } from "react";

export function AutoResizeTextarea({
  value,
  onChange,
  onKeyDown,
  disabled,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  disabled: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const measured = Math.max(40, el.scrollHeight);
    el.style.height = `${Math.min(measured, 200)}px`;
  }, [value, inputRef]);

  return (
    <textarea
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Type a message..."
      disabled={disabled}
      className="min-h-[40px] w-full resize-none border-none bg-transparent shadow-none outline-none focus-visible:ring-0 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/50"
      rows={1}
      autoFocus
    />
  );
}
