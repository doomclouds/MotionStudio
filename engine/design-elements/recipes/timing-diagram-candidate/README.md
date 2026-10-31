# Bounded timing diagram — source-only candidate

A rebuilt, unregistered **static** information-design candidate. Two different synthetic models compose digital steps, contiguous symbol buses, grid ticks and summary text from the same data. This is not hardware capture, a WaveDrom parser, protocol simulation, browser UI, playback or animation.

This revision was re-extracted from a preserved licensed study after its earlier candidate package became unavailable. It is a **new reconstruction**, not a byte-identical recovery of that earlier package; only this revision's tests and identities apply. The user gave positive group-level feedback and asked for reusable code; this does not imply individual acceptance of these new examples, a public family registration, or permission to publish restricted references. No reference image, private record, font binary or upstream application is included.

## Run

Node 24.22.1 and Native Canvas 0.1.100 were used. Install the pinned dependency with `npm ci --ignore-scripts --no-audit --no-fund`. Offline installation requires an already populated compatible npm cache; an empty-cache online install has not been verified here.

Provide the exact unmodified font described by `font-lock.json` in an absolute, normalized external path. An arbitrary installed Liberation Sans is not necessarily the same bytes. Automatic public recovery of that exact binary is **not verified**.

```sh
export TIMING_FONT=/absolute/external-assets/LiberationSans-Regular.ttf
export TIMING_TEST_TMP=/absolute/existing-test-scratch
npm test
npm run check-source
npm run examples -- /absolute/new-output-directory
```

The font and output must be outside this package and any ancestor recognized as a MotionStudio checkout. A `.git` directory alone is not sufficient recognition. Resource ancestors must be regular, not symbolic links; output is new-only. Keep resources and scratch outside any future repository when integrating.

## Compose

```js
import {loadNative,loadEnvironment,compileTiming,createTimingKit} from './index.mjs';
const api=loadNative();
const env=loadEnvironment(api,{fontPath:process.env.TIMING_FONT});
const kit=createTimingKit(api,env);
const model=compileTiming({cycles:4,rows:[
  {name:'clock',type:'digital',values:[1,0,1,0,1,0,1,0]},
  {name:'symbol',type:'bus',values:[{start:0,end:2,label:null},{start:2,end:8,label:'A'}]}
]});
const overview=kit.timingDiagramTile({model,width:640,labelWidth:120});
const detail=kit.laneTile({row:model.rows[1],cycles:model.cycles,width:510});
const host=api.createCanvas(1400,500),ctx=host.getContext('2d');
ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1400,500);
kit.place(ctx,overview,40,30,2);kit.place(ctx,detail,40,350,2);
```

`examples.mjs` supplies 1440×800 overview and 1200×1280 overview-plus-detail compositions; `fixtures.mjs` holds different five-cycle/four-lane and eight-cycle/five-lane models. Their bus labels and high-cell summaries are derived, not independently typed. Details use a different horizontal pixel scale while retaining the same logical half-ticks.

Read `CONTRACT.md` before reuse. This is one bounded recipe candidate, **zero new public families or registered recipes**. It complements existing general interval lanes and timeline clock math rather than replacing them. Future repository/index/history checks are a separate integration gate.

## Verify and rights

`npm test` covers strict input snapshots, owned handles, real ink, shared pixel mapping, state/path, expanded margins, font identity/registration and new-only output. `check-source.py` checks this finite source package, not repository history or every possible data leak. No browser, hardware or animation QA is claimed.

Study code: MIT. Upstream context: separately preserved WaveDrom MIT. Canvas: MIT. External unmodified Liberation font: SIL OFL 1.1 with reserved-name and distribution notices retained, not relicensed MIT. See `CREDITS.md`, `licenses/`, `provenance.json`.
