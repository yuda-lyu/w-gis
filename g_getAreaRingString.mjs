import getAreaRingString from './src/getAreaRingString.mjs'


let rs
let r

rs = [
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = getAreaRingString(rs)
console.log(r)
// => 100

rs = [
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = getAreaRingString(rs)
console.log(r)
// => 100

rs = [
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ]
]
r = getAreaRingString(rs)
console.log(r)
// => 0


//node g_getAreaRingString.mjs
