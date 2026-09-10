import { FUND, venmoPayUrl } from "@/lib/fund";
import { Monogram } from "./Monogram";

export function CashFundCard() {
  return (
    <article className="pinstripe relative col-span-2 overflow-hidden rounded-sm border border-brass/40 bg-navy text-cream shadow-card lg:col-span-4">
      <div className="pointer-events-none absolute inset-2 rounded-sm border border-brass/20" />
      <div className="relative grid gap-10 px-6 py-9 sm:px-10 sm:py-12 md:grid-cols-[minmax(0,1fr)_22rem] md:items-center md:gap-16 md:px-14 md:py-14">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <Monogram size={30} className="text-brass" />
            <span className="eyebrow text-brass">Group gift</span>
          </div>
          <h3 className="mt-5 font-display text-3xl font-medium leading-tight sm:text-4xl md:text-[2.75rem]">
            {FUND.title}
          </h3>
          <p className="mx-auto mt-4 max-w-md font-display text-lg italic leading-relaxed text-cream/75 sm:text-xl md:mx-0">
            {FUND.blurb}
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-col gap-4 md:mx-0 md:max-w-none">
          <p className="eyebrow text-center text-cream/50">Suggested amounts</p>
          <div className="grid grid-cols-4 gap-2.5">
            {FUND.suggestedAmounts.map((amt) => (
              <a
                key={amt}
                href={venmoPayUrl(amt)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-cream/25 py-3.5 text-center font-display text-xl font-medium text-cream transition-colors hover:border-brass hover:bg-brass/15"
              >
                ${amt}
              </a>
            ))}
          </div>
          <a
            href={venmoPayUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="eyebrow inline-flex w-full items-center justify-center rounded-sm bg-cream py-3.5 text-[0.65rem] text-navy transition-colors hover:bg-brass hover:text-navy-deep"
          >
            Give via Venmo
          </a>
          <a
            href={FUND.venmoProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-[0.8rem] font-light text-cream/60 underline-offset-4 hover:text-cream hover:underline"
          >
            @{FUND.venmoHandle}
          </a>
        </div>
      </div>
    </article>
  );
}
