import clipPolygon from './src/clipPolygon.mjs'


let pgs1
let pgs2
let r

pgs1 = 'not array'
pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4]]] //polygon
try {
    r = clipPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(r)
// => no pgs1

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = 'not array'
try {
    r = clipPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(r)
// => invalid pgs2

pgs1 = [[[0, 0], [1, 0], [1, 1], [0, 1]]] //polygon
pgs2 = []
r = clipPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[0,0],[1,0],[1,1],[0,1],[0,0]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4]]] //polygon
r = clipPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[2,4],[2,0],[0,0],[0,4],[2,4]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = [[[0, 0], [2, 0], [2, 2], [0, 2]]] //polygon
r = clipPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[4,4],[4,0],[2,0],[2,2],[0,2],[0,4],[4,4]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = [[[0, 0], [2, 2], [0, 4]]] //polygon
r = clipPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[4,4],[4,0],[0,0],[2,2],[0,4],[4,4]]]


//node g_clipPolygon.mjs
