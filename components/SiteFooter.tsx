import { Monogram } from "./Monogram";

export function SiteFooter() {
  return (
    <footer className="pinstripe bg-navy-deep text-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-14 text-center sm:px-8">
        <Monogram size={44} className="text-brass" />
        <p className="font-display text-2xl italic text-cream/85">
          With love, Shezia &amp; Haseeb
        </p>
        <div className="rule-double w-12 text-brass" />
        <p className="eyebrow text-cream/45">Fairfax, Virginia &middot; February 2027</p>
      </div>
    </footer>
  );
}
