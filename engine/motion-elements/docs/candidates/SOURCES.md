# Candidate provenance and rights — private preparation

All five JavaScript implementations were independently authored for this project. No third-party source was copied, translated, linked or bundled; no dependency was added. Their code follows the repository's MIT scope. Algorithm references/documentation are not automatically MIT-licensed and are not redistributed here. Fonts, original film art, audio and atlas images stay in their separate private production packages; the project code license does not silently license those media.

This note preserves the producing authors' recorded research chronology. Private hardening verified those records and byte identities; it does not pretend to have independently rewatched reference films or performed reference listening.

## Analytic finite particles

Producer recorded pre-implementation inspection of Three.js fixed r180 GPUComputationRenderer and its MIT LICENSE, plus Godot's official2D-particles concepts. Decision was to reject stateful GPU ping-pong integration and author bounded one-shot, closed-form constant-acceleration/lifetime sampling. No WebGL/Three/Godot dependency. The particle seed mixer is deterministic per-ID/channel, not statistically certified or cryptographic.

- https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/jsm/misc/GPUComputationRenderer.js
- https://raw.githubusercontent.com/mrdoob/three.js/r180/LICENSE
- https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html

A mistakenly opened NVIDIA depth-of-field chapter is not a particle source. Failed Unity fetch is not claimed read. Original accessor-bypass failure and corrected film version remain retained in private evidence; not a false first-pass claim.

## Weighted hierarchy

Before implementation, the producer read UMD Treemap layout documentation and the retrieved original Ordered Treemap Layouts excerpt on stable alternate-axis slice-and-dice and thin-rectangle limitations. The excerpt reading is not presented as an end-to-end full-paper read. Original implementation of an established algorithm, not invented here and not copied code.

- https://www.cs.umd.edu/projects/hcil/treemap/doc4.1/layout.html
- https://obj.umiacs.umd.edu/ieee-papers/Shneiderman2001Ordered.pdf

## Finite temporal exposure

Producer consulted FFmpeg `tmix` documentation/source overview and legal information before implementation. The exact current `tmix` section was explicitly located later, after the first implementation; do not upgrade this to earlier line-by-line reading. `vf_mix.c` identifies Paul B Mahol and LGPL2.1-or-later. No C code was copied/translated, linked or bundled. Signed kernels/plane controls and physical linear-light arithmetic are deliberately not part of this original RGBA8 contract.

- https://ffmpeg.org/ffmpeg-filters.html#tmix
- https://ffmpeg.org/doxygen/trunk/vf__mix_8c_source.html
- https://ffmpeg.org/legal.html

Original custom-iterator validation failure and correction remain retained in private evidence.

## Minimum-distance points

Producer read Robert Bridson's one-page original2007 paper before implementation. Active-list sampling, annulus proposals and background-grid acceleration informed an original bounded2D adaptation with circular domain/exclusion. Publication rights of the paper are not treated as a software license. No prototype code or paper copied into this package.

- https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf

## Sprite atlas addressing

Producer recorded pre-implementation official Godot SpriteFrames/Pixi AnimatedSprite documentation and fixed4.4-stable/v8.6.6 source+MIT licenses. Decisions: per-frame durations, immutable source rectangles, single mechanism with once/loop/pingpong, Godot-style endpoint-once pingpong; reject accumulated ticker playback in favor of absolute integer ticks. No engine source copied or dependencies added. Moving documentation and fixed source versions are not falsely claimed identical.

- https://docs.godotengine.org/en/stable/classes/class_spriteframes.html
- https://raw.githubusercontent.com/godotengine/godot/4.4-stable/scene/resources/sprite_frames.cpp
- https://raw.githubusercontent.com/godotengine/godot/4.4-stable/LICENSE.txt
- https://pixijs.download/release/docs/scene.AnimatedSprite.html
- https://raw.githubusercontent.com/pixijs/pixijs/v8.6.6/src/scene/sprite-animated/AnimatedSprite.ts
- https://raw.githubusercontent.com/pixijs/pixijs/v8.6.6/LICENSE

Private FIRST BLOOM evidence uses actual prepainted atlas bytes at playback, not procedural per-output-frame geometry mislabeled as sprites. Eighteen cells include13 opening poses and5 subtle resting variants; byte distinctness is not18 strongly different shapes or an artistic verdict.
