import findPointInKpPolygons from './src/findPointInKpPolygons.mjs'


let p
let kpPgs = {
    'pgs1': [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
    ],
}
let b

p = [0.5, 0.5]
b = findPointInKpPolygons(p, kpPgs)
console.log(b)
// => 'pgs1'

p = [1.5, 0.5]
b = findPointInKpPolygons(p, kpPgs)
console.log(b)
// => 'unknow'

p = [1.5, 0.5]
b = findPointInKpPolygons(p, kpPgs, { def: '未知' })
console.log(b)
// => '未知'


//node g_findPointInKpPolygons.mjs
