import toPolygon from './src/toPolygon.mjs'


let rs
let r

rs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = toPolygon(rs)
console.log(JSON.stringify(r))
// => [[[0,0],[100,0],[100,1],[0,1],[0,0]]]

rs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = toPolygon(rs)
console.log(JSON.stringify(r))
// => [[[0,0],[100,0],[100,1],[0,1]]]

rs = [ //polygon
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ]
]
r = toPolygon(rs)
console.log(JSON.stringify(r))
// => [[[0,0],[100,0],[100,1],[0,1]]]

rs = [ //polygon
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = toPolygon(rs)
console.log(JSON.stringify(r))
// => [[[0,0],[10,0],[10,1],[0,1]]]

rs = [ //polygon
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
r = toPolygon(rs)
console.log(JSON.stringify(r))
// => [[[0,0],[100,0],[100,1],[0,1]],[[0,0],[10,0],[10,1],[0,1]]]

rs = [ //multiPolygon
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
r = toPolygon(rs)
console.log(JSON.stringify(r))
// => [[[0,0],[100,0],[100,1],[0,1]],[[0,0],[10,0],[10,1],[0,1]]]


//node g_toPolygon.mjs
