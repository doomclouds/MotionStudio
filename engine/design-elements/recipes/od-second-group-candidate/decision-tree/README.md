# decision-tree: integration candidate
Source study user feedback received: “不错，可以沉淀几个积木”. This does not approve new API contracts. User subsequently authorized submission via unified integration; publication is still pending. NOT published; NOT a registered recipe or new family.
Native author code is retained in this folder, with external resource injection only.
Use ../runtime.mjs renderFrame('decision-tree', {canvasApi, assetDir}), then drawFrame(canvas, ctx, options).
Resources are deliberately excluded. Supply every exact file in asset-lock.json in a dedicated external directory; no fallback/download is implied. Missing/hash-mismatched files fail before native code loads.
Only the full fixed 1920x1080 frame is a supported adapter boundary. Native internal helpers are study code, not hardened public APIs. Fresh-canvas composition avoids exposing their reset/current-path/partial-failure effects to caller contexts.
Local provenance records contain original study paths, not portable runtime dependencies. Local run receipts are maintained separately in od-second-group-evidence (not shipped in this candidate).
