import isPointInPolygons from './src/isPointInPolygons.mjs'


let p
let pgs
let b

p = [0.5, 0.5]
pgs = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
]
b = isPointInPolygons(p, pgs)
console.log(b)
// => true

p = [1.5, 0.5]
pgs = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
]
b = isPointInPolygons(p, pgs)
console.log(b)
// => false


//node g_isPointInPolygons.mjs
