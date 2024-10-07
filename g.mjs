import buildFindPointInKpBoxPolygons from './src/buildFindPointInKpBoxPolygons.mjs'


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

let BD = buildFindPointInKpBoxPolygons
let bd = new BD()
await bd.add('pgs1', kpPgs['pgs1'])
await bd.add('pgs2', kpPgs['pgs2'])

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


//node --experimental-modules g.mjs
