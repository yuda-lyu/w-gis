import getPointDepth from './src/getPointDepth.mjs'


let p
let r

try {
    p = [[[[[1, 2.5], [1.1, 2.3]]]]]
    r = getPointDepth(p)
}
catch (err) {
    r = err.message
}
console.log(r)
// => invalid p[[[[[[1,2.5],[1.1,2.3]]]]]]

p = [[[[1, 2.5], [1.1, 2.3]]]]
r = getPointDepth(p)
console.log(r)
// => 3

p = [[[[1, 2.5]]]]
r = getPointDepth(p)
console.log(r)
// => 3

p = [[[1, 2.5]]]
r = getPointDepth(p)
console.log(r)
// => 2

p = [[1, 2.5]]
r = getPointDepth(p)
console.log(r)
// => 1

try {
    p = [{ x: 1, y: 2.5 }]
    r = getPointDepth(p)
}
catch (err) {
    r = err.message
}
console.log(r)
// => invalid p[[{"x":1,"y":2.5}]]


//node g_getPointDepth.mjs
