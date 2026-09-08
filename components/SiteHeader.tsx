import { Monogram } from "./Monogram";

export function SiteHeader() {
  return (
    <header className="bg-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Monogram size={36} className="text-navy" />
          <span className="eyebrow text-navy">Shezia &amp; Haseeb</span>
        </div>
        <span className="eyebrow text-stone">Est. 2027</span>
      </div>
    </header>
  );
}
