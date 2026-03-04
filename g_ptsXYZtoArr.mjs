import ptsXYZtoArr from './src/ptsXYZtoArr.mjs'


let ps
let r

ps = [[243, 206, 95], [233, 225, 146], [21, 325, 22]]
r = ptsXYZtoArr(ps)
console.log(r)
// => [
//   { x: 243, y: 206, z: 95, ind: 0 },
//   { x: 233, y: 225, z: 146, ind: 1 },
//   { x: 21, y: 325, z: 22, ind: 2 }
// ]

ps = [{ 'x': 243, 'y': 206, 'z': 95 }, { 'x': 233, 'y': 225, 'z': 146 }, { 'x': 21, 'y': 325, 'z': 22 }]
r = ptsXYZtoArr(ps)
console.log(r)
// => [
//   { x: 243, y: 206, z: 95, ind: 0 },
//   { x: 233, y: 225, z: 146, ind: 1 },
//   { x: 21, y: 325, z: 22, ind: 2 }
// ]

ps = [{ 'a': 243, 'b': 206, 'c': 95 }, { 'a': 233, 'b': 225, 'c': 146 }, { 'a': 21, 'b': 325, 'c': 22 }]
r = ptsXYZtoArr(ps, { keyX: 'a', keyY: 'b', keyZ: 'c' })
console.log(r)
// => [
//   { x: 243, y: 206, z: 95, ind: 0 },
//   { x: 233, y: 225, z: 146, ind: 1 },
//   { x: 21, y: 325, z: 22, ind: 2 }
// ]


//node g_ptsXYZtoArr.mjs
