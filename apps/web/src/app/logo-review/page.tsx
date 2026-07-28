import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Logo concept review | AccordPay",
  description: "Internal review surface for Accord Mark logo concepts.",
  robots: {
    index: false,
    follow: false,
  },
};

const concepts = [
  {
    id: "a",
    name: "Concept A — Structured Accord",
    color: "/brand/concepts/accord-mark-a.svg",
    monochrome: "/brand/concepts/accord-mark-a-monochrome.svg",
  },
  {
    id: "b",
    name: "Concept B — Connected Accord",
    color: "/brand/concepts/accord-mark-b.svg",
    monochrome: "/brand/concepts/accord-mark-b-monochrome.svg",
  },
  {
    id: "c",
    name: "Concept C — Settlement Accord",
    color: "/brand/concepts/accord-mark-c.svg",
    monochrome: "/brand/concepts/accord-mark-c-monochrome.svg",
  },
] as const;

const sizes = [16, 24, 32, 48, 128, 256] as const;
const productionSizes = [32, 64, 128] as const;
const faviconSizes = [16, 24, 32, 48] as const;

const finalAssets = [
  {
    name: "Official two-colour icon",
    file: "logo-icon.svg",
    source: "/brand/logo-icon.svg",
    surface: "light",
  },
  {
    name: "Official inverse icon",
    file: "logo-icon-dark.svg",
    source: "/brand/logo-icon-dark.svg",
    surface: "dark",
  },
  {
    name: "Deep-pine single-colour icon",
    file: "logo-icon-light.svg",
    source: "/brand/logo-icon-light.svg",
    surface: "light",
  },
  {
    name: "Print monochrome icon",
    file: "logo-monochrome.svg",
    source: "/brand/logo-monochrome.svg",
    surface: "light",
  },
  {
    name: "White monochrome icon",
    file: "logo-monochrome-light.svg",
    source: "/brand/logo-monochrome-light.svg",
    surface: "dark",
  },
  {
    name: "Favicon",
    file: "favicon.svg",
    source: "/brand/favicon.svg",
    surface: "light",
  },
] as const;

const refinements = [
  {
    id: "a1",
    name: "Refinement A1 — Protected Chamber",
    color: "/brand/refinements/accord-mark-a1.svg",
    monochrome: "/brand/refinements/accord-mark-a1-monochrome.svg",
    evaluation: {
      distinctiveness:
        "The segmented inner ledges create a more proprietary rhythm than a conventional A crossbar.",
      escrow:
        "A rectangular central chamber is framed from both sides and reads as held space rather than upward motion.",
      arrowRisk:
        "Low. The chamber uses horizontal boundaries and no pointed central apex.",
      smallSize:
        "Strong outer silhouette; the chamber ledges require close review at 16px.",
      darkBackground:
        "The unified white inverse retains the chamber and balanced two-path structure.",
      appIcon:
        "Strong, though its tall stance leaves more surrounding space than A3.",
      wordmark:
        "Strongest of the refinements because its vertical structure pairs naturally with a horizontal name.",
    },
  },
  {
    id: "a2",
    name: "Refinement A2 — Joined Agreement",
    color: "/brand/refinements/accord-mark-a2.svg",
    monochrome: "/brand/refinements/accord-mark-a2-monochrome.svg",
    evaluation: {
      distinctiveness:
        "Offset upper facets and aligned inner shelves reduce reliance on a literal capital-A silhouette.",
      escrow:
        "The small protected centre is created where equal paths align around mutually defined terms.",
      arrowRisk:
        "Low. The central geometry is a horizontal junction with no arrowhead or vertical pointer.",
      smallSize:
        "Broad masses reproduce well; the small central space is the limiting 16px detail.",
      darkBackground:
        "The white inverse clearly preserves both independent shapes and their controlled junction.",
      appIcon:
        "Strong square balance with slightly more visual movement than A1.",
      wordmark:
        "Good; its offset top is distinctive but may need optical spacing beside a future wordmark.",
    },
  },
  {
    id: "a3",
    name: "Refinement A3 — Controlled Release",
    color: "/brand/refinements/accord-mark-a3.svg",
    monochrome: "/brand/refinements/accord-mark-a3-monochrome.svg",
    evaluation: {
      distinctiveness:
        "The protected upper chamber and balanced lower channel create a compact escrow-specific construction.",
      escrow:
        "Two paths hold a central space while the lower separation suggests release through a controlled route.",
      arrowRisk:
        "Very low. The release opening points downward through parallel sides and contains no directional tip.",
      smallSize:
        "Strongest refinement at 16px because the chamber and lower opening use broad, simple geometry.",
      darkBackground:
        "The white inverse has high contrast and keeps the release channel legible.",
      appIcon:
        "Strongest compact footprint and most efficient use of a square icon field.",
      wordmark:
        "Good, but its heavier base may require more separation from a future horizontal name.",
    },
  },
] as const;

