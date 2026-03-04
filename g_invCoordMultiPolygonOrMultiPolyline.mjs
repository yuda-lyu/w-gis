import invCoordMultiPolygonOrMultiPolyline from './src/invCoordMultiPolygonOrMultiPolyline.mjs'


let pgs
let r

pgs = [[[ //multiPolygon
    [0.1, 0],
    [5.2, 1],
    [3.7, 2],
    [0.6, 3],
]]]
r = invCoordMultiPolygonOrMultiPolyline(pgs)
console.log(JSON.stringify(r))
// => [[[[0,0.1],[1,5.2],[2,3.7],[3,0.6]]]]

try {
    pgs = [[ //polygon
        [0.1, 0],
        [5.2, 1],
        [3.7, 2],
        [0.6, 3],
    ]]
    r = invCoordMultiPolygonOrMultiPolyline(pgs)
}
catch (err) {
    r = err.message
}
console.log(JSON.stringify(r))
// => "invalid point depth[2]!=3"

try {
    pgs = [ //ringString
        [0.1, 0],
        [5.2, 1],
        [3.7, 2],
        [0.6, 3],
    ]
    r = invCoordMultiPolygonOrMultiPolyline(pgs)
}
catch (err) {
    r = err.message
}
console.log(JSON.stringify(r))
// => "invalid point depth[1]!=3"


//node g_invCoordMultiPolygonOrMultiPolyline.mjs
