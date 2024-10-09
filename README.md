# w-gis
A tool for geotech analysis.

![language](https://img.shields.io/badge/language-JavaScript-orange.svg) 
[![npm version](http://img.shields.io/npm/v/w-gis.svg?style=flat)](https://npmjs.org/package/w-gis) 
[![license](https://img.shields.io/npm/l/w-gis.svg?style=flat)](https://npmjs.org/package/w-gis) 
[![npm download](https://img.shields.io/npm/dt/w-gis.svg)](https://npmjs.org/package/w-gis) 
[![npm download](https://img.shields.io/npm/dm/w-gis.svg)](https://npmjs.org/package/w-gis) 
[![jsdelivr download](https://img.shields.io/jsdelivr/npm/hm/w-gis.svg)](https://www.jsdelivr.com/package/npm/w-gis)

## Documentation
To view documentation or get support, visit [docs](https://yuda-lyu.github.io/w-gis/w-gis.html).

## Example
To view some examples for more understanding, visit examples:
> **convertCoordinate:** [ex-convertCoordinate.html](https://yuda-lyu.github.io/w-gis/examples/ex-convertCoordinate.html) [[source code](https://github.com/yuda-lyu/w-gis/blob/master/docs/examples/ex-convertCoordinate.html)]

> **getCentroidMultiPolygon:** [ex-getCentroidMultiPolygon.html](https://yuda-lyu.github.io/w-gis/examples/ex-getCentroidMultiPolygon.html) [[source code](https://github.com/yuda-lyu/w-gis/blob/master/docs/examples/ex-getCentroidMultiPolygon.html)]

> **getCenterOfMassMultiPolygon:** [ex-getCenterOfMassMultiPolygon.html](https://yuda-lyu.github.io/w-gis/examples/ex-getCenterOfMassMultiPolygon.html) [[source code](https://github.com/yuda-lyu/w-gis/blob/master/docs/examples/ex-getCenterOfMassMultiPolygon.html)]

## Installation
### Using npm(ES6 module):
> **Note:** w-gis is mainly dependent on `@turf`, `proj4`, `d3-tricontour`, `d3-delaunay`, `polybooljs`, `lodash-es` and `wsemi`.
```alias
npm i w-gis
```

### In a browser(UMD module):
> **Note:** w-gis does not dependent on any package.

Add script for w-gis.
```alias
<script src="https://cdn.jsdelivr.net/npm/w-gis@1.0.57/dist/w-gis.umd.js"></script>

```
