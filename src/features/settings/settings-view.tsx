"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Bell, Download, FileSpreadsheet, FileText, Globe, Palette, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Label } from "@/components/ui/field";
import { Switch } from "@/components/ui/primitives";
import { updateSettings } from "@/server/actions/account";
import { deleteTask, updateTask } from "@/server/actions/tasks";
import { TASK_COLORS, TASK_COLOR_NAMES, APP_NAME, type TaskColor } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { reminderTimeSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/types/dto";

interface Props {
  settings: { dailyReminderEnabled: boolean; dailyReminderTime: string; defaultTaskColor: string };
  timeZone: string;
  archived: TaskDTO[];
  hasHabits: boolean;
}

type Permission = NotificationPermission | "unsupported";

export function SettingsView({ settings, timeZone, archived: initialArchived, hasHabits }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(settings.dailyReminderEnabled);
  const [time, setTime] = React.useState(settings.dailyReminderTime);
  const [color, setColor] = React.useState(settings.defaultTaskColor);
  const [saving, setSaving] = React.useState(false);
  const [timeError, setTimeError] = React.useState<string | null>(null);
  const [permission, setPermission] = React.useState<Permission>("default");
  const [archived, setArchived] = React.useState(initialArchived);
  const [toDelete, setToDelete] = React.useState<TaskDTO | null>(null);
  const [exporting, setExporting] = React.useState<"csv" | "pdf" | null>(null);

  React.useEffect(() => {
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  const dirty =
    enabled !== settings.dailyReminderEnabled || time !== settings.dailyReminderTime || color !== settings.defaultTaskColor;

  const toggleReminder = async (next: boolean) => {
    if (next && permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error("Notifications are blocked", { description: "Allow notifications for this site in your browser to get reminders." });
        return;
      }
    }
    setEnabled(next);
  };

  const save = async () => {
    const parsed = reminderTimeSchema.safeParse(time);
    if (!parsed.success) {
      setTimeError(parsed.error.issues[0]?.message ?? "Invalid time");
      return;
    }
    setSaving(true);
    const res = await updateSettings({ dailyReminderEnabled: enabled, dailyReminderTime: time, defaultTaskColor: color });
    setSaving(false);
    if (res.ok) {
      toast.success("Settings saved");
      router.refresh();
    } else toast.error("Couldn't save settings", { description: res.error });
  };

  const restore = async (task: TaskDTO) => {
    setArchived((prev) => prev.filter((t) => t.id !== task.id));
    const res = await updateTask({ taskId: task.id, archived: false });
    if (res.ok) toast.success(`Restored ${task.name}`, { description: "It's back on your dashboard." });
    else {
      setArchived((prev) => [...prev, task]);
      toast.error("Couldn't restore the habit", { description: res.error });
    }
  };

  const remove = async () => {
    const task = toDelete;
    setToDelete(null);
    if (!task) return;
    setArchived((prev) => prev.filter((t) => t.id !== task.id));
    const res = await deleteTask({ taskId: task.id });
    if (res.ok) toast.success(`Deleted ${task.name}`);
    else {
      setArchived((prev) => [...prev, task]);
      toast.error("Couldn't delete the habit", { description: res.error });
    }
  };

  const exportCsv = async () => {
    setExporting("csv");
    try {
      const res = await fetch("/api/export?format=csv");
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Export failed");
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "god-watch.csv";
      downloadBlob(blob, name);
    } catch (error) {
      toast.error("Export failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setExporting(null);
    }
  };

  const exportPdf = async () => {
    setExporting("pdf");
    try {
      const res = await fetch("/api/export?format=json");
      const body = (await res.json()) as { rows?: { date: string; task: string; status: string }[]; generatedFor?: string; error?: string };
      if (!res.ok || !body.rows) throw new Error(body.error ?? "Export failed");
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const doc = new jsPDF({ orientation: "portrait" });
      doc.setFontSize(18);
      doc.text(`${APP_NAME} report`, 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(`Last 365 days, up to ${body.generatedFor ? formatDate(body.generatedFor, { month: "long", day: "numeric", year: "numeric" }) : "today"}`, 14, 25);
      autoTable(doc, {
        head: [["Date", "Habit", "Status"]],
        body: body.rows.map((r) => [r.date, r.task, r.status]),
        startY: 31,
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 246, 250] },
      });
      doc.save(`god-watch-${body.generatedFor ?? "export"}.pdf`);
    } catch (error) {
      toast.error("Export failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="container-page max-w-3xl space-y-6 pt-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-fg-muted">Preferences, archived habits and your data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Bell className="size-4 text-accent-text" aria-hidden /> Daily reminder
          </CardTitle>
          <CardDescription>
            A browser notification at your chosen time. It works while {APP_NAME} is open in a tab or installed as an app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="reminder-enabled">Remind me every day</Label>
              {permission === "denied" && (
                <p className="text-xs text-danger">Notifications are blocked for this site in your browser settings.</p>
              )}
              {permission === "unsupported" && <p className="text-xs text-fg-muted">This browser doesn&apos;t support notifications.</p>}
            </div>
            <Switch
              id="reminder-enabled"
              checked={enabled}
              disabled={permission === "denied" || permission === "unsupported"}
              onCheckedChange={(v) => void toggleReminder(v)}
            />
          </div>
          <div className="space-y-2 sm:max-w-48">
            <Label htmlFor="reminder-time">Time</Label>
            <Input
              id="reminder-time"
              type="time"
              value={time}
              disabled={!enabled}
              onChange={(e) => {
                setTime(e.target.value);
                setTimeError(null);
              }}
              aria-invalid={timeError ? true : undefined}
              aria-describedby={timeError ? "reminder-time-error" : undefined}
            />
            {timeError && (
              <p id="reminder-time-error" role="alert" className="text-xs font-medium text-danger">
                {timeError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Palette className="size-4 text-accent-text" aria-hidden /> Default habit colour
          </CardTitle>
          <CardDescription>New habits start with this colour. You can change any habit from its menu.</CardDescription>
        </CardHeader>
        <CardContent>
          <div role="radiogroup" aria-label="Default habit colour" className="flex flex-wrap gap-2">
            {TASK_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={TASK_COLOR_NAMES[c as TaskColor]}
                onClick={() => setColor(c)}
                className={cn(
                  "size-9 rounded-full transition-transform hover:scale-105",
                  color === c && "ring-2 ring-ring ring-offset-2 ring-offset-bg"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <p className="flex items-center gap-1.5 text-xs text-fg-muted">
            <Globe className="size-3.5" aria-hidden /> Your day follows {timeZone}, detected from this browser.
          </p>
          <Button onClick={() => void save()} loading={saving} disabled={!dirty}>
            Save changes
          </Button>
        </CardFooter>
      </Card>

      <Card id="archived">
        <CardHeader>
          <CardTitle>
            <Archive className="size-4 text-accent-text" aria-hidden /> Archived habits
          </CardTitle>
          <CardDescription>Archived habits stop counting from the day you archived them. Their history is kept.</CardDescription>
        </CardHeader>
        <CardContent>
          {archived.length === 0 ? (
            <EmptyState icon={Archive} title="No archived habits" description="Archive a habit from its menu on the dashboard." className="py-6" />
          ) : (
            <ul className="divide-y">
              {archived.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} aria-hidden />
                    <span className="truncate text-sm font-medium">{t.name}</span>
                    {t.archivedOn && <span className="text-xs text-fg-subtle">since {formatDate(t.archivedOn, { month: "short", day: "numeric", year: "numeric" })}</span>}
                  </span>
                  <span className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => void restore(t)}>
                      <ArchiveRestore aria-hidden /> Restore
                    </Button>
                    <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => setToDelete(t)}>
                      <Trash2 aria-hidden /> Delete
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Download className="size-4 text-accent-text" aria-hidden /> Export your data
          </CardTitle>
          <CardDescription>The last 365 days of every habit, one row per habit per day.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="secondary" disabled={!hasHabits || exporting !== null} loading={exporting === "csv"} onClick={() => void exportCsv()}>
            {exporting !== "csv" && <FileSpreadsheet aria-hidden />} Export CSV
          </Button>
          <Button variant="secondary" disabled={!hasHabits || exporting !== null} loading={exporting === "pdf"} onClick={() => void exportPdf()}>
            {exporting !== "pdf" && <FileText aria-hidden />} Export PDF
          </Button>
          {!hasHabits && <p className="w-full text-xs text-fg-muted">Add a habit first; there is nothing to export yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Shield className="size-4 text-accent-text" aria-hidden /> Security
          </CardTitle>
          <CardDescription>
            You sign in with Google; {APP_NAME} never sees your password. Sessions last 30 days. Only you can see your data.
          </CardDescription>
        </CardHeader>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete?.name ?? "habit"}?`}
        description="This permanently deletes the habit and its entire history. This can't be undone."
        confirmLabel="Delete forever"
        destructive
        onConfirm={() => void remove()}
      />
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
