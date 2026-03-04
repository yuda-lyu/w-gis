import simplifyMultiPolygon from './src/simplifyMultiPolygon.mjs'


let pgs
let r

pgs = [ //polygon
    [
        [0, 0],
        [10, 0],
        [10, 0.9],
        [10, 1],
        [0, 1],
    ]
]
r = simplifyMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0],[10,0],[10,1],[0,1],[0,0]]]]

pgs = [ //polygon
    [
        [0, 0],
        [9.995, 0],
        [9.995, 0.995],
        [10, 1],
        [0, 1],
    ]
]
r = simplifyMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0],[9.995,0],[10,1],[0,1],[0,0]]]]

pgs = [ //polygon
    [
        [0, 0],
        [9.99, 0],
        [9.99, 0.99],
        [10, 1],
        [0, 1],
    ]
]
r = simplifyMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0],[9.99,0],[9.99,0.99],[10,1],[0,1],[0,0]]]]

pgs = [ //polygon
    [
        [0, 0],
        [9.99, 0],
        [9.99, 0.99],
        [10, 1],
        [0, 1],
    ]
]
r = simplifyMultiPolygon(pgs, { tolerance: 0.01 })
console.log(JSON.stringify(r))
// => [[[[0,0],[9.99,0],[10,1],[0,1],[0,0]]]]

pgs = [[ //multiPolygon
    [
        [0, 0],
        [10, 0],
        [10, 0.9],
        [10, 1],
        [0, 1],
    ]
]]
r = simplifyMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0],[10,0],[10,1],[0,1],[0,0]]]]

pgs = [[ //multiPolygon
    [
        [0, 0],
        [9.995, 0],
        [9.995, 0.995],
        [10, 1],
        [0, 1],
    ]
]]
r = simplifyMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0],[9.995,0],[10,1],[0,1],[0,0]]]]

pgs = [[ //multiPolygon
    [
        [0, 0],
        [9.99, 0],
        [9.99, 0.99],
        [10, 1],
        [0, 1],
    ]
]]
r = simplifyMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0],[9.99,0],[9.99,0.99],[10,1],[0,1],[0,0]]]]

pgs = [[ //multiPolygon
    [
        [0, 0],
        [9.99, 0],
        [9.99, 0.99],
        [10, 1],
        [0, 1],
    ]
]]
r = simplifyMultiPolygon(pgs, { tolerance: 0.01 })
console.log(JSON.stringify(r))
// => [[[[0,0],[9.99,0],[10,1],[0,1],[0,0]]]]


//node g_simplifyMultiPolygon.mjs
