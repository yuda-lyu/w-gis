import ptsXtoArr from './src/ptsXtoArr.mjs'


let ps
let r

ps = [[243], [233], [21]]
r = ptsXtoArr(ps)
console.log(r)
// => [
//   { x: 243, ind: 0 },
//   { x: 233, ind: 1 },
//   { x: 21, ind: 2 }
// ]

ps = [{ 'x': 243 }, { 'x': 233 }, { 'x': 21 }]
r = ptsXtoArr(ps)
console.log(r)
// => [
//   { x: 243, ind: 0 },
//   { x: 233, ind: 1 },
//   { x: 21, ind: 2 }
// ]

ps = [{ 'a': 243 }, { 'a': 233 }, { 'a': 21 }]
r = ptsXtoArr(ps, { keyX: 'a' })
console.log(r)
// => [
//   { x: 243, ind: 0 },
//   { x: 233, ind: 1 },
//   { x: 21, ind: 2 }
// ]


//node g_ptsXtoArr.mjs
