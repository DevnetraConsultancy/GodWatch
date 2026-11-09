"use client";

import * as React from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { getNote, saveNote } from "@/server/actions/entries";
import { formatDate } from "@/lib/dates";

type SaveState = "idle" | "saving" | "saved" | "error";
const MAX = 10_000;

/** Autosaving note for one day. */
export function NotesSheet({
  date,
  onClose,
  onSaved,
}: {
  date: string | null;
  onClose: () => void;
  onSaved: (date: string, hasNote: boolean) => void;
}) {
  const [content, setContent] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [save, setSave] = React.useState<SaveState>("idle");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = React.useRef<{ date: string; content: string } | null>(null);
  const loadSeq = React.useRef(0);

  const load = React.useCallback(async (d: string) => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setLoadError(null);
    const res = await getNote({ date: d });
    // A slower response for a day that is no longer open must not land here.
    if (seq !== loadSeq.current) return;
    setLoading(false);
    if (res.ok) setContent(res.data.content);
    else setLoadError(res.error);
  }, []);

  React.useEffect(() => {
    if (!date) return;
    setContent("");
    setSave("idle");
    void load(date);
  }, [date, load]);

  const flush = React.useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    setSave("saving");
    const res = await saveNote(job);
    if (res.ok) {
      setSave("saved");
      onSaved(job.date, res.data.hasNote);
    } else {
      pending.current = pending.current ?? job;
      setSave("error");
    }
  }, [onSaved]);

  const onChange = (value: string) => {
    if (!date) return;
    setContent(value);
    pending.current = { date, content: value };
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 800);
  };

  const close = () => {
    void flush();
    onClose();
  };

  const title = date ? formatDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "";

  return (
    <Dialog open={!!date} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Note for {title}</DialogTitle>
          <DialogDescription>Autosaves as you type.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : loadError ? (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-md bg-danger-soft p-3 text-sm text-danger">
            {loadError}
            <Button size="sm" variant="secondary" onClick={() => date && void load(date)}>
              Retry
            </Button>
          </div>
        ) : (
          <Textarea
            autoFocus
            value={content}
            maxLength={MAX}
            onChange={(e) => onChange(e.target.value)}
            placeholder="What happened today? What helped, what got in the way?"
            aria-label={`Note for ${title}`}
            className="min-h-48"
          />
        )}
        <div className="flex items-center justify-between text-xs text-fg-muted" aria-live="polite">
          <span className="flex items-center gap-1.5">
            {save === "saving" && (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden /> Saving
              </>
            )}
            {save === "saved" && (
              <>
                <Check className="size-3.5 text-success" aria-hidden /> Saved
              </>
            )}
            {save === "error" && (
              <span className="flex items-center gap-1.5 text-danger">
                <AlertCircle className="size-3.5" aria-hidden /> Not saved.
                <button type="button" className="font-medium underline" onClick={() => void flush()}>
                  Retry
                </button>
              </span>
            )}
          </span>
          <span>
            {content.length.toLocaleString()} / {MAX.toLocaleString()}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
