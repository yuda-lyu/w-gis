import flattenMultiPolygon from './src/flattenMultiPolygon.mjs'


let pgs
let r

pgs = 'not array'
try {
    r = flattenMultiPolygon(pgs, {})
}
catch (err) {
    r = err.message
}
console.log(r)
// => no pgs

pgs = [ //polygon
    [[0, 0], [4, 0], [4, 4], [0, 4]],
    [[2, 0], [4, 0], [4, 4], [2, 4]],
]
r = flattenMultiPolygon(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
console.log(JSON.stringify(r))
// => [[[[2,4],[2,0],[0,0],[0,4],[2,4]]]]

pgs = [ //polygon
    [[0, 0], [4, 0], [4, 4], [0, 4]],
    [[0, 0], [2, 0], [2, 2], [0, 2]],
]
r = flattenMultiPolygon(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
console.log(JSON.stringify(r))
// => [[[[4,4],[4,0],[2,0],[2,2],[0,2],[0,4],[4,4]]]]

pgs = [ //polygon
    [[0, 0], [4, 0], [4, 4], [0, 4]],
    [[0, 0], [2, 2], [0, 4]],
]
r = flattenMultiPolygon(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
console.log(JSON.stringify(r))
// => [[[[4,4],[4,0],[0,0],[2,2],[0,4],[4,4]]]]

pgs = [[ //multiPolygon
    [[0, 0], [4, 0], [4, 4], [0, 4]],
    [[2, 0], [4, 0], [4, 4], [2, 4]],
]]
r = flattenMultiPolygon(pgs, {})
console.log(JSON.stringify(r))
// => [[[[2,4],[2,0],[0,0],[0,4],[2,4]]]]

pgs = [[ //multiPolygon
    [[0, 0], [4, 0], [4, 4], [0, 4]],
    [[0, 0], [2, 0], [2, 2], [0, 2]],
]]
r = flattenMultiPolygon(pgs, {})
console.log(JSON.stringify(r))
// => [[[[4,4],[4,0],[2,0],[2,2],[0,2],[0,4],[4,4]]]]

pgs = [[ //multiPolygon
    [[0, 0], [4, 0], [4, 4], [0, 4]],
    [[0, 0], [2, 2], [0, 4]],
]]
r = flattenMultiPolygon(pgs, {})
console.log(JSON.stringify(r))
// => [[[[4,4],[4,0],[0,0],[2,2],[0,4],[4,4]]]]


//node g_flattenMultiPolygon.mjs
