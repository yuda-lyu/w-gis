import getAreaMultiPolygon from './src/getAreaMultiPolygon.mjs'


let pgs
let r

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = getAreaMultiPolygon(pgs)
console.log(r)
// => 100

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = getAreaMultiPolygon(pgs)
console.log(r)
// => 100

pgs = [ //polygon
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ]
]
r = getAreaMultiPolygon(pgs)
console.log(r)
// => 100

pgs = [ //polygon
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = getAreaMultiPolygon(pgs)
console.log(r)
// => 10

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
r = getAreaMultiPolygon(pgs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons故面積直接加總
console.log(r)
// => 110

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
r = getAreaMultiPolygon(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
console.log(r)
// => 90

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
r = getAreaMultiPolygon(pgs)
console.log(r)
// => 90


//node g_getAreaMultiPolygon.mjs
