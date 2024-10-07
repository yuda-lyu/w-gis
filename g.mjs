import b642u8arr from 'wsemi/src/b642u8arr.mjs'
import buildFindPointInTif from './src/buildFindPointInTif.mjs'

let p
let r

let b64Tif = `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`
let u8a = b642u8arr(b64Tif)
// lon 121.51338 121.51847
// lat 25.046 25.05

let BD = buildFindPointInTif
let bd = new BD()
await bd.init(u8a)

p = [121.51353, 25.04987]
r = await bd.getPoint(p)
console.log(r)
// => 3.1814956665039062

p = [121.51835, 25.04608]
r = await bd.getPoint(p)
console.log(r)
// => 2.9800331592559814

p = [121.51353, 25.05016]
r = await bd.getPoint(p)
console.log(r)
// => 'unknow'

p = [121.51353, 25.05016]
r = await bd.getPoint(p, { def: '未知' })
console.log(r)
// => '未知'


//node --experimental-modules g.mjs
