import { ActivityCardSkeleton } from "@/src/components/ActivityCard";
import { FeedSummarySkeleton } from "@/src/components/FeedSummary";

// Shown for the brief DB read before stored activities render.
export default function Loading() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <FeedSummarySkeleton label="Loading your activities…" />
      <ActivityCardSkeleton />
      <ActivityCardSkeleton />
      <ActivityCardSkeleton />
    </main>
  );
}
