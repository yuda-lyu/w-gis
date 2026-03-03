import findPointInKpBoxPolygons from './src/findPointInKpBoxPolygons.mjs'


let p
let kpPgs = {
    'pgs1': {
        box: { xmin: 0, ymin: 0, xmax: 1, ymax: 1 },
        pgs: [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
        ],
    }
}
let b

p = [0.5, 0.5]
b = findPointInKpBoxPolygons(p, kpPgs)
console.log(b)
// => 'pgs1'

p = [1.5, 0.5]
b = findPointInKpBoxPolygons(p, kpPgs)
console.log(b)
// => 'unknow'

p = [1.5, 0.5]
b = findPointInKpBoxPolygons(p, kpPgs, { def: '未知' })
console.log(b)
// => '未知'


//node g_findPointInKpBoxPolygons.mjs
