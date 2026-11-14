# w-gis
A tool for geotech analysis.

![language](https://img.shields.io/badge/language-JavaScript-orange.svg) 
[![npm version](http://img.shields.io/npm/v/w-gis.svg?style=flat)](https://npmjs.org/package/w-gis) 
[![license](https://img.shields.io/npm/l/w-gis.svg?style=flat)](https://npmjs.org/package/w-gis) 
[![npm download](https://img.shields.io/npm/dt/w-gis.svg)](https://npmjs.org/package/w-gis) 
[![npm download](https://img.shields.io/npm/dm/w-gis.svg)](https://npmjs.org/package/w-gis) 
[![jsdelivr download](https://img.shields.io/jsdelivr/npm/hm/w-gis.svg)](https://www.jsdelivr.com/package/npm/w-gis)

## Statement

This project is forked and adapted from the following open-source project:

- Forked from [kriging.js](https://github.com/oeo4b/kriging.js) by oeo4b

The original project is licensed under the MIT License, and this project is also distributed under the MIT License.

Special thanks to the original author for their valuable contribution, which made this project possible. 🙏

## Documentation
To view documentation or get support, visit [docs](https://yuda-lyu.github.io/w-gis/w-gis.html).

## Notes

### Interpolation range of `interp2NaturalNeighbor` (also `interp2` with `method: 'naturalNeighbor'`)
- Inside the convex hull of the source points the weights are Sibson's natural neighbor coordinates (unclipped Voronoi cells), computed with the Liang & Hale (2010) algorithm on a Delaunay triangulation built once (delaunator) and checked with robust predicates (robust-predicates). The internal coordinates are an exact (non-rounding) power-of-two scaling and, only when the subtraction is exact, a translation of the input coordinates, so the triangulation and the weights are those of the input coordinates themselves.
- Each point is checked (finite weights, a single closed cavity boundary, no negative areas beyond 1e-12 of the total, local-coordinate deviation |Σ w_i (p_i − x)| at most 1e-12 of the local scale Σ w_i |p_i − x|, and a condition estimate 8·ε·Σ(circumradius² of the conflict triangles)/area at most 1e-12). If the floating-point areas fail (for example when the query point lies between two very close source points, or the source points form an extremely thin strip), the point is recomputed with exact rational (BigInt) arithmetic (`method: 'sibsonExact'`). A point that still fails (or that needs the exact path in an environment without BigInt) returns `z: null` and is reported through `opt.funInterpError({ indTar, x, y, reason })`; without that callback a single `console.warn` gives the number of points and the reason codes only.
- On a hull edge, or outside the hull with a (Euclidean) distance to the hull of at most 1e-9 of the side of the normalized square, the two endpoints of the nearest hull edge are interpolated linearly (`method: 'hullEdge'`; 1.1.27 measured the tolerance against each edge's supporting line, which accepted points far beyond very acute hull corners); this is the limit of the Sibson weights on the hull edge, so values are continuous across the hull. This does not depend on `opt.limitInsideHull`.
- `opt.limitInsideHull` (boolean, default `true`): query points farther outside the hull return `z: null`, and `funInterpFragment` / `funInterpFragments` are not called for them. With `false` they are projected onto the nearest hull edge and the two endpoints of that edge are interpolated linearly (`method: 'projection'`, an extrapolation that depends only on that edge; the normalized square no longer limits anything). Any value other than `true` / `false` is treated as not given (default `true`).
- With fewer than 3 distinct source points, or all source points collinear (hull width at most 1e-9 of the square's side), every query point returns `z: null` by default, except a query point that coincides with a source point; with `opt.limitInsideHull: false` the values are interpolated linearly along the line of the source points (`method: 'line'`).
- A query point equal to a source point gets that point's `z` (weight 1, `method: 'vertex'`) and the callbacks are called; duplicate query points are each computed and each calls the callbacks; among duplicate source points the last one is used. The `ps` passed to `funInterpFragments` lists only the source points with a weight greater than 0; for the linear methods `area` equals `areaRatio` and `areaTotal` is 1.
- `interp2Kriging` (and `interp2` with `method: 'kriging'`) is not limited by the hull; points outside are extrapolated by kriging.

## Breaking changes

### Next release
- `interp2NaturalNeighbor` and `interp2` (`method: 'naturalNeighbor'`) now compute exact Sibson weights inside the hull. Previous versions rebuilt the triangulation for every query point, clipped the Voronoi cells to the normalized square, and computed cell overlaps with polygon intersection whose failures were silently replaced by rescaling the other overlaps; near the hull boundary, around clusters of very close source points, and wherever an intersection failed, weights were wrong (by up to almost 1). All values inside the hull change: most only in the last digits, the wrong ones to the correct value. Linear data are now reproduced exactly (up to rounding).
- `opt.limitInsideHull: false`: points outside the hull are projected onto the nearest hull edge (linear between its two endpoints) instead of the previous square-dependent extrapolation; points outside the normalized square now get a value instead of `null`. Points on a hull edge or within the tolerance outside it use the two edge endpoints linearly regardless of the option.
- With fewer than 3 distinct source points or collinear source points and `opt.limitInsideHull: false`, values are interpolated linearly along the line instead of the previous by-products of the degenerate case.
- A query point equal to a source point now calls `funInterpFragment` / `funInterpFragments` (previously the cached value was returned without calling them), and duplicate query points each call the callbacks. The callback messages gain `method`; `ps` lists only source points with a weight greater than 0.
- New option `opt.funInterpError`; points that cannot be computed return `z: null` (previously some failures produced numbers). `opt.scale` no longer affects the weights or which points can be interpolated (it only scales the normalized `z` and areas passed to the callbacks); a non-positive or non-finite `opt.scale` is treated as not given (previously `0` or negative values threw).
- If `funInterpFragment` / `funInterpFragments` return a non-finite value (`NaN`, `Infinity`, `null`, a string), that point returns `z: null` (previously `NaN` / `Infinity` were returned, or `null` was summed as 0).
- Query points extremely far outside the hull (coordinates beyond about 1e100 times the data extent) are no longer reported as errors; they return `null` (default) or the projection onto the hull.
- New dependencies: `delaunator` and `robust-predicates`.

### 1.1.27
- `interp2NaturalNeighbor` and `interp2` (`method: 'naturalNeighbor'`): the new `opt.limitInsideHull` defaults to `true`. Query points outside the convex hull of the source points but inside the normalized square used to return an extrapolated number; they now return `z: null`, and `funInterpFragment` / `funInterpFragments` are no longer called for them. Pass `{ limitInsideHull: false }` to get the previous values. Values of query points inside the hull (boundary included) and outside the square are unchanged.
- With fewer than 3 distinct source points, or all source points collinear (such input has no 2-D triangulation), query points (other than those coinciding with a source point) used to return numbers that were by-products of the numerical handling of the degenerate case (for a single distinct point only when the query coordinates fell inside `[0, scale]`); they now return `z: null` by default (`{ limitInsideHull: false }` restores the previous values).
- Callbacks (`funInterpFragment` / `funInterpFragments`) are no longer called for query points outside the hull, so a stateful callback sees fewer calls.

## Example
To view some examples for more understanding, visit examples:
> **convertCoordinate:** [ex-convertCoordinate.html](https://yuda-lyu.github.io/w-gis/examples/ex-convertCoordinate.html) [[source code](https://github.com/yuda-lyu/w-gis/blob/master/docs/examples/ex-convertCoordinate.html)]

> **getCentroidMultiPolygon:** [ex-getCentroidMultiPolygon.html](https://yuda-lyu.github.io/w-gis/examples/ex-getCentroidMultiPolygon.html) [[source code](https://github.com/yuda-lyu/w-gis/blob/master/docs/examples/ex-getCentroidMultiPolygon.html)]

> **getCenterOfMassMultiPolygon:** [ex-getCenterOfMassMultiPolygon.html](https://yuda-lyu.github.io/w-gis/examples/ex-getCenterOfMassMultiPolygon.html) [[source code](https://github.com/yuda-lyu/w-gis/blob/master/docs/examples/ex-getCenterOfMassMultiPolygon.html)]

## Installation

### Using npm(ES6 module):
```alias
npm i w-gis
```

> **Note:** In Node.js ES modules, import the main entry with the default import, e.g. `import gis from 'w-gis'`; named imports from the main entry (a UMD bundle) are not supported. Functions can also be imported one by one, e.g. `import calcContours from 'w-gis/src/calcContours.mjs'`.

### In a browser(UMD module):

Add script for w-gis.
```alias
<script src="https://yuda-lyu.github.io/w-gis/dist/w-gis.umd.js"></script>

```
