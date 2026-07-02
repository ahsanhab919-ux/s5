import { Skeleton } from "@/components/ui/skeleton";

export default function StepsSkeleton({ count = 6 }) {
  return (
    <div className="mx-auto max-w-[1200px] px-2 py-8">
      {/* header skeletons (title / subtitle / short description) */}
      <div className="mb-6 flex flex-col items-center gap-2.5">
        <Skeleton className="h-12 w-[360px]" />
        <Skeleton className="h-9 w-[220px]" />
        <Skeleton className="h-[18px] w-[640px]" />
      </div>

      {/* grid of wrapper boxes only - each box is represented by a single rectangular skeleton */}
      <div className="grid grid-cols-12 gap-6">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="col-span-12 sm:col-span-6 md:col-span-4">
            {/* single wrapper box skeleton - matches the visual weight of the cards in your screenshot */}
            <Skeleton className="h-[180px] rounded-md" />
          </div>
        ))}
      </div>

      {/* CTA button skeleton */}
      <div className="mt-6 flex justify-center">
        <Skeleton className="h-[42px] w-[160px] rounded-lg" />
      </div>
    </div>
  );
}
