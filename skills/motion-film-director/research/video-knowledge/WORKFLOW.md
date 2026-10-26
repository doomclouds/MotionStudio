# Local video knowledge workflow

The public library is intentionally empty. It ships a structural validator, query tool and blank templates, **not** a private research corpus, media acquisition index, production feedback archive or evidence of artistic success.

## Begin with authorized local inputs

1. Define the creative question and the scope of permission. A public source page does not grant reuse, modification or distribution rights.
2. Copy the blank templates into a separate local library outside this repository. Create an `index.json` with `schema_version: 1`, `cases`, `techniques`, and an empty `legacy` array. Index only cards you are authorized to store.
3. Keep uninspected references `unverified`. Record only actions actually performed; distinguish observations, interpretations, plans and feedback. Do not invent hashes, listening, approval or source access.
4. Link hypotheses to observations, retain alternatives and counterexamples, and test their transfer limits. Structural validity is not truth, perceptual review or artistic approval.
5. Keep original media, private review records, local machine paths, signed URLs and credentials outside the public repository. Review any proposed publication separately; a successful validator does not authorize sharing.

## Commands

From the Skill directory:

```sh
python3 scripts/video_knowledge.py validate
python3 scripts/video_knowledge.py query --tag rhythm --limit 3
python3 scripts/video_knowledge.py --root /absolute/path/to/authorized-local-library validate
python3 scripts/video_knowledge.py --root /absolute/path/to/authorized-local-library query --tag rhythm --limit 3
python3 scripts/sfx_catalog.py validate
python3 scripts/sfx_catalog.py query --catalog /absolute/path/to/authorized-catalog.json --limit 3
```

The defaults validate as empty and queries return `[]`; that is intentional, not a missing download. Neither CLI accesses the network, downloads assets or certifies licenses. No-match queries never invent recommendations.

See [SCHEMA.md](SCHEMA.md) and `templates/` for the data contract. Tests construct explicitly synthetic fixtures in temporary locations; they validate structure and safety boundaries, not real films or sounds.
