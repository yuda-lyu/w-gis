import splineMultiPolygon from './src/splineMultiPolygon.mjs'


let pgs
let r

pgs = [ //polygon
    [
        [0, 0],
        [2, 0],
        [2, 1],
        [0, 1],
    ]
]
r = splineMultiPolygon(pgs)
console.log(JSON.stringify(r).slice(0, 100))
// => [[[[0,0],[0.00009454879999999999,-5.976e-7],[0.0003771904,-0.0000023808],[0.0008464175999999999,-0.0

pgs = [ //polygon
    [
        [0, 0],
        [2, 0],
        [2, 1],
        [0, 1],
    ]
]
r = splineMultiPolygon(pgs, { resolution: 100 })
console.log(JSON.stringify(r).slice(0, 100))
// => [[[[0,0],[0.6968000000000001,-0.0036000000000000008],[1.7824000000000002,-0.0048000000000000004],[2.

pgs = [ //polygon
    [
        [0, 0],
        [2, 0],
        [2, 1],
        [0, 1],
    ]
]
r = splineMultiPolygon(pgs, { sharpness: 1 })
console.log(JSON.stringify(r).slice(0, 100))
// => [[[[0,0],[0.00007184,-0.000011952],[0.00028672,-0.000047616],[0.00064368,-0.000106704],[0.00114176,-

pgs = [ //polygon
    [
        [0, 0],
        [2, 0],
        [2, 1],
        [0, 1],
    ]
]
r = splineMultiPolygon(pgs, { sharpness: 0 })
console.log(JSON.stringify(r).slice(0, 100))
// => [[[[0,0],[0.00007542559999999999,-0.0000101592],[0.0003010048,-0.0000404736],[0.0006756911999999999,

pgs = [[ //multiPolygon
    [
        [0, 0],
        [2, 0],
        [2, 1],
        [0, 1],
    ]
]]
r = splineMultiPolygon(pgs)
console.log(JSON.stringify(r).slice(0, 100))
// => [[[[0,0],[0.00009454879999999999,-5.976e-7],[0.0003771904,-0.0000023808],[0.0008464175999999999,-0.0

pgs = [[ //multiPolygon
    [
        [0, 0],
        [2, 0],
        [2, 1],
        [0, 1],
    ]
]]
r = splineMultiPolygon(pgs, { resolution: 100 })
console.log(JSON.stringify(r).slice(0, 100))
// => [[[[0,0],[0.6968000000000001,-0.0036000000000000008],[1.7824000000000002,-0.0048000000000000004],[2.

pgs = [[ //multiPolygon
    [
        [0, 0],
        [2, 0],
        [2, 1],
        [0, 1],
    ]
]]
r = splineMultiPolygon(pgs, { sharpness: 1 })
console.log(JSON.stringify(r).slice(0, 100))
// => [[[[0,0],[0.00007184,-0.000011952],[0.00028672,-0.000047616],[0.00064368,-0.000106704],[0.00114176,-

pgs = [[ //multiPolygon
    [
        [0, 0],
        [2, 0],
        [2, 1],
        [0, 1],
    ]
]]
r = splineMultiPolygon(pgs, { sharpness: 0 })
console.log(JSON.stringify(r).slice(0, 100))
// => [[[[0,0],[0.00007542559999999999,-0.0000101592],[0.0003010048,-0.0000404736],[0.0006756911999999999,


//node g_splineMultiPolygon.mjs
