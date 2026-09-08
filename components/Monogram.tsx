export function Monogram({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full border border-brass/70 font-display font-medium leading-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.52 }}
    >
      S
    </span>
  );
}
