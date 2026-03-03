import fixCloseMultiPolygon from './src/fixCloseMultiPolygon.mjs'


let pgs
let r

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = fixCloseMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1],[0,0]]]]

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = fixCloseMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1],[0,0]]]]

pgs = [ //polygon
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ]
]
r = fixCloseMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1],[0,0]]]]

pgs = [ //polygon
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = fixCloseMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0],[10,0],[10,1],[0,1],[0,0]]]]

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
r = fixCloseMultiPolygon(pgs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1],[0,0]]],[[[0,0],[10,0],[10,1],[0,1],[0,0]]]]

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
r = fixCloseMultiPolygon(pgs, { supposeType: 'ringStrings' }) //polygon轉multiPolygon使用ringStrings
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1],[0,0]],[[0,0],[10,0],[10,1],[0,1],[0,0]]]]

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
r = fixCloseMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1],[0,0]],[[0,0],[10,0],[10,1],[0,1],[0,0]]]]


//node g_fixCloseMultiPolygon.mjs
