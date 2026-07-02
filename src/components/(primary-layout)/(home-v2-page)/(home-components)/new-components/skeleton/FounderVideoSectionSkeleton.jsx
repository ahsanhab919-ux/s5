import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function FounderVideoSectionSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto w-full max-w-[1400px] px-2 py-4 md:px-6 md:py-8"
    >
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        {/* Left - Video/Card skeleton */}
        <div>
          <div className="flex flex-col gap-2">
            <div
              className={cn(
                "relative overflow-hidden rounded-lg bg-transparent px-2 py-2",
                "shadow-[0_12px_30px_rgba(10,20,30,0.06)]",
              )}
            >
              {/* big rounded rectangle representing the video area */}
              <Skeleton className="h-[220px] rounded-xl sm:h-[320px] md:h-[360px]" />

              {/* centered circular play button skeleton (absolute) */}
              <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Skeleton className="h-16 w-16 rounded-full" />
              </div>
            </div>

            {/* small stats row under the video */}
            <div className="flex flex-row items-center gap-2">
              <Skeleton className="h-[18px] w-[120px]" />
              <Skeleton className="h-[18px] w-[90px]" />
              <div className="flex-1" />
            </div>
          </div>
        </div>

        {/* Right - Heading, paragraph, feature bullets skeleton */}
        <div>
          <div className="flex flex-col gap-3">
            {/* big heading lines */}
            <div className="flex flex-col gap-1">
              <Skeleton className="h-[42px] w-[80%] rounded" />
              <Skeleton className="h-[42px] w-[60%] rounded" />
            </div>

            {/* paragraph */}
            <div className="flex flex-col gap-1">
              <Skeleton className="h-[14px] w-[90%]" />
              <Skeleton className="h-[14px] w-[85%]" />
              <Skeleton className="h-[14px] w-[70%]" />
            </div>

            {/* three feature bullets */}
            <div className="mt-1 flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-row items-center gap-2">
                  <Skeleton className="h-[18px] w-[18px] rounded-full" />
                  <div className="w-full">
                    <Skeleton
                      className="h-[14px]"
                      style={{ width: `${40 + i * 15}%` }}
                    />
                    <Skeleton
                      className="mt-0.5 h-[12px]"
                      style={{ width: `${60 - i * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
