import getCentroidMultiPolygon from './src/getCentroidMultiPolygon.mjs'


let pgs
let r

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = getCentroidMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [50,0.5]

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = getCentroidMultiPolygon(pgs)
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
r = getCentroidMultiPolygon(pgs)
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
r = getCentroidMultiPolygon(pgs)
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
r = getCentroidMultiPolygon(pgs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons
console.log(JSON.stringify(r))
// => [27.5,0.5] //非2個ringString共構的polygon形心
console.log('(50*10+5*1)/11', (50 * 10 + 5 * 1) / 11)
// => (50*10+5*1)/11 45.90909090909091

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
r = getCentroidMultiPolygon(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
console.log(JSON.stringify(r))
// => [27.5,0.5] //非第1個ringString剔除第2個ringString的形心

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
r = getCentroidMultiPolygon(pgs)
console.log(JSON.stringify(r))
// => [27.5,0.5] //非第1個ringString剔除第2個ringString的形心


//node g_getCentroidMultiPolygon.mjs
