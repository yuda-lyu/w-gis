import intersectPolygon from './src/intersectPolygon.mjs'


let pgs1
let pgs2
let r

pgs1 = 'not array'
pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4]]] //polygon
try {
    r = intersectPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(r)
// => no pgs1

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = 'not array'
try {
    r = intersectPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(r)
// => invalid pgs2

pgs1 = [[[0, 0], [1, 0], [1, 1], [0, 1]]] //polygon
pgs2 = []
r = intersectPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[0,0],[1,0],[1,1],[0,1],[0,0]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4]]] //polygon
r = intersectPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[4,4],[4,0],[2,0],[2,4],[4,4]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = [[[0, 0], [2, 0], [2, 2], [0, 2]]] //polygon
r = intersectPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[2,2],[2,0],[0,0],[0,2],[2,2]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = [[[0, 0], [2, 2], [0, 4]]] //polygon
r = intersectPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[2,2],[0,0],[0,4],[2,2]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = [[[-1, 0], [2, 1], [-1, 4]]] //polygon
r = intersectPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[2,1],[0,0.3333333333333333],[0,3],[2,1]]]


//node g_intersectPolygon.mjs
