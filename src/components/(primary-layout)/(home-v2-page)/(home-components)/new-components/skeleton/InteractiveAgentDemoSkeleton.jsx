import { Skeleton } from "@/components/ui/skeleton";

export default function AgentLiveSkeleton({ agents = 3 }) {
  return (
    <div className="mx-auto max-w-[1200px] px-3 py-16">
      {/* Page title */}
      <div className="mb-10 flex flex-col items-center gap-1">
        <Skeleton className="h-14 w-[360px]" />
        <Skeleton className="h-5 w-[520px]" />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[5fr_7fr] md:items-start">
        {/* Left column: agent list + examples */}
        <div className="flex flex-col gap-2">
          {/* Highlighted agent card skeleton */}
          <Skeleton className="h-[72px] rounded-lg shadow-sm" />

          {/* Other agent items (each just a wrapper) */}
          {Array.from({ length: Math.max(0, agents - 1) }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}

          {/* Examples label */}
          <Skeleton className="mt-2 h-[18px] w-40" />

          {/* Example rows */}
          <div className="flex flex-col gap-1">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>

          {/* CTA */}
          <div className="mt-2 flex justify-start">
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* Right column: agent panel */}
        <div className="flex flex-col gap-2 rounded-lg border p-2 shadow-sm">
          {/* Panel header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-14 w-[360px] rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>

          {/* Thin divider mimic */}
          <Skeleton className="h-1.5 w-full rounded" />

          {/* Input area (large) */}
          <Skeleton className="h-36 rounded-lg" />

          {/* Try button */}
          <div className="flex justify-end">
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
