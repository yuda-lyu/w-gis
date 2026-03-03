import clipPolygon from './src/clipPolygon.mjs'


let pgs1
let pgs2
let r

pgs1 = 'not array'
pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]]
try {
    r = clipPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(r)
// => no pgs1

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]
pgs2 = 'not array'
try {
    r = clipPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(r)
// => invalid pgs2

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]
pgs2 = []
try {
    r = clipPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(JSON.stringify(r))
// => [[[0,0],[4,0],[4,4],[0,4],[0,0]]]

pgs1 = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]] // ringString(depth=1)
pgs2 = [[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]] // ringString(depth=1)
r = clipPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[2,4],[2,0],[0,0],[0,4]]]

pgs1 = [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]
pgs2 = [[[3, 0], [4, 0], [4, 1], [3, 1], [3, 0]]]
r = clipPolygon(pgs1, pgs2, { epsilon: 0.00000001 })
console.log(JSON.stringify(r))
// => [[[2,2],[2,0],[0,0],[0,2]]]


//node g_clipPolygon.mjs
