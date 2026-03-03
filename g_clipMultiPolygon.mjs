import clipMultiPolygon from './src/clipMultiPolygon.mjs'


let pgs1
let pgs2
let r

pgs1 = 'not array'
pgs2 = [[[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]]]
try {
    r = clipMultiPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(r)
// => no pgs1

pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
pgs2 = 'not array'
try {
    r = clipMultiPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(r)
// => invalid pgs2

pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
pgs2 = []
try {
    r = clipMultiPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(JSON.stringify(r))
// => [[[[0,0],[4,0],[4,4],[0,4],[0,0]]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]] // polygon(depth=2)
pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]] // polygon(depth=2)
r = clipMultiPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[[0,0],[2,0],[2,4],[0,4],[0,0]]]]

pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
pgs2 = [[[[5, 0], [6, 0], [6, 1], [5, 1], [5, 0]]]]
r = clipMultiPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[[0,0],[4,0],[4,4],[0,4],[0,0]]]]


//node g_clipMultiPolygon.mjs
