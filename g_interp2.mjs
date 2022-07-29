import interp2 from './src/interp2.mjs'


let ps = [{ 'x': 243, 'y': 206, 'z': 95 }, { 'x': 233, 'y': 225, 'z': 146 }, { 'x': 21, 'y': 325, 'z': 22 }, { 'x': 953, 'y': 28, 'z': 223 }, { 'x': 1092, 'y': 290, 'z': 39 }, { 'x': 744, 'y': 200, 'z': 191 }, { 'x': 174, 'y': 3, 'z': 22 }, { 'x': 537, 'y': 368, 'z': 249 }, { 'x': 1151, 'y': 371, 'z': 86 }, { 'x': 814, 'y': 252, 'z': 125 }]
let p
let r

p = {
    x: 243,
    y: 205,
}
r = interp2(ps, p)
console.log(r)
// => { x: 243, y: 205, z: 94.93541171916787 }

p = {
    x: 283,
    y: 205,
}
r = interp2(ps, p)
console.log(r)
// => { x: 283, y: 205, z: 115.17591167501384 }

p = {
    x: 1160,
    y: 380,
}
r = interp2(ps, p)
console.log(r)
// => { x: 1160, y: 380, z: null }


//node --experimental-modules --es-module-specifier-resolution=node g_interp2.mjs
