"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { taskNameSchema } from "@/lib/validation";

/** Inline "add a habit" form. Returns true from `onAdd` when the habit was created. */
export function AddHabit({
  onAdd,
  autoFocus,
  className,
}: {
  onAdd: (name: string) => Promise<boolean>;
  autoFocus?: boolean;
  className?: string;
}) {
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = taskNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid name");
      return;
    }
    setPending(true);
    const ok = await onAdd(parsed.data);
    setPending(false);
    if (ok) {
      setName("");
      setError(null);
    }
  };

  return (
    <form onSubmit={submit} className={className} noValidate>
      <div className="flex gap-2">
        <label htmlFor="new-habit" className="sr-only">
          New habit name
        </label>
        <Input
          id="new-habit"
          value={name}
          autoFocus={autoFocus}
          maxLength={100}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Add a habit, e.g. Read 20 pages"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "new-habit-error" : undefined}
          className="min-w-0 sm:w-72"
        />
        <Button type="submit" loading={pending}>
          {!pending && <Plus aria-hidden />}
          Add
        </Button>
      </div>
      {error && (
        <p id="new-habit-error" role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
