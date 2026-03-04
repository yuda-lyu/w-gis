import getCenterOfMassMultiPolygon from './src/getCenterOfMassMultiPolygon.mjs'


let pgs
let r

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = getCenterOfMassMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [50,0.5]

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = getCenterOfMassMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [50,0.5]

pgs = [ //polygon
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ]
]
r = getCenterOfMassMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [50,0.5]

pgs = [ //polygon
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = getCenterOfMassMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [5,0.5]

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
r = getCenterOfMassMultiPolygon(pgs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons
console.log(JSON.stringify(r))
// => [50,0.5] //非2個ringString共構的polygon質心, 僅計算第1個

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
r = getCenterOfMassMultiPolygon(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
console.log(JSON.stringify(r))
// => [50,0.5] //非第1個ringString剔除第2個ringString的質心, 僅計算第1個

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
r = getCenterOfMassMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [50,0.5] //非第1個ringString剔除第2個ringString的質心, 僅計算第1個


//node g_getCenterOfMassMultiPolygon.mjs
