import { Skeleton } from "@/components/ui/feedback";

export default function Loading() {
  return (
    <div className="container-page space-y-6 pt-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-[420px] w-full rounded-xl" />
    </div>
  );
}
