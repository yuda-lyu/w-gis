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
- Natural neighbor interpolation is defined only for points surrounded by the source points; it does not extrapolate. The implementation normalizes the source points into a square (centered at the midpoint of the x and y ranges, side = the larger of the two ranges) and clips the Voronoi cells to that square.
- Query points outside the square always return `z: null`, and `funInterpFragment` / `funInterpFragments` are not called for them.
- `opt.limitInsideHull` (boolean, default `true`): query points must also lie inside the convex hull of the source points (boundary included, with a tolerance of 1e-9 of the square's side); otherwise `z` is `null` and the two callbacks are not called (the square check comes first). If there are fewer than 3 distinct source points, or all source points are collinear (no hull area; a hull whose width is at most 1e-9 of the square's side counts as collinear), every query point returns `z: null`, except a query point that coincides with a source point, which returns that point's `z`. Any value other than `true` / `false` is treated as not given (default `true`). Because callbacks are no longer called for points outside the hull, a stateful callback (one that depends on call count or order) sees fewer calls.
- `opt.limitInsideHull: false` also computes the query points that are outside the hull but inside the square. These are extrapolated values: they depend on the size of the square (the larger of the x and y ranges of the source points), so adding or removing a distant source point may change them. Not recommended.
- Even inside the hull, a query point whose Voronoi cell extends beyond the square (near the hull boundary where source points are sparse) has its cell clipped, so its value can differ from the unclipped theoretical value. This is independent of `opt.limitInsideHull` and the values inside the hull are unchanged by it.
- `interp2Kriging` (and `interp2` with `method: 'kriging'`) is not limited by the hull or the square; points outside are extrapolated.

## Breaking changes

### Next release
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
