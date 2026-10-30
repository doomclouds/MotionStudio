/** Candidate recipe, not promoted shared UI asset. Output circle AREA scales with value.
 * k is an authored display scale, not a distance/uncertainty radius. */
export function areaRadius(value,k=2.6){if(!Number.isFinite(value)||value<0)throw new RangeError('value must be finite and nonnegative');if(!Number.isFinite(k)||k<=0)throw new RangeError('k must be finite and positive');const r=Math.sqrt(value)*k;if(!Number.isFinite(r))throw new RangeError('scaled radius must be finite');return r;}
