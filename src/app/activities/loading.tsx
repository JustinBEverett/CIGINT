import { ActivityCardSkeleton } from "@/src/components/ActivityCard";
import { FeedSummarySkeleton } from "@/src/components/FeedSummary";

// Shown while the page syncs with Strava, before any activity is known.
export default function Loading() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <section className="flex flex-col gap-2 rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-500" role="status">
          Loading your activities…
        </p>
        <FeedSummarySkeleton />
      </section>
      <ActivityCardSkeleton />
      <ActivityCardSkeleton />
      <ActivityCardSkeleton />
    </main>
  );
}
