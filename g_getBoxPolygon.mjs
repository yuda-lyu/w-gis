import getBoxPolygon from './src/getBoxPolygon.mjs'


let pgs
let r

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = getBoxPolygon(pgs)
console.log(r)
// => [ [ 0, 0 ], [ 100, 0 ], [ 100, 1 ], [ 0, 1 ], [ 0, 0 ] ]

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = getBoxPolygon(pgs)
console.log(r)
// => [ [ 0, 0 ], [ 100, 0 ], [ 100, 1 ], [ 0, 1 ], [ 0, 0 ] ]

pgs = [ //polygon
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ]
]
r = getBoxPolygon(pgs)
console.log(r)
// => [ [ 0, 0 ], [ 100, 0 ], [ 100, 1 ], [ 0, 1 ], [ 0, 0 ] ]

pgs = [ //polygon
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = getBoxPolygon(pgs)
console.log(r)
// => [ [ 0, 0 ], [ 10, 0 ], [ 10, 1 ], [ 0, 1 ], [ 0, 0 ] ]

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
r = getBoxPolygon(pgs)
console.log(r)
// => [ [ 0, 0 ], [ 100, 0 ], [ 100, 1 ], [ 0, 1 ], [ 0, 0 ] ]

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
        ],
        [
            [0, 0],
            [-10, 0],
            [-10, 123],
            [0, 1],
        ]
    ]
]
r = getBoxPolygon(pgs)
console.log(r)
// => [ [ -10, 0 ], [ 100, 0 ], [ 100, 123 ], [ -10, 123 ], [ -10, 0 ] ]


//node g_getBoxPolygon.mjs
