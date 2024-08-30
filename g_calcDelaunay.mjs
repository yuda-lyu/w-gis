import calcDelaunay from './src/calcDelaunay.mjs'


let ps
let o
let r

ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }]
r = calcDelaunay(ps)
console.log(r)
// => {
//   triangles: [
//     { n0: 5, n1: 9, n2: 3 },
//     { n0: 9, n1: 4, n2: 3 },
//     { n0: 9, n1: 8, n2: 4 },
//     { n0: 4, n1: 8, n2: 3 },
//     { n0: 5, n1: 7, n2: 9 },
//     { n0: 9, n1: 7, n2: 8 },
//     { n0: 0, n1: 7, n2: 5 },
//     { n0: 6, n1: 0, n2: 5 },
//     { n0: 0, n1: 1, n2: 7 },
//     { n0: 3, n1: 6, n2: 5 }
//   ]
// }

ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }]
o = calcDelaunay(ps, { withFinder: true })
r = o.funFindIn({ x: 1151, y: 371 })
console.log(r)
// => 8
r = o.funFindIn({ x: 1071, y: 371 }, { returnPoint: true })
console.log(r)
// => { x: 1151, y: 371, ext: 'abc' }
r = o.funFindIn({ x: 1061, y: 371 })
console.log(r)
// => 4

//node --experimental-modules g_calcDelaunay.mjs
