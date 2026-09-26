type ActivityLocationProps = {
  location: Promise<string | null>;
  // Shown instead when there's no place name, so the line still says
  // something next to the sport icon.
  sportLabel: string;
};

export default async function ActivityLocation({
  location,
  sportLabel,
}: ActivityLocationProps) {
  const name = await location;
  if (!name) return <span>{sportLabel}</span>;

  return (
    <span>
      <span className="sr-only">{sportLabel} in </span>
      {name}
    </span>
  );
}

export function ActivityLocationSkeleton() {
  return (
    <span
      className="inline-block h-[1em] w-32 animate-pulse rounded bg-gray-100"
      aria-hidden
    />
  );
}
