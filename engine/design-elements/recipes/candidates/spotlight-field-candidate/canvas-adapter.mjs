// SPDX-License-Identifier: MIT
import {assertSpotlight, coverageAt} from './spotlight-field.mjs';

/** Ellipse matte uses the solver's smooth coverage, approximated by 64 feather stops. */
export function drawReceiverMask(ctx, light) {
  assertSpotlight(light);
  const r = light.receiver;
  const previousFill = ctx.fillStyle;
  ctx.save();
  try {
    ctx.translate(r.center.x, r.center.y);
    ctx.rotate(r.rotation);
    ctx.scale(r.radiusX, r.radiusY);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, `rgba(255,255,255,${light.intensity})`);
    for (let i = 0; i <= 64; i++) {
      const rho = 1 - light.feather + light.feather * i / 64;
      let q = Math.max(0, Math.min(1, (1 - rho) / light.feather));
      q = q * q * (3 - 2 * q);
      gradient.addColorStop(rho, `rgba(255,255,255,${q * light.intensity})`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(-1, -1, 2, 2);
  } finally {
    ctx.restore();
    // The tested native Canvas runtime retains a stale fillStyle getter after restore.
    ctx.fillStyle = previousFill;
  }
}

/** Caller-owned reusable scratch Canvas, distinct from the destination.
 * pixelSize=1 samples analytic coverage at pixel centers. Larger values trade
 * soft-beam detail for speed. Apply the same camera to every scene consumer.
 * Scratch pixels/dimensions are intentionally replaced; target state is restored.
 */
export function drawBeam(ctx, light, {surface, color, opacity, pixelSize = 4}) {
  assertSpotlight(light);
  if (!surface || typeof surface.getContext !== 'function' || surface === ctx.canvas ||
      !Array.isArray(color) || color.length !== 3 ||
      [0, 1, 2].some(i => { const d = Object.getOwnPropertyDescriptor(color, String(i)); return !d || !Object.hasOwn(d, 'value') || !Number.isInteger(d.value) || d.value < 0 || d.value > 255; }) ||
      !Number.isFinite(opacity) || opacity < 0 || opacity > 1 ||
      !Number.isInteger(pixelSize) || pixelSize < 1 || pixelSize > 16) {
    throw Error('Invalid beam drawing options');
  }
  const xs = light.polygon.map(p => p.x), ys = light.polygon.map(p => p.y);
  const x = Math.floor(Math.min(...xs)), y = Math.floor(Math.min(...ys));
  const width = Math.ceil(Math.max(...xs)) - x + 1;
  const height = Math.ceil(Math.max(...ys)) - y + 1;
  const w = Math.ceil(width / pixelSize), h = Math.ceil(height / pixelSize);
  if (w > 8192 || h > 8192 || w * h > 1048576) throw Error('Beam raster budget exceeded');
  surface.width = w;
  surface.height = h;
  const scratch = surface.getContext('2d');
  const pixels = scratch.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const coverage = coverageAt(light, {x: x + (i + .5) * pixelSize, y: y + (j + .5) * pixelSize}).beam;
    const index = (j * w + i) * 4;
    pixels.data[index] = color[0];
    pixels.data[index + 1] = color[1];
    pixels.data[index + 2] = color[2];
    pixels.data[index + 3] = Math.round(coverage * opacity * 255);
  }
  scratch.putImageData(pixels, 0, 0);
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(surface, x, y, w * pixelSize, h * pixelSize);
  } finally {
    ctx.restore();
  }
}
