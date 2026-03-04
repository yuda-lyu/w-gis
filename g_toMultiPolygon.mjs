import toMultiPolygon from './src/toMultiPolygon.mjs'


let rs
let r

rs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = toMultiPolygon(rs)
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1],[0,0]]]]

rs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = toMultiPolygon(rs)
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1]]]]

rs = [ //polygon
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ]
]
r = toMultiPolygon(rs)
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1]]]]

rs = [ //polygon
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = toMultiPolygon(rs)
console.log(JSON.stringify(r))
// => [[[[0,0],[10,0],[10,1],[0,1]]]]

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
r = toMultiPolygon(rs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1]]],[[[0,0],[10,0],[10,1],[0,1]]]]

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
r = toMultiPolygon(rs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1]],[[0,0],[10,0],[10,1],[0,1]]]]

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
r = toMultiPolygon(rs)
console.log(JSON.stringify(r))
// => [[[[0,0],[100,0],[100,1],[0,1]],[[0,0],[10,0],[10,1],[0,1]]]]


//node g_toMultiPolygon.mjs
