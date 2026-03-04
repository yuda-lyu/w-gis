import getAreaMultiPolygonSm from './src/getAreaMultiPolygonSm.mjs'


let pgs
let r

pgs = [ //ringString
    [121, 23],
    [122, 23],
    [122, 24],
    [121, 24],
    [121, 23], //閉合
]
r = getAreaMultiPolygonSm(pgs)
console.log(r)
// => 11364090825.686134

pgs = [ //ringString
    [121, 23],
    [122, 23],
    [122, 24],
    [121, 24],
]
r = getAreaMultiPolygonSm(pgs)
console.log(r)
// => 11364090825.686134

pgs = [ //polygon
    [
        [121, 23],
        [122, 23],
        [122, 24],
        [121, 24],
    ]
]
r = getAreaMultiPolygonSm(pgs)
console.log(r)
// => 11364090825.686134

pgs = [ //polygon
    [
        [121, 23],
        [121.5, 23],
        [121.5, 24],
        [121, 24],
    ]
]
r = getAreaMultiPolygonSm(pgs)
console.log(r)
// => 5682045412.843067

pgs = [ //polygon
    [
        [121, 23],
        [122, 23],
        [122, 24],
        [121, 24],
    ],
    [
        [121, 23],
        [121.5, 23],
        [121.5, 24],
        [121, 24],
    ]
]
r = getAreaMultiPolygonSm(pgs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons故面積直接加總
console.log(r)
// => 17046136238.529202

pgs = [ //polygon
    [
        [121, 23],
        [122, 23],
        [122, 24],
        [121, 24],
    ],
    [
        [121, 23],
        [121.5, 23],
        [121.5, 24],
        [121, 24],
    ]
]
r = getAreaMultiPolygonSm(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings, 但turf計算時只取最後ringString計算面積
console.log(r)
// => 5682045412.843067

pgs = [ //multiPolygon
    [
        [
            [121, 23],
            [122, 23],
            [122, 24],
            [121, 24],
        ],
        [
            [121, 23],
            [121.5, 23],
            [121.5, 24],
            [121, 24],
        ]
    ]
]
r = getAreaMultiPolygonSm(pgs) //turf計算時只取最後ringString計算面積
console.log(r)
// => 5682045412.843067


//node g_getAreaMultiPolygonSm.mjs
