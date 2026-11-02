# Invoice demo ledger — restricted source candidate

**NOT PAYABLE. Synthetic arithmetic and layout only.** One candidate combines `computeInvoice`, `lineItemsTile` and `totalsTile`; these are not three newly registered families. No complete invoice adapter, original reference, issuer/client identity, address, identifier, payment destination or payment action is included.

The two examples use different invented descriptions, quantities, rates and row counts. Every tile contains an unavoidable `NOT PAYABLE` label; the totals tile always says `Demo tax` and `Demo total`, never a payment request. Rates default to zero. The nonzero example uses **2.75% illustrative tax**, not a jurisdictional recommendation.

## Pure arithmetic, no fonts required

```js
import {computeInvoice} from './index.mjs';
const result = computeInvoice([
  {title:'Synthetic row', note:'Arithmetic demonstration only.', quantity:3, rateCents:12525}
], 1250, 275); // demo retainer and tax in basis points
```

Integer cents, no binary floating-point money multiplication. Retainer is half-up rounded once on subtotal; demo tax is half-up rounded once on the post-retainer net. This is a narrow computation convention, **not accounting, tax, legal or invoicing compliance**. See [CONTRACT.md](CONTRACT.md).

## External runtime and exact authorized fonts

Run these commands from this candidate directory. Font binaries and renders must stay outside the repository. You must provide all four exact hash-matching font files listed in `font-lock.json`; no network acquisition or clean-machine availability is promised. `prepare-fonts.py` imports only those four files, offline, after checking every identity. It does not import any invoice, source screenshot or other assets.

```sh
CANDIDATE="$PWD"
WORK=$(mktemp -d /tmp/invoice-ledger.XXXXXXXX)
mkdir "$WORK/runtime"
cp package.json package-lock.json "$WORK/runtime/"
(cd "$WORK/runtime" && npm_config_cache="$WORK/cache" npm ci --ignore-scripts --no-audit --no-fund)
python3 prepare-fonts.py --source "$AUTHORIZED_FONT_CACHE" --output "$WORK/fonts"
export CANVAS_MODULE="$WORK/runtime/node_modules/@napi-rs/canvas"
export OD_FONT_ROOT="$WORK/fonts"
node test.mjs
node test-runtime.mjs
python3 test-prepare.py
python3 test-arithmetic.py
OD_OUTPUT_DIR="$WORK/examples" node examples/render.mjs
```

Node 24 / Native Canvas 0.1.100; Python standard library only. The two output PNGs are local review products, not source assets. Output directory must be new; live/dangling final-component symlinks and paths within the repository are refused.

For tiles, first call `loadRuntime()` from `runtime.mjs`, then call either factory with that returned Canvas API. Draw the resulting raster at half its intrinsic dimensions for the intended logical size. No caller canvas is passed to a factory. Your later `drawImage` follows your transform, clip, alpha, shadow, filter and blend settings; isolation of those is your responsibility.

## Status and scope

Source-only integration candidate against the declared base commit. No catalog registration, portfolio entry, cover, media exception or public-family count changes. No original case portfolio migration. No owner aesthetic approval is inferred. Browser, interaction, motion, responsive layout, printing, pagination and accessibility certification are not verified. Final source publication and formal admission remain separate decisions.

[Design guidance](DESIGN-GUIDE.md) · [Rights and provenance](RIGHTS.md) · [Source policy](source-policy.json)
