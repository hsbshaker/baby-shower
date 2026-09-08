export function Welcome() {
  return (
    <section className="pinstripe bg-navy text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-12 sm:px-8 md:grid-cols-[5fr_7fr] md:items-center md:gap-16 md:pb-24 md:pt-20">
        {/* Portrait — placeholder until a photo is provided */}
        <figure className="mx-auto w-full max-w-[22rem] md:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-full border border-brass/60 bg-navy-soft">
            <div className="absolute inset-3 rounded-t-full border border-brass/30" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <span className="font-display text-6xl italic text-brass/80">S</span>
              <span className="eyebrow text-cream/50">Photo coming soon</span>
            </div>
          </div>
          <figcaption className="mt-4 text-center font-display text-lg italic text-cream/60">
            Shezia &amp; Haseeb
          </figcaption>
        </figure>

        {/* Note */}
        <div className="text-center md:text-left">
          <p className="eyebrow text-brass">You are warmly invited to celebrate</p>
          <h1 className="mt-5 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
            Baby Shaker
          </h1>
          <p className="mt-3 font-display text-2xl italic text-cream/80 sm:text-3xl">
            Arriving February 2027
          </p>

          <div className="rule-double mx-auto mt-8 w-16 text-brass md:mx-0" />

          <p className="mt-8 max-w-prose font-display text-xl leading-relaxed text-cream/85 sm:text-[1.35rem]">
            {/* TODO: replace with the couple's own note */}
            Thank you for being part of this chapter with us. We&rsquo;ve
            gathered a few things to help welcome our little one home. Your
            presence is the real gift, but should you wish to spoil the baby,
            everything is here in one place.
          </p>
          <p className="mt-6 font-display text-xl italic text-cream/70">
            With love, Shezia &amp; Haseeb
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:justify-start">
            <a
              href="#registry"
              className="eyebrow inline-flex items-center gap-2 border-b border-brass/60 pb-1 text-cream transition-colors hover:border-brass hover:text-brass"
            >
              Browse the registry
              <span aria-hidden className="font-sans">
                ↓
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
