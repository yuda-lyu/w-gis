import ptsXYZVtoArr from './src/ptsXYZVtoArr.mjs'


let ps
let r

ps = [[243, 206, 95, 2.2], [233, 225, 146, 15.1], [21, 325, 22, 7.9]]
r = ptsXYZVtoArr(ps)
console.log(r)
// => [
//   { x: 243, y: 206, z: 95, v: 2.2, ind: 0 },
//   { x: 233, y: 225, z: 146, v: 15.1, ind: 1 },
//   { x: 21, y: 325, z: 22, v: 7.9, ind: 2 }
// ]

ps = [{ 'x': 243, 'y': 206, 'z': 95, 'v': 2.2 }, { 'x': 233, 'y': 225, 'z': 146, 'v': 15.1 }, { 'x': 21, 'y': 325, 'z': 22, 'v': 7.9 }]
r = ptsXYZVtoArr(ps)
console.log(r)
// => [
//   { x: 243, y: 206, z: 95, v: 2.2, ind: 0 },
//   { x: 233, y: 225, z: 146, v: 15.1, ind: 1 },
//   { x: 21, y: 325, z: 22, v: 7.9, ind: 2 }
// ]

ps = [{ 'a': 243, 'b': 206, 'c': 95, 'd': 2.2 }, { 'a': 233, 'b': 225, 'c': 146, 'd': 15.1 }, { 'a': 21, 'b': 325, 'c': 22, 'd': 7.9 }]
r = ptsXYZVtoArr(ps, { keyX: 'a', keyY: 'b', keyZ: 'c', keyV: 'd' })
console.log(r)
// => [
//   { x: 243, y: 206, z: 95, v: 2.2, ind: 0 },
//   { x: 233, y: 225, z: 146, v: 15.1, ind: 1 },
//   { x: 21, y: 325, z: 22, v: 7.9, ind: 2 }
// ]


//node g_ptsXYZVtoArr.mjs