const surfaces = [
  {
    name: "White",
    className: "bg-[var(--color-white)] text-[var(--color-ink-950)]",
  },
  {
    name: "Deep pine",
    className:
      "bg-[var(--color-pine-950)] text-[var(--color-white)] [color-scheme:dark]",
  },
] as const;

export default function LogoReviewPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-[var(--container-gutter-mobile)] py-[var(--space-10)] text-[var(--color-text)] md:px-[var(--container-gutter-tablet)] lg:px-[var(--container-gutter-desktop)] lg:py-[var(--space-16)]">
      <div className="mx-auto max-w-[var(--container-wide)]">
        <header className="max-w-[var(--container-reading)]">
          <p className="m-0 text-[length:var(--font-size-sm)] font-semibold tracking-[var(--letter-spacing-wide)] text-[var(--color-action)] uppercase">
            Brand asset review
          </p>
          <h1 className="mt-[var(--space-3)] text-[length:var(--font-size-3xl)] leading-[var(--line-height-3xl)] font-semibold tracking-[var(--letter-spacing-tight)]">
            AccordPay logo review
          </h1>
          <p className="mt-[var(--space-4)] max-w-[var(--measure-copy)] text-[length:var(--font-size-base)] leading-[var(--line-height-base)] text-[var(--color-text-subtle)]">
            Review the approved A3 production variants and the preserved design
            history across colour, surface, and size conditions.
          </p>
        </header>

        <section
          aria-labelledby="approved-production-title"
          className="mt-[var(--space-12)]"
        >
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-pine-100)] bg-[var(--color-pine-50)] p-[var(--space-6)] md:p-[var(--space-8)]">
            <p className="m-0 text-[length:var(--font-size-sm)] font-semibold tracking-[var(--letter-spacing-wide)] text-[var(--color-pine-800)] uppercase">
              A3 — Controlled Release · Approved July 28, 2026
            </p>
            <h2
              id="approved-production-title"
              className="mt-[var(--space-3)] text-[length:var(--font-size-2xl)] leading-[var(--line-height-2xl)] font-semibold tracking-[var(--letter-spacing-tight)]"
            >
              Approved production mark
            </h2>
            <p className="mt-[var(--space-4)] max-w-[var(--measure-copy)] text-[length:var(--font-size-base)] leading-[var(--line-height-base)] text-[var(--color-text-subtle)]">
              The two paths represent independent parties around protected
              escrow space. Their lower separation expresses controlled release
              into stable settlement. Use each asset only on its documented
              surface.
            </p>
          </div>

          <div className="mt-[var(--space-6)] grid gap-[var(--grid-gap-mobile)] md:grid-cols-2 xl:grid-cols-3 xl:gap-[var(--grid-gap-desktop)]">
            {finalAssets.map((asset) => {
              const assetSizes =
                asset.file === "favicon.svg" ? faviconSizes : productionSizes;

              return (
                <article
                  key={asset.file}
                  className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] p-[var(--space-5)] md:p-[var(--space-6)] ${
                    asset.surface === "dark"
                      ? "bg-[var(--color-pine-800)] text-[var(--color-white)]"
                      : "bg-[var(--color-white)] text-[var(--color-ink-950)]"
                  }`}
                >
                  <p className="m-0 text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)] font-semibold tracking-[var(--letter-spacing-wide)] uppercase">
                    {asset.surface === "dark"
                      ? "Dark-surface asset"
                      : "Light-surface asset"}
                  </p>
                  <h3 className="mt-[var(--space-2)] text-[length:var(--font-size-lg)] leading-[var(--line-height-lg)] font-semibold">
                    {asset.name}
                  </h3>
                  <code className="mt-[var(--space-1)] block text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)] opacity-80">
                    {asset.file}
                  </code>
                  <div className="mt-[var(--space-6)] flex min-h-32 flex-wrap items-end gap-[var(--space-5)]">
                    {assetSizes.map((size) => (
                      <figure
                        key={size}
                        className="m-0 grid min-w-[3rem] justify-items-center gap-[var(--space-2)]"
                      >
                        <Image
                          src={asset.source}
                          alt={`${asset.name}, approved AccordPay A3 mark at ${size} pixels`}
                          width={size}
                          height={size}
                          unoptimized
                        />
                        <figcaption className="font-mono text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)] opacity-80">
                          {size}px
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="exploration-history-title"
          className="mt-[var(--space-20)]"
        >
          <div className="max-w-[var(--container-reading)]">
            <p className="m-0 text-[length:var(--font-size-sm)] font-semibold tracking-[var(--letter-spacing-wide)] text-[var(--color-action)] uppercase">
              Internal design review — not a production asset
            </p>
            <h2
              id="exploration-history-title"
              className="mt-[var(--space-3)] text-[length:var(--font-size-3xl)] leading-[var(--line-height-3xl)] font-semibold tracking-[var(--letter-spacing-tight)]"
            >
              Exploration history
            </h2>
            <p className="mt-[var(--space-4)] text-[length:var(--font-size-base)] leading-[var(--line-height-base)] text-[var(--color-text-subtle)]">
              The original concepts and refinement sources below are preserved
              for provenance. They are not approved production alternatives.
            </p>
          </div>

          <div className="mt-[var(--space-10)] space-y-[var(--space-12)]">
            {concepts.map((concept) => (
              <section
                key={concept.id}
                aria-labelledby={`concept-${concept.id}`}
                className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div className="border-b border-[var(--color-border)] px-[var(--space-6)] py-[var(--space-5)]">
                  <h2
                    id={`concept-${concept.id}`}
                    className="m-0 text-[length:var(--font-size-xl)] leading-[var(--line-height-xl)] font-semibold"
                  >
                    {concept.name}
                  </h2>
                </div>

                {[
                  { name: "Colour", source: concept.color },
                  { name: "Monochrome", source: concept.monochrome },
                ].map((variant) => (
                  <div
                    key={variant.name}
                    className="border-b border-[var(--color-border)] p-[var(--space-4)] last:border-b-0 md:p-[var(--space-6)]"
                  >
                    <h3 className="m-0 text-[length:var(--font-size-base)] leading-[var(--line-height-base)] font-semibold">
                      {variant.name}
                    </h3>
                    <div className="mt-[var(--space-4)] grid gap-[var(--grid-gap-mobile)] xl:grid-cols-2 xl:gap-[var(--grid-gap-desktop)]">
                      {surfaces.map((surface) => (
                        <div
                          key={surface.name}
                          className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] p-[var(--space-4)] md:p-[var(--space-6)] ${surface.className}`}
                        >
                          <p className="m-0 text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)] font-semibold tracking-[var(--letter-spacing-wide)] uppercase">
                            {surface.name} surface
                          </p>
                          <div className="mt-[var(--space-5)] flex flex-wrap items-end gap-[var(--space-5)]">
                            {sizes.map((size) => (
                              <figure
                                key={size}
                                className="m-0 grid min-w-[3rem] justify-items-center gap-[var(--space-2)]"
                              >
                                <Image
                                  src={variant.source}
                                  alt={`${concept.name}, ${variant.name.toLowerCase()}, ${size} pixels on ${surface.name.toLowerCase()}`}
                                  width={size}
                                  height={size}
                                  unoptimized
                                />
                                <figcaption className="font-mono text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)] opacity-80">
                                  {size}px
                                </figcaption>
                              </figure>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="refinement-round-title"
          className="mt-[var(--space-20)]"
        >
          <div className="max-w-[var(--container-reading)]">
            <p className="m-0 text-[length:var(--font-size-sm)] font-semibold tracking-[var(--letter-spacing-wide)] text-[var(--color-action)] uppercase">
              Selected direction: Concept A
            </p>
            <h2
              id="refinement-round-title"
              className="mt-[var(--space-3)] text-[length:var(--font-size-3xl)] leading-[var(--line-height-3xl)] font-semibold tracking-[var(--letter-spacing-tight)]"
            >
              Concept A refinement round
            </h2>
            <p className="mt-[var(--space-4)] text-[length:var(--font-size-base)] leading-[var(--line-height-base)] text-[var(--color-text-subtle)]">
              These variations address arrow-like negative space, generic
              capital-A geometry, dark-surface contrast, and small-size clarity.
              No refinement is approved as the final logo.
            </p>
          </div>

          <div className="mt-[var(--space-10)] space-y-[var(--space-12)]">
            {refinements.map((refinement) => (
              <article
                key={refinement.id}
                aria-labelledby={`refinement-${refinement.id}`}
                className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div className="border-b border-[var(--color-border)] px-[var(--space-6)] py-[var(--space-5)]">
                  <h3
                    id={`refinement-${refinement.id}`}
                    className="m-0 text-[length:var(--font-size-xl)] leading-[var(--line-height-xl)] font-semibold"
                  >
                    {refinement.name}
                  </h3>
                </div>

                <div className="grid gap-[var(--grid-gap-mobile)] p-[var(--space-4)] md:p-[var(--space-6)] xl:grid-cols-2 xl:gap-[var(--grid-gap-desktop)]">
                  {[
                    {
                      name: "Primary colour on white",
                      source: refinement.color,
                      dark: false,
                    },
                    {
                      name: "Inverse white on deep pine",
                      source: refinement.color,
                      dark: true,
                    },
                    {
                      name: "Monochrome black on white",
                      source: refinement.monochrome,
                      dark: false,
                    },
                    {
                      name: "Monochrome white on deep pine",
                      source: refinement.monochrome,
                      dark: true,
                    },
                  ].map((treatment) => (
                    <div
                      key={treatment.name}
                      className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] p-[var(--space-4)] md:p-[var(--space-6)] ${
                        treatment.dark
                          ? "bg-[var(--color-pine-800)] text-[var(--color-white)]"
                          : "bg-[var(--color-white)] text-[var(--color-ink-950)]"
                      }`}
                    >
                      <p className="m-0 text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)] font-semibold tracking-[var(--letter-spacing-wide)] uppercase">
                        {treatment.name}
                      </p>
                      <div className="mt-[var(--space-5)] flex flex-wrap items-end gap-[var(--space-5)]">
                        {sizes.map((size) => (
                          <figure
                            key={size}
                            className="m-0 grid min-w-[3rem] justify-items-center gap-[var(--space-2)]"
                          >
                            {treatment.dark ? (
                              <span
                                role="img"
                                aria-label={`${refinement.name}, ${treatment.name.toLowerCase()}, ${size} pixels`}
                                style={
                                  {
                                    width: size,
                                    height: size,
                                    backgroundColor: "var(--color-white)",
                                    maskImage: `url("${treatment.source}")`,
                                    maskPosition: "center",
                                    maskRepeat: "no-repeat",
                                    maskSize: "contain",
                                    WebkitMaskImage: `url("${treatment.source}")`,
                                    WebkitMaskPosition: "center",
                                    WebkitMaskRepeat: "no-repeat",
                                    WebkitMaskSize: "contain",
                                  } as CSSProperties
                                }
                              />
                            ) : (
                              <Image
                                src={treatment.source}
                                alt={`${refinement.name}, ${treatment.name.toLowerCase()}, ${size} pixels`}
                                width={size}
                                height={size}
                                unoptimized
                              />
                            )}
                            <figcaption className="font-mono text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)] opacity-80">
                              {size}px
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <dl className="grid gap-x-[var(--grid-gap-desktop)] gap-y-[var(--space-5)] border-t border-[var(--color-border)] p-[var(--space-6)] md:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["Distinctiveness", refinement.evaluation.distinctiveness],
                    ["Escrow meaning", refinement.evaluation.escrow],
                    [
                      "Arrow or trading-symbol risk",
                      refinement.evaluation.arrowRisk,
                    ],
                    ["Small-size clarity", refinement.evaluation.smallSize],
                    [
                      "Dark-background performance",
                      refinement.evaluation.darkBackground,
                    ],
                    ["App-icon suitability", refinement.evaluation.appIcon],
                    [
                      "Horizontal wordmark suitability",
                      refinement.evaluation.wordmark,
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[length:var(--font-size-sm)] leading-[var(--line-height-sm)] font-semibold">
                        {label}
                      </dt>
                      <dd className="mt-[var(--space-1)] ml-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-sm)] text-[var(--color-text-subtle)]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
