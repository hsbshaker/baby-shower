import { FUND, venmoPayUrl } from "@/lib/fund";
import { Monogram } from "./Monogram";

export function CashFundCard() {
  return (
    <article className="pinstripe relative col-span-2 overflow-hidden rounded-sm border border-brass/40 bg-navy text-cream shadow-card lg:col-span-4">
      <div className="pointer-events-none absolute inset-2 rounded-sm border border-brass/20" />
      <div className="relative grid gap-8 px-6 py-8 sm:px-10 sm:py-10 md:grid-cols-[1fr_auto] md:items-center md:gap-12">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <Monogram size={30} className="text-brass" />
            <span className="eyebrow text-brass">Group gift</span>
          </div>
          <h3 className="mt-4 font-display text-3xl font-medium leading-tight sm:text-4xl">
            {FUND.title}
          </h3>
          <p className="mx-auto mt-3 max-w-md font-display text-lg italic leading-relaxed text-cream/75 md:mx-0">
            {FUND.blurb}
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 md:items-end">
          <div className="grid w-full max-w-xs grid-cols-4 gap-2 md:w-auto">
            {FUND.suggestedAmounts.map((amt) => (
              <a
                key={amt}
                href={venmoPayUrl(amt)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-cream/25 py-2.5 text-center font-display text-lg font-medium text-cream transition-colors hover:border-brass hover:bg-brass/15"
              >
                ${amt}
              </a>
            ))}
          </div>
          <a
            href={venmoPayUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="eyebrow inline-flex w-full max-w-xs items-center justify-center rounded-sm bg-cream py-3 text-[0.65rem] text-navy transition-colors hover:bg-brass hover:text-navy-deep md:w-auto md:px-8"
          >
            Give via Venmo
          </a>
          <a
            href={FUND.venmoProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.8rem] font-light text-cream/60 underline-offset-4 hover:text-cream hover:underline"
          >
            @{FUND.venmoHandle}
          </a>
        </div>
      </div>
    </article>
  );
}
