# Numeric and text contract

## `computeInvoice(items, retainerBps = 0, taxBps = 0)`

- One to six **ordinary, own-dense arrays**. Subclass/custom-prototype arrays, holes, accessors and additional array properties are rejected. Rows are plain Object/null-prototype data objects containing exactly own `title`, `note`, `quantity`, `rateCents`; additional fields are rejected, not forwarded.
- Title: 1–52 printable ASCII characters. Note: 1–160. Both must be trimmed and nonempty, with no control characters, line breaks or unsupported glyphs. Numeric results use a fixed USD-like `$` display, not currency conversion or support for currencies with different minor units.
- Quantity: integer 1–999. Rate: **nonnegative** integer cents 0–9,999,999. Each line amount, subtotal and final total: 0–99,999,999 cents. No negatives, fractional cents, nonfinite values or unsafe integers.
- Basis points: integers 0–10,000. Both default to zero; they are demonstrative input parameters, not validated local tax rules. For `totalsTile`, omitted/undefined optional rates default to zero; null or other nonintegers reject.
- Amount = quantity × rateCents. Subtotal sums line amounts. Retainer = half-up(subtotal × retainerBps / 10,000). Net = subtotal − retainer. Tax = half-up(net × taxBps / 10,000). Total = net + tax. The half-up calculations use BigInt; intermediate and final Number outputs remain safe integers. Tax is not calculated per line.
- Returned model, row array and rows are frozen. There are no invoice IDs, dates, parties, bank/account/routing fields, URLs, tax identifiers, payment methods or acceptance terms in the schema.

No input/output/network side effects. Trusted plain data is expected. This does not sandbox malicious Proxy traps, monkeypatched global built-ins, or concurrent mutation.

## `lineItemsTile(api, items)`

New transparent raster, **1352 × 2(74 + 94n)** px (n = 1…6); logical width676, logical height74+94n. Mandatory top `NOT PAYABLE / DEMO LINE ITEMS`, followed by description/quantity/rate/amount columns. Measured title single line; note wraps at spaces into at most two lines of390px advance, followed by actual ink checks. A long word or overflow rejects; no ellipsis, auto-shrinking, pagination or silently dropped row.

## `totalsTile(api, items, {retainerBps, taxBps} = {})`

New transparent **640 × 560** raster, logical320×280. Mandatory top `NOT PAYABLE` and bottom `DEMO TAX ONLY / NOT PAYABLE`. Labels always distinguish demo retainer/tax/net and **Demo total**. No payable amount or collection action is claimed.

## Drawing boundary

The four locked fonts must be registered via `loadRuntime()`. All table/total texts are planned using those same sizes/aliases and actual ink boxes before a final tile is allocated or painted. Numeric validation happens before measurement allocation. A text failure may allocate one blank1×1 measurement surface, but returns no tile and paints no caller surface. Designed optical allowance is contained within reserved slots; no glyph crosses the raster edge or numeric column gutter.

Factories never accept/draw to the caller context and do not mutate inputs. Compositing is caller-owned; native drawImage itself does not consume a caller path but inherits drawing state. A hostile or incompatible injected Canvas API is outside the guarantee. Registered fonts are process-global; failed registration may leave earlier successful registrations and the caller must abandon that setup attempt. All font byte checks occur before the first registration.

Synthetic descriptions are a caller obligation, not an automatic PII detector. Rejecting unknown schema fields does not prove free text contains no real-world identity. The bundled examples are original fictitious content; do not enter or publish real invoice/payment data through this demonstrator.
