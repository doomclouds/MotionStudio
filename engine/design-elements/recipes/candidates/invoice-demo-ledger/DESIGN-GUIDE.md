# Why retain this small candidate

Keep arithmetic separate from painting. A visual invoice mockup can otherwise display a believable total whose actual cents or rounding do not match its rows. Here the same bounded row data drives both tiles, including zero rate, quantity and fractional-basis-point effects.

One candidate, not three families: `computeInvoice` is the pure model helper; `lineItemsTile` and `totalsTile` are cooperating table/summary surfaces. Existing `semantic-data`, `typographic-focus` and print-poster families cover general hierarchy and surfaces; this candidate adds a specific cents-and-row contract, not a new generic paper/card family. It imports no existing family at runtime and does not pretend that conceptual overlap is actual code reuse.

Use dark serif figures sparingly, monospaced numeric columns and thin horizontal separators. A green caution line remains attached to every tile so reusing the tile cannot silently discard the demo/nonpayable status. Retain a separate totals panel rather than squeezing it into table columns. Avoid actual business identities and payment affordances; they are not necessary visual ingredients.

Two synthetic briefs demonstrate actual changes: a two-row workshop calculation with demo rates, and a three-row archive exercise with zero rates and a zero-cost row. These are test compositions, not client work, additional source cases, or evidence of user aesthetic acceptance. Arbitrary row heights/widths, currencies, returns/credits, tax jurisdictions and invoice issuance require a different design and fresh review.
