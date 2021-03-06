import gis from './src/WGis.mjs'


let pg
let p

pg = [
    [0, 0],
    [100, 0],
    [1, 1],
    [0, 1],
    [0, 0], //閉合不會影響質心值
]
p = gis.getCenterOfMassMultiPolygon(pg)
console.log(p)
// => [ 33.336633663366335, 0.3366336633663366 ]

pg = [
    [0, 0],
    [100, 0],
    [1, 1],
    [0, 1],
]
p = gis.getCenterOfMassMultiPolygon(pg)
console.log(p)
// => [ 33.336633663366335, 0.3366336633663366 ]


//node --experimental-modules --es-module-specifier-resolution=node g-getCenterOfMassMultiPolygon.mjs
