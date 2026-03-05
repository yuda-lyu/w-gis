import unionMultiPolygon from './src/unionMultiPolygon.mjs'


let pgs1
let pgs2
let r

pgs1 = 'not array'
pgs2 = [[[[2, 0], [4, 0], [4, 4], [2, 4]]]] //multiPolygon
try {
    r = unionMultiPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(r)
// => no pgs1

pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4]]]] //multiPolygon
pgs2 = 'not array'
try {
    r = unionMultiPolygon(pgs1, pgs2, {})
}
catch (err) {
    r = err.message
}
console.log(r)
// => invalid pgs2

pgs1 = [[[[0, 0], [1, 0], [1, 1], [0, 1]]]] //multiPolygon
pgs2 = []
r = unionMultiPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[[0,0],[1,0],[1,1],[0,1],[0,0]]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4]]] //polygon
r = unionMultiPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[[0,0],[4,0],[4,4],[0,4],[0,0]]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = [[[0, 0], [2, 0], [2, 2], [0, 2]]] //polygon
r = unionMultiPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[[0,0],[4,0],[4,4],[0,4],[0,0]]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = [[[0, 0], [2, 2], [0, 4]]] //polygon
r = unionMultiPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[[0,0],[4,0],[4,4],[0,4],[0,0]]]]

pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
pgs2 = [[[-1, 0], [2, 1], [-1, 4]]] //polygon
r = unionMultiPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[[-1,0],[0,0.3333333333333333],[0,0],[4,0],[4,4],[0,4],[0,3],[-1,4],[-1,0]]]]

pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4]]]] //multiPolygon
pgs2 = [[[[2, 0], [4, 0], [4, 4], [2, 4]]]] //multiPolygon
r = unionMultiPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[[0,0],[4,0],[4,4],[0,4],[0,0]]]]

pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4]]]] //multiPolygon
pgs2 = [[[[0, 0], [2, 0], [2, 2], [0, 2]]]] //multiPolygon
r = unionMultiPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[[0,0],[4,0],[4,4],[0,4],[0,0]]]]

pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4]]]] //multiPolygon
pgs2 = [[[[0, 0], [2, 2], [0, 4]]]] //multiPolygon
r = unionMultiPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[[0,0],[4,0],[4,4],[0,4],[0,0]]]]

pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4]]]] //multiPolygon
pgs2 = [[[[-1, 0], [2, 1], [-1, 4]]]] //multiPolygon
r = unionMultiPolygon(pgs1, pgs2, {})
console.log(JSON.stringify(r))
// => [[[[-1,0],[0,0.3333333333333333],[0,0],[4,0],[4,4],[0,4],[0,3],[-1,4],[-1,0]]]]


//node g_unionMultiPolygon.mjs
