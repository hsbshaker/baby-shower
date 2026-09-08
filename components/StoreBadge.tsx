export function StoreBadge({ store }: { store: string }) {
  const isAmazon = store.toLowerCase() === "amazon";
  return (
    <span
      className={`eyebrow inline-flex items-center rounded-full border px-2.5 py-1 text-[0.6rem] backdrop-blur-sm ${
        isAmazon
          ? "border-navy/15 bg-ivory/90 text-navy"
          : "border-cognac/25 bg-ivory/90 text-cognac"
      }`}
    >
      {store}
    </span>
  );
}
