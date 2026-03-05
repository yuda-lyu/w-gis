import fixClosePolygon from './src/fixClosePolygon.mjs'


let pgs
let r

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = fixClosePolygon(pgs)
console.log(JSON.stringify(r))
// => [[[0,0],[100,0],[100,1],[0,1],[0,0]]]

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = fixClosePolygon(pgs)
console.log(JSON.stringify(r))
// => [[[0,0],[100,0],[100,1],[0,1],[0,0]]]

pgs = [ //polygon
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ]
]
r = fixClosePolygon(pgs)
console.log(JSON.stringify(r))
// => [[[0,0],[100,0],[100,1],[0,1],[0,0]]]

pgs = [ //polygon
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = fixClosePolygon(pgs)
console.log(JSON.stringify(r))
// => [[[0,0],[10,0],[10,1],[0,1],[0,0]]]

pgs = [ //polygon
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ],
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = fixClosePolygon(pgs)
console.log(JSON.stringify(r))
// => [[[0,0],[100,0],[100,1],[0,1],[0,0]],[[0,0],[10,0],[10,1],[0,1],[0,0]]]


//node g_fixClosePolygon.mjs
