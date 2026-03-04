import ptsXYtoArr from './src/ptsXYtoArr.mjs'


let ps
let r

ps = [[243, 206], [233, 225], [21, 325]]
r = ptsXYtoArr(ps)
console.log(r)
// => [
//   { x: 243, y: 206, ind: 0 },
//   { x: 233, y: 225, ind: 1 },
//   { x: 21, y: 325, ind: 2 }
// ]

ps = [{ 'x': 243, 'y': 206 }, { 'x': 233, 'y': 225 }, { 'x': 21, 'y': 325 }]
r = ptsXYtoArr(ps)
console.log(r)
// => [
//   { x: 243, y: 206, ind: 0 },
//   { x: 233, y: 225, ind: 1 },
//   { x: 21, y: 325, ind: 2 }
// ]

ps = [{ 'a': 243, 'b': 206 }, { 'a': 233, 'b': 225 }, { 'a': 21, 'b': 325 }]
r = ptsXYtoArr(ps, { keyX: 'a', keyY: 'b' })
console.log(r)
// => [
//   { x: 243, y: 206, ind: 0 },
//   { x: 233, y: 225, ind: 1 },
//   { x: 21, y: 325, ind: 2 }
// ]


//node g_ptsXYtoArr.mjs
