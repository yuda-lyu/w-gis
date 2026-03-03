import buildFindPointInKpPolygons from './src/buildFindPointInKpPolygons.mjs'

let kpPgs = {
    'pgs1': [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
    ],
    'pgs2': [
        [1, 1],
        [1, 2],
        [2, 2],
        [2, 1],
        [1, 1],
    ],
}
let p
let r

let BD = buildFindPointInKpPolygons
let bd = new BD()
await bd.init(kpPgs)

p = [0.5, 0.5]
r = await bd.getPoint(p)
console.log(r)
// => 'pgs1'

p = [1.5, 1.5]
r = await bd.getPoint(p)
console.log(r)
// => 'pgs2'

p = [1.5, 0.5]
r = await bd.getPoint(p)
console.log(r)
// => 'unknow'

p = [1.5, 0.5]
r = await bd.getPoint(p, { def: '未知' })
console.log(r)
// => '未知'


//node g_buildFindPointInKpPolygons.mjs
