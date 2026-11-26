import geojsonToMultiPolygon from './src/geojsonToMultiPolygon.mjs'
import isPointInPolygons from './src/isPointInPolygons.mjs'


let geojson
let r

geojson = { //polygon含1內環
    type: 'Polygon',
    coordinates: [
        [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
        [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
    ],
}
r = geojsonToMultiPolygon(geojson)
console.log(JSON.stringify(r))
// => [[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[4,4],[6,4],[6,6],[4,6],[4,4]]]]

console.log(isPointInPolygons([5, 5], r), isPointInPolygons([2, 2], r)) //洞內點與洞外點
// => false true

geojson = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
        { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: [[[[2, 0], [3, 0], [3, 1], [2, 0]]]] } },
        { type: 'Feature', properties: {}, geometry: null },
    ],
}
r = geojsonToMultiPolygon(geojson)
console.log(JSON.stringify(r))
// => [[[[0,0],[1,0],[1,1],[0,0]]],[[[2,0],[3,0],[3,1],[2,0]]]]

geojson = { type: 'Point', coordinates: [1, 1] }
try {
    r = geojsonToMultiPolygon(geojson)
}
catch (err) {
    r = err.message
}
console.log(r)
// => invalid geojson: must be Polygon or MultiPolygon (use opt.nonAreal 'skip' to skip Point, MultiPoint, LineString and MultiLineString)

r = geojsonToMultiPolygon(geojson, { nonAreal: 'skip' })
console.log(JSON.stringify(r))
// => []


//node g_geojsonToMultiPolygon.mjs
