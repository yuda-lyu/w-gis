import toMultiPoint from './src/toMultiPoint.mjs'


let pgs
let r

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = toMultiPoint(pgs)
console.log(JSON.stringify(r))
// => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[100,0],[100,1],[0,1],[0,0]]}}

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = toMultiPoint(pgs)
console.log(JSON.stringify(r))
// => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[100,0],[100,1],[0,1]]}}

pgs = [ //polygon
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ]
]
r = toMultiPoint(pgs)
console.log(JSON.stringify(r))
// => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[100,0],[100,1],[0,1]]}}

pgs = [ //polygon
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = toMultiPoint(pgs)
console.log(JSON.stringify(r))
// => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[10,0],[10,1],[0,1]]}}

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
r = toMultiPoint(pgs)
console.log(JSON.stringify(r))
// => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[100,0],[100,1],[0,1],[0,0],[10,0],[10,1],[0,1]]}}

pgs = [ //multiPolygon
    [
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
]
r = toMultiPoint(pgs)
console.log(JSON.stringify(r))
// => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[100,0],[100,1],[0,1],[0,0],[10,0],[10,1],[0,1]]}}


//node g_toMultiPoint.mjs
