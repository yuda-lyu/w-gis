import getAreaPolygon from './src/getAreaPolygon.mjs'


let pg
let r

pg = [
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = getAreaPolygon(pg)
console.log(r)
// => 100

pg = [
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = getAreaPolygon(pg)
console.log(r)
// => 100

pg = [
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ]
]
r = getAreaPolygon(pg)
console.log(r)
// => 100

pg = [
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = getAreaPolygon(pg)
console.log(r)
// => 10

pg = [
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
r = getAreaPolygon(pg)
console.log(r)
// => 90

pg = [
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ],
    [ //第 2 RingString 與第 1 RingString 不重疊, 但polygon第1個為主要區, 其後為剔除區, 此為有問題多邊形
        [200, 0],
        [210, 0],
        [210, 1],
        [200, 1],
    ]
]
r = getAreaPolygon(pg)
console.log(r)
// => 90, 實際為110


//node g_getAreaPolygon.mjs
