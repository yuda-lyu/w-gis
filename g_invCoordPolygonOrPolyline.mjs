import invCoordPolygonOrPolyline from './src/invCoordPolygonOrPolyline.mjs'


let pgs
let r

try {
    pgs = [[[ //multiPolygon
        [0.1, 0],
        [5.2, 1],
        [3.7, 2],
        [0.6, 3],
    ]]]
    r = invCoordPolygonOrPolyline(pgs)
}
catch (err) {
    r = err.message
}
console.log(JSON.stringify(r))
// => "invalid point depth[3]!=2"

pgs = [[ //polygon
    [0.1, 0],
    [5.2, 1],
    [3.7, 2],
    [0.6, 3],
]]
r = invCoordPolygonOrPolyline(pgs)
console.log(JSON.stringify(r))
// => [[[0,0.1],[1,5.2],[2,3.7],[3,0.6]]]

try {
    pgs = [ //ringString
        [0.1, 0],
        [5.2, 1],
        [3.7, 2],
        [0.6, 3],
    ]
    r = invCoordPolygonOrPolyline(pgs)
}
catch (err) {
    r = err.message
}
console.log(JSON.stringify(r))
// => "invalid point depth[1]!=2"


//node g_invCoordPolygonOrPolyline.mjs
