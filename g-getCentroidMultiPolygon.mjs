import gis from './src/WGis.mjs'


let pg
let p

pg = [
    [0, 0],
    [100, 0],
    [1, 1],
    [0, 1],
    [0, 0], //閉合會影響形心值, turf問題
]
p = gis.getCentroidMultiPolygon(pg)
console.log(p)
// => [ 25.25, 0.5 ]

pg = [
    [0, 0],
    [100, 0],
    [1, 1],
    [0, 1],
]
p = gis.getCentroidMultiPolygon(pg)
console.log(p)
// => [ 33.666666666666664, 0.3333333333333333 ]


//node --experimental-modules --es-module-specifier-resolution=node g-getCentroidMultiPolygon.mjs
