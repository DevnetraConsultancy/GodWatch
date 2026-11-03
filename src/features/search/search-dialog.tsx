"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CalendarDays, ListChecks, Loader2, Search, StickyNote, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/feedback";
import { search } from "@/server/actions/account";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/types/dto";

const OPEN_EVENT = "gw:open-search";
const ICONS: Record<SearchResult["kind"], LucideIcon> = { habit: ListChecks, note: StickyNote, date: CalendarDays };

export function openSearch(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function SearchTrigger() {
  return (
    <Button
      variant="ghost"
      onClick={openSearch}
      aria-label="Search (Ctrl K)"
      className="w-10 px-0 sm:w-auto sm:gap-3 sm:px-3"
    >
      <Search aria-hidden />
      <span className="hidden text-fg-subtle lg:inline">Search</span>
      <Kbd className="hidden lg:inline-flex">Ctrl K</Kbd>
    </Button>
  );
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; results: SearchResult[] }
  | { kind: "error"; message: string };

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [state, setState] = React.useState<State>({ kind: "idle" });
  const [active, setActive] = React.useState(0);
  const requestId = React.useRef(0);

  React.useEffect(() => {
    const show = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  React.useEffect(() => {
    const q = query.trim();
    if (!q) {
      setState({ kind: "idle" });
      return;
    }
    setState({ kind: "loading" });
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const res = await search({ q });
      if (id !== requestId.current) return;
      setActive(0);
      setState(res.ok ? { kind: "done", results: res.data } : { kind: "error", message: res.error });
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const results = state.kind === "done" ? state.results : [];

  const go = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) go(r);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgb(7_8_15/0.4)] backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          className="glass-strong fixed left-1/2 top-[12dvh] z-50 w-[calc(100%-32px)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl data-[state=open]:animate-pop-in focus:outline-none"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="size-5 shrink-0 text-fg-subtle" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={100}
              placeholder="Search habits, notes, or a date (2025-03-10)"
              className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-fg-subtle"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="search-results"
              aria-activedescendant={results[active] ? `search-${results[active]!.kind}-${results[active]!.id}` : undefined}
              aria-label="Search"
            />
            {state.kind === "loading" && <Loader2 className="size-4 animate-spin text-fg-subtle" aria-label="Searching" />}
          </div>

          <div className="scrollbar-thin max-h-[50dvh] overflow-y-auto p-2" aria-live="polite">
            {state.kind === "idle" && <p className="px-3 py-8 text-center text-sm text-fg-muted">Type to search your history.</p>}
            {state.kind === "error" && <p className="px-3 py-8 text-center text-sm text-danger">{state.message}</p>}
            {state.kind === "done" && results.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-fg-muted">No matches for &ldquo;{query.trim()}&rdquo;.</p>
            )}
            {results.length > 0 && (
              <ul id="search-results" role="listbox" aria-label="Results">
                {results.map((r, i) => {
                  const Icon = ICONS[r.kind];
                  return (
                    <li
                      key={`${r.kind}-${r.id}`}
                      id={`search-${r.kind}-${r.id}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5",
                        i === active && "bg-accent-soft"
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-accent-text" aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{r.title}</span>
                        <span className="block truncate text-xs text-fg-muted">{r.subtitle}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
