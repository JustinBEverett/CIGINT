import { ActivityCardSkeleton } from "@/src/components/ActivityCard";
import { FeedSummarySkeleton } from "@/src/components/FeedSummary";

// Shown while the page syncs with Strava, before any activity is known.
export default function Loading() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <section className="flex flex-col gap-2 rounded-lg bg-gray-50 p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" aria-hidden />
        <FeedSummarySkeleton />
      </section>
      <ActivityCardSkeleton />
      <ActivityCardSkeleton />
      <ActivityCardSkeleton />
    </main>
  );
}
